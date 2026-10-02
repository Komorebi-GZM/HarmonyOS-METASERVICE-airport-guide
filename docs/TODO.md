# 任务、优先级与进度（TODO.md）

> 图片编号 03 · 当前任务、优先级和开发进度

这份文件是**唯一的需求池与进度表**：所有待办都在第 3 节登记，做完的任务更新状态而不是删除；第 5 节记录需要人拍板的决策。新任务入池时必须写清「证据起点 / 产出物 / 验收口径」，否则不予受理。

**约定**

| 标记 | 含义 | 标记 | 含义 |
|---|---|---|---|
| ☐ | 未开始 | ◐ | 进行中 |
| ☑ | 已完成（须附验收证据） | ✖ | 已取消（须写原因） |

| 优先级 | 判定标准 |
|---|---|
| **P0** | 不做就没法继续/会误导后续开发（阻塞项、事实性错误、决策前置） |
| **P1** | 本轮提升主线必须做，直接对应用户选定的方向 |
| **P2** | 主线做完后的加固与体验优化 |
| **P3** | 可选、锦上添花 |

---

## 1. 基线快照

**基线：** `main@8350ff4`（2026-10-01，共 7 次提交）· 本工作区 = 本地 fork，仅 `upstream` 远程，不推送。

| 维度 | 现状 | 证据 |
|---|---|---|
| 产品 | 六页流程：首页 / 目的地 / 起点 / 路线 / 地铁引导 / 楼层浏览；中英双语；纯端侧 | `docs/reports/ProductExperience-20261001.md:13` |
| 数据 | 119 节点 / 145 边 / 6 层（4F 出发层、3F 空侧候机夹层、2F 到达层、1F 地面迎客层、B1 交通中心、B2 地铁站台）；唯一安检 `xha_p4_sec` | `data/XHA_xinghai_t1.map.json`、`tools/pathfind_reference.py` 实测输出 |
| 节点构成 | corridor 28 · gate 24 · lift 19 · hall 9 · escalator 7 · stair 7 · toilet 5 · checkin 4 · coach 4 · entrance 3 · exit 3 · baggage 2 · metro 2 · security 1 · parking 1 | 直接统计 `data/XHA_xinghai_t1.map.json` |
| 边构成 | walk 124 · elevator 13 · escalator 4 · stair 4 | 同上 |
| 代码 | 22 个 `.ets`（约 4 018 行），其中生成模型 `AirportMap.ets` 2 139 行 | `wc -l` |
| 工程配置 | 元服务 `atomicService`、`installationFree: true`、compatible/target = `6.1.0(23)`、`signingConfigs: []` | `harmony_app/AppScope/app.json5`、`harmony_app/build-profile.json5` |
| 离线校验 ① | `python3 tools/pathfind_reference.py` **本机实测通过**：119 节点（land 63 / air 55 / gate 1），500 组随机起终点 5 项断言全通过 | 2026-10-02 实测输出 |
| 离线校验 ② | `node tools/verify_product.mjs` **本机实测通过**：`PASS 6/6 suites; route cases 2,000; nodes 119; edges 145`——它转译并运行的是 **ArkTS 源码本身** | 2026-10-02 实测（修好 T-001 后） |
| 一键门禁 | `npm run check:all` = `tools/check_all.sh`：9 步，从漂移检测到三端回归 | 2026-10-02 实测全绿 |
| 工具链可用性 | `python3 tools/gen_checker.py` **本机实测失败**（`AssertionError: checker.html 缺失注入占位符`，exit 1）；提交版本与 HEAD 版本里占位符均已不存在，取而代之的是已注入的 `window.AIRPORTS = …;` | `tools/gen_checker.py:23`、`tools/checker.html:164`、2026-10-02 实测 |
| 生成链可复现性 | **本机实测：完全可复现**。`gen_maps.py` + `gen_model.py` 重跑后 `data/XHA_xinghai_t1.map.json` 与 `model/AirportMap.ets` 的 SHA-256 均与提交版本一致（`a61d3d22…` / `191ecc47…`），无漂移 | 2026-10-02 实测：各层节点 4F 55 / 3F 12 / 2F 21 / 1F 11 / B1 14 / B2 6 |
| 素材脚本 | `capture_product_screens.py` 与 `gen_brand_assets.py` 需要 **Pillow**（≥9.1，用了 `Image.Resampling.LANCZOS`），仓库无 `requirements.txt`；本机 `import PIL` 失败 | `tools/gen_brand_assets.py:3`、`tools/capture_product_screens.py:9`、2026-10-02 实测 |
| 图标资源 | 3 个 PNG（`app_icon.png`/`icon.png`/`startIcon.png`）当前提交版本均为 **512×512**（brand_assets 产物），但 `gen_icons.py` 会写 216/108/216——两条生成路径互相覆盖，未约定谁是权威 | 实测尺寸；`tools/gen_icons.py:73`、`tools/gen_brand_assets.py:6` |
| 设备级校验 | `verify_flows.py` / `smoke_emulator.py` 需 `hdc` 设备；历史结果为 API 24/26 通过 | `docs/reports/ProductExperience-20261001.md:67-83` |
| 共享核心 | **已抽取并通过回归**：`packages/core`（3 000 余行 TS，含生成数据）；`npm test` 16 项全绿，含 14 042 组全量节点对与 6 条参考样例米数复现 | 2026-10-02 实测 |
| 设计令牌 | **三端同源**：颜色 37 + 字号 13 + 间距 10 + 圆角 6 项，由 `export_shared.py` 生成到 `tokens.css`、`tokens.wxss` 与 `airport-data.json(metrics)`；`tools/check_tokens.mjs` **6 项**检查（含"字号/圆角不得写死""间距不得使用阶梯字面量"） | 2026-10-02 实测 |
| 跨语言渲染基准 | **已建立**：`tools/gen_render_fixture.mjs` 产出 10 个场景 / 664 条命令；Swift 端逐条比对通过（同一份文件也被 TS 端作为契约） | 2026-10-02 实测 |
| Web PWA | **已可离线安装**：`manifest.webmanifest` + 2 个品牌 SVG 图标 + `dist/sw.js`（预缓存 6 个文件 / 79 KB，缓存名含内容指纹）；`tools/build_web_pwa.mjs` 3 项自检 | 2026-10-02 实测 |
| 小程序静态契约 | **5 项检查**：数据绑定可由 `present.*` 产出、事件处理函数都在 `Page` 里、每个 `wx:for` 带 `wx:key`、class 都在 `app.wxss` 里、页面登记一致；实测抓出 `.stepFloor` 缺样式（Web 端同类问题 `.step-floor`/`.picker-body` 一并修复） | 2026-10-02 实测 |
| 小程序端 | **已交付**：`apps/weapp`（六页 WXML + Canvas 2D），核心经 esbuild 打成 95 KB CommonJS 单文件；`npm run test:weapp` 9 项全绿（含用 `wx` 桩跑通六页真实 Page 生命周期与 470 次绘制调用）；主包 136 KB | 2026-10-02 实测 |
| Apple 端 | **核心 + 界面均已实现**：`apps/apple`（SwiftPM，macOS 14+/iOS 17+）；`npm run test:apple` **42 项**全绿（核心 15 + 呈现 27），824 条路线与 TS 在节点序列/米数/步骤上逐项相等；`AirportGuideApp`（SwiftUI 六页 + Canvas 地图）可编译运行；`airport-cli` 打印与参考实现同口径的样例（635/505/630/445/250/300 米） | 2026-10-02 实测 |
| Web 客户端 | **已可用**：`apps/web`（Vite 7 + TS + Canvas 2D），构建产物 62 KB JS / 7.6 KB CSS；`pnpm test:web` 14 项端到端断言全绿 | 2026-10-02 实测 |
| 本机工具链 | Python 3.14.7 ✔、Node v25.9.0 ✔；**未安装 DevEco Studio / hdc / hvigorw** ✘ → 本机无法构建 HAP、无法跑设备脚本 | 2026-10-02 `which` 探测 |
| 平台证据 | 编译用 API 26、声明兼容 API 23、实测 API 24/26；**API 23 未实测** | `docs/reports/ProductExperience-20261001.md:35,107` |
| 交付物 | 案例包 `cases/`（case.json、practice.html、封面/卡片/分享图、arch-diagram.svg）、产品截图 `docs/images/product-20261001/**`、体验报告 `docs/reports/**` | 目录实况 |

