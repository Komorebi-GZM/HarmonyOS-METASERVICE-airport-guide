# 设计系统与视觉规约（DESIGN.md）

> 图片编号 02 · 整个项目的视觉规则

这份文档回答：**这个元服务的视觉规则是什么、现在由哪些文件真实实现、以及新界面必须遵守哪些令牌与规约**。它面向"进入项目做开发的 AI Agent"——读完应当能在不破坏一致性的前提下新增一个页面或组件。全文区分【现状】（已 grep 取证的行为）与 `> 建议：`（目标规约，尚未实现）。所有色值、字号、间距数字均来自真实文件；凡现状缺失处一律标注，不虚构。

---

## 0. 读法与取证方式

| 项 | 说明 |
|---|---|
| 证据方式 | 对 `harmony_app/entry/src/main/ets/**`、`harmony_app/entry/src/main/resources/**`、`tools/*.py` 做 `grep`/逐文件阅读；行号即当前 `main@8350ff4` 的实际行号 |
| 引用格式 | `路径:行号`，路径相对仓库根 |
| 现状 | 直接陈述，不加标记 |
| 目标规约 | 以 `> 建议：` 或表格列名「目标规约」标注，**未实现** |
| 权威顺序 | 代码 > 本文档 > 其它文档；本文档与代码冲突时以代码为准，并回来修订本文档 |
| 不可越线 | 本文档只描述与建议，不授权修改 `model/AirportMap.ets`（生成物）或既有交付文档（见 `AGENTS.md` §2） |

**视觉实现的全部落点（只有 4 个）**

| 层 | 文件 | 职责 |
|---|---|---|
| 令牌层 | `harmony_app/entry/src/main/ets/ui/Theme.ets` | `APP` / `MAP` / `TYPE_COLOR` / `ROUTE` / `HIT` 五个调色板 |
| 资源层 | `harmony_app/entry/src/main/resources/base/element/color.json`、`float.json` | 仅 1 个颜色 + 2 个尺寸 |
| 组件层 | `harmony_app/entry/src/main/ets/ui/Common.ets`、`ui/PlacePicker.ets`、`ui/FloorCanvas.ets` | 通用控件与 Canvas 绘制 |
| 页面层 | `harmony_app/entry/src/main/ets/pages/*.ets` | 6 个页面的内联样式（大量样式未下沉到组件层） |

---

## 1. 设计原则

以下 5 条不是口号，每条都绑定本项目的真实约束（纯端侧、无网络、机场室内、六层 119 节点、中英双语、大字体与折叠/宽屏）。

| # | 原则 | 约束来源与现实含义 |
|---|---|---|
| P1 | **地图是主角，其余皆为陪衬** | 产品核心是"室内导航"，唯一自绘区域是 `ui/FloorCanvas.ets`。地图之外一律用 `APP.bg` + `APP.card` 两色撑起层级，不引入装饰性插图、渐变或大图背景；`MAP.surface #F6F8F8` 与 `APP.card #FFFFFF` 差值仅 9 级（`ui/Theme.ets:2,4`），刻意让画布"退到卡片里" |
| P2 | **颜色必须承载语义，而不是装饰** | `TYPE_COLOR` 是唯一的语义色表（`ui/Theme.ets:6-8`），用于回答"这是什么设施"；`APP.accent #007F7A` 只表达"可交互/已选中"，`APP.gold #B86A12` 只表达"安检" |
| P3 | **纯端侧 ⇒ 零运行时依赖视觉** | 图标只有 18 个 SVG（`resources/rawfile/icons/*.svg`），颜色只有 SVG 内写死的 `#007F7A`；没有字体文件、没有网络图标、没有 Lottie。文字一律走系统字体（`ui/FloorCanvas.ets:29` 甚至把字体名写死为 `HarmonyOS Sans`） |
| P4 | **大字优先于信息密度** | 机场场景是"边走边看"，且 `harmony_app/AppScope/resources/base/profile/configuration.json` 声明 `fontSizeScale: followSystem` / `fontSizeMaxScale: 2`。因此正文起点是 **14**（不是 12），交互文字是 **16**，大标题是 **28–32**；`fontSize(14)` 出现 42 次、`fontSize(16)` 18 次，主阶梯只有这两档（见 §5） |
| P5 | **单手可达 + 固定操作区** | 主要按钮高度 **48vp**（17 处 `.height(48)`），底部操作区固定在 `APP.card` 上（`pages/Route.ets:177`）；`docs/reports/ProductExperience-20261001.md:15` 明确"主要按钮采用 48 vp 触控高度" |

> 建议：把 P1–P5 作为 Code Review 检查项——新增色值若不属于 `APP`/`TYPE_COLOR` 语义，必须先在本文档登记再落地。

---

## 2. 色彩令牌

### 2.1 `APP` 调色板（界面基础色）

全部键定义在 `ui/Theme.ets:2`；「引用处数」= 排除 `Theme.ets` 后在 `pages/`+`ui/`+`core/`+`model/` 中的行匹配数。

| 令牌 | 色值 | 语义 | 使用场景 | 对应代码位置 | 引用处数 |
|---|---|---|---|---|---|
| `APP.bg` | `#F4F7F9` | 页面底色（冷灰白） | 页面根 `backgroundColor`、次级按钮底 | `ui/Theme.ets:2` | 18 |
| `APP.card` | `#FFFFFF` | 卡片/面板/按钮底 | 卡片、Header、底部操作区、未选中胶囊 | `ui/Theme.ets:2` | 30 |
| `APP.card2` | `#E9F3F2` | 次级卡片底（青灰） | **无任何引用** | `ui/Theme.ets:2` | **0** |
| `APP.line` | `#DFE7EB` | 描边/分隔线 | 列表项未选中描边 1vp | `ui/Theme.ets:2`；`ui/Common.ets:83` | 2 |
| `APP.text` | `#172B3A` | 主文本（近黑蓝） | 标题、正文、终点标记填充 | `ui/Theme.ets:2` | 24 |
| `APP.sub` | `#657582` | 次级文本 | 提示语、单位、未选中项文字 | `ui/Theme.ets:2` | 32 |
| `APP.accent` | `#007F7A` | 主强调（青绿） | 选中态、可点击文字、主按钮底、起点标记 | `ui/Theme.ets:2` | 31 |
| `APP.accentSoft` | `#D5EEEB` | 弱强调底 | 选中项背景、当前步骤背景、次级主按钮 | `ui/Theme.ets:2` | 7 |
| `APP.gold` | `#B86A12` | 安检强调（琥珀） | 仅安检节点标记 | `ui/Theme.ets:2`；`ui/FloorCanvas.ets:109` | **1** |
| `APP.gtext` | `#86500E` | 安检提示文本 | 仅"需经中央安检"提示 | `ui/Theme.ets:2`；`pages/Route.ets:202` | **1** |

**观察**：`APP.bg` 被复制到 3 处非令牌位置——`resources/base/element/color.json` 的 `start_window_background`、`entryability/EntryAbility.ets:19,21,23`（硬编码 `'#F4F7F9'`）、`tools/gen_brand_assets.py:12`；`APP.text #172B3A` 同样硬编码在 `entryability/EntryAbility.ets:22,24`。改 `APP.bg` 必须同步 4 个地方，否则冷启动会闪色。

### 2.2 `MAP` 调色板（Canvas 专用）

全部键定义在 `ui/Theme.ets:4`。**Canvas 只能接收颜色字符串**（`CanvasRenderingContext2D.fillStyle/strokeStyle`），这是该调色板无法迁到 `color.json` 的根本原因。

| 令牌 | 色值 | 语义 | 使用场景 | 对应代码位置 | 引用处数 |
|---|---|---|---|---|---|
| `MAP.surface` | `#F6F8F8` | 画布底 | Canvas 全幅填充 + 画布容器底 | `ui/Theme.ets:4`；`ui/FloorCanvas.ets:57,58,241` | 2 |
| `MAP.grid` | `#EEF2F3` | 网格线 | **无任何引用** | `ui/Theme.ets:4` | **0** |
| `MAP.ink` | `#172B3A` | 地图主墨色 | **无任何引用**（实际用 `APP.text`） | `ui/Theme.ets:4`；对比 `ui/FloorCanvas.ets:80` | **0** |
| `MAP.ink2` | `#657582` | 地图次墨色 | 非高优先级节点标签文字 | `ui/Theme.ets:4`；`ui/FloorCanvas.ets:178` | 1 |
| `MAP.muted` | `#A6B6BF` | 弱化色（灰蓝） | **无任何引用** | `ui/Theme.ets:4` | **0** |
| `MAP.corridor` | `#FFFFFF` | 通道面 | **无任何引用**（通道实际用 `#FFFFFF` 硬编码） | `ui/Theme.ets:4`；对比 `ui/FloorCanvas.ets:68` | **0** |
| `MAP.landWash` | `#EDF2F4` | 陆侧区底色 | **无任何引用** | `ui/Theme.ets:4` | **0** |
| `MAP.airWash` | `#E5F2F0` | 空侧区底色 | **无任何引用** | `ui/Theme.ets:4` | **0** |

**观察**：8 个 `MAP` 令牌中 **6 个从未被使用**；`MAP.surface` 用了 2 次、`MAP.ink2` 1 次。地图上真实出现的"陆侧/空侧"区分并不存在——`side` 字段（`land` 63 / `air` 55 / `gate` 1，取证自 `model/AirportMap.ets`）只被 `core/Pathfinder.ets:202` 用于寻路，**从未进入任何视觉通道**。`landWash`/`airWash` 是为这个能力预留但未落地的一组令牌。

### 2.3 `TYPE_COLOR`（节点类型色，15 项）

