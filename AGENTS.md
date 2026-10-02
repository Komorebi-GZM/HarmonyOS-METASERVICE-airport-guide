# AGENTS.md

> 图片编号 01 · AI 进入项目首先需要知道的信息

这份文件是本仓库的**唯一入口**：任何 AI（或新加入的人）在动手改代码前，先读完这一页。它只回答三件事——**这是什么项目、哪些线不能踩、改东西要去哪里**。细节分别见 `docs/` 下的七份专项文档（索引见文末）。

---

## 1. 项目一句话

**星海国际机场 XHA（虚构）· 室内导航**：一份平台无关的导航内核（119 节点图 + 跨层最短路径 + 安检必经 + 中英双语），外面套多个客户端壳——HarmonyOS 元服务（上游原工程）、Web/PWA、微信小程序、macOS/iOS。

- 上游仓库：`https://gitcode.com/harmony-practice-center/HarmonyOS-METASERVICE-airport-guide.git`（git remote 名 **`upstream`**）
- 本工作区：**个人本地 fork 开发环境**，分支 `main`。原工程基线 `8350ff4`，文档基线 `3a1a5d3`。**默认不推送到任何远程**。
- 许可：MIT。教学案例，六页流程、119 节点 / 145 边。
- 多端布局：`harmony_app/`（上游 ArkTS 原工程，**只读参照**）+ `packages/core/`（共享核心，唯一逻辑真源）+ `apps/web/`（Web/PWA，已可用）+ `apps/apple/`（Swift 核心 + SwiftUI 六页界面，核心已通过跨语言比对）+ `apps/weapp/`（微信小程序，复用同一份核心）。

## 2. 红线（改代码前必须接受）

| # | 铁律 | 原因 / 后果 |
|---|---|---|
| 1 | **`harmony_app/entry/src/main/ets/model/AirportMap.ets` 是生成物，禁止手改。** | 文件头已写明"自动生成，请勿手改"。改它 = 下次跑生成器就丢，且与 `data/*.map.json` 漂移。 |
| 2 | **地图的真源是 `tools/gen_maps.py`，不是 JSON。** | `gen_maps.py:main()` 会**覆盖写** `data/XHA_xinghai_t1.map.json`。只改 JSON 再跑 `gen_maps.py` 会把你的改动冲掉。 |
| 3 | **数据变更必须走完整链路**：`gen_maps.py` → `gen_model.py` → `export_shared.py`。 | 漏跑任一步，ArkTS 端与共享核心就会各自停留在旧数据上，且不报错。 |
| 4 | **安检节点必须恰好一个**（当前 `xha_p4_sec`）。 | `gen_model.py` 用 `assert len(secs) == 1` 硬校验；它是陆侧/空侧的**割点**，寻路的"必经安检"等价性依赖它。 |
| 5 | **保持"纯端侧"**：不引入云端、账号、支付、权限申请、网络请求。 | 这是产品的立身之本（`installationFree: true` 的元服务），加了就不是这个案例了。 |
| 6 | **不要修改上游交付物**：`README.md`、`docs/BUILD.md`、`docs/需求文档.md`、`docs/开发文档.md`、`data/README.md`、`docs/reports/**`、`cases/**`、`docs/images/**`、`tools/gen_maps.py` 与 `tools/gen_model.py` 的地图内容。 | 它们是上游交付物与历史证据；移植只在 `packages/`、`apps/` 内新增。 |
| 7 | 注释用中文，代码标识符用英文；沿用现有文件风格（一个文件一个主题）。 | 与既有 4 千行代码保持一致，避免风格撕裂。 |
| 8 | **`packages/core/src/generated/**` 是生成物，禁止手改。** 文案改 `Loc.ets`、配色改 `Theme.ets`、地图改 `gen_maps.py`，然后跑 `python3 tools/export_shared.py`。 | 生成链是"ArkTS 真源 → 共享核心"的唯一通道；手改会在下次导出时静默丢失。 |
| 9 | **`packages/core` 不许依赖任何平台 API**（无 DOM、无 `wx.*`、无 ArkTS Kit）。 | 它是 Web / 小程序 / Swift 的共同底座；一旦引入平台依赖，多端共享即失效。 |
| 10 | **改完核心必须跑 `npm run test:all`**（核心 37 + 令牌 6 + Web 15 + Apple 46 + 小程序 9 = 113 项）。 | 共享核心是 ArkTS 逻辑的移植，回归是唯一能证明"各端没走偏"的手段。 |
| 11 | **改核心后必须重跑导出与打包**：`export_shared.py`（TS/Swift 数据）→ `npm run fixtures`（寻路 + 渲染两份跨语言基准）→ `build_weapp.mjs`（小程序产物）。 | 都是生成物，漏跑会让某一端停留在旧逻辑上且不报错。 |
| 12 | **颜色与尺寸只写令牌引用**：用 `var(--app-accent)` / `var(--font-19)` / `var(--space-16)`；SwiftUI 用 `Theme.font(...)`。`node tools/check_tokens.mjs` 会拒绝与令牌同值的硬编码与字号/圆角字面量。 | 三端观感一致靠的是同一份令牌，不是三处手工同步。 |