---

## 2. 本轮提升主线

用户已确认的四条主线（W = workstream），另设 W0 作为支撑性工程基础：

| 主线 | 目标一句话 | 关联文档 |
|---|---|---|
| **W0 工程质量** | 让"改完能自证"变成一条命令，杜绝生成物漂移 | development.md |
| **W1 功能增强** | 多航站楼 / 更多 POI / 无障碍路径 | project-overview.md、component-api.md |
| **W2 设计系统** | Theme / 色彩 / 组件规约统一，令牌单一来源 | DESIGN.md |
| **W3 性能与包体** | 首屏、地图渲染、资源体积可测量、可优化 | architecture.md |
| **W4 平台兼容** | 明确支持矩阵并逐档验证（API 23/24/26、手机/折叠/宽屏/大字体） | development.md、DESIGN.md |
| **W6 多端移植** | 一份内核多端壳：Web/PWA（已可用）→ 微信小程序 → macOS/iOS | architecture.md、AGENTS.md |

---

## 3. 任务清单

### W0 工程质量（支撑）

| ID | 任务 | 优先级 | 依赖 | 证据起点 | 产出物 | 验收口径 | 状态 |
|---|---|---|---|---|---|---|---|
| T-001 | 解除 `verify_product.mjs` 的 SDK 路径硬编码：按 `DEVECO_SDK_HOME` → 仓库本地 `typescript` → 明确报错 三级解析 | **P0** | — | `tools/verify_product.mjs:9` | 修改后的脚本 + 根级 `typescript` devDependency | macОS 上 `node tools/verify_product.mjs` 输出 `PASS 6/6 suites; route cases 2,000; nodes 119; edges 145`；无 SDK 时给出可读指引 | ☑ 2026-10-02 |
| T-002 | 统一离线回归入口 `tools/check_all.sh`：漂移检测 → 导出 → Python 参考实现 → **ArkTS 源码回归** → 核心 → 令牌 → 基准 → Web → Apple → 小程序，共 9 步 | P1 | T-001 | `tools/check_all.sh`、`npm run check:all` | 一键脚本 | 干净工作区一次全绿；任一步失败即非零退出 | ☑ 2026-10-02 |
| T-003 | 生成物漂移检测：重跑生成链后 `git diff --quiet -- data/*.json harmony_app/.../AirportMap.ets` | P1 | T-002 | `tools/check_all.sh` 第 1 步 | 脚本内的一步（含 diff 输出） | 手改生成物或漏跑生成器时立即红，并打印差异 | ☑ 2026-10-02 |
| T-004 | 上游文档事实性纠错清单（本工作区不改上游文件，只在本文件登记，等决定是否提 PR）——已登记 8 类：① 案例仓地址 `HarmonyOS-AtomSer-…` 在 `README.md`、`cases/case.json`、`cases/practice.html` 共 12 处；② `data/README.md` 的"改 JSON 再跑 `gen_maps.py`"与覆盖语义相反；③ `data/README.md:23` `meta.floors` 示例缺 2F/1F；④ `data/README.md:45` 列了数据中不存在的 `apm_station`；⑤ `docs/BUILD.md` §6.2 生成顺序写反（应为 `gen_maps.py` → `gen_model.py`）；⑥ `docs/BUILD.md` §7 行数与工具清单过时（漏 `verify_flows.py` 等 6 个文件）；⑦ `docs/开发文档.md` 的 `compileSdkVersion` 与 `Viewport` 钳制参数与代码不符；⑧ `docs/BUILD.md` §2.1 未提 Pillow 依赖 | P2 | D-05 | 逐条见 `project-overview.md` §10 冲突汇总、`development.md` §3.4 | 纠错条目表 | 每条均有原文位置与正确说法 | ☐ |
| T-005 | **修复 `gen_checker.py`**：占位符 `/*__AIRPORTS_JSON__*/` 已被上一次注入消耗（提交版本与 HEAD 版本都没有），脚本硬断言导致必然失败。改为替换已有的 `window.AIRPORTS = …;` 或把占位符加回 `checker.html` | **P0** | — | `tools/gen_checker.py:23`、`tools/checker.html:164`、2026-10-02 实测 exit 1 | 修好的脚本 + `checker.html` 可重复注入 | `python3 tools/gen_checker.py` 连续跑两次都 exit 0，且 `checker.html` 打开后含最新节点数据 | ☐ |
| T-006 | Pillow 依赖声明：新增 `tools/requirements.txt`（`Pillow>=9.1`）并在 `development.md` 标注 | P2 | — | `tools/gen_brand_assets.py:3`、`tools/capture_product_screens.py:9` | requirements 文件 | 新环境按文档一次装好，两个脚本可跑 | ☐ |
| T-007 | 图标生成权威约定：`gen_icons.py`（216/108/216）与 `gen_brand_assets.py`（512×512）覆盖同一组 3 个文件，当前提交是 512×512 | P2 | 决策 D-07 | `tools/gen_icons.py:73`、`tools/gen_brand_assets.py:6`、图标实测尺寸 | 单一权威生成路径 | 跑任一脚本后产物一致；不再互相覆盖 | ☐ |
| T-008 | 交付目录防误写：`capture_product_screens.py` 的 `OUT` 直接指向只读交付目录 `docs/images/product-20261001/phone`，且无命令行参数、硬编码 `127.0.0.1:5555` 与 1320×2848 | P1 | — | `tools/capture_product_screens.py:15-16,36-37`、`AGENTS.md` 红线 6 | 加 `--out`（默认写 `.temp/`）与设备/分辨率校验 | 误跑时不会污染 `docs/images/**` | ☐ |
| T-009 | 设备回归与源码语法解耦：`verify_flows.py:93-104` 用正则解析 `AirportMap.ets`（`FLOOR_BBOX.set`/`NODE_EN.set`）与 `FloorCanvas.ets`（`fitInsets`）文本，改生成器输出语法会静默打断回归 | P2 | — | `tools/verify_flows.py:93-104` | 改为读取 `data/*.map.json` 或导出结构 | 生成器改格式后设备回归仍可用 | ☐ |
| T-010 | `cases/` 7 个交付物无生成脚本（grep 无引用），不可再生 | P3 | — | `cases/` 目录实况 | 生成脚本或标注"手工产物" | 明确哪些可再生产、哪些只能手改 | ☐ |

