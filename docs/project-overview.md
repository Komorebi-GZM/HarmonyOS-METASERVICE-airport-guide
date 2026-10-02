# 项目整体说明（project-overview.md）

> 图片编号 04 · 项目整体说明

本文档回答"这个项目是什么、给谁用、能做什么、不做什么"。它汇总产品定位、能力清单（含代码与文档的冲突核对）、非目标、六层航站楼规模、关键术语、交付物素材、项目状态与许可来源。事实以 `main@8350ff4` 的代码与数据为准；上游首版文档（`docs/需求文档.md`、`docs/开发文档.md`）中与当前代码不一致之处，本文档在表格里逐条标注。

---

## 1. 一句话定位

**星海国际机场 XHA（虚构）· 室内导航元服务**：HarmonyOS ArkTS 纯端侧应用，仅凭一张随包携带的本地节点图，完成"选目的地 → 选当前位置 → 规划跨楼层路线（陆侧↔空侧必经中央安检）→ 分步手动指引 → 地铁换乘引导"，并支持中英双语与最近的六个目的地。

- 目标用户：**站在航站楼里要赶路的人**——出发旅客、到达/接机人、地面换乘旅客（`docs/需求文档.md:34`）。
- 次要用户：把它当 ArkTS/ArkUI 教学案例来跑通与改造的开发者（`cases/case.json:55`）。
- 产品气质：**静态示例数据 + 手动选择位置 + 手动确认进度**，不是实时导航（`docs/reports/ProductExperience-20261001.md:31`）。

## 2. 使用场景：一条全链路

| 阶段 | 旅客诉求 | 应用内路径 | 出处 |
| --- | --- | --- | --- |
| 进入航站楼 | 从地铁/停车楼上来，不知道自己在哪层 | 首页楼层导览 4F/3F/2F/1F/B1/B2 逐层看图，或点选节点"我在这里" | `harmony_app/entry/src/main/ets/pages/Index.ets:121-126`、`pages/FloorBrowse.ets:17-21` |
| 值机 | 找值机岛 | 分类"值机·安检"或搜索中文名/英文名/登机口编号 | `ui/PlacePicker.ets:21`、`model/Categories.ets:16-17` |
| 安检 | 走错侧会白跑 | 陆侧→空侧强制经 `xha_p4_sec`，预览页显示"这条路线需要通过中央安检" | `core/Pathfinder.ets:196-212`、`model/Loc.ets:72` |
| 找登机口 | A/B/C 指廊 24 个登机口 | 搜 `A101`/`B203`/`C308`，路线按楼层分 Tab 展示 | `data/XHA_xinghai_t1.map.json`、`pages/Route.ets:214-221` |
| 到达 | 行李在哪、怎么出去 | 2F "行李提取A/B区"与 3 个到达出口 | `data/XHA_xinghai_t1.map.json` |
| 换乘地铁 | 往市区还是往星湖、怎么下去 | 首页"坐地铁" → 选方向 → 选当前位置 → 路线到 B2 站台 | `pages/MetroGuide.ets:41-45` |
| 接驳离开 | 打车/大巴/停车楼 | 1F 出租·网约上车点、机场巴士站台、航站楼间连廊 | `data/XHA_xinghai_t1.map.json` |

## 3. 产品能力清单（交叉核对结果）

核对来源：`README.md`、`docs/需求文档.md`、`docs/开发文档.md`、`data/README.md`、`docs/reports/ProductExperience-20261001.md`、`cases/case.json` 与 `harmony_app/entry/src/main/ets/**` 代码。**状态列以代码为准**；"冲突与备注"列给出文档与代码不一致的具体位置。

引用约定：下表"对应实现文件"与本文章节表中省略前缀的 `.../`、`pages/...`、`ui/...`、`core/...`、`model/...` 均指 `harmony_app/entry/src/main/ets/` 下的同名文件。

