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
├── Sources/AirportCLI/main.swift          命令行示例（macOS 直接运行）
└── Tests/AirportCoreTests/                15 项回归，含跨语言逐节点比对
    └── Fixtures/routes.json               【生成物】824 条 TS 基准路线
```

## 快速开始

**在 Xcode 里**（推荐）：`File → Open…` 选择本目录的 `Package.swift`，选中 `airport-cli` scheme 直接 Run。

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

`swift test` 共 15 项，其中最有分量的是两条：

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

- **还没有 UI**：本包只包含核心 + CLI。SwiftUI 界面（六页 + Canvas 地图）是下一步，见
  `docs/TODO.md` 的 T-609。
- **本机没有 iOS 模拟器运行时**（`xcrun simctl list runtimes` 为空）：iOS 目标能编译，
  要跑模拟器需先在 Xcode → Settings → Components 里下载。macOS 目标不需要模拟器。
- **米数有两个口径**：`Route.totalMeters`（含换层）与 `RouteView.walkingMeters`（只算 walk 边，
  ArkTS 界面用的是它）。CLI 两个都打印，差异登记在 `docs/TODO.md` T-017。