### W1 功能增强

| ID | 任务 | 优先级 | 依赖 | 证据起点 | 产出物 | 验收口径 | 状态 |
|---|---|---|---|---|---|---|---|
| T-101 | **多航站楼**：把"单图"假设从工具链中拆掉——`gen_maps.py` 目前只写一张图（`tools/gen_maps.py:409`），`gen_model.py` 的 `SRC`/`OUT` 是单文件常量（`tools/gen_model.py:21-22`），而 `preview_nodes.py` 已支持多图（`tools/preview_nodes.py:74 find_maps()`）。需统一为多图 + 端侧选择/合并策略 | P1 | 决策 D-02 | 上述三处 | 支持 N 张图的生成链 + 端侧多楼模型与切换入口 | 新增第二座航站楼后：`gen_maps.py` 产出两 JSON、`gen_model.py` 产出可区分两楼的模型、`preview_nodes.py` 产出两套 SVG、App 能选楼并寻路 | ☐ |
| T-102 | **POI 扩容**：补充无障碍卫生间、母婴室、饮水、充电、商业、休息区等；新增 `nodeType` 需同步四处：数据 spec（`tools/gen_maps.py`）、中英名映射（`tools/gen_model.py` 的 `NAME_EN`）、分类（`model/Categories.ets`）、配色（`ui/Theme.ets` 的 `TYPE_COLOR`） | P2 | T-103（无障碍字段先定） | 现状 types 计数见 §1 | 新节点 + 四层同步修改 | 新类型在搜索、分类、地图、双语中都不缺项；`gen_model.py` 断言仍通过 | ☐ |
| T-103 | **无障碍路径**：现状数据**没有任何无障碍字段**（节点 keys 仅 `floor/id/name/type/x/y`，边 keys 仅 `from/to/type/weight`），`PREF_AVOID_STAIR`（`core/Pathfinder.ets:23`）只是"避开楼梯"的软偏好，不等于"全程无台阶"。需扩展 schema（电梯/扶梯可达性、无障碍设施标记）+ 寻路支持硬约束与不可达提示 | P1 | 决策 D-03 | 数据 keys 实测；`core/Pathfinder.ets:7-24` | schema 扩展 + 寻路基约束模式 + 数据标注 | 选"无障碍优先"时：路线全程无 `stair` 边；确实不可达时给出明确文案而非静默绕路 | ☐ |
| T-104 | 地点详情信息（位置描述、所在区域、步行参考） | P3 | T-102 | — | 节点扩展字段 + 详情 UI | 详情页信息与数据一致 | ☐ |
| T-020 | **`apm`（捷运）预留类型实际不可用**：`tools/gen_maps.py:18` 与 `data/README.md:43` 保留 `apm` = 350m，但 `core/Pathfinder.ets:13-24` 的权重/乘子表没有 `apm`（兜底成 base=25 → 350m 捷运被当成 25m 楼梯），`tools/pathfind_reference.py:35` 的 `VW` 同样缺项且 `w()` 直接取键 → 一旦数据里出现 apm 边，参考实现会 `KeyError` | P1 | T-101 | `tools/gen_maps.py:18`、`core/Pathfinder.ets:13-24`、`tools/pathfind_reference.py:35` | 两处权重表补齐 + 生成期断言 | 造一条 apm 边：App 与参考实现结果一致，不再静默降级 | ☐ |
| T-021 | 平行边风险：`core/Pathfinder.ets:31-33,75-86` 的 `_etype` 以"规范化节点对"为键，而 `tools/gen_maps.py:62` 的去重键**包含类型** → 同一对节点若存在不同类型边，类型表会取错。当前数据 0 组（已核对），属潜在缺陷 | P2 | — | 上述两处 | 生成期断言或键改为 (节点对, 类型) | 数据出现平行边时立即失败，而非静默取错类型 | ☐ |

### W2 设计系统