| 能力 | 说明 | 对应实现文件 | 状态 | 冲突与备注 |
| --- | --- | --- | --- | --- |
| 六层楼层浏览 | 4F/3F/2F/1F/B1/B2 逐层 Canvas 地图，可点选节点看详情 | `pages/Index.ets:121-126`、`ui/FloorCanvas.ets`、`pages/FloorBrowse.ets` | 已实现 | 真实规模 119 节点 / 145 边（`data/README.md:12`），与文档一致 |
| 目的地分类 + 搜索 | 9 个分类 Tab（全部/登机口/值机·安检/出入口/行李/地铁/接驳交通/停车·地面/商业·服务/换层设施），中英名与登机口编号子串匹配，精确编号优先 | `ui/PlacePicker.ets:53-114`、`model/Categories.ets:13-24`、`core/Places.ets:11-24` | 已实现 | `docs/需求文档.md:59-69` 写"登机口 24 个"正确；`cases/case.json:33` 与 `docs/需求文档.md:143` 记"119 节点 / 145 边"与数据一致，但其中的 `lift 19 / escalator 7 / stair 7` 是**节点**数，垂直**边**为 elevator 13 / escalator 4 / stair 4，两处易混 |
| 起点选择 | 8 个快捷起点 chips + 全节点检索 + 地图点选；选中写入草稿 | `ui/PlacePicker.ets:89-101`、`core/Pathfinder.ets:286-290`、`pages/FloorBrowse.ets:17-21` | 已实现 | `docs/需求文档.md:78` 说"默认起点 = 最近一次选过的起点（会话内记忆）"，代码未实现该默认值（`core/PlannerState.ets:15-17` 新行程起点为空）→ 文档超前 |
| 跨层寻路 | Dijkstra，walk 用米权，垂直边基准 elevator 30 / escalator 40 / stair 25 | `core/Pathfinder.ets:13-16,102-...` | 已实现 | 与 `docs/开发文档.md:155-165` 一致 |
| 安检必经 | 起终点异侧强制拆两段（起点→安检→终点）；同侧直接规划；任一端为安检时直接规划 | `core/Pathfinder.ets:196-212` | 已实现 | 与 `docs/开发文档.md:167-177`、`docs/需求文档.md:84-87` 一致 |
| 四档路线偏好 | 推荐路线 / 优先电梯 / 优先扶梯 / 尽量少走楼梯 | `core/Pathfinder.ets:19-24`、`pages/Route.ets:79-93` | 已实现 | 偏好乘子只影响选路，**显示米数一律用原始权重**（`core/Pathfinder.ets:229-230`），与 `docs/开发文档.md:287` 一致 |
| 逐层路径图 | 路线实际经过的楼层生成 Tabs（同层折返用 `floor:idx` 保证唯一），每页只画本层路段 | `core/Pathfinder.ets:213-268`、`pages/Route.ets:214-232` | 已实现 | `docs/需求文档.md:96` 要求"每层信息条：楼层名 + 该层路径长度 + 累计距离"，代码只显示当前段米数与总步行米数 → 部分未实现 |
| 手动分步指引 | 步骤拆为 walk / security / transfer / destination；当前步、下一步、上一步、全程步骤、逐项确认 | `core/RouteSteps.ets:12-42`、`pages/Route.ets:144-176` | 已实现 | 与 `docs/reports/ProductExperience-20261001.md:13` 一致 |
| 完成与重开 | 走完最后一步进入 `completed`，显示"本次指引已完成"与"规划新的路线" | `core/PlannerState.ets:39-42`、`pages/Route.ets:141-143` | 已实现 | 与 `cases/case.json:132-133` 一致 |
| 地铁换乘引导 | 两个方向卡片（往市区 / 往星湖度假区，目标 `xha_b2_platA` / `xha_b2_platB`）+ 静态三步说明 | `pages/MetroGuide.ets:41-46` | 已实现 | `docs/需求文档.md:100-104` 设想"引导页 + 复用逐层图"，当前是"选方向→选起点→复用 `Route` 逐层图"，三步卡片为静态展示不随路线变化 |
| 中英双语切换 | 运行时文案表 `Loc.ets`（112 条）+ `NODE_EN` 节点英文名；`AppStorage('lang')` 即时切换 | `model/Loc.ets`、`model/Localization.ets:58-66`、`pages/Index.ets:32` | 已实现 | **冲突**：`docs/需求文档.md:108` 要求"全部界面文案走 `$r('app.string.*')`"，实际 ETS 中 `$r(` 使用为 **0 处**（`resources/base|en_US/element/string.json` 各 66 条键未被代码引用）；`docs/开发文档.md:25` 已改为运行时文案表，属需求文档滞后 |
| 本地保存 | preferences `airport-guide`：`language`(zh/en) + `recent`(≤6)，启动时回读 | `core/LocalStore.ets:10-27`、`pages/Index.ets:24-31` | 已实现 | 与 `cases/case.json:43` 一致 |
| 最近使用 | 首页"最近查找"区（最多 6 条）与快捷起点；重复选择去重并置顶 | `pages/Index.ets:107-114`、`core/Places.ets:25-30` | 已实现 | 与 `README.md:52` 一致 |
| 地图手势 | 单指拖拽平移、双指捏合缩放、右上 +/- 缩放、`查看全层` / `查看路线` 复位 | `ui/FloorCanvas.ets:182-195,224-241`、`core/Viewport.ets:20-28` | 已实现 | 视口无 `reset()` 调用（`core/Viewport.ets:5` 已定义未使用）；`docs/开发文档.md:189` 写"zoom 钳制 0.15~8"与代码不符，实际为 `minZoom = fitZoom×0.75` 且上限 5 |
| 元服务、免安装 | `bundleType: atomicService`、`installationFree: true`、单 `EntryAbility` | `harmony_app/AppScope/app.json5:4`、`harmony_app/entry/src/main/module.json5:11` | 已实现 | 与 `docs/需求文档.md:189` 一致 |
| 路由/路径绘制动效 | 路径逐段生长动画、楼层切换转场、时长约 0.6–1s | `ui/FloorCanvas.ets` | **未实现** | `docs/需求文档.md:95` 与 `docs/开发文档.md:213-217`（"setInterval 16ms × 0.02 ≈ 800ms"）描述的生长动效在代码中不存在：`FloorCanvas` 只做静态折线绘制（`ui/FloorCanvas.ets:70-74`），全仓库无 `setInterval`/`animateTo` → 文档超前 |
| 手绘示意图背景 | 纸面 + 25m 网格 + 楼体轮廓圆角 + 通道带 | `ui/FloorCanvas.ets:57-69` | **部分实现** | 代码只画纸面底色、楼体包围盒填充块与 walk 边双层描边通道带；`docs/开发文档.md:191-199` 描述的 25m 网格、`roundRect` 圆角轮廓、`drawImage` 位图插槽均不在代码中 |
| 元服务卡片（桌面卡片） | — | — | **明确不做** | `docs/需求文档.md:6`："加分项 中英双语 / 地铁换乘引导 / 寻路动效（桌面卡片不做）"；工程内无 `form_config` 卡片配置 |

