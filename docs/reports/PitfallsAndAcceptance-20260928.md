# 鸿蒙踩坑与验收检查清单：星海国际机场室内导航元服务

| 项目 | 内容 |
|------|------|
| 项目名称 | 星海国际机场室内导航元服务 |
| 生成日期 | 2026-09-28 |
| 项目类型 | **纯端侧元服务**（atomicService），无云端 / 无云函数 / 无后端 / 无数据库 |
| 参考手册 | huawei-cloud-hmos-pitfalls-handbook（8 大类 122 条踩坑） |

> **重要说明**：本项目是纯端侧 HarmonyOS 元服务，不涉及任何云侧资源（FunctionGraph / APIG / RDS / FlexusL / ECS / SSH / PM2 / MySQL / Nginx 等）。因此踩坑手册中大量云侧条目**不适用**。以下清单逐条标注「适用 / 不适用」，仅对适用项给出本项目实际情况。

---

## 一、适用性总览

| 踩坑手册类别 | 编号前缀 | 条数 | 本项目适用性 | 说明 |
|-------------|---------|------|-------------|------|
| 云函数开发 | CF | 17 | **不适用** | 纯端侧，无云函数 |
| 云侧部署 | DP | 22 | **不适用** | 纯端侧，无云资源部署 |
| 端侧 ArkTS | EC | 24 | **适用** | ArkTS 严格模式、组件、配置 |
| 构建工具链 | TC | 20 | **适用** | hvigor / ohpm / SDK / build-profile |
| 模拟器测试 | RN | 14 | **适用** | hdc / 截图 / uitest / 模拟器 |
| SSH 与运维 | OP | 12 | **不适用** | 纯端侧，无服务器运维 |
| 联调验收 | AC | 8 | **部分适用** | 端侧验收适用，云侧联调不适用 |
| 功能缺陷模式 | PT | 5 | **适用** | 通用功能缺陷检查 |

> **统计**：122 条踩坑中，适用 67 条（EC 24 + TC 20 + RN 14 + PT 5 + AC 端侧 4），不适用 55 条（CF 17 + DP 22 + OP 12 + AC 云侧 4）。不适用条目因纯端侧架构而不涉及，非遗漏。

---

## 二、适用条目逐项检查

### 端侧 ArkTS（EC 类，24 条）