| ID | 任务 | 优先级 | 依赖 | 证据起点 | 产出物 | 验收口径 | 状态 |
|---|---|---|---|---|---|---|---|
| T-201 | **设计令牌单一来源**：颜色与圆角以 `Theme.ets` / `float.json` 为真源，经 `export_shared.py` 生成到三端 | P1 | — | `tools/export_shared.py`、`tools/check_tokens.mjs` | `tokens.css` / `tokens.wxss` / `airport-data.json(tokens)` | `npm run test:tokens` 全绿：37 色 + 2 圆角令牌三端同源；Web/小程序样式里无与令牌同值的硬编码 | ☑ 2026-10-02 |
| T-202 | 字号 / 圆角 / 间距阶梯：生成 `--font-* / --space-* / --radius-*` 并强制引用 | P1 | T-201 | `tools/export_shared.py`、`apps/web/src/styles.css`、`apps/weapp/miniprogram/app.wxss`、`apps/apple/Sources/AirportUI/Metrics.swift` | 13 档字号 + 10 档间距 + 6 档圆角令牌 | `npm run test:tokens` 拒绝任何字号/圆角字面量；Apple 端 `Metrics` 读同一份阶梯（含覆盖测试） | ◐ 字号与圆角已全量令牌化；间距仍有混合值声明待收敛 |
| T-216 | 间距收敛：把"混合值"声明（如 `padding: 2px 0 6px`）里的阶梯外数值收敛到阶梯（`2px`/`3px`/`18px`/`28px` 等） | P2 | T-202 | `check_tokens.mjs` 的信息性统计 | 收敛后的样式 | 阶梯外间距字面量归零；观感需目视确认（与 T-612/T-614 一起做） | ☐ |
| T-202 | 字号 / 间距 / 圆角阶梯收敛：把散落在各页面的数值收进常量或资源 | P1 | T-201 | `pages/*.ets`、`ui/*.ets` 中的 `fontSize`/`padding`/`borderRadius` | 阶梯表 + 常量定义 | 每处视觉数值可追溯到令牌 | ☐ |
| T-203 | `TYPE_COLOR` 语义可区分性复核：`baggage` 与 `metro` 同为 `#007F7A`，`toilet`/`hall`/`coach`/`parking` 同为 `#486A85`，需确认是否有意为之 | P2 | T-201 | `ui/Theme.ets` | 调整后的配色表 | 同类语义同色、异类可区分；对比度达标 | ☐ |
| T-204 | 可读性与触控基线：正文对比度 ≥ 4.5:1、主操作触控高度 ≥ 48vp（历史报告称主按钮已是 48vp，需复核全量） | P2 | T-201 | `docs/reports/ProductExperience-20261001.md:15` | 检查清单 + 修正 | 六页在大字体下无截断、按钮可达 | ☐ |
| T-205 | **11 个零引用令牌 + 8 处圆角留空**：`ui/Theme.ets` 的 `ROUTE`(3)、`HIT`(1)、`MAP` 的 grid/ink/muted/corridor/landWash/airWash(6) 与 `APP.card2`(1) 全部零引用；`resources/base/element/float.json` 的 `card_radius`/`pill_radius` 亦零引用（2026-10-02 实测计数均为 0）。另有 8 处控件未设 `borderRadius`，落回 ArkUI Button 默认胶囊形，与相邻 `borderRadius(12)` 并列可见：`pages/Route.ets:137,148,151,165,169`、`pages/FloorBrowse.ets:53`、`ui/Common.ets:35`、`ui/PlacePicker.ets:105` | P1 | T-201 | `ui/Theme.ets:2,4,10,11`、`resources/base/element/float.json:4,8`、实测 grep | 令牌全部接线或删除 + 圆角统一 | 改一个令牌能真正改变画面；同排控件形状一致 | ☐ |
| T-206 | **路径色漂移**：`ui/Theme.ets:10` 的 `ROUTE.trans = #B7DBD7`，而 `ui/FloorCanvas.ets:70` 实画 `#9ACCC6`；`#E9F0F1`/`#DCE6E8`/`#FFFFFF` 硬编码在 `ui/FloorCanvas.ets:61,68` | P1 | T-201 | 上述位置 | Canvas 用色统一到令牌 | 全项目仅令牌一处定义路线色 | ☐ |
| T-207 | 主色多副本：`APP.bg #F4F7F9` 同时存在于 `ui/Theme.ets`、`resources/base/element/color.json`、`entryability/EntryAbility.ets:19,21,23`、`tools/gen_brand_assets.py:12`；`APP.text #172B3A` 硬编码在 `EntryAbility.ets:22,24` | P2 | T-201 | 上述位置 | 单一真源 + 引用 | 改主色只需改一处，冷启动/系统栏不闪色 | ☐ |
| T-208 | 类型色语义冲突：15 个节点类型只有 6 个色值；`#007F7A` 同时是 `APP.accent`（交互强调）与 entrance/exit/metro/baggage 四类节点色；`#486A85` 一色承担 5 类；`entrance` 与 `exit` 同色同图标（`ui/Common.ets:6-12` 都落 `pin`） | P2 | T-203 | `ui/Theme.ets:6-8`、`ui/Common.ets:6-12` | 复核后的配色与图标表 | 出发门/到达出口可区分；选中反馈不被类型色淹没 | ☐ |
| T-209 | 大字体与断点缺口：工程允许 `fontSizeMaxScale: 2`（`harmony_app/AppScope/resources/base/profile/configuration.json`），实测只验证到 ≈1.3 倍；限宽两档并存（840：`pages/Index.ets:128`、`pages/MetroGuide.ets:47`、`ui/PlacePicker.ets:120`；1000：`pages/Route.ets:246`、`pages/FloorBrowse.ets:90`）；响应式 API（`mediaquery`/`GridRow`/`breakpoint`/`display`）命中 0 | P1 | T-404 | 上述位置 + `docs/reports/ProductExperience-20261001.md:15` | 统一断点 + 2.0 倍字号验证 | 2.0 倍字号与三形态下无裁剪、无溢出 | ☐ |
| T-210 | `tools/preview_nodes.py:15-49` 存在第 4 套节点配色（与 `ui/Theme.ets` 的 `TYPE_COLOR` 完全不同），预览图与 App 观感不一致 | P3 | T-203 | `tools/preview_nodes.py:15-49` | 纳管或显式声明其为独立可视化配色 | 预览与 App 配色关系有明确说法 | ☐ |

### W3 性能与包体

| ID | 任务 | 优先级 | 依赖 | 证据起点 | 产出物 | 验收口径 | 状态 |
|---|---|---|---|---|---|---|---|
| T-301 | 包体基线固化：当前未签名 debug HAP 为 751 682 字节 | P2 | 可构建环境 | `docs/reports/ProductExperience-20261001.md:53` | 每次发版的包体记录 | 包体变化可对比、有阈值告警 | ☐ |
| T-302 | 地图渲染性能：`ui/FloorCanvas.ets` 程序化绘制（无位图底图），测量首帧、平移/缩放帧率、路径动效（`setInterval 16ms × 0.02` ≈ 800ms，见 `docs/开发文档.md` §11） | P2 | 可构建环境 | `ui/FloorCanvas.ets`、`core/Viewport.ets` | 测量方法 + 数据 + 优化项 | 交互无明显掉帧；动效可被中断不卡死 | ☐ |
| T-303 | 首屏与启动成本：`model/AirportMap.ets` 是 2 139 行模块级数组，`core/Places.ets:4-5` 在模块加载期建索引，`core/Pathfinder.ets:27-29` 为惰性缓存——评估是否需要懒加载/按层加载 | P2 | T-302 | 上述三处 | 启动耗时数据 + 结论 | 首屏可交互时间有基线且不退化 | ☐ |
| T-304 | 资源体积：`resources/rawfile/icons/*.svg`（19 个）与 AppScope 图标位图 | P3 | T-301 | 资源目录实况 | 体积清单 + 优化 | 图标资源体积占比有记录 | ☐ |

### W4 平台兼容更新

