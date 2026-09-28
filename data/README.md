# 机场节点图数据

本目录是"鸿蒙机场地图指引"元服务的**节点图（拓扑）数据**来源。

> 原则：**图（Graph，节点+边）先于图（图片，示意背景）**。
> 节点坐标为"图片来源坐标系"，示意背景图后面按这些坐标手工绘制，天然严丝合缝。

## 文件

| 文件 | 机场 | 规模 |
|---|---|---|
| `XHA_xinghai_t1.map.json` | 星海国际机场 XHA（虚构） | 119 节点 / 145 边，连续六层 4F 出发（唯一中央安检、A/B/C 三指廊 24 登机口）、3F 空侧候机夹层、2F 到达、1F 地面迎客、B1 交通中心、B2 地铁站台 |

## 数据结构

```jsonc
{
  "meta": {
    "schema": 1,
    "airport": "XHA",
    "name": "星海国际机场 主航站楼",
    "pxPerMeter": 2.0,          // 像素/米：把图上距离换算成米
    "floors": {"4F": "出发层", "3F": "空侧候机夹层", "B1": "交通中心", "B2": "地铁站台"},
    "nodeTypes": [...], "edgeTypes": [...]
  },
  "nodes": [
    { "id": "xha_p4_gA101", "name": "登机口A101", "type": "gate",
      "floor": "4F", "x": 130, "y": 560 }
  ],
  "edges": [
    { "from": "xha_p4_sec", "to": "xha_p4_airMall", "type": "walk", "weight": 45 }
  ]
}
```

### 约定

- **坐标**：`(x, y)` 存在每层的图片像素空间（`0 ≤ x ≤ 图片宽`）。层与层之间坐标空间独立。
- **换层**：电梯/扶梯在每层各有一个节点（id 带楼层前缀，name 相同），靠一条 `elevator` / `escalator` 边跨层连接——寻路、无障碍偏好、绘制都靠它。
- **边类型**：
  - `walk`：同层行走。权重 = 欧氏像素距离 ÷ `pxPerMeter`，四舍五入到 5 米。
  - `elevator`(30m) / `escalator`(40m) / `stair`(25m)：连接相邻楼层节点对。
  - `apm`(350m)：旅客捷运（主楼 ↔ 卫星厅），星海 T1 未定义使用，类型仍保留。
- **节点类型**（`nodeTypes`）：`entrance` `exit` `checkin` `security` `gate` `lift` `escalator` `stair`
  `apm_station` `metro` `coach` `parking` `baggage` `toilet` `hall` `corridor`。
  `corridor` 是纯拓扑中转点（画小点），其余为带语义的 POI。
- **图的性质**：指点即用的"地点-地点"导航（纯端侧，无机票/云端）。登机口是静态示意数据，
  将来接真实航班动态数据时只需替换 gate 的位置/编号。

## 预览

`../preview/` 里的 `*.nodes.svg`（每层一张）和 `*.overview.svg`（全览）
由 `../tools/preview_nodes.py` 从 JSON 渲染生成，浏览器直接打开或看 `index.html`。
改 JSON 后重跑 `python3 tools/gen_maps.py && python3 tools/preview_nodes.py` 即可刷新。

> preview 是纯生成物，不入公共仓库（根目录 `.gitignore` 已忽略），需要时本地重新生成即可。

## 下一步

按这两份坐标手工绘制各层**示意背景图**，作为 Canvas 里 `drawImage` 的底图；
节点/路径叠在图上，坐标对齐由这套数据的 `(x, y)` 保证。