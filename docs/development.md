# 开发方式与回归清单（development.md）

> 图片编号 07 · 开发方式、命令和回归清单

本文档面向"进入本项目做开发的 AI Agent"：先按 §1 确认工具链是否齐备，再按 §2 判断该改哪个目录，然后从 §3 的命令表里取命令、按 §4 的数据链路改数据、按 §6 的清单做回归。文中每条命令、每个参数都由脚本的 `argparse` / `main()` 与 `docs/BUILD.md` 逐条核对而来；凡是仓库里无法证实的内容一律标注「待确认」。

---

## 1. 环境要求

### 1.1 工具链总表

| 组件 | 版本要求 | 依据 | 用途 |
|---|---|---|---|
| DevEco Studio | 6.x（内置 hvigor 6 / Node / ohpm / hdc / JBR） | `docs/BUILD.md:48` | 编辑、编译、调试、模拟器 |
| HarmonyOS SDK | API ≥ 23；本机建议 API 24/25/26 任一 | `docs/BUILD.md:49` | 编译（compile）与运行（compatible） |
| `compileSdkVersion` | **工程未写死**，取本机 SDK 默认版本 | `harmony_app/build-profile.json5`（`products.default` 无该字段）、`docs/BUILD.md:61` | 同一份代码可在 API 24/26 本机编译 |
| `compatibleSdkVersion` / `targetSdkVersion` | `6.1.0(23)`，`runtimeOS: HarmonyOS` | `harmony_app/build-profile.json5:9-11` | 产物可运行在 API 23+ 设备 |
| hvigor / oh-package modelVersion | `6.0.0` | `harmony_app/hvigor/hvigor-config.json5`、`harmony_app/oh-package.json5` | 构建工具与依赖模型版本 |
| JDK | DevEco 自带 JBR | `docs/BUILD.md:99` | hvigor 构建 |
| Node.js | **仓库无版本约束**：`hvigor/hvigor-config.json5` 只有 `modelVersion` + 空 `dependencies`，`oh-package.json5` 无 `engines`，仓库内无 `.nvmrc` / `package.json` / `requirements*.txt`。构建用 DevEco 自带 Node（`docs/BUILD.md:98`）。唯一硬约束来自 `tools/verify_product.mjs`：用了 `import.meta.dirname`（Node **≥ 20.11**） | `harmony_app/hvigor/hvigor-config.json5`、`tools/verify_product.mjs:7` | 跑 `hvigorw.js` 与 `verify_product.mjs` |
| Python | 3.8+ | `docs/BUILD.md:51` | 仅 `tools/` 数据管道与校验脚本需要 |
| `hdc` | SDK 内置 | `docs/BUILD.md:50` | 设备连接、安装、UI 自动化 |
| ohpm | DevEco 自带，**本项目不需要** | `oh-package.json5` 的 `dependencies` 为空（根、entry、hvigor 三处皆空） | 无需 `ohpm install` |

> ⚠️ 本机（macOS）实测：`which hdc` 无输出 → **当前环境 `hdc` 不在 PATH**，设备类脚本（§3 编号 8–10）无法直接运行，需先按 `docs/BUILD.md:101-111` 把 `<SDK>/default/openharmony/toolchains` 加进 `PATH`。

### 1.2 Python 依赖（逐个脚本核对 `import`）

**纯标准库，零安装**（只用到 `argparse/json/math/os/random/re/struct/subprocess/sys/time/zlib`、`pathlib`、`typing`、`__future__`）：

| 脚本 | 实际 import |
|---|---|
| `tools/gen_maps.py` | `json, math, os` |
| `tools/gen_model.py` | `json, os` |
| `tools/gen_checker.py` | `json, os` |
| `tools/gen_icons.py` | `math, os, struct, zlib` |
| `tools/preview_nodes.py` | `json, math, os, sys` |
| `tools/pathfind_reference.py` | `json, random, os` |
| `tools/smoke_emulator.py` | `argparse, json, os, re, subprocess, sys, time, pathlib, typing, __future__` |
| `tools/verify_flows.py` | 同上 + 本地 `from smoke_emulator import ...`（脚本自身把 `tools/` 插入 `sys.path`，见 `tools/verify_flows.py:18-21`） |

**需要 pip 安装的第三方包：只有 1 个 —— `Pillow`（`PIL`）**：

| 脚本 | 实际 import | 说明 |
|---|---|---|
| `tools/gen_brand_assets.py` | `from PIL import Image, ImageDraw`（`gen_brand_assets.py:3`） | 画 512×512 品牌图标 |
| `tools/capture_product_screens.py` | `from PIL import Image`（`capture_product_screens.py:9`） | 校验截图格式与分辨率 |
| `tools/verify_flows.py` / `tools/smoke_emulator.py` | **不使用 PIL**（只做布局树解析与 `hdc` 调用） | — |

```bash
python3 -m pip install Pillow        # 版本下限 Pillow ≥ 9.1（用到 Image.Resampling.LANCZOS）
```

- 仓库内**没有 `requirements.txt` / `pyproject.toml`**（已用 `glob`/`find` 确认），依赖只能从上面的 import 反推。
- 本机实测：`python3 -c "import PIL"` → `ModuleNotFoundError`，因此 `gen_brand_assets.py` 当前**跑不起来**（见 §9）。
- `docs/BUILD.md:51` 写「Python 3.8+，系统自带即可」，**未提 Pillow** —— 这是 BUILD.md 的缺口，不是本工作区新增内容的偏差。

### 1.3 环境变量与 SDK 路径

构建前必须让 `DEVECO_SDK_HOME` / `NODE_HOME` / `JAVA_HOME` 三个变量有效（`docs/BUILD.md:95-99`）：

```bash
# macOS 示例（路径以本机 SDK Manager 显示的 OHOS SDK Location 为准）
export DEVECO_SDK_HOME="/Applications/DevEco-Studio.app/Contents/sdk"
export NODE_HOME="/Applications/DevEco-Studio.app/Contents/tools/node"
export JAVA_HOME="/Applications/DevEco-Studio.app/Contents/jbr/Contents/Home"
export PATH="$JAVA_HOME/bin:$NODE_HOME/bin:$DEVECO_SDK_HOME/default/openharmony/toolchains:/Applications/DevEco-Studio.app/Contents/tools/ohpm/bin:/Applications/DevEco-Studio.app/Contents/tools/hvigor/bin:$PATH"

# 核对本机 SDK 版本
cat "$DEVECO_SDK_HOME/default/openharmony/ets/oh-uni-package.json" | grep apiVersion
```

`harmony_app/local.properties`（含 `sdk.dir=`，已 gitignore）不入库，缺失时用 DevEco Studio 打开一次 `harmony_app` 会自动补齐（`docs/BUILD.md:75-85`）。

**本仓库不含 `hvigorw` 包装脚本**（已 `find` 确认无任何 `hvigorw*` 文件），`hvigorw` 必须来自 DevEco 工具链（`docs/BUILD.md:53`）。

---

## 2. 目录导航：改什么去哪个目录

