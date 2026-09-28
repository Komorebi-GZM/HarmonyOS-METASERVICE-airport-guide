# 项目审查报告：星海国际机场室内导航元服务

| 项目 | 内容 |
|------|------|
| 项目名称 | 星海国际机场室内导航元服务（HarmonyOS-METASERVICE-airport-guide） |
| 审查日期 | 2026-09-28 |
| 项目路径 | `/Users/ycjcx123/Harmony_Practices2/HarmonyOS-METASERVICE-airport-guide` |
| 仓库地址 | `https://gitcode.com/harmony-practice-center/HarmonyOS-METASERVICE-airport-guide.git`（待仓库创建后复核） |
| 技术栈 | HarmonyOS ArkTS / ArkUI / Canvas / Dijkstra / atomicService |
| 审查范围 | README、docs、源码、配置、data、tools、preview |

> 本报告以「第一次接触项目的开发者」视角，对文档与代码逐条交叉验证。

> **终审修正记录（2026-09-28）**：复核后修正了文案键统计、踩坑统计和部分证据行号；P1-3 原判定撤销，README 的 BUILD.md 引用是标准 Markdown 链接。本报告的修正只发生在 `docs/reports/`，未改动业务源码、README、既有 docs 与 preview 文件。

---

## 一、内容错误与不一致

### P1-1：README 中 git clone 地址含占位符 `<本仓库>`

- **证据**：`README.md` 第 102-103 行
- **现象**：快速体验中 `git clone https://gitcode.com/harmony-practice-center/<本仓库>.git` 使用了占位符 `<本仓库>`，下一行 `cd <本仓库目录>` 同样需要使用者自行推断目录名。
- **影响**：使用者按文档操作时会卡在第一步——不知道仓库实际名称。
- **建议**：替换为真实仓库名 `HarmonyOS-METASERVICE-airport-guide.git`（或创建仓库后补充）。

### P1-2：README 中 `home_sub` 文案键在快捷直达区重复使用

- **证据**：`harmony_app/entry/src/main/ets/pages/Index.ets` 第 206 行；`harmony_app/entry/src/main/ets/model/Loc.ets` 第 8、61 行
- **现象**：快捷直达区域的标题用了 `Loc.t('home_sub', ...)`，而 `home_sub` 的值是「主航站楼 · 六层导览」，语义上是机场副标题，不是「快捷直达」标题。开发文档 §6 ① 也描述该区域为「快捷直达 `HOT_DESTINATIONS` 横向 chips」，暗示应有一个独立的 `home_hot` 或 `home_quick` 键。
- **影响**：快捷直达区域标题显示为「主航站楼 · 六层导览」，与区域内容（登机口/地铁/出租等 chips）不匹配，使用者可能困惑。
- **建议**：新增 `home_quick` 键（如「热门直达」/「Quick Access」），快捷直达区域改用该键。

### P2-1：开发文档仍写「Loc.ets 46 键 = string.json 61 键」，实际为 51/66

- **证据**：`docs/开发文档.md` 第 279 行；`harmony_app/entry/src/main/ets/model/Loc.ets`；`harmony_app/entry/src/main/resources/base/element/string.json`
- **现象**：开发文档称 Loc.ets 46 键、string.json 61 键。实际静态统计显示 `Loc.ets` 的 ZH/EN 均为 51 键且键名对称；base 与 en_US 的 `string.json` 均为 66 键。差异 15 个键未在文档中列出。
- **影响**：不影响功能运行（当前用 `Loc.t()` 运行时表），但后续并轨 `$r` 资源引用时增加排查成本。
- **建议**：在开发文档中补充 `Loc.ets` 与 `string.json` 的键差异清单，或注明 `string.json` 多出的键为系统默认键（module_desc、EntryAbility_desc 等）。

### P2-2：BUILD.md §7 文件清单中 AirportMap.ets 行数标注「约 2139 行」

- **证据**：`docs/BUILD.md` 第 340 行；`harmony_app/entry/src/main/ets/model/AirportMap.ets` 实际 2139 行
- **现象**：行数标注准确（wc -l 确认 2139 行），无不一致。
- **影响**：无问题，确认一致。
- **建议**：保持现状。

---

## 二、安全问题

### P2-3：无安全章节但项目特性决定了低风险

- **证据**：`README.md` §6「安全、维护与参考」；`module.json5` 无 `requestPermissions`
- **现象**：README 有简短的「数据安全」说明（纯端侧、无网络传输、无账号体系、无敏感权限），但未设置独立的「安全注意事项」章节。module.json5 确认无任何 `requestPermissions` 声明，oh-package.json5 dependencies 为空，零第三方依赖。
- **影响**：极低。纯端侧元服务无网络/无权限/无账号，安全攻击面几乎为零。但作为公开学习项目，缺少安全章节不是最佳实践。
- **建议**：可在 README §6 中补充一句「本项目无网络请求、无权限申请、无用户数据收集，符合最小权限原则」，明确安全姿态。