## 4. 非目标（明确不做）与理由

| 非目标 | 理由 | 证据 |
| --- | --- | --- |
| 无云端 / 无后端 | 数据随包，`installationFree` 元服务的立身之本 | `harmony_app/AppScope/app.json5:4`、`docs/需求文档.md:190`；全仓库无 `requestPermissions` / 网络权限声明 |
| 无账号 | 无需登录即可打开，教学场景无用户体系 | `docs/需求文档.md:4`；`module.json5` 无任何 `requestPermissions` |
| 无支付 | 只做导览，不涉及交易 | `docs/需求文档.md:4`、`docs/需求文档.md:190` |
| 无敏感权限申请 | 不申请定位/相机/存储等权限，起点由用户手动选 | `harmony_app/entry/src/main/module.json5`（全文 36 行无权限段）、`docs/reports/ProductExperience-20261001.md:31` |
| 无室内定位 | 无基站/蓝牙/Wi-Fi 指纹，"当前位置"是用户点选出来的 | `docs/需求文档.md:43`、`harmony_app/entry/src/main/ets/model/Loc.ets:17`（"位置由你手动选择"） |
| 无真实航班/登机口动态数据 | 登机口为静态示意，将来接动态数据只需替换 gate 坐标 | `data/README.md:47-48`、`docs/reports/ProductExperience-20261001.md:31` |
| 无真实机场数据 | 星海国际机场 XHA 是虚构教学场景，坐标"示意拓扑，非真实比例" | `data/XHA_xinghai_t1.map.json` 的 `meta.note`、`meta.source` |
| 无桌面元服务卡片 | 首版范围外（见 §3 同行） | `docs/需求文档.md:6` |
| 无进度持久化 | 行程指引进度只留在当前会话，新行程起终点为空 | `cases/case.json:139`、`core/PlannerState.ets:15-17` |

