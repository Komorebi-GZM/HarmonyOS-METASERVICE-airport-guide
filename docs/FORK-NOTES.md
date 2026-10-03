# Fork 说明 · 星海国际机场 XHA 多端移植

> 本文件说明本地 fork 相对上游做了什么、怎么跑、哪些目录只读、质量凭据与**已知限制**。
> 上游交付物（`README.md`、`docs/BUILD.md`、`docs/需求文档.md`、`docs/开发文档.md`、`data/README.md`、`docs/reports/**`、`cases/**`、`docs/images/**`）未改写。

## 1. 这个 fork 做了什么

上游把「星海国际机场 XHA（虚构）室内导航」做成了一个 HarmonyOS ArkTS 元服务（六页流程、119 节点 / 145 边 / 6 层、唯一安检割点 `xha_p4_sec`、中英双语、纯端侧无网络）。

本 fork 在同一份数据与同一套算法之上，把它拆成 **一份平台无关核心 + 四个客户端壳**：

| 目录 | 是什么 | 状态 |
|---|---|---|
| `harmony_app/` | 上游 ArkTS 原工程 | **只读参照，零改动**（相对上游基线 `8350ff4` diff 为空） |
| `packages/core/` | TypeScript 共享核心：图 / Dijkstra 寻路 / 路线步骤 / 六页状态机 / 文案呈现 / 绘制命令流 / 双语，**不依赖任何平台 API** | 唯一逻辑真源 |
| `apps/web/` | Web + PWA（Vite + Canvas 2D，manifest + 带内容指纹的 service worker，可离线安装） | 可用 |
| `apps/apple/` | SwiftPM：`AirportCore`（核心移植）+ `AirportUI`（呈现层）+ `AirportGuideApp`（SwiftUI 六页 + Canvas）+ `airport-cli` | 可编译运行；Xcode 直接 `File → Open…` 选 `apps/apple/Package.swift` |
| `apps/weapp/` | 微信小程序（开发者工具导入 `apps/weapp`），复用同一份核心（打包为 `miniprogram/utils/core.js`） | 工程自洽性由脚本覆盖 |

生成链仍是 `gen_maps.py → gen_model.py → export_shared.py`（`export_shared.py` 为本 fork 新增的第四段，把 ArkTS 真源导出为 TS/Swift 可用的数据与令牌）。

## 2. 怎么跑（一条命令 + 分端命令）

```bash
pnpm install                # 首次（Node ≥ 20.11，pnpm ≥ 10）
npm run check:all           # 一键门禁，10 步：漂移检测 → 导出 → Python 参考实现 → ArkTS 源码回归
                            #   → TS strict 类型检查 → 共享核心 → 令牌 → 跨语言基准 → Web → Apple+小程序
npm test                    # 共享核心回归
pnpm web                    # Web 开发服务器 http://127.0.0.1:5173
pnpm web:build              # 产出 apps/web/dist（含 manifest 与 sw.js）
npm run test:apple          # Swift 回归（沙箱友好包装 tools/apple_test.sh）
npm run test:weapp          # 小程序冒烟 + 静态契约
npm run fixtures            # 重新生成跨语言基准（824 条路线 + 664 条绘制命令）
```

改了 ArkTS 真源（`Loc.ets` / `Theme.ets` / `gen_maps.py`）之后必须重跑 `python3 tools/export_shared.py`，否则多端停留在旧数据上且**不报错**。`packages/core/src/generated/**`、`apps/web/src/tokens.css`、`apps/weapp/miniprogram/tokens.wxss`、`apps/weapp/miniprogram/utils/core.js` 都是生成物，**禁止手改**。

## 3. 哪些目录只读别动

| 路径 | 原因 |
|---|---|
| `harmony_app/**` | 上游原工程，本 fork 承诺零改动（已实测）；作为行为对照基准 |
| `harmony_app/entry/src/main/ets/model/AirportMap.ets` | 生成物（文件头已写"自动生成，请勿手改"） |
| `README.md`、`docs/BUILD.md`、`docs/需求文档.md`、`docs/开发文档.md`、`data/README.md`、`docs/reports/**`、`cases/**`、`docs/images/**` | 上游交付物与历史证据 |
| `tools/gen_maps.py`、`tools/gen_model.py` 的地图内容 | 地图真源是脚本 spec，不是 JSON；`gen_maps.py` 会**覆盖**`data/*.map.json` |
| `LICENSE` | MIT，版权方为鸿蒙实践案例开发团队，本 fork 未改写 |