| # | 踩坑条目 | 本项目状态 | 证据 / 说明 |
|---|---------|-----------|------------|
| EC-01 | ArkTS 严格模式：对象字面量必须对应显式 interface | ✅ 已落实 | `Theme.ets` 用 `AppPalette`/`MapPalette` interface 注解；`AirportMap.ets` 用 `XhaMeta`/`MapNode`/`MapEdge` interface |
| EC-02 | `Record` 对象字面量禁用，改 `Map` | ✅ 已落实 | 全项目键值字典用 `Map<string, string>` + `.set()`：`Loc.ets` ZH/EN Map、`Theme.ets` TYPE_COLOR Map、`Localization.ets` TYPE_ZH/TYPE_EN Map |
| EC-03 | `throw` 必须是 Error 类型 | ✅ 已落实 | `Pathfinder.ets:46` `throw new Error('unknown node: ' + id)` |
| EC-04 | 静态方法中禁止 `this` | ✅ 已落实 | `Loc.ets` 静态方法用 `Loc.t()` / `Loc.floor()`，不使用 `this` |
| EC-05 | `main_pages.json` 的 src 路径不带 `.ets` 后缀 | ✅ 已落实 | `main_pages.json` 注册 `"src": ["pages/Index"]`，无 `.ets` 后缀 |
| EC-06 | `@Builder` 体内禁止局部变量声明 | ✅ 已落实 | `Index.ets`/`Route.ets`/`SelectTarget.ets` 中 `@Builder` 方法内局部变量拆成普通私有方法（如 `destSymbol()`/`destName()`/`destColor()`） |
| EC-07 | `HorizontalAlign` 不能用在 `Row` 的 `alignItems` | ✅ 已落实 | `Index.ets` 中 `Row().alignItems(VerticalAlign.Center)` / `Column().alignItems(HorizontalAlign.Start)` |
| EC-08 | `Gesture` / `GestureGroup` 无类型名可用 | ✅ 已落实 | `FloorCanvas.ets:gestures()` 方法去掉返回类型注解，由 `GestureGroup(...)` 调用推断 |
| EC-09 | `string | null` 闭包捕获丢失窄化 | ✅ 已落实 | `Pathfinder.ets:125` `const cur = u` 冻结后进 forEach |
| EC-10 | `Circle().fill()` SDK 26 新 API WARN | ✅ 已处理 | 改用圆角 `Row` 色点替代 `Circle` 组件 |
| EC-11 | `bindSheet` 弹层内容变空树导致不关闭 | ✅ 已修复 | `FloorBrowse.ets` 弹层内容永远渲染非空占位根 |
| EC-12 | `Canvas` 坐标系 ≠ 物理 px | ✅ 已知并处理 | 开发文档 §8.2 记录：用 PIL 实测坐标，不按分辨率折算 |
| EC-13 | `@StorageLink` 跨页面状态同步 | ✅ 正确使用 | `Index.ets`/`Route.ets` 等用 `@StorageLink('lang')` 实现双语即时切换 |
| EC-14 | `NavDestination` 路由参数类型坑 | ✅ 已规避 | 用模块级 `Router` 静态类传递跨页参数，避免 `param` 类型问题 |
| EC-15 | `setInterval` 动效需手动清理 | ✅ 已处理 | `Route.ets:aboutToDisappear()` 中 `clearInterval(this.timer)` |
| EC-16 | `import` / `export` 模块一致性 | ✅ 已验证 | 16 模块 import/export 一致（开发文档 §9 回归确认） |
| EC-17 | `installationFree: true` 元服务配置 | ✅ 已配置 | `module.json5` `installationFree: true` + `deliveryWithInstall: true` |
| EC-18 | `bundleType: "atomicService"` 应用配置 | ✅ 已配置 | `app.json5` `bundleType: "atomicService"` |
| EC-19 | EntryAbility 防冷启动白闪 | ✅ 已处理 | `EntryAbility.ets` `setWindowBackgroundColor` 打深青底色 |
| EC-20 | `Tabs` 组件 `barPosition` / `index` 配置 | ✅ 正确使用 | `Route.ets` `Tabs({ barPosition: BarPosition.Start, index: this.floorIndex() })` |
| EC-21 | `ForEach` key 生成器需唯一 | ✅ 正确使用 | 各页面 `ForEach` 均提供 key 函数（如 `(item: string) => item`、`(leg: RouteLeg, i: number) => leg.floor + ':' + i`） |
| EC-22 | `@Prop` + `@Watch` 属性变更监听 | ✅ 正确使用 | `FloorCanvas.ets` `@Prop @Watch('onProps') floor` 等属性变更触发重绘 |
| EC-23 | `CanvasRenderingContext2D` 初始化 | ✅ 正确使用 | `FloorCanvas.ets` `new CanvasRenderingContext2D(new RenderingContextSettings(true))` |
| EC-24 | 资源 `$r` 引用 vs 运行时文案表 | ⚠️ 待并轨 | 当前用 `Loc.t()` 运行时表（51 键），key 与 `string.json` 对齐但未并轨 `$r`。开发文档注明「随时可并轨」 |

### 构建工具链（TC 类，20 条）

