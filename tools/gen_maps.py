#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成机场节点图（拓扑数据）JSON
  - XHA : 星海国际机场 T1（虚构）

设计原则（与项目约定一致）：
  * 坐标 (x, y) 存在"图片来源坐标系"（每层各自一张背景图、各自独立坐标空间）。
  * 行走边(walk) 权重 = 欧氏像素距离 / pxPerMeter，四舍五入到 5 米。
  * 垂直边（电梯/扶梯）权重固定：elevator 30m, escalator 40m, stair 25m, apm 350m。
  * 每层电梯/扶梯的节点 id 不同（带楼层前缀），靠 vertical 边连接成"换层"。
  * 图为示意拓扑、非真实比例，不含任何云端/机票逻辑。
"""
import json
import math
import os

PX_PER_METER = 2.0  # 像素/米 校准常量：示意用，后面手绘示意图时可按真实感受调整

VERTICAL_WEIGHT = {"elevator": 30, "escalator": 40, "stair": 25, "apm": 350}

DATE = "2026-09-11"


def _dist(ax, ay, bx, by):
    return math.hypot(ax - bx, ay - by)


def build_map(spec):
    """把紧凑定义编译成标准 map JSON。"""
    nodes_list = []
    for floor, nodes in spec["nodes"].items():
        for (nid, name, ntype, x, y) in nodes:
            nodes_list.append({
                "id": nid, "name": name, "type": ntype, "floor": floor, "x": x, "y": y,
            })

    # 校验 id 唯一 & 边引用存在
    ids = {n["id"] for n in nodes_list}
    assert len(ids) == len(nodes_list), "存在重复节点 id"

    edges = []
    for (frm, to, etype) in spec["edges"]:
        assert frm in ids and to in ids, f"边引用不存在的节点: {frm}->{to}"
        pos = {n["id"]: n for n in nodes_list}
        if etype == "walk":
            a, b = pos[frm], pos[to]
            assert a["floor"] == b["floor"], f"walk 边跨层了: {frm}->{to}"
            raw = _dist(a["x"], a["y"], b["x"], b["y"]) / PX_PER_METER
            weight = max(10, int(round(raw / 5.0)) * 5)
        else:
            weight = VERTICAL_WEIGHT[etype]
        edges.append({"from": frm, "to": to, "type": etype, "weight": weight})

    # 无向边：A->B 与 B->A 视作重复，只保留一份（保证寻路无所谓，数据更干净）
    seen = set()
    dedup = []
    for e in edges:
        key = tuple(sorted([e["from"], e["to"]])) + (e["type"],)
        if key in seen:
            continue
        seen.add(key)
        dedup.append(e)

    floor_labels = spec["floor_labels"]
    meta = {
        "schema": 1,
        "airport": spec["airport"],
        "name": spec["name"],
        "pxPerMeter": PX_PER_METER,
        "floors": {f: floor_labels.get(f, f) for f in spec["floors"]},
        "version": "1.0",
        "date": DATE,
        "note": "示意拓扑，非真实比例；坐标 = 图片来源坐标系",
        "source": "根据公开布局示意重构，非官方数据",
    }
    node_types = sorted({n["type"] for n in nodes_list})
    edge_types = sorted({e["type"] for e in dedup})
    return {"meta": {**meta, "nodeTypes": node_types, "edgeTypes": edge_types},
            "nodes": nodes_list, "edges": dedup}


# ============================================================
# 星海国际机场 XHA（虚构）
# 连续六层主航站楼：4F 出发 / 3F 空侧候机夹层 / 2F 到达 / 1F 地面迎客 / B1 交通中心 / B2 地铁站台
# 骨架特点：唯一中央安检口（全部值机岛汇聚单点）是陆侧↔空侧唯一通路；免税/餐饮/贵宾等
# 商业均位于空侧（安检之后），寻路不会绕过安检大厅；A/B/C 三指廊共 24 个登机口、
# 两套垂直体系：空侧(4F↔3F 餐饮/贵宾/观景夹层，仅已安检旅客) 与 公共(4F↔2F↔1F↔B1；
# 3F 为纯空侧夹层、公共电梯/扶梯不停站，故公共梯跨 3F 直接连 4F↔2F)，
# 中庭观光电梯与无障碍电梯直通 B2 站台，地铁扶梯/楼梯/电梯三路接入地下，B2 双方向站台 + 联络通道。
# ============================================================
XHA = {
    "airport": "XHA",
    "name": "星海国际机场 主航站楼",
    "floors": ["4F", "3F", "2F", "1F", "B1", "B2"],
    "floor_labels": {"4F": "出发层", "3F": "空侧候机夹层", "2F": "到达层",
                     "1F": "地面迎客层", "B1": "交通中心", "B2": "地铁站台"},
    "nodes": {
        "4F": [
            # 陆侧：出发门
            ("xha_p4_doorW", "西出发门",       "entrance",  250,  60),
            ("xha_p4_doorN", "北出发门",       "entrance",  540,  60),
            ("xha_p4_doorE", "东出发门",       "entrance",  830,  60),
            # 陆侧：值机
            ("xha_p4_ckA",   "A岛值机(国际)", "checkin",   250, 150),
            ("xha_p4_ckB",   "B岛值机(国内)", "checkin",   430, 150),
            ("xha_p4_ckC",   "C岛值机(国内)", "checkin",   610, 150),
            ("xha_p4_ckD",   "D岛自助值机",   "checkin",   790, 150),
            # 唯一安检：所有值机岛汇入安检前大厅后过单点安检
            ("xha_p4_preSec", "安检前大厅",    "corridor", 540, 230),
            ("xha_p4_sec",    "中央安检大厅(唯一)", "security", 540, 310),
            ("xha_p4_airMall", "空侧免税商业区", "hall",    540, 400),
            ("xha_p4_rest",  "出发层洗手间",   "toilet",    370, 500),
            # 公共电梯（陆侧，贯通 4F↔2F↔1F↔B1，中庭观光电梯再下到 B2）
            ("xha_p4_liftW", "西区电梯",       "lift",      250, 240),
            ("xha_p4_liftC", "中庭观光电梯",   "lift",      620, 240),
            ("xha_p4_liftE", "东区电梯",       "lift",      830, 240),
            # 空侧垂直（4F↔3F 候机夹层专用）
            ("xha_p4_liftWSl", "空侧西电梯",  "lift",      230, 470),
            ("xha_p4_liftCSl", "空侧中庭电梯",  "lift",      540, 480),
            ("xha_p4_liftESl", "空侧东电梯",  "lift",      850, 470),
            ("xha_p4_escY",  "空侧扶梯组",     "escalator", 470, 540),
            ("xha_p4_stairY","空侧楼梯",       "stair",     650, 540),
            # 空侧：A 指廊
            ("xha_p4_a0",    "A指廊北口",      "corridor",  250, 560),
            ("xha_p4_a1",    "A指廊中段",      "corridor",  250, 650),
            ("xha_p4_a2",    "A指廊中后段",    "corridor",  250, 740),
            ("xha_p4_a3",    "A指廊南端",      "corridor",  250, 820),
            # 空侧：B 指廊
            ("xha_p4_b0",    "B指廊北口",      "corridor",  540, 560),
            ("xha_p4_b1",    "B指廊中段",      "corridor",  540, 650),
            ("xha_p4_b2",    "B指廊中后段",    "corridor",  540, 740),
            ("xha_p4_b3",    "B指廊南端",      "corridor",  540, 820),
            # 空侧：C 指廊
            ("xha_p4_c0",    "C指廊北口",      "corridor",  830, 560),
            ("xha_p4_c1",    "C指廊中段",      "corridor",  830, 650),
            ("xha_p4_c2",    "C指廊中后段",    "corridor",  830, 740),
            ("xha_p4_c3",    "C指廊南端",      "corridor",  830, 820),
            # 登机口（A 指廊）
            ("xha_p4_gA101", "登机口A101", "gate", 130, 560),
            ("xha_p4_gA102", "登机口A102", "gate", 370, 560),
            ("xha_p4_gA103", "登机口A103", "gate", 130, 650),
            ("xha_p4_gA104", "登机口A104", "gate", 370, 650),
            ("xha_p4_gA105", "登机口A105", "gate", 130, 740),
            ("xha_p4_gA106", "登机口A106", "gate", 370, 740),
            ("xha_p4_gA107", "登机口A107", "gate", 130, 820),
            ("xha_p4_gA108", "登机口A108", "gate", 370, 820),
            # 登机口（B 指廊）
            ("xha_p4_gB201", "登机口B201", "gate", 420, 560),
            ("xha_p4_gB202", "登机口B202", "gate", 660, 560),
            ("xha_p4_gB203", "登机口B203", "gate", 420, 650),
            ("xha_p4_gB204", "登机口B204", "gate", 660, 650),
            ("xha_p4_gB205", "登机口B205", "gate", 420, 740),
            ("xha_p4_gB206", "登机口B206", "gate", 660, 740),
            ("xha_p4_gB207", "登机口B207", "gate", 420, 820),
            ("xha_p4_gB208", "登机口B208", "gate", 660, 820),
            # 登机口（C 指廊）
            ("xha_p4_gC301", "登机口C301", "gate", 710, 560),
            ("xha_p4_gC302", "登机口C302", "gate", 950, 560),
            ("xha_p4_gC303", "登机口C303", "gate", 710, 650),
            ("xha_p4_gC304", "登机口C304", "gate", 950, 650),
            ("xha_p4_gC305", "登机口C305", "gate", 710, 740),
            ("xha_p4_gC306", "登机口C306", "gate", 950, 740),
            ("xha_p4_gC307", "登机口C307", "gate", 710, 820),
            ("xha_p4_gC308", "登机口C308", "gate", 950, 820),
        ],
        "3F": [
            # 空侧候机夹层：仅供已过安检的出发旅客使用（4F 空侧 ↔ 3F）
            ("xha_p3_mezz",   "夹层中央厅",       "hall",      540, 400),
            ("xha_p3_food",   "空侧餐饮区",       "hall",      340, 300),
            ("xha_p3_deck",   "观景露台",         "corridor",  540, 140),
            ("xha_p3_loungeA","贵宾休息室A",      "hall",      760, 270),
            ("xha_p3_loungeB","贵宾休息室B",      "hall",      760, 520),
            ("xha_p3_kids",   "亲子游乐区",       "corridor",  260, 520),
            ("xha_p3_rest3",  "洗手间",           "toilet",    420, 540),
            ("xha_p3_liftWSl","空侧西电梯",    "lift",      250, 440),
            ("xha_p3_liftCSl","空侧中庭电梯",    "lift",      540, 480),
            ("xha_p3_liftESl","空侧东电梯",    "lift",      830, 440),
            ("xha_p3_escY",   "空侧扶梯组",       "escalator", 470, 560),
            ("xha_p3_stairY", "空侧楼梯",         "stair",     650, 560),
        ],
        "2F": [
            # 到达廊（与出发指廊同柱网）
            ("xha_p2_aw0", "西到达廊北口", "corridor",  250, 300),
            ("xha_p2_aw1", "西到达廊中段", "corridor",  250, 430),
            ("xha_p2_aw2", "西到达廊南端", "corridor",  250, 560),
            ("xha_p2_ac0", "中到达廊北口", "corridor",  540, 300),
            ("xha_p2_ac1", "中到达廊中段", "corridor",  540, 430),
            ("xha_p2_ac2", "中到达廊南端", "corridor",  540, 560),
            ("xha_p2_ae0", "东到达廊北口", "corridor",  830, 300),
            ("xha_p2_ae1", "东到达廊中段", "corridor",  830, 430),
            ("xha_p2_ae2", "东到达廊南端", "corridor",  830, 560),
            # 到达层厅堂
            ("xha_p2_bagA",   "行李提取A区",   "baggage",  380, 190),
            ("xha_p2_bagB",   "行李提取B区",   "baggage",  700, 190),
            ("xha_p2_arrHall","中央到达大厅",  "hall",     540, 230),
            ("xha_p2_exitN",  "主到达出口",    "exit",     540, 110),
            ("xha_p2_exitW",  "西到达出口",    "exit",     250, 110),
            ("xha_p2_exitE",  "东到达出口",    "exit",     830, 110),
            ("xha_p2_rest2",  "到达层洗手间",  "toilet",   620, 460),
            # 公共垂直（与 4F/1F/B1 同井道）
            ("xha_p2_liftW", "西区电梯",      "lift",      250, 420),
            ("xha_p2_liftC", "中庭观光电梯",  "lift",      540, 380),
            ("xha_p2_liftE", "东区电梯",      "lift",      830, 420),
            ("xha_p2_escC",  "中央扶梯组",    "escalator", 540, 470),
            ("xha_p2_stairC","中庭楼梯",      "stair",     450, 470),
        ],
        "1F": [
            # 地面迎客层：出租车/网约车、机场巴士、商业与跨楼连廊
            ("xha_p1_lobby", "迎客·到达大厅",  "hall",      540, 300),
            ("xha_p1_taxi",  "出租·网约上车点", "coach",    260, 160),
            ("xha_p1_bus",   "机场巴士站台",   "coach",     820, 160),
            ("xha_p1_luggage", "行李寄存处",   "corridor",  400, 480),
            ("xha_p1_linkG", "航站楼间连廊",   "corridor",  700, 480),
            ("xha_p1_rest1", "洗手间",         "toilet",    540, 460),
            ("xha_p1_liftW", "西区电梯",       "lift",      250, 420),
            ("xha_p1_liftC", "中庭观光电梯",   "lift",      540, 430),
            ("xha_p1_liftE", "东区电梯",       "lift",      830, 420),
            ("xha_p1_escC",  "中央扶梯组",     "escalator", 470, 560),
            ("xha_p1_stairC","中庭楼梯",       "stair",     620, 560),
        ],
        "B1": [
            ("xha_b1_gtc",    "交通中心大厅",       "hall",      540, 260),
            ("xha_b1_metroL", "地铁站厅(非付费区)", "hall",      380, 300),
            ("xha_b1_metroG", "地铁闸机群",         "corridor",  380, 360),
            ("xha_b1_coachC", "机场大巴·长途站",    "coach",     150, 300),
            ("xha_b1_taxiH",  "出租车·网约车候车区", "coach",    880, 300),
            ("xha_b1_park",   "P1停车楼",           "parking",   700, 440),
            ("xha_b1_restB",  "洗手间",             "toilet",    540, 150),
            ("xha_b1_liftW",  "西区电梯",           "lift",      260, 400),
            ("xha_b1_liftC",  "中庭观光电梯",       "lift",      540, 400),
            ("xha_b1_liftE",  "东区电梯",           "lift",      800, 400),
            ("xha_b1_escC",   "中央扶梯组",         "escalator", 540, 340),
            ("xha_b1_escM",   "地铁扶梯",           "escalator", 380, 440),
            ("xha_b1_stairC", "中庭楼梯",           "stair",     620, 300),
            ("xha_b1_stairM", "地铁楼梯",           "stair",     620, 470),
        ],
        "B2": [
            ("xha_b2_escM",  "地铁扶梯",     "escalator", 360, 420),
            ("xha_b2_stairM","地铁楼梯",     "stair",     620, 420),
            ("xha_b2_pasg",  "站台联络通道", "corridor",  500, 360),
            ("xha_b2_platA", "站台·往市区方向", "metro",  300, 260),
            ("xha_b2_platB", "站台·往星湖度假区", "metro", 700, 260),
            ("xha_b2_liftC", "中庭观光电梯", "lift",      500, 180),
        ],
    },
    "edges": [
        # ---- 4F 出发层 ----
        ("xha_p4_doorW", "xha_p4_ckA", "walk"),
        ("xha_p4_doorN", "xha_p4_ckB", "walk"),
        ("xha_p4_doorN", "xha_p4_ckC", "walk"),
        ("xha_p4_doorE", "xha_p4_ckD", "walk"),
        ("xha_p4_liftW", "xha_p4_ckA", "walk"),
        ("xha_p4_liftC", "xha_p4_preSec", "walk"),
        ("xha_p4_liftE", "xha_p4_ckD", "walk"),
        ("xha_p4_ckA", "xha_p4_preSec", "walk"),
        ("xha_p4_ckB", "xha_p4_preSec", "walk"),
        ("xha_p4_ckC", "xha_p4_preSec", "walk"),
        ("xha_p4_ckD", "xha_p4_preSec", "walk"),
        ("xha_p4_preSec", "xha_p4_sec", "walk"),
        ("xha_p4_sec", "xha_p4_airMall", "walk"),
        ("xha_p4_airMall", "xha_p4_liftWSl", "walk"),
        ("xha_p4_airMall", "xha_p4_liftCSl", "walk"),
        ("xha_p4_airMall", "xha_p4_liftESl", "walk"),
        ("xha_p4_airMall", "xha_p4_escY", "walk"),
        ("xha_p4_airMall", "xha_p4_stairY", "walk"),
        ("xha_p4_airMall", "xha_p4_a0", "walk"),
        ("xha_p4_airMall", "xha_p4_b0", "walk"),
        ("xha_p4_airMall", "xha_p4_c0", "walk"),
        ("xha_p4_liftWSl", "xha_p4_a0", "walk"),
        ("xha_p4_liftESl", "xha_p4_c0", "walk"),
        ("xha_p4_stairY", "xha_p4_b0", "walk"),
        ("xha_p4_rest", "xha_p4_b0", "walk"),
        ("xha_p4_a0", "xha_p4_a1", "walk"),
        ("xha_p4_a1", "xha_p4_a2", "walk"),
        ("xha_p4_a2", "xha_p4_a3", "walk"),
        ("xha_p4_b0", "xha_p4_b1", "walk"),
        ("xha_p4_b1", "xha_p4_b2", "walk"),
        ("xha_p4_b2", "xha_p4_b3", "walk"),
        ("xha_p4_c0", "xha_p4_c1", "walk"),
        ("xha_p4_c1", "xha_p4_c2", "walk"),
        ("xha_p4_c2", "xha_p4_c3", "walk"),
        ("xha_p4_gA101", "xha_p4_a0", "walk"),
        ("xha_p4_gA102", "xha_p4_a0", "walk"),
        ("xha_p4_gA103", "xha_p4_a1", "walk"),
        ("xha_p4_gA104", "xha_p4_a1", "walk"),
        ("xha_p4_gA105", "xha_p4_a2", "walk"),
        ("xha_p4_gA106", "xha_p4_a2", "walk"),
        ("xha_p4_gA107", "xha_p4_a3", "walk"),
        ("xha_p4_gA108", "xha_p4_a3", "walk"),
        ("xha_p4_gB201", "xha_p4_b0", "walk"),
        ("xha_p4_gB202", "xha_p4_b0", "walk"),
        ("xha_p4_gB203", "xha_p4_b1", "walk"),
        ("xha_p4_gB204", "xha_p4_b1", "walk"),
        ("xha_p4_gB205", "xha_p4_b2", "walk"),
        ("xha_p4_gB206", "xha_p4_b2", "walk"),
        ("xha_p4_gB207", "xha_p4_b3", "walk"),
        ("xha_p4_gB208", "xha_p4_b3", "walk"),
        ("xha_p4_gC301", "xha_p4_c0", "walk"),
        ("xha_p4_gC302", "xha_p4_c0", "walk"),
        ("xha_p4_gC303", "xha_p4_c1", "walk"),
        ("xha_p4_gC304", "xha_p4_c1", "walk"),
        ("xha_p4_gC305", "xha_p4_c2", "walk"),
        ("xha_p4_gC306", "xha_p4_c2", "walk"),
        ("xha_p4_gC307", "xha_p4_c3", "walk"),
        ("xha_p4_gC308", "xha_p4_c3", "walk"),
        # ---- 3F 空侧候机夹层 ----
        ("xha_p3_mezz", "xha_p3_food", "walk"),
        ("xha_p3_mezz", "xha_p3_deck", "walk"),
        ("xha_p3_mezz", "xha_p3_loungeA", "walk"),
        ("xha_p3_mezz", "xha_p3_loungeB", "walk"),
        ("xha_p3_mezz", "xha_p3_kids", "walk"),
        ("xha_p3_mezz", "xha_p3_rest3", "walk"),
        ("xha_p3_mezz", "xha_p3_liftWSl", "walk"),
        ("xha_p3_mezz", "xha_p3_liftCSl", "walk"),
        ("xha_p3_mezz", "xha_p3_liftESl", "walk"),
        ("xha_p3_mezz", "xha_p3_escY", "walk"),
        ("xha_p3_mezz", "xha_p3_stairY", "walk"),
        # ---- 2F 到达层 ----
        ("xha_p2_aw0", "xha_p2_aw1", "walk"),
        ("xha_p2_aw1", "xha_p2_aw2", "walk"),
        ("xha_p2_ac0", "xha_p2_ac1", "walk"),
        ("xha_p2_ac1", "xha_p2_ac2", "walk"),
        ("xha_p2_ae0", "xha_p2_ae1", "walk"),
        ("xha_p2_ae1", "xha_p2_ae2", "walk"),
        ("xha_p2_aw0", "xha_p2_bagA", "walk"),
        ("xha_p2_ac0", "xha_p2_arrHall", "walk"),
        ("xha_p2_ae0", "xha_p2_bagB", "walk"),
        ("xha_p2_bagA", "xha_p2_arrHall", "walk"),
        ("xha_p2_bagB", "xha_p2_arrHall", "walk"),
        ("xha_p2_bagA", "xha_p2_exitW", "walk"),
        ("xha_p2_bagB", "xha_p2_exitE", "walk"),
        ("xha_p2_arrHall", "xha_p2_exitN", "walk"),
        ("xha_p2_arrHall", "xha_p2_liftC", "walk"),
        ("xha_p2_arrHall", "xha_p2_escC", "walk"),
        ("xha_p2_arrHall", "xha_p2_stairC", "walk"),
        ("xha_p2_arrHall", "xha_p2_rest2", "walk"),
        ("xha_p2_bagA", "xha_p2_liftW", "walk"),
        ("xha_p2_liftW", "xha_p2_aw0", "walk"),
        ("xha_p2_bagB", "xha_p2_liftE", "walk"),
        ("xha_p2_liftE", "xha_p2_ae0", "walk"),
        ("xha_p2_escC", "xha_p2_ac0", "walk"),
        # ---- 1F 地面迎客层 ----
        ("xha_p1_lobby", "xha_p1_taxi", "walk"),
        ("xha_p1_lobby", "xha_p1_bus", "walk"),
        ("xha_p1_lobby", "xha_p1_luggage", "walk"),
        ("xha_p1_lobby", "xha_p1_linkG", "walk"),
        ("xha_p1_lobby", "xha_p1_rest1", "walk"),
        ("xha_p1_lobby", "xha_p1_liftW", "walk"),
        ("xha_p1_lobby", "xha_p1_liftC", "walk"),
        ("xha_p1_lobby", "xha_p1_liftE", "walk"),
        ("xha_p1_lobby", "xha_p1_escC", "walk"),
        ("xha_p1_lobby", "xha_p1_stairC", "walk"),
        ("xha_p1_luggage", "xha_p1_linkG", "walk"),
        # ---- B1 交通中心 ----
        ("xha_b1_liftW", "xha_b1_gtc", "walk"),
        ("xha_b1_liftC", "xha_b1_gtc", "walk"),
        ("xha_b1_liftE", "xha_b1_gtc", "walk"),
        ("xha_b1_escC", "xha_b1_gtc", "walk"),
        ("xha_b1_stairC", "xha_b1_gtc", "walk"),
        ("xha_b1_gtc", "xha_b1_coachC", "walk"),
        ("xha_b1_gtc", "xha_b1_taxiH", "walk"),
        ("xha_b1_gtc", "xha_b1_park", "walk"),
        ("xha_b1_gtc", "xha_b1_restB", "walk"),
        ("xha_b1_gtc", "xha_b1_metroL", "walk"),
        ("xha_b1_metroL", "xha_b1_metroG", "walk"),
        ("xha_b1_metroG", "xha_b1_escM", "walk"),
        ("xha_b1_metroG", "xha_b1_stairM", "walk"),
        ("xha_b1_metroG", "xha_b1_liftC", "walk"),
        # ---- B2 地铁站台 ----
        ("xha_b2_escM", "xha_b2_platA", "walk"),
        ("xha_b2_escM", "xha_b2_pasg", "walk"),
        ("xha_b2_stairM", "xha_b2_platB", "walk"),
        ("xha_b2_stairM", "xha_b2_pasg", "walk"),
        ("xha_b2_pasg", "xha_b2_platA", "walk"),
        ("xha_b2_pasg", "xha_b2_platB", "walk"),
        ("xha_b2_liftC", "xha_b2_pasg", "walk"),
        # ---- 垂直：空侧（4F↔3F） ----
        ("xha_p4_liftWSl", "xha_p3_liftWSl", "elevator"),
        ("xha_p4_liftCSl", "xha_p3_liftCSl", "elevator"),
        ("xha_p4_liftESl", "xha_p3_liftESl", "elevator"),
        ("xha_p4_escY", "xha_p3_escY", "escalator"),
        ("xha_p4_stairY", "xha_p3_stairY", "stair"),
        # ---- 垂直：公共（4F↔2F↔1F↔B1↔B2） ----
        ("xha_p4_liftW", "xha_p2_liftW", "elevator"),
        ("xha_p2_liftW", "xha_p1_liftW", "elevator"),
        ("xha_p1_liftW", "xha_b1_liftW", "elevator"),
        ("xha_p4_liftC", "xha_p2_liftC", "elevator"),
        ("xha_p2_liftC", "xha_p1_liftC", "elevator"),
        ("xha_p1_liftC", "xha_b1_liftC", "elevator"),
        ("xha_b1_liftC", "xha_b2_liftC", "elevator"),
        ("xha_p4_liftE", "xha_p2_liftE", "elevator"),
        ("xha_p2_liftE", "xha_p1_liftE", "elevator"),
        ("xha_p1_liftE", "xha_b1_liftE", "elevator"),
        ("xha_p2_escC", "xha_p1_escC", "escalator"),
        ("xha_p1_escC", "xha_b1_escC", "escalator"),
        ("xha_p2_stairC", "xha_p1_stairC", "stair"),
        ("xha_p1_stairC", "xha_b1_stairC", "stair"),
        ("xha_b1_escM", "xha_b2_escM", "escalator"),
        ("xha_b1_stairM", "xha_b2_stairM", "stair"),
    ],
}



def main():
    out = os.path.join(os.path.dirname(__file__), "..", "data")
    os.makedirs(out, exist_ok=True)
    for spec, fname in ((XHA, "XHA_xinghai_t1.map.json"),):
        m = build_map(spec)
        path = os.path.join(out, fname)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(m, f, ensure_ascii=False, indent=2)
        floors = {}
        for n in m["nodes"]:
            floors[n["floor"]] = floors.get(n["floor"], 0) + 1
        walk = sum(1 for e in m["edges"] if e["type"] == "walk")
        vertical = len(m["edges"]) - walk
        print(f"{spec['name']}: 节点 {len(m['nodes'])} | 边 {len(m['edges'])} (walk {walk} / 垂直+捷运 {vertical}) | 各层 {floors} -> {path}")


if __name__ == "__main__":
    main()