## 5. 六层航站楼概览

楼层顺序由 `FLOOR_ORDER = ['4F','3F','2F','1F','B1','B2']` 固定（`harmony_app/entry/src/main/ets/model/AirportMap.ets` 的 `FLOOR_ORDER`），楼层名见 `meta.floors`（`data/XHA_xinghai_t1.map.json`）。节点数按 `data/XHA_xinghai_t1.map.json` 实算；`FLOOR_BBOX` 为各层坐标包围盒（同一生成文件内）。

| 楼层 | 功能 | 节点数 | 该层节点类型分布 | 地图可点选节点数 | `FLOOR_BBOX` (x0,y0,x1,y1) |
| --- | --- | --- | --- | --- | --- |
| 4F | 出发层：出发门、值机岛、唯一中央安检、空侧商业、A/B/C 指廊 24 个登机口 | 55 | corridor 13、gate 24、lift 6、checkin 4、entrance 3、security 1、hall 1、toilet 1、escalator 1、stair 1 | 43 | 130, 60, 950, 820 |
| 3F | 空侧候机夹层：观景露台、餐饮、贵宾室 A/B、亲子游乐区（纯空侧） | 12 | hall 4、lift 3、corridor 2、toilet 1、escalator 1、stair 1 | 12 | 250, 140, 830, 560 |
| 2F | 到达层：行李提取 A/B 区、3 个到达出口、迎客区 | 21 | corridor 9、lift 3、exit 3、baggage 2、hall 1、toilet 1、escalator 1、stair 1 | 12 | 250, 110, 830, 560 |
| 1F | 地面迎客层：迎客大厅、出租·网约上车点、机场巴士站台、行李寄存处、航站楼间连廊 | 11 | lift 3、coach 2、corridor 2、hall 1、toilet 1、escalator 1、stair 1 | 11 | 250, 160, 830, 560 |
| B1 | 交通中心：地铁站厅（非付费区）、地铁闸机群、交通中心大厅、P1 停车楼、大巴候车区 | 14 | lift 3、escalator 2、coach 2、hall 2、stair 2、corridor 1、parking 1、toilet 1 | 14 | 150, 150, 880, 470 |
| B2 | 地铁站台：站台·往市区方向、站台·往星湖度假区、站台联络通道、扶梯/楼梯/电梯 | 6 | metro 2、escalator 1、stair 1、lift 1、corridor 1 | 6 | 300, 180, 700, 420 |

> 说明：`corridor` 是纯拓扑中转点，默认不显示、不可点选，仅 `PUBLIC_CORRIDORS` 白名单里的 7 个（含 `xha_p4_preSec`、`xha_b1_metroG`、`xha_b2_pasg` 等）对外可见（`harmony_app/entry/src/main/ets/core/Places.ets:6,9`），因此"地图可点选节点数"小于总节点数。
>
> 跨层连接共 **21 条垂直边**：elevator 13 / escalator 4 / stair 4（`data/XHA_xinghai_t1.map.json`）。公共电梯跨 4F→2F→1F→B1（C 井/东井延伸至 B2），空侧电梯与扶梯/楼梯各自成对。

## 6. 关键术语表