定义在 `ui/Theme.ets:6-8`（用 `Map<string,string>`，因 ArkTS 禁用 `Record` 字面量）。**全项目唯一消费者是 `ui/FloorCanvas.ets:109`**（`TYPE_COLOR.get(n.type) || APP.accent`）——即这 15 个色值只影响地图标记的圆环描边色。

完整清单与语义分组见 §3。

### 2.4 `ROUTE` / `HIT`（路线与命中）

| 令牌 | 色值 | 意图语义 | 现状 | 对应代码位置 |
|---|---|---|---|---|
| `ROUTE.color` | `#007F7A` | 当前引导段主色 | **声明后无任何引用**；实际当前段用 `APP.accent`（同值 `#007F7A`） | `ui/Theme.ets:10`；实际 `ui/FloorCanvas.ets:72` |
| `ROUTE.case` | `#FFFFFF` | 路线白色描边（隔离底图） | **无任何引用**；实际在 `ui/FloorCanvas.ets:90` 硬编码 `'#FFFFFF'` | `ui/Theme.ets:10` |
| `ROUTE.trans` | `#B7DBD7` | 预览态路线（更淡） | **无任何引用**；实际预览段用 `'#9ACCC6'`（`ui/FloorCanvas.ets:70`），与 `#B7DBD7` **不是同一个色** | `ui/Theme.ets:10` |
| `HIT` | `#007F7A` | 命中/选中反馈色 | **声明后无任何引用** | `ui/Theme.ets:11` |

**观察**：`ROUTE` 的三个值全部是"意图文档"而非活代码，且 `ROUTE.trans #B7DBD7` 与实际使用的 `#9ACCC6` 已经漂移——照 `ROUTE` 改色不会改变任何画面，是典型的"读了令牌却改不动 UI"陷阱。

### 2.5 未纳入任何令牌的硬编码色

| 色值 | 位置 | 画的是什么 | 处置建议 |
|---|---|---|---|
| `#E9F0F1` | `ui/FloorCanvas.ets:61` | 楼层范围底块（bbox 外扩 18） | 应成为 `MAP.floorBlock` |
| `#DCE6E8` | `ui/FloorCanvas.ets:68` | 通道（walk 边）外侧描边，`lineWidth = 22` | 应成为 `MAP.corridorEdge`；与未使用的 `MAP.corridor` 成对 |
| `#FFFFFF` | `ui/FloorCanvas.ets:68,90,103,110,120,177` | 通道内芯 / 路线描边 / 箭头 / 标记芯 / 标记文字 / 标签底 | 应成为 `MAP.corridorFill`、`ROUTE.case`、`MAP.labelBg`、`mapOnColor` |
| `#9ACCC6` | `ui/FloorCanvas.ets:70` | 预览路线（整条 `pathNodeIds`） | 应成为 `ROUTE.preview`，并与 `ROUTE.trans` 对齐 |
| `#FFF2DF` | `pages/Route.ets:203` | "需经中央安检"提示条底色 | 应成为 `APP.warnSoft`（与 `APP.gold`/`APP.gtext` 同组） |
| `#F4F7F9` | `entryability/EntryAbility.ets:19,21,23` | 窗口底色/状态栏/导航栏 | 这是 `APP.bg`，应引用同一真源 |
| `#172B3A` | `entryability/EntryAbility.ets:22,24` | 状态栏/导航栏前景 | 这是 `APP.text` |
| `#0F1F2E` / `#5A9CEC` / `#FCFCFB` | `tools/gen_icons.py:20-22` | launcher PNG 图标：夜航底 / pin 蓝 / 白芯 | 与 `APP` 调色板**完全不同源**（`APP` 无深藏青、无 pin 蓝），需决策是"品牌特例"还是"应改用 accent" |
| `#F4F7F9` / `#063F4B` / `#087E8B` / `#D7EEF0` / `#FFFFFF` | `tools/gen_brand_assets.py:12-16` | 同一批 launcher PNG 的另一套配色（`ACCENT #087E8B ≠ APP.accent #007F7A`） | 与上一行**抢写同一批输出文件**，见 §11 P0-4 |

### 2.6 资源层令牌与 TS 层调色板并存：现状与统一方案

**现状**（`resources/base/element/`）

| 文件 | 全部内容 | 是否被引用 |
|---|---|---|
| `color.json` | `start_window_background = #F4F7F9` | ✅ 被 `harmony_app/entry/src/main/module.json5` 的 `startWindowBackground` 引用 |
| `float.json` | `card_radius = 16vp`、`pill_radius = 999vp` | ❌ **两个都无任何引用**（在 `harmony_app/`、`tools/` 内 grep 零命中） |
| `en_US/element/` | 只有 `string.json`，**没有 color.json / float.json** | — |

也就是说：**字体、间距、圆角、颜色的实际数值 100% 硬编码在 `.ets` 里**；资源层只有 3 个令牌，其中 2 个是死令牌。这就是"设计系统未建立"的直接证据。

**目标规约（建议，未实现）**

| 决策 | 内容 | 理由 |
|---|---|---|
| 单一真源 | **`ui/Theme.ets` 作为唯一真源**，`color.json` / `float.json` 由生成器（建议新增 `tools/gen_theme_res.py`，当前不存在）产出 | 避免"TS 与 JSON 双写漂移"；`APP.bg` 现在已有 4 处副本 |
| 必须留在 `Theme.ets` | `MAP.*`、`TYPE_COLOR`、`ROUTE`、`HIT`、Canvas 用到的全部色值 | Canvas API 只吃颜色字符串，无法读 `$r('app.color.*')` |
| 应进入 `color.json` | `APP.bg/card/line/text/sub/accent/accentSoft/gold/gtext` + 新增 `warnSoft #FFF2DF` | 声明式 UI 可用 `$r('app.color.*')`，并具备将来支持深色模式的唯一入口 |
| 应进入 `float.json` | `radius_card`(16) / `radius_pill`(999) / **新增** `radius_control`(12) / `radius_field`(14) / `radius_tile`(18)、`touch_min`(48)、字号阶梯 `font_h1`(32)/`font_h2`(28)/`font_title`(22)/`font_body`(16)/`font_caption`(14) | 见 §5、§6 的实际取值分布 |
| 命名规范 | 颜色 `app_*`（表面/文本）、`accent*`、`warn_*`、`map_*`、`type_*`；尺寸 `radius_*`、`space_*`、`font_*`、`size_*`。**保留现有 `card_radius` / `pill_radius` / `start_window_background` 不改名**，避免破坏 `module.json5` 与历史引用；新增项用上述前缀，后续再统一 | 渐进改造，不做一次性大范围重命名 |
| 禁则 | 新增页面不得出现字面色值（`'#RRGGBB'`）；Canvas 例外必须落到 `MAP`/`ROUTE` 的具名键 | 现有 9 处硬编码色（§2.5）即违反此禁则的存量 |

---

## 3. 节点类型配色表

`TYPE_COLOR`（`ui/Theme.ets:6-8`）共 15 项，恰好覆盖 `data/XHA_xinghai_t1.map.json` 中全部 15 种 `type`（119 节点）。"陆/空侧"取证自生成物 `model/AirportMap.ets` 的 `side` 字段（`land` 63 / `air` 55 / `gate` 1）。

| # | node type | 色值 | 语义分组 | 分布（land/air/gate） | 中文标签（`model/Localization.ets:7-21`） | 图标（`ui/Common.ets:6-12`） |
|---|---|---|---|---|---|---|
| 1 | `entrance` | `#007F7A` | 陆侧·出入口 | 3 / 0 / 0 | 出发门 | `pin` |
| 2 | `exit` | `#007F7A` | 陆侧·出入口 | 3 / 0 / 0 | 到达出口 | `pin` |
| 3 | `checkin` | `#486A85` | 陆侧·流程 | 4 / 0 / 0 | 值机/自助 | `plane` |
| 4 | `security` | `#B86A12` | **咽喉（唯一割点）** | 0 / 0 / 1 | 安检 | `shield` |
| 5 | `gate` | `#286DAB` | 空侧·登机 | 0 / 24 / 0 | 登机口 | `plane` |
| 6 | `lift` | `#657582` | 跨区·换层 | 13 / 6 / 0 | 电梯 | `layers` |
| 7 | `escalator` | `#657582` | 跨区·换层 | 5 / 2 / 0 | 扶梯 | `layers` |
| 8 | `stair` | `#657582` | 跨区·换层 | 5 / 2 / 0 | 楼梯 | `layers` |
| 9 | `metro` | `#007F7A` | 陆侧·轨道交通 | 2 / 0 / 0 | 地铁 | `metro` |
| 10 | `coach` | `#486A85` | 陆侧·接驳交通 | 4 / 0 / 0 | 大巴/出租 | `pin` |
| 11 | `parking` | `#486A85` | 陆侧·接驳交通 | 1 / 0 / 0 | 停车 | `pin` |
| 12 | `baggage` | `#007F7A` | 陆侧·到达流程 | 2 / 0 / 0 | 行李提取 | `bag` |
| 13 | `toilet` | `#486A85` | 跨区·设施 | 3 / 2 / 0 | 洗手间 | `facility` |
| 14 | `hall` | `#486A85` | 跨区·商业/大厅 | 4 / 5 / 0 | 大厅/商业 | `pin` |
| 15 | `corridor` | `#A6B6BF` | 纯拓扑（默认不绘制） | 14 / 14 / 0 | 通道/中转 | `pin` |

### 3.1 语义分组汇总

| 分组 | 成员 | 使用色数 |
|---|---|---|
| 陆侧（land-only） | `entrance`、`exit`、`checkin`、`metro`、`coach`、`parking`、`baggage` | 3（`#007F7A`、`#486A85`、`#B86A12` 不含） |
| 空侧（air-only） | `gate` | 1（`#286DAB`） |
| 咽喉（割点） | `security` | 1（`#B86A12`） |
| 交通 | `metro`、`coach`、`parking` | 2（`#007F7A`、`#486A85`） |
| 换层设施（跨区） | `lift`、`escalator`、`stair` | 1（`#657582`） |
| 设施/公共（跨区） | `toilet`、`hall` | 1（`#486A85`） |
| 纯拓扑 | `corridor` | 1（`#A6B6BF`） |

