#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把 data/*.map.json 渲染成节点图预览 SVG（每层一张 + 一张全览）。
遵循 dataviz 纪律：浅色表面、细线条、文字用墨色（不用系列色）、图例常驻、直接标注。
节点图是带空间位置的网络图，颜色只做辅助，识别靠中文标签。
"""
import json
import math
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "data")
PREVIEW_DIR = os.path.join(ROOT, "preview")

# ---- 表面与墨色（dataviz reference palette） ----
SURFACE = "#fcfcfb"
GRID = "#e7e6df"
INK = "#0b0b0b"
INK2 = "#52514e"
MUTED = "#898781"

# ---- 边 ----
EDGE_STYLE = {
    "walk":       {"stroke": "#b3aca1", "width": 1.4, "dash": None},
    "elevator":   {"stroke": "#eb6834", "width": 1.8, "dash": "6,4"},
    "escalator":  {"stroke": "#eda100", "width": 1.8, "dash": "6,4"},
    "stair":      {"stroke": "#6b7280", "width": 1.8, "dash": "4,4"},
    "apm":        {"stroke": "#e87ba4", "width": 2.0, "dash": "8,4"},
}

# ---- 节点 ----
NODE_COLOR = {
    "entrance":    "#008300",
    "exit":        "#16a34a",
    "checkin":     "#4a3aa7",
    "security":    "#e34948",
    "gate":        "#2a78d6",
    "lift":        "#eb6834",
    "escalator":   "#eda100",
    "stair":       "#884d4b",
    "apm_station": "#e87ba4",
    "metro":       "#1baf7a",
    "coach":       "#52514e",
    "parking":     "#898781",
    "baggage":     "#0d9488",
    "toilet":      "#0ea5e9",
    "hall":        "#5b6478",
    "corridor":    "#9aa3b2",
    "terminal":    "#4f46e5",
    "tower":       "#374151",
    "hotel":       "#a16207",
}
NODE_LABEL = {
    "entrance": "出入口", "exit": "到达出口", "checkin": "值机/自助", "security": "安检",
    "gate": "登机口", "lift": "电梯", "escalator": "扶梯", "stair": "楼梯",
    "apm_station": "捷运站", "metro": "地铁", "coach": "大巴/出租", "parking": "停车",
    "baggage": "行李提取", "toilet": "洗手间", "hall": "大厅/商业区", "corridor": "通道/节点",
    "terminal": "航站楼", "tower": "塔台", "hotel": "酒店",
}
# 点比较小的类别（纯拓扑中转点），其余为 POI
WAYPOINT = {"corridor"}
# 主要地标画得更大一些
POI_BIG = {"terminal", "hotel", "tower"}

FONT = "system-ui, -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif"


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def find_maps():
    """要渲染的地图列表：命令行传参则只渲染指定 JSON，否则渲染 data/*.json"""
    paths = sys.argv[1:]
    if not paths:
        paths = sorted(os.path.join(DATA_DIR, fn) for fn in os.listdir(DATA_DIR) if fn.endswith(".json"))
    maps = []
    for p in paths:
        with open(p, encoding="utf-8") as f:
            maps.append(json.load(f))
    return maps


def floor_bbox(nodes, floor):
    xs = [n["x"] for n in nodes if n["floor"] == floor]
    ys = [n["y"] for n in nodes if n["floor"] == floor]
    return min(xs), min(ys), max(xs), max(ys)


def render_legend_types(used):
    out = []
    for t in used:
        c = NODE_COLOR.get(t, "#9ca3af")
        label = NODE_LABEL.get(t, t)
        r = 4 if t in WAYPOINT else (8 if t in POI_BIG else 6)
        out.append(
            f'<g transform="translate(0,{len(out) * 20})">'
            f'<circle cx="7" cy="6" r="{r}" fill="{c}" stroke="{SURFACE}" stroke-width="2"/>'
            f'<text x="18" y="10" font-size="12" fill="{INK2}" font-family="{FONT}">{esc(label)}</text>'
            f"</g>"
        )
    return "\n".join(out)


EDGE_LABELS = {"walk": "步行", "elevator": "电梯(换层)", "escalator": "扶梯(换层)",
               "stair": "楼梯(换层)", "apm": "旅客捷运(卫星厅)"}


def render_legend_edges(used):
    out = []
    for t in used:
        s = EDGE_STYLE[t]
        label = EDGE_LABELS.get(t, t)
        dash_attr = f' stroke-dasharray="{s["dash"]}"' if s["dash"] else ""
        out.append(
            f'<g transform="translate(0,{len(out) * 20})">'
            f'<line x1="0" y1="8" x2="30" y2="8" stroke="{s["stroke"]}" stroke-width="{s["width"]}"'
            + dash_attr + '/>'
            f'<text x="38" y="12" font-size="12" fill="{INK2}" font-family="{FONT}">{esc(label)}</text>'
            f"</g>"
        )
    return "\n".join(out)


def render_node(n, label_limit=None):
    # label_limit：图例分隔线左侧边界；标签若越过则向左锚定，避免压到图例列
    t = n["type"]
    c = NODE_COLOR.get(t, "#9ca3af")
    r = 4.5 if t in WAYPOINT else (10 if t in POI_BIG else 7)
    fs = 10 if t == "gate" else 11
    label_w = sum(1.0 if ord(ch) > 0x2E80 else 0.62 for ch in n["name"]) * fs
    if label_limit is not None and n["x"] + r + 3 + label_w > label_limit:
        lx, anchor = n["x"] - r - 3, "end"
    else:
        lx, anchor = n["x"] + r + 3, "start"
    return (
        f'<circle cx="{n["x"]}" cy="{n["y"]}" r="{r}" fill="{c}" stroke="{SURFACE}" stroke-width="2.5"/>'
        f'<text x="{lx}" y="{n["y"] + 4}" font-size="{fs}" text-anchor="{anchor}" '
        f'fill="{INK2}" font-family="{FONT}" paint-order="stroke" stroke="{SURFACE}" stroke-width="3">{esc(n["name"])}</text>'
    )


def render_scale_bar(px_per_meter, max_w):
    meters = 200
    if px_per_meter <= 0:
        return ""
    px = meters * px_per_meter
    # 若超出可用宽度减半
    while px > max_w and meters > 25:
        meters //= 2
        px = meters * px_per_meter
    ticks = ""
    for t in range(0, meters + 1, meters // 4):
        fx = int(px * t / meters)
        ticks += f'<line x1="{fx}" y1="0" x2="{fx}" y2="10" stroke="{INK2}" stroke-width="1"/>'
    return (
        f'<g transform="translate({max_w - px}, 52)">'
        f'{ticks}'
        f'<line x1="0" y1="10" x2="{px}" y2="10" stroke="{INK2}" stroke-width="1.5"/>'
        f'<text x="0" y="24" font-size="11" fill="{INK2}" font-family="{FONT}">0</text>'
        f'<text x="{px - 26}" y="24" font-size="11" fill="{INK2}" font-family="{FONT}">{meters}m</text>'
        f"</g>"
    )


def render_floor_svg(m, floor):
    label = m["meta"]["floors"][floor]
    nodes = [n for n in m["nodes"] if n["floor"] == floor]
    edges = [e for e in m["edges"]
             if any(e["from"] == n["id"] for n in nodes) and any(e["to"] == n["id"] for n in nodes)]
    minx, miny, maxx, maxy = floor_bbox(nodes, floor)
    pad = 46
    legend_w = 190
    margin_r = 80  # 右边距加大：给最右侧节点标签留出空间，避免压到图例列
    width = pad + (maxx - minx) + legend_w + margin_r
    height = pad + (maxy - miny) + pad

    def tx(x):
        return pad + (x - minx)

    def ty(y):
        return pad + (y - miny)

    grid = []
    for gx in range(int(minx // 100) * 100, maxx + 100, 100):
        grid.append(f'<line x1="{tx(gx)}" y1="{pad}" x2="{tx(gx)}" y2="{pad + (maxy - miny)}" stroke="{GRID}" stroke-width="1"/>')
    for gy in range(int(miny // 100) * 100, maxy + 100, 100):
        grid.append(f'<line x1="{pad}" y1="{ty(gy)}" x2="{width - legend_w}" y2="{ty(gy)}" stroke="{GRID}" stroke-width="1"/>')

    edge_svg = []
    for e in edges:
        a = next(n for n in nodes if n["id"] == e["from"])
        b = next(n for n in nodes if n["id"] == e["to"])
        s = EDGE_STYLE[e["type"]]
        dash = f' stroke-dasharray="{s["dash"]}"' if s["dash"] else ""
        edge_svg.append(
            f'<line x1="{tx(a["x"])}" y1="{ty(a["y"])}" x2="{tx(b["x"])}" y2="{ty(b["y"])}" '
            f'stroke="{s["stroke"]}" stroke-width="{s["width"]}" stroke-linecap="round"{dash}/>'
        )

    # 图例分隔线左侧边界（label_limit）：标签越过则向左翻转，避免压住图例列
    label_boundary = width - legend_w
    node_svg = "\n".join(
        render_node({**n, "x": tx(n["x"]), "y": ty(n["y"])}, label_limit=label_boundary) for n in nodes)

    # 图例只显示本层实际出现的类型，顺序遵循 meta.nodeTypes
    type_order = m["meta"].get("nodeTypes") or sorted({n["type"] for n in nodes})
    used_types = [t for t in type_order if any(n["type"] == t for n in nodes)] or sorted({n["type"] for n in nodes})
    used_edge_types = [t for t in EDGE_STYLE if any(e["type"] == t for e in edges)]
    ppm = m["meta"].get("pxPerMeter")
    ppm_str = f"{ppm}" if ppm else "未校准(像素≈米)"

    legend_x = width - legend_w + 8
    edges_legend = ""
    if used_edge_types:
        edges_legend = (
            f'<text x="{legend_x}" y="{44 + len(used_types) * 20 + 14}" font-size="12" font-weight="600" fill="{INK}">连线类型</text>'
            f'<g transform="translate({legend_x}, {44 + len(used_types) * 20 + 26})">{render_legend_edges(used_edge_types)}</g>'
        )
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" font-family="{FONT}">
<rect x="0" y="0" width="{width}" height="{height}" fill="{SURFACE}"/>
{chr(10).join(grid)}
<text x="{pad}" y="24" font-size="16" font-weight="700" fill="{INK}">{esc(m["meta"]["name"])} · {esc(label)}</text>
<text x="{pad}" y="42" font-size="11" fill="{MUTED}">{len(nodes)} 节点 / {len(edges)} 边 · pxPerMeter={ppm_str}</text>
{render_scale_bar(ppm or 0, maxx - minx)}
<g>{chr(10).join(edge_svg)}</g>
{node_svg}
<line x1="{legend_x - 8}" y1="{pad - 30}" x2="{legend_x - 8}" y2="{height - pad + 30}" stroke="{GRID}" stroke-width="1.5"/>
<text x="{legend_x}" y="30" font-size="12" font-weight="600" fill="{INK}">节点类型</text>
<g transform="translate({legend_x}, {44})">{render_legend_types(used_types)}</g>
{edges_legend}
</svg>"""
    return svg


def render_overview_svg(m):
    floors = list(m["meta"]["floors"].keys())
    per = 180
    gap = 120
    width = per + 220
    height = 60 + sum(per + 20 for _ in floors) + (len(floors) - 1) * gap + 40
    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" font-family="{FONT}">']
    svg.append(f'<rect x="0" y="0" width="{width}" height="{height}" fill="{SURFACE}"/>')
    svg.append(f'<text x="20" y="30" font-size="16" font-weight="700" fill="{INK}">{esc(m["meta"]["name"])} 全览（示意）</text>')
    y_cursor = 60
    for i, floor in enumerate(floors):
        nodes = [n for n in m["nodes"] if n["floor"] == floor]
        edges = [e for e in m["edges"]
                 if any(e["from"] == n["id"] for n in nodes) and any(e["to"] == n["id"] for n in nodes)]
        minx, miny, maxx, maxy = floor_bbox(nodes, floor)
        w = maxx - minx
        h = maxy - miny
        s = min(per / w, per / h)
        y_mid = y_cursor + per / 2
        ox, oy = 110, y_mid
        # scale to fit per box, centered
        cx, cy = (minx + maxx) / 2, (miny + maxy) / 2
        x0, y0 = 110 - s * (cx - minx), y_cursor + (per - s * h) / 2
        g = [f'<g transform="translate({x0},{y0}) scale({s})">']
        for e in edges:
            a = next(n for n in nodes if n["id"] == e["from"])
            b = next(n for n in nodes if n["id"] == e["to"])
            st = EDGE_STYLE[e["type"]]
            dash = f' stroke-dasharray="{st["dash"]}"' if st["dash"] else ""
            g.append(f'<line x1="{a["x"]}" y1="{a["y"]}" x2="{b["x"]}" y2="{b["y"]}" stroke="{st["stroke"]}" stroke-width="{1.1 / s}" stroke-linecap="round"{dash}/>')
        for n in nodes:
            c = NODE_COLOR.get(n["type"], "#9ca3af")
            r = 2.6 / s if n["type"] not in WAYPOINT else 1.8 / s
            g.append(f'<circle cx="{n["x"]}" cy="{n["y"]}" r="{r}" fill="{c}"/>')
        g.append("</g>")
        svg.append("\n".join(g))
        svg.append(f'<text x="20" y="{y_mid + 4}" font-size="13" font-weight="600" fill="{INK}">{esc("· " + floor + " " + m["meta"]["floors"][floor])}</text>')
        y_cursor += per + 20 + gap
    svg.append("</svg>")
    return "\n".join(svg)


def main():
    os.makedirs(PREVIEW_DIR, exist_ok=True)
    maps = find_maps()
    files = []
    for m in maps:
        ap = m["meta"]["airport"]
        for floor in m["meta"]["floors"]:
            svg = render_floor_svg(m, floor)
            fn = os.path.join(PREVIEW_DIR, f"{ap}.{floor}.nodes.svg")
            with open(fn, "w", encoding="utf-8") as f:
                f.write(svg)
            files.append(f"{ap}.{floor}.nodes.svg")
        ov = render_overview_svg(m)
        ovfn = os.path.join(PREVIEW_DIR, f"{ap}.overview.svg")
        with open(ovfn, "w", encoding="utf-8") as f:
            f.write(ov)
        files.append(f"{ap}.overview.svg")
    # 整批渲染时才重建 index.html（单独渲染单个文件时不覆盖整册）
    if not sys.argv[1:]:
        idx = os.path.join(PREVIEW_DIR, "index.html")
        with open(idx, "w", encoding="utf-8") as f:
            f.write('<!doctype html><html lang="zh"><head><meta charset="utf-8">'
                    '<title>机场节点图预览</title>'
                    f'<style>body{{margin:24px;background:{SURFACE};color:{INK};font-family:{FONT}}}'
                    'h2{margin-top:32px} figure{margin:0 0 8px} svg{max-width:100%;border:1px solid #e1e0d9;border-radius:8px}</style>'
                    '</head><body><h1>机场导航元服务 · 节点图预览</h1>')
            for m in maps:
                ap = m["meta"]["airport"]
                f.write(f"<h2>{esc(m['meta']['name'])}</h2>")
                for floor in m["meta"]["floors"]:
                    fn = f"{ap}.{floor}.nodes.svg"
                    f.write(f'<figure><figcaption>{esc(floor + " " + m["meta"]["floors"][floor])}</figcaption>'
                            f'<object data="{fn}" type="image/svg+xml" width="100%">'
                            f'<img src="{fn}" alt="{esc(m["meta"]["name"] + " " + fn)}"></object></figure>')
                f.write(f'<figure><figcaption>全览</figcaption><object data="{ap}.overview.svg" type="image/svg+xml"></object></figure>')
            f.write("</body></html>")
    for s in files:
        print("preview:", s)


if __name__ == "__main__":
    main()