| # | 踩坑条目 | 本项目状态 | 证据 / 说明 |
|---|---------|-----------|------------|
| TC-01 | `DEVECO_SDK_HOME` 指向 sdk 根目录 | ✅ 文档已说明 | `BUILD.md §3.1` 环境变量表明确 `DEVECO_SDK_HOME` 路径 |
| TC-02 | `JAVA_HOME` / `NODE_HOME` 需设置 | ✅ 文档已说明 | `BUILD.md §3.1` 完整环境变量表 |
| TC-03 | `local.properties` 的 `sdk.dir` 需正确 | ✅ 已处理 + 文档记录 | `.gitignore` 忽略；`BUILD.md §2.3` 说明确认方式；README 高频问题表记录 `00308018 EPERM` 排查 |
| TC-04 | `hvigorw` 不在 PATH 时直接调 node | ✅ 文档已说明 | `BUILD.md §3.2` 提供 `node hvigorw.js` 备选命令 |
| TC-05 | `compatibleSdkVersion` 必须匹配 API | ✅ 正确配置 | `build-profile.json5` `compatibleSdkVersion: "6.1.0(23)"` |
| TC-06 | 构建前先 `hvigorw --stop-daemon`（daemon 缓存旧环境） | ℹ️ 未显式提及 | 项目用 `--no-daemon` 模式构建，规避了 daemon 缓存问题 |
| TC-07 | `ohpm install` 零依赖时可跳过 | ✅ 已说明 | `BUILD.md §2.1` 注明「零第三方依赖，dependencies 为空，无需 ohpm install」 |
| TC-08 | `00308018 EPERM` 错误 | ✅ 文档已记录 | `README.md §5` 高频问题表 + `BUILD.md §6.1` |
| TC-09 | `00303217` SDK 环境变量缺失 | ✅ 文档已记录 | `README.md §5` 高频问题表 + `BUILD.md §6.1` |
| TC-10 | `arkts-no-untyped-obj-literals` 编译错误 | ✅ 文档已记录 + 已修复 | `BUILD.md §6.1` ArkTS 严格模式错误表 + 开发文档 §9 整改清单 |
| TC-11 | `arkts-limited-throw` 编译错误 | ✅ 已修复 | `Pathfinder.ets` `throw new Error(...)` |
| TC-12 | `arkts-no-standalone-this` 编译错误 | ✅ 已修复 | `Loc.ets` 静态方法不用 `this` |
| TC-13 | `@Builder` 局部变量错误 | ✅ 文档已记录 + 已修复 | `BUILD.md §6.1` 错误表 + 开发文档 §9 |
| TC-14 | `Gesture` 类型名不存在 | ✅ 文档已记录 + 已修复 | `BUILD.md §6.1` 错误表 + 开发文档 §9 |
| TC-15 | `Circle().fill()` WARN（SDK 26 新 API） | ✅ 文档已记录 + 已处理 | `BUILD.md §6.1` WARN 说明 |
| TC-16 | unsigned HAP 仅供模拟器/调试真机 | ✅ 文档已说明 | `BUILD.md §1.2` 通则 + `§6.3` 真机签名说明 |
| TC-17 | `hvigorw assembleHap` 产物路径 | ✅ 文档已说明 | `BUILD.md §3.4` 产物验证 `entry/build/default/outputs/default/entry-default-unsigned.hap` |
| TC-18 | `build-profile.json5` 不写死 `compileSdkVersion` | ✅ 文档已说明 | `BUILD.md §2.2` 说明未写死 compileSdkVersion 的原因和效果 |
| TC-19 | `hvigor-config.json5` modelVersion | ✅ 正确配置 | `modelVersion 6.0.0` |
| TC-20 | 增量构建只重编译变更文件 | ✅ 文档已说明 | `BUILD.md §3.6` 增量构建说明 |

### 模拟器测试（RN 类，14 条）

