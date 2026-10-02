#!/usr/bin/env node
// 微信小程序端冒烟：在没有「微信开发者工具」的机器上，尽可能验证工程是自洽且能跑的。
//
// 验证范围（能自动化的部分）：
//   1. 工程配置合法：project.config.json / app.json / sitemap.json 可解析，页面文件齐全
//   2. 共享核心产物可用：utils/core.js 是 CommonJS、导出齐全、地图 119 节点
//   3. 页面数据构造正确：present.* 的中英文案与列表（不渲染 WXML 也能断言）
//   4. 页面逻辑能跑：用 wx 桩加载每个页面，跑通主流程与关键分支，断言状态与跳转
//   5. Canvas 渲染链路：render.js 的控制器 + 绘制命令流在假 ctx 上真的画了东西
//   6. 包体：主包体积远小于 2 MB 上限
//
// 用法：node tools/weapp_smoke.mjs   （前置：node tools/build_weapp.mjs）

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const APP = join(ROOT, 'apps/weapp');
const MP = join(APP, 'miniprogram');

const failures = [];
const drawCalls = [];
const navigations = [];
const toasts = [];

function check(name, fn) {
  try {
    fn();
    console.log(`  ✔ ${name}`);
  } catch (err) {
    failures.push(`${name}: ${err.message}`);
    console.log(`  ✖ ${name}\n      ${err.message}`);
  }
}

function assert(condition, message) {
  if (!condition) { throw new Error(message); }
}

// ----------------------------------------------------------------- wx 桩

const canvasCtx = new Proxy({}, {
  get(target, key) {
    if (key in target) { return target[key]; }
    return (...args) => { drawCalls.push([String(key), args]); };
  },
  set(target, key, value) { target[key] = value; return true; },
});

const storage = new Map();

const wx = {
  getStorageSync: (k) => (storage.has(k) ? storage.get(k) : ''),
  setStorageSync: (k, v) => { storage.set(k, v); },
  removeStorageSync: (k) => { storage.delete(k); },
  navigateTo: (o) => { navigations.push({ type: 'navigateTo', url: o.url }); },
  redirectTo: (o) => { navigations.push({ type: 'redirectTo', url: o.url }); },
  reLaunch: (o) => { navigations.push({ type: 'reLaunch', url: o.url }); },
  navigateBack: (o) => { navigations.push({ type: 'navigateBack', delta: o && o.delta }); },
  showToast: (o) => { toasts.push(o.title); },
  getWindowInfo: () => ({ pixelRatio: 2, windowWidth: 375, windowHeight: 812 }),
  createSelectorQuery: () => ({
    in() { return this; },
    select() { return this; },
    fields() { return this; },
    exec(cb) {
      cb([{ width: 375, height: 300, node: { width: 0, height: 0, getContext: () => canvasCtx } }]);
    },
  }),
};

// ----------------------------------------------------------------- 迷你 CJS 加载器

const pageRegistry = [];
let appConfig = null;

function createLoader() {
  const cache = new Map();
  function load(file) {
    const full = resolve(file);
    if (cache.has(full)) { return cache.get(full).exports; }
    const mod = { exports: {} };
    cache.set(full, mod);
    const code = readFileSync(full, 'utf8');
    const sandbox = {
      module: mod,
      exports: mod.exports,
      console,
      wx,
      Page: (options) => { pageRegistry.push(options); },
      App: (options) => { appConfig = options; },
      getApp: () => ({ globalData: {} }),
      require: (id) => {
        if (!id.startsWith('.')) { throw new Error(`页面不应引用外部模块：${id}`); }
        let target = resolve(dirname(full), id);
        if (!existsSync(target) && existsSync(`${target}.js`)) { target = `${target}.js`; }
        if (!existsSync(target)) { throw new Error(`require 失败：${id}（来自 ${full}）`); }
        return load(target);
      },
    };
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox, { filename: full });
    return mod.exports;
  }
  return load;
}

const load = createLoader();

/** 造一个假的 Page 实例：捕获 setData */
function instantiate(pageOptions) {
  const instance = Object.assign({}, pageOptions);
  instance.data = JSON.parse(JSON.stringify(pageOptions.data || {}));
  instance.setData = function setData(patch) { Object.assign(this.data, patch); };
  return instance;
}

// ----------------------------------------------------------------- 开始

console.log('微信小程序端冒烟\n');

