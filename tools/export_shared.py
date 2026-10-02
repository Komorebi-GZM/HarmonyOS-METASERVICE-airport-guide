#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把 ArkTS 端的「单一真源」导出成平台无关的共享核心数据（TypeScript）。

为什么需要它：
  harmony_app 是 ArkTS 工程，Web / 微信小程序 / Swift 都读不了 .ets。
  但地图数据、双语文案、配色令牌、类型标签这些**事实**只应该有一份。
  所以本脚本只做「翻译」，不做「创作」——所有内容都从下面这些文件里抽：

    真源                                        产物
    data/XHA_xinghai_t1.map.json          ->    packages/core/src/generated/map-data.ts
    harmony_app/.../model/Loc.ets         ->    packages/core/src/generated/i18n-data.ts
    harmony_app/.../model/Localization.ets->    packages/core/src/generated/labels.ts
    harmony_app/.../ui/Theme.ets          ->    packages/core/src/generated/tokens.ts
    tools/gen_model.py (NAME_EN/FLOOR_EN) ->    上面 labels.ts 的 NODE_EN / FLOOR_LABELS_EN

用法：python3 tools/export_shared.py
"""

import hashlib
import importlib.util
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ETS = os.path.join(ROOT, "harmony_app", "entry", "src", "main", "ets")
OUT_DIR = os.path.join(ROOT, "packages", "core", "src", "generated")
MAP_JSON = os.path.join(ROOT, "data", "XHA_xinghai_t1.map.json")

BANNER = """// ============================================================
// 本文件由 tools/export_shared.py 自动生成，请勿手改。
// 真源：{source}
// 重新生成：python3 tools/export_shared.py
// ============================================================
"""


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def write(rel, source, body):
    path = os.path.join(OUT_DIR, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(BANNER.format(source=source))
        f.write(body)
    print(f"  写出 {os.path.relpath(path, ROOT)}  ({len(body)} 字节)")


def ts_string(value):
    return json.dumps(value, ensure_ascii=False)


# ---------------------------------------------------------------- Theme.ets
def palette(text, name):
    """抽出 `export const NAME: XxxPalette = { a: '#fff', ... };`"""
    m = re.search(r"export const %s: \w+ = \{([^}]*)\};" % name, text)
    if not m:
        raise SystemExit(f"Theme.ets 里找不到调色板 {name}")
    out = []
    for key, value in re.findall(r"(\w+)\s*:\s*'(#[0-9A-Fa-f]{3,8})'", m.group(1)):
        out.append((key, value))
    if not out:
        raise SystemExit(f"调色板 {name} 解析为空")
    return out


def export_tokens():
    text = read(os.path.join(ETS, "ui", "Theme.ets"))
    lines = []
    for name in ("APP", "MAP", "ROUTE"):
        pairs = palette(text, name)
        lines.append("export const %s = {" % name)
        for key, value in pairs:
            lines.append("  %s: %s," % (key, ts_string(value)))
        lines.append("} as const;")
        lines.append("")
    hit = re.search(r"export const HIT = '(#[0-9A-Fa-f]{3,8})';", text)
    if not hit:
        raise SystemExit("Theme.ets 里找不到 HIT")
    lines.append("export const HIT = %s;" % ts_string(hit.group(1)))
    lines.append("")
    type_color = re.findall(r"TYPE_COLOR\.set\('([^']+)', '(#[0-9A-Fa-f]{3,8})'\)", text)
    if len(type_color) != 15:
        raise SystemExit(f"TYPE_COLOR 期望 15 项，实际 {len(type_color)}")
    lines.append("export const TYPE_COLOR: Record<string, string> = {")
    for key, value in type_color:
        lines.append("  %s: %s," % (key, ts_string(value)))
    lines.append("};")
    lines.append("")
    write("tokens.ts", "harmony_app/entry/src/main/ets/ui/Theme.ets", "\n".join(lines))
    return dict(APP=dict(palette(text, "APP")), TYPE_COLOR=dict(type_color))


# ---------------------------------------------------------------- Loc.ets
def export_i18n():
    text = read(os.path.join(ETS, "model", "Loc.ets"))
    rows = re.findall(
        r'\{\s*key:\s*"([^"]+)",\s*zh:\s*"([^"]*)",\s*en:\s*"([^"]*)"\s*\}', text)
    if len(rows) < 100:
        raise SystemExit(f"Loc.ets 只解析到 {len(rows)} 条文案，格式可能变了")
    seen = set()
    lines = ["export interface Translation { key: string; zh: string; en: string; }", "",
             "export const TEXTS: Translation[] = ["]
    for key, zh, en in rows:
        if key in seen:
            raise SystemExit(f"Loc.ets 出现重复 key: {key}")
        seen.add(key)
        lines.append("  { key: %s, zh: %s, en: %s }," % (ts_string(key), ts_string(zh), ts_string(en)))
    lines.append("];")
    lines.append("")
    write("i18n-data.ts", "harmony_app/entry/src/main/ets/model/Loc.ets", "\n".join(lines))
    return len(rows)


# ------------------------------------------------- Localization.ets + gen_model.py
def load_gen_model():
    """gen_model.py 的 main() 有 __main__ 保护，可以直接 import 复用它的中英表。"""
    path = os.path.join(ROOT, "tools", "gen_model.py")
    spec = importlib.util.spec_from_file_location("gen_model", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def export_labels():
    text = read(os.path.join(ETS, "model", "Localization.ets"))
    out = []
    for const in ("TYPE_ZH", "TYPE_EN"):
        pairs = re.findall(r"%s\.set\('([^']+)', '([^']*)'\)" % const, text)
        if len(pairs) != 15:
            raise SystemExit(f"{const} 期望 15 项，实际 {len(pairs)}")
        out.append("export const %s: Record<string, string> = {" % const)
        for key, value in pairs:
            out.append("  %s: %s," % (ts_string(key), ts_string(value)))
        out.append("};")
        out.append("")

    data = json.load(open(MAP_JSON, encoding="utf-8"))
    gen = load_gen_model()
    out.append("export const FLOOR_LABELS: Record<string, string> = {")
    for floor, label in data["meta"]["floors"].items():
        out.append("  %s: %s," % (ts_string(floor), ts_string(label)))
    out.append("};")
    out.append("")
    out.append("export const FLOOR_LABELS_EN: Record<string, string> = {")
    for floor, label in gen.FLOOR_EN.items():
        out.append("  %s: %s," % (ts_string(floor), ts_string(label)))
    out.append("};")
    out.append("")
    node_en = {}
    fallback = 0
    for n in data["nodes"]:
        val = gen.NAME_EN.get(n["name"], n["name"])
        if n["name"] not in gen.NAME_EN:
            fallback += 1
        node_en[n["id"]] = val
    out.append("// 无英文名的节点回落中文（与 gen_model.py 的 node_en 一致）")
    out.append("export const NODE_EN: Record<string, string> = {")
    for nid, val in node_en.items():
        out.append("  %s: %s," % (ts_string(nid), ts_string(val)))
    out.append("};")
    out.append("")
    write("labels.ts",
          "harmony_app/entry/src/main/ets/model/Localization.ets + tools/gen_model.py",
          "\n".join(out))
    return len(node_en), fallback


# ---------------------------------------------------------------- map data
def export_map():
    raw = open(MAP_JSON, "rb").read()
    digest = hashlib.sha256(raw).hexdigest()
    data = json.loads(raw.decode("utf-8"))
    body = ["// 源 JSON 的 SHA-256：%s" % digest,
            "// 节点 %d / 边 %d / 楼层 %s" % (len(data["nodes"]), len(data["edges"]),
                                          "/".join(data["meta"]["floors"])),
            "",
            "import type { RawAirportMap } from '../types.ts';",
            "",
            "export const MAP_SHA256 = %s;" % ts_string(digest),
            "",
            "export const MAP_RAW: RawAirportMap = %s;" % json.dumps(
                data, ensure_ascii=False, indent=2),
            ""]
    write("map-data.ts", "data/XHA_xinghai_t1.map.json", "\n".join(body))
    return data, digest


def main():
    print("导出共享核心数据（真源 -> packages/core/src/generated）")
    data, digest = export_map()
    n_texts = export_i18n()
    n_nodes, fallback = export_labels()
    export_tokens()
    floors = {}
    for n in data["nodes"]:
        floors[n["floor"]] = floors.get(n["floor"], 0) + 1
    print()
    print("  ✔ 地图      : %d 节点 / %d 边 / %s" % (
        len(data["nodes"]), len(data["edges"]), floors))
    print("  ✔ 文案      : %d 条（Loc.ets）" % n_texts)
    print("  ✔ 英文名    : %d 条（其中 %d 条回落中文）" % (n_nodes, fallback))
    print("  ✔ 令牌      : APP / MAP / ROUTE / HIT / TYPE_COLOR(15)")
    print("  ✔ 源 JSON   : sha256:%s" % digest[:16])
    return 0


if __name__ == "__main__":
    sys.exit(main())
