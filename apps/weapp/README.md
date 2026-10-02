# 微信小程序端 · 星海机场导航

复用 [`packages/core`](../../packages/core) 的同一份共享核心（地图数据、寻路、路线步骤、状态机、双语、**绘制命令流**）。
小程序侧没有任何业务逻辑上的第二实现，只做"解释绘制命令 + 摆放视图"。

```
apps/weapp/
├── project.config.json          ← 微信开发者工具打开这个目录
└── miniprogram/
    ├── app.js / app.json / app.wxss / sitemap.json
    ├── utils/
    │   ├── core.js              【生成物】共享核心打包（CommonJS，勿手改）
    │   ├── model.js             状态机单例 + 页面跳转表
    │   ├── store.js             wx.storage ↔ PreferencesStore
    │   ├── present.js           页面数据构造（可测：不渲染 WXML 也能断言文案）
    │   └── render.js            Canvas 2D 解释器 + 手势 + 命中测试
    └── pages/{home,target,start,route,metro,browse}/index.{js,wxml}
```

## 打开方式

1. `node tools/build_weapp.mjs`（生成 `utils/core.js`，改了 `packages/core` 之后必须重跑）
2. 微信开发者工具 → **导入项目** → 选择 `apps/weapp` 目录（`appid` 已填测试号 `touristappid`，可直接预览）

## 为什么能直接复用核心

`packages/core` 只有一条硬规则：**不依赖任何平台 API**（无 DOM、无 `wx.*`）。
因此它可以被 esbuild 原样打成 CommonJS 单文件给小程序用，不需要为小程序改一行代码 ——
地图数据、Dijkstra + 安检割点、四档偏好、112 条双语、绘制命令流全部随之而来。

小程序侧需要自己处理的只有三件事：

| 平台差异 | 处理位置 |
|---|---|
| `wx.storage` 存取语言与最近地点 | `utils/store.js`（实现核心的 `PreferencesStore` 接口） |
| Canvas 2D 节点获取与物理像素 | `utils/render.js` 的 `initCanvas`（`createSelectorQuery` + `dpr`） |
| 触摸事件（`touchstart/move/end`） | `utils/render.js` 的 `createMapController` |

## 在没有微信开发者工具时怎么验证

`node tools/weapp_smoke.mjs`（9 项）：工程配置与页面文件齐全、核心产物是 CommonJS 且导出齐全、
六页文案与列表随语言切换、编号检索命中 A101、路线概要/步骤/异常文案、地铁与楼层数据、
**用 `wx` 桩跑通六页真实 `Page` 生命周期与跳转**、Canvas 链路真的产生绘制调用（400+ 次）、主包体积。

> 诚实说明：这些断言证明工程自洽、逻辑可用、包体安全，但**没有真实渲染过 WXML/WXSS**。
> 首次在微信开发者工具里打开时，仍需目视核对排版（与 Web 端观感对齐即可，见 `docs/DESIGN.md`）。

## 包体

主包约 136 KB（其中 `utils/core.js` 95 KB），远低于 2 MB 上限；地图数据随包，**无网络请求**。
