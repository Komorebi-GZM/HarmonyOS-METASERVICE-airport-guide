#!/usr/bin/env python3
"""Repeatable local UI smoke check for the Xinghai Airport guide.

This script only talks to an already-running HarmonyOS emulator/device through
hdc. It never installs the HAP or starts/stops an emulator.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path
from typing import Any, Iterable


BUNDLE = "com.example.airportguide"
ABILITY = "EntryAbility"
REMOTE_DIR = "/data/local/tmp"
WAIT_SECONDS = 25.0
POLL_SECONDS = 0.6


class SmokeFailure(RuntimeError):
    pass


def attr_map(node: Any) -> dict[str, Any]:
    """Return a flattened view of common dumpLayout node representations."""
    if not isinstance(node, dict):
        return {}
    result: dict[str, Any] = {}
    attrs = node.get("attributes")
    if isinstance(attrs, dict):
        result.update(attrs)
    for key, value in node.items():
        if key not in {"attributes", "children", "child", "nodes", "root"}:
            if isinstance(value, (str, int, float, bool)):
                result.setdefault(key, value)
    return result


def walk_nodes(root: Any) -> Iterable[tuple[dict[str, Any], dict[str, Any]]]:
    """Yield (node, attributes) recursively for layout dump variants."""
    if isinstance(root, list):
        for item in root:
            yield from walk_nodes(item)
        return
    if not isinstance(root, dict):
        return
    yield root, attr_map(root)
    for key in ("children", "child", "nodes", "root"):
        value = root.get(key)
        if isinstance(value, (dict, list)):
            yield from walk_nodes(value)


def node_id(attrs: dict[str, Any]) -> str:
    for key in ("id", "key", "inspectorId", "accessibilityId", "accessibility-id"):
        value = attrs.get(key)
        if value is not None and str(value).strip():
            return str(value).strip()
    return ""


def node_text(attrs: dict[str, Any]) -> str:
    for key in ("text", "label", "value", "accessibilityText", "accessibility-text", "contentDescription"):
        value = attrs.get(key)
        if value is not None and str(value).strip():
            return str(value).strip()
    return ""


def bounds_center(attrs: dict[str, Any]) -> tuple[int, int] | None:
    value = None
    for key in ("bounds", "bound", "rect", "frame"):
        if attrs.get(key) is not None:
            value = attrs[key]
            break
    if isinstance(value, dict):
        try:
            x = float(value.get("left", value.get("x", value.get("x1"))))
            y = float(value.get("top", value.get("y", value.get("y1"))))
            right = float(value.get("right", value.get("x2")))
            bottom = float(value.get("bottom", value.get("y2")))
            return round((x + right) / 2), round((y + bottom) / 2)
        except (TypeError, ValueError):
            return None
    if isinstance(value, (list, tuple)) and len(value) >= 4:
        try:
            x, y, right, bottom = (float(part) for part in value[:4])
            return round((x + right) / 2), round((y + bottom) / 2)
        except (TypeError, ValueError):
            return None
    if value is not None:
        nums = re.findall(r"-?\d+(?:\.\d+)?", str(value))
        if len(nums) >= 4:
            x, y, right, bottom = (float(part) for part in nums[:4])
            return round((x + right) / 2), round((y + bottom) / 2)
    # Some inspector versions expose coordinates as separate properties.
    try:
        x = float(attrs.get("left", attrs.get("x", attrs.get("x1"))))
        y = float(attrs.get("top", attrs.get("y", attrs.get("y1"))))
        right = float(attrs.get("right", attrs.get("x2")))
        bottom = float(attrs.get("bottom", attrs.get("y2")))
        return round((x + right) / 2), round((y + bottom) / 2)
    except (TypeError, ValueError):
        return None


class EmulatorSmoke:
    def __init__(self, target: str, out_dir: Path, language: str) -> None:
        self.target = target
        self.out_dir = out_dir.resolve()
        self.language = language
        self.serial = re.sub(r"[^A-Za-z0-9_-]", "_", target)[:32] or "device"
        self.counter = 0
        self.last_layout: Any = None
        self.last_stage = "startup"
        self.passed: list[str] = []
        self.out_dir.mkdir(parents=True, exist_ok=True)

    def run(self, args: list[str], timeout: float = 30.0, *, allow_failure: bool = False) -> str:
        command = ["hdc", "-t", self.target, *args]
        try:
            proc = subprocess.run(command, capture_output=True, text=True,
                                  encoding="utf-8", errors="replace", timeout=timeout)
        except subprocess.TimeoutExpired as exc:
            raise SmokeFailure(f"hdc 命令超时：{' '.join(args)}") from exc
        output = "\n".join(part for part in (proc.stdout, proc.stderr) if part).strip()
        if proc.returncode != 0 and not allow_failure:
            raise SmokeFailure(f"hdc 命令失败 ({proc.returncode})：{' '.join(args)}\n{output}")
        return output

    def recv(self, remote: str, local: Path) -> None:
        self.run(["file", "recv", remote, str(local)], timeout=30)
        if not local.is_file() or local.stat().st_size == 0:
            raise SmokeFailure(f"设备文件接收后为空：{local.name}")

    def dump(self, name: str) -> tuple[Any, Path]:
        self.counter += 1
        remote = f"{REMOTE_DIR}/airport_smoke_{self.serial}_{self.counter}.json"
        local = self.out_dir / f"{self.counter:02d}_{name}.json"
        self.run(["shell", "uitest", "dumpLayout", "-p", remote], timeout=30)
        self.recv(remote, local)
        try:
            with local.open("r", encoding="utf-8-sig") as handle:
                layout = json.load(handle)
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise SmokeFailure(f"布局 JSON 无法解析：{local}") from exc
        self.last_layout = layout
        return layout, local

    def screenshot(self, name: str) -> Path:
        remote = f"{REMOTE_DIR}/airport_smoke_{self.serial}_{self.counter}_{name}.jpeg"
        local = self.out_dir / f"{self.counter:02d}_{name}.jpeg"
        self.run(["shell", "snapshot_display", "-f", remote], timeout=30)
        self.recv(remote, local)
        return local

    def evidence(self, name: str) -> tuple[Any, str]:
        layout, json_path = self.dump(name)
        image_path = self.screenshot(name)
        print(f"  证据：{json_path.name} / {image_path.name}")
        return layout, self.all_text(layout)

    @staticmethod
    def all_text(layout: Any) -> str:
        values: list[str] = []
        for _, attrs in walk_nodes(layout):
            text = node_text(attrs)
            if text:
                values.append(text)
        return "\n".join(values)

    def find_id(self, layout: Any, wanted: str) -> tuple[Any, dict[str, Any]] | None:
        for node, attrs in walk_nodes(layout):
            if node_id(attrs) == wanted and bounds_center(attrs) is not None:
                return node, attrs
        return None

    @staticmethod
    def is_enabled(found: tuple[Any, dict[str, Any]] | None) -> bool:
        if found is None:
            return False
        value = found[1].get("enabled")
        return str(value).strip().lower() == "true"

    def click_id(self, layout: Any, wanted: str) -> None:
        found = self.find_id(layout, wanted)
        if found is None:
            raise SmokeFailure(f"当前页面找不到可点击控件 id/key={wanted}")
        center = bounds_center(found[1])
        assert center is not None
        self.run(["shell", "uitest", "uiInput", "click", str(center[0]), str(center[1])])

    def click_text(self, layout: Any, wanted: str, *, exact: bool = True) -> None:
        for _, attrs in walk_nodes(layout):
            text = node_text(attrs)
            match = text == wanted if exact else wanted in text
            center = bounds_center(attrs)
            if match and center is not None:
                self.run(["shell", "uitest", "uiInput", "click", str(center[0]), str(center[1])])
                return
        raise SmokeFailure(f"当前页面找不到文本控件：{wanted}")

    def wait_for(self, predicate, description: str, timeout: float = WAIT_SECONDS) -> Any:
        deadline = time.monotonic() + timeout
        last_error = ""
        while time.monotonic() < deadline:
            try:
                layout, _ = self.dump("wait")
                if predicate(layout):
                    return layout
            except SmokeFailure as exc:
                last_error = str(exc)
            time.sleep(POLL_SECONDS)
        extra = f"；最近错误：{last_error}" if last_error else ""
        raise SmokeFailure(f"等待超时：{description}{extra}")

    def input_text(self, text: str) -> None:
        # uitest help documents `text <text>` for an already-focused field.
        self.run(["shell", "uitest", "uiInput", "text", text])

    def launch(self) -> Any:
        self.last_stage = "launch"
        # Each language run begins from the real home page even if a prior run
        # left a destination or completion page on the navigation stack.
        self.run(["shell", "aa", "force-stop", BUNDLE])
        self.run(["shell", "aa", "start", "-b", BUNDLE, "-a", ABILITY])
        layout = self.wait_for(lambda tree: self.find_id(tree, "home_search") is not None,
                               "应用首页 home_search 控件出现")
        # Wait for the entry transition to settle before sending the first tap.
        time.sleep(0.9)
        return self.wait_for(lambda tree: self.find_id(tree, "home_search") is not None,
                             "首页转场稳定后 home_search 仍可见")

    def set_language(self, layout: Any) -> Any:
        self.last_stage = "language"
        found = self.find_id(layout, "language_switch")
        if found is None:
            raise SmokeFailure("首页未找到 language_switch")
        button_text = node_text(found[1])
        currently_english = button_text == "中文"
        wants_english = self.language == "en"
        if currently_english != wants_english:
            self.click_id(layout, "language_switch")
            switch_text = "中文" if wants_english else "English"
            home_title = "Where would you like to go?" if wants_english else "你想去哪里？"
            layout = self.wait_for(lambda tree:
                                   (lambda item: item is not None and node_text(item[1]) == switch_text)
                                   (self.find_id(tree, "language_switch"))
                                   and home_title in self.all_text(tree),
                                   "首页语言和切换按钮文本更新")
        return layout

    def fail_artifacts(self) -> None:
        """Best-effort failure snapshot and local copy of the last tree."""
        try:
            if self.last_layout is not None:
                path = self.out_dir / f"FAIL_{self.last_stage}.json"
                path.write_text(json.dumps(self.last_layout, ensure_ascii=False, indent=2), encoding="utf-8")
            self.screenshot(f"FAIL_{self.last_stage}")
        except Exception as exc:  # keep the original assertion/error visible
            print(f"  失败现场截图未保存：{exc}", file=sys.stderr)

    def check_route(self) -> None:
        layout = self.launch()
        layout = self.set_language(layout)
        text = self.all_text(layout)
        if self.language == "en" and "Where would you like to go?" not in text:
            raise SmokeFailure("语言设为英文后首页标题未切换")
        if self.language == "zh" and "你想去哪里？" not in text:
            raise SmokeFailure("语言设为中文后首页标题未切换")
        self.evidence("home")
        self.passed.append("首页与语言")

        self.last_stage = "destination_search"
        self.click_id(layout, "home_search")
        layout = self.wait_for(lambda tree: self.find_id(tree, "place_search") is not None,
                               "目的地选择页 place_search 出现")
        # Use the visible category and first gate result. This avoids opening
        # the emulator's first-run IME privacy screen during a smoke run.
        category = "Gates" if self.language == "en" else "登机口"
        self.click_text(layout, category)
        layout = self.wait_for(lambda tree: self.find_id(tree, "place_xha_p4_gA101") is not None,
                               "登机口分类结果包含 A101")
        self.click_id(layout, "place_xha_p4_gA101")
        target_label = "Gate A101" if self.language == "en" else "登机口A101"
        layout = self.wait_for(lambda tree: self.is_enabled(self.find_id(tree, "primary_action"))
                               and target_label in self.all_text(tree),
                               "选中 A101 后页脚确认目的地且主操作可用")
        self.click_id(layout, "primary_action")
        layout = self.wait_for(lambda tree: self.find_id(tree, "choose_on_map") is not None,
                               "起点选择页出现")
        self.passed.append("登机口分类并选择 A101")

        self.last_stage = "start_selection"
        wanted_start = "West Departure Gate" if self.language == "en" else "西出发门"
        self.click_text(layout, wanted_start)
        layout = self.wait_for(lambda tree: self.is_enabled(self.find_id(tree, "primary_action"))
                               and wanted_start in self.all_text(tree),
                               "选中西出发门后页脚确认起点且主操作可用")
        self.click_id(layout, "primary_action")
        layout = self.wait_for(lambda tree: self.find_id(tree, "begin") is not None or
                               (self.find_id(tree, "primary_action") is not None and
                                ("路线预览" in self.all_text(tree) or "Route preview" in self.all_text(tree))),
                               "路线预览页出现")
        layout, text = self.evidence("route_preview")
        security_hint = "central security" if self.language == "en" else "中央安检"
        if security_hint not in text:
            raise SmokeFailure(f"西出发门到 A101 的路线预览缺少安检提示：{security_hint}")
        self.passed.append("安检路线预览")

        self.last_stage = "guidance"
        # The primary action id is common to all pages; its visible button text
        # is the reliable signal that the preview can begin guidance.
        self.click_text(layout, "Start guidance" if self.language == "en" else "开始指引")
        layout = self.wait_for(lambda tree: "Route guidance" in self.all_text(tree) or
                               "正在指引" in self.all_text(tree), "路线指引状态出现")
        layout, text = self.evidence("guidance_start")
        if not re.search(r"(?:Step|步骤)\s*1\s*/\s*\d+", text, flags=re.IGNORECASE):
            raise SmokeFailure("路线指引未显示第 1 步及总步数")
        self.passed.append("开始指引与步骤计数")

        # Advance one step at a time, checking that each manual confirmation
        # changes the displayed step until the app reaches its completed state.
        max_advances = 24
        previous_verified = False
        for index in range(max_advances):
            text = self.all_text(layout)
            if ("Guidance completed" in text or "本次指引已完成" in text):
                self.evidence("guidance_complete")
                self.passed.append("逐步确认并完成路线")
                return
            step_match = re.search(r"(?:Step|步骤)\s*(\d+)\s*/\s*(\d+)", text, flags=re.IGNORECASE)
            if not step_match:
                raise SmokeFailure("指引页面缺少步骤分子/分母")
            current, total = map(int, step_match.groups())
            if current < 1 or total < current:
                raise SmokeFailure(f"步骤计数不合法：{current}/{total}")
            if not previous_verified and current == 2 and self.find_id(layout, "previous_step") is not None:
                self.click_id(layout, "previous_step")
                back = self.wait_for(lambda tree: re.search(
                    rf"(?:Step|步骤)\s*1\s*/\s*{total}\b", self.all_text(tree), flags=re.IGNORECASE) is not None,
                    "上一步返回第 1 步")
                layout = back
                previous_verified = True
                current = 1
            self.click_id(layout, "primary_action")
            expected = current + 1
            layout = self.wait_for(
                lambda tree: ("Guidance completed" in self.all_text(tree) or "本次指引已完成" in self.all_text(tree))
                or re.search(rf"(?:Step|步骤)\s*{expected}\s*/\s*{total}\b", self.all_text(tree), flags=re.IGNORECASE) is not None,
                f"手动确认后步骤变为 {expected}/{total} 或完成")
            if expected <= total and ("Guidance completed" not in self.all_text(layout) and "本次指引已完成" not in self.all_text(layout)):
                self.last_stage = f"guidance_step_{expected}"
                self.evidence(f"guidance_step_{expected}")
        raise SmokeFailure(f"超过 {max_advances} 次确认仍未到达路线完成页")

    def execute(self) -> int:
        try:
            self.check_route()
        except Exception:
            self.fail_artifacts()
            raise
        print("\nPASS：" + "、".join(self.passed))
        print(f"证据目录：{self.out_dir}")
        return 0


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="对已运行的鸿蒙机场导览应用执行本地模拟器 UI 冒烟验收")
    parser.add_argument("--target", required=True, help="hdc 设备 ID")
    parser.add_argument("--out", required=True, type=Path, help="截图和布局 JSON 输出目录")
    parser.add_argument("--language", choices=("zh", "en"), default="zh", help="测试语言，默认 zh")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    os.environ.setdefault("PYTHONUTF8", "1")
    args = parse_args(argv)
    smoke = EmulatorSmoke(args.target, args.out, args.language)
    try:
        return smoke.execute()
    except (SmokeFailure, OSError) as exc:
        print(f"FAIL [{smoke.last_stage}]：{exc}", file=sys.stderr)
        print(f"证据目录：{smoke.out_dir}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