| 顶层目录 | 职责 | 你要改什么就来这里 | 可否手改 |
|---|---|---|---|
| `harmony_app/` | HarmonyOS 工程本体（单 `entry` 模块，`apiType: stageMode`） | ArkTS 逻辑/UI、资源、`app.json5`、`build-profile.json5` | 除下一条外可改 |
| `harmony_app/entry/src/main/ets/model/AirportMap.ets` | **生成物**（2139 行）：`XHA_NODES` / `XHA_EDGES` / `SECURITY_ID` / `FLOOR_ORDER` / `FLOOR_LABELS(_EN)` / `FLOOR_BBOX` / `NODE_EN` | ❌ **禁止手改**，改 `tools/gen_maps.py` 的 `XHA` spec 后重跑生成器 | ❌ |
| `data/` | 地图数据。`XHA_xinghai_t1.map.json` 是 **`gen_maps.py` 的产物**（119 节点 / 145 边 / 6 层）；`README.md` 是图数据规范（只读交付物） | ⚠️ 手改 JSON 会被下次 `gen_maps.py` 覆盖 → 真源在 `tools/gen_maps.py` | ⚠️ 见 §4 |
| `docs/` | 文档与证据。`BUILD.md` / `需求文档.md` / `开发文档.md` / `reports/**` / `images/**` 是**只读交付物** | 本工作区新增文档写 `docs/*.md`；不要把截图/报告改掉 | 部分 |
| `tools/` | 数据生成、Python 参照寻路、离线回归、设备 UI 校验、素材脚本、浏览器校准器 | 数据管道（`gen_maps.py` / `gen_model.py`）、校验脚本 | ✅ |
| `cases/` | 案例交付包：`case.json`、`practice.html`、`cover.png`/`card.png`/`share.png`/`preview-phone.png`/`arch-diagram.svg` | ❌ 交付物，**仓库内无任何脚本生成它们**（§7） | ❌ |

工程内部再往下分四层（`harmony_app/entry/src/main/ets/`）：

| 子目录 | 文件 | 改这里的典型场景 |
|---|---|---|
| `model/` | `AirportMap.ets`（生成）、`Localization.ets`、`Categories.ets`、`Loc.ets` | 中英节点名、分类、双语文案键 |
| `core/` | `Pathfinder.ets`、`RouteSteps.ets`、`PlannerState.ets`、`Places.ets`、`Viewport.ets`、`LocalStore.ets`、`Router.ets` | 寻路权重/偏好、步骤拆解、行程状态机、搜索索引、视口、本地存储、路由常量 |
| `ui/` | `Theme.ets`、`Common.ets`、`FloorCanvas.ets`、`PlacePicker.ets` | 色板字号、通用组件、Canvas 绘制与命中、搜索选择器 |
| `pages/` | `Index.ets`（Navigation 宿主）+ `SelectTarget` / `SelectStart` / `Route` / `MetroGuide` / `FloorBrowse` | 页面结构与交互 |

---

## 3. 常用命令

> 所有命令都在**仓库根目录**执行（脚本内部用 `__file__` 推导路径，除 `hvigorw` 需 `cd harmony_app`）。「用时」为本机（macOS / Python 3.14.7 / Node v25.9.0）实测；设备类脚本无设备，用时标「待实测」。

### 3.1 数据生成与离线校验（无需设备）

| # | 命令 | 作用 | 前置条件 | 产物 | 用时 / 幂等性 |
|---|---|---|---|---|---|
| 1 | `python3 tools/gen_maps.py` | 由脚本内 `XHA` spec 编译出地图 JSON | 无（纯标准库） | **覆盖写** `data/XHA_xinghai_t1.map.json` | 实测 **0.02s**；确定性（同 spec 连跑两次 md5 相同 `2a9fe67c…`）；会**冲掉**手改的 JSON |
| 2 | `python3 tools/gen_model.py` | map JSON → ArkTS 类型化模型 | `data/XHA_xinghai_t1.map.json` 存在；内部 `assert len(secs) == 1`（安检唯一）、`assert air_c > 0`（空侧非空） | **覆盖写** `harmony_app/entry/src/main/ets/model/AirportMap.ets` | 实测 **0.02s**；幂等（在临时副本重跑，与当前提交**逐字节一致**，`diff` 为空） |
| 3 | `python3 tools/preview_nodes.py [map.json ...]` | 渲染各层节点图 SVG | 无 | `preview/XHA.{4F,3F,2F,1F,B1,B2}.nodes.svg` + `XHA.overview.svg` + `index.html`（共 8 个文件） | 实测 **0.03s**；`preview/` 被 `.gitignore` 忽略。**不传参**＝渲染 `data/*.json` 并重建 `index.html`；**传参**＝只渲染指定 JSON 且**不**重写 `index.html`（`tools/preview_nodes.py:298`） |
| 4 | `python3 tools/gen_checker.py` | 把 `data/*.map.json` 注入 `tools/checker.html` | **当前会失败**：`checker.html` 里的占位符 `/*__AIRPORTS_JSON__*/` 已被上一次注入消耗（连提交版本也没有该 token） | 就地改写 `tools/checker.html` | 实测 `AssertionError: checker.html 缺失注入占位符`，exit 1。修复见 §9 |
| 5 | `python3 tools/gen_icons.py` | 纯标准库（`struct`+`zlib`）画图标 | 无 | **覆盖** `AppScope/.../app_icon.png`(216×216)、`entry/.../icon.png`(108×108)、`entry/.../startIcon.png`(216×216) | 实测 OK。⚠️ 与 #6 写**同一组 3 个文件**，会把 512×512 降级成 216/108 |
| 6 | `python3 tools/gen_brand_assets.py` | Pillow 画 512×512 品牌图标 | `pip install Pillow` | **覆盖**与 #5 相同的 3 个文件（512×512） | 本机缺 Pillow → `ModuleNotFoundError`，exit 1。当前提交的 3 个 PNG **均为 512×512**，即本脚本产物 |
| 7 | `python3 tools/pathfind_reference.py` | 寻路参考实现：500 组随机起终点 + 6 条样例路线，断言「异侧必经安检」等 5 项 | 无（无任何参数） | 仅 stdout（不写文件） | 实测 **0.34s**，exit 0。输出 `A reachable 500 / B cross==full 270 / C same no-sec 230 / D legs/trans 500 / E edges 500` |
| 8 | `node tools/verify_product.mjs` | ArkTS 核心逻辑离线回归（6 套件；2000 条路线；RouteSteps / PlannerState / 搜索 / Viewport / `Loc` 键对称） | 需要 **DevEco SDK 内的 `typescript.js`**；该路径在源码里**硬编码为 Windows 路径** | 仅 stdout（成功时 `PASS 6/6 suites; …`） | 本机实测 **exit 1**：`ERR_MODULE_NOT_FOUND .../C:/Program Files/Huawei/DevEco Studio/...`（`tools/verify_product.mjs:9`）。见 §9 |

### 3.2 设备相关（需要 `hdc` + 已启动的模拟器/真机）

| # | 命令 | 作用 | 前置条件 | 产物 | 备注 |
|---|---|---|---|---|---|
| 9 | `python3 tools/smoke_emulator.py --target <hdcId> --out <dir> [--language zh\|en]` | 核心 UI 冒烟：首页/语言 → A101 分类选点 → 西出发门 → 路线预览（含中央安检）→ 开始指引 → 步骤计数 → 逐项确认至完成 | `hdc` 在 PATH；目标设备已启动；**HAP 已安装**（脚本自行 `aa force-stop` + `aa start`，不安装 HAP、不启动模拟器） | `<dir>/` 下布局 JSON、JPEG 截图、stdout `PASS：…`；失败写 `FAIL_<stage>.json` + 截图 | 参数全部来自 `smoke_emulator.py:376-381`：`--target` 必填、`--out` 必填、`--language` 可选默认 `zh`；bundle `com.example.airportguide` / ability `EntryAbility`（`smoke_emulator.py:21-22`）；等待超时 25s（`:24`）。用时待实测 |
| 10 | `python3 tools/verify_flows.py --target <hdcId> --out <dir> [--language zh\|en] [--map-only \| --state-only \| --metro-only]` | 扩展 UI 流程：六层滚动/地图选点（14 项）、跨层指引与行程状态（21 项）、地铁两方向（6 项） | 同 #9 | `<dir>/verify_flows_report.json`（`full`）或 `verify_flows_{map,state,metro}_report.json` + 截图/布局 JSON | 参数来自 `verify_flows.py:483-492`；三个 `--*-only` 为**互斥组**，全不传＝`full`；`--language` 默认 `zh`。用时待实测 |
| 11 | `python3 tools/capture_product_screens.py` | 采集 11 张中文产品截图（逐场景断言后 `snapshot_display`） | `hdc` + Pillow + 设备**必须是 `127.0.0.1:5555`** + 分辨率**必须 1320×2848** | 写 `docs/images/product-20261001/phone/*.jpeg`，布局落在 `.temp/product-20261001/capture-layouts/` | **无任何命令行参数**（`TARGET`/`OUT` 写死在 `capture_product_screens.py:15-16`）；`main()` 不接受 argv。⚠️ 它**会改写只读交付目录** `docs/images/**` |
| 12 | `hdc list targets` / `hdc -t <t> install -r <hap>` / `hdc shell aa start -a EntryAbility -b com.example.airportguide` / `hdc hilog` | 设备确认、安装、启动、日志 | `hdc` 在 PATH | — | 见 `docs/BUILD.md:193-202`、`:245-254` |

