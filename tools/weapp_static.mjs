#!/usr/bin/env node
// 小程序静态契约检查：在无法渲染 WXML 的前提下，用静态分析抓住最常见的绑定类缺陷。
//
// 检查四件事（每一条都对应"没渲染过就发现不了"的错误）：
//   1. WXML 里的每个 {{标识符}} 都必须由 present.* 真的产出（防 `{{noResult}}` 这类拼写错）
//   2. 每个 bind*/catch* 事件处理函数都必须在 Page 对象里存在（防点了没反应的按钮）
//   3. 每个 wx:for 都必须有 wx:key（小程序会警告/影响复用）
//   4. WXML 里用到的每个 class 都必须在 app.wxss 里有定义（防"看起来没样式"）
//
// 用法：node tools/weapp_static.mjs   （前置：node tools/build_weapp.mjs）

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const MP = join(ROOT, 'apps/weapp/miniprogram');

const failures = [];
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

// ---------------------------------------------------------------- 加载器（与 weapp_smoke 一致）

const wx = {
  getStorageSync: () => '',
  setStorageSync: () => {},
  navigateTo: () => {}, redirectTo: () => {}, reLaunch: () => {}, navigateBack: () => {},
  showToast: () => {}, getWindowInfo: () => ({ pixelRatio: 2 }),
  createSelectorQuery: () => ({
    in() { return this; }, select() { return this; }, fields() { return this; },
    exec(cb) { cb([null]); },
  }),
};

const pages = [];
function createLoader() {
  const cache = new Map();
  function load(file) {
    const full = resolve(file);
    if (cache.has(full)) { return cache.get(full).exports; }
    const mod = { exports: {} };
    cache.set(full, mod);
    const sandbox = {
      module: mod, exports: mod.exports, console, wx,
      Page: (options) => { pages.push(options); },
      App: () => {}, getApp: () => ({}),
      require: (id) => {
        let target = resolve(dirname(full), id);
        if (!existsSync(target) && existsSync(`${target}.js`)) { target = `${target}.js`; }
        return load(target);
      },
    };
    vm.createContext(sandbox);
    vm.runInContext(readFileSync(full, 'utf8'), sandbox, { filename: full });
    return mod.exports;
  }
  return load;
}

const load = createLoader();
const { core, resetModel, getModel } = load(join(MP, 'utils/model.js'));
const present = load(join(MP, 'utils/present.js'));

// ---------------------------------------------------------------- 取得各页面的完整数据键集合

/** 把状态推到各页面的所有分支，收集 present.* 产出的键 */
function collectDataKeys() {
  const keys = new Set();
  const merge = (obj) => { for (const k of Object.keys(obj)) { keys.add(k); } };

  resetModel(new core.MemoryStore());
  const model = getModel();

  merge(present.home(model));
  model.startTargetFlow('gate');
  merge(present.target(model));
  model.setQuery('a101');
  merge(present.target(model));
  model.setQuery('zzz不存在');
  merge(present.target(model));

  model.chooseTarget('xha_p4_gA101');
  merge(present.start(model));

  // 路线页：错误态 / 预览 / 指引 / 完成
  const broken = new core.AppModel(core.AIRPORT, new core.MemoryStore());
  broken.state.planner.startId = 'xha_p4_doorW';
  broken.state.planner.endId = '不存在';
  merge(present.route(broken));

  model.chooseStart('xha_p4_doorW');
  merge(present.route(model));
  model.beginGuidance();
  merge(present.route(model));
  while (model.state.planner.stage === 'guiding') { model.advance(); }
  merge(present.route(model));

  model.startMetroFlow();
  merge(present.metro(model));

  model.openBrowse();
  merge(present.browse(model));          // 未选中：显示节点列表
  model.setBrowseFloor('B2');
  merge(present.browse(model));          // 切层
  model.selectNode('xha_b2_platA');
  merge(present.browse(model));          // 选中：显示详情与两个操作按钮
  return keys;
}

const DATA_KEYS = collectDataKeys();
/** WXML 内置的循环别名与事件对象 */
const BUILTIN_IDENTIFIERS = new Set(['item', 'index', 'true', 'false', 'null', 'undefined']);

// ---------------------------------------------------------------- 解析 WXML

function readPages() {
  const appJson = JSON.parse(readFileSync(join(MP, 'app.json'), 'utf8'));
  return appJson.pages.map((page) => ({
    page,
    wxml: readFileSync(join(MP, `${page}.wxml`), 'utf8'),
    name: page.split('/')[1],
  }));
}