| 术语 | 含义 | 出处 |
| --- | --- | --- |
| 元服务 | HarmonyOS 上免安装的应用形态；本项目 `bundleType: atomicService` + `installationFree: true`，装入即可打开 | `harmony_app/AppScope/app.json5:4`、`harmony_app/entry/src/main/module.json5:11` |
| 元服务卡片 | 桌面/负一屏可挂载的卡片（`form_config`）。**本项目不做** | `docs/需求文档.md:6` |
| 节点图 | 由节点（`nodes`）+ 边（`edges`）构成的地点拓扑；本项目 119 节点 / 145 边 / 6 层 | `data/README.md:3,12`、`data/XHA_xinghai_t1.map.json` |
| 割点 | 从图中移除后会使连通分量增多的节点。`xha_p4_sec` 是陆侧与空侧之间**唯一通路**，因此是割点 | `docs/需求文档.md:84`、`docs/开发文档.md:175` |
| 陆侧 / 空侧 | 安检前后的两个连通区域；`side` 由生成器在移除安检节点后 BFS 派生（`land` / `air`） | `docs/开发文档.md:147-149`、`AirportMap.ets` 的 `MapNode.side` |
| leg | 路线中**同一楼层的连续节点段**；楼层 Tabs 按 leg 生成，key 为 `floor:idx` 以支持同层折返 | `docs/开发文档.md:177`、`core/Pathfinder.ets:213-232` |
| transition | 一次**跨层换乘**（电梯/扶梯/楼梯），字段含 `viaType`、`fromFloor`、`toFloor`、`meters` | `core/Pathfinder.ets` 的 `RouteTransition`、`docs/开发文档.md:177` |
| 楼层 bbox | 各层地图坐标包围盒，Canvas 用它做 `fit` 适配与背景底块 | `AirportMap.ets` 的 `FLOOR_BBOX`、`ui/FloorCanvas.ets:32-51` |
| walk 边 | 同层行走边，`weight` = 像素距离 ÷ `pxPerMeter`(2.0) 后四舍五入到 5 米，即真实米数 | `data/README.md:22,41` |
| 垂直边 | `elevator` 30m / `escalator` 40m / `stair` 25m，是**选路成本**而非步行米数 | `core/Pathfinder.ets:13-16`、`docs/开发文档.md:287` |
| 偏好乘子 | 四档偏好对垂直边成本的乘数矩阵（最短 1/1/1、优先电梯 0.7/1.6/3.2、优先扶梯 1.3/0.8/2.2、避楼梯 1/1.4/6） | `core/Pathfinder.ets:19-24` |
| `installationFree` | 模块级免安装标记，元服务必备 | `harmony_app/entry/src/main/module.json5:11` |
| 中央安检 | `xha_p4_sec`（数据中的名称是"中央安检大厅(唯一)"，界面统一显示为"中央安检大厅"） | `data/XHA_xinghai_t1.map.json`、`model/Localization.ets:60` |

## 7. 交付物与素材清单

### 7.1 案例交付包 `cases/`

| 文件 | 用途 |
| --- | --- |
| `cases/case.json` | 案例元数据：标题、难度"进阶"、时长 240 分钟、标签、知识点、FAQ、迁移场景 |
| `cases/practice.html` | 实践页面正文（`case.json` 的 `practice.content` 指向它） |
| `cases/cover.png` | 案例封面图（`baseInfo.coverImage`） |
| `cases/card.png` | 案例卡片图（`baseInfo.cardImage`） |
| `cases/share.png` | 分享图（`baseInfo.shareImage`） |
| `cases/preview-phone.png` | 手机预览合成图（`preview.devices[0].previewImage`） |
| `cases/arch-diagram.svg` | 架构图（`architecture.archImage`） |

### 7.2 产品截图 `docs/images/product-20261001/`

| 路径 | 内容 |
| --- | --- |
| `docs/images/product-20261001/phone/01-home.jpeg` … `11-floor-4f-map.jpeg` | 11 张 1320×2848 系统原始截图（中文、标准字号），逐页说明见 `docs/images/product-20261001/phone/README.md` |
| `docs/images/product-20261001/phone/manifest.json` | 每张图的分辨率、SHA-256 与对应 HAP 的 SHA-256 |
| `docs/images/product-20261001/api26-home-zh.jpeg`、`api26-route-preview-zh.jpeg`、`api26-route-preview-en.jpeg`、`api26-guidance-complete-zh.jpeg` | API 26 手机中英文核心流程证据 |
| `docs/images/product-20261001/api26-wide-home-zh.jpeg`、`api26-wide-security-guidance-zh.jpeg`、`api26-wide-guidance-complete-zh.jpeg`、`api26-wide-final-guidance-en.jpeg` | API 26 宽屏（2210×2416）证据 |
| `docs/images/product-20261001/api24-large-font-home.jpeg`、`api24-large-font-search-keyboard.jpeg`、`api24-large-font-selected.jpeg`、`api24-large-font-guidance.jpeg` | API 24 大字体（约 1.3 倍）证据 |
| `docs/images/product-20261001/api24-wide-transfer.jpeg`、`api24-folded-preview-en.jpeg` | API 24 宽屏换层与折叠态证据 |
| `docs/images/product-20261001/README.md` | 素材目录说明与用途 |