### 3.2 重复与难以区分的问题（供 TODO.md 使用）

| 问题 | 证据 | 影响 |
|---|---|---|
| **15 种类型只有 6 个不同色值** | `ui/Theme.ets:6-8` 去重后：`#007F7A`、`#486A85`、`#B86A12`、`#286DAB`、`#657582`、`#A6B6BF` | 类型色无法独立表达 15 种语义 |
| `#486A85` **一个色承担 5 种类型** | `checkin`、`coach`、`parking`、`toilet`、`hall` | 值机柜台与洗手间同色 |
| `#007F7A` **一个色承担 4 种类型** | `entrance`、`exit`、`metro`、`baggage`；且与 `APP.accent` 同值 | **语义冲突**：`#007F7A` 同时表示"已选中/可点击"与"出入口/地铁/行李"，选中反馈会被类型色淹没 |
| `entrance` 与 `exit` 完全同色同图标 | `ui/Theme.ets:6`、`ui/Common.ets:12`（都落到 `pin`） | 出发门与到达出口在地图上不可区分，而这两者是本项目最重要的方向性语义 |
| `#486A85`(checkin) / `#286DAB`(gate) / `#657582`(lift) 三者色相接近 | `ui/Theme.ets:6-7` | 标记实心圆仅 `r = 6`（未选中）/ `r = 10`（选中），描边 `1.8`/`3`（`ui/FloorCanvas.ets:110-111`）。在 6–10px 尺度上三个低饱和蓝灰极难分辨 |
| `security` 存在冗余特判 | `ui/FloorCanvas.ets:109` 用 `n.id === SECURITY_ID ? APP.gold : TYPE_COLOR.get(n.type)`，而 `TYPE_COLOR['security']` 也是 `#B86A12`（`ui/Theme.ets:6`） | 两条路径给出同值，特判无必要；一旦有人改 `TYPE_COLOR['security']` 会静默失效 |
| `corridor` 只有 7/28 会被绘制 | `core/Places.ets:9` + `PUBLIC_CORRIDORS`（`core/Places.ets:6`，7 个 id），`ui/FloorCanvas.ets:76` 用 `publicPlace` 过滤 | `TYPE_COLOR['corridor']` 实际只作用于 7 个节点 |

> 建议：把类型色重组为**6 个语义族 + 族内明度差**，而不是 1 色 1 类型：出入口/流程（青绿）、登机（蓝）、安检（琥珀，唯一高饱和暖色）、换层（石板灰）、交通（靛蓝）、设施（青灰）。至少必须消除 `entrance` 与 `exit` 同色、以及类型色与 `APP.accent` 同值这两个硬冲突。

---

## 4. 地图视觉规范

### 4.1 `MAP` 各字段"画什么"

| 令牌 | 现状是否生效 | 应该画什么 | 目标规约（建议） |
|---|---|---|---|
| `MAP.surface` | ✅ `ui/FloorCanvas.ets:57-58,241` | 画布底 | 保持。任何地图容器底色只能用它 |
| `MAP.grid` | ❌ 未使用 | 网格/参考线 | 若不做网格，从令牌表中删除；若做，只用于"楼层范围外"的参考网格，不覆盖楼层块 |
| `MAP.ink` | ❌ 未使用（实为 `APP.text`） | 地图主墨色（标题、高优先级标签） | 删除，或设为 `= APP.text` 并让 `ui/FloorCanvas.ets:80` 改用 `MAP.ink` |
| `MAP.ink2` | ✅ `ui/FloorCanvas.ets:178` | 次级标签文字（`priority >= 2`） | 保持 |
| `MAP.muted` | ❌ 未使用（实为 `#A6B6BF` 只在 `TYPE_COLOR['corridor']`） | 弱化元素 | 与 `TYPE_COLOR['corridor']` 同值，建议合并为一个语义名 |
| `MAP.corridor` | ❌ 未使用（实为硬编码 `'#FFFFFF'`，`ui/FloorCanvas.ets:68`） | 通道面（通道内芯填充） | 把 `ui/FloorCanvas.ets:68` 的 `'#FFFFFF'` 换成 `MAP.corridor` |
| `MAP.landWash` | ❌ 未使用 | 陆侧区域底色（`side === 'land'`） | 需要先实现"区域面"图层（§4.4），否则删除 |
| `MAP.airWash` | ❌ 未使用 | 空侧区域底色（`side === 'air'`） | 同上；这是本产品最有价值的视觉增强（一眼看出安检分界） |

> 建议：`landWash`/`airWash` 的落地方式——按 `side` 对 `FLOOR_BBOX` 内节点做凸包或按楼层分割面填色，画在**网格之后、通道之前**，透明度固定（不叠色），保证 `#FFFFFF` 通道与 `#9ACCC6` 路线仍然清晰。

### 4.2 图层绘制顺序（现状，`ui/FloorCanvas.ets:53-81`）

`draw()` 是唯一绘制入口，顺序严格如下（同顺序 = 目标规约，新增图层必须插在既有层之间且不得改变既有相对次序）：

| 序 | 图层 | 代码行 | 关键参数 | 令牌 |
|---|---|---|---|---|
| 1 | 清屏 + 画布底 | `57-58` | 全幅 `fillRect` | `MAP.surface` |
| 2 | 楼层范围底块 | `61-62` | bbox 外扩 `18`，圆角由容器 `borderRadius(18).clip(true)` 裁切（`241`） | **硬编码** `#E9F0F1` |
| 3 | 通道（walk 边）双层描边 | `64-69` | 先 `lineWidth 22` + `#DCE6E8`，再 `lineWidth 18` + `#FFFFFF`；`lineCap/lineJoin = 'round'`（`63`） | **硬编码** `#DCE6E8` / `#FFFFFF` |
| 4 | 预览路线（整条路径） | `70` | `lineWidth 5`，色 `#9ACCC6` | **硬编码**（意图为 `ROUTE.trans`） |
| 5 | 当前引导段 | `71-74` | `lineWidth 6`，色 `APP.accent`，并叠白底 `width + 4`（见 `line()` `90`） | `APP.accent`（意图为 `ROUTE.color`） |
| 6 | 方向箭头 | `92-105` | 段长 ≥ `28` 才画；三角形 5/4/4 像素；白色填充 | **硬编码** `#FFFFFF` |
| 7 | 节点标记 | `75-78` → `106-113` | 白芯圆 `r=6`（选中 `10`）；彩色圆环 `lineWidth 1.8`（选中 `3`）；中心点 `r=2.2` | `TYPE_COLOR` / `APP.gold` |
| 8 | 起点 / 终点标记 | `79` → `114-122` | 终点为 `22×22` 方块 `APP.text`；起点为 `r=12` 圆 `APP.accent`；内嵌 `14` 号粗体白字（`起`/`终`，`S`/`D`） | `APP.text`/`APP.accent`/`#FFFFFF` |
| 9 | 节点标签 + 避让 | `79` → `129-181` | `canvasFont(14)` 常规；行高 `fp2px(14) * 1.25`；最小间距 `max(3, labelH * 0.15)`；4 个候选位（下/上/右/左）；边界内缩 `x: 6`、`y: 42`、底 `58` | `APP.text` / `MAP.ink2` / `#FFFFFF` 标签底 |
| 10 | 楼层角标 | `80` | `canvasFont(16, true)`，位置 `(16, 16)`，左上 | `APP.text` |

### 4.3 路线高亮与命中反馈用色规则

| 状态 | 现状实现 | 令牌 | 目标规约（建议） |
|---|---|---|---|
| 预览态整条路径 | `#9ACCC6`，宽度 5 | 意图 `ROUTE.trans #B7DBD7`（**色值已漂移**） | 用 `ROUTE.preview`，并在 `ROUTE.trans` 与新键之间二选一，**删除另一个** |
| 当前引导段 | `APP.accent #007F7A`，宽度 6，白色外描边 `+4` | 意图 `ROUTE.color` | 改用 `ROUTE.color`，让"路线色"可独立于"交互强调色"调整 |
| 路线白描边 | `#FFFFFF`（`ui/FloorCanvas.ets:90`） | 意图 `ROUTE.case #FFFFFF`（同值） | 改用 `ROUTE.case` |
| 起点标记 | 实心圆 `r=12`，`APP.accent` | `APP.accent` | 保持，但需与 §3.2 的"类型色与 accent 同值"冲突一并解决 |
| 终点标记 | `22×22` 方块，`APP.text` | `APP.text` | 保持（**形态区分优于颜色区分**，缺色也能分辨） |
| 节点命中（选中） | 圆环加粗（`1.8 → 3`）+ 半径放大（`6 → 10`） | — | 保持"尺寸+线宽"双通道反馈，不要只靠颜色 |
| **`HIT #007F7A`** | **完全未被使用** | `HIT` | 要么让命中态改用它（但值与 `APP.accent` 相同，无意义），要么删除该令牌 |
| 触摸命中半径 | `24 * 24`（平方距离），`ui/FloorCanvas.ets:198` | — | 即 24vp 半径、48vp 直径，**与 §6 的 48vp 触控下限自洽**；保持 |

### 4.4 地图交互与控件（现状）