### 3.3 构建与打包

```bash
# macOS / Linux：一条命令（开发文档 §9 记载 2026-09-15 在本机实测通过）
export DEVECO_SDK_HOME="/Applications/DevEco-Studio.app/Contents/sdk"
export NODE_HOME="/Applications/DevEco-Studio.app/Contents/tools/node"
export JAVA_HOME="/Applications/DevEco-Studio.app/Contents/jbr/Contents/Home"
export PATH="$JAVA_HOME/bin:$NODE_HOME/bin:$DEVECO_SDK_HOME/default/openharmony/toolchains:/Applications/DevEco-Studio.app/Contents/tools/ohpm/bin:/Applications/DevEco-Studio.app/Contents/tools/hvigor/bin:$PATH"

cd harmony_app
hvigorw --no-daemon --mode module -p product=default -p module=entry@default assembleHap --console=plain
```

```bash
# 若 hvigorw 不在 PATH（等价写法，docs/BUILD.md:129 与 开发文档.md §9 均给出）
node /Applications/DevEco-Studio.app/Contents/tools/hvigor/bin/hvigorw.js \
  --no-daemon --mode module -p product=default -p module=entry@default assembleHap --console=plain
```

| 命令 | 作用 | 前置条件 | 产物 | 备注 |
|---|---|---|---|---|
| 上面的 `hvigorw … assembleHap` | 编译 + 打包 HAP | `DEVECO_SDK_HOME` / `NODE_HOME` / `JAVA_HOME` / `PATH` 已配置；`harmony_app/local.properties` 有正确 `sdk.dir` | `harmony_app/entry/build/default/outputs/default/entry-default-unsigned.hap` | 未签名产物，供模拟器/调试真机；增量构建只需重跑同一条命令（`docs/BUILD.md:166`） |
| DevEco Studio **Build → Build HAP(s)** | 同上（IDE 路径） | 已打开 `harmony_app` 目录 | 同上 | 也可直接点 ▶️ 完成编译+安装+启动 |
| `ls -lh harmony_app/entry/build/default/outputs/default/entry-default-unsigned.hap` | 验证产物 | — | — | 文件时间＝本次构建时间即成功 |

> **产物大小基准**：`docs/reports/ProductExperience-20261001.md` 记录上一轮成功构建为 **751,682 字节**，SHA-256 `214963FB…37AD18`（Windows / API 26 编译）。本机 macOS 未重新构建，故不给出新数值。

### 3.4 文档与脚本的不一致（务必以脚本为准）

| 位置 | 文档写的 | 核对结果 | 结论 |
|---|---|---|---|
| `docs/BUILD.md:294-300`（§6.2 数据同步） | 代码块顺序为 `gen_model.py` → `gen_maps.py` → `preview_nodes.py` | `gen_maps.py:main()` **覆盖写** `data/XHA_xinghai_t1.map.json`；`gen_model.py` 读该 JSON | **顺序错了**。正确顺序是 `gen_maps.py` → `gen_model.py` → `preview_nodes.py`（`AGENTS.md` §6 已按正确顺序写） |
| `docs/BUILD.md:335-354`（§7 行数） | `MetroGuide.ets` 174 行、`SelectStart.ets` 192 行、`Index.ets` 253 行、`FloorCanvas.ets` 473 行、`SelectTarget.ets` 349 行 | 实测分别为 **53 / 19 / 134 / 243 / 19** 行（全工程 22 个 `.ets` 共 **4008** 行） | BUILD.md 行数为早期版本，**已过时** |
| `docs/BUILD.md:367-377`（§7 工具清单） | 只列了 `gen_model` / `gen_maps` / `preview_nodes` / `pathfind_reference` / `gen_icons` / `checker.html`+`gen_checker.py` | `tools/` 实有 13 个文件，未列 `verify_flows.py`、`smoke_emulator.py`、`verify_product.mjs`、`capture_product_screens.py`、`gen_brand_assets.py`、`checker_app.js` | BUILD.md 工具清单**不完整** |
| `docs/BUILD.md:51` | 「Python 3.8+，系统自带即可」 | `gen_brand_assets.py` / `capture_product_screens.py` 依赖第三方 `Pillow` | BUILD.md 未声明 pip 依赖 |
| `data/README.md:54` | 「改 JSON 后重跑 `python3 tools/gen_maps.py && python3 tools/preview_nodes.py`」 | 只改 JSON 再跑 `gen_maps.py` 会**把手改内容覆盖掉**；且漏了 `gen_model.py` | 真源是 `tools/gen_maps.py` 的 spec |
| `data/README.md:45` | 节点类型含 `apm_station` | 实际 `data/*.map.json` 的 `nodeTypes` **不含** `apm_station`（只有 `preview_nodes.py` 色板里保留） | 文档列举了数据中不存在的类型 |
| `data/README.md:23` | `meta.floors` 示例只列 `4F/3F/B1/B2` | 实际为 `4F/3F/2F/1F/B1/B2` 六层 | 示例不全 |
| `data/README.md:60` | 「按这两份坐标手工绘制各层示意背景图，作为 Canvas 里 `drawImage` 的底图」（列为"下一步"） | `grep -rn "drawImage" harmony_app/entry/src/main/ets/` **无任何命中** → `FloorCanvas.ets` 走的是程序化绘制示意背景 | 该"下一步"与当前实现不符 |
| `README.md:93,187,253-256,288-291,557`、`cases/case.json:19`、`cases/practice.html:13,56,104-146,356` | 仓库地址 `HarmonyOS-AtomSer-airport-guide.git` | 本工作区 remote `upstream` 与任务给定地址均为 `HarmonyOS-METASERVICE-airport-guide.git` | **地址不一致**，以 `upstream` 为准 |

---

## 4. 数据改动工作流

### 4.1 唯一事实源与正确顺序

```
tools/gen_maps.py（XHA spec：节点表 + 边表 + floor_labels）
        │  python3 tools/gen_maps.py          ← 真源，覆盖写 JSON
        ▼
data/XHA_xinghai_t1.map.json   (119 节点 / 145 边 / 6 层)
        │  python3 tools/gen_model.py         ← 类型化 + 两侧判定 + 英译
        ▼
harmony_app/entry/src/main/ets/model/AirportMap.ets   ← 生成物，禁止手改
        │  （可选）python3 tools/preview_nodes.py     ← 人眼看图核对
        ▼
preview/*.svg（.gitignore 忽略）
```

```bash
# 改一个地点 / 一条边的标准五步
$EDITOR tools/gen_maps.py                  # 1) 只改真源
python3 tools/gen_maps.py                  # 2) spec → map JSON
python3 tools/gen_model.py                 # 3) JSON → AirportMap.ets（含 assert 校验）
python3 tools/preview_nodes.py             # 4) 出图肉眼核对坐标与连线
python3 tools/pathfind_reference.py        # 5) 寻路仍自洽（500 组 + 样例）
git status --short                         # 6) 预期只改到 data/ 与 AirportMap.ets
```

**硬规则**：

