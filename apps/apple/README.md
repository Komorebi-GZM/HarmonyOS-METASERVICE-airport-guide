# Apple 端（macOS / iOS）· 星海机场导航

这是本项目的 Apple 端工程：一个 **SwiftPM 包**，里面是导航核心的 Swift 移植，
以及一个可直接运行的命令行示例。**用 Xcode 打开本目录的 `Package.swift` 即可开始开发。**

```
apps/apple/
├── Package.swift                          ← Xcode 直接打开这个文件
├── Sources/AirportCore/                   ← 共享核心（Swift 移植，无 UI 依赖）
│   ├── Graph.swift                        图模型 / 陆空侧判定 / 楼层包围盒
│   ├── Pathfinder.swift                   Dijkstra + 安检割点 + 四档偏好
│   ├── RouteSteps.swift                   Route → 逐步指引
│   ├── Planner.swift                      行程状态机（值语义）
│   ├── Support.swift                      地点检索 / 分类 / 双语 / 视口
│   └── Resources/airport-data.json        【生成物】勿手改，见下
├── Sources/AirportUI/                     ← 呈现层（纯逻辑，可测）：AppModel / Presenter / MapRenderer / Color
├── Sources/AirportGuideApp/               ← SwiftUI 应用（六页 + Canvas 地图）
│   ├── RootView.swift                     外壳/主题/首页/地铁
│   ├── Views.swift                        目的地/出发位置/路线/楼层地图
│   └── MapCanvasView.swift                绘制命令流的解释器 + 手势
├── Sources/AirportCLI/main.swift          命令行示例（macOS 直接运行）
├── Tests/AirportCoreTests/                15 项核心回归，含跨语言逐节点比对
│   └── Fixtures/routes.json               【生成物】824 条 TS 基准路线
└── Tests/AirportUITests/                  27 项呈现层回归（文案/绘制命令/状态机/偏好）
```

## 快速开始

**在 Xcode 里**（推荐）：`File → Open…` 选择本目录的 `Package.swift`，选中 `AirportGuideApp` scheme，Run 即可看到六页界面。

**直接跑图形界面**（终端）：

```bash
cd apps/apple && swift run AirportGuideApp     # 沙箱环境用 bash tools/apple_test.sh run AirportGuideApp
```

**在终端里**：

```bash
cd apps/apple
swift run airport-cli                                  # 打印 6 条参考样例
swift run airport-cli --from xha_p1_taxi --to xha_p4_gA101 --steps
swift run airport-cli --from xha_b2_platA --to xha_p4_airMall --lang en
swift test                                             # 15 项回归
```

若终端报 `sandbox-exec: sandbox_apply: Operation not permitted` 或权限错误（常见于受限沙箱环境），
用仓库提供的包装脚本，它会把缓存指到仓库内并跳过 SwiftPM 自带的 sandbox：

```bash
bash tools/apple_test.sh test
bash tools/apple_test.sh run airport-cli --from xha_p4_doorW --to xha_p4_gC308
```

## 数据来源：不要手改这两个 JSON

| 文件 | 生成方式 |
|---|---|
| `Sources/AirportCore/Resources/airport-data.json` | `python3 tools/export_shared.py`（从 ArkTS 真源导出，同时写 `packages/core/assets/`） |
| `Tests/AirportCoreTests/Fixtures/routes.json` | `node tools/gen_route_fixture.mjs`（用 TypeScript 共享核心算出 824 条基准路线） |

改了 ArkTS 侧的地图 / 文案 / 配色后，**必须重跑这两个脚本**，否则 Swift 端会停留在旧数据上；
`swift test` 里的 `testFixtureMatchesCurrentData` 会通过 `sourceMapSha256` 检出这种漂移。

## 一致性怎么保证

`swift test` 共 **42 项**（核心 15 + 呈现层 27）。呈现层覆盖：步骤文案与主操作按钮（四种 kind × 中英）、
分类 chips、状态文案、卡片解析、地点筛选；地图**绘制命令流**的图层顺序、走廊双描边、路线层开关、
标记只在所属楼层出现、标签可见阈值、节点半径规则、命中半径、路线适配不越界、以及全部令牌颜色的可解析性；
应用状态机的完整流程（首页→目的地→起点→路线→指引→完成→重开）、步骤前后跳转、当前楼层跟随步骤、
语言与最近列表的持久化与失效过滤。

核心 15 项里最有分量的是两条：

1. **`testAllPairsReachableAndCutVertexEquivalence`**：14 042 组全量有序节点对，
   组组可达；异侧路线与"全图 Dijkstra"逐节点等价，且必经 `xha_p4_sec`。
2. **`testRouteByRouteParity`**：把 824 条基准路线（206 组起终点 × 4 档偏好 + 4 条边界样本）
   与 TypeScript 端的结果**逐项比对**——节点序列、总米数、是否过安检、legs、transitions、
   步骤序列、步行米数全部相等。这意味着三端（ArkTS / TS / Swift）在同一组并列最短路里
   选出的是同一条路径。

## 与 ArkTS 端的两处有意差异

| 项 | ArkTS | 本包 | 原因 |
|---|---|---|---|
| `side`（陆/空侧）、楼层包围盒 | 构建期由 `gen_model.py` 算好并编译进 `AirportMap.ets` | 加载期用同一算法现算 | 让各端只需要那份 JSON |
| 平行边（同节点对、不同类型/权重） | `_etype` 后写覆盖先写 | 直接抛 `AirportEdgeError.parallelEdge` | 静默取错类型比崩溃更难查 |
| `apm`（捷运）权重 | 权重表缺项 → 兜底 25m | 补 350m | 上游文档保留了该类型，属实现漏项 |

## 已知限制（下一步）

- **UI 已完成但只在本机编译验证**：`AirportGuideApp`（SwiftUI 六页 + Canvas 地图）能编译、其逻辑层有 27 项测试，
  但没有在真机/模拟器上做过视觉走查（本机没有 iOS 模拟器运行时；macOS 目标可直接运行）。
- **本机没有 iOS 模拟器运行时**（`xcrun simctl list runtimes` 为空）：iOS 目标能编译，
  要跑模拟器需先在 Xcode → Settings → Components 里下载。macOS 目标不需要模拟器。
- **米数有两个口径**：`Route.totalMeters`（含换层）与 `RouteView.walkingMeters`（只算 walk 边，
  ArkTS 界面用的是它）。CLI 两个都打印，差异登记在 `docs/TODO.md` T-017。