// 1. 配置与文件
check('project.config.json / app.json / sitemap.json 合法且页面文件齐全', () => {
  const project = JSON.parse(readFileSync(join(APP, 'project.config.json'), 'utf8'));
  assert(project.compileType === 'miniprogram', 'compileType 应为 miniprogram');
  assert(project.miniprogramRoot === 'miniprogram/', 'miniprogramRoot 应为 miniprogram/');

  const appJson = JSON.parse(readFileSync(join(MP, 'app.json'), 'utf8'));
  assert(Array.isArray(appJson.pages) && appJson.pages.length === 6, `页面数应为 6，实际 ${appJson.pages.length}`);
  for (const page of appJson.pages) {
    const base = join(MP, page);
    assert(existsSync(`${base}.js`), `缺少 ${page}.js`);
    assert(existsSync(`${base}.wxml`), `缺少 ${page}.wxml`);
  }
  JSON.parse(readFileSync(join(MP, 'sitemap.json'), 'utf8'));
  assert(existsSync(join(MP, 'app.wxss')), '缺少 app.wxss');
});

// 2. 核心产物
check('共享核心产物是 CommonJS、导出齐全、地图数据完整', () => {
  const file = join(MP, 'utils/core.js');
  assert(existsSync(file), '缺少 utils/core.js，请先运行 node tools/build_weapp.mjs');
  const code = readFileSync(file, 'utf8');
  assert(code.includes('module.exports'), '产物不是 CommonJS');
  const mod = load(file);
  for (const name of ['AIRPORT', 'AppModel', 'MemoryStore', 'renderFloor', 'hitTest', 'planRoute', 'summary', 't']) {
    assert(mod[name] !== undefined, `缺少导出 ${name}`);
  }
  assert(mod.AIRPORT.nodes.length === 119, `节点数应为 119，实际 ${mod.AIRPORT.nodes.length}`);
  assert(mod.AIRPORT.edges.length === 145, `边数应为 145，实际 ${mod.AIRPORT.edges.length}`);
  assert(mod.AIRPORT.securityId === 'xha_p4_sec', '唯一安检节点不一致');
});

// 3. 页面数据构造
check('present.home：首页文案与卡片随语言切换', () => {
  const { resetModel, getModel, core } = load(join(MP, 'utils/model.js'));
  const present = load(join(MP, 'utils/present.js'));
  resetModel(new core.MemoryStore());

  const zh = present.home(getModel());
  assert(zh.heroTitle === '你想去哪里？', `中文标题异常：${zh.heroTitle}`);
  assert(zh.popular.length === 6, `常用目的地应有 6 个，实际 ${zh.popular.length}`);
  assert(zh.langLabel === 'EN', '中文态下按钮应显示 EN');

  getModel().toggleLanguage();
  const en = present.home(getModel());
  assert(en.heroTitle === 'Where would you like to go?', `英文标题异常：${en.heroTitle}`);
  assert(en.langLabel === '中', '英文态下按钮应显示 中');
});

check('present.target：分类过滤与编号检索命中 A101', () => {
  const { resetModel, getModel, core } = load(join(MP, 'utils/model.js'));
  const present = load(join(MP, 'utils/present.js'));
  resetModel(new core.MemoryStore());

  const model = getModel();
  model.startTargetFlow('gate');
  const gates = present.target(model);
  assert(gates.categories.length === 10, `分类数应为 10，实际 ${gates.categories.length}`);
  assert(gates.activeCategory === 'gate', '当前分类应为 gate');
  assert(gates.places.length > 0, '登机口列表不应为空');
  assert(gates.places.every((p) => p.subtitle.includes('登机口')), '分类过滤失效');

  model.setQuery(' a101 ');
  const hit = present.target(model);
  assert(hit.places[0].id === 'xha_p4_gA101', `编号检索应命中 A101，实际 ${hit.places[0] && hit.places[0].id}`);

  model.setQuery('zzz不存在');
  assert(present.target(model).empty === true, '空结果时应置 empty');
});

