#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把 data/XHA_xinghai_t1.map.json 编译成端侧 ArkTS 类型化模型
  harmony_app/entry/src/main/ets/model/AirportMap.ets

产出：
  XHA_META      机场元信息（airport/name/pxPerMeter）
  SECURITY_ID   唯一安检节点 id（咽喉，寻路必经）
  FLOOR_ORDER / FLOOR_LABELS(/EN)   楼层序与中英名（Map）
  FLOOR_BBOX    每层坐标包围盒 [minX,minY,maxX,maxY]（Map，视口适配用）
  XHA_NODES / XHA_EDGES   节点 / 边（含 side 陆/空/咽喉 判定）
  NODE_EN       id -> 英文名（无语义兜底用中文）

同步链：改数据 -> python3 tools/gen_maps.py -> python3 tools/gen_model.py
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "data", "XHA_xinghai_t1.map.json")
OUT = os.path.join(ROOT, "harmony_app", "entry", "src", "main", "ets", "model", "AirportMap.ets")

# 节点中文名 -> 英文名（96 个唯一名；重复名跨层共用）
NAME_EN = {
    "A岛值机(国际)": "Check-in A (Int'l)",
    "B岛值机(国内)": "Check-in B (Domestic)",
    "C岛值机(国内)": "Check-in C (Domestic)",
    "D岛自助值机": "Self Check-in D",
    "A指廊北口": "Pier A · North",
    "A指廊中段": "Pier A · Mid",
    "A指廊中后段": "Pier A · Mid-late",
    "A指廊南端": "Pier A · South",
    "B指廊北口": "Pier B · North",
    "B指廊中段": "Pier B · Mid",
    "B指廊中后段": "Pier B · Mid-late",
    "B指廊南端": "Pier B · South",
    "C指廊北口": "Pier C · North",
    "C指廊中段": "Pier C · Mid",
    "C指廊中后段": "Pier C · Mid-late",
    "C指廊南端": "Pier C · South",
    "P1停车楼": "P1 Car Park",
    "西出发门": "West Departure Gate",
    "北出发门": "North Departure Gate",
    "东出发门": "East Departure Gate",
    "西到达出口": "West Arrival Exit",
    "主到达出口": "Main Arrival Exit",
    "东到达出口": "East Arrival Exit",
    "西到达廊北口": "West Arrivals · North",
    "西到达廊中段": "West Arrivals · Mid",
    "西到达廊南端": "West Arrivals · South",
    "中到达廊北口": "Central Arrivals · North",
    "中到达廊中段": "Central Arrivals · Mid",
    "中到达廊南端": "Central Arrivals · South",
    "东到达廊北口": "East Arrivals · North",
    "东到达廊中段": "East Arrivals · Mid",
    "东到达廊南端": "East Arrivals · South",
    "西区电梯": "West Elevator",
    "中庭观光电梯": "Atrium Elevator",
    "东区电梯": "East Elevator",
    "中央扶梯组": "Central Escalators",
    "中庭楼梯": "Atrium Stairs",
    "地铁扶梯": "Metro Escalator",
    "地铁楼梯": "Metro Stairs",
    "空侧西电梯": "Airside West Elevator",
    "空侧中庭电梯": "Airside Atrium Elevator",
    "空侧东电梯": "Airside East Elevator",
    "空侧扶梯组": "Airside Escalators",
    "空侧楼梯": "Airside Stairs",
    "安检前大厅": "Pre-security Hall",
    "中央安检大厅(唯一)": "Central Security (Sole)",
    "空侧免税商业区": "Airside Duty-free",
    "空侧餐饮区": "Airside Food Court",
    "观景露台": "Observation Deck",
    "贵宾休息室A": "Lounge A",
    "贵宾休息室B": "Lounge B",
    "亲子游乐区": "Kids Play Area",
    "夹层中央厅": "Mezzanine Hall",
    "出发层洗手间": "Restrooms (Dep.)",
    "洗手间": "Restrooms",
    "到达层洗手间": "Restrooms (Arr.)",
    "行李提取A区": "Baggage Claim A",
    "行李提取B区": "Baggage Claim B",
    "中央到达大厅": "Central Arrivals Hall",
    "迎客·到达大厅": "Welcome & Arrivals Lobby",
    "出租·网约上车点": "Taxi & Ride-hailing Pickup",
    "机场巴士站台": "Shuttle Stop",
    "行李寄存处": "Luggage Storage",
    "航站楼间连廊": "Terminal Link Bridge",
    "交通中心大厅": "Transport Center Hall",
    "地铁站厅(非付费区)": "Metro Concourse (Unpaid)",
    "地铁闸机群": "Metro Gates",
    "机场大巴·长途站": "Coach & Long-distance",
    "出租车·网约车候车区": "Taxi & Ride-hailing Wait",
    "站台联络通道": "Platform Passage",
    "站台·往市区方向": "Platform · City Center",
    "站台·往星湖度假区": "Platform · Xinghu Resort",
}
# 登机口 A/B/C 批量
for pier, lo, hi in (("A", 101, 108), ("B", 201, 208), ("C", 301, 308)):
    for no in range(lo, hi + 1):
        NAME_EN[f"登机口{pier}{no}"] = f"Gate {pier}{no}"