| # | 踩坑条目 | 本项目状态 | 证据 / 说明 |
|---|---------|-----------|------------|
| RN-01 | `hdc list targets` 确认设备连接 | ✅ 文档已说明 | `BUILD.md §4.1` + `§5.4` 命令速查 |
| RN-02 | `hdc -t <target> install -r <hap>` 安装 | ✅ 文档已说明 | `BUILD.md §4.2` 命令行安装 + `§5.4` 速查 |
| RN-03 | `hdc shell aa start -a EntryAbility -b <bundle>` 启动 | ✅ 文档已说明 | `BUILD.md §4.2` + `§5.4` 速查，bundleName = `com.example.airportguide` |
| RN-04 | `INSTALL_FAILED_VERSION_DOWNGRADE` | ✅ 文档已记录 | `BUILD.md §6.3` 排查：先卸载再装 |
| RN-05 | `hdc shell snapshot_display` 截图 | ✅ 文档已记录 | `BUILD.md §5.3` 模拟器 UI 自动化表 |
| RN-06 | `hdc shell uitest uiInput click x y` 点击 | ✅ 文档已记录 | `BUILD.md §5.3` |
| RN-07 | `hdc shell uitest dumpLayout` 取界面树 | ✅ 文档已记录 | `BUILD.md §5.3` |
| RN-08 | Canvas 坐标系 ≠ 物理 px | ✅ 文档已记录 + 已处理 | `BUILD.md §5.3` 警告 + 开发文档 §8.2 PIL 实测方法 |
| RN-09 | `hdc hilog` 日志查看 | ✅ 文档已记录 | `BUILD.md §5.2` |
| RN-10 | 模拟器连接失败排查 | ✅ 文档已记录 | `BUILD.md §6.3` 排查步骤 |
| RN-11 | 拖拽安装 HAP | ✅ 文档已说明 | `BUILD.md §4.2` 拖拽安装方式 |
| RN-12 | DevEco Studio 运行按钮一键编译+安装+启动 | ✅ 文档已说明 | `BUILD.md §4.2` DevEco Studio 安装方式 |
| RN-13 | `hdc kill` / `hdc start` 重启服务 | ✅ 文档已记录 | `BUILD.md §5.4` 命令速查 |
| RN-14 | `hdc uninstall` 卸载 | ✅ 文档已记录 | `BUILD.md §4.4` + `§5.4` 速查 |

### 联调验收（AC 类，端侧部分适用）

| # | 踩坑条目 | 本项目适用性 | 证据 / 说明 |
|---|---------|-----------|------------|
| AC-01 | 端侧可编译、可装模拟器可跑 | ✅ 适用 + 已验证 | 2026-09-15 模拟器实测通过 |
| AC-02 | 数据与代码一致性验证 | ✅ 适用 + 已验证 | `gen_model` 重跑幂等 diff 为空；500 随机用例寻路回归全绿 |
| AC-03 | hilog 无 FATAL / JsError / CppCrash | ✅ 适用 + 已验证 | 开发文档 §9 确认 |
| AC-04 | 业务验收逐条通过 | ✅ 适用 + 已验证 | README §5 业务验收 9 项全部通过 |
| AC-05 | 云函数与端侧联调 | ❌ 不适用 | 纯端侧，无云函数 |
| AC-06 | APIG 发布版本检查 | ❌ 不适用 | 纯端侧，无 APIG |
| AC-07 | 数据库连通性验证 | ❌ 不适用 | 纯端侧，无数据库 |
| AC-08 | 回滚方案 | ❌ 不适用 | 纯端侧，无部署回滚需求 |

### 功能缺陷模式（PT 类，5 条）

| # | 踩坑条目 | 本项目状态 | 证据 / 说明 |
|---|---------|-----------|------------|
| PT-01 | 角色视角逻辑同步 | ✅ 不涉及 | 本项目无角色/权限系统 |
| PT-02 | 数据一致性（前后端同步） | ✅ 不涉及 | 纯端侧，无前后端同步问题；数据一致性靠 gen_model 幂等保证 |
| PT-03 | 偏好乘子影响显示距离 | ✅ 已修复 | 四种偏好下距离显示不一致问题已修复：选路用乘子、显示用原始权重 |
| PT-04 | 直达路线残留空楼层 Tab | ✅ 已修复 | mergeTransitLegs 吸收单节点过站腿 |
| PT-05 | 弹层空白不关闭 | ✅ 已修复 | bindSheet 内容永远非空 + 关闭不清空选中节点 |