1. **`AirportMap.ets` 是生成物，禁止手改。** 文件头自带「自动生成，请勿手改」（`AirportMap.ets:1-6`）；改它下次跑生成器就丢。
2. **不要直接手改 `data/XHA_xinghai_t1.map.json`。** `gen_maps.py:main()` 用 `json.dump` **覆盖写**该文件，手改会被冲掉。要改数据只能改 `tools/gen_maps.py` 里的 `XHA` spec。
3. **安检节点必须恰好一个**（当前 `xha_p4_sec`）。`gen_model.py` 用 `assert len(secs) == 1` 硬校验；它是陆侧↔空侧的**割点**，"异侧必经安检"的寻路等价性完全依赖它。
4. **新增节点/边要过两道内建校验**（都在 `gen_maps.py:build_map()`）：节点 `id` 唯一（`assert len(ids) == len(nodes_list)`）、边引用的节点必须存在；边会被去重。
5. **新增节点中文名要补 `gen_model.py` 的 `NAME_EN`**，否则生成时打印 `⚠ 缺英译名称: [...]`，英文界面会回退中文（`NODE_EN` 兜底）。

### 4.2 生成物与源数据漂移的检测

| 方法 | 适用 | 判据 | 实测结果 |
|---|---|---|---|
| **A. 重跑 + `git diff`（推荐）** | 日常 | `git diff --stat -- harmony_app/entry/src/main/ets/model/AirportMap.ets data/XHA_xinghai_t1.map.json` 无输出 ⇒ 未漂移 | 已用临时副本重跑 `gen_model.py`，与当前提交**逐字节一致**；重跑 `gen_maps.py` 后 JSON md5 与提交版本相同（`2a9fe67c…`）⇒ **当前仓库不漂移** |
| **B. 看生成物自带头部** | 快速人工核对 | `AirportMap.ets:5` 写着「119 节点 / 145 边 / 楼层 ['4F','3F','2F','1F','B1','B2']」，与 `data/*.map.json` 实际计数比对 | 当前一致 |
| **C. 用消费方脚本当探测器** | 改完图数据后 | `tools/verify_flows.py` 在设备测试**之前**会同时读 `MAP_DATA`(JSON) 与 `MAP_MODEL`(`.ets`)，解析 `FLOOR_BBOX.set(...)` / `NODE_EN.set(...)`；任一楼层边界缺失即 `SmokeFailure("机场地图源数据或楼层边界读取失败")`（`verify_flows.py:89-104`） | 需设备，未实测 |
| **D. 跑生成器直接看报错** | 数据本身非法 | `gen_model.py` 的 `assert` / `gen_maps.py` 的 `assert` 会以 `AssertionError` 中止，且**不会**写出半成品（写文件在所有 assert 之后） | 已验证代码顺序 |

> 漂移的典型成因：只跑了 `gen_maps.py` 没跑 `gen_model.py`（App 仍用旧图，界面不报错但行为与数据不符）；或手改了 `AirportMap.ets`；或手改了 JSON 又被 `gen_maps.py` 冲掉。**A 方法在每次数据改动后都要跑一次。**

---

## 5. 开发规约

### 5.1 ArkTS / 严格模式代码约定（从现有代码与 `docs/开发文档.md §9` 归纳）

本 SDK 是 hvigor 6 + ArkTS 严格模式，且 `build-profile.json5` 开了 `strictMode: { caseSensitiveCheck: true, useNormalizedOHMUrl: true }`。以下是**真实踩过并已整改**的坑：

| # | 规则 | 反例 → 正解 | 代码证据 |
|---|---|---|---|
| 1 | **禁用无类型对象字面量 / `Record` 字面量** → 键值字典用 `Map` + `.set()`，元数据用显式 `interface` 注解 | `const m: Record<string, number> = { a: 1 }` ❌ → `new Map<string, number>().set('a', 1)` ✅ | `core/Pathfinder.ets:2` 注释「ArkTS 禁用 Record 对象字面量 -> 垂直权重/偏好用 Map」；`Pathfinder.ets:20-23`、`ui/Theme.ets:5`、`model/AirportMap.ets:34`（`XHA_META: XhaMeta = {...}` 显式接口） |
| 2 | **闭包捕获可变变量会丢失类型收窄** → 进闭包前用 `const` 冻结 | Dijkstra 里 `u` 是 `string \| null` 时进 `forEach` ❌ → `const cur = u;` ✅ | `core/Pathfinder.ets:124-125`：「闭包捕获变量会丢失类型收窄 -> 冻结当前源点为 const 再进 forEach」 |
| 3 | **`Row` 的对齐是 `VerticalAlign`**，不是 `HorizontalAlign` | `Row().alignItems(HorizontalAlign.Center)` ❌ | `docs/开发文档.md §9`「`HorizontalAlign on Row`（3 处）」 |
| 4 | **`@Builder` 体内禁止声明局部变量** → 拆成普通私有方法 | `@Builder x() { const n = 1; ... }` ❌ | `docs/开发文档.md §9`「`@Builder 体内局部变量`（4 处）：`const n/tr` 拆成普通私有方法」 |
| 5 | **`Gesture` / `GestureGroup` 在本 SDK 是工厂值、无类型名** → 去掉返回类型注解，靠调用推断 | 给辅助方法标注 `Gesture` 返回类型 ❌ | `docs/开发文档.md §9`「`Cannot find 'Gesture'`（FloorCanvas）」 |
| 6 | 避免新版 SDK 独有 API（如 `Circle().fill()`）在旧兼容层打 WARN | 用圆角 `Row` 画色点 | `docs/开发文档.md §9` 第 6 条 |
| 7 | **导入路径不带扩展名**，用相对路径 | `import { Loc } from '../model/Loc.ets'` ❌ → `'../model/Loc'` ✅ | 全部 22 个 `.ets` 的 import 皆如此，例如 `ui/FloorCanvas.ets:2-8` |
| 8 | 只用 `@kit.*` 聚合包导入系统能力 | `import { window } from '@kit.ArkUI'` | `entryability/EntryAbility.ets:1-3`、`ui/FloorCanvas.ets:1`。仓库内**没有** `@ohos.*` 形式 |
| 9 | 状态不可变：状态机返回新对象，绝不就地改字段 | `PlannerState` 的转移函数 + `revision` | `core/PlannerState.ets`；`node tools/verify_product.mjs` 有「transitions and immutability」断言 |

### 5.2 命名与文件规范

| 维度 | 约定 | 证据 |
|---|---|---|
| 文件命名 | `PascalCase.ets`；单文件单主题 | `Pathfinder.ets`/`FloorCanvas.ets`/`SelectTarget.ets`… |
| 类型/结构体 | `PascalCase`（`MapNode`、`PlannerState`、`RouteLeg`） | `model/AirportMap.ets`、`core/Pathfinder.ets` |
| 函数/变量 | `camelCase` | `planRoute`、`buildRouteView`、`catOf`、`nodeName` |
| 常量 | `SCREAMING_SNAKE_CASE` | `SECURITY_ID`、`PX_PER_METER`、`FLOOR_ORDER`、`PREF_MULT`、`QUICK_STARTS`、`NAV_PLAN` |
| 注释语言 | **中文**（代码标识符英文） | 全部源码；`AGENTS.md` 红线 7 |
| 页面路由常量 | 集中在 `core/Router.ets`（`NAV_*`），`main_pages.json` 只注册 `pages/Index` | `core/Router.ets`、`resources/base/profile/main_pages.json` |
| id 命名 | 节点 id 形如 `xha_p{层号}_{语义}`（`xha_p4_sec`、`xha_b2_platA`） | `data/XHA_xinghai_t1.map.json` |
| 测试可见性 | UI 自动化靠组件 `id`（如 `home_search`、`map_fit_floor`、`primary_action`、`floor_4F`）；**改 id 会打断 `smoke_emulator.py` / `verify_flows.py`** | `tools/smoke_emulator.py:235`、`tools/verify_flows.py:343-360` |

### 5.3 提交信息规范（从 `git log --oneline` 归纳，共 7 次提交）

