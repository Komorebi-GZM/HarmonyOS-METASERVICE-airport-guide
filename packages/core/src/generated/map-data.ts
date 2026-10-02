// ============================================================
// 本文件由 tools/export_shared.py 自动生成，请勿手改。
// 真源：data/XHA_xinghai_t1.map.json
// 重新生成：python3 tools/export_shared.py
// ============================================================
// 源 JSON 的 SHA-256：a61d3d22cde1d320533c07d9a8f692dcf707110ca7f950a5de4f2913febbb256
// 节点 119 / 边 145 / 楼层 4F/3F/2F/1F/B1/B2

import type { RawAirportMap } from '../types.ts';

export const MAP_SHA256 = "a61d3d22cde1d320533c07d9a8f692dcf707110ca7f950a5de4f2913febbb256";

export const MAP_RAW: RawAirportMap = {
  "meta": {
    "schema": 1,
    "airport": "XHA",
    "name": "星海国际机场 主航站楼",
    "pxPerMeter": 2.0,
    "floors": {
      "4F": "出发层",
      "3F": "空侧候机夹层",
      "2F": "到达层",
      "1F": "地面迎客层",
      "B1": "交通中心",
      "B2": "地铁站台"
    },
    "version": "1.0",
    "date": "2026-09-11",
    "note": "示意拓扑，非真实比例；坐标 = 图片来源坐标系",
    "source": "根据公开布局示意重构，非官方数据",
    "nodeTypes": [
      "baggage",
      "checkin",
      "coach",
      "corridor",
      "entrance",
      "escalator",
      "exit",
      "gate",
      "hall",
      "lift",
      "metro",
      "parking",
      "security",
      "stair",
      "toilet"
    ],
    "edgeTypes": [
      "elevator",
      "escalator",
      "stair",
      "walk"
    ]
  },
  "nodes": [
    {
      "id": "xha_p4_doorW",
      "name": "西出发门",
      "type": "entrance",
      "floor": "4F",
      "x": 250,
      "y": 60
    },
    {
      "id": "xha_p4_doorN",
      "name": "北出发门",
      "type": "entrance",
      "floor": "4F",
      "x": 540,
      "y": 60
    },
    {
      "id": "xha_p4_doorE",
      "name": "东出发门",
      "type": "entrance",
      "floor": "4F",
      "x": 830,
      "y": 60
    },
    {
      "id": "xha_p4_ckA",
      "name": "A岛值机(国际)",
      "type": "checkin",
      "floor": "4F",
      "x": 250,
      "y": 150
    },
    {
      "id": "xha_p4_ckB",
      "name": "B岛值机(国内)",
      "type": "checkin",
      "floor": "4F",
      "x": 430,
      "y": 150
    },
    {
      "id": "xha_p4_ckC",
      "name": "C岛值机(国内)",
      "type": "checkin",
      "floor": "4F",
      "x": 610,
      "y": 150
    },
    {
      "id": "xha_p4_ckD",
      "name": "D岛自助值机",
      "type": "checkin",
      "floor": "4F",
      "x": 790,
      "y": 150
    },
    {
      "id": "xha_p4_preSec",
      "name": "安检前大厅",
      "type": "corridor",
      "floor": "4F",
      "x": 540,
      "y": 230
    },
    {
      "id": "xha_p4_sec",
      "name": "中央安检大厅(唯一)",
      "type": "security",
      "floor": "4F",
      "x": 540,
      "y": 310
    },
    {
      "id": "xha_p4_airMall",
      "name": "空侧免税商业区",
      "type": "hall",
      "floor": "4F",
      "x": 540,
      "y": 400
    },
    {
      "id": "xha_p4_rest",
      "name": "出发层洗手间",
      "type": "toilet",
      "floor": "4F",
      "x": 370,
      "y": 500
    },
    {
      "id": "xha_p4_liftW",
      "name": "西区电梯",
      "type": "lift",
      "floor": "4F",
      "x": 250,
      "y": 240
    },
    {
      "id": "xha_p4_liftC",
      "name": "中庭观光电梯",
      "type": "lift",
      "floor": "4F",
      "x": 620,
      "y": 240
    },
    {
      "id": "xha_p4_liftE",
      "name": "东区电梯",
      "type": "lift",
      "floor": "4F",
      "x": 830,
      "y": 240
    },
    {
      "id": "xha_p4_liftWSl",
      "name": "空侧西电梯",
      "type": "lift",
      "floor": "4F",
      "x": 230,
      "y": 470
    },
    {
      "id": "xha_p4_liftCSl",
      "name": "空侧中庭电梯",
      "type": "lift",
      "floor": "4F",
      "x": 540,
      "y": 480
    },
    {
      "id": "xha_p4_liftESl",
      "name": "空侧东电梯",
      "type": "lift",
      "floor": "4F",
      "x": 850,
      "y": 470
    },
    {
      "id": "xha_p4_escY",
      "name": "空侧扶梯组",
      "type": "escalator",
      "floor": "4F",
      "x": 470,
      "y": 540
    },
    {
      "id": "xha_p4_stairY",
      "name": "空侧楼梯",
      "type": "stair",
      "floor": "4F",
      "x": 650,
      "y": 540
    },
    {
      "id": "xha_p4_a0",
      "name": "A指廊北口",
      "type": "corridor",
      "floor": "4F",
      "x": 250,
      "y": 560
    },
    {
      "id": "xha_p4_a1",
      "name": "A指廊中段",
      "type": "corridor",
      "floor": "4F",
      "x": 250,
      "y": 650
    },
    {
      "id": "xha_p4_a2",
      "name": "A指廊中后段",
      "type": "corridor",
      "floor": "4F",
      "x": 250,
      "y": 740
    },
    {
      "id": "xha_p4_a3",
      "name": "A指廊南端",
      "type": "corridor",
      "floor": "4F",
      "x": 250,
      "y": 820
    },
    {
      "id": "xha_p4_b0",
      "name": "B指廊北口",
      "type": "corridor",
      "floor": "4F",
      "x": 540,
      "y": 560
    },
    {
      "id": "xha_p4_b1",
      "name": "B指廊中段",
      "type": "corridor",
      "floor": "4F",
      "x": 540,
      "y": 650
    },
    {
      "id": "xha_p4_b2",
      "name": "B指廊中后段",
      "type": "corridor",
      "floor": "4F",
      "x": 540,
      "y": 740
    },
    {
      "id": "xha_p4_b3",
      "name": "B指廊南端",
      "type": "corridor",
      "floor": "4F",
      "x": 540,
      "y": 820
    },
    {
      "id": "xha_p4_c0",
      "name": "C指廊北口",
      "type": "corridor",
      "floor": "4F",
      "x": 830,
      "y": 560
    },
    {
      "id": "xha_p4_c1",
      "name": "C指廊中段",
      "type": "corridor",
      "floor": "4F",
      "x": 830,
      "y": 650
    },
    {
      "id": "xha_p4_c2",
      "name": "C指廊中后段",
      "type": "corridor",
      "floor": "4F",
      "x": 830,
      "y": 740
    },
    {
      "id": "xha_p4_c3",
      "name": "C指廊南端",
      "type": "corridor",
      "floor": "4F",
      "x": 830,
      "y": 820
    },
    {
      "id": "xha_p4_gA101",
      "name": "登机口A101",
      "type": "gate",
      "floor": "4F",
      "x": 130,
      "y": 560
    },
    {
      "id": "xha_p4_gA102",
      "name": "登机口A102",
      "type": "gate",
      "floor": "4F",
      "x": 370,
      "y": 560
    },
    {
      "id": "xha_p4_gA103",
      "name": "登机口A103",
      "type": "gate",
      "floor": "4F",
      "x": 130,
      "y": 650
    },
    {
      "id": "xha_p4_gA104",
      "name": "登机口A104",
      "type": "gate",
      "floor": "4F",
      "x": 370,
      "y": 650
    },
    {
      "id": "xha_p4_gA105",
      "name": "登机口A105",
      "type": "gate",
      "floor": "4F",
      "x": 130,
      "y": 740
    },
    {
      "id": "xha_p4_gA106",
      "name": "登机口A106",
      "type": "gate",
      "floor": "4F",
      "x": 370,
      "y": 740
    },
    {
      "id": "xha_p4_gA107",
      "name": "登机口A107",
      "type": "gate",
      "floor": "4F",
      "x": 130,
      "y": 820
    },
    {
      "id": "xha_p4_gA108",
      "name": "登机口A108",
      "type": "gate",
      "floor": "4F",
      "x": 370,
      "y": 820
    },
    {
      "id": "xha_p4_gB201",
      "name": "登机口B201",
      "type": "gate",
      "floor": "4F",
      "x": 420,
      "y": 560
    },
    {
      "id": "xha_p4_gB202",
      "name": "登机口B202",
      "type": "gate",
      "floor": "4F",
      "x": 660,
      "y": 560
    },
    {
      "id": "xha_p4_gB203",
      "name": "登机口B203",
      "type": "gate",
      "floor": "4F",
      "x": 420,
      "y": 650
    },
    {
      "id": "xha_p4_gB204",
      "name": "登机口B204",
      "type": "gate",
      "floor": "4F",
      "x": 660,
      "y": 650
    },
    {
      "id": "xha_p4_gB205",
      "name": "登机口B205",
      "type": "gate",
      "floor": "4F",
      "x": 420,
      "y": 740
    },
    {
      "id": "xha_p4_gB206",
      "name": "登机口B206",
      "type": "gate",
      "floor": "4F",
      "x": 660,
      "y": 740
    },
    {
      "id": "xha_p4_gB207",
      "name": "登机口B207",
      "type": "gate",
      "floor": "4F",
      "x": 420,
      "y": 820
    },
    {
      "id": "xha_p4_gB208",
      "name": "登机口B208",
      "type": "gate",
      "floor": "4F",
      "x": 660,
      "y": 820
    },
    {
      "id": "xha_p4_gC301",
      "name": "登机口C301",
      "type": "gate",
      "floor": "4F",
      "x": 710,
      "y": 560
    },
    {
      "id": "xha_p4_gC302",
      "name": "登机口C302",
      "type": "gate",
      "floor": "4F",
      "x": 950,
      "y": 560
    },
    {
      "id": "xha_p4_gC303",
      "name": "登机口C303",
      "type": "gate",
      "floor": "4F",
      "x": 710,
      "y": 650
    },
    {
      "id": "xha_p4_gC304",
      "name": "登机口C304",
      "type": "gate",
      "floor": "4F",
      "x": 950,
      "y": 650
    },
    {
      "id": "xha_p4_gC305",
      "name": "登机口C305",
      "type": "gate",
      "floor": "4F",
      "x": 710,
      "y": 740
    },
    {
      "id": "xha_p4_gC306",
      "name": "登机口C306",
      "type": "gate",
      "floor": "4F",
      "x": 950,
      "y": 740
    },
    {
      "id": "xha_p4_gC307",
      "name": "登机口C307",
      "type": "gate",
      "floor": "4F",
      "x": 710,
      "y": 820
    },
    {
      "id": "xha_p4_gC308",
      "name": "登机口C308",
      "type": "gate",
      "floor": "4F",
      "x": 950,
      "y": 820
    },
    {
      "id": "xha_p3_mezz",
      "name": "夹层中央厅",
      "type": "hall",
      "floor": "3F",
      "x": 540,
      "y": 400
    },
    {
      "id": "xha_p3_food",
      "name": "空侧餐饮区",
      "type": "hall",
      "floor": "3F",
      "x": 340,
      "y": 300
    },
    {
      "id": "xha_p3_deck",
      "name": "观景露台",
      "type": "corridor",
      "floor": "3F",
      "x": 540,
      "y": 140
    },
    {
      "id": "xha_p3_loungeA",
      "name": "贵宾休息室A",
      "type": "hall",
      "floor": "3F",
      "x": 760,
      "y": 270
    },
    {
      "id": "xha_p3_loungeB",
      "name": "贵宾休息室B",
      "type": "hall",
      "floor": "3F",
      "x": 760,
      "y": 520
    },
    {
      "id": "xha_p3_kids",
      "name": "亲子游乐区",
      "type": "corridor",
      "floor": "3F",
      "x": 260,
      "y": 520
    },
    {
      "id": "xha_p3_rest3",
      "name": "洗手间",
      "type": "toilet",
      "floor": "3F",
      "x": 420,
      "y": 540
    },
    {
      "id": "xha_p3_liftWSl",
      "name": "空侧西电梯",
      "type": "lift",
      "floor": "3F",
      "x": 250,
      "y": 440
    },
    {
      "id": "xha_p3_liftCSl",
      "name": "空侧中庭电梯",
      "type": "lift",
      "floor": "3F",
      "x": 540,
      "y": 480
    },
    {
      "id": "xha_p3_liftESl",
      "name": "空侧东电梯",
      "type": "lift",
      "floor": "3F",
      "x": 830,
      "y": 440
    },
    {
      "id": "xha_p3_escY",
      "name": "空侧扶梯组",
      "type": "escalator",
      "floor": "3F",
      "x": 470,
      "y": 560
    },
    {
      "id": "xha_p3_stairY",
      "name": "空侧楼梯",
      "type": "stair",
      "floor": "3F",
      "x": 650,
      "y": 560
    },
    {
      "id": "xha_p2_aw0",
      "name": "西到达廊北口",
      "type": "corridor",
      "floor": "2F",
      "x": 250,
      "y": 300
    },
    {
      "id": "xha_p2_aw1",
      "name": "西到达廊中段",
      "type": "corridor",
      "floor": "2F",
      "x": 250,
      "y": 430
    },
    {
      "id": "xha_p2_aw2",
      "name": "西到达廊南端",
      "type": "corridor",
      "floor": "2F",
      "x": 250,
      "y": 560
    },
    {
      "id": "xha_p2_ac0",
      "name": "中到达廊北口",
      "type": "corridor",
      "floor": "2F",
      "x": 540,
      "y": 300
    },
    {
      "id": "xha_p2_ac1",
      "name": "中到达廊中段",
      "type": "corridor",
      "floor": "2F",
      "x": 540,
      "y": 430
    },
    {
      "id": "xha_p2_ac2",
      "name": "中到达廊南端",
      "type": "corridor",
      "floor": "2F",
      "x": 540,
      "y": 560
    },
    {
      "id": "xha_p2_ae0",
      "name": "东到达廊北口",
      "type": "corridor",
      "floor": "2F",
      "x": 830,
      "y": 300
    },
    {
      "id": "xha_p2_ae1",
      "name": "东到达廊中段",
      "type": "corridor",
      "floor": "2F",
      "x": 830,
      "y": 430
    },
    {
      "id": "xha_p2_ae2",
      "name": "东到达廊南端",
      "type": "corridor",
      "floor": "2F",
      "x": 830,
      "y": 560
    },
    {
      "id": "xha_p2_bagA",
      "name": "行李提取A区",
      "type": "baggage",
      "floor": "2F",
      "x": 380,
      "y": 190
    },
    {
      "id": "xha_p2_bagB",
      "name": "行李提取B区",
      "type": "baggage",
      "floor": "2F",
      "x": 700,
      "y": 190
    },
    {
      "id": "xha_p2_arrHall",
      "name": "中央到达大厅",
      "type": "hall",
      "floor": "2F",
      "x": 540,
      "y": 230
    },
    {
      "id": "xha_p2_exitN",
      "name": "主到达出口",
      "type": "exit",
      "floor": "2F",
      "x": 540,
      "y": 110
    },
    {
      "id": "xha_p2_exitW",
      "name": "西到达出口",
      "type": "exit",
      "floor": "2F",
      "x": 250,
      "y": 110
    },
    {
      "id": "xha_p2_exitE",
      "name": "东到达出口",
      "type": "exit",
      "floor": "2F",
      "x": 830,
      "y": 110
    },
    {
      "id": "xha_p2_rest2",
      "name": "到达层洗手间",
      "type": "toilet",
      "floor": "2F",
      "x": 620,
      "y": 460
    },
    {
      "id": "xha_p2_liftW",
      "name": "西区电梯",
      "type": "lift",
      "floor": "2F",
      "x": 250,
      "y": 420
    },
    {
      "id": "xha_p2_liftC",
      "name": "中庭观光电梯",
      "type": "lift",
      "floor": "2F",
      "x": 540,
      "y": 380
    },
    {
      "id": "xha_p2_liftE",
      "name": "东区电梯",
      "type": "lift",
      "floor": "2F",
      "x": 830,
      "y": 420
    },
    {
      "id": "xha_p2_escC",
      "name": "中央扶梯组",
      "type": "escalator",
      "floor": "2F",
      "x": 540,
      "y": 470
    },
    {
      "id": "xha_p2_stairC",
      "name": "中庭楼梯",
      "type": "stair",
      "floor": "2F",
      "x": 450,
      "y": 470
    },
    {
      "id": "xha_p1_lobby",
      "name": "迎客·到达大厅",
      "type": "hall",
      "floor": "1F",
      "x": 540,
      "y": 300
    },
    {
      "id": "xha_p1_taxi",
      "name": "出租·网约上车点",
      "type": "coach",
      "floor": "1F",
      "x": 260,
      "y": 160
    },
    {
      "id": "xha_p1_bus",
      "name": "机场巴士站台",
      "type": "coach",
      "floor": "1F",
      "x": 820,
      "y": 160
    },
    {
      "id": "xha_p1_luggage",
      "name": "行李寄存处",
      "type": "corridor",
      "floor": "1F",
      "x": 400,
      "y": 480
    },
    {
      "id": "xha_p1_linkG",
      "name": "航站楼间连廊",
      "type": "corridor",
      "floor": "1F",
      "x": 700,
      "y": 480
    },
    {
      "id": "xha_p1_rest1",
      "name": "洗手间",
      "type": "toilet",
      "floor": "1F",
      "x": 540,
      "y": 460
    },
    {
      "id": "xha_p1_liftW",
      "name": "西区电梯",
      "type": "lift",
      "floor": "1F",
      "x": 250,
      "y": 420
    },
    {
      "id": "xha_p1_liftC",
      "name": "中庭观光电梯",
      "type": "lift",
      "floor": "1F",
      "x": 540,
      "y": 430
    },
    {
      "id": "xha_p1_liftE",
      "name": "东区电梯",
      "type": "lift",
      "floor": "1F",
      "x": 830,
      "y": 420
    },
    {
      "id": "xha_p1_escC",
      "name": "中央扶梯组",
      "type": "escalator",
      "floor": "1F",
      "x": 470,
      "y": 560
    },
    {
      "id": "xha_p1_stairC",
      "name": "中庭楼梯",
      "type": "stair",
      "floor": "1F",
      "x": 620,
      "y": 560
    },
    {
      "id": "xha_b1_gtc",
      "name": "交通中心大厅",
      "type": "hall",
      "floor": "B1",
      "x": 540,
      "y": 260
    },
    {
      "id": "xha_b1_metroL",
      "name": "地铁站厅(非付费区)",
      "type": "hall",
      "floor": "B1",
      "x": 380,
      "y": 300
    },
    {
      "id": "xha_b1_metroG",
      "name": "地铁闸机群",
      "type": "corridor",
      "floor": "B1",
      "x": 380,
      "y": 360
    },
    {
      "id": "xha_b1_coachC",
      "name": "机场大巴·长途站",
      "type": "coach",
      "floor": "B1",
      "x": 150,
      "y": 300
    },
    {
      "id": "xha_b1_taxiH",
      "name": "出租车·网约车候车区",
      "type": "coach",
      "floor": "B1",
      "x": 880,
      "y": 300
    },
    {
      "id": "xha_b1_park",
      "name": "P1停车楼",
      "type": "parking",
      "floor": "B1",
      "x": 700,
      "y": 440
    },
    {
      "id": "xha_b1_restB",
      "name": "洗手间",
      "type": "toilet",
      "floor": "B1",
      "x": 540,
      "y": 150
    },
    {
      "id": "xha_b1_liftW",
      "name": "西区电梯",
      "type": "lift",
      "floor": "B1",
      "x": 260,
      "y": 400
    },
    {
      "id": "xha_b1_liftC",
      "name": "中庭观光电梯",
      "type": "lift",
      "floor": "B1",
      "x": 540,
      "y": 400
    },
    {
      "id": "xha_b1_liftE",
      "name": "东区电梯",
      "type": "lift",
      "floor": "B1",
      "x": 800,
      "y": 400
    },
    {
      "id": "xha_b1_escC",
      "name": "中央扶梯组",
      "type": "escalator",
      "floor": "B1",
      "x": 540,
      "y": 340
    },
    {
      "id": "xha_b1_escM",
      "name": "地铁扶梯",
      "type": "escalator",
      "floor": "B1",
      "x": 380,
      "y": 440
    },
    {
      "id": "xha_b1_stairC",
      "name": "中庭楼梯",
      "type": "stair",
      "floor": "B1",
      "x": 620,
      "y": 300
    },
    {
      "id": "xha_b1_stairM",
      "name": "地铁楼梯",
      "type": "stair",
      "floor": "B1",
      "x": 620,
      "y": 470
    },
    {
      "id": "xha_b2_escM",
      "name": "地铁扶梯",
      "type": "escalator",
      "floor": "B2",
      "x": 360,
      "y": 420
    },
    {
      "id": "xha_b2_stairM",
      "name": "地铁楼梯",
      "type": "stair",
      "floor": "B2",
      "x": 620,
      "y": 420
    },
    {
      "id": "xha_b2_pasg",
      "name": "站台联络通道",
      "type": "corridor",
      "floor": "B2",
      "x": 500,
      "y": 360
    },
    {
      "id": "xha_b2_platA",
      "name": "站台·往市区方向",
      "type": "metro",
      "floor": "B2",
      "x": 300,
      "y": 260
    },
    {
      "id": "xha_b2_platB",
      "name": "站台·往星湖度假区",
      "type": "metro",
      "floor": "B2",
      "x": 700,
      "y": 260
    },
    {
      "id": "xha_b2_liftC",
      "name": "中庭观光电梯",
      "type": "lift",
      "floor": "B2",
      "x": 500,
      "y": 180
    }
  ],
  "edges": [
    {
      "from": "xha_p4_doorW",
      "to": "xha_p4_ckA",
      "type": "walk",
      "weight": 45
    },
    {
      "from": "xha_p4_doorN",
      "to": "xha_p4_ckB",
      "type": "walk",
      "weight": 70
    },
    {
      "from": "xha_p4_doorN",
      "to": "xha_p4_ckC",
      "type": "walk",
      "weight": 55
    },
    {
      "from": "xha_p4_doorE",
      "to": "xha_p4_ckD",
      "type": "walk",
      "weight": 50
    },
    {
      "from": "xha_p4_liftW",
      "to": "xha_p4_ckA",
      "type": "walk",
      "weight": 45
    },
    {
      "from": "xha_p4_liftC",
      "to": "xha_p4_preSec",
      "type": "walk",
      "weight": 40
    },
    {
      "from": "xha_p4_liftE",
      "to": "xha_p4_ckD",
      "type": "walk",
      "weight": 50
    },
    {
      "from": "xha_p4_ckA",
      "to": "xha_p4_preSec",
      "type": "walk",
      "weight": 150
    },
    {
      "from": "xha_p4_ckB",
      "to": "xha_p4_preSec",
      "type": "walk",
      "weight": 70
    },
    {
      "from": "xha_p4_ckC",
      "to": "xha_p4_preSec",
      "type": "walk",
      "weight": 55
    },
    {
      "from": "xha_p4_ckD",
      "to": "xha_p4_preSec",
      "type": "walk",
      "weight": 130
    },
    {
      "from": "xha_p4_preSec",
      "to": "xha_p4_sec",
      "type": "walk",
      "weight": 40
    },
    {
      "from": "xha_p4_sec",
      "to": "xha_p4_airMall",
      "type": "walk",
      "weight": 45
    },
    {
      "from": "xha_p4_airMall",
      "to": "xha_p4_liftWSl",
      "type": "walk",
      "weight": 160
    },
    {
      "from": "xha_p4_airMall",
      "to": "xha_p4_liftCSl",
      "type": "walk",
      "weight": 40
    },
    {
      "from": "xha_p4_airMall",
      "to": "xha_p4_liftESl",
      "type": "walk",
      "weight": 160
    },
    {
      "from": "xha_p4_airMall",
      "to": "xha_p4_escY",
      "type": "walk",
      "weight": 80
    },
    {
      "from": "xha_p4_airMall",
      "to": "xha_p4_stairY",
      "type": "walk",
      "weight": 90
    },
    {
      "from": "xha_p4_airMall",
      "to": "xha_p4_a0",
      "type": "walk",
      "weight": 165
    },
    {
      "from": "xha_p4_airMall",
      "to": "xha_p4_b0",
      "type": "walk",
      "weight": 80
    },
    {
      "from": "xha_p4_airMall",
      "to": "xha_p4_c0",
      "type": "walk",
      "weight": 165
    },
    {
      "from": "xha_p4_liftWSl",
      "to": "xha_p4_a0",
      "type": "walk",
      "weight": 45
    },
    {
      "from": "xha_p4_liftESl",
      "to": "xha_p4_c0",
      "type": "walk",
      "weight": 45
    },
    {
      "from": "xha_p4_stairY",
      "to": "xha_p4_b0",
      "type": "walk",
      "weight": 55
    },
    {
      "from": "xha_p4_rest",
      "to": "xha_p4_b0",
      "type": "walk",
      "weight": 90
    },
    {
      "from": "xha_p4_a0",
      "to": "xha_p4_a1",
      "type": "walk",
      "weight": 45
    },
    {
      "from": "xha_p4_a1",
      "to": "xha_p4_a2",
      "type": "walk",
      "weight": 45
    },
    {
      "from": "xha_p4_a2",
      "to": "xha_p4_a3",
      "type": "walk",
      "weight": 40
    },
    {
      "from": "xha_p4_b0",
      "to": "xha_p4_b1",
      "type": "walk",
      "weight": 45
    },
    {
      "from": "xha_p4_b1",
      "to": "xha_p4_b2",
      "type": "walk",
      "weight": 45
    },
    {
      "from": "xha_p4_b2",
      "to": "xha_p4_b3",
      "type": "walk",
      "weight": 40
    },
    {
      "from": "xha_p4_c0",
      "to": "xha_p4_c1",
      "type": "walk",
      "weight": 45
    },
    {
      "from": "xha_p4_c1",
      "to": "xha_p4_c2",
      "type": "walk",
      "weight": 45
    },
    {
      "from": "xha_p4_c2",
      "to": "xha_p4_c3",
      "type": "walk",
      "weight": 40
    },
    {
      "from": "xha_p4_gA101",
      "to": "xha_p4_a0",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gA102",
      "to": "xha_p4_a0",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gA103",
      "to": "xha_p4_a1",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gA104",
      "to": "xha_p4_a1",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gA105",
      "to": "xha_p4_a2",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gA106",
      "to": "xha_p4_a2",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gA107",
      "to": "xha_p4_a3",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gA108",
      "to": "xha_p4_a3",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gB201",
      "to": "xha_p4_b0",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gB202",
      "to": "xha_p4_b0",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gB203",
      "to": "xha_p4_b1",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gB204",
      "to": "xha_p4_b1",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gB205",
      "to": "xha_p4_b2",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gB206",
      "to": "xha_p4_b2",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gB207",
      "to": "xha_p4_b3",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gB208",
      "to": "xha_p4_b3",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gC301",
      "to": "xha_p4_c0",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gC302",
      "to": "xha_p4_c0",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gC303",
      "to": "xha_p4_c1",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gC304",
      "to": "xha_p4_c1",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gC305",
      "to": "xha_p4_c2",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gC306",
      "to": "xha_p4_c2",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gC307",
      "to": "xha_p4_c3",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gC308",
      "to": "xha_p4_c3",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p3_mezz",
      "to": "xha_p3_food",
      "type": "walk",
      "weight": 110
    },
    {
      "from": "xha_p3_mezz",
      "to": "xha_p3_deck",
      "type": "walk",
      "weight": 130
    },
    {
      "from": "xha_p3_mezz",
      "to": "xha_p3_loungeA",
      "type": "walk",
      "weight": 130
    },
    {
      "from": "xha_p3_mezz",
      "to": "xha_p3_loungeB",
      "type": "walk",
      "weight": 125
    },
    {
      "from": "xha_p3_mezz",
      "to": "xha_p3_kids",
      "type": "walk",
      "weight": 150
    },
    {
      "from": "xha_p3_mezz",
      "to": "xha_p3_rest3",
      "type": "walk",
      "weight": 90
    },
    {
      "from": "xha_p3_mezz",
      "to": "xha_p3_liftWSl",
      "type": "walk",
      "weight": 145
    },
    {
      "from": "xha_p3_mezz",
      "to": "xha_p3_liftCSl",
      "type": "walk",
      "weight": 40
    },
    {
      "from": "xha_p3_mezz",
      "to": "xha_p3_liftESl",
      "type": "walk",
      "weight": 145
    },
    {
      "from": "xha_p3_mezz",
      "to": "xha_p3_escY",
      "type": "walk",
      "weight": 85
    },
    {
      "from": "xha_p3_mezz",
      "to": "xha_p3_stairY",
      "type": "walk",
      "weight": 95
    },
    {
      "from": "xha_p2_aw0",
      "to": "xha_p2_aw1",
      "type": "walk",
      "weight": 65
    },
    {
      "from": "xha_p2_aw1",
      "to": "xha_p2_aw2",
      "type": "walk",
      "weight": 65
    },
    {
      "from": "xha_p2_ac0",
      "to": "xha_p2_ac1",
      "type": "walk",
      "weight": 65
    },
    {
      "from": "xha_p2_ac1",
      "to": "xha_p2_ac2",
      "type": "walk",
      "weight": 65
    },
    {
      "from": "xha_p2_ae0",
      "to": "xha_p2_ae1",
      "type": "walk",
      "weight": 65
    },
    {
      "from": "xha_p2_ae1",
      "to": "xha_p2_ae2",
      "type": "walk",
      "weight": 65
    },
    {
      "from": "xha_p2_aw0",
      "to": "xha_p2_bagA",
      "type": "walk",
      "weight": 85
    },
    {
      "from": "xha_p2_ac0",
      "to": "xha_p2_arrHall",
      "type": "walk",
      "weight": 35
    },
    {
      "from": "xha_p2_ae0",
      "to": "xha_p2_bagB",
      "type": "walk",
      "weight": 85
    },
    {
      "from": "xha_p2_bagA",
      "to": "xha_p2_arrHall",
      "type": "walk",
      "weight": 80
    },
    {
      "from": "xha_p2_bagB",
      "to": "xha_p2_arrHall",
      "type": "walk",
      "weight": 80
    },
    {
      "from": "xha_p2_bagA",
      "to": "xha_p2_exitW",
      "type": "walk",
      "weight": 75
    },
    {
      "from": "xha_p2_bagB",
      "to": "xha_p2_exitE",
      "type": "walk",
      "weight": 75
    },
    {
      "from": "xha_p2_arrHall",
      "to": "xha_p2_exitN",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p2_arrHall",
      "to": "xha_p2_liftC",
      "type": "walk",
      "weight": 75
    },
    {
      "from": "xha_p2_arrHall",
      "to": "xha_p2_escC",
      "type": "walk",
      "weight": 120
    },
    {
      "from": "xha_p2_arrHall",
      "to": "xha_p2_stairC",
      "type": "walk",
      "weight": 130
    },
    {
      "from": "xha_p2_arrHall",
      "to": "xha_p2_rest2",
      "type": "walk",
      "weight": 120
    },
    {
      "from": "xha_p2_bagA",
      "to": "xha_p2_liftW",
      "type": "walk",
      "weight": 130
    },
    {
      "from": "xha_p2_liftW",
      "to": "xha_p2_aw0",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p2_bagB",
      "to": "xha_p2_liftE",
      "type": "walk",
      "weight": 130
    },
    {
      "from": "xha_p2_liftE",
      "to": "xha_p2_ae0",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p2_escC",
      "to": "xha_p2_ac0",
      "type": "walk",
      "weight": 85
    },
    {
      "from": "xha_p1_lobby",
      "to": "xha_p1_taxi",
      "type": "walk",
      "weight": 155
    },
    {
      "from": "xha_p1_lobby",
      "to": "xha_p1_bus",
      "type": "walk",
      "weight": 155
    },
    {
      "from": "xha_p1_lobby",
      "to": "xha_p1_luggage",
      "type": "walk",
      "weight": 115
    },
    {
      "from": "xha_p1_lobby",
      "to": "xha_p1_linkG",
      "type": "walk",
      "weight": 120
    },
    {
      "from": "xha_p1_lobby",
      "to": "xha_p1_rest1",
      "type": "walk",
      "weight": 80
    },
    {
      "from": "xha_p1_lobby",
      "to": "xha_p1_liftW",
      "type": "walk",
      "weight": 155
    },
    {
      "from": "xha_p1_lobby",
      "to": "xha_p1_liftC",
      "type": "walk",
      "weight": 65
    },
    {
      "from": "xha_p1_lobby",
      "to": "xha_p1_liftE",
      "type": "walk",
      "weight": 155
    },
    {
      "from": "xha_p1_lobby",
      "to": "xha_p1_escC",
      "type": "walk",
      "weight": 135
    },
    {
      "from": "xha_p1_lobby",
      "to": "xha_p1_stairC",
      "type": "walk",
      "weight": 135
    },
    {
      "from": "xha_p1_luggage",
      "to": "xha_p1_linkG",
      "type": "walk",
      "weight": 150
    },
    {
      "from": "xha_b1_liftW",
      "to": "xha_b1_gtc",
      "type": "walk",
      "weight": 155
    },
    {
      "from": "xha_b1_liftC",
      "to": "xha_b1_gtc",
      "type": "walk",
      "weight": 70
    },
    {
      "from": "xha_b1_liftE",
      "to": "xha_b1_gtc",
      "type": "walk",
      "weight": 150
    },
    {
      "from": "xha_b1_escC",
      "to": "xha_b1_gtc",
      "type": "walk",
      "weight": 40
    },
    {
      "from": "xha_b1_stairC",
      "to": "xha_b1_gtc",
      "type": "walk",
      "weight": 45
    },
    {
      "from": "xha_b1_gtc",
      "to": "xha_b1_coachC",
      "type": "walk",
      "weight": 195
    },
    {
      "from": "xha_b1_gtc",
      "to": "xha_b1_taxiH",
      "type": "walk",
      "weight": 170
    },
    {
      "from": "xha_b1_gtc",
      "to": "xha_b1_park",
      "type": "walk",
      "weight": 120
    },
    {
      "from": "xha_b1_gtc",
      "to": "xha_b1_restB",
      "type": "walk",
      "weight": 55
    },
    {
      "from": "xha_b1_gtc",
      "to": "xha_b1_metroL",
      "type": "walk",
      "weight": 80
    },
    {
      "from": "xha_b1_metroL",
      "to": "xha_b1_metroG",
      "type": "walk",
      "weight": 30
    },
    {
      "from": "xha_b1_metroG",
      "to": "xha_b1_escM",
      "type": "walk",
      "weight": 40
    },
    {
      "from": "xha_b1_metroG",
      "to": "xha_b1_stairM",
      "type": "walk",
      "weight": 130
    },
    {
      "from": "xha_b1_metroG",
      "to": "xha_b1_liftC",
      "type": "walk",
      "weight": 80
    },
    {
      "from": "xha_b2_escM",
      "to": "xha_b2_platA",
      "type": "walk",
      "weight": 85
    },
    {
      "from": "xha_b2_escM",
      "to": "xha_b2_pasg",
      "type": "walk",
      "weight": 75
    },
    {
      "from": "xha_b2_stairM",
      "to": "xha_b2_platB",
      "type": "walk",
      "weight": 90
    },
    {
      "from": "xha_b2_stairM",
      "to": "xha_b2_pasg",
      "type": "walk",
      "weight": 65
    },
    {
      "from": "xha_b2_pasg",
      "to": "xha_b2_platA",
      "type": "walk",
      "weight": 110
    },
    {
      "from": "xha_b2_pasg",
      "to": "xha_b2_platB",
      "type": "walk",
      "weight": 110
    },
    {
      "from": "xha_b2_liftC",
      "to": "xha_b2_pasg",
      "type": "walk",
      "weight": 90
    },
    {
      "from": "xha_p4_liftWSl",
      "to": "xha_p3_liftWSl",
      "type": "elevator",
      "weight": 30
    },
    {
      "from": "xha_p4_liftCSl",
      "to": "xha_p3_liftCSl",
      "type": "elevator",
      "weight": 30
    },
    {
      "from": "xha_p4_liftESl",
      "to": "xha_p3_liftESl",
      "type": "elevator",
      "weight": 30
    },
    {
      "from": "xha_p4_escY",
      "to": "xha_p3_escY",
      "type": "escalator",
      "weight": 40
    },
    {
      "from": "xha_p4_stairY",
      "to": "xha_p3_stairY",
      "type": "stair",
      "weight": 25
    },
    {
      "from": "xha_p4_liftW",
      "to": "xha_p2_liftW",
      "type": "elevator",
      "weight": 30
    },
    {
      "from": "xha_p2_liftW",
      "to": "xha_p1_liftW",
      "type": "elevator",
      "weight": 30
    },
    {
      "from": "xha_p1_liftW",
      "to": "xha_b1_liftW",
      "type": "elevator",
      "weight": 30
    },
    {
      "from": "xha_p4_liftC",
      "to": "xha_p2_liftC",
      "type": "elevator",
      "weight": 30
    },
    {
      "from": "xha_p2_liftC",
      "to": "xha_p1_liftC",
      "type": "elevator",
      "weight": 30
    },
    {
      "from": "xha_p1_liftC",
      "to": "xha_b1_liftC",
      "type": "elevator",
      "weight": 30
    },
    {
      "from": "xha_b1_liftC",
      "to": "xha_b2_liftC",
      "type": "elevator",
      "weight": 30
    },
    {
      "from": "xha_p4_liftE",
      "to": "xha_p2_liftE",
      "type": "elevator",
      "weight": 30
    },
    {
      "from": "xha_p2_liftE",
      "to": "xha_p1_liftE",
      "type": "elevator",
      "weight": 30
    },
    {
      "from": "xha_p1_liftE",
      "to": "xha_b1_liftE",
      "type": "elevator",
      "weight": 30
    },
    {
      "from": "xha_p2_escC",
      "to": "xha_p1_escC",
      "type": "escalator",
      "weight": 40
    },
    {
      "from": "xha_p1_escC",
      "to": "xha_b1_escC",
      "type": "escalator",
      "weight": 40
    },
    {
      "from": "xha_p2_stairC",
      "to": "xha_p1_stairC",
      "type": "stair",
      "weight": 25
    },
    {
      "from": "xha_p1_stairC",
      "to": "xha_b1_stairC",
      "type": "stair",
      "weight": 25
    },
    {
      "from": "xha_b1_escM",
      "to": "xha_b2_escM",
      "type": "escalator",
      "weight": 40
    },
    {
      "from": "xha_b1_stairM",
      "to": "xha_b2_stairM",
      "type": "stair",
      "weight": 25
    }
  ]
};
