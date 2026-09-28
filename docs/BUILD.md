# 🛫 星海国际机场 · 室内导航元服务 — BUILD

> **面向执行者**：从源码到模拟器中运行的完整指南，涵盖环境准备、编译、安装、调试和常见问题。
>
> 📖 功能概览、架构说明、完整实践路线见 [`README.md`](../README.md)；设计细节、踩坑记录见 [`开发文档.md`](./开发文档.md)。

---

## 目录

1. [文档说明](#1-文档说明)
2. [环境准备](#2-环境准备)
3. [构建 HAP 包](#3-构建-hap-包)
4. [安装到设备](#4-安装到设备)
5. [调试与日志](#5-调试与日志)
6. [常见问题](#6-常见问题)
7. [文件清单](#7-文件清单)

---

## 1. 文档说明

### 1.1 覆盖范围

- **构建**：从源码编译出 `entry-default-unsigned.hap`
- **安装**：安装到模拟器或真机
- **调试**：通过 DevEco Studio、`hilog`、`hdc` 查看运行状态
- **排障**：编译 / 安装 / 运行阶段常见问题

不在范围内：HarmonyOS SDK 安装、DevEco Studio 下载与安装（请参考华为官方文档）。

### 1.2 执行通则

1. **先开模拟器，后装 App**：模拟器需完全启动（桌面可见）后再执行安装。
2. **元服务免安装**：本工程是 `atomicService`（`installationFree: true`），单入口 `EntryAbility`，HAP 装入即可点开，无需额外安装依赖包。
3. **产物未签名**：unsigned HAP 可直接装模拟器；真机（非调试）需要先在 DevEco Studio 里配置签名证书再打包。
4. **`local.properties` 不入库**：该文件含本机 SDK 路径，已 gitignore，由各人本地生成。
5. **生成文件勿手改**：`entry/src/main/ets/model/AirportMap.ets` 是 `tools/gen_model.py` 的产物，改地图数据要走 [`数据同步链`](#62-数据同步)，不要直接编辑。

---

## 2. 环境准备

### 2.1 必备软件

| 软件 | 版本要求 | 用途 | 获取方式 |
|------|----------|------|----------|
| DevEco Studio | 6.x（内置 hvigor 6 / Node / ohpm / hdc） | 代码编辑、编译、调试 | [华为官方下载](https://developer.huawei.com/consumer/cn/deveco-studio/) |
| HarmonyOS SDK | API ≥ 23（本机建议 API 24/25/26 任一） | 编译（compile）与运行（compatible） | DevEco Studio 内 SDK Manager 安装 |
| hdc | SDK 内置 | 设备连接与安装 | DevEco Studio 自带 |
| Python | 3.8+ | 仅地图数据管道（`tools/`）需要 | 系统自带即可 |

> **注意**：本仓库不含 `hvigorw` 包装脚本。`hvigorw` 来自 DevEco Studio 自带工具链（`<DevEco>/tools/hvigor/bin`），请先按 §3.1 配置好环境变量与 `PATH` 再执行构建命令，否则会提示 command not found。
>
> **零第三方依赖**：`oh-package.json5` 的 `dependencies` 为空，无需执行 `ohpm install`；构建只依赖 SDK 自带组件。

### 2.2 SDK 版本与 `build-profile.json5`

本工程根目录 `harmony_app/build-profile.json5`：

- **未写死 `compileSdkVersion`**：编译用本机 SDK 默认版本（本机装 API 24 即按 24 编译）。
- **固定兼容与目标**：`compatibleSdkVersion / targetSdkVersion = "6.1.0(23)"`，`runtimeOS: "HarmonyOS"`。
- 因此**同一份代码**：在 API 24/25/26 本机都能编译，产物可跑 API 23+ 的模拟器/真机。

检查本机 SDK 版本：

```bash
cat "<SDK>/default/openharmony/ets/oh-uni-package.json" | grep apiVersion
```

> 无需修改 `build-profile.json5` 即可在本机编译；只有当你想**强制**某编译版本时，才在 `products.default` 里显式写 `"compileSdkVersion": "6.1.1(24)"`。

### 2.3 SDK 路径确认

编译前需确认 `local.properties`（`harmony_app/local.properties`）中的 `sdk.dir` 已指向本机 SDK：

```properties
# macOS（DevEco Studio 内置 SDK 路径）
sdk.dir=/Applications/DevEco-Studio.app/Contents/sdk

# Windows（示例，以 SDK Manager 显示的 OHOS SDK Location 为准）
sdk.dir=C:\Users\<User>\DevEcoStudio\sdk
```

> 该文件不入库。缺失 / 路径错误时，最省事的做法是用 DevEco Studio 打开一次 `harmony_app`，它会自动改写正确；或手动编辑本文件。

---

## 3. 构建 HAP 包

### 3.1 环境变量

构建前需确保以下环境变量指向本机 DevEco Studio / HarmonyOS SDK 安装目录：

| 变量 | 用途 | Windows 示例 | macOS / Linux 示例 |
|------|------|-------------|-------------------|
| `DEVECO_SDK_HOME` | HarmonyOS SDK 根目录 | `C:\Users\<User>\DevEcoStudio\sdk` | `/Applications/DevEco-Studio.app/Contents/sdk` |
| `NODE_HOME` | Node.js 目录（DevEco 自带） | `C:\Users\<User>\DevEcoStudio\tools\node` | `/Applications/DevEco-Studio.app/Contents/tools/node` |
| `JAVA_HOME` | JDK 目录（DevEco 自带） | `C:\Users\<User>\DevEcoStudio\jbr` | `/Applications/DevEco-Studio.app/Contents/jbr/Contents/Home` |

同时将以下路径加入 `PATH`（macOS 参考）：

```bash
$JAVA_HOME/bin
$NODE_HOME/bin
$DEVECO_SDK_HOME/default/openharmony/toolchains
<DevEco>/tools/ohpm/bin
<DevEco>/tools/hvigor/bin     # 提供 hvigorw
```

> 路径以本机 SDK Manager（DevEco Studio → 偏好设置 → SDK）中显示的 `OHOS SDK Location` 为准；`sdk/` 与 `tools/` 通常在 DevEco 安装目录的同一父级下。

### 3.2 命令行构建

#### macOS / Linux (bash)

```bash
export DEVECO_SDK_HOME="/Applications/DevEco-Studio.app/Contents/sdk"
export NODE_HOME="/Applications/DevEco-Studio.app/Contents/tools/node"
export JAVA_HOME="/Applications/DevEco-Studio.app/Contents/jbr/Contents/Home"
export PATH="$JAVA_HOME/bin:$NODE_HOME/bin:$DEVECO_SDK_HOME/default/openharmony/toolchains:/Applications/DevEco-Studio.app/Contents/tools/ohpm/bin:/Applications/DevEco-Studio.app/Contents/tools/hvigor/bin:$PATH"

cd harmony_app
hvigorw --no-daemon --mode module -p product=default -p module=entry@default assembleHap --console=plain
```

> 若 `hvigorw` 不在 PATH，可直接调 `node` 执行包装脚本：
> ```bash
> node /Applications/DevEco-Studio.app/Contents/tools/hvigor/bin/hvigorw.js --no-daemon --mode module -p product=default -p module=entry@default assembleHap --console=plain
> ```

#### Windows (cmd)

```cmd
set DEVECO_SDK_HOME=C:\Users\<User>\DevEcoStudio\sdk
set NODE_HOME=C:\Users\<User>\DevEcoStudio\tools\node
set JAVA_HOME=C:\Users\<User>\DevEcoStudio\jbr
set PATH=%JAVA_HOME%\bin;%NODE_HOME%;C:\Users\<User>\DevEcoStudio\tools\ohpm\bin;C:\Users\<User>\DevEcoStudio\tools\hvigor\bin;%PATH%

cd harmony_app
hvigorw --no-daemon --mode module -p product=default -p module=entry@default assembleHap --console=plain
```

### 3.3 DevEco Studio 构建

1. DevEco Studio 中打开 `harmony_app` 目录（**File → Open**），等待项目同步完成
2. 菜单 **Build → Build HAP(s)/APP(s) → Build HAP(s)**
3. 产物见 §3.4 验证；若已连接模拟器，也可直接点运行按钮 ▶️ 一键完成编译 + 安装 + 启动（见 §4.2）

### 3.4 构建产物验证

```bash
ls -lh harmony_app/entry/build/default/outputs/default/entry-default-unsigned.hap
```

预期：文件生成时间即为本次构建时间。**构建日志若有未签名告警（unsigned）属正常**——unsigned HAP 专供模拟器 / 调试用真机。

### 3.5 Agent 构建

1. 打开 CodeArts 或其他 Agent，打开项目文件夹。
2. 向 AI 提出需求：`请帮我编译当前目录下的鸿蒙App`，并按 §3.1 提供本机 DevEco/SDK 路径。
3. 等待 AI 汇报构建结果与产物路径。

### 3.6 增量构建

修改代码后只需重新运行 §3.2 的构建命令，编译系统会自动识别变更文件做增量编译，比首次构建快得多。**注意**：`tools/` 下改地图数据后，需先跑 `tools/gen_model.py` 再增量构建（见 §6.2）。

---

## 4. 安装到设备

### 4.1 启动模拟器

1. DevEco Studio → 顶部菜单 **工具 → 设备管理器**
2. 选择一台 API 23+ 的模拟器镜像，点击 **启动**（首次需下载镜像，约 1-2 分钟）
3. 等待模拟器完全开机，桌面可见

> 💡 模拟器启动后可通过 `hdc list targets` 确认连接状态（本机模拟器通常为 `127.0.0.1:5555`）。

### 4.2 安装 HAP

#### 拖拽安装

直接把 `entry-default-unsigned.hap` 从文件管理器拖入模拟器窗口，系统自动安装。

#### DevEco Studio 安装

1. 打开项目，点击工具条 `无设备` 下拉，选中已启动的模拟器
2. 点 **绿色箭头 ▶️**，自动完成编译 + 安装 + 启动

#### 命令行安装

```bash
# 确认设备已连接
hdc list targets

# 安装（-r 覆盖安装）
hdc -t <target> install -r harmony_app/entry/build/default/outputs/default/entry-default-unsigned.hap

# 启动
hdc shell aa start -a EntryAbility -b com.example.airportguide
```

### 4.3 验证安装

安装后模拟器桌面出现「星海国际机场」图标。点击打开：

- 首页应显示机场总览 + 六层速览 + 「找设施 / 地铁换乘 / 楼层漫游」三入口；
- 搜「登机口 C308」→ 选起点 → 出**逐层路径图**，即安装成功。

### 4.4 卸载

- **模拟器中**：长按 App 图标 → 拖到顶部「卸载」
- **命令行**：`hdc uninstall com.example.airportguide`

---

## 5. 调试与日志

### 5.1 DevEco Studio 调试

1. 确认模拟器已连接（`hdc list targets` 可见）
2. **Run → Run 'entry'**（或点播放按钮）
3. 编译完成后自动安装并启动 App，在 **Logcat** 面板看实时日志

### 5.2 hilog 命令行日志

```bash
hdc hilog | grep -E "Ace|ArkTS|EntryAbility"
```

关注 FATAL / JsError / CppCrash / arkts 关键字；正常运行时无这些级别输出。

### 5.3 模拟器 UI 自动化（实测可用）

| 命令 | 用途 |
|------|------|
| `hdc shell uitest uiInput click x y` | 屏幕点击（物理 px，如 1320×2856 屏） |
| `hdc shell uitest dumpLayout -p /data/local/tmp/l.json` → `hdc file recv /data/local/tmp/l.json ./` | 取界面树（递归读 attributes 的 text/bounds） |
| `hdc shell snapshot_display -f /data/local/tmp/x.jpeg` → `hdc file recv /data/local/tmp/x.jpeg ./` | 截图 |
| `hdc shell aa dump -a` | 查看运行中的 Ability |

> ⚠️ **Canvas 坐标系 ≠ 物理 px**（本 SDK 实测）：FloorCanvas 内部映射与屏幕坐标不一致，节点 tap 测试请用截图 + 图像分析（如 PIL 实测）取坐标，不要按分辨率比例折算。

### 5.4 常用命令速查

| 命令 | 用途 |
|------|------|
| `hdc list targets` | 查看已连接设备 |
| `hdc -t <t> install -r <hap>` | 安装（覆盖） |
| `hdc -t <t> uninstall <bundleName>` | 卸载 |
| `hdc shell aa start -a EntryAbility -b com.example.airportguide` | 启动 App |
| `hdc hilog` | 设备日志 |
| `hdc kill` / `hdc start` | 重启 hdc 服务 |

---

## 6. 常见问题

### 6.1 编译问题

#### `00308018 EPERM` - local.properties 路径错误

**现象**：构建早期报 `EPERM` / 权限相关。
**原因**：`harmony_app/local.properties` 的 `sdk.dir` 不正确或被改写。
**解决**：手动修正 `sdk.dir` 指向本机 SDK（§2.3），或用 DevEco Studio 打开一次让工具自动补齐。

#### `00303217` - SDK 环境变量缺失

**现象**：`The sdk.dir is not configured in the local.properties.` 或 SDK 找不到。
**原因**：`DEVECO_SDK_HOME` / `local.properties` 缺失。
**解决**：命令行先 `export DEVECO_SDK_HOME=...`（§3.1）；或确认 `local.properties` 存在。

#### ArkTS `Compiler Error` - 严格模式

本 SDK（hvigor 6 / ArkTS 严格模式）实际踩过并已整改的坑（详见 [`开发文档.md §9`](./开发文档.md)）：

| 错误模式 | 原因 | 修复方式 |
|----------|------|----------|
| `arkts-no-untyped-obj-literals` | `Record` / 无类型对象字面量 | 键值字典改 `Map` + `.set()`；元数据用显式 interface 注解 |
| `string | null` 窄化丢失 | Dijkstra 闭包捕获可变 `u` | 在闭包外用 `const cur = u` 冻结 |
| `HorizontalAlign` 用在 `Row` | Row 的对齐是 `VerticalAlign` | 改用 `VerticalAlign` |
| `@Builder` 体内局部变量 | `@Builder` 方法禁止局部变量声明 | 拆成普通私有方法调用 |
| `Cannot find 'Gesture'` | 本 SDK 中 `GestureGroup` 是工厂值、无类型名 | 去掉返回类型注解，由调用推断 |

#### WARN：`Circle().fill()` 等新 API

**现象**：日志出现 `WARN`（非错误）。
**原因**：校验新版 SDK（API 26 引入）的 API 用法在旧的兼容层上打警告。
**解决**：不受影响可忽略；若想消除，改用圆角 `Row` 绘制色点（本项目已如此处理）。

### 6.2 数据同步（改地图数据）

地图唯一事实源是 `data/XHA_xinghai_t1.map.json`。**改数据后必须重跑生成器**，否则端侧模型与数据不一致：

```bash
python3 tools/gen_model.py      # 重生成 harmony_app/entry/src/main/ets/model/AirportMap.ets
python3 tools/gen_maps.py      # 若需重算 map JSON（改原图坐标/连线时）
python3 tools/preview_nodes.py # 重生成 preview/*.svg 可视化
```

再走 §3 增量构建。**`AirportMap.ets` 为生成文件，请勿手改。**

### 6.3 安装问题

#### 模拟器连接失败

```bash
hdc list targets   # 返回空
```

排查：①模拟器完全启动（桌面可见）；②DevEco Studio 设备管理器显示在线；③`hdc kill` → `hdc start` 重启服务。

#### `INSTALL_FAILED_VERSION_DOWNGRADE`

**原因**：已安装版本比要装的更新。
**解决**：先卸载再装：`hdc uninstall com.example.airportguide` → `hdc install -r <hap>`。

#### 真机提示「未签名」

unsigned HAP 仅供模拟器 / 调试真机。真机分发给用户需在 DevEco Studio 配置签名证书并打 signed HAP。

### 6.4 运行时问题

| 现象 | 原因 | 解决 |
|------|------|------|
| bindSheet 弹层空白且关不掉 | 弹层内容因状态变化变成空树 | 弹层内容永远渲染一个非空占位根；关闭动作不清空选中节点（详见开发文档 §8.1） |
| 路径图流畅/命中 OK 但测试点不中节点 | Canvas 坐标 ≠ 物理 px | 截图 + PIL 实测坐标（§5.3） |
| 中英切换后某文案没变 | 该处走了硬编码 | 全部改用 `Loc.t(key)`（开发文档 §5/§7 已全量对齐） |

---

## 7. 文件清单

### 源码文件（`harmony_app/entry/src/main/ets/`）

| 文件路径 | 用途 | 约行数 |
|----------|------|--------|
| `entryability/EntryAbility.ets` | 应用入口：loadContent('pages/Index') + 防白闪底色 | 43 |
| `model/AirportMap.ets` | **生成**：类型化节点/边/元数据（119 节点 / 145 边 / side / FLOOR_BBOX） | 2139 |
| `model/Localization.ets` | 节点 id→{zh,en} 名、类型/楼层双语 | 67 |
| `model/Categories.ets` | 语义分类 + 搜索索引 + 热门直达 | 106 |
| `model/Loc.ets` | 运行时中英文案表（key 对齐 string.json） | 124 |
| `core/Pathfinder.ets` | Dijkstra + 安检必经拆段 + 偏好 | 289 |
| `core/Viewport.ets` | 视口变换（缩放/平移/坐标换算） | 68 |
| `core/Router.ets` | 跨页路由参数（startId/endId/browseFloor/metroDir） | 21 |
| `ui/Theme.ets` | 色板 / 字号 / 圆角 | 83 |
| `ui/FloorCanvas.ets` | Canvas：示意背景 + 拓扑 + 路径三层渲染与动效 | 473 |
| `pages/Index.ets` | 首页：机场总览 + Navigation 宿主分发二级页 | 253 |
| `pages/SelectTarget.ets` | 终点选择：分类 Tabs + 搜索 | 349 |
| `pages/SelectStart.ets` | 起点选择：快捷 chips + 全节点检索 | 192 |
| `pages/Route.ets` | 逐层路径图：Tabs + 换层提示 + 动效 | 396 |
| `pages/MetroGuide.ets` | 地铁换乘引导 | 174 |
| `pages/FloorBrowse.ets` | 楼层漫游 + 节点详情 | 262 |

### 配置文件

| 文件路径 | 用途 |
|----------|------|
| `AppScope/app.json5` | 应用级配置（bundleType: atomicService / bundleName / 版本） |
| `build-profile.json5` | 项目级构建配置（SDK 版本 / product） |
| `entry/build-profile.json5` | 模块级构建配置（混淆规则） |
| `entry/src/main/module.json5` | 模块配置（EntryAbility / 页面 / installationFree） |
| `entry/src/main/resources/base/profile/main_pages.json` | 页面路由表（仅注册 pages/Index） |
| `hvigor/hvigor-config.json5` | hvigor 构建工具配置（modelVersion 6.0.0） |

### 数据与工具（仓库根目录）

| 文件路径 | 用途 |
|----------|------|
| `data/XHA_xinghai_t1.map.json` | 地图唯一数据源（119 节点 / 145 边 / 6 层） |
| `tools/gen_model.py` | JSON → `AirportMap.ets`（类型化 + 双语 + side） |
| `tools/gen_maps.py` | 原始拓扑 → map JSON |
| `tools/preview_nodes.py` | 渲染 `preview/*.svg` 可视化 |
| `tools/pathfind_reference.py` | Python 参照寻路实现（回归比对） |
| `tools/gen_icons.py` | 生成 App 图标占位 |
| `tools/checker.html` + `gen_checker.py` | 浏览器人工校准工具 |

### 文档

| 文件路径 | 用途 |
|----------|------|
| `README.md` | 项目主入口文档 |
| `docs/BUILD.md` | 本文件：构建与安装完整指南 |
| `docs/开发文档.md` | 完整设计文档（结构 / 寻路 / 渲染 / 六功能点 / 踩坑） |
| `docs/需求文档.md` | 需求文档（场景 / 范围 / 验收） |
| `docs/images/` | README 配图（地图示意图） |

---

> **最后更新**：2026-09-22 · 如有问题请提交 Issue。