## 3. 快速事实卡

| 项 | 值 | 出处 |
|---|---|---|
| 应用类型 | 元服务 `atomicService`，`installationFree: true` | `harmony_app/AppScope/app.json5`、`harmony_app/entry/src/main/module.json5` |
| bundleName / 版本 | `com.example.airportguide` / 1.0.0 | `harmony_app/AppScope/app.json5` |
| 兼容与目标 SDK | `6.1.0(23)`，runtimeOS HarmonyOS | `harmony_app/build-profile.json5` |
| 模型版本 | hvigor / oh-package `6.0.0` | `harmony_app/hvigor/hvigor-config.json5`、`harmony_app/oh-package.json5` |
| 模块 | 单 `entry` 模块（`apiType: stageMode`），`main_pages.json` 只注册 `pages/Index` | `harmony_app/entry/build-profile.json5`、`.../resources/base/profile/main_pages.json` |
| 地图规模 | 119 节点 / 145 边 / 6 层（4F·3F·2F·1F·B1·B2） | `data/README.md`、`harmony_app/.../model/AirportMap.ets:1-6` |
| 唯一安检 | `xha_p4_sec`（咽喉割点） | `AirportMap.ets:SECURITY_ID`、`tools/gen_model.py:127+` |
| 坐标标定 | `pxPerMeter = 2.0`，walk 权重 = 像素距离 ÷ 2，四舍五入到 5 米 | `tools/gen_maps.py:16`、`data/README.md` |
| 换层基准权重 | 电梯 30m / 扶梯 40m / 楼梯 25m / 捷运 350m（未使用） | `tools/gen_maps.py:18`、`core/Pathfinder.ets:13-16` |
| 代码规模 | 22 个 `.ets`（4 008 行）；另有 2 个 `hvigorfile.ts` 共 10 行；生成模型 `AirportMap.ets` 单文件 2 139 行 | `find harmony_app -name '*.ets' \| xargs wc -l` |
| 本地存储 | preferences `airport-guide`：`language`(zh/en) + `recent`(≤6) | `core/LocalStore.ets` |

## 4. 目录地图