另有更早的地图渲染图 `docs/images/map-4f.png`、`map-2f.png`、`map-b2.png`、`map-overview.png`，与云端实践操作图 `docs/images/practice-20261001/01-case-cloud-entry.png` … `04-cloud-phone-create.png`。

### 7.3 体验报告 `docs/reports/`

| 文件 | 内容 |
| --- | --- |
| `docs/reports/ProductExperience-20261001.md` | 体验记录正文：验证范围、结果表、构建复现命令、体验边界、尚未覆盖项 |
| `docs/reports/ProductExperience-20261001.json` | 结构化元数据：HAP 路径/SHA-256/字节数、核心验证计数、API 24 三轮 UI 流程通过项、进程日志审计 |
| `docs/reports/product-20261001/api24-state.json` | API 24 中文状态流程 21 项通过摘要 |
| `docs/reports/product-20261001/api24-map.json` | API 24 中文六层与地图流程 14 项通过摘要 |
| `docs/reports/product-20261001/api24-metro.json` | API 24 英文地铁方向 6 项通过摘要 |

## 8. 项目状态与里程碑

### 8.1 Git 历史（`git log --oneline`，共 7 次提交，HEAD = `8350ff4`）

| 提交 | 日期 | 说明 |
| --- | --- | --- |
| `8350ff4` | 2026-10-01 | docs: 按案例生成规范更新交付包与展示素材（当前 HEAD） |
| `f5e65a8` | 2026-10-01 | docs: 完善并精简机场导航案例 README |
| `2fbffa9` | 2026-10-01 | docs: 更新 AI 对话实践路径与云端操作图 |
| `6815f2c` | 2026-10-01 | feat: 完善机场导航流程与案例素材 |
| `bbc0b92` | 2026-09-30 | doc：文档修复 |
| `f27cdf5` | 2026-09-28 | doc: 文档修复 |
| `949ab7f` | 2026-09-28 | feat: init HarmonyOS-METASERVICE-airport-guide |

本工作区的文档补写任务当前正在把 8 份工作区文档作为**新增未跟踪文件**写入 `docs/`，因此 `git status --short` 会列出这些 `??` 新文件；除新增文档外，已跟踪文件无任何改动。本地分支 `main`，仅有一个 remote `upstream`。

### 8.2 里程碑

| 时间 | 里程碑 | 证据 |
| --- | --- | --- |
| 2026-09-11 | 地图数据成型（`meta.date`） | `data/XHA_xinghai_t1.map.json` |
| 2026-09-15 | 真机构建通过 + 模拟器实跑 + 4 项问题修复轮 | `docs/开发文档.md:281-300` |
| 2026-09-28 | 仓库初始化提交 | `949ab7f` |
| 2026-10-01 | 产品体验验证（API 24/26、宽屏、折叠、大字体、中英文） | `docs/reports/ProductExperience-20261001.md` |
| 2026-10-01 | 交付包与素材按规范更新（HEAD） | `8350ff4` |

### 8.3 体验报告结论（`docs/reports/ProductExperience-20261001.md`）

- 数据与算法**未变**：119 节点 / 145 边 / 6 层，Dijkstra 与"陆侧↔空侧必经中央安检"的拆段规则保持（`:11`）。
- 离线校验通过：Python 寻路基线 500 组含安检断言；ArkTS 核心逻辑回归 6/6 套件、500 组 × 4 偏好 = 2 000 条路线（`:69-70`、`ProductExperience-20261001.json` 的 `coreVerification`）。
- 设备侧通过：API 26 手机中英文核心流程、API 26 宽屏中英文全流程、API 24 三轮 UI 摘要（21 + 14 + 6 项）、API 24 大字体与折叠/展开重适配（`:71-82`）。
- 产物：未签名 HAP 751,682 字节，SHA-256 `214963FB…AD18`，以 API 26 编译、运行接口保持 `6.1.0(23)`（`:35,53`）。
- 边界与未覆盖：**API 23 设备实测尚未进行**；宽屏/折叠证据来自 QA 模拟器配置，不代表实体折叠屏验收；API 26 的文本键盘搜索未纳入冒烟路径（`:105-109`）。