UI 文案在 `model/Loc.ets` 的 `TEXTS`（`{key, zh, en}`）而**不在** `resources/**/string.json`；视觉令牌在 `ui/Theme.ets`，样式里只允许写令牌引用（`var(--app-accent)` / `var(--font-19)`，SwiftUI 用 `Theme.font(...)`），由 `tools/check_tokens.mjs` 拒绝硬编码并逐对核算 WCAG AA 对比度。

## 4. 质量证据

- 检查项合计 **124**（核心 38 + 令牌 7 + Web 端到端 15 + PWA 3 + Apple 47 + 小程序 14）。
- 本轮新鲜复跑（提交 `31cf6c6` 上）：`bash tools/check_all.sh` → `EXIT=0`，十步全部执行；复跑后 `git diff --stat` 为空 → 生成物**幂等重写、无净差异**。单独复跑定数：`npm test` → `tests 38 / pass 38 / fail 0`；`npm run test:apple` → `Executed 29 tests, with 0 failures` + `Executed 18 tests, with 0 failures`；`npm run test:weapp`、`npm run test:tokens`、`npm run typecheck` 均 `EXIT=0`。
- 跨语言锚点：824 条路线与 664 条绘制命令为 **TS → Swift 单向消费**的基准（Swift 端读 fixture，TS 端不回头读，故它证明的是 Swift 与 TS 一致，不是双向独立复算）；Python 参考实现 `tools/pathfind_reference.py` 独立复算 500 组；ArkTS 源码经转译直接跑（`tools/verify_product.mjs` → `PASS 6/6 suites; route cases 2,000`）。
- **诚实声明**：「`npm run check:all` 全绿」只支持到「退出码为 0 且十步都执行了」这一层，**不等于质量已被机器验证**——见 §5 第 4 条。

## 5. 已知限制（四条，逐条给出口）

1. **无设备面证据。** 全部验证在本机离线完成：`verify_flows.py` / `smoke_emulator.py` 需要 `hdc` 真机或模拟器，本机无 DevEco SDK 环境，因此**从未与 ArkTS 运行时逐个比对**寻路/渲染结果；共享核心的回归是"与 Python 参考实现及参考样例口径一致"。工程声明 `6.1.0(23)`，但 API 23 设备实测尚未进行（见 `docs/reports/ProductExperience-20261001.md:107`）。HarmonyOS / iOS 模拟器 / 微信开发者工具三面均因缺运行时未做（解锁代价与步骤另立清单）。
2. **Apple 端界面已做 macOS 实机走查，但结论由验收侧出具且尚未签署。** SwiftUI 六页 + Canvas 地图可编译运行、呈现层 29 项回归；本轮补采 macOS 实机像素 + 无障碍（AX）逐字双语走查（中文三页 + 英文三页），并确认界面文案与上游 `Loc.ets` 真源四层逐字一致（屏幕 = `packages/core/src/generated/i18n-data.ts` = `apps/apple/.../airport-data.json` = `harmony_app/.../model/Loc.ets`）。同期新立界面级缺陷（同视图状态变更不刷新渲染、地图视口进入时未 fit、指引推进与完成态界面级不可验证等）；小程序 WXML/WXSS 仍未真实渲染过（本机无微信开发者工具）。
3. **三处对比度豁免中有一处从未被测量。** 令牌门禁的 WCAG AA 检查打印 3 条已豁免偏差（`--sub` 页面底色 4.42:1、强调色浅强调底 4.00:1、走廊底图 1.85/1.82:1）；但实测发现 `allowed` 表第 0 个键 `次要文字/页面底色` **不在** 比对名表中（表里只有 `次要文字/卡片`），脚本亦无该单独分支 → **4.42:1 这一对从未进入测量**，它"通过"的原因是没被测，而不是豁免生效。缺陷编号 `AG-R1-D-005`。
4. **门禁自证机制有三项 P0 层缺口**（缺陷 `AG-R1-D-001`、`D-002`+`D-017`、`D-016`）：
   - 第 1 步「漂移检测」先重跑生成器再 `git diff --quiet` → **手改生成物会被覆盖丢弃且门禁全绿**（负样本已实锤），所以红线「数据变更必须走完整链路」目前**没有机器裁决**；
   - `packages/core/src/generated/**`、`tokens.css/wxss`、`weapp/utils/core.js` **零陈旧断言**，且 `build_weapp.mjs` 不在门禁内 → 某一端可能停留在旧逻辑而不报错；
   - 门禁各步用 `tail` / `grep | tail` 截断自己的输出，**十步中只有第 1/2/4 步的计数完整落盘**（第 8 步的 824/10/664 一个都不在门禁日志里，第 10 步 Apple 只剩 `Executed 18 tests`）→ 想核计数得像本轮这样再逐步单独复跑。
   另有三处门禁步骤标题数字写错（`37/6/46` 应为 `38/7/47`，`AG-R1-D-007`；本轮复跑日志仍在原文输出这三处），文档正文是对的。