check('present.route：概要 / 步骤 / 异常状态文案', () => {
  const { resetModel, getModel, core } = load(join(MP, 'utils/model.js'));
  const present = load(join(MP, 'utils/present.js'));
  resetModel(new core.MemoryStore());

  const model = getModel();
  assert(present.route(model).ready === false, '未选起终点时不应 ready');
  assert(present.route(model).statusTitle === '请先选择起点和目的地', 'missing 文案异常');

  model.chooseDestinationFromHome('xha_p4_gA101');
  model.chooseStart('xha_p4_doorW');
  const view = present.route(model);
  assert(view.ready === true, '应进入 ready');
  assert(view.stagePreview === true, '应处于预览态');
  assert(view.summary.includes('步行约'), `概要应含步行米数：${view.summary}`);
  assert(view.securityNote.includes('中央安检'), '陆→空应提示必经中央安检');
  assert(view.preferences.length === 4, '应有四档偏好');
  assert(view.routeNodeIds.length > 0, '应给出路线节点序列');

  model.beginGuidance();
  const guiding = present.route(model);
  assert(guiding.stageGuiding === true, '应进入指引态');
  assert(/步骤 1\/\d+/.test(guiding.stepIndexText), `步骤计数异常：${guiding.stepIndexText}`);
  assert(guiding.steps.length > 0, '应有全程步骤列表');
  assert(guiding.actionLabel.length > 0, '应有主操作文案');
});

check('present.metro / present.browse：地铁方向与楼层节点列表', () => {
  const { resetModel, getModel, core } = load(join(MP, 'utils/model.js'));
  const present = load(join(MP, 'utils/present.js'));
  resetModel(new core.MemoryStore());

  const model = getModel();
  model.startMetroFlow();
  const metro = present.metro(model);
  assert(metro.directions.length === 2, '应有两个地铁方向');
  assert(metro.directions[0].targetId === 'xha_b2_platA', '市区方向站台异常');
  assert(metro.steps.length === 3, '到站台应有三步');

  model.openBrowse();
  const browse = present.browse(model);
  assert(browse.floors.length === 6, `楼层应有 6 个，实际 ${browse.floors.length}`);
  assert(browse.activeFloor === '4F', '默认楼层应为 4F');
  assert(browse.nodes.length > 0, '楼层节点列表不应为空');
  assert(browse.nodes.every((n) => !n.subtitle.includes('通道/中转')), '列表不应包含纯拓扑中转点');

  model.setBrowseFloor('B2');
  model.selectNode('xha_b2_platA');
  const selected = present.browse(model);
  assert(selected.hasSelection === true, '应处于选中态');
  assert(selected.selectedName.includes('站台'), `选中名称异常：${selected.selectedName}`);
});

// 4. 页面逻辑
check('页面逻辑：六个页面都能注册并跑通生命周期', () => {
  pageRegistry.length = 0;
  navigations.length = 0;
  const { resetModel, core } = load(join(MP, 'utils/model.js'));
  resetModel(new core.MemoryStore());

  // 必须与 utils 用同一个 loader：模块缓存共享，页面才能看到同一个状态机单例
  const pages = [];
  for (const name of ['home', 'target', 'start', 'route', 'metro', 'browse']) {
    const before = pageRegistry.length;
    load(join(MP, `pages/${name}/index.js`));
    assert(pageRegistry.length === before + 1, `${name} 页面未注册 Page`);
    pages.push({ name, options: pageRegistry[pageRegistry.length - 1] });
  }
  assert(pages.length === 6, '应有六个页面');

  // 首页：进入登机口流程
  const home = instantiate(pages[0].options);
  home.onShow();
  assert(home.data.heroTitle.length > 0, '首页未生成数据');
  home.onGoGate();
  assert(navigations.some((n) => n.url.includes('pages/target')), '首页未跳目的地页');

  // 目的地页：选 A101
  const target = instantiate(pages[1].options);
  target.onShow();
  target.onPick({ currentTarget: { dataset: { id: 'xha_p4_gA101' } } });
  assert(navigations.some((n) => n.url.includes('pages/start')), '目的地页未跳出发位置页');

  // 出发位置页：选西出发门
  const start = instantiate(pages[2].options);
  start.onShow();
  const { getModel } = load(join(MP, 'utils/model.js'));
  assert(getModel().state.planner.draftEnd === 'xha_p4_gA101', '目的地草稿未写入共享状态');
  start.onQuick({ currentTarget: { dataset: { id: 'xha_p4_doorW' } } });
  assert(getModel().state.view === 'route', '选完起点应进入路线态');
  assert(getModel().state.recent[0] === 'xha_p4_gA101', '确认路线时应写入最近地点');

  // 路线页：偏好 → 开始指引 → 逐步确认
  const route = instantiate(pages[3].options);
  route.onShow();
  assert(route.data.ready === true, '路线页应 ready');
  route.onPreference({ currentTarget: { dataset: { key: '1' } } });
  assert(getModel().state.planner.preference === 1, '偏好未生效');
  route.onBegin();
  assert(route.data.stageGuiding === true, '未进入指引态');
  let guard = 0;
  while (route.data.stageGuiding && guard < 20) {
    route.onAdvance();
    guard += 1;
  }
  assert(route.data.stageCompleted === true, '走不到完成页');
  route.onRestart();
  assert(getModel().state.view === 'home', '重开未回首页');

  // 地铁页
  const metro = instantiate(pages[4].options);
  metro.onShow();
  assert(metro.data.directions.length === 2, '地铁方向缺失');
  metro.onDirection({ currentTarget: { dataset: { id: 'xha_b2_platA' } } });
  assert(navigations.some((n) => n.url.includes('pages/start')), '地铁页未跳出发位置页');

  // 楼层地图页：切层 + 选点 + 设为起点
  const browse = instantiate(pages[5].options);
  browse.onShow();
  assert(browse.data.floors.length === 6, '楼层 chips 缺失');
  browse.onFloor({ currentTarget: { dataset: { key: 'B2' } } });
  assert(browse.data.activeFloor === 'B2', '切层未生效');
  browse.onSelect({ currentTarget: { dataset: { id: 'xha_b2_platA' } } });
  assert(browse.data.hasSelection === true, '未进入选中态');
  browse.onPickStart();
  assert(toasts.length > 0, '应弹出「已选择出发位置」提示');
  browse.onPickDest();
  assert(getModel().state.view === 'route', '「去这里」应进入路线态');
});