### P2-4：.gitignore 已正确忽略 local.properties

- **证据**：`harmony_app/.gitignore` 第 10 行
- **现象**：`.gitignore` 包含 `local.properties`，确保含本机 SDK 路径的文件不入库。
- **影响**：无问题，已正确处理。
- **建议**：保持现状。

### P2-5：无密钥/Token/CORS 暴露

- **证据**：全项目无 `.env` 文件、无硬编码密钥、无网络请求代码
- **现象**：项目纯端侧，无任何后端 API 调用、无密钥管理、无 CORS 配置需求。
- **影响**：无问题。
- **建议**：不适用（纯端侧项目）。

---

## 三、易读性

### P1-3：复核撤销——README 的 BUILD.md 链接有效

- **证据**：`README.md` 第 110 行 `参考 [`docs/BUILD.md`](docs/BUILD.md) 选择一种方式`
- **现象**：终审复核确认该处使用标准 Markdown 相对链接，指向 `docs/BUILD.md`，不存在原先误判的 `§2` 锚点失效问题。
- **影响**：无。
- **建议**：无需修改。

### P2-6：README 编译命令覆盖 Windows 和 macOS 但缺少 Linux

- **证据**：`README.md` §3 快速体验 → A. 命令行
- **现象**：命令行构建方法有 Windows (PowerShell) 和 macOS/Linux (bash) 两个折叠面板，macOS/Linux 部分实际只写了 bash 通用命令，但路径用的是 macOS 的 `/Applications/DevEco-Studio.app/` 路径。
- **影响**：Linux 用户需自行替换 DevEco 安装路径，但命令结构一致，影响不大。
- **建议**：在 macOS/Linux 部分注明「Linux 用户请将路径替换为实际 DevEco 安装目录」。

### P2-7：开发文档 §9 的 ArkTS 整改清单编号与正文 §8.1 修复轮有交叉

- **证据**：`docs/开发文档.md` §9 vs §8.1
- **现象**：§9 称「22 错 3 警全部整改」，§8.1 称「4 项问题全部修复」，两者是不同维度的修复（§9 是编译错误整改，§8.1 是用户体验修复），但读者可能混淆。
- **影响**：低影响，信息完整但组织略有重叠。
- **建议**：在 §8.1 开头注明「以下为模拟器实测后的用户体验修复，与 §9 的编译错误整改为不同轮次」。

### P2-8：preview/index.html 为纯静态预览页，缺少使用说明

- **证据**：`preview/index.html`
- **现象**：preview/index.html 是一个节点图 SVG 预览页，直接用 `<object>` 标签引用 7 个 SVG 文件。页面无标题说明、无导航、无响应式适配。
- **影响**：使用者打开后可能不清楚这是「数据可视化工具」还是「应用预览」。
- **建议**：在页面顶部加一行说明文字「以下为地图数据的 SVG 可视化预览，非应用运行截图」。

---

## 四、功能正确性

### P1-4：mergeTransitLegs 合并逻辑在极端情况下可能遗漏中间层路径

- **证据**：`harmony_app/entry/src/main/ets/core/Pathfinder.ets` 第 259-283 行 `mergeTransitLegs` 函数
- **现象**：该函数把「单节点过站腿」（`legs[j].nodeIds.length === 1`）吸收进直达换乘。但如果路径在某层有 2 个节点（如电梯入口+电梯出口）但实际只是过站，不会被合并。这可能导致 Tabs 仍残留只有 2 个节点的中间层。
- **影响**：低概率边界情况。实际数据中垂直边跨层时中间层通常只有 1 个节点（电梯井道），2 节点情况极少。README 验收已确认「直达路线 Tabs 只含真实途经楼层」实测通过。
- **建议**：可考虑将合并条件从 `nodeIds.length === 1` 放宽为 `nodeIds.length <= 2 && 非起终点层`，但需验证不误合并真实途经层。

### P2-9：Pathfinder Dijkstra 使用朴素法，119 节点规模下性能可接受

- **证据**：`harmony_app/entry/src/main/ets/core/Pathfinder.ets` 第 106-148 行 `dijkstra` 函数
- **现象**：使用朴素 Dijkstra（O(V²) 每次扫描全 dist Map 找最小），119 节点规模下每次寻路约 14000 次比较，端侧毫秒级完成。
- **影响**：无性能问题，当前规模下完全够用。
- **建议**：若未来节点数扩展到 1000+，建议改用最小堆优先队列。当前不需改动。