```
airport-guide/                       ← 工作区根 = 项目根（pnpm workspace）
├── AGENTS.md                        ← 本文件（AI 入口）
├── package.json / pnpm-workspace.yaml / .npmrc
├── packages/core/                   ← ★ 平台无关共享核心（唯一逻辑真源）
│   ├── src/types.ts graph.ts pathfinder.ts route-steps.ts planner.ts
│   │        places.ts categories.ts i18n.ts viewport.ts index.ts
│   ├── src/render.ts                ← ★ 绘制命令流（Web/小程序/Swift 三端共同的渲染契约）
│   ├── src/app-model.ts             ← ★ 六页状态机（Web/小程序共用）
│   ├── src/presenter.ts             ← ★ 文案与列表映射（Web/小程序共用）
│   ├── src/generated/               ← 【生成物】map-data / i18n-data / labels / tokens
│   └── test/                        ← 37 项回归（conformance 16 + render 13 + app-model 8）
├── apps/web/                        ← ★ Web/PWA 客户端（Vite + TS + Canvas 2D）
│   ├── index.html  vite.config.ts  src/{main,map-view,storage}.ts  src/styles.css
│   ├── public/{manifest.webmanifest,icon*.svg}   ← PWA 清单与图标
│   ├── src/tokens.css               ← 【生成物】令牌：颜色 + 字号/间距/圆角
│   └── dist/                        ← 构建产物（.gitignore）
├── apps/apple/                      ← ★ Apple 端（SwiftPM，Xcode 打开 Package.swift）
│   ├── Sources/AirportCore/         ← Swift 核心移植 + Resources/airport-data.json（生成物）
│   ├── Sources/AirportUI/           ← 呈现层（AppModel/Presenter/MapRenderer/Metrics）
│   ├── Sources/AirportGuideApp/     ← SwiftUI 六页 + Canvas 地图
│   ├── Sources/AirportCLI/          ← 命令行示例（macOS 可直接运行）
│   ├── Tests/AirportCoreTests/      ← 18 项（含 824 条路线 + 664 条绘制命令的跨语言比对）
│   └── Tests/AirportUITests/        ← 28 项回归（文案/绘制命令/状态机/偏好/尺寸阶梯）
├── apps/weapp/                      ← ★ 微信小程序端（开发者工具打开 apps/weapp）
│   ├── project.config.json
│   └── miniprogram/{app.*, tokens.wxss(生成物), utils/*, pages/*/index.{js,wxml}}
├── harmony_app/                     ← 上游 HarmonyOS ArkTS 原工程（只读参照）
│   ├── AppScope/  entry/src/main/{ets,resources}/
├── data/                            ← 地图数据真源产物（XHA_xinghai_t1.map.json）
├── tools/                           ← 生成/校验/导出脚本（Python + Node）
│   ├── gen_maps.py → gen_model.py   ← 地图数据链
│   ├── export_shared.py             ← ★ 导出到 packages/core/src/generated
│   ├── pathfind_reference.py        ← 寻路参考实现（500 组自测）
│   ├── gen_route_fixture.mjs        ← ★ 跨语言基准：824 条路线（寻路）
│   ├── gen_render_fixture.mjs       ← ★ 跨语言基准：664 条绘制命令（渲染）
│   ├── web_smoke.mjs                ← Web 端到端冒烟（15 项断言）
│   ├── build_weapp.mjs              ← 把核心打包成小程序可 require 的单文件
│   ├── weapp_smoke.mjs              ← 小程序冒烟（9 项：配置/文案/页面流程/Canvas/包体）
│   ├── weapp_static.mjs             ← ★ 小程序静态契约（绑定/事件/wx:key/样式类/页面登记）
│   ├── build_web_pwa.mjs            ← ★ 生成 service worker 并自检（PWA 离线）
│   ├── check_tokens.mjs             ← ★ 设计令牌一致性检查（三端同源 + 禁止硬编码）
│   └── apple_test.sh                ← swift test/run 的沙箱友好包装
├── docs/                            ← 8 份工作区文档 + 上游 BUILD/需求/开发文档
├── cases/                           ← 案例交付包（只读）
└── README.md                        ← 上游教学案例说明（只读）
```

## 5. 代码结构速查（一句话一个文件）