| 项 | 现状 | 位置 |
|---|---|---|
| 画布容器 | `borderRadius(18)` + `clip(true)`，底 `MAP.surface` | `ui/FloorCanvas.ets:241` |
| 缩放控件 | 右上角 `Column({space: 8})`，两个 `48×48` 按钮，`APP.card` 底、`borderRadius(12)`、图标 22 | `ui/FloorCanvas.ets:224-230,208` |
| 适配按钮 | 底部 `Row({space: 8})`，"查看全层" / "查看路线"，`height(48)`、`fontSize(14)`、`APP.card` 底、`APP.accent` 字、`borderRadius(12)` | `ui/FloorCanvas.ets:231-238` |
| 控件层透传 | `hitTestBehavior(HitTestMode.Transparent)`，内边距 `12` | `ui/FloorCanvas.ets:239-240` |
| 适配留白 | 非路线态 `fitInsets(bb, w, h, 24, 48, 72, 78)`；路线态 `(32, 48, 72, 90)` | `ui/FloorCanvas.ets:50-51`（`core/Viewport.ets` 实现） |
| 手势 | `PanGesture`（1 指，distance 5）+ `PinchGesture`（2 指，distance 3），`GestureMode.Parallel` | `ui/FloorCanvas.ets:183-195` |
| 标签降噪 | `zoom < 0.4` 时只保留 `gate`/`metro`/`checkin` 的标签 | `ui/FloorCanvas.ets:148` |
| Canvas 字体 | `bold? + fp2px(size) + 'px HarmonyOS Sans'` —— 写死字体名，跟随系统字号缩放（`fp2px`） | `ui/FloorCanvas.ets:28-30` |

> 建议：`'HarmonyOS Sans'` 为写死字体名，跨设备/多语言无回退链。建议改为不带字体名的 `'px'` 形式（交给系统）或显式声明回退族，并在 §10 的宽屏清单中验证。

---

## 5. 字体与字号阶梯

**实测分布**（`grep -o 'fontSize(N)'`，范围 `pages/` + `ui/`，共 73 处；Canvas 的 `canvasFont()` 调用单列）

| 字号 | 出现次数 | 字重 | 用途 | 出处（示例，非穷举） |
|---|---|---|---|---|
| **32** | 1 | `Bold` | 首页主标题 | `pages/Index.ets:88` |
| **28** | 2 | `Bold` | 选择页/地铁页大标题 | `ui/PlacePicker.ets:66`、`pages/MetroGuide.ets:39` |
| **24** | 2 | `Bold` | 地点详情标题、步行米数数值 | `pages/FloorBrowse.ets:44`、`pages/Route.ets:196` |
| **22** | 4 | `Bold` | 区块主标题、楼层号、地铁方向卡标题 | `pages/Route.ets:112`、`pages/FloorBrowse.ets:63`、`pages/Index.ets:59`、`pages/MetroGuide.ets:17` |
| **20** | 2 | `Bold` | Header 标题、空态标题 | `ui/Common.ets:39`、`ui/Common.ets:62` |
| **18** | 2 | `Bold` | 小节标题、当前步骤标题 | `ui/Common.ets:92`、`pages/Route.ets:155` |
| **16** | 18 | `Medium`（列表项/主按钮/任务卡）或默认 | 列表项标题、输入框、胶囊、主按钮文字、步骤正文 | `ui/Common.ets:76`(Medium)、`pages/Route.ets:99`(Medium)、`ui/Common.ets:51`(Medium)、`pages/Index.ets:52`(Medium)、`pages/Route.ets:119`、`pages/FloorBrowse.ets:45`、`pages/MetroGuide.ets:29` |
| **14** | 42 | 默认（未声明 `fontWeight`） | 辅助说明、按钮文字、单位、标签、提示 | 遍布 6 页；如 `pages/Route.ets:122,157`、`ui/Common.ets:63`、`ui/PlacePicker.ets:64`、`pages/Index.ets:83,89,96` |
| **Canvas 16** | 1 | bold | 地图左上楼层角标 | `ui/FloorCanvas.ets:80`（`canvasFont(16, true)`） |
| **Canvas 14** | 3 | bold（起终点文字） / 常规（节点标签） | 起终点标记内文字、节点标签 | `ui/FloorCanvas.ets:120`、`ui/FloorCanvas.ets:143` |

**字重实测**：仅有 `FontWeight.Bold`（15 处）与 `FontWeight.Medium`（5 处）两种显式声明；**没有 `FontWeight.Normal/Regular/Light`**，其余全部落回系统默认。Canvas 侧通过字符串 `'bold '` 前缀切换（`ui/FloorCanvas.ets:29`）。

**行高实测**：仅 Canvas 标签显式定义行高 = `fp2px(14) * 1.25`（`ui/FloorCanvas.ets:144`）；声明式 UI 全部使用系统默认行高，**无一处显式 `lineHeight`**。

> 目标规约（建议）：把上表收敛为 6 档并登记为令牌，禁止出现表外字号。

| 令牌（建议） | 值 | 字重 | 唯一用途 |
|---|---|---|---|
| `font_display` | 32 | Bold | 首页主标题（每页最多 1 处） |
| `font_h1` | 28 | Bold | 页面级大标题 |
| `font_h2` | 22 | Bold | 区块标题、方向卡标题 |
| `font_title` | 18 | Bold | 小节标题、当前步骤标题 |
| `font_body` | 16 | Medium / 默认 | 列表项标题、按钮、输入框 |
| `font_caption` | 14 | 默认 | 次要说明、单位、标签 |
| （Canvas）`canvas_label` | 14 / 行高 17.5 | 默认 | 地图节点标签 |
| （Canvas）`canvas_floor` | 16 | bold | 楼层角标 |

> 建议：`fontSize(20)` 只用于 Header 与空态 2 处，`fontSize(24)` 只用于详情标题与数值 2 处——这两档可分别并入 `font_h2` 与 `font_h1`，减少"一页之内 4 种相近字号"的观感噪声。

**大字体风险**：`harmony_app/AppScope/resources/base/profile/configuration.json` 允许 `fontSizeMaxScale: 2`，但 `docs/reports/ProductExperience-20261001.md:15` 实测只到"约为标准字号的 1.3 倍"，且报告 §尚未覆盖 未包含 2.0 倍验证。所有 `height(48)` 的按钮与 `maxLines(2)` 的英文文案都是 2.0 倍下的首要观察对象。

---

## 6. 间距、圆角、阴影、触控

### 6.1 间距梯（实测）

| 用法 | 实测取值（出现次数） | 代表位置 |
|---|---|---|
| 组件内 `padding`（标量） | 12(2)、14(2)、16(4)、18(1)、20(5)、24(2)、28(1) | `ui/Common.ets:42,64,82`、`pages/Index.ets:53,64,99,128`、`pages/Route.ets:129,177,244` |
| 页面横向内边距（对象式） | `left/right: 16` 或 `20` | `16`：`ui/PlacePicker.ets:56`、`pages/Route.ets:211`；`20`：`pages/Index.ets:128`、`ui/PlacePicker.ets:84`、`pages/Route.ets:107,200,203` |
| 纵向内边距（对象式） | `top/bottom`: 4、6、8、10、12 | `ui/Common.ets:94`(4)、`pages/Index.ets:127`(6/12)、`ui/PlacePicker.ets:100`(8)、`pages/Route.ets:200,203`(10)、`pages/Route.ets:107`(12) |
| 纵向堆叠 `Column({space})` | 3(1)、4(2)、5(3)、6(3)、8(14)、10(14)、12(6)、14(3)、16(2)、18(1)、20(1) | `ui/Common.ets:60`(14)、`pages/Index.ets:81`(20)、`pages/MetroGuide.ets:18`(6) |
| 横向堆叠 `Row({space})` | 6、8、10、12、14、16 | `pages/Route.ets:96`(8)、`pages/Route.ets:168`(10)、`ui/Common.ets:33`(10)、`ui/Common.ets:72`(14)、`pages/MetroGuide.ets:14`(16) |
| `margin` | **全项目 0 处** | `grep -rn "margin" pages/ ui/` 零命中 |

**观察**：`space` 一共出现 11 种值（3/4/5/6/8/10/12/14/16/18/20），`padding` 出现 7 种标量。`margin` 完全不用（一律靠 `space` 与 `padding`），这是既有的隐性规约，值得保留并写死。

> 目标规约（建议）：4 的倍数梯 `4 / 8 / 12 / 16 / 20 / 24 / 28`；`space` 只允许 `4 / 8 / 12 / 16 / 20`，`padding` 只允许 `8 / 12 / 16 / 20 / 24`；现有 `3 / 5 / 6 / 10 / 14 / 18` 属历史值，新代码禁止使用。

### 6.2 圆角规约

| 实测值 | 出现次数 | 用途 | 出处 |
|---|---|---|---|
| 10 | 1 | 地铁步骤序号徽标 `36×36` | `pages/MetroGuide.ets:28` |
| 12 | 12 | **控件级**：胶囊/单选项/步骤行/缩放按钮/小按钮 | `ui/PlacePicker.ets:57,96`、`pages/Route.ets:90,101,125,218`、`pages/FloorBrowse.ets:70`、`pages/Index.ets:85`、`ui/FloorCanvas.ets:208,233,236`、`ui/Common.ets:74` |
| 14 | 4 | **输入级**：主按钮、输入框、整体卡片按钮 | `ui/Common.ets:53`、`ui/PlacePicker.ets:75,82`、`pages/FloorBrowse.ets:51` |
| 16 | 2 | **列表卡片级**：列表项、楼层入口 | `ui/Common.ets:83`、`pages/Index.ets:65` |
| 18 | 6 | **区块级**：地图容器、任务卡、地铁方向卡、搜索块 | `ui/FloorCanvas.ets:241`、`pages/Index.ets:54,100`、`pages/MetroGuide.ets:15,21,46` |
| 999 | 资源声明 | `pill_radius`，**无引用** | `resources/base/element/float.json` |
| — | 8 处 | **未设置 → 落回 ArkUI Button 默认胶囊形** | 见下 |