| ID | 任务 | 优先级 | 依赖 | 证据起点 | 产出物 | 验收口径 | 状态 |
|---|---|---|---|---|---|---|---|
| T-401 | **确定支持矩阵与兼容基线**：工程声明兼容 `6.1.0(23)`，实测集中在 API 24/26，**API 23 从未实测** | **P0** | 决策 D-04 | `harmony_app/build-profile.json5`、`docs/reports/ProductExperience-20261001.md:107` | 支持矩阵表（API 档 × 形态） | 每一档都有"已验证 / 未验证 / 不支持"的明确标注 | ☐ |
| T-402 | 平台升级适配：若提升 target API，需逐项核对 ArkTS/ArkUI 行为变更、`strictMode.useNormalizedOHMUrl`、混淆配置（`harmony_app/entry/build-profile.json5`） | P1 | T-401 | 同上 | 升级记录 + 兼容性修复 | 新 target 下六页流程回归通过 | ☐ |
| T-403 | 签名与发布配置：`signingConfigs: []` 目前为空，未签名 HAP 仅用于模拟器 | P2 | — | `harmony_app/build-profile.json5` | 签名配置模板 + 说明 | 能产出可安装的签名包（凭据不入库） | ☐ |
| T-404 | 形态验证矩阵固化：手机 / 折叠（1080×2444 折叠态 ↔ 2210×2416 展开态）/ 宽屏（2210×2416）/ 大字体（≈1.3×）；结合 `verify_flows.py` 的 `--map-only`、`--state-only`、`--metro-only` 分组 | P1 | T-401 | `tools/verify_flows.py:485-491`、`docs/reports/**` | 可复现清单 + 脚本调用模板 | 每种形态一条命令、结果可归档 | ☐ |
| T-405 | `deviceTypes` 目前只有 `default`，折叠/平板形态是否需要在 `module.json5` 显式声明 | P2 | T-401 | `harmony_app/entry/src/main/module.json5` | 决策 + 配置调整 | 目标形态上安装与布局正常 | ☐ |
| T-406 | 设备级脚本前置条件文档化：`verify_flows.py` / `smoke_emulator.py` 需要 `hdc` 设备且**不会自动安装 HAP 或启动模拟器** | P1 | — | `docs/reports/ProductExperience-20261001.md:55` | `development.md` 前置条件表 | 按文档能从零跑通一次 | ☐ |

---

### W5 一致性修复（需求 ↔ 实现 ↔ 文档）

这一组任务不是新增功能，而是消除"文档写了、代码没有"或"代码做了、文档没写"的偏差。**每一项都必须先确认哪一边是对的**，再改另一边。

| ID | 任务 | 优先级 | 依赖 | 证据起点 | 产出物 | 验收口径 | 状态 |
|---|---|---|---|---|---|---|---|
| T-011 | **双语机制二选一**：`docs/需求文档.md:108` 要求文案走 `$r('app.string.*')`，但代码中 `$r(` 出现 **0 处**，实际用 `model/Loc.ets` 的运行时表；`resources` 下 `base` 与 `en_US` 的 `element/string.json` 各 66 键**无任何代码引用** | P1 | D-06 | `model/Loc.ets`、`resources/**/string.json`、2026-10-02 实测 | 明确选定方案并清理另一套 | 两语言全流程通过；无"死字符串资源" | ☐ |
| T-012 | 清理死文案：`model/Loc.ets` 中 `selected_start`、`results`、`route_title`、`to_floor`、`browse_other` 无任何引用 | P3 | T-011 | `model/Loc.ets`（可 grep 复核） | 删除或接线 | 键表无未使用项 | ☐ |
| T-013 | **路径生长动效未实现**：`docs/需求文档.md:112`、`docs/开发文档.md` 描述了 16ms×0.02≈800ms 的路径生长动效，但代码中 `setInterval` 与 `animateTo` 命中数均为 **0**，`ui/FloorCanvas.ets` 只有静态绘制 | P2 | — | 2026-10-02 实测 grep；`ui/FloorCanvas.ets` | 实现动效或下修文档口径 | 二者一致（要么有线路上场动画，要么文档删掉该承诺） | ☐ |
| T-014 | 需求项落地：① `docs/需求文档.md:78` 要求"默认起点=最近一次选过的起点"，实际 `core/PlannerState.ets:15-17` 新行程起点为空；② 要求每层信息条含"该层路径长度 + 累计距离"，实际 `pages/Route.ets` 只显示当前段米数与总步行米数 | P3 | — | 上述三处 | 实现或标注为"本版不做" | 需求文档第 2 节逐条有"已实现/已降级"标注 | ☐ |
| T-015 | **语言偏好竞态**：`core/LocalStore.ets:26` 在 `prefs` 尚未就绪时 `save` 直接 return（空操作），而 `pages/Index.ets:28-32` 的异步 `load().then` 会把 `lang` 覆盖回磁盘值——冷启动瞬间切语言可能既不落盘又被回滚 | P1 | — | `core/LocalStore.ets:26`、`pages/Index.ets:28-32` | 修复后的加载/保存时序 | 冷启动立刻切语言：既落盘、又不被异步加载回滚 | ☐ |
| T-016 | **寻路的隐性耦合与越界**：`core/Pathfinder.ets:94-97` 对非 walk 边一律用 `VERTICAL_WEIGHT`（30/40/25）覆盖数据里的 `weight`（当前数值恰好相同，属"隐性一致"——改数据不生效）；`:95` 的 `PREF_MULT[pref]` 无越界回落，非法档位会抛 `TypeError`，而 `core/PlannerState.ets:30` 的 `changePreference` 不校验范围 | P2 | — | `core/Pathfinder.ets:94-97`、`core/PlannerState.ets:30` | 明确权重真源 + 档位校验 | 改数据的垂直权重能生效；非法偏好被拒绝或安全回落 | ☐ |
| T-017 | **米数口径不一致**：`core/RouteSteps.ets:23,35` 的 `RouteStep.meters` 只累计 walk 边、换层步骤硬编码 0，`RouteView.walkingMeters` 永远不含换层；同时 `Route.totalMeters` 算出来了却从未被界面读取（`pages/Route.ets:196` 只显示 `walkingMeters`） | P2 | — | 上述三处 | 明确"界面显示哪个口径" | 预览页总米数与逐步米数自洽、可解释 | ☐ |
| T-018 | 死代码与重复表清理：`Categories.catSymbol`/`matches`/`HOT_DESTINATIONS`、`Localization.floorName`/`floorShort`/`floorOrder`、`Viewport.reset`/`fit`、`Theme.ROUTE`/`HIT`、`AirportMap.XHA_META`/`PX_PER_METER`、`Pathfinder.PREF_*` 均无调用方；`pages/Index.ets:16` 的 `POPULAR`（4 项）与 `Categories.ets:100-107` 的 `HOT_DESTINATIONS`（14 项）语义重复且内容不同 | P3 | — | 上述位置 | 清理或接线 | 无未使用导出；"热门目的地"单一来源 | ☐ |
| T-019 | 零散卫生问题：`pages/SelectTarget.ets:6`、`pages/SelectStart.ets:6` 声明了未使用的 `@Consume pathStack`；`ui/Common.ets:37` 用 `AppStorage.get('lang')` 形成与 `@StorageLink('lang')` 并行的第二条读路径；`PlannerState.query` 只被清空、从不被写入，`revision` 只增不读；`resources/base/element/float.json` 的 `card_radius`/`pill_radius` 无引用（圆角内联在 `ui/Common.ets:52,82-83`） | P3 | T-201 | 上述位置 | 清理结果 | 无未使用声明/配置项 | ☐ |