```
8350ff4 docs: 按案例生成规范更新交付包与展示素材
f5e65a8 docs: 完善并精简机场导航案例 README
2fbffa9 docs: 更新 AI 对话实践路径与云端操作图
6815f2c feat: 完善机场导航流程与案例素材
bbc0b92 doc：文档修复          ← 全角冒号，不规范
f27cdf5 doc: 文档修复           ← 前缀用 doc 而非 docs
949ab7f feat: init HarmonyOS-METASERVICE-airport-guide
```

- 主流形式：**`<type>: <中文描述>`**，`type` 取 `feat` / `docs` / `fix`（`AGENTS.md` §9 推荐这三种）。
- 历史里存在 `doc:` 与 `doc：`（全角冒号）**两种偏差写法，新提交不要再沿用**。
- 描述用简体中文，内容具体（写"做了什么"而不是"update"）。
- 每个提交只做一件事：观察到的 `feat` 提交改代码+素材，`docs` 提交只改文档。

---

## 6. 质量门禁与回归清单

### 6.1 按改动类型选跑什么

| 我改了什么 | 必跑（离线） | 必跑（设备） | 必看交付物 / 现象 |
|---|---|---|---|
| **改数据**（`tools/gen_maps.py` 的 `XHA` spec） | ① `python3 tools/gen_maps.py` ② `python3 tools/gen_model.py` ③ `python3 tools/pathfind_reference.py` ④ `git status --short` 确认只动了 `data/` + `AirportMap.ets` | `smoke_emulator.py --language zh`（路线仍含安检、能走到完成页） | `AirportMap.ets` 头部计数、`⚠ 缺英译名称` 告警、`preview_nodes.py` 出的 SVG |
| **改寻路**（`core/Pathfinder.ets`） | `python3 tools/pathfind_reference.py`（Python 侧复算）＋ `node tools/verify_product.mjs`（ArkTS 侧 2000 条路线、RouteSteps 一致性） | `verify_flows.py --state-only`（偏好重算、交换、新行程） | 样例路线米数是否变化；`pathfind_reference.py` 的 `B cross==full` / `C same no-sec` 计数（当前 270 / 230） |
| **改 UI / 页面 / 组件** | 无（UI 无离线校验） | `smoke_emulator.py --language zh` 与 `--language en`；`verify_flows.py`（`--map-only` 六层与地图、`--metro-only` 地铁） | 组件 `id` 是否仍存在；6 页在中文/英文各走一遍；大字体与宽屏目视（无脚本） |
| **改文案 / 双语**（`model/Loc.ets`、`string.json`、`NODE_EN`） | `node tools/verify_product.mjs`（含 `Loc` 键对称 + 页面 `Loc.t()` 字面量覆盖检查） | 中英各跑一遍 `smoke_emulator.py` | `base/element/string.json` 与 `en_US/element/string.json` 键数必须一致（当前各 66 条） |
| **改配置**（`build-profile.json5` / `app.json5` / `module.json5` / `main_pages.json`） | 无（只能靠构建） | 重新构建 + 安装启动；`hdc shell aa dump -a` 看 Ability | 产物路径不变；bundleName `com.example.airportguide`；`installationFree: true` 未丢 |
| **改 `tools/` 脚本本身** | 跑一遍被改脚本；确认没有改动仓库里的既有交付物（`cases/**`、`docs/images/**`、`docs/reports/**`） | 若改的是 `verify_flows.py` / `smoke_emulator.py`，需跑一次被改流程 | `git status --short` 不得出现交付物变更 |
| **只改文档** | 无 | 无 | 命令与脚本一致（本文档 §3/§3.4） |

### 6.2 可勾选回归清单

**通用（每次改动都做）**

- [ ] `git status --short` 只包含**我有意修改**的文件
- [ ] `git diff --stat` 中**没有** `cases/**`、`docs/images/**`、`docs/reports/**`、`README.md`、`docs/BUILD.md`、`docs/需求文档.md`、`docs/开发文档.md`、`data/README.md`
- [ ] 若动了数据：`AirportMap.ets` 是重新生成的（不是手改的），且 `git diff` 干净地反映了数据变化

**离线可自动（有脚本）**

- [ ] `python3 tools/gen_maps.py` → 打印 `节点 N | 边 M (walk … / 垂直+捷运 …)`，各层计数合理
- [ ] `python3 tools/gen_model.py` → 打印 `节点 N（land … / air … / gate 1）| 边 M`，**无** `⚠ 缺英译名称`
- [ ] `python3 tools/pathfind_reference.py` → `自测通过 ✔`，5 项计数满（A/D/E 各 500）
- [ ] `node tools/verify_product.mjs` → `PASS 6/6 suites; route cases 2,000; …`（⚠️ 本机当前跑不了，见 §9）
- [ ] 若改了 `Loc.ets` / `string.json`：中英键数一致

**设备可自动（需 `hdc` + 已装 HAP）**

- [ ] `python3 tools/smoke_emulator.py --target <id> --out .temp/smoke-zh --language zh` → `PASS：首页与语言、…、逐步确认并完成路线`
- [ ] `... --language en` → 同上
- [ ] `python3 tools/verify_flows.py --target <id> --out .temp/flows` → `verify_flows_report.json` 中 `ok: true`
- [ ] `hdc hilog | grep -E "FATAL|JsError|CppCrash|arkts"` 无异常输出

**只能手工（目前无脚本覆盖）**

- [ ] 六层地图在 4F/3F/2F/1F/B1/B2 各能进入、缩放/适配（`map_zoom` / `map_fit_floor`）正常
- [ ] 大字体（≈1.3 倍字号）下首页入口、搜索结果、路线操作区仍可见
- [ ] 宽屏 / 折叠展开态布局（无脚本，需按 `docs/reports/ProductExperience-20261001.md` 的口径手工截图对比）
- [ ] 动效与页面转场平滑（`docs/开发文档.md §9` 业务第 8 条）
- [ ] **API 23 设备实测 —— 从未做过**（报告明确「API 23 设备实测尚未进行」，实测集中在 API 24/26）

### 6.3 自动化覆盖边界（照 `tools/` 真实覆盖写）

| 已自动化 | 覆盖范围 | 边界 |
|---|---|---|
| `tools/pathfind_reference.py` | Python 独立复算 500 组随机起终点 + 6 条固定样例；断言可达、异侧必经安检、同侧不含安检、legs/transitions 可回推、逐对权重求和等于 total | 只是**参照实现**，不执行 ArkTS 代码；不能证明端侧实现一致 |
| `node tools/verify_product.mjs` | 用 DevEco 的 TypeScript 把 `.ets` 转译后在 `node:vm` 里**真执行** 6 个套件（PlannerState 状态与不可变、路线 2000 条、RouteSteps、搜索/最近列表、Viewport、`Loc` 键对称） | 依赖 SDK 内 `typescript.js`；不覆盖 ArkUI 渲染 |
| `tools/smoke_emulator.py` | 核心路径 8 项断言（首页/双语/分类选点/预览含安检/开始指引/步骤计数/逐步确认/完成） | 不安装 HAP、不启动模拟器；依赖组件 `id` 与固定文案 |
| `tools/verify_flows.py` | 扩展流程：地图 14 项、状态 21 项、地铁 6 项 | 同上；另外**正则解析 `.ets` 源码**拿楼层包围盒与英文名，源码语法一变就失败 |
| **完全没有** | 单元测试工程（`harmony_app` 内无 `ohosTest`）、一键回归入口、API 23 实测、真机签名打包 | — |

---

## 7. 交付物生成

### 7.1 案例包 `cases/`