**圆角现状矛盾**：同一批"文字按钮"里，`borderRadius(12)` 与"完全不设置（默认胶囊）"并存——后者共 8 处，均已逐行核对续行确认无 `borderRadius`：

| 位置 | 控件 | 后果 |
|---|---|---|
| `pages/Route.ets:137` | "查看全程步骤" | 胶囊形 |
| `pages/Route.ets:148` | "路线偏好" | 胶囊形，与相邻 `borderRadius(12)` 的楼层按钮并排 |
| `pages/Route.ets:151` | "查看全程步骤"（指引态） | 胶囊形 |
| `pages/Route.ets:165` | "回到当前步骤" | 胶囊形 |
| `pages/Route.ets:169` | "上一步" `height(52)` | 胶囊形，且高度 52 与主按钮 52/其它 48 不齐 |
| `pages/FloorBrowse.ets:53` | "取消" | 胶囊形 |
| `ui/Common.ets:35` | 返回按钮（透明底） | 胶囊形，与同区 `borderRadius(12)` 的缩放按钮不一致 |
| `ui/PlacePicker.ets:105` | "清除搜索" | 胶囊形 |

> 目标规约（建议）：圆角只有 3 档——`radius_control = 12`（按钮/胶囊/单选项）、`radius_card = 16`（列表项/卡片）、`radius_panel = 18`（区块/地图容器）；输入框与主按钮统一到 `radius_control`，**禁止留空**（留空即默认胶囊，是当前最主要的视觉不一致来源）。`float.json` 已有的 `pill_radius = 999` 若确定不再使用"真胶囊"外观，应从资源中删除或改为 `radius_panel` 的别名。

### 6.3 阴影

| 项 | 现状 |
|---|---|
| `shadow` / `Shadow` / `elevation` | **全项目 0 处**（`grep -rn "shadow\|Shadow\|elevation" pages/ ui/` 零命中） |
| 层级表达方式 | 纯靠底色差：`APP.bg #F4F7F9`（根） → `APP.card #FFFFFF`（卡片） → `APP.accentSoft #D5EEEB`（选中） |
| 唯一的"伪阴影" | 地图通道与路线的**白色描边**（`ui/FloorCanvas.ets:68,90`），用描边而非阴影获得分离感 |

> 目标规约（建议）：**继续保持零阴影**。这是本设计系统最干净的一条既有约定，也是"色阶表达层级 + 描边表达边界"的实践。新增组件不得引入 `shadow()`，层级一律用 `bg → card → accentSoft` 三级底色，边界用 `border({width: 1, color: APP.line})` 或白色描边。

### 6.4 触控尺寸

**实测高度分布**：`48`（17 处）、`52`（5 处）、`56`（1）、`60`（1）、`64`（1）、`44`（1）、`36`（1）、`4`（1）；`constraintSize.minHeight`：`48`（2）、`52`（1）、`86`（1）、`90`（1）、`112`（1）。

| 类别 | 现状 | 出处 |
|---|---|---|
| 主要按钮（`PrimaryAction`） | `minHeight: 52` | `ui/Common.ets:51` |
| 标准按钮 / 缩放按钮 / 返回按钮 / Tab 高度 | `48` | `pages/Route.ets:90,101,137,165,217`、`pages/FloorBrowse.ets:53,69`、`pages/Index.ets:84`、`ui/Common.ets:36`、`ui/FloorCanvas.ets:208,232,235` |
| 胶囊（Chip）/ 快捷起点 | `minHeight: 48` | `ui/PlacePicker.ets:55,95` |
| 输入框 | `height: 52` | `ui/PlacePicker.ets:74` |
| "上一步" | `height: 52` | `pages/Route.ets:169` |
| 首页任务卡 / 楼层入口 | `minHeight: 112` / `86` | `pages/Index.ets:53,64` |
| 首页搜索块 | `minHeight: 90` | `pages/Index.ets:100` |
| 列表项（`PlaceRow`） | 无固定高，`padding(16)` + 两行文字 ⇒ ≈76–92 | `ui/Common.ets:82` |
| **低于 48 的可点击区域** | `pages/Route.ets:100,106` 的起终点编辑区（`Column`，两行 14+16 号文字 ≈ 42vp），`layoutWeight(1)` 横向撑满但**纵向不足 48** | `pages/Route.ets:96-107` |

**核对结论**：主流程按钮均 ≥ 48vp，地图命中半径 24vp（直径 48vp，`ui/FloorCanvas.ets:198`），与 `docs/reports/ProductExperience-20261001.md:15` 声明的"主要按钮 48 vp"一致。**唯一不达标的是 `pages/Route.ets:100/106` 的起终点编辑热区。**

> 目标规约（建议）：新增可点击元素声明 `constraintSize({ minHeight: 48 })`（比 `height(48)` 更友好，允许大字体下自然增高）；热区不足 48 时用 `constraintSize({minHeight: 48})` 或 `padding` 补足，**不要靠视觉尺寸判断**。

---

## 7. 组件视觉规约

组件分两类：**已下沉的通用结构**（`ui/Common.ets`，5 个）与**仍内联在页面里的结构**（Tab/胶囊/弹层等）。后者是"设计系统未建立"的具体表现，应逐步下沉。

### 7.1 已有通用组件（`ui/Common.ets`）

| 组件 | 结构 | 尺寸 | 颜色令牌 | 状态 | 位置 |
|---|---|---|---|---|---|
| `AppIcon` | `Image($rawfile('icons/{name}.svg'))`，`objectFit: Contain` | `iconSize` 默认 **24** | 颜色**由 SVG 写死** `#007F7A` | 无状态（不可换色） | `ui/Common.ets:14-18` |
| `PageHeader` | `Row({space:10})`：返回按钮或 brand 图标 + 标题；标题 `maxLines(1)` + 省略号 | `height(64)`，`padding{left:16, right: reserve+16}` | 底 `APP.card`，字 `APP.text`，图标色来自 SVG | `back: boolean`；`reserve` 由 `getAtomicServiceBar()` 实测宽度 +12 动态计算（`24-31`） | `ui/Common.ets:20-45` |
| `PrimaryAction` | `Button(label)` 全宽 | `minHeight: 52`，`fontSize(16)`，`borderRadius(14)` | 底 `APP.accent`，字 `Color.White` | 默认 / 禁用（`enabled(false)` + `opacity(0.45)`） | `ui/Common.ets:47-55` |
| `EmptyState` | `Column({space:14})`：图标 40 + 标题 20 Bold + 提示 14 | `padding(28)`，`justifyContent: Center` | 字 `APP.text` / `APP.sub` | 单态 | `ui/Common.ets:57-66` |
| `PlaceRow` | `Row({space:14})`：44×44 图标砖 + 两行文字（16 Medium / 14）+ 尾部图标 20 | `padding(16)`，`borderRadius(16)`，`border` 1 或 1.5 | 未选中底 `APP.card`、描边 `APP.line`；选中底 `APP.accentSoft`、描边 `APP.accent`；图标砖选中时翻为 `APP.card` | 默认 / 选中（`check` 图标）/ 尾部 `next` | `ui/Common.ets:68-86` |
| `SectionTitle` | `Row`：标题 18 Bold + 可选 `detail` 14 | `padding{top:4,bottom:4}` | `APP.text` / `APP.sub` | 单态 | `ui/Common.ets:88-95` |

### 7.2 页面内联结构（目标规约：应下沉为组件）

| 类别 | 现状结构 | 尺寸 / 圆角 | 颜色令牌 | 状态 | 分散位置 |
|---|---|---|---|---|---|
| **卡片** | `Column/Row` + 底 `APP.card` | 圆角 **18**（区块）/ **16**（列表项）；`padding` 16/20/24 | `APP.card` | 默认 | `pages/Index.ets:53,64,100`、`pages/MetroGuide.ets:21,46`、`pages/FloorBrowse.ets:55,88` |
| **胶囊 / Chip** | `Button(text)` | `minHeight: 48`；`padding{left:16,right:16}`；圆角 **12** | 选中：底 `APP.accent` + 字 `Color.White`；未选中：底 `APP.card` + 字 `APP.sub` | 默认 / 选中 | `ui/PlacePicker.ets:55-58`（分类）、`ui/PlacePicker.ets:95-96`（快捷起点）、`pages/Route.ets:90-92`（路线偏好）、`pages/Route.ets:217-218`（楼层段） |
| **Tab（横向滚动）** | `Scroll(Horizontal)` + `Row({space:8})` + Chip | 容器 `height(52)`（分类）/ `height(56)`（偏好）/ `height(48)`（楼层段）；`scrollBar(BarState.Off)` | 同上 | 选中态由外部 `@State` 驱动 | `ui/PlacePicker.ets:85-88`、`pages/Route.ets:208-212,214-221`、`pages/FloorBrowse.ets:66-75` |
| **列表项** | `List({space:10})` + `ListItem` + `PlaceRow` | `space:10`；`padding{left:20,right:20,top:8,bottom:12}` | 继承 `PlaceRow` | 默认 / 选中 | `ui/PlacePicker.ets:109-113` |
| **弹层：底部面板** | `bindSheet($$showSteps, stepSheet(), { height: SheetSize.LARGE, showClose: true, dragBar: true, backgroundColor: APP.card })` | 内容 `padding(24)` | 底 `APP.card` | 开 / 关（`@State showSteps`） | `pages/Route.ets:247`；内容 `pages/Route.ets:110-130` |
| **弹层：菜单** | `bindMenu(this.preferenceMenu)` + `Menu/MenuItem` | `MenuItem` 未设尺寸（系统默认） | 未设色（系统默认） | 4 项单态 | `pages/Route.ets:80-87,150` |
| **进度指示** | 文本式：`"步骤 N / M · 楼层"` | `fontSize(14)`，`APP.accent` | `APP.accent` | 无图形进度条 | `pages/Route.ets:146-147` |
| **步骤条目（全程步骤）** | `Row({space:12})`：序号 16 Bold 宽 32 + 标题 16 + 副信息 14 | `padding(14)`，圆角 **12** | 当前步骤底 `APP.accentSoft`，其余底 `APP.bg` | 当前 / 非当前 | `pages/Route.ets:114-126` |
| **提示条（安检）** | `Row({space:8})`：盾牌图标 20 + 文字 14 | `padding{left:20,right:20,top:10,bottom:10}` | 底 **硬编码** `#FFF2DF`，字 `APP.gtext` | 条件显示 | `pages/Route.ets:201-203` |
| **底部固定操作区** | `Column({space:10})` 固定于页底 | `padding(16)` | 底 `APP.card` | 三态：`preview` / `guiding` / `completed` | `pages/Route.ets:131-178` |
| **维度徽标（地铁步骤号）** | `Text(no)` | `36×36`，圆角 **10**，`fontSize(16)` Bold | 底 `APP.accentSoft`，字 `APP.accent` | 单态，**不可点击** | `pages/MetroGuide.ets:27-28` |
| **方向卡（地铁）** | `Row({space:16})`：`60×60` 图标砖（圆角 18、底 `APP.accentSoft`）+ 双行文字 + `next` 图标 24 | `padding(20)`，圆角 **18**，`border({width:1, color: APP.line})` | `APP.card` / `APP.line` | 单态可点 | `pages/MetroGuide.ets:14-22` |