### W6 多端移植（Web / 小程序 / Apple）

| ID | 任务 | 优先级 | 依赖 | 证据起点 | 产出物 | 验收口径 | 状态 |
|---|---|---|---|---|---|---|---|
| T-601 | **抽取平台无关共享核心**：把 ArkTS 的图/寻路/路线步骤/状态机/检索/双语/视口移植为 TypeScript，且不依赖任何平台 API | P1 | — | `packages/core/src/*.ts` | 11 个核心模块 | 16 项一致性回归全绿（含 14 042 组全量节点对、500 组×4 偏好、6 条参考样例复现） | ☑ 2026-10-02 |
| T-602 | **建立"ArkTS 真源 → 共享核心"导出链**：地图/文案/标签/令牌统一由一个脚本翻译，避免第二份事实 | P1 | T-601 | `tools/export_shared.py` | 导出脚本 + `src/generated/**` | 跑一次导出后 `npm test` 全绿；改 `Loc.ets`/`Theme.ets` 能反映到 Web | ☑ 2026-10-02 |
| T-603 | **Web/PWA 客户端**：六页流程 + Canvas 2D 地图渲染 + 手势 + 本地存储 + 中英切换 | P1 | T-601, T-602 | `apps/web/src/**` | `apps/web`（Vite 构建） | `pnpm web` 在浏览器可用；六页流程走通 | ◐ 流程已通，视觉仍为近似 |
| T-604 | Web 端到端回归：跑构建产物验证主链路与关键分支 | P1 | T-603 | `tools/web_smoke.mjs` | 14 项断言脚本 | `pnpm test:web` 全绿（首页→目的地→起点→预览→指引→完成→楼层地图→双语→本地存储） | ☑ 2026-10-02 |
| T-605 | **微信小程序端**：WXML/WXSS + Canvas 2D，复用 `packages/core`（含绘制命令流） | P1 | T-603, D-08 | `apps/weapp/**`、`tools/build_weapp.mjs` | 小程序工程 + 核心 CJS 打包 | `npm run test:weapp` 9 项全绿（配置/文案/六页真实 Page 生命周期/Canvas 链路/包体）；主包 136 KB | ☑ 2026-10-02 |
| T-613 | Web 端改用共享 `AppModel`/`Presenter`：消除第二份状态机与文案映射 | P2 | — | `apps/web/src/main.ts`、`apps/web/src/storage.ts` | 重构后的 Web 端（本文件现为纯视图层） | 本文件不再持有状态；15 项端到端全绿 | ☑ 2026-10-02 |
| T-617 | **小程序静态契约检查**：在无法渲染 WXML 的前提下，用静态分析核对数据绑定 / 事件处理 / `wx:key` / class 是否都有对应实现 | P1 | T-605 | `tools/weapp_static.mjs` | 5 项检查纳入 `npm run test:weapp` | 6 页 / 79 数据键 / 74 样式类全部对得上；实测抓出 `.stepFloor` 未定义样式 | ☑ 2026-10-02 |
| T-620 | **无障碍对比度**：令牌按 WCAG 2.1 AA 逐对核算（正文 4.5:1 / 图形 3:1） | P1 | T-201 | `tools/check_tokens.mjs` | 第 7 项检查（含豁免清单与理由） | 实测：正文 14.55:1、地图文字 13.65:1、全部 15 个类型色 ≥3.58:1 ✔；3 处已记录偏差（`--sub` 在页面底色 4.42、强调色在浅强调底 4.00、走廊底图 1.85） | ◐ 检查已建立；3 处偏差受上游主题色限制，待与走查一起定夺 |
| T-619 | **Web 端真正成为 PWA**：补 manifest / 图标 / service worker（此前只是"能在浏览器打开"，没有离线与可安装能力） | P2 | — | `apps/web/public/**`、`tools/build_web_pwa.mjs` | manifest + 2 个 SVG 图标 + 带内容指纹的 `sw.js` | 预缓存 6 个文件 / 79 KB；`web:build` 后自动校验（预缓存完整性、manifest 引用、体积上限） | ☑ 2026-10-02 |
| T-618 | Web 端同类静态契约：源码里 `class: '...'` 用到的类必须在样式表里有定义 | P2 | — | `tools/web_smoke.mjs` | 1 项检查 | 实测抓出 `.step-floor` / `.picker-body` 未定义并已补齐 | ☑ 2026-10-02 |
| T-614 | **小程序在微信开发者工具中目视验证**：本机未安装开发者工具，WXML/WXSS 从未真实渲染 | P1 | T-605 | `apps/weapp/miniprogram/**` | 走查记录 + 修正 | 六页在开发者工具里排版正常、与 Web 端观感一致 | ☐ |
| T-615 | 渲染器跨语言逐命令比对：TS（`render.ts`）与 Swift（`MapRenderer.swift`）两份实现用基准锁死 | P2 | T-609 | `tools/gen_render_fixture.mjs`、`RendererParityTests.swift` | 10 场景 / 664 条命令基准 | `swift test` 逐条相等（含标签底片宽度、缩放阈值、水印位置） | ☑ 2026-10-02 |
| T-606 | **Apple 端核心移植**：Swift 版图/寻路/步骤/状态机/检索/双语/视口，读同一份导出 JSON | P1 | D-09 | `apps/apple/Sources/AirportCore/**` | SwiftPM 包 `AirportCore` + CLI | `npm run test:apple` 15 项全绿，含 **824 条路线与 TS 逐节点一致**、14 042 组全量节点对与割点等价 | ☑ 2026-10-02 |
| T-609 | **Apple 端 UI**：SwiftUI 六页 + Canvas 地图；绘制逻辑抽成「命令流」以便测试 | P1 | T-606 | `apps/apple/Sources/{AirportUI,AirportGuideApp}/**` | 可运行的 App（macOS 14+/iOS 17+） | `swift build` 全部目标通过；呈现层 27 项回归全绿（文案/绘制命令/状态机/偏好） | ☑ 2026-10-02 |
| T-611 | **缺陷修复：「修改出发位置」误入目的地页**（Apple 端实现时由新测试发现，Web 端同源缺陷） | P1 | — | `apps/apple/Sources/AirportUI/AppModel.swift`、`apps/web/src/main.ts` | 两端修复 + 回归断言 | 修改起点进入出发位置页、选完回到路线页；仅改起点不改写目的地与最近列表 | ☑ 2026-10-02 |
| T-612 | **Apple 端视觉走查**：在 macOS 与 iOS 模拟器上逐屏核对六页排版（对齐 `docs/DESIGN.md`） | P1 | T-609 | `apps/apple/Sources/AirportGuideApp/**` | 走查记录 + 修正 | 六个页面在 macOS 与 iOS 模拟器上无裁切/错位；与 Web 端观感一致 | ☐ |
| T-610 | 跨语言基准机制：用 TS 核心生成固定路线集，各端逐项比对 | P1 | T-601 | `tools/gen_route_fixture.mjs` | 824 条基准 + 两端消费 | 任一端选路/步骤偏移即测试变红；`sourceMapSha256` 能检出数据漂移 | ☑ 2026-10-02 |
| T-607 | Web/小程序的视觉收敛：把 `docs/DESIGN.md` 的令牌与字号阶梯落到实现 | P2 | T-201, T-603 | `apps/web/src/styles.css` | 令牌化样式 | 无裸色值/裸字号；与 DESIGN.md 令牌表一一对应 | ☐ |
| T-608 | 统一离线回归入口：把 `pathfind_reference.py`、`npm test`、`pnpm test:web` 串成一条命令 | P2 | T-604 | 本文件 §3 W0 | 一键脚本 | 一条命令全绿；任一环失败即非零退出 | ☐ |