| 文件 | 是什么 | 由谁产出 |
|---|---|---|
| `cases/case.json` | 案例元数据：`baseInfo`（标题/难度/时长/标签/`coverImage`/`cardImage`/`shareImage`/`repoUrl`）、`introduction`、`prerequisites` 等 | **手工维护**。全仓库 grep 无任何脚本引用 `case.json`（`grep -rn "case\.json" tools/` 无结果） |
| `cases/practice.html` | 实践正文**片段**（文件以 `<h2 id="快速体验">` 开头，不是完整 HTML 文档），被 `case.json:145` 的 `"content": "practice.html"` 引用 | 手工维护 |
| `cases/cover.png` / `card.png` / `share.png` | 封面 / 卡片 / 分享图，被 `case.json:5,6,20` 引用 | 手工（仓库内**无生成脚本**） |
| `cases/preview-phone.png` | 预览图，被 `case.json:157` 的 `previewImage` 引用 | 手工 |
| `cases/arch-diagram.svg` | 架构图，被 `case.json:148` 的 `archImage` 引用 | 手工 |

> **结论：`cases/` 下 7 个文件全部是手工/平台侧产物，仓库内没有可复现的生成命令。** 要更新案例包只能手工编辑或手工重绘。

### 7.2 产品体验报告与截图 `docs/reports/**`、`docs/images/**`

```
tools/verify_flows.py            → <out>/verify_flows_report.json（含 target/passed/steps/failures）
                                   ↓ 手工整理：删 target、加 publicSummary/evidenceBoundary
docs/reports/product-20261001/api24-{map,metro,state}.json      ← 设备实测的公开摘要
docs/reports/ProductExperience-20261001.{md,json}               ← 手工汇总（含 HAP 字节数/SHA-256、结论表）
tools/capture_product_screens.py → docs/images/product-20261001/phone/*.jpeg（11 张中文，1320×2848）
                                   ↓ 手工挑选
docs/images/product-20261001/api24-*.jpeg / api26-*.jpeg        ← 大字体、折叠、宽屏、英文等证据
```

核对证据：`verify_flows.py:443-453` 写出的报告字段是 `ok/target/language/scope/passed/steps/failures/sourceMap/finishedAt`；而提交在仓库里的 `docs/reports/product-20261001/api24-map.json` 字段是 `publicSummary/evidenceBoundary/ok/language/scope/finishedAt/passed/failures/sourceMap/steps` —— **少了 `target`、多了 `publicSummary` 与 `evidenceBoundary`**，说明公开摘要经过**手工加工**，脚本本身不产出这两个字段。`docs/images/product-20261001/README.md` 也说明 api24/api26 系列是"验证证据"，phone/ 下 11 张才是脚本采集的原始截图。

**警告**：`capture_product_screens.py` 无参数、`OUT` 写死在 `docs/images/product-20261001/phone`（`:16`），一旦运行就会**改写只读交付目录**，且要求设备恰为 `127.0.0.1:5555` 与分辨率 1320×2848（`:15,36-37`）。

### 7.3 检查器（`gen_checker.py` + `checker.html` + `checker_app.js`）怎么用

三者关系：`checker.html` 是**页面外壳与样式**，末尾 `<script src="checker_app.js">`（`checker.html:166`）加载**全部交互逻辑**；`checker_app.js` 从 `window.AIRPORTS` 读取地图数据。`gen_checker.py` 的职责是把 `data/*.map.json` 序列化后**注入** `checker.html` 的占位符 `/*__AIRPORTS_JSON__*/`。

设计用途（`checker_app.js:1-4` 自述）：**载入真实平面图 → 对齐全层底图 → 逐节点标记 ✓/✗ → 拖拽校正坐标 → 导出修正后的地图 JSON**。

界面给出的操作链路（`checker.html:149` 与工具栏 `:115-138`）：

```bash
python3 tools/gen_checker.py       # 注入最新 data/*.map.json（⚠️ 当前会 AssertionError，见 §9）
```

1. 直接双击 `tools/checker.html`（纯原生 JS、无依赖、离线可开）。
2. 把该层真实平面图图片**拖进来**，用「滚轮缩放 / 拖空白对齐 / 旋转90° / 水平翻转 / 垂直翻转」，再点「校准比例尺」。
3. 点节点标 ✓（已确认）或 ✗（存疑），拖动节点修正坐标。
4. 「导出地图 JSON」→ 下载 `XHA_checked.map.json`（含修正坐标与核对状态，`checker_app.js:412-427`）；「导出核对报告」→ `XHA_check-report.json`（`:429-431`）。
5. 把导出的坐标**人工合并回 `tools/gen_maps.py` 的 `XHA` spec**（不要直接替换 `data/*.map.json`，会被 `gen_maps.py` 覆盖），再走 §4 的链路。

> 这是**唯一的人机对照校准工具**，其产物无法自动回流到真源 —— 目前是纯手工环节（`docs/BUILD.md:377` 只写了「浏览器人工校准工具」）。

---

## 8. Git 工作流

### 8.1 现状（`git remote -v` / `git branch -a` 实测）

```
$ git remote -v
upstream  https://gitcode.com/harmony-practice-center/HarmonyOS-METASERVICE-airport-guide.git (fetch)
upstream  https://gitcode.com/harmony-practice-center/HarmonyOS-METASERVICE-airport-guide.git (push)

$ git branch -a
* main
  remotes/upstream/HEAD -> upstream/main
  remotes/upstream/main
```

- **只有 `upstream` 一个 remote，没有 `origin`，没有个人 fork。**
- 本地只有 `main`，当前基线 `8350ff4`（共 7 次提交）。
- 工作区定位：**本地直接开发的 fork 工作区，默认不推送任何远程。**

### 8.2 建议的本地开发流程

```bash
# 1) 改代码前先建本地分支，避免污染 main
git switch -c feat/xxx          # 或 fix/xxx、docs/xxx

# 2) 正常提交（提交信息格式见 §5.3）
git add <paths> && git commit -m "feat: 描述"

# 3) 回到 main 前先看是否落后
git log --oneline upstream/main -3
```

### 8.3 同步上游

```bash
# 推荐：rebase 保持线性
git fetch upstream
git switch feat/xxx
git rebase upstream/main

# 或用 merge（会产生合并提交）
git fetch upstream
git merge upstream/main
```

冲突处理完后：`git rebase --continue`（或 `git merge --continue`）。**rebase 只对本地未推送的分支做**——本工作区没有远端分支，所以是安全的。

### 8.4 将来若要推送自己的 fork（命令模板，**不要现在执行**）

```bash
# 1) 添加你个人的 fork 作为 remote（名字自定义，例如 myfork）
git remote add myfork https://gitcode.com/<你的用户名>/HarmonyOS-METASERVICE-airport-guide.git

# 2) 首次推送分支并建立跟踪
git push -u myfork feat/xxx

# 3) 之后
git push myfork feat/xxx

# 4) 确认新增的 remote（不改动 upstream）
git remote -v
```

> 🚫 **红线**：未经用户明确同意，**不要执行任何 `git push` / `--force` / `git remote set-url` / 远端改写操作**。本工作区的约定是"本地开发、不推送"；`upstream` 指向的是**上游公共仓库**，对它推送属于事故。

---

## 9. 常见故障排查

### 9.1 构建失败