## 6. 上游组评审时请重点看的两处

本 fork 只修改了两个既有文件，其余全为新增：

1. `tools/verify_product.mjs`（+28 / −2）：删掉第 8-9 行硬编码的 `C:/Program Files/Huawei/DevEco Studio/...typescript.js`，改为 `DEVECO_SDK_HOME` 探测（Windows/macOS 两种布局）→ 仓库本地 `typescript` 依赖 → 找不到时给出明确指引。**这是上游手写脚本，请上游确认改法是否符合你们的 SDK 环境约定。**
2. `.gitignore`：忽略多端构建产物（`node_modules/`、`.pnpm-store/`、`dist/`、`apps/*/dist/`、`.build/`、`apps/apple/.swiftpm/` 等）与本地测试台 `.testbench/`。

注：`docs/TODO.md`、`docs/architecture.md`、`docs/development.md` 中曾存在与本 fork 代码不同步的旧断言（「门禁 9 步」「`npm test` 16 项」「令牌 6 项」「Apple 46 项」「`verify_product.mjs` 硬编码 Windows 路径不可运行」）。**本 fork 自有文档，已在本地批次修订对齐**（口径以 `tools/check_all.sh` 与 `npm run check:all` 的实际输出为准：10 步 / 核心 38 / 令牌 7 / Apple 47 / 小程序 14）。修订只改口径数字与过时断言，未改动任何算法、数据或验收结论。

## 7. 许可

MIT（见 `LICENSE`，未改写）。应用代码由 AI 辅助创建；虚构机场数据 `meta.source` = 「根据公开布局示意重构，非官方数据」。

## 8. 提交者与署名说明

- 本 fork 的移植提交由 AI 代理执行、由仓库持有者复核入库，`git log` 即为署名依据。
- **已知瑕疵**：移植阶段的 16 条提交作者签名为占位值 `DSH Agent <agent@local>`（该地址不可投递，托管平台通常显示为无头像的匿名作者），且提交日期集中。若在公开前需要改写为真实身份，属历史改写，需由仓库持有人在推送前自行决定并执行（本 fork 未做改写）。
- 本文件与 `.gitignore` 的 `.testbench/` 一行由提交 `fb1142b` 引入，提交者身份 = 仓库配置的 git 身份（非占位地址）。**注意：该身份的作者元数据含一个私人邮箱；若要以公开仓口径推送，可先把它换成托管平台提供的 noreply 地址或以 squash 方式并入。**
- 隐私自查：**文件内容层面**（跟踪文件与历史各提交树内的文件内容）未出现本机用户目录、用户名、私人邮箱、手机号或凭据模式；40 张跟踪图片无 EXIF/XMP 元数据块；`pnpm-lock.yaml` 无仓库源 URL（仅 integrity 哈希）。提交**元数据**层面的署名问题见上一条与本节第 2、3 点。