## 9. 许可与来源

| 项 | 内容 |
| --- | --- |
| 许可证 | MIT，版权方"鸿蒙实践案例开发团队"（`LICENSE:1-3`）；`README.md:558` 与 `cases/case.json` 亦声明 MIT |
| 上游源仓库 | `https://gitcode.com/harmony-practice-center/HarmonyOS-METASERVICE-airport-guide.git`（`git remote -v` 的 `upstream`） |
| 本工作区性质 | **个人本地 fork 开发环境**，分支 `main` 跟踪 `upstream/main`，默认不推送 |
| 当前基线 | `8350ff4`（7 次提交） |
| 数据来源 | 虚构机场，`meta.source` = "根据公开布局示意重构，非官方数据"；`meta.note` = "示意拓扑，非真实比例" |
| 素材归属 | 截图由模拟器 `snapshot_display` 原样采集，未裁剪/拼接/重绘（`docs/images/product-20261001/README.md`） |
| 已知地址不一致 | `README.md:93,187,253` 等处把案例仓写作 `HarmonyOS-AtomSer-airport-guide.git`，与本工作区 remote 的 `HarmonyOS-METASERVICE-airport-guide.git` 不一致，以 remote 为准 |

## 10. 文档间冲突汇总（供 TODO 处理）

| # | 冲突 | 文档说法 | 代码/数据事实 |
| --- | --- | --- | --- |
| 1 | 双语实现方式 | `docs/需求文档.md:108` 要求全部文案走 `$r('app.string.*')` | 代码中 `$r(` 0 处，实际用运行时 `Loc.ets`（112 键）；`string.json` 66 键未被引用 |
| 2 | 路径动效 | `docs/需求文档.md:95`、`docs/开发文档.md:213-217` 描述逐段生长动画 | `ui/FloorCanvas.ets` 仅静态绘制，无 `setInterval`/`animateTo` |
| 3 | 示意图背景 | `docs/开发文档.md:191-199` 描述 25m 网格 + 圆角楼体轮廓 + `drawImage` 插槽 | 代码只有底色、bbox 底块与通道带 |
| 4 | 视口缩放范围 | `docs/开发文档.md:189` 写 zoom 钳制 0.15~8 | `core/Viewport.ets:13,22`：`minZoom = fitZoom×0.75`，上限 5 |
| 5 | 默认起点记忆 | `docs/需求文档.md:78` 要求默认起点为最近一次选择 | `core/PlannerState.ets:15-17` 新行程起点为空 |
| 6 | 每层信息条 | `docs/需求文档.md:96` 要求每层显示该层长度 + 累计距离 | `pages/Route.ets` 只显示当前段米数与总步行米数 |
| 7 | 仓库地址 | `README.md` 写 `HarmonyOS-AtomSer-airport-guide.git` | remote 为 `HarmonyOS-METASERVICE-airport-guide.git` |
| 8 | 改数据入口 | `data/README.md:54` 建议"改 JSON 后重跑 `gen_maps.py`" | `tools/gen_maps.py` 会覆盖写该 JSON，真源是脚本 |
| 9 | 楼层示例 | `data/README.md:23` 的 `meta.floors` 示例只列 4F/3F/B1/B2 | 数据实含 6 层（4F/3F/2F/1F/B1/B2） |
| 10 | 平台兼容与实际验证 | 工程声明 `6.1.0(23)` | 体验证据集中在 API 24/26，API 23 未实测（`docs/reports/ProductExperience-20261001.md:107`） |

## 变更记录

| 版本 | 日期 | 修改人 | 说明 |
| --- | --- | --- | --- |
| v1.0 | 2026-10-02 | DSH Agent | 首次创建，基于 main@8350ff4 |