---

## 三、不适用条目汇总（纯端侧项目排除项）

以下踩坑手册条目**因本项目为纯端侧元服务而不适用**，明确标注避免误用：

### 云函数开发（CF 类，17 条）——全部不适用

| 排除原因 | 涉及条目 |
|---------|---------|
| 无 FunctionGraph 云函数 | CF-01 ~ CF-17 全部（shared 目录、zip 打包、node_modules、handler 签名、event.body Base64、pool.query 等） |

### 云侧部署（DP 类，22 条）——全部不适用

| 排除原因 | 涉及条目 |
|---------|---------|
| 无 VPC / RDS / APIG / FunctionGraph 触发器 | DP-01 ~ DP-22 全部（VPC 安全组、APIG 触发器创建、RELEASE 发布、timeout 毫秒等） |

### SSH 与运维（OP 类，12 条）——全部不适用

| 排除原因 | 涉及条目 |
|---------|---------|
| 无服务器 / 无 SSH / 无 PM2 / 无 MySQL / 无 Nginx | OP-01 ~ OP-12 全部（SSH 连接、PM2 进程、MySQL 连接、curl 测试、安全组等） |

### 联调验收云侧部分——不适用

| 排除原因 | 涉及条目 |
|---------|---------|
| 无云函数 / 无 APIG / 无数据库 | AC-05 ~ AC-08（云函数联调、APIG 发布、数据库连通性、回滚方案） |

> **总结**：122 条踩坑中 55 条不适用（CF 17 + DP 22 + OP 12 + AC 云侧 4），均为云侧资源相关条目。本项目纯端侧架构从设计上规避了全部云侧踩坑风险。

---

## 四、验收检查清单

### 端侧编译验收

| # | 验收项 | 命令 / 方法 | 预期结果 | 状态 |
|---|--------|-----------|---------|------|
| V-01 | hvigorw 编译通过 | `hvigorw assembleHap --no-daemon --mode module -p product=default -p module=entry@default` | 全绿，无 ERROR | ✅ 已验证（2026-09-15） |
| V-02 | HAP 产物生成 | `ls -lh entry/build/default/outputs/default/entry-default-unsigned.hap` | 文件存在 | ✅ 已验证 |
| V-03 | unsigned WARN 属正常 | 查看构建日志 | 仅有 unsigned 告警，无 ERROR | ✅ 已验证 |
| V-04 | ArkTS 严格模式零错误 | 编译日志无 `arkts-` 前缀错误 | 22 错 3 警已全部整改 | ✅ 已验证 |

### 数据一致性验收

| # | 验收项 | 命令 / 方法 | 预期结果 | 状态 |
|---|--------|-----------|---------|------|
| V-05 | AirportMap.ets 与 map.json 一致 | `python3 tools/gen_model.py` 后 git diff | diff 为空（幂等） | ✅ 已验证 |
| V-06 | 寻路 500 随机用例回归 | `python3 tools/pathfind_reference.py` | 全绿，与端侧一致 | ✅ 已验证 |
| V-07 | 异侧 270 例含安检 | 检查回归输出 | 全部含 `xha_p4_sec` | ✅ 已验证 |
| V-08 | 同侧 230 例不含安检 | 检查回归输出 | 全部不含 `xha_p4_sec` | ✅ 已验证 |

### 模拟器运行验收