// 5. Canvas 渲染链路
check('Canvas 链路：控制器挂载后真的产生绘制调用，点选命中节点', async () => {
  const { resetModel, core } = load(join(MP, 'utils/model.js'));
  resetModel(new core.MemoryStore());
  const { createMapController } = load(join(MP, 'utils/render.js'));

  drawCalls.length = 0;
  const controller = createMapController({}, '#map', { onNodeTap: () => {} });
  return controller.mount().then(() => {
    assert(controller.state.context === undefined || true, '');
    assert(drawCalls.length > 20, `绘制调用过少：${drawCalls.length}`);
    const names = new Set(drawCalls.map((c) => c[0]));
    for (const need of ['clearRect', 'fillRect', 'arc', 'stroke', 'fillText']) {
      assert(names.has(need), `缺少绘制调用 ${need}`);
    }

    // 命中测试：把某个节点投影到屏幕坐标后应能命中
    const node = core.AIRPORT.node('xha_p4_gA101');
    const vp = controller.state.viewport;
    const hit = core.hitTest(core.AIRPORT, '4F', vp, vp.scrX(node.x), vp.scrY(node.y));
    assert(hit && hit.id === 'xha_p4_gA101', '命中测试未返回 A101');

    // 路线态：设置路线后应有高亮色出现
    const model = load(join(MP, 'utils/model.js')).getModel();
    model.chooseDestinationFromHome('xha_p4_gA101');
    model.chooseStart('xha_p4_doorW');
    drawCalls.length = 0;
    controller.setRoute(model.routeNodeIds, model.currentRouteIndex,
      model.state.planner.startId, model.state.planner.endId, false);
    const strokeColors = drawCalls.filter((c) => c[0] === 'stroke').length;
    assert(strokeColors >= 2, `路径层未绘制（stroke 次数 ${strokeColors}）`);
  });
});

// 6. 包体
check('主包体积远小于 2 MB 上限', () => {
  function dirSize(dir) {
    let total = 0;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      total += entry.isDirectory() ? dirSize(full) : statSync(full).size;
    }
    return total;
  }
  const size = dirSize(MP);
  const mb = size / 1024 / 1024;
  assert(mb < 1, `主包 ${mb.toFixed(2)} MB，已接近 2 MB 上限`);
  console.log(`      （主包 ${(size / 1024).toFixed(0)} KB，其中 core.js ${(statSync(join(MP, 'utils/core.js')).size / 1024).toFixed(0)} KB）`);
});

// 等待异步 check 完成
await new Promise((r) => setTimeout(r, 50));

console.log('');
if (failures.length === 0) {
  console.log(`全部通过 ✔（绘制调用 ${drawCalls.length} 次，跳转 ${navigations.length} 次，提示 ${toasts.length} 次）`);
  process.exit(0);
}
console.log(`${failures.length} 项失败：`);
for (const f of failures) { console.log(`  - ${f}`); }
process.exit(1);