| 现象 | 原因 | 解决 |
|---|---|---|
| `00308018 EPERM` / 权限错误 | `harmony_app/local.properties` 的 `sdk.dir` 不正确或被改写 | 修正 `sdk.dir`（`docs/BUILD.md:262-266`），或用 DevEco 打开一次 `harmony_app` 让其自动补齐 |
| `The sdk.dir is not configured in the local.properties.` / `00303217` | `DEVECO_SDK_HOME` 或 `local.properties` 缺失 | 命令行先 `export DEVECO_SDK_HOME=…`（§1.3）；确认 `local.properties` 存在 |
| `hvigorw: command not found` | 本仓库**没有** `hvigorw` 包装脚本，必须来自 DevEco 工具链 | 把 `<DevEco>/tools/hvigor/bin` 加入 `PATH`，或改用 `node <DevEco>/tools/hvigor/bin/hvigorw.js …` |
| `arkts-no-untyped-obj-literals` | `Record` / 无类型对象字面量 | 字典改 `Map` + `.set()`；元数据加显式 `interface` 注解（§5.1 规则 1） |
| `string \| null` 窄化丢失 | Dijkstra 闭包捕获可变变量 | 闭包外 `const cur = u`（§5.1 规则 2） |
| `HorizontalAlign` 用在 `Row` | Row 的对齐类型是 `VerticalAlign` | 改 `VerticalAlign` |
| `@Builder` 体内局部变量报错 | `@Builder` 禁止局部变量声明 | 拆成普通私有方法 |
| `Cannot find 'Gesture'` | 本 SDK 中 `GestureGroup` 是工厂值、无类型名 | 去掉返回类型注解，由调用推断 |
| `WARN`：`Circle().fill()` 等 | 新版 SDK（API 26 引入）API 在旧兼容层打警告 | 可忽略；要消除则改用圆角 `Row` 画色点 |
| 构建报 SDK 版本不匹配 | 工程未写死 `compileSdkVersion`，取本机默认；`compatibleSdkVersion`/`targetSdkVersion` 固定 `6.1.0(23)` | 先核对本机 SDK：`cat "<SDK>/default/openharmony/ets/oh-uni-package.json" \| grep apiVersion`。**不要为了让本机编译通过就去改 `compatibleSdkVersion`**；确需锁定编译版本才在 `products.default` 里显式加 `"compileSdkVersion"`（`docs/BUILD.md:71`） |

### 9.2 生成物不同步

| 现象 | 原因 | 解决 |
|---|---|---|
| App 里的地点/路线和 JSON 对不上，但不报错 | 改了 JSON 没跑 `gen_model.py` | 按 §4 顺序重跑；用 §4.2 方法 A 复检 |
| 改的 JSON 内容"自己变回去了" | 手改了 `data/*.map.json`，随后 `gen_maps.py` 覆盖写 | 真源是 `tools/gen_maps.py` 的 spec；把改动搬到 spec 里 |
| `AssertionError: 必须恰有一个安检节点` | 新增/删除了 `type == "security"` 的节点 | 数据里安检节点必须恰好 1 个（当前 `xha_p4_sec`），它是陆/空侧割点 |
| `AssertionError: 空侧为空，判定失效` | 图被改成从入口 BFS 不可达任何空侧节点 | 检查节点/边连通性 |
| 生成时打印 `⚠ 缺英译名称: [...]` | 新节点名没登记进 `gen_model.py` 的 `NAME_EN` | 补 `NAME_EN`；否则英文界面回退中文 |
| 手动改了 `AirportMap.ets` 想保住 | 生成物 | `git checkout -- harmony_app/entry/src/main/ets/model/AirportMap.ets` 后改真源 |

### 9.3 `tools/` 脚本自身的问题（本机实测确认）

| 现象 | 证据 | 解决 |
|---|---|---|
| `python3 tools/gen_checker.py` → `AssertionError: checker.html 缺失注入占位符` | 已实测；`grep -c '__AIRPORTS_JSON__' tools/checker.html` = **0**，连 `git show HEAD:tools/checker.html` 也是 0（上一次注入已被提交） | 需把占位符 `/*__AIRPORTS_JSON__*/` **重新加回** `tools/checker.html`（或改 `gen_checker.py` 让它替换已有的 `window.AIRPORTS = …;`）。`git checkout` 无法修复，因为提交版本本身就没有 token |
| `python3 tools/gen_brand_assets.py` → `ModuleNotFoundError: No module named 'PIL'` | 已实测；本机 `python3 -c "import PIL"` 同样失败 | `python3 -m pip install Pillow`（≥ 9.1） |
| `python3 tools/gen_brand_assets.py` 生成的图标被降级 | `gen_icons.py` 与 `gen_brand_assets.py` 写**同一组 3 个文件**；实测跑 `gen_icons.py` 后变成 216/108/216 | 明确顺序：要品牌图标就跑 `gen_brand_assets.py`；**不要**在同一轮里再跑 `gen_icons.py` |
| `node tools/verify_product.mjs` → `ERR_MODULE_NOT_FOUND .../C:/Program Files/Huawei/...` | 已实测 exit 1；`verify_product.mjs:9` 硬编码 Windows 路径 | 需把 `tsFile` 改成按平台/`DEVECO_SDK_HOME` 推导（本机可指向 `/Applications/DevEco-Studio.app/Contents/sdk/default/openharmony/ets/build-tools/ets-loader/node_modules/typescript/lib/typescript.js`）。**在 DevEco 环境实测确认前，不要断言本机可跑** |
| `verify_flows.py` / `smoke_emulator.py` 立刻失败 | 需要 `hdc`；本机 `which hdc` 无输出 | 把 `<SDK>/default/openharmony/toolchains` 加进 `PATH`；先 `hdc list targets` 确认设备 |
| `verify_flows.py` 报「机场地图源数据或楼层边界读取失败」/「FloorCanvas fitInsets 源码配置不可解析」 | 它用**正则**解析 `AirportMap.ets` 的 `FLOOR_BBOX.set(...)`/`NODE_EN.set(...)` 与 `FloorCanvas.ets` 的 `fitInsets(...)` 调用（`verify_flows.py:93-104`） | 改动 `gen_model.py` 的输出语法或 `FloorCanvas.ets` 的 `fitInsets` 调用形式时，必须同步更新该脚本的正则 |

### 9.4 模拟器 / 真机问题

| 现象 | 原因 | 解决 |
|---|---|---|
| `hdc list targets` 返回空 | 模拟器未完全启动 / hdc 服务异常 | ①等模拟器桌面可见；②DevEco 设备管理器确认在线；③`hdc kill` → `hdc start`（`docs/BUILD.md:306-312`） |
| `INSTALL_FAILED_VERSION_DOWNGRADE` | 已安装版本比要装的更新 | 先 `hdc uninstall com.example.airportguide`，再 `hdc install -r <hap>` |
| 真机提示「未签名」 | 产物是 `entry-default-unsigned.hap` | unsigned 仅限模拟器/调试真机；分发给用户需在 DevEco 配签名证书并打 signed HAP |
| `bindSheet` 弹层空白且关不掉 | 弹层内容因状态变化变成空树 | 弹层内容永远渲染非空占位根；关闭动作不清空选中节点（`docs/BUILD.md:327`） |
| 路径图流畅但自动化点击打不中节点 | **Canvas 坐标系 ≠ 物理 px** | 用截图 + 图像分析取坐标，不要按分辨率比例折算（`docs/BUILD.md:243`） |
| 中英切换后某处文案没变 | 该处走了硬编码而非 `Loc.t(key)` | 全部改用 `Loc.t(key)`；`verify_product.mjs` 有 `Loc` 键覆盖检查 |
| 截图脚本报「截图格式或分辨率不符」 | 设备不是 1320×2848 | `capture_product_screens.py:36-37` 硬校验；换设备需改脚本或改用 `smoke_emulator.py` 自采 |

### 9.5 本地目录与忽略规则（避免误提交）

`.gitignore` 已忽略：`node_modules/`、`oh_modules/`、`.hvigor/`、`build/`、`*.hap`/`*.har`/`*.hsp`/`*.app`、`local.properties`、`.idea/`、`.temp/`、`preview/`、`__pycache__/`、`.claude/`、`.agents/` 等。

- `preview/` 由 `preview_nodes.py` 生成，**不入库**（本机当前不存在该目录）。
- `.temp/` 是设备脚本的默认证据目录（`capture_product_screens.py:17` 写 `.temp/product-20261001/capture-layouts`），**不入库**。
- 因此 `git status --short` 里**不应**出现这两个目录。

---

---

## 10. 多端移植（v1.1 新增：共享核心 + Web）

本仓库在 v1.1 起变成 **pnpm workspace 多端工程**：`harmony_app/` 仍是 ArkTS 真源（只读参照），
`packages/core/` 是平台无关的共享核心，`apps/*` 是各端客户端。本节只讲"怎么跑"，架构见 [architecture.md](architecture.md) §13。

