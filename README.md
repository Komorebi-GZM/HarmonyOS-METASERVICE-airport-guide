# 星海国际机场导航元服务

从选目的地到逐步抵达：用一份随包机场示例地图，学习 HarmonyOS 元服务的端侧寻路、Canvas 导视与双语交互。

| 首页：开始新行程 | 路线预览：中央安检 | 逐步指引：电梯换层 |
| :---: | :---: | :---: |
| <img src="docs/images/product-20261001/phone/01-home.jpeg" width="210" alt="星海机场导航元服务中文首页"> | <img src="docs/images/product-20261001/phone/04-security-route-preview.jpeg" width="210" alt="西出发门到 A101 的中央安检路线预览"> | <img src="docs/images/product-20261001/phone/10-elevator-transfer.jpeg" width="210" alt="跨层路线中的电梯换层确认"> |

| 学习卡 | 内容 |
| --- | --- |
| 适合谁 | 已了解 ArkTS / ArkUI 基础，想实践元服务、图寻路和地图交互的开发者 |
| 难度与预计时长 | 进阶；已备好 DevEco Studio、SDK 与模拟器时，快速体验约 15–30 分钟，逐步阅读并独立改造约 2–4 小时。均为估计，不含环境安装、签名与发布。 |
| 将学到 | JSON 地图到 ArkTS 模型、Dijkstra 与安检必经约束、Canvas 地图、行程状态、手动分步指引及中英本地化 |
| 将做成 | 可在模拟器运行的六页机场导览元服务，并完成一次自行选择起终点、预览、指引与地图浏览 |
| 已验证环境 | 2026-10-01 使用本机 DevEco SDK API 26 编译；API 24 / 26 手机与宽屏模拟器验证。工程兼容和目标版本为 HarmonyOS 6.1.0（API 23），API 23 与真机尚未实测。 |