| # | 验收项 | 操作 | 预期结果 | 状态 |
|---|--------|------|---------|------|
| V-09 | 安装到模拟器 | `hdc -t 127.0.0.1:5555 install -r <hap>` | 安装成功 | ✅ 已验证 |
| V-10 | 启动应用 | `hdc shell aa start -a EntryAbility -b com.example.airportguide` | 桌面出现图标，应用启动 | ✅ 已验证 |
| V-11 | 六层总览 | 打开 App | 机场总览，六层可入 | ✅ 已验证 |
| V-12 | 分类搜索 | 搜「登机口 C308」→ 选终点 → 选起点 | 出逐层路径图 | ✅ 已验证 |
| V-13 | 安检必经（陆→空） | 陆侧起点 → 空侧终点 | 路线必经中央安检，醒目标注 | ✅ 已验证 |
| V-14 | 安检必经（空→陆） | 空侧起点 → 陆侧终点 | 同样经安检，方向合理 | ✅ 已验证 |
| V-15 | 同侧不折返安检 | 两个登机口之间 | 不折返安检 | ✅ 已验证 |
| V-16 | 跨层换层提示 | 跨层路线 | 换层提示 + 总距准确 | ✅ 已验证 |
| V-17 | 地铁引导 | 首页「地铁·往市区」 | 到 B2 对应站台 | ✅ 已验证 |
| V-18 | 中英切换 | 右上角「中 / EN」 | 文案 + 节点名即时切换 | ✅ 已验证 |
| V-19 | 路径动效 | 寻路 / 页面切换 | 路径生长动效 + 转场平滑 | ✅ 已验证 |
| V-20 | hilog 无崩溃 | `hdc hilog \| grep -E "FATAL\|JsError\|CppCrash"` | 无输出 | ✅ 已验证 |

### 用户体验修复验收（2026-09-15 修复轮）

| # | 验收项 | 操作 | 预期结果 | 状态 |
|---|--------|------|---------|------|
| V-21 | 四种偏好距离一致 | doorE→gA101 四偏好 | 均显示 490m | ✅ 已验证 |
| V-22 | 直达无空 Tab | 直达路线 | Tabs 只含真实途经楼层 | ✅ 已验证 |
| V-23 | 弹层无白区 | FloorBrowse 点节点 | 深色弹层，无白区 | ✅ 已验证 |
| V-24 | 设为出发点/目的地 | FloorBrowse 节点弹层 | 可设为出发点/目的地/取消 | ✅ 已验证 |

---

## 五、案例导入包验收

| # | 验收项 | 命令 / 方法 | 预期结果 | 状态 |
|---|--------|-----------|---------|------|
| C-01 | case.json 合法 JSON | `python3 validate_case.py ./cases` | V-1 PASS | ✅ 已验证 |
| C-02 | 8 个必填模块完整 | 同上 | V-2 PASS | ✅ 已验证 |
| C-03 | baseInfo 必填字段 | 同上 | V-3 PASS | ✅ 已验证 |
| C-04 | 枚举值正确 | 同上 | V-4 PASS | ✅ 已验证 |
| C-05 | list 字段名正确 | 同上 | V-5 PASS | ✅ 已验证 |
| C-06 | 不含系统字段 | 同上 | V-6 PASS | ✅ 已验证 |
| C-07 | 媒体文件存在 | 同上 | V-7 PASS | ✅ 已验证 |
| C-08 | 图片宽高比匹配 | 同上 | V-8 PASS | ✅ 已验证 |
| C-09 | 扩展名与格式一致 | 同上 | V-9 PASS | ✅ 已验证 |
| C-10 | 单图 ≤ 500KB | 同上 | V-10 PASS | ✅ 已验证 |

### 图片尺寸明细

| 文件 | 尺寸 | 比例 | 体积 | 状态 |
|------|------|------|------|------|
| cover.png | 2080×960 | 2.167 | 222KB | ✅ |
| share.png | 1200×1200 | 1.000 | 116KB | ✅ |
| arch-diagram.svg | 2080×820 | 2.537 | 5.3KB | ✅ |
| preview-phone.png | 2080×1100 | 1.891 | 262KB | ✅ |

---

> **验收结论**：全部 34 项验收通过（编译 4 + 数据一致性 4 + 模拟器运行 12 + 用户体验修复 4 + 案例导入包 10）。项目在 HarmonyOS 6.1.0(23) 模拟器实测通过（2026-09-15），案例导入包 validate_case.py 全部 PASS（2026-09-28）。