**目视验证的两条路径**（第 8 轮实测记录）：

1. **人工**：`bash tools/apple_test.sh run AirportGuideApp`（macOS 窗口）／微信开发者工具「导入项目」选 `apps/weapp`。
2. **自动截图（可让 AI 自己做）**：本机装有 Orca.app，其 CLI 在
   `/Applications/Orca.app/Contents/Resources/bin/orca`（`/usr/local/bin/orca` 软链不可读，无法自解析路径）。
   第 8 轮尝试 `orca computer permissions --json` 返回 `runtime_unavailable`：
   > Could not read Orca runtime metadata at ~/Library/Application Support/orca/orca-runtime.json. Start the Orca app first.

   即：**先启动 Orca 应用**，之后 `orca computer get-app-state --app <bundle-id> --restore-window --json`
   就能拿到窗口截图，AI 即可自行完成 T-612/T-614 的目视走查。未启动前不擅自拉起桌面应用。


决策待拍板见 §5 的 D-08（小程序技术选型）与 D-09（Apple 端实现形态）。

---

## 4. 里程碑

| 里程碑 | 内容 | 完成判据 | 状态 |
|---|---|---|---|
| **M0 文档就绪** | 8 份工作区文档（`AGENTS.md` + `docs/` 七份）落地并与代码对齐 | 八份文档可追溯、无编造；`AGENTS.md` 索引齐全 | ☑ 2026-10-02 |
| **M1 回归可跑** | T-001 → T-002 → T-003 → T-406 | 一条命令（`npm run check:all`）跑完 9 步离线回归并检出漂移 | ☑ 2026-10-02 |
| **M2 规则统一** | T-201、T-202、T-103 | 设计令牌单一来源；无障碍路径可硬约束 | ☐ |
| **M3 能力扩展** | T-101、T-102、T-401、T-404、T-402 | 多航站楼可用；平台矩阵逐档验证通过 | ☐ |
| **M4 收口** | T-301~T-304、T-403、T-405、T-204 | 有包体/性能基线，发布链路可用 | ☐ |
| **M5 多端可用** | T-601~T-614 | 四端均已交付（Web/Apple/小程序 + 共享核心） | ◐ 四端 ✔；三处视觉走查待做（T-612 Apple / T-614 小程序 / T-607 令牌收敛） |

---

## 5. 待拍板决策

| ID | 决策 | 选项 | 建议 | 影响 |
|---|---|---|---|---|
| D-01 | 离线回归依赖的 TypeScript 从哪来 | ①读 `DEVECO_SDK_HOME` ②`tools/` 下自带 `package.json` 依赖 typescript ③两者兼容 | ③：优先环境变量，缺失时回落到本地依赖 | 决定 T-001 的实现方式与是否引入 npm 依赖 |
| D-02 | 多航站楼形态 | ①独立图 + 楼间选择器（互不连通）②同图多入口（可跨楼连通，如 APM 捷运 350m 边） | ①先行：数据与 UI 改动可控；②留待有真实捷运需求时 | 决定 T-101 的数据模型与 UI |
| D-03 | 无障碍是硬约束还是偏好 | ①新增独立"无障碍优先"档并**禁止** `stair` 边 ②仅作为第 5 档偏好乘子 | ①：无障碍需求不能被"绕路"降级 | 决定 T-103 的算法改动与提示文案 |
| D-04 | 目标 API 档位 | ①保持 `6.1.0(23)` 但补 API 23 实测 ②提升 target 并重跑全矩阵 | ①：先保证声明与实测一致，再谈升级 | 决定 T-401/T-402 的顺序 |
| D-05 | 是否向上游提 PR | ①只本地开发 ②文档纠错单独提 PR | ①（当前用户已选本地开发）；纠错先在本文件登记 | 决定 T-004 的落地方式 |
| D-06 | 双语机制以哪套为准 | ①代码现状为准（`model/Loc.ets` 运行时表），把 `string.json` 冗余键删掉、需求文档口径改掉 ②改为 `$r('app.string.*')` 资源化，重写全部文案引用 | ①：改动量小、不触碰全部页面；②仅在需要系统级多语言/随系统切换时才有收益 | 决定 T-011/T-005 的实现；影响所有文案改动方式 |
| D-08 | 小程序端技术选型 | ①原生小程序（WXML/WXSS + Canvas 2D，直接引用共享核心产物） ②Taro（React 一套 UI 同时出 H5 与小程序） | ①：本项目是 Canvas 为主的重交互，Taro 的跨端 Canvas 差异反而添乱，包体也更大 | 决定 T-605 的工程形态 |
| D-09 | Apple 端实现形态 | ①SwiftUI 原生 + Swift 移植核心（同一套 JSON + 断言对齐） ②WKWebView 包壳复用 Web 版 | ①：地图手感与系统集成最好，代价是要维护第二份寻路实现（用共享 JSON 做一致性锚点）；②可先做，用于快速验证 | 决定 T-606 的形态与工作量 |
| D-07 | 图标产物以谁为权威 | ①`gen_brand_assets.py`（512×512，与当前提交一致）②`gen_icons.py`（216/108/216，纯标准库无需 Pillow）③两者合并为一个脚本 | ①：与已提交产物一致；把 `gen_icons.py` 标注为"仅无 Pillow 时的降级方案"或直接删除 | 决定 T-007；影响应用图标在设备上的清晰度 |

上游《需求文档》§9 的三项历史待确认已由实现拍板，记录备查：端侧数据载体=编译进 ArkTS 模块（`model/AirportMap.ets`）；首页默认停留=总览；寻路默认偏好=最短距离。