> 目标规约（建议）：把上表下沉为 5 个新组件——`AppCard`（区块/列表两级）、`AppChip`（含 selected/disabled）、`AppTabs`（横向滚动 + 选中管理）、`AppSheet`（底部面板壳）、`StepProgress`（图形进度，替代纯文本计数）。下沉前先解决 §6.2 的圆角留空问题。

---

## 8. 图标规范

### 8.1 现有图标清单（18 个，`harmony_app/entry/src/main/resources/rawfile/icons/`）

| # | 文件 | # | 文件 | # | 文件 |
|---|---|---|---|---|---|
| 1 | `back.svg` | 7 | `fit.svg` | 13 | `pin.svg` |
| 2 | `bag.svg` | 8 | `layers.svg` | 14 | `plane.svg` |
| 3 | `brand.svg` | 9 | `map.svg` | 15 | `plus.svg` |
| 4 | `check.svg` | 10 | `metro.svg` | 16 | `search.svg` |
| 5 | `close.svg` | 11 | `minus.svg` | 17 | `shield.svg` |
| 6 | `facility.svg` | 12 | `next.svg` | 18 | `swap.svg` |

### 8.2 尺寸/描边/用色规约（逐文件核对的实测值，18/18 完全一致）

| 属性 | 实测值 | 说明 |
|---|---|---|
| 画布 | `width="24" height="24" viewBox="0 0 24 24"` | 统一 24 网格 |
| 填充 | `fill="none"` | 纯线性图标，无实心块 |
| 描边色 | `stroke="#007F7A"` | **全部 18 个写死 `APP.accent` 的字面值** |
| 描边宽 | `stroke-width="1.8"` | 统一 1.8（≈ 24 网格上的 1.8px） |
| 端点/接头 | `stroke-linecap="round" stroke-linejoin="round"` | 统一圆头圆角 |
| 图形语言 | 仅 `path` / `rect` / `circle`，无 `text`、无内联 `<style>`、无 `<defs>` | 便于后续程序化重着色 |

**代码侧尺寸**（`iconSize` 实测分布）：**32**（`ui/Common.ets:38` brand、`pages/FloorBrowse.ets:43` pin）、**30**（`pages/MetroGuide.ets:15`）、**28**（`pages/Index.ets:51` 任务卡）、**24**（默认值 `ui/Common.ets:16`；`ui/Common.ets:35,73`、`pages/Index.ets:93`、`pages/MetroGuide.ets:20`）、**22**（`pages/Route.ets:101`、`ui/FloorCanvas.ets:208` 缩放控件）、**20**（`pages/Route.ets:202`、`pages/Index.ets:98`、`ui/Common.ets:81`）、**40**（`ui/Common.ets:61` 空态）。

**图标 → 类型映射**（`ui/Common.ets:6-12`，`iconFor(type)`）

| 类型 | 图标 | 类型 | 图标 |
|---|---|---|---|
| `gate`、`checkin` | `plane` | `baggage` | `bag` |
| `metro` | `metro` | `toilet` | `facility` |
| `security` | `shield` | 其它（含 `entrance`/`exit`/`coach`/`parking`/`hall`） | `pin` |
| `lift`、`escalator`、`stair` | `layers` | | |

> 观察：`iconFor` 只产出 **6 种**不同图标覆盖 15 种类型，且 `entrance`/`exit` 与 `hall`/`coach`/`parking` 全部落到 `pin` —— 与 §3.2 的配色重复问题同源。

### 8.3 `tools/gen_icons.py` 的真实参数（launcher PNG，与 SVG 无关）

| 项 | 实测值 | 位置 |
|---|---|---|
| 输出 | `harmony_app/AppScope/resources/base/media/app_icon.png` **216×216**、透明底 | `tools/gen_icons.py:73` |
| 输出 | `harmony_app/entry/src/main/resources/base/media/icon.png` **108×108**、透明底 | `tools/gen_icons.py:74` |
| 输出 | `harmony_app/entry/src/main/resources/base/media/startIcon.png` **216×216**、**不透明全底** | `tools/gen_icons.py:75` |
| 配色 | `BG = (15,31,46)` = `#0F1F2E`（夜航底）、`PIN = (90,156,236)` = `#5A9CEC`、`CORE = (252,252,251)` = `#FCFCFB` | `tools/gen_icons.py:20-22` |
| 几何 | pin 头半径 `r = size * 0.24`；尖端长 `size * 0.22`，半宽 `size * 0.06`；白芯 `r * 0.34`，全部以画布中心为基准 | `tools/gen_icons.py:33-37` |
| 实现 | 纯标准库（`struct` + `zlib`）手写 PNG，`zlib.compress(raw, 9)`，RGBA(8,6,0,0,0) | `tools/gen_icons.py:8,64-66` |
| 注释声明 | "配色（对齐 Theme：深青夜航底 + 导航蓝 pin + 白芯）" | `tools/gen_icons.py:19` |

**冲突**：`#0F1F2E` 与 `#5A9CEC` **并不存在于 `ui/Theme.ets` 的任何调色板**——脚本注释声称"对齐 Theme"，实际未对齐。同一批 PNG 还被 `tools/gen_brand_assets.py`（`BG #F4F7F9` / `INK #063F4B` / `ACCENT #087E8B` / `PALE #D7EEF0`，`tools/gen_brand_assets.py:12-16`）**写到完全相同的三个路径**，两个脚本互不感知。

> 目标规约（建议）：SVG 图标保持"24 网格 + 1.8 描边 + 圆头圆角"三条硬约束；新增图标必须复制同一模板。**描边色写死 `#007F7A` 意味着图标无法随上下文换色**——若需要"白字图标"或"禁用灰图标"，短期做法是为该场景新增一个变体文件（如建议新增的 `next_white.svg`，当前不存在），长期做法是把描边色改为 `currentColor` 并在 `Image` 外层用 `.fillColor()`（需先验证 ArkUI 对 `$rawfile` SVG 的 `fillColor` 支持）。

---

## 9. 中英文与文案规则

### 9.1 三套并存的文案系统（现状）

| 系统 | 位置 | 规模 | 是否被界面引用 | 取证 |
|---|---|---|---|---|
| **A. `Loc.t()`** | `harmony_app/entry/src/main/ets/model/Loc.ets` | `TEXTS` 数组 **112** 个键（`grep -c 'key: "'`） | ✅ **唯一实际生效的界面文案** | `model/Loc.ets:3-116`，用法遍布 6 页 |
| **B. 语义名表** | `model/Localization.ets` 的 `TYPE_ZH`/`TYPE_EN`（15 项）+ `model/AirportMap.ets` 的 `NODE_EN`、`FLOOR_LABELS(_EN)` | 15 类型 + 119 节点英文名 | ✅ 节点名/类型名/楼层名 | `model/Localization.ets:6-66`、`model/AirportMap.ets:84+` |
| **C. 字符串资源** | `resources/base/element/string.json`（66 键）+ `resources/en_US/element/string.json`（66 键） | 66 × 2 | ❌ **零引用**：`grep -rn "app.string" harmony_app/` 无命中 | `resources/base/element/string.json`、`resources/en_US/element/string.json` |

**C 系统是死资源**：66 个键（`module_desc`、`EntryAbility_desc`、`EntryAbility_label` 除外）在 `.ets` 中完全没有 `$r('app.string.xxx')` 消费。同时 `harmony_app/AppScope/resources/base|en_US/element/string.json` 各只有 1 个 `app_name`，被 `harmony_app/AppScope/app.json5` 引用（这是活的）。

**`AGENTS.md` §7 的"改动配方"与现状不一致**：该表写"新增中英文案 → `resources/base|en_US/element/string.json`"，但按此操作**界面上不会出现任何变化**（新增的键无人读取）。真正生效的位置是 `model/Loc.ets`。

**取舍规则（建议，供 TODO.md）**

| 场景 | 应放哪里 | 理由 |
|---|---|---|
| 界面固定文案（按钮、标题、提示） | `model/Loc.ets` 的 `TEXTS` | 与现状一致，零改动成本；`Loc.t(key)` 支持 `zh/en` 双值 |
| 节点名、楼层名、类型名 | 保持现状：中文在 `data/*.map.json` → `AirportMap.ets`，英文在 `NODE_EN`；类型标签在 `Localization.ets` | 数据驱动，由 `tools/gen_model.py` 生成 |
| 应用名 / Ability 描述 | `AppScope` 与 `entry` 的 `string.json`（**仅这 3+1 个键**） | 这是资源系统的固有用途，无法用 ArkTS 表达 |
| **其余 62 个 `string.json` 键** | 建议删除；若决定迁移到资源系统，则必须一次性迁移并删除 `Loc.ets`，**不允许两套并存** | 双写必然漂移 |