/** 收集 {{...}} 里的顶层标识符（忽略属性访问与字符串字面量） */
function identifiers(text) {
  const out = new Set();
  for (const match of text.matchAll(/\{\{([^}]*)\}\}/g)) {
    const expr = match[1];
    // 去掉引号里的内容，避免把中文提示词当标识符
    const cleaned = expr.replace(/'[^']*'/g, ' ').replace(/"[^"]*"/g, ' ');
    for (const token of cleaned.matchAll(/[A-Za-z_$][A-Za-z0-9_$]*/g)) {
      const name = token[0];
      const before = cleaned.slice(0, token.index);
      if (/[.[]$/.test(before.slice(-1))) { continue; }        // 属性访问的一部分
      out.add(name);
    }
  }
  return out;
}

function handlers(text) {
  const out = new Set();
  for (const match of text.matchAll(/\b(?:bind|catch)[a-z]*\s*=\s*"([^"{}]+)"/g)) {
    out.add(match[1].trim());
  }
  return out;
}

/**
 * 提取 class 属性里用到的类名：
 *   class="chip {{item.key === activeCategory ? 'chipOn' : ''}}"
 *   -> 静态部分 "chip" + 模板里的字面量 "chipOn"
 */
function classes(text) {
  const out = new Set();
  for (const match of text.matchAll(/class\s*=\s*"([^"]*)"/g)) {
    const raw = match[1];
    for (const literal of raw.matchAll(/'([a-zA-Z][a-zA-Z0-9_-]*)'/g)) { out.add(literal[1]); }
    const withoutExpr = raw.replace(/\{\{[^}]*\}\}/g, ' ');
    for (const token of withoutExpr.split(/\s+/)) {
      if (token.length > 0) { out.add(token); }
    }
  }
  return out;
}

const WXSS_CLASSES = (() => {
  const text = readFileSync(join(MP, 'app.wxss'), 'utf8');
  const out = new Set();
  for (const match of text.matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g)) { out.add(match[1]); }
  return out;
})();

// ---------------------------------------------------------------- 开始检查

console.log('小程序静态契约检查\n');
const pageList = readPages();

check('WXML 里的数据绑定都能由 present.* 产出', () => {
  const problems = [];
  for (const { name, wxml } of pageList) {
    for (const id of identifiers(wxml)) {
      if (DATA_KEYS.has(id) || BUILTIN_IDENTIFIERS.has(id)) { continue; }
      problems.push(`${name}: {{${id}}}`);
    }
  }
  assert(problems.length === 0, `未被任何 present.* 产出：${problems.join(', ')}`);
});

check('WXML 里的事件处理函数都在 Page 对象里定义', () => {
  pages.length = 0;
  for (const { page } of pageList) { load(join(MP, `${page}.js`)); }
  assert(pages.length === pageList.length, `只注册了 ${pages.length}/${pageList.length} 个页面`);

  const problems = [];
  pageList.forEach(({ name, wxml }, index) => {
    const options = pages[index];
    const available = new Set(Object.keys(options));
    for (const handler of handlers(wxml)) {
      if (!available.has(handler)) { problems.push(`${name}: ${handler}`); }
    }
  });
  assert(problems.length === 0, `Page 里没有这些方法：${problems.join(', ')}`);
});

check('每个 wx:for 都带 wx:key', () => {
  const problems = [];
  for (const { name, wxml } of pageList) {
    for (const tag of wxml.matchAll(/<[^>]*wx:for=[^>]*>/g)) {
      if (!tag[0].includes('wx:key')) { problems.push(`${name}: ${tag[0].slice(0, 60)}…`); }
    }
  }
  assert(problems.length === 0, `缺少 wx:key：\n      ${problems.join('\n      ')}`);
});

check('WXML 用到的 class 都在 app.wxss 里有定义', () => {
  const problems = [];
  for (const { name, wxml } of pageList) {
    for (const cls of classes(wxml)) {
      if (!WXSS_CLASSES.has(cls)) { problems.push(`${name}: .${cls}`); }
    }
  }
  assert(problems.length === 0, `app.wxss 缺少这些类：${problems.join(', ')}`);
});

check('页面文件与 app.json 登记一致，且没有多余页面目录', () => {
  const declared = new Set(pageList.map((p) => p.page));
  const dirs = readdirSync(join(MP, 'pages'), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => `pages/${d.name}/index`);
  assert(dirs.length === declared.size, `pages/ 下有 ${dirs.length} 个目录，app.json 登记了 ${declared.size} 个`);
  for (const dir of dirs) {
    assert(declared.has(dir), `${dir} 未登记进 app.json`);
  }
});

console.log('');
if (failures.length === 0) {
  console.log(`静态契约通过 ✔（${pageList.length} 个页面 / ${DATA_KEYS.size} 个数据键 / ${WXSS_CLASSES.size} 个样式类）`);
  process.exit(0);
}
console.log(`${failures.length} 项失败：`);
for (const f of failures) { console.log(`  - ${f}`); }
process.exit(1);