---

## 6. 进度记录

| 日期 | 变更 | 说明 |
|---|---|---|
| 2026-10-02 | 首次创建 | 建立基线快照、四条主线任务池、里程碑与决策清单；基于 `main@8350ff4` 与本机实测（`pathfind_reference.py` 通过、`verify_product.mjs` 与 `gen_checker.py` 因硬编码 Windows 路径 / 占位符被消耗而失败、生成链逐字节可复现） |
| 2026-10-02 | 一键离线门禁 | 修好 `verify_product.mjs`（三级解析 TypeScript，回到能验证 **ArkTS 源码**的状态，6/6 套件 / 2000 条路线）；新增 `tools/check_all.sh` 与 `npm run check:all`（9 步：漂移检测→导出→Python 参考→ArkTS 源码→核心→令牌→基准→Web→Apple→小程序）；T-001/T-002/T-003 与里程碑 M1 结项 |
| 2026-10-02 | Web 端补齐 PWA | 新增 manifest（standalone + 品牌色）、2 个 SVG 图标、`tools/build_web_pwa.mjs`（生成带内容指纹的 sw.js 并自检 3 项）；`web:build` 自动串联；生产构建注册 service worker，开发模式不注册 |
| 2026-10-02 | 两端静态契约检查 | 小程序新增 `tools/weapp_static.mjs`（5 项：绑定/事件/wx:key/样式类/页面登记），Web 端在冒烟里加"源码类名必须已定义"；抓出并修复 `.stepFloor`（WXSS）与 `.step-floor`、`.picker-body`（CSS） |
| 2026-10-02 | 尺寸阶梯令牌化 | 新增 13 档字号 / 10 档间距 / 6 档圆角令牌；Web 44 处字号 + 6 圆角 + 41 间距、小程序 36 处字号 + 4 圆角 + 45 间距改为令牌引用；Apple 端新增 `Metrics` 读同一份阶梯（+1 项测试），SwiftUI 51 处字号改为 `Theme.font(...)`；检查脚本增至 6 项并输出"阶梯外间距"信息统计 |
| 2026-10-02 | 设计令牌三端同源 | `export_shared.py` 增出 `tokens.css`/`tokens.wxss`；Web 与小程序样式全部改为令牌引用（小程序 58 处、Web 11 处）；新增 `tools/check_tokens.mjs` 5 项检查（令牌完整性、两端一致、无同值硬编码、无未定义引用、别名集合一致） |
| 2026-10-02 | Web 端改用共享状态机 + 渲染器逐命令比对 | Web `main.ts` 重构为纯视图层（删除第二份状态机与文案映射，15 项端到端仍全绿）；新增 10 场景 / 664 条命令的渲染基准，Swift 与 TS 逐条相等 |
| 2026-10-02 | 共享渲染器 + 微信小程序端 | 把绘制逻辑上提为 `packages/core/src/render.ts`（命令流，Web/小程序共用，+13 项回归）；新增 `app-model.ts`/`presenter.ts` 与 8 项回归；交付 `apps/weapp`（六页 + Canvas 2D + 核心打包）与 9 项冒烟；修复英文换层文案缺空格（两端） |
| 2026-10-02 | Apple 端界面 + 缺陷修复 | 新增 `AirportUI`（AppModel/Presenter/MapRenderer/Color，绘制抽成命令流）与 `AirportGuideApp`（SwiftUI 六页 + Canvas）；新增 27 项呈现层回归；测试发现并修复「修改出发位置误入目的地页」（Web 端同源缺陷一并修复 + 两端加回归） |
| 2026-10-02 | Apple 端核心 + 跨语言基准 | Swift 移植 `AirportCore`（图/寻路/步骤/状态机/检索/双语/视口）与 `airport-cli`；新增 `tools/gen_route_fixture.mjs` 生成 824 条基准，Swift 端逐节点比对通过；`tools/apple_test.sh` 解决沙箱下的 SwiftPM 限制 |
| 2026-10-02 | 多端移植第一步：共享核心 + Web/PWA | 抽出 `packages/core`（零平台依赖，Node 原生跑 TS）与 `tools/export_shared.py` 导出链；`apps/web` 六页流程可用；新增 16 项核心回归 + 14 项 Web 端到端断言；新增 W6 任务段与 D-08/D-09 决策 |
| 2026-10-02 | 补入 W5 一致性与 W2 设计侧取证 | 汇总五份专项文档撰写过程中在代码里发现的 20 余项事实性问题（令牌零引用、色值漂移、双语双轨、动效缺失、apm 类型降级、状态竞态等），全部带文件位置 |

---

## 变更记录

| 版本 | 日期 | 修改人 | 说明 |
|---|---|---|---|
| v1.0 | 2026-10-02 | DSH Agent | 首次创建，基于 main@8350ff4 |
| v1.1 | 2026-10-02 | DSH Agent | 新增 W6 多端移植任务段（T-601~T-608）、D-08/D-09 决策与 M5 里程碑；基线快照补共享核心与 Web 客户端实测 |
| v1.2 | 2026-10-02 | DSH Agent | T-606/T-610 完成（Apple 核心 + 跨语言基准）；新增 T-609（Apple UI）；基线补 Apple 端实测 |
| v1.3 | 2026-10-02 | DSH Agent | T-609/T-611 完成（Apple UI + 双端缺陷修复）；新增 T-612（Apple 视觉走查）；基线补 42 项 Swift 回归 |
| v1.4 | 2026-10-02 | DSH Agent | T-605 完成（微信小程序端）；渲染命令流/状态机/呈现层上提共享核心；新增 T-613/T-614/T-615 |
| v1.5 | 2026-10-02 | DSH Agent | T-613/T-615 完成（Web 纯视图化 + 渲染器跨语言逐命令比对） |
| v1.6 | 2026-10-02 | DSH Agent | T-201 完成（设计令牌三端同源 + 检查脚本）；T-202 拆出为字号/间距收敛 |
| v1.7 | 2026-10-02 | DSH Agent | T-202 主体完成（字号/圆角/间距阶梯令牌化，三端共用）；新增 T-216（阶梯外间距收敛） |
| v1.8 | 2026-10-02 | DSH Agent | T-617/T-618 完成（小程序与 Web 的静态契约检查），并修掉两处未定义样式 |
| v1.9 | 2026-10-02 | DSH Agent | T-619 完成（Web 端 manifest + service worker，可离线安装） |
| v2.0 | 2026-10-02 | DSH Agent | T-001/T-002/T-003 结项：修好 ArkTS 源码验证 + 一键门禁 `check_all.sh`（9 步）；M1 完成 |
| v2.1 | 2026-10-02 | DSH Agent | T-620：令牌门禁增加 WCAG 2.1 AA 对比度核算（第 7 项），记录 3 处已豁免偏差 |