FLOOR_EN = {
    "4F": "Departures",
    "3F": "Airside Mezzanine",
    "2F": "Arrivals",
    "1F": "Ground Welcome",
    "B1": "Transport Center",
    "B2": "Metro Platform",
}


def reachable(adj, src, skip):
    seen = {src}
    st = [src]
    while st:
        u = st.pop()
        for v in adj.get(u, ()):
            if v == skip or v in seen:
                continue
            seen.add(v)
            st.append(v)
    return seen


def main():
    m = json.load(open(SRC, encoding="utf-8"))
    nodes, edges, meta = m["nodes"], m["edges"], m["meta"]
    secs = [n for n in nodes if n["type"] == "security"]
    assert len(secs) == 1, "必须恰有一个安检节点"
    sec_id = secs[0]["id"]

    adj = {}
    for e in edges:
        adj.setdefault(e["from"], set()).add(e["to"])
        adj.setdefault(e["to"], set()).add(e["from"])
    anchor = next(n["id"] for n in nodes if n["type"] == "entrance")
    land = reachable(adj, anchor, sec_id)

    for n in nodes:
        n["side"] = "gate" if n["id"] == sec_id else ("land" if n["id"] in land else "air")
    land_c = sum(1 for n in nodes if n["side"] == "land")
    air_c = sum(1 for n in nodes if n["side"] == "air")
    assert air_c > 0, "空侧为空，判定失效"

    bbox = {}
    for f in meta["floors"].keys():
        xs = [n["x"] for n in nodes if n["floor"] == f]
        ys = [n["y"] for n in nodes if n["floor"] == f]
        bbox[f] = [min(xs), min(ys), max(xs), max(ys)]

    def js(obj, indent=2):
        return json.dumps(obj, ensure_ascii=False, indent=indent).replace("\n", "\n" + " " * 2)

    # ArkTS 禁用 Record / 无类型对象字面量（arkts-no-untyped-obj-literals）
    # -> 一切键值字典改为 Map<key,value> + 逐条 set()（官方推荐的容器形态）
    def map_src(name, kt, vt, d):
        lines = [f"export const {name}: Map<{kt}, {vt}> = new Map<{kt}, {vt}>();"]
        for k, v in d.items():
            lines.append(
                f"{name}.set({json.dumps(k, ensure_ascii=False)}, {json.dumps(v, ensure_ascii=False)});")
        return "\n".join(lines)

    nodes_src = js([{
        "id": n["id"], "name": n["name"], "type": n["type"], "floor": n["floor"],
        "x": n["x"], "y": n["y"], "side": n["side"],
    } for n in nodes])
    edges_src = js([{"from": e["from"], "to": e["to"], "type": e["type"], "weight": e["weight"]} for e in edges])
    node_en = {n["id"]: NAME_EN.get(n["name"], n["name"]) for n in nodes}

    body = f"""// ============================================================
// 星海国际机场 XHA · 端侧节点图模型（自动生成，请勿手改）
// 源文件: data/XHA_xinghai_t1.map.json（tools/gen_maps.py 产出）
// 再生成: python3 tools/gen_model.py
// 结构: {len(nodes)} 节点 / {len(edges)} 边 / 楼层 {list(meta["floors"])} /
//       唯一安检={sec_id}（割点，陆侧↔空侧唯一通路）
// ============================================================

export interface MapNode {{
  id: string;
  name: string;   // 中文名（数据源）
  type: string;   // entrance/checkin/security/gate/metro/...
  floor: string;  // 4F/3F/2F/1F/B1/B2
  x: number;      // 图片来源坐标系（pxPerMeter=2.0）
  y: number;
  side: string;   // land=陆侧 / air=空侧 / gate=安检咽喉
}}

export interface MapEdge {{
  from: string;
  to: string;
  type: string;    // walk/elevator/escalator/stair
  weight: number;  // 米
}}

export interface XhaMeta {{
  airport: string;
  name: string;
  pxPerMeter: number;
  version: string;
  date: string;
}}

export const XHA_META: XhaMeta = {{
  airport: '{meta['airport']}',
  name: '{meta['name']}',
  pxPerMeter: {meta['pxPerMeter']},
  version: '{meta.get('version', '')}',
  date: '{meta.get('date', '')}',
}};

export const SECURITY_ID = '{sec_id}';
export const PX_PER_METER = {meta['pxPerMeter']};

export const FLOOR_ORDER: string[] = {js(list(meta['floors'].keys()), 1)};
{map_src('FLOOR_LABELS', 'string', 'string', dict(meta['floors']))}
{map_src('FLOOR_LABELS_EN', 'string', 'string', FLOOR_EN)}
{map_src('FLOOR_BBOX', 'string', 'number[]', bbox)}
{map_src('NODE_EN', 'string', 'string', node_en)}

export const XHA_NODES: MapNode[] = {nodes_src};
export const XHA_EDGES: MapEdge[] = {edges_src};
"""
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(body)
    print(f"已生成 {OUT}")
    print(f"  节点 {len(nodes)}（land {land_c} / air {air_c} / gate 1）| 边 {len(edges)}")
    missing = sorted(n["name"] for n in nodes if n["name"] not in NAME_EN)
    if missing:
        print("⚠ 缺英译名称:", missing)


if __name__ == "__main__":
    main()