### P2-10：Viewport.pan 的 clamp 范围固定 ±2000 可能不适合所有楼层

- **证据**：`harmony_app/entry/src/main/ets/core/Viewport.ets` 第 55-62 行 `clampT` 函数
- **现象**：平移钳制范围硬编码为 ±2000（屏幕像素），不同楼层 bbox 大小差异较大（如 B2 站台较小、4F 出发层较大），固定钳制可能导致小楼层过度平移后无法回到视野。
- **影响**：低影响。用户可通过缩放或切换楼层 Tab 重置视口（fitFloor 机制）。
- **建议**：可将钳制范围改为基于当前楼层 bbox 动态计算，但优先级低。

---

## 五、文档质量

### P2-11：README 有清晰的「快速体验」和「完整实践」两条路线

- **证据**：`README.md` 开头的「两条路线」引导
- **现象**：README 顶部明确标注「想先看到 App → 快速体验 · 想完整学习 → 完整实践」，两条路线各有独立的步骤编号和完成标志。
- **影响**：无问题，文档质量优秀。
- **建议**：保持现状。

### P2-12：README 有高频问题排障表但未覆盖所有已踩坑

- **证据**：`README.md` §5「高频问题」表
- **现象**：README 排障表列了 5 个高频问题（EPERM、SDK 变量、Compiler Error、bindSheet 空白、Canvas 点不中），但开发文档 §9 记录了更多踩坑（如 HorizontalAlign on Row、@Builder 局部变量、Gesture 类型名等）。
- **影响**：使用者遇到开发文档中的其他编译错误时，需翻阅开发文档而非 README 排障表。
- **建议**：README 排障表已足够覆盖高频问题，更详细的踩坑可指向开发文档 §9。保持现状即可。

### P2-13：README 图片有 alt 描述

- **证据**：`README.md` 中所有 `<img>` 标签
- **现象**：所有图片标签包含 `alt` 属性（如 `alt="4F 出发层路径图"`、`alt="六层纵览"`）。
- **影响**：无问题，符合无障碍要求。
- **建议**：保持现状。

### P2-14：缺少版本变更日志（CHANGELOG）

- **证据**：项目根目录无 `CHANGELOG.md`
- **现象**：项目版本为 v1.0.0，无独立变更日志文件。README §6 有维护信息表（版本、验证日期、兼容范围）。
- **影响**：低影响，首版项目变更日志非必需。但后续迭代时建议建立。
- **建议**：后续版本迭代时创建 `CHANGELOG.md`。

---

## 六、一致性验证

### P2-15：README 目录结构 vs 实际目录——一致

- **证据**：`README.md` §1 技术方案一览的 mermaid 流程图；实际 `harmony_app/entry/src/main/ets/` 目录结构
- **现象**：README 中的流程图 `data → gen_model.py → model/AirportMap.ets → core/Pathfinder.ets → pages/Route.ets → ui/FloorCanvas.ets` 与实际代码结构完全一致。BUILD.md §7 文件清单与实际文件逐一对应。
- **影响**：无问题，一致性良好。
- **建议**：保持现状。

### P2-16：README 技术栈版本 vs build-profile.json5——一致

- **证据**：`README.md` 顶部「验证环境」表；`harmony_app/build-profile.json5`
- **现象**：README 称 compile API 24(6.1.1)、兼容与目标 6.1.0(23)。build-profile.json5 中 compatibleSdkVersion/targetSdkVersion = "6.1.0(23)"，runtimeOS = "HarmonyOS"。
- **影响**：无问题，版本标注一致。BUILD.md §2.2 也明确说明「未写死 compileSdkVersion，编译用本机 SDK 默认版本」。
- **建议**：保持现状。

### P2-17：README 数据描述 vs map.json——一致

- **证据**：`README.md` §1「119 节点 / 145 边 / 6 层」；`data/XHA_xinghai_t1.map.json`
- **现象**：README 和需求文档均描述 119 节点 / 145 边 / 6 层。实际 AirportMap.ets 文件头注释也标注「119 节点 / 145 边」。
- **影响**：无问题，数据描述一致。
- **建议**：保持现状。

### P1-5：开发文档的文案键统计未更新为 51/66

- **证据**：`docs/开发文档.md` 第 279 行；`harmony_app/entry/src/main/resources/base/element/string.json` vs `harmony_app/entry/src/main/ets/model/Loc.ets`
- **现象**：开发文档仍写 46/61，实际 `Loc.ets` ZH/EN 各 51 键且键名对称，`string.json` base/en_US 各 66 键。多出的 15 个键来自系统/工程文案，例如 app_name、module_desc、EntryAbility_desc、EntryAbility_label 等；`Loc.ets` 只承载运行时页面与地图文案。
- **影响**：使用者可能误以为文案表缺键或功能不完整；两套键的用途不同（`string.json` 供 `$r` 引用，`Loc.ets` 供 `Loc.t()` 引用）。
- **建议**：在开发文档中注明「`string.json` 多出的键为系统默认键，`Loc.ets` 的 51 键为运行时自定义文案全量覆盖」，并把统计改为 51/66。