### 10.1 目录与职责

| 路径 | 职责 | 能否手改 |
|---|---|---|
| `packages/core/src/*.ts` | 图/寻路/路线步骤/状态机/检索/双语/视口（11 个模块） | ✅ 手写 |
| `packages/core/src/generated/**` | 从 ArkTS 真源导出的地图、文案、标签、令牌 | ❌ 生成物，改真源后重跑导出 |
| `packages/core/test/conformance.test.ts` | 16 项一致性回归 | ✅ 手写 |
| `apps/web/**` | Web/PWA 客户端（Vite + TS + Canvas 2D） | ✅ 手写 |
| `apps/apple/Sources/AirportCore/**` | Apple 端 Swift 核心移植 | ✅ 手写 |
| `apps/apple/Sources/AirportUI/**` | Apple 端呈现层（状态机/文案/绘制命令，纯逻辑） | ✅ 手写 |
| `apps/apple/Sources/AirportGuideApp/**` | SwiftUI 六页 + Canvas 地图（命令流解释器） | ✅ 手写 |
| `apps/apple/Sources/AirportCore/Resources/*.json` | 跨语言数据包 | ❌ 生成物（export_shared.py） |
| `apps/apple/Tests/AirportCoreTests/Fixtures/*.json` | 跨语言基准路线 | ❌ 生成物（gen_route_fixture.mjs） |
| `tools/gen_route_fixture.mjs` | 用 TS 核心生成各端对齐基准 | ✅ 手写 |
| `tools/apple_test.sh` | swift test/run 的沙箱友好包装 | ✅ 手写 |
| `tools/export_shared.py` | ArkTS 真源 → 共享核心的导出器 | ✅ 手写 |
| `tools/web_smoke.mjs` | Web 端到端冒烟（跑构建产物） | ✅ 手写 |

### 10.2 环境

- **Node ≥ 20.11**（`import.meta.dirname`）；本机实测 Node 25.9 可直接运行 `.ts`（原生类型擦除，**核心回归零依赖、无需构建**）。
- **pnpm ≥ 10**（本机 11.24）。仓库已用 `.npmrc` 把 pnpm 的 store/cache 指到仓库内（`store-dir=.pnpm-store`、`cache-dir=.pnpm-cache`），避免写 `~` 下的目录被沙箱拒绝。
- **pnpm 11 会拦截依赖构建脚本**：`pnpm-workspace.yaml` 里以 `allowBuilds: { esbuild: true }` 显式放行（vite 依赖 esbuild 的 postinstall）。换机器时若报 `ERR_PNPM_IGNORED_BUILDS`，就是这个开关没生效。
- 已实测：`pnpm install` 只拉 14 个包；`vite build` 约 0.15 s，产物 62 KB JS（gzip 18 KB）+ 7.6 KB CSS。

### 10.3 命令

| 命令 | 作用 | 前置 |
|---|---|---|
| `python3 tools/export_shared.py` | ArkTS 真源 → `packages/core/src/generated/**`；会打印节点/边/文案/英文名统计与源 JSON 的 sha256 | 改过 `Loc.ets`、`Theme.ets`、`gen_maps.py` 之后**必须**跑 |
| `npm test` | 共享核心一致性回归（16 项） | 无（Node 直接跑 TS） |
| `pnpm web` | Web 开发服务器 → http://127.0.0.1:5173 | 先 `pnpm install` |
| `pnpm web:build` | 产出 `apps/web/dist`（静态托管 / WKWebView 壳可直接用） | 同上 |
| `pnpm test:web` | Web 端到端冒烟：加载 `dist` 产物，在最小 DOM 桩里走完主链路 | 先 `pnpm web:build` |
| `npm run test:apple` | Apple 端回归：`swift test`，42 项（核心 15 + 呈现 27） | macOS + Xcode 命令行工具 |
| `npm run apple:build` | 编译全部 Apple 目标（含 SwiftUI 应用） | 同上 |
| `bash tools/apple_test.sh run AirportGuideApp` | 启动 SwiftUI 界面（macOS 14+） | 同上 |
| `npm run apple:run` | 运行 `airport-cli`，打印 6 条参考样例与四档偏好对比 | 同上 |
| `node tools/gen_route_fixture.mjs` | 生成跨语言基准 `routes.json`（824 条）到 TS 与 Swift 两处 | 改了寻路/数据之后必须跑 |
| `npm run test:all` | 核心回归 + Web 构建 + Web 端到端 + Apple 端回归 | 同上 |

### 10.4 回归覆盖了什么

- `npm test` 16 项：地图规模/侧别/楼层/包围盒与 ArkTS 生成物逐条对齐；6 条参考样例米数与节点数复现；500 组随机 × 4 偏好的割点等价（拆两段 == 全图 Dijkstra）与 legs/transitions 不变量；**14 042 组全量有序节点对**可达性；状态机不可变性与转移；检索/最近列表；112 条文案双语完整性；视口 fit/钳制/焦点缩放。
- `pnpm test:web` 14 项：首页渲染 → 目的地分类/搜索过滤 → 出发位置 → 路线预览（米数/中央安检提示/四档偏好）→ Canvas 实际绘制调用 → 切偏好 → 开始指引（步骤计数）→ 逐步确认到完成 → 返回首页 → 本地存储写入 → 中英切换 → 楼层地图切层与选点。
- **未覆盖**：ArkTS 运行时逐值比对（本机无 DevEco SDK）、真机/模拟器形态、小程序与 Apple 端（尚未开工）。

### 10.5 Apple 端的环境坑（实测）

本机沙箱下 SwiftPM 会连报两类错误，都属于**环境限制而非工程问题**：

1. `You don't have permission to save the file "manifests" in the folder "org.swift.swiftpm"` —— SwiftPM 想写 `~/Library/Caches`；
2. `sandbox-exec: sandbox_apply: Operation not permitted` —— SwiftPM 要给自己套一层 sandbox，被外层拒绝。

对策（已封装进 `tools/apple_test.sh`）：把 `CLANG_MODULE_CACHE_PATH`、`--scratch-path`、`--cache-path`、
`--config-path`、`--security-path` 全部指到 `apps/apple/` 内，并加 `--disable-sandbox`。
注意 `swift run <目标> ...` 里**目标名之后的参数会传给目标本身**，所以 SwiftPM 选项必须写在目标名之前。

**在 Xcode 里打开 `apps/apple/Package.swift` 不需要任何这些参数。**

### 10.6 已知限制

- Web 端为**视觉近似**：流程与逻辑对齐，字号/间距/圆角尚未收敛到 [DESIGN.md](DESIGN.md) 的令牌（T-607）。
- Apple 端（macOS 14+ / iOS 17+）已有界面，但**只做过编译验证与呈现层测试**，尚未逐屏视觉走查（T-612）；本机没有 iOS 模拟器运行时，iOS 目标可编译但需先在 Xcode → Settings → Components 下载运行时才能跑。
- 共享核心对"平行边"与 `apm` 类型做了**更严格**的处理：前者在加载期直接抛错（ArkTS 端是静默覆盖），后者补上了 350m 权重（ArkTS 端会降级成 25m）。这是有意的差异，已在代码注释与本文件说明。

---

## 变更记录


| 版本 | 日期 | 修改人 | 说明 |
|---|---|---|---|
| v1.0 | 2026-10-02 | DSH Agent | 首次创建，基于 main@8350ff4 |
| v1.1 | 2026-10-02 | DSH Agent | 新增 §10 多端移植：目录职责、环境（Node≥20.11 / pnpm≥10 / allowBuilds）、命令表、回归覆盖面与已知限制 |
| v1.2 | 2026-10-02 | DSH Agent | §10 补 Apple 端：目录职责、命令、SwiftPM 沙箱坑与对策（10.5） |
| v1.3 | 2026-10-02 | DSH Agent | §10 补 Apple 界面目标与 42 项回归；限制说明更新为"未做视觉走查" |