**model/**（数据与语义）
- `AirportMap.ets` — 【生成物】`XHA_NODES`/`XHA_EDGES`/`SECURITY_ID`/`FLOOR_ORDER`/`FLOOR_LABELS(_EN)`/`FLOOR_BBOX`/`NODE_EN`。
- `Loc.ets` — **运行时双语文案表**：`TEXTS: Translation[]`（`{key, zh, en}`）+ `Loc.t()`/`Loc.floor()`。**UI 文案在这里，不在 `string.json`**（全仓库 `$r()` 使用数为 0；`resources` 下 `base` 与 `en_US` 的 `element/string.json` 各 66 个键中，63 键无引用，仅 `module_desc`/`EntryAbility_desc`/`EntryAbility_label` 被 `module.json5` 使用）。
- `Categories.ets` — `catOf()`：节点 → 分类。
- `Localization.ets` — 语义文案：`TYPE_ZH` 等类型标签、楼层名、`nodeName(n, en)`（`NODE_EN` 兜底）。

**core/**（纯逻辑，无 UI）
- `Pathfinder.ets` — Dijkstra + 四档偏好 + 安检拆段 + `mergeTransitLegs`；导出 `planRoute`、`Route`/`RouteLeg`/`RouteTransition`、`QUICK_STARTS`。
- `RouteSteps.ets` — `buildRouteView()`：Route → 可展示步骤（walk/security/transfer/destination）与 `status`。
- `PlannerState.ets` — 行程状态与转移函数（不可变替换 + `revision`）。
- `Places.ets` — 索引、`searchPlaces`、`publicPlace`、`gateCode`、`recentPlaces`。
- `Viewport.ets` — 缩放/平移/适配（`fitInsets`、`pinch`、`clampT`）。
- `LocalStore.ets` — preferences 读写。
- `Router.ets` — `NAV_*` 路由名常量。

**ui/**：`Theme.ets`（调色板）、`Common.ets`（通用组件）、`FloorCanvas.ets`（Canvas 绘制 + 命中）、`PlacePicker.ets`（搜索与分类选择）。

**pages/**：`Index.ets`（宿主 + Navigation）、`SelectTarget.ets`、`SelectStart.ets`、`Route.ets`、`MetroGuide.ets`、`FloorBrowse.ets`。

## 6. 命令速查

> 完整参数、前置条件与产物见 [docs/development.md](docs/development.md) 与上游 `docs/BUILD.md`。**下面顺序不可颠倒**。

```bash
# 1) 改图数据（真源）→ 重新生成 JSON
python3 tools/gen_maps.py

# 2) JSON → ArkTS 类型化模型（会 assert 安检唯一、空侧非空）
python3 tools/gen_model.py

# 3) 渲染节点图 SVG 到 preview/（.gitignore 已忽略，本地看图用）
python3 tools/preview_nodes.py

# 4) 寻路一致性参考实现（Python 独立复算，与 .ets 对齐）
python3 tools/pathfind_reference.py

# 5) 构建 / 安装（需 DevEco SDK 环境，详见 docs/BUILD.md）
```

真机/模拟器流程回归脚本需要 `hdc` 设备：`tools/verify_flows.py --target <hdc-id> --out <dir>`、`tools/smoke_emulator.py --target <hdc-id> --out <dir>`。

### 多端（共享核心 + Web）

```bash
# 改了 ArkTS 真源（Loc.ets / Theme.ets / gen_maps.py）之后必须重新导出，否则多端看到的是旧数据
python3 tools/export_shared.py

# 共享核心一致性回归：37 项，含 14 042 组全量节点对、500 组×4 偏好、6 条参考样例、13 项渲染、8 项状态机
npm test

# Web 开发服务器（Mac 本机浏览器直接可用）
pnpm install          # 首次
pnpm web              # -> http://127.0.0.1:5173
pnpm web:build        # 产出 apps/web/dist（含 manifest + sw.js，可离线安装 / 静态托管 / WKWebView 壳）

# Web 端到端冒烟（跑构建产物，覆盖 首页→目的地→起点→路线→指引→完成→楼层地图）
pnpm test:web

# 跨语言基准（改了寻路/渲染/数据后重跑；Swift 与小程序都靠它对齐）
npm run fixtures

# 设计令牌一致性（三端同源、样式里无硬编码）
npm run test:tokens
```

### Apple 端（macOS / iOS）

```bash
npm run test:apple                    # = bash tools/apple_test.sh test —— 46 项 Swift 回归（核心 18 + 呈现 28）
npm run apple:build                   # 编译全部目标（含 SwiftUI 应用）
npm run apple:run                     # 打印 6 条参考样例（与 pathfind_reference.py 同口径）
bash tools/apple_test.sh run AirportGuideApp      # 直接启动图形界面
bash tools/apple_test.sh run airport-cli --from xha_p1_taxi --to xha_p4_gA101 --steps
```

Xcode 里直接 `File → Open…` 选 `apps/apple/Package.swift` 即可；终端下若报 `sandbox_apply`/权限错误，
就用 `tools/apple_test.sh`（它把 SwiftPM 缓存指到仓库内并加 `--disable-sandbox`）。详见 `apps/apple/README.md`。

### 微信小程序端

```bash
node tools/build_weapp.mjs     # 生成 apps/weapp/miniprogram/utils/core.js（改了核心必须重跑）
npm run test:weapp             # 9 项冒烟 + 5 项静态契约（绑定/事件/wx:key/样式类/页面登记）
# 再用微信开发者工具「导入项目」选择 apps/weapp 目录
```

## 7. 改动配方（最短路径）

| 想做什么 | 改哪里 | 然后跑 |
|---|---|---|
| 加/改一个地点、加一条边 | `tools/gen_maps.py` 的 `XHA` spec | `gen_maps.py` → `gen_model.py` → `preview_nodes.py` |
| 加一种地点类型 / 配色 | `model/Categories.ets`、`ui/Theme.ets` 的 `TYPE_COLOR` | 跑一次 `gen_model.py` 确认语义层不报错 |
| 新增中英文案 | **UI 文案在 `model/Loc.ets` 的 `TEXTS` 表**（`{key, zh, en}`）；节点名走 `NODE_EN`（由 `tools/gen_model.py` 生成）；`resources/**/string.json` 目前无代码引用 | 中英各走一遍流程 |
| 改视觉（颜色/圆角/字号） | `ui/Theme.ets`、`resources/base/element/{color,float}.json`，规约见 `docs/DESIGN.md` | 目视 6 页 + 大字体检查 |
| 改寻路规则/偏好 | `core/Pathfinder.ets`（`PREF_MULT`、`VERTICAL_WEIGHT`） | `pathfind_reference.py` 对照 + 手工走查 |
| 加/改页面 | `pages/`，路由常量在 `core/Router.ets`，页面清单 `resources/base/profile/main_pages.json` | 全流程回归 |
| 改行程状态 | `core/PlannerState.ets`（保持"替换对象"写法，别就地改字段） | 走 editing→preview→guiding→completed |

## 8. 文档索引

| 文档 | 图片编号 | 回答什么 |
|---|---|---|
| [AGENTS.md](AGENTS.md)（本文件） | 01 | AI 上手必须知道的红线、地图与入口 |
| [docs/DESIGN.md](docs/DESIGN.md) | 02 | 视觉规则、设计令牌、组件与适配规约 |
| [docs/TODO.md](docs/TODO.md) | 03 | 当前任务、优先级、进度与验收口径 |
| [docs/project-overview.md](docs/project-overview.md) | 04 | 项目定位、能力清单、非目标、术语与交付物 |
| [docs/architecture.md](docs/architecture.md) | 05 | 分层、数据生成链、寻路算法、状态机、渲染 |
| [docs/user-guide.md](docs/user-guide.md) | 06 | 用户能做什么、每步看到什么、异常提示 |
| [docs/development.md](docs/development.md) | 07 | 环境、命令、生成链路、回归清单、Git 工作流 |
| [docs/component-api.md](docs/component-api.md) | 08 | 每个模块/组件的签名、参数、契约与依赖方向 |

上游既有文档（只读参考）：`README.md`（教学实践路径）、`docs/BUILD.md`（构建手册）、`docs/需求文档.md`、`docs/开发文档.md`、`data/README.md`（图数据规范）、`docs/reports/ProductExperience-20261001.md`（产品体验报告）。

## 9. 工作区与 Git 约定

- 本地 fork 工作区，**只有 `upstream` 一个 remote**；`main` 跟踪 `upstream/main`。
- 同步上游：`git fetch upstream && git rebase upstream/main`（本地提交请分支化，例如 `feat/xxx`）。
- 将来若要推自己的 fork：`git remote add myfork <你的仓库地址>` 再 `git push -u myfork <分支>`。**未经用户明确同意，不要执行任何 push / force / 远端改写。**
- 提交信息沿用现有风格：`feat: ...` / `docs: ...` / `fix: ...`（中文描述，见 `git log --oneline`）。

## 10. 已知问题与待确认

以下是核实时已发现的**事实性冲突或风险**，动手前请先确认（详细拆解与优先级见 [docs/TODO.md](docs/TODO.md)）：

1. **仓库地址不一致**：`README.md` 的案例仓地址写作 `HarmonyOS-AtomSer-airport-guide.git`，而本工作区来源与任务给定地址是 `HarmonyOS-METASERVICE-airport-guide.git`。以任务给定地址为准，README 侧待上游修正。
2. **"改 JSON"的说法有歧义**：`data/README.md` 建议"改 JSON 后重跑 `gen_maps.py`"，但 `gen_maps.py` 实际**覆盖**该 JSON。真源是 `gen_maps.py`，`data/README.md` 待修正。
3. **平台兼容待更新**：工程 `compatibleSdkVersion`/`targetSdkVersion` 为 `6.1.0(23)`，但 `docs/reports/`、`docs/images/product-20261001/` 中已有 API 24 / API 26 设备的体验记录（大字体、折叠、宽屏）。下一轮升级需明确支持的 API 档位与相应验证。
4. **`data/README.md` 的楼层说明与数据规模**：其 `meta.floors` 示例只列 4F/3F/B1/B2，而真实数据含 2F/1F 共六层，示例与现状不一致。
5. **离线校验两极化**：`python3 tools/pathfind_reference.py`（500 组随机起终点）本机实测**通过**；`node tools/verify_product.mjs`（6 套件 / 500 组 × 4 偏好 = 2 000 条路线）在 Windows + DevEco 环境通过，但第 9 行硬编码了 Windows 的 `typescript.js` 绝对路径，**在 macOS 上实测直接报错**；其余流程校验依赖 `hdc` 设备（`verify_flows.py`、`smoke_emulator.py`）。两条离线校验也缺统一入口（"一键回归"），这是本轮工程质量提升的入口。
6. **API 23 无实测证据**：工程声明兼容 `6.1.0(23)`，但 `docs/reports/ProductExperience-20261001.md:107` 明确"API 23 设备实测尚未进行"，实测集中在 API 24/26。
7. **`preview/` 是本地生成物**，已在 `.gitignore` 中；不要把它当作可提交资产。
8. **视觉令牌已三端同源，但观感未逐屏比对**：颜色/字号/圆角/间距已成令牌（T-201、T-202，由 `check_tokens.mjs` 强制），剩余"阶梯外间距字面量"（混合值声明）会轻微影响布局，收敛需与逐屏走查一起做（T-216 / T-612 / T-614）。
9. **共享核心的回归是"内部一致 + 参考样例对齐"**：它证明了与 `tools/pathfind_reference.py` 的样例米数一致、割点拆分与全图 Dijkstra 等价，但没有在设备上逐个比对 ArkTS 运行时结果（本机无 DevEco SDK）。
10. **Apple 端界面已实现但未做真机视觉走查**：核心通过 824 条跨语言逐节点比对（T-606），
    SwiftUI 六页 + Canvas 地图已可编译运行（T-609），呈现层有 28 项测试；但本机无 iOS 模拟器运行时，
    界面只在 macOS 上编译验证过，还没做逐屏视觉核对。
11. **本机缺少 iOS 模拟器运行时与微信开发者工具**：`xcrun simctl list runtimes` 为空（可编译不可运行）；`/Applications` 里没有微信开发者工具，因此**小程序的 WXML/WXSS 从未真实渲染过**（工程自洽性由 9 项冒烟覆盖，见 `apps/weapp/README.md`）。
12. **Web 端已纯视图化**（v1.5）：`apps/web/src/main.ts` 只负责渲染与转发动作，状态机与文案来自共享核心；此处保留一行是因为历史上曾存在重复实现，便于回溯。

---

## 变更记录

| 版本 | 日期 | 修改人 | 说明 |
|---|---|---|---|
| v1.0 | 2026-10-02 | DSH Agent | 首次创建，基于 main@8350ff4；建立 8 份工作区文档的入口与红线 |
| v1.1 | 2026-10-02 | DSH Agent | 加入多端移植：共享核心 `packages/core`（16 项回归）+ Web/PWA `apps/web`（14 项端到端）；新增红线 8–10 与多端命令 |
| v1.2 | 2026-10-02 | DSH Agent | 加入 Apple 端：`apps/apple`（Swift 核心 + CLI，15 项回归含 824 条与 TS 逐节点比对）+ 跨语言基准脚本 |
| v1.3 | 2026-10-02 | DSH Agent | Apple 端补齐 SwiftUI 六页 + Canvas 地图与呈现层 27 项回归；修复「修改出发位置」误入目的地页的缺陷（Web 端同步修复并加回归） |
| v1.4 | 2026-10-02 | DSH Agent | 渲染命令流与状态机/呈现层上提到共享核心；交付微信小程序端（六页 + Canvas 2D，9 项冒烟）；新增红线 11 |
| v1.5 | 2026-10-02 | DSH Agent | Web 端纯视图化（改用共享 AppModel）；新增渲染命令流的跨语言基准（10 场景 / 664 条命令，Swift 逐条比对通过） |
| v1.6 | 2026-10-02 | DSH Agent | 设计令牌三端同源：`export_shared.py` 生成 `tokens.css`/`tokens.wxss`，Web 与小程序样式全部改为令牌引用；新增 `check_tokens.mjs` 与红线 12 |
| v1.7 | 2026-10-02 | DSH Agent | 尺寸阶梯令牌化：13 字号 / 10 间距 / 6 圆角，三端共用（Apple 走 `Metrics`）；检查脚本增至 6 项 |
| v1.8 | 2026-10-02 | DSH Agent | 两端静态契约检查：小程序 `weapp_static.mjs`（5 项）、Web 类名契约；修复两处未定义样式 |
| v1.9 | 2026-10-02 | DSH Agent | Web 端补齐 PWA：manifest + 图标 + 带内容指纹的 service worker 与 3 项自检 |