### P2-18：module.json5 配置 vs README 元服务描述——一致

- **证据**：`harmony_app/entry/src/main/module.json5`；`README.md` §1 边界说明
- **现象**：README 称「元服务（atomicService）：installationFree / deliveryWithInstall，单入口免安装可运行」。module.json5 确认 `type: "entry"`、`deliveryWithInstall: true`、`installationFree: true`、单 `EntryAbility`。app.json5 确认 `bundleType: "atomicService"`。
- **影响**：无问题，配置与文档完全一致。
- **建议**：保持现状。

---

## 优先级矩阵

### P0（阻断使用者完成）——无

本项目无 P0 级问题。README 操作步骤完整，构建命令可执行，验收标准清晰，使用者可以顺利从编译到模拟器实跑完成案例。

### P1（明显缺陷影响体验）

| # | 问题 | 文件 | 行号 |
|---|------|------|------|
| P1-1 | README git clone 与 cd 地址含占位符 | README.md | 102-103 |
| P1-2 | `home_sub` 文案键在快捷直达区重复使用，语义不匹配 | Index.ets / Loc.ets | 206 / 8,61 |
| P1-3 | 复核撤销：README 使用标准 Markdown 链接 | README.md | 110 |
| P1-4 | mergeTransitLegs 合并条件在 2 节点过站时不合并 | Pathfinder.ets | 259-283 |
| P1-5 | 文案键统计过期：仍写 46/61，实际 51/66 | 开发文档.md / Loc.ets / string.json | 279 / 7-57,60-110 |

### P2（优化建议）

| # | 问题 | 文件 | 行号 |
|---|------|------|------|
| P2-1 | Loc.ets 与 string.json 键差异清单缺失 | 开发文档.md | §9 |
| P2-2 | AirportMap.ets 行数标注准确（确认一致） | BUILD.md | 340 |
| P2-3 | 缺少独立安全章节（项目特性决定低风险） | README.md | §6 |
| P2-4 | .gitignore 已正确忽略 local.properties（确认正确） | harmony_app/.gitignore | 10 |
| P2-5 | 无密钥/Token/CORS 暴露（不适用，纯端侧） | — | — |
| P2-6 | 编译命令缺少 Linux 路径说明 | README.md | §3 |
| P2-7 | §8.1 与 §9 修复轮次描述有交叉 | 开发文档.md | §8.1/§9 |
| P2-8 | preview/index.html 缺少使用说明 | preview/index.html | — |
| P2-9 | Dijkstra 朴素法性能可接受（无需改动） | Pathfinder.ets | 106 |
| P2-10 | Viewport clamp 固定 ±2000 不适配所有楼层 | Viewport.ets | 55 |
| P2-11 | README 有清晰双路线引导（确认优秀） | README.md | 开头 |
| P2-12 | README 排障表覆盖高频问题（确认足够） | README.md | §5 |
| P2-13 | README 图片有 alt 描述（确认正确） | README.md | — |
| P2-14 | 缺少 CHANGELOG（首版非必需） | — | — |
| P2-15 | README 目录结构 vs 实际——一致（确认） | README.md | §1 |
| P2-16 | 技术栈版本 vs build-profile——一致（确认） | README.md / build-profile.json5 | — |
| P2-17 | 数据描述 vs map.json——一致（确认） | README.md / map.json | — |
| P2-18 | module.json5 配置 vs README 描述——一致（确认） | module.json5 / README.md | — |

---

## 总结

本项目整体质量**优秀**。作为纯端侧 HarmonyOS 元服务案例，文档结构清晰（README + 需求文档 + 开发文档 + BUILD.md 四件套齐全），代码架构分层合理（pages → core → model → ui），数据驱动管道设计规范（JSON → gen_model.py → 类型化常量），寻路算法实现有深度（Dijkstra + 安检必经拆分 + 偏好乘子），Canvas 三层渲染方案有技术亮点。

核心修复方向：
1. 修正 README 中 git clone 占位符（P1-1），这是使用者第一步就会遇到的阻断
2. 修正快捷直达区域的文案键复用问题（P1-2），影响用户界面语义
3. 补充 Loc.ets 与 string.json 的键差异说明（P1-5），消除使用者的困惑

> 仓库地址 `https://gitcode.com/harmony-practice-center/HarmonyOS-METASERVICE-airport-guide.git` 为按本地目录名推断的 HTTPS 地址，待仓库创建后复核。