先运行请看[快速体验](#快速体验)，理解实现请看[完整实践](#完整实践)，检查结果或处理问题请看[验收与排障](#验收与排障)。11 张未经裁剪的 1320 × 2848 系统 JPEG 及场景说明见[产品截图](docs/images/product-20261001/phone/README.md)。

## 案例概览

星海国际机场是**示例机场**，地图并非真实机场导览数据。项目是本地运行的 HarmonyOS <code>atomicService</code>，包名为 <code>com.example.airportguide</code>，应用版本为 <code>1.0.0</code>。地图随应用提供，无须云端、账号或 API 密钥；起点由用户手动指定，步骤也由用户手动确认，不能作为实时定位或现场导航使用。

地图源文件 [XHA_xinghai_t1.map.json](data/XHA_xinghai_t1.map.json) 包含 **6 层、119 个节点、145 条边**。并非每个图节点都进入地点搜索：通道节点主要用于寻路，只有公开地点和少数指定通道可供选择。<code>tools/gen_model.py</code> 读取图数据，并用脚本内的 <code>NAME_EN</code> 字典补齐英文名称，生成 ArkTS 模型供寻路和展示使用。原有 <code>planRoute(startId, endId, pref)</code> Dijkstra 接口保留；本例图谱规定陆侧与空侧之间的路线必须经过中央安检，不能绕行。

用户体验从**目的地 → 手动选择出发位置 → 路线预览 → 当前与下一步指引 → 逐项确认**展开。六个页面分别是首页、目的地选择、起点选择、路线、地铁方向和楼层地图。地铁页可选往市区或往星湖方向，地图页支持六层浏览和点位选择。

路线提供四种偏好：**推荐路线、优先电梯、优先扶梯、尽量少走楼梯**。偏好影响选路；页面中的“步行约”只累计步行边，电梯、扶梯或楼梯换层单独提示和计数。切换查看其他路段或楼层不会推进指引。修改偏好、确认编辑起终点或交换起终点会重新规划并从预览开始；取消编辑保留原路线及进度。语言和最多 6 个最近目的地保存在本机 preferences，正在进行的指引进度只在当前会话保存。

本案例可用于学习结构化地图数据、受约束寻路与多页面状态协作。若要接入真实机场，仍需取得授权地图及运营数据，并另行处理定位、数据更新、签名发布和现场验证。

## 开始之前

| 准备项 | 要求与检查 |
| --- | --- |
| 知识 | 能阅读 ArkTS、ArkUI 组件及基本 JSON；深入实践时了解图的节点与边。 |
| 工具 | DevEco Studio、随附 HarmonyOS SDK、Node.js、Java / JBR、hvigor 与 <code>hdc</code>。以下命令示例采用 Windows PowerShell。 |
| 辅助脚本 | 数据生成和参考自测需要 Python 3，先用 <code>py -3 --version</code> 检查；只从 IDE 构建和运行现有工程时不需要 Python。 |
| 设备 | 已在 DevEco Studio 中启动的 HarmonyOS 模拟器；先运行 <code>hdc list targets</code> 确认其实际 ID。 |
| 版本 | 本轮使用 API 26 SDK 编译，在 API 24 和 26 模拟器上验证。<code>compatibleSdkVersion</code> / <code>targetSdkVersion</code> 为 6.1.0（23），但 API 23 未实测。 |
| 签名 | 快速体验使用构建出的 <code>entry-default-unsigned.hap</code> 做模拟器验收。真机安装或上架需按设备和发布流程配置正式签名；未签名 HAP 不保证可用于真机。 |

工程不要求配置云服务。若只阅读代码、数据和报告，无须启动模拟器。macOS、Linux 与实体设备的构建运行没有纳入本轮验证，以下路径不要直接套用到这些环境。

## 快速体验

先在准备保存项目的父目录克隆仓库，并进入新建的仓库目录；此后的命令均从仓库根目录执行。让 DevEco Studio 打开 **<code>harmony_app</code>** 目录，等待项目同步，确认本机已有可用 SDK 和模拟器。也可从 IDE 的 **Build → Build HAP(s)** 编译。

~~~powershell
git clone https://gitcode.com/harmony-practice-center/HarmonyOS-AtomSer-airport-guide.git
Set-Location HarmonyOS-AtomSer-airport-guide
~~~

命令行构建时，请将下一段的 <code>&lt;DevEco Studio安装目录&gt;</code> 换成本机实际路径，例如 <code>C:\Program Files\Huawei\DevEco Studio</code>。本项目使用 DevEco 随附的 Node、JBR 与 hvigor，避免依赖系统里其它版本。

~~~powershell
$devecoDir = '<DevEco Studio安装目录>'
$env:DEVECO_SDK_HOME = Join-Path $devecoDir 'sdk'
$env:NODE_HOME = Join-Path $devecoDir 'tools\node'
$env:JAVA_HOME = Join-Path $devecoDir 'jbr'
$env:PATH = "$env:JAVA_HOME\bin;$env:NODE_HOME;$env:PATH"

Push-Location 'harmony_app'
& "$env:NODE_HOME\node.exe" (Join-Path $devecoDir 'tools\hvigor\bin\hvigorw.js') assembleHap --no-daemon --mode module -p product=default -p module=entry@default -p buildMode=debug --console=plain
Pop-Location

Get-Item 'harmony_app/entry/build/default/outputs/default/entry-default-unsigned.hap'
~~~

**完成标志：** 构建输出包含 <code>BUILD SUCCESSFUL</code>，且最后一条命令能找到 HAP 文件。本机安装目录或 SDK 不同，应先修正路径与 SDK 配置。既有 [docs/BUILD.md](docs/BUILD.md) 是早期构建补充资料；当前版本的实际命令和验证范围以本页及[产品体验记录](docs/reports/ProductExperience-20261001.md)为准。

模拟器已启动后，用 <code>hdc</code> 列出目标，再填入实际设备 ID。若 <code>hdc</code> 不在 <code>PATH</code>，可使用 DevEco SDK 中的可执行文件：

~~~powershell
$hdc = Join-Path $env:DEVECO_SDK_HOME 'default\openharmony\toolchains\hdc.exe'
& $hdc list targets
$deviceId = '<hdc实际ID>'
& $hdc -t $deviceId install -r 'harmony_app/entry/build/default/outputs/default/entry-default-unsigned.hap'
& $hdc -t $deviceId shell aa start -a EntryAbility -b com.example.airportguide
~~~

**完成标志：** 元服务打开后显示“星海机场”首页，点“去登机口”可进入目的地列表。初次新行程的起点、终点都未选定；请先选 A101，再手动选西出发门，进入路线预览。若使用其它设备 ID 或 IDE 一键运行，也应核对相同页面状态。

## 完整实践

下面是可重复的学习路径，按**目标、操作、完成标志**组织。方框中的自然语言指令可交给 AI 编程工具辅助阅读或改造工程；它们是供学习者使用的示例指令，并非原始开发聊天记录。建议每一步先看当前文件与实际运行结果，再决定是否修改。

### 1. 梳理需求和边界

**目标：** 分清示例导航和真实机场服务的边界。

**操作：** 阅读本页、[产品体验记录](docs/reports/ProductExperience-20261001.md) 和 11 张[手机截图](docs/images/product-20261001/phone/README.md)，列出目的地优先、手动起点、安检、换层、地铁、双语和手动确认等验收情境。可以让 AI 帮你检查遗漏：

~~~text
请阅读本仓库当前 README、产品体验记录和页面源码，归纳星海机场导航元服务的用户流程、验收点及明确不提供的能力。只基于现有材料回答，不把示例地图说成真实机场数据。
~~~

**完成标志：** 能说清“用户如何开始并完成一次行程”，以及为什么不能把此案例用于实时定位或正式机场导航。

### 2. 理解地图数据

**目标：** 追踪节点、边、楼层和中英地点名如何进入应用。

**操作：** 查看 [地图 JSON](data/XHA_xinghai_t1.map.json)、<code>tools/gen_model.py</code> 的 <code>NAME_EN</code>、<code>harmony_app/entry/src/main/ets/model/AirportMap.ets</code> 与 <code>core/Places.ets</code>。尝试运行 <code>py -3 tools/gen_model.py</code>，随后检查生成文件的差异；不打算变更地图时，生成结果应与当前模型一致。

~~~text
请解释地图 JSON 的节点、边、楼层及陆侧/空侧字段怎样进入 AirportMap.ets，并区分可搜索地点与仅供寻路的通道节点。不要改动数据。
~~~

**完成标志：** 能从一个公开地点追踪到它的节点 ID、楼层、名称和邻接边，理解 119 个图节点不等于 119 个可搜索地点。

### 3. 理解规划与路线展示

**目标：** 看懂四种偏好、安检必经和显示距离的关系。

**操作：** 阅读 <code>core/Pathfinder.ets</code> 的 <code>planRoute</code>、<code>core/RouteSteps.ets</code> 和 <code>pages/Route.ets</code>。用西出发门 → A101 和同侧两个登机口对比路线；再尝试地铁跨层路线。

~~~text
请按现有源码说明 planRoute、RouteSteps 和 Route 页面如何配合。分别解释异侧必经中央安检、偏好如何改变选路、步行米数为何只加 walk 边、换层为何单独成为一步。
~~~

**完成标志：** 异侧路线经过中央安检，同侧路线明确无需经过；步行米数与换层次数分别显示，改变偏好后路线回到预览且进度归零。

### 4. 跟踪交互状态和地图

**目标：** 理解行程草稿、正在指引的步骤和地图视口之间的关系。

**操作：** 查看 <code>core/PlannerState.ets</code>、<code>core/Viewport.ets</code>、<code>ui/FloorCanvas.ets</code> 和六个 <code>pages/*.ets</code> 页面。打开“全程步骤”、查看另一段楼层，再返回当前段；编辑起终点后分别尝试取消与确认。

~~~text
请依照 PlannerState 和六个页面说明：新行程、选择目的地、选择起点、开始指引、回退、查看其他路段、取消编辑、确认编辑、交换起终点分别如何改变状态。指出哪些操作会重置步骤进度。
~~~

**完成标志：** 查看地图不改变步骤，取消编辑保留原进度；确认编辑、交换和改偏好重新规划。能在画布上分辨当前步骤与整条路线。

### 5. 编译并运行

**目标：** 得到可在模拟器操作的 HAP。

**操作：** 按[快速体验](#快速体验)构建、安装和启动。运行后检查六页入口、按钮与地图点击；切换中英文并重启，观察语言保存情况。

**完成标志：** <code>BUILD SUCCESSFUL</code>、HAP 存在、模拟器能打开首页且点位可选。构建通过只说明产物生成；仍需页面操作验证。

### 6. 做业务与自动化验收

**目标：** 同时检查图算法和用户可见流程。

**操作：** 从仓库根目录运行以下命令，再按[验收与排障](#验收与排障)的表逐项操作。<code>tools/verify_product.mjs</code> 当前在 <code>tsFile</code> 常量中写有本机 DevEco TypeScript 文件绝对路径；换到新机器时，先按本机 SDK 安装路径修改**该脚本中的常量**，再执行测试。此路径限制不影响构建 App 本身。

~~~powershell
$env:PYTHONUTF8 = '1'
py -3 tools/pathfind_reference.py
node tools/verify_product.mjs
~~~

**完成标志：** Python 参考实现完成 500 组配对检查，ETS 核心回归 6/6 套件通过；模拟器上可完成从预览到逐步抵达的一整趟行程。若 <code>node</code> 不在 <code>PATH</code>，可使用前述 <code>$env:NODE_HOME\node.exe</code>。

### 7. 做一处独立改造

**目标：** 用一个小改动证明理解数据和交互，而不破坏原有路线。

**操作：** 可在示例图中增加一处本地设施：给地图 JSON 添加节点、连接边，并在 <code>tools/gen_model.py</code> 的 <code>NAME_EN</code> 补充英文名称，再运行 <code>py -3 tools/gen_model.py</code> 生成模型。检查该设施能在地图与搜索中出现，并运行原有回归；不要运行会重建原始示例图的 <code>gen_maps.py</code> 覆盖自定义数据。另一种选择是调整某个地图标注和避让规则。请先选择适合当前知识水平的一种方案，修改前保存可对比的 Git 状态。

~~~text
我想在这个本地机场示例里增加一处设施。请先定位数据 schema、可搜索地点过滤、中英名称和模型生成入口，给出最小修改及验证步骤；实现后验证新增地点可选，并检查原有路线与安检规则没有回归。
~~~

**完成标志：** 新增或调整的点位在模拟器可见且可用，原有起终点、安检和地铁流程仍通过。不要求手写全部代码，也不保证 AI 可以零修改一次完成。

## 验收与排障

| 场景 | 操作 | 可观察的完成标志 |
| --- | --- | --- |
| 新行程 | 打开首页，进入“去登机口” | 起终点尚未指定；先选目的地，再选手动出发位置。 |
| 安检路线 | 选 A101 → 西出发门 | 预览出现中央安检提示；开始后可见当前与下一步，手动逐项确认。 |
| 同侧路线 | 在同一侧选两处地点 | 预览说明无需经过中央安检，不额外绕行。 |
| 跨层与偏好 | 从 4F 规划到 B2 市区方向站台，选“优先电梯” | 预览列出换层；指引在换层处要求手动确认，步行米数不加垂直边。 |
| 状态回退 | 指引时查看另一楼层、打开全程步骤、上一步 | 查看动作不推进进度；上一步回退。更改偏好或确认编辑后从预览重来。 |
| 编辑与交换 | 编辑起点后取消，再重新编辑确认；交换起终点 | 取消保留原路线及进度；确认或交换重新规划并重置步骤。 |
| 双语与最近 | 切换 English、完成目的地选择后重启 | 中英文文案和地点名切换；语言与最多 6 个最近目的地仍在，本次指引进度不承诺重启保留。 |
| 六层地图 | 首页依次进入 4F、3F、2F、1F、B1、B2 | 能浏览全层、缩放和点击可用地点，点选可参与规划。 |

截至 **2026-10-01**，实际证据为：Python 参考实现 **500 组**起终点配对；ETS 回归 **6/6 套件、2,000 条路线**（500 组 × 4 种偏好）；API 24 中文状态 **21 项**、六层与地图 **14 项**、英文地铁两方向 **6 项**；API 26 手机及宽屏中英文核心流程通过，API 24 手机、宽屏和折叠/展开适配也有截图及流程记录。详情及证据边界见[体验记录](docs/reports/ProductExperience-20261001.md)和[机器可读结果](docs/reports/ProductExperience-20261001.json)。其中 API 23 与真机**未验证**，模拟器通过不等于正式发布验收。

| 现象 | 先检查 | 处理方向 |
| --- | --- | --- |
| 找不到 SDK、Node、Java 或 hvigor | <code>$devecoDir</code> 是否为真实 DevEco 安装目录；SDK 是否已安装 | 修正路径，检查 <code>DEVECO_SDK_HOME</code>、<code>NODE_HOME</code>、<code>JAVA_HOME</code>，重新运行构建。 |
| 构建成功但未找到 HAP | 是否在仓库根目录执行；命令是否含 <code>product=default</code>、<code>module=entry@default</code>、<code>buildMode=debug</code> | 查看 <code>harmony_app/entry/build/default/outputs/default/</code>；以实际构建日志为准。 |
| <code>hdc</code> 无目标或安装失败 | 模拟器是否已经启动、<code>$deviceId</code> 是否来自当前 <code>list targets</code> | 重列设备 ID；确认是在可接受未签名 HAP 的模拟器上验收。真机需签名配置。 |
| 页面打开但路线为空 | 是否已依次选目的地与起点；两点是否相同 | 重选两个不同的公开地点，再查看路线预览。 |
| <code>verify_product.mjs</code> 找不到 TypeScript | <code>tools/verify_product.mjs</code> 顶部 <code>tsFile</code> 是开发机绝对路径 | 在脚本中改成当前 DevEco SDK 下的 <code>typescript.js</code> 路径，再运行；不要把本机路径当成项目通用配置。 |
| 截图或搜索与本页不一致 | 模拟器 API、窗口宽度、语言与字号 | 以 11 张[系统原始截图](docs/images/product-20261001/phone/README.md)和体验记录的条件对照；示例数据及 UI 可能随版本变化。 |

## 项目导览与进阶

~~~text
data/XHA_xinghai_t1.map.json                 六层图数据，节点、边与示例地点
tools/gen_model.py                            将地图生成类型化 ArkTS 模型
tools/pathfind_reference.py                   Python 寻路参考检查
tools/verify_product.mjs                      ETS 逻辑回归
tools/smoke_emulator.py、verify_flows.py       模拟器核心与扩展流程
harmony_app/AppScope/app.json5                 包名、atomicService、版本
harmony_app/entry/src/main/ets/
  entryability/EntryAbility.ets               应用入口
  pages/                                      六页 Navigation 体验
  core/                                       Pathfinder、PlannerState、RouteSteps、Viewport 等
  model/                                      AirportMap、Loc、Localization、Categories
  ui/                                         FloorCanvas、Common、Theme、PlacePicker
docs/reports/ProductExperience-20261001.*     本轮体验证据与验证范围
docs/images/product-20261001/phone/           11 张原始手机截图与说明
cases/                                        既有案例导入材料
~~~

学习时建议沿“<code>data</code> → <code>gen_model.py</code> → <code>model/AirportMap.ets</code> → <code>core/Pathfinder.ets</code> / <code>RouteSteps.ets</code> → <code>pages/Route.ets</code> → <code>ui/FloorCanvas.ets</code>”阅读，再回到 <code>PlannerState.ets</code> 理解编辑和指引状态。[初版需求文档](docs/需求文档.md)、[初版开发文档](docs/开发文档.md)记录了初版设计与开发过程，其中视觉和距离口径可能与 2026-10-01 体验版不同；判断当前行为请以源码和本轮体验记录为准。<code>cases/</code> 是仓库已有的导入材料，这次 README 刷新不代表本版本已经在平台发布。

可以继续探索真实定位接入、授权机场数据导入、可访问性、更多语言和发布签名。每一项都超出当前示例的验证范围，实施前应重新设计数据更新与现场验收。若要复拍介绍素材，可参考 <code>tools/capture_product_screens.py</code>；脚本目前固定目标 <code>127.0.0.1:5555</code> 和 1320 × 2848 分辨率校验，换设备须调整其目标与检查条件。

## 参考与维护

| 项目 | 当前信息 |
| --- | --- |
| 案例归属 | 鸿蒙开发实践中心 |
| 维护团队 | 鸿蒙实践案例开发团队（见 [LICENSE](LICENSE)） |
| 应用版本 | <code>1.0.0</code>，以 <code>harmony_app/AppScope/app.json5</code> 为准 |
| 案例说明版本 | 2026-10-01 体验版；这是文档标识，**不是 Git tag** |
| 反馈 | 请在 [GitCode 仓库](https://gitcode.com/harmony-practice-center/HarmonyOS-AtomSer-airport-guide)的 Issues 入口提交可复现问题；请附环境、操作步骤和预期/实际结果。 |
| 许可证 | 仓库 [LICENSE](LICENSE) 为 MIT；引用外部素材或依赖时仍需遵循各自许可。 |

参考资料：[HarmonyOS 开发文档](https://developer.huawei.com/consumer/cn/harmonyos)、[元服务入门](https://developer.huawei.com/consumer/cn/fa/get-started/)、[DevEco Studio](https://developer.huawei.com/consumer/cn/deveco-studio/)。这些链接用于继续学习；工程的可复现状态、版本和测试范围以仓库源码与[2026-10-01 体验记录](docs/reports/ProductExperience-20261001.md)为准。