### 9.2 中英对照长度约束（实测，供排版验收）

| 项 | 中文最长（字符） | 英文最长（字符） | 出处 |
|---|---|---|---|
| 主标题 | `你想去哪里？`(6) | `Where would you like to go?`(27) | `model/Loc.ets:5` |
| 大标题 | `你准备去哪个方向？`(9) | `Which direction are you going?`(30) | `model/Loc.ets:42` |
| 列表项/正文 | `按照指引行走，到达后手动确认`(14) | `Follow the route and confirm each step manually`(47) | `model/Loc.ets:74` |
| 按钮 | `从这里出发，查看路线`(9) | `View route from here`(19) | `model/Loc.ets:27` |
| 最短按钮 | `乘`(1) / `从` / `到` | `Take`(4) / `From` / `to` | `model/Loc.ets:93,99,100` |
| 类型标签 | `行李提取`(4) | `Departure Gate`(14) | `model/Localization.ets:7,24` |
| 节点标签（Canvas） | 追加 `登机口` 前缀被剥离 | `Gate ` 前缀被剥离 | `ui/FloorCanvas.ets:150` |
| Canvas 截断阈值 | `> 22` 字符则截到 20 + `…`（`p > 0` 时） | 同 | `ui/FloorCanvas.ets:151` |

**观察**：英文比中文长 **2.0–3.4 倍**。而多数文字控件只给了 `maxLines(2)` 或 `maxLines(3)`，按钮高度固定 `48`：

| 约束现状 | 位置 | 风险 |
|---|---|---|
| 按钮内文字 `maxLines(2)` + `height(48)` + `fontSize(14)` | `pages/Route.ets:148,151` | 英文 `Route preference` / `All route steps` 在 2.0 倍字号下 48vp 高度会挤压或裁剪 |
| 标题 `maxLines(1)` + 省略号 | `ui/Common.ets:39-40` | 英文长标题（如 `Where are you now?`）在窄屏会省略 |
| 步骤标题 `maxLines(3)` | `pages/Route.ets:155` | 英文 47 字符文案的余量已接近上限 |
| 列表项 `maxLines(2)` | `ui/Common.ets:76,79` | 英文类型标签 `Escalator` 与楼层信息拼成一行，易折行 |

> 目标规约（建议）：以英文为排版基准——按钮文案 ≤ 20 字符、标题 ≤ 30 字符、说明 ≤ 48 字符；所有按钮用 `constraintSize({minHeight: 48})` 而非 `height(48)`，使其在大字体/长文案下可自然增高。

### 9.3 大字体场景的表现要求

| 事实 | 证据 |
|---|---|
| 工程允许跟随系统字号，上限 **2.0 倍** | `harmony_app/AppScope/resources/base/profile/configuration.json`：`fontSizeScale: followSystem`、`fontSizeMaxScale: 2` |
| Canvas 文字也随系统缩放 | `ui/FloorCanvas.ets:29` 用 `getUIContext().fp2px(size)`；行高同理（`:144`），标签避让按 `labelH` 计算（`:145`）——**地图标签在大字体下会自动避让，这是本项目做得最到位的一处大字体适配** |
| 实测只覆盖到 **约 1.3 倍** | `docs/reports/ProductExperience-20261001.md:15`："API 24 大字体（约为标准字号的 1.3 倍）" |
| 1.3 倍下的验证结论 | 同上："首页入口、键盘压缩后的搜索结果、已选地点和路线指引操作区仍可见" |
| 大字体截图证据 | `docs/images/product-20261001/api24-large-font-home.jpeg`、`api24-large-font-search-keyboard.jpeg`、`api24-large-font-selected.jpeg`、`api24-large-font-guidance.jpeg`（共 4 张，见 `docs/images/product-20261001/README.md`） |
| 2.0 倍未验证 | `docs/reports/ProductExperience-20261001.md` 的"尚未覆盖"节未包含 2.0 倍；报告中只有 1.3 倍的证据 |

> 目标规约（建议）：大字体表现的三条硬要求——① 所有固定高度容器改用 `minHeight`；② 键盘弹出时（`pages/Index.ets:26` 已设 `KeyboardAvoidMode.RESIZE`）底部主按钮必须仍可见；③ 每次改动视觉后，至少在 1.3 倍（已有基线）与 **2.0 倍（当前缺口）** 两档下各自截图首页 / 搜索结果 / 路线指引三屏。

---

## 10. 适配规约（直板 / 折叠 / 宽屏）

### 10.1 现状

| 项 | 现状 | 证据 |
|---|---|---|
| 声明的设备类型 | **仅 `default`** | `harmony_app/entry/src/main/module.json5` 的 `deviceTypes: ["default"]` |
| 响应式 API | **零使用**：`mediaquery`、`GridRow`/`GridCol`、`breakpoint`、`display`、`windowRect`、`isFoldable`、`onWindowSizeChange` 全部 0 命中 | `grep -rn` 于 `ets/` 返回空 |
| 唯一的"宽屏"手段 | `constraintSize({ maxWidth: N })` 居中限宽，共 5 处，**且分成两档（不一致）** | `840`：`pages/Index.ets:128`、`pages/MetroGuide.ets:47`、`ui/PlacePicker.ets:120`；`1000`：`pages/Route.ets:246`、`pages/FloorBrowse.ets:90` |
| 窗口外观 | 硬编码浅色：底 `#F4F7F9`，状态栏/导航栏同底、前景 `#172B3A` | `entryability/EntryAbility.ets:19-24` |
| 分页清单 | `main_pages.json` 只注册 `pages/Index`；其余 5 页走 `Navigation`/`NavDestination`（`pages/Index.ets:68-74`） | `resources/base/profile/main_pages.json` |
| 折叠/展开实测证据 | 折叠态 `1080×2444`、展开态 `2210×2416` 重适配通过 | `docs/reports/ProductExperience-20261001.md:15,80` |
| 宽屏实测证据 | API 24 MateX7 宽屏跨层预览/指引/换层步骤；API 26 自建 `2210×2416` MateX7-profile 宽屏中英文全流程 | `docs/reports/ProductExperience-20261001.md:15,73,78,79`；步骤级摘要见 `docs/reports/product-20261001/api24-state.json`、`api24-map.json`、`api24-metro.json` |
| 局限声明 | "API 23 设备实测尚未进行；API 24/26 宽屏及折叠态证据来自 QA 模拟器配置，**不代表实体折叠屏验收**" | `docs/reports/ProductExperience-20261001.md:107` |

**结论**：宽屏/折叠"能跑"是靠**限宽居中 + 底部/顶部固定操作区**这两个偶然性质实现的，**没有任何显式断点**。新增页面若忘了 `maxWidth` 约束，在 2210 宽屏上会横向拉伸。

### 10.2 断点建议（目标规约）

| 断点名 | 宽度（vp） | 依据 | 布局规约 |
|---|---|---|---|
| `compact` | `< 600` | 直板手机基准：实测截图 `1320×2848`（`docs/images/product-20261001/phone/manifest.json`），折叠态 `1080×2444` 折起后接近此档 | 单列，`padding 20`，底部固定操作区，横向滚动 Tab |
| `medium` | `600 – 839` | 介于折叠展开与宽屏之间 | 单列 + `maxWidth: 840` 居中；地图高度提升（`pages/Route.ets` 的 `mapHeight` 由面积计算得出，见 `pages/Route.ets:222-227`） |
| `expanded` | `≥ 840` | 当前 `840` 断点的既有分界；展开态 `2210×2416`、宽屏 `2210×2416` 均落此档 | 内容区 `maxWidth: 840` **统一**（删除 `1000` 档，或把两档都提到 1000 并同步 5 处）；可考虑地图与列表左右分栏 |

> 建议：断点实现优先用 `GridRow`/`GridCol` 的 `breakpoints`，其次 `mediaquery`；**禁止**继续用新增的魔法 `maxWidth` 数值。落地前先把现有 5 处 `maxWidth` 归一到同一个令牌（`layout_max_width`）。

### 10.3 必须验证的形态清单（每次改动视觉后的最小验收集）

| # | 形态 | 参数 | 必查点 | 现有证据 |
|---|---|---|---|---|
| 1 | 直板 · 中文 | `1320×2848` | 六页主流程、底部操作区可见 | `docs/images/product-20261001/phone/01-home.jpeg` … `11-floor-4f-map.jpeg`（11 张，含 `manifest.json`） |
| 2 | 直板 · 英文 | 同上 | 长文案不裁剪、按钮不溢出 | `docs/images/product-20261001/api26-route-preview-en.jpeg`、`api26-wide-final-guidance-en.jpeg` |
| 3 | 大字体（≥1.3 倍） | API 24 | 首页入口、键盘弹出后的搜索结果、已选地点、路线指引操作区 | `api24-large-font-home.jpeg`、`api24-large-font-search-keyboard.jpeg`、`api24-large-font-selected.jpeg`、`api24-large-font-guidance.jpeg` |
| 4 | 折叠态 | `1080×2444` | 起终点标记与按钮可见、路线不变 | `api24-folded-preview-en.jpeg`（`docs/reports/ProductExperience-20261001.md:80`） |
| 5 | 展开/宽屏 | `2210×2416` | 地图留白、终点标记、固定操作区；内容居中不贴边 | `api24-wide-transfer.jpeg`、`api26-wide-home-zh.jpeg`、`api26-wide-security-guidance-zh.jpeg`、`api26-wide-guidance-complete-zh.jpeg` |
| 6 | 地图三视图 | 2F / 4F / B2 | 标签避让、通道双层描边、路线白描边 | `docs/images/map-2f.png`、`map-4f.png`、`map-b2.png`、`map-overview.png` |

> 建议：此清单应进入 PR 模板；其中第 3 项需**补测 2.0 倍**（当前缺证据），第 5 项需明确"模拟器证据 ≠ 实体折叠屏验收"。

---

## 11. 设计系统落地清单（现状 → 目标规约 → 要改的文件）

按优先级分组；本表同时作为 `docs/TODO.md` 的设计侧输入。

### P0（阻断一致性，必须先做）

| # | 现状 | 目标规约 | 要改的文件 |
|---|---|---|---|
| P0-1 | `ui/Theme.ets` 中 `ROUTE.*`(3) + `HIT`(1) + `MAP.grid/ink/muted/corridor/landWash/airWash`(6) + `APP.card2`(1) 共 **11 个令牌零引用**；`float.json` 的 `card_radius`/`pill_radius` 亦零引用 | 逐个决策：**要么接线，要么删除**。`ROUTE.case`→`ui/FloorCanvas.ets:90` 的 `'#FFFFFF'`；`MAP.corridor`→`:68` 的 `'#FFFFFF'`；`ROUTE.color`→`:72` 的 `APP.accent`；`MAP.ink`→`:80` 的 `APP.text`。`MAP.landWash/airWash` 需先实现区域面图层 | `ui/Theme.ets`、`ui/FloorCanvas.ets`、`resources/base/element/float.json` |
| P0-2 | `ROUTE.trans #B7DBD7` 与实画的 `#9ACCC6`（`ui/FloorCanvas.ets:70`）**已漂移** | 预览路线色只有一处定义；参考路线一律走令牌 | `ui/Theme.ets`、`ui/FloorCanvas.ets:70` |
| P0-3 | 圆角留空导致 **8 处按钮落回默认胶囊形**，与相邻 `borderRadius(12)` 并存 | 圆角只需 3 档（12/16/18），**禁止留空** | `pages/Route.ets:137,148,151,165,169`、`pages/FloorBrowse.ets:53`、`ui/Common.ets:35`、`ui/PlacePicker.ets:105` |
| P0-4 | `APP.bg #F4F7F9` 存在 **4 处副本**（`ui/Theme.ets:2`、`color.json`、`entryability/EntryAbility.ets:19,21,23`、`tools/gen_brand_assets.py:12`）；`APP.text` 有 2 处副本（`entryability/EntryAbility.ets:22,24`） | 确立单一真源；`EntryAbility` 与生成脚本不得再写字面色值 | `ui/Theme.ets`、`entryability/EntryAbility.ets`、`resources/base/element/color.json`、`tools/gen_brand_assets.py` |
| P0-5 | `tools/gen_icons.py` 与 `tools/gen_brand_assets.py` **写同一批三个 PNG**，配色互不相同（`#0F1F2E/#5A9CEC` vs `#F4F7F9/#087E8B`） | 只保留一个 launcher 生成器，或明确分工与执行顺序；图标配色必须能追溯到 `ui/Theme.ets` | `tools/gen_icons.py`、`tools/gen_brand_assets.py` |
| P0-6 | 类型色与 `APP.accent` **同值**（`#007F7A` 同时表示选中态与 4 种节点类型）；`entrance` 与 `exit` 同色同图标 | 交互强调色与类型色解耦；`entrance`/`exit` 至少在用色或用形上可区分 | `ui/Theme.ets:6`、`ui/Common.ets:6-12` |

### P1（统一规约，再做新功能）

| # | 现状 | 目标规约 | 要改的文件 |
|---|---|---|---|
| P1-1 | 字号 8 档（14/16/18/20/22/24/28/32），无令牌；间距 `space` 11 种值、`padding` 7 种值 | 字号收敛为 6 档 + Canvas 2 档；间距限定为 4 的倍数梯 | 全部 `pages/*.ets`、`ui/*.ets`；令牌落 `resources/base/element/float.json` |
| P1-2 | 内容限宽有 **840 / 1000 两档**并存 | 统一为一个 `layout_max_width` 令牌 | `pages/Index.ets:128`、`pages/MetroGuide.ets:47`、`ui/PlacePicker.ets:120`、`pages/Route.ets:246`、`pages/FloorBrowse.ets:90` |
| P1-3 | 弹层/胶囊/Tab/卡片/步骤条目**全部内联在页面**，样式在多页重复 | 下沉为 `AppCard`/`AppChip`/`AppTabs`/`AppSheet`/`StepProgress` | `ui/Common.ets`（新增）、`pages/*.ets`（替换内联） |
| P1-4 | `resources/base|en_US/element/string.json` **132 个键零引用**；`AGENTS.md` §7 的文案改动指引指向错误文件 | 删除死键或完整迁移；修正文档指引为 `model/Loc.ets` | `resources/base/element/string.json`、`resources/en_US/element/string.json`、`AGENTS.md` §7 |
| P1-5 | 大字体只实测到约 1.3 倍，工程允许 2.0 倍 | 所有固定高改 `minHeight`；补 2.0 倍三屏证据 | `ui/Common.ets:51`、`pages/Route.ets:148,151,169`、`resources/base/profile/configuration.json`（不动） |
| P1-6 | 起终点编辑热区纵向不足 48vp | 补足到 48vp（`constraintSize` 或 `padding`） | `pages/Route.ets:96-107` |
| P1-7 | `pages/Route.ets:107`、`pages/Route.ets:211,220,232,234` 等处仍使用 `space` 值 14、18，`padding` 值 18、28 等非 4 倍数数值 | 收敛到 4 的倍数梯 | `pages/Route.ets:107,211,220,232,234`、`ui/Common.ets:64`、`pages/Index.ets:99` |

### P2（增强与沉淀）

| # | 现状 | 目标规约 | 要改的文件 |
|---|---|---|---|
| P2-1 | `MAP.landWash`/`airWash` 预留但无区域面图层；`side` 字段不参与视觉 | 实现陆侧/空侧区域面（画在通道之下），让"安检分界"一眼可见 | `ui/FloorCanvas.ets`（新增图层）、`ui/Theme.ets` |
| P2-2 | 无图例 UI；`Loc.t('legend')` 只在 `pages/FloorBrowse.ets:82` 当副标题文字用 | 地图增加可折叠图例，用 `TYPE_COLOR` + `iconFor` 自动生成 | `ui/FloorCanvas.ets`、`ui/Common.ets`、`model/Loc.ets` |
| P2-3 | 进度只有文本 `步骤 N / M`（`pages/Route.ets:146`） | 图形化步骤进度（点阵/分段条），使用 `APP.accent` + `APP.accentSoft` | `pages/Route.ets`、`ui/Common.ets` |
| P2-4 | 图标描边色写死 `#007F7A`，无法换色 | 统一模板 + 支持 `fillColor` 或提供变体；`iconFor` 覆盖 15 类型 | `resources/rawfile/icons/*.svg`（18 个）、`ui/Common.ets:6-12` |
| P2-5 | Canvas 字体名写死 `'HarmonyOS Sans'` | 交给系统或声明回退族，并在多语言下验证 | `ui/FloorCanvas.ets:29` |
| P2-6 | 无深色模式；`EntryAbility` 硬编码浅色窗口 | 待 `color.json` 成为真源后再评估深色模式 | `entryability/EntryAbility.ets`、`resources/base/element/color.json` |
| P2-7 | `model/Categories.ets` 的 `symbol` 字段与 `catSymbol()` 全项目**零引用** | 删除，或落到分类胶囊的行首装饰 | `model/Categories.ets:14-23,73-81` |

---

---

## 12. 令牌的落地方式（v1.6 起）

令牌不再只是文档约定，而是**生成物 + 检查脚本**：

| 消费端 | 拿到令牌的方式 | 生成物 |
|---|---|---|
| Web (CSS) | `apps/web/src/tokens.css` 的 `:root` 自定义属性 | 由 `tools/export_shared.py` 生成 |
| 小程序 (WXSS) | `apps/weapp/miniprogram/tokens.wxss` 的 `page` 自定义属性 | 同上（px → rpx 按 1:2） |
| Apple (SwiftUI) | `airport-data.json` 的 `tokens` 字段，由 `AirportUI/Theme` 读取 | 同上 |
| ArkTS（上游） | 直接 import `Theme.ets` | 真源 |

真源：`harmony_app/entry/src/main/ets/ui/Theme.ets`（颜色）+ `resources/base/element/float.json`（圆角）。

**约束（由 `node tools/check_tokens.mjs` 强制）**：

1. `tokens.css` / `tokens.wxss` 必须与真源逐项一致（与 TS 核心的 `AIRPORT.tokens` 对表）；
2. 业务样式（`styles.css` / `app.wxss`）里**不得出现与令牌同值的硬编码色** —— 只允许语义别名里显式写死的
   `--on-accent: #FFFFFF` 与 `--warn-bg: #FFF2DF`（这两个在 ArkTS 侧同样是硬编码，见 docs/TODO.md T-203）；
3. 所有 `var(--x)` 引用必须有定义（防拼错、防删定义留引用）；
4. Web 与小程序暴露的语义别名集合必须一致（两端观感不能靠人自觉）。

仍未收敛的是**字号与间距**（T-202）：两端目前按"视觉近似"给值，尚未逐档映射到 §5/§6 的阶梯。

## 变更记录

| 版本 | 日期 | 修改人 | 说明 |
|---|---|---|---|
| v1.0 | 2026-10-02 | DSH Agent | 首次创建，基于 main@8350ff4 |
| v1.6 | 2026-10-02 | DSH Agent | 新增 §12 令牌落地方式：三端生成物 + check_tokens 5 项强制约束 |