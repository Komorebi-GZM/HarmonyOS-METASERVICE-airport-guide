#!/usr/bin/env node
// Web 端端到端冒烟：在 Node 里用最小 DOM 桩跑通构建产物，验证六页流程真能点通。
//
// 为什么不用真浏览器：本机 Chrome headless 在当前沙箱里会挂起，Orca 的 CLI 也不可用。
// 这个脚本的价值在于**真的执行打包后的应用代码**，覆盖"首页渲染 → 选目的地 →
// 选出发位置 → 路线预览 → 开始指引 → 完成"这条主链路，能抓住 DOM 层的低级错误。
//
// 用法：node tools/web_smoke.mjs
//   前置：pnpm --filter @airport-guide/web build

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DIST = join(ROOT, 'apps/web/dist');
const drawCalls = [];
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

// ----------------------------------------------------------------- DOM 桩

class StubNode {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase();
    this.children = [];
    this.parentNode = null;
    this.attrs = {};
    this.style = {};
    this.listeners = {};
    this.className = '';
    this.value = '';
    this.disabled = false;
  }
  get classList() {
    const self = this;
    const list = () => self.className.split(/\s+/).filter((x) => x.length > 0);
    return {
      add: (c) => { if (!list().includes(c)) { self.className = [...list(), c].join(' '); } },
      remove: (c) => { self.className = list().filter((x) => x !== c).join(' '); },
      contains: (c) => list().includes(c),
      toggle: (c) => { if (list().includes(c)) { self.className = list().filter((x) => x !== c).join(' '); } else { self.className = [...list(), c].join(' '); } },
    };
  }
  appendChild(node) {
    if (node === null || node === undefined) { return node; }
    node.parentNode = this;
    this.children.push(node);
    return node;
  }
  append(...nodes) { for (const n of nodes) { this.appendChild(n); } }
  replaceChildren(...nodes) {
    this.children = [];
    for (const n of nodes) { this.appendChild(n); }
  }
  replaceWith(node) {
    const parent = this.parentNode;
    if (parent === null) { return; }
    const idx = parent.children.indexOf(this);
    if (idx >= 0) {
      node.parentNode = parent;
      parent.children[idx] = node;
    }
  }
  remove() {
    const parent = this.parentNode;
    if (parent === null) { return; }
    const idx = parent.children.indexOf(this);
    if (idx >= 0) { parent.children.splice(idx, 1); }
  }
  setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'id') { byId.set(String(v), this); } if (k === 'class') { this.className = String(v); } }
  getAttribute(k) { return this.attrs[k]; }
  addEventListener(type, fn) { (this.listeners[type] ??= []).push(fn); }
  removeEventListener(type, fn) { this.listeners[type] = (this.listeners[type] ?? []).filter((f) => f !== fn); }
  dispatch(type, event = {}) {
    for (const fn of this.listeners[type] ?? []) { fn(event); }
  }
  click() { this.dispatch('click', { target: this }); this.dispatch('pointerdown', { pointerId: 1, clientX: 0, clientY: 0 }); }
  focus() {}
  blur() {}
  setSelectionRange() {}
  setPointerCapture() {}
  releasePointerCapture() {}
  getBoundingClientRect() { return { width: 380, height: 300, left: 0, top: 0, right: 380, bottom: 300, x: 0, y: 0 }; }
  getContext() { return canvasCtx; }
  get textContent() {
    let out = this._text ?? '';
    for (const c of this.children) { out += typeof c === 'string' ? c : c.textContent; }
    return out;
  }
  set textContent(v) { this._text = String(v); this.children = []; }
  set innerHTML(v) { this._text = String(v); this.children = []; }
  get innerHTML() { return this._text ?? ''; }
  querySelector(sel) { return queryAll(this, sel)[0] ?? null; }
  querySelectorAll(sel) { return queryAll(this, sel); }
}

function walk(node, out) {
  for (const c of node.children ?? []) {
    if (typeof c === 'string' || !(c instanceof StubNode)) { continue; }
    out.push(c);
    walk(c, out);
  }
  return out;
}

function matches(el, sel) {
  if (sel.startsWith('.')) { return el.className.split(/\s+/).includes(sel.slice(1)); }
  if (sel.startsWith('#')) { return el.attrs.id === sel.slice(1); }
  return el.tagName === sel.toUpperCase();
}

function queryAll(root, sel) {
  return walk(root, []).filter((el) => matches(el, sel));
}

const byId = new Map();
const canvasCtxLog = drawCalls;
const canvasCtx = new Proxy({}, {
  get(target, key) {
    if (key in target) { return target[key]; }
    if (key === 'measureText') { return () => ({ width: 14 }); }
    return (...args) => { canvasCtxLog.push([String(key), args]); };
  },
  set(target, key, value) { target[key] = value; return true; },
});

class StubText {
  constructor(text) { this._text = String(text); }
  get textContent() { return this._text; }
  set textContent(v) { this._text = String(v); }
}

const documentStub = {
  createElement: (tag) => new StubNode(tag),
  createTextNode: (text) => new StubText(text),
  getElementById: (id) => byId.get(id) ?? null,
  querySelector: (sel) => queryAll(rootEl, sel)[0] ?? null,
  querySelectorAll: (sel) => queryAll(rootEl, sel),
  body: new StubNode('body'),
  documentElement: new StubNode('html'),
};

const rootEl = new StubNode('div');
rootEl.setAttribute('id', 'app');

const store = new Map();
const localStorageStub = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)); },
  removeItem: (k) => { store.delete(k); },
};

globalThis.document = documentStub;
globalThis.window = {
  localStorage: localStorageStub,
  devicePixelRatio: 2,
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (id) => clearTimeout(id),
  addEventListener: () => {},
  matchMedia: () => ({ matches: false, addEventListener: () => {} }),
};
globalThis.localStorage = localStorageStub;
// 注：Node 自带 navigator 且没有 serviceWorker，PWA 注册分支会自然跳过，无需额外打桩
globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
globalThis.MutationObserver = class { observe() {} disconnect() {} takeRecords() { return []; } };
globalThis.fetch = () => Promise.resolve({ ok: true, text: () => Promise.resolve('') });
globalThis.requestAnimationFrame = (fn) => setTimeout(() => fn(Date.now()), 0);
globalThis.HTMLElement = StubNode;

// ----------------------------------------------------------------- 执行

if (!existsSync(join(DIST, 'index.html'))) {
  console.error('缺少 apps/web/dist，请先运行：pnpm --filter @airport-guide/web build');
  process.exit(2);
}

const html = readFileSync(join(DIST, 'index.html'), 'utf8');
const assetMatch = html.match(/src="\.?\/?(assets\/[^"]+\.js)"/);
if (assetMatch === null) {
  console.error('dist/index.html 里找不到 JS 产物');
  process.exit(2);
}
const assetPath = join(DIST, assetMatch[1]);
console.log(`加载构建产物：${assetMatch[1]}`);
await import(pathToFileURL(assetPath).href);

function buttons() { return queryAll(rootEl, 'button'); }
function findByText(text) {
  return buttons().find((b) => b.textContent.includes(text)) ?? null;
}
function text() { return rootEl.textContent; }

console.log('\n断言：');

check('首页渲染出标题与三张主卡片', () => {
  const t = text();
  for (const s of ['你想去哪里', '去登机口', '坐地铁', '找设施', '常用目的地']) {
    if (!t.includes(s)) { throw new Error(`首页缺少「${s}」`); }
  }
});

check('首页含热门目的地与楼层入口', () => {
  const t = text();
  if (!t.includes('查看楼层地图')) { throw new Error('缺少楼层地图入口'); }
  const quick = queryAll(rootEl, 'button').filter((b) => b.className.includes('quick'));
  if (quick.length < 4) { throw new Error(`热门目的地卡片过少：${quick.length}`); }
});

check('点「去登机口」进入目的地选择页', () => {
  const btn = findByText('去登机口');
  if (btn === null) { throw new Error('找不到按钮'); }
  btn.click();
  const t = text();
  if (!t.includes('选择目的地')) { throw new Error('未进入目的地页'); }
  if (!t.includes('登机口')) { throw new Error('分类 chips 缺失'); }
});

check('搜索框能按登机口编号过滤（A101）', () => {
  const input = queryAll(rootEl, 'input').find((i) => i.className.includes('search'));
  if (input === undefined) { throw new Error('找不到搜索框'); }
  input.value = 'a101';
  input.dispatch('input', { target: input });
  const t = text();
  if (!t.includes('A101')) { throw new Error('搜索结果里没有 A101'); }
  if (t.includes('行李提取')) { throw new Error('搜索结果未过滤'); }
});

check('选目的地后进入出发位置页', () => {
  const row = buttons().find((b) => b.textContent.includes('A101'));
  if (row === undefined) { throw new Error('找不到 A101 行'); }
  row.click();
  const t = text();
  if (!t.includes('出发位置') && !t.includes('你现在在哪里')) { throw new Error('未进入出发位置页'); }
  if (!t.includes('常见出发位置')) { throw new Error('快捷起点缺失'); }
});

check('选起点后进入路线预览：米数 / 安检提示 / 四档偏好', () => {
  const quick = buttons().find((b) => b.textContent.includes('西出发门'));
  if (quick === undefined) { throw new Error('找不到「西出发门」快捷起点'); }
  quick.click();
  const t = text();
  if (!t.includes('路线预览')) { throw new Error('未进入路线预览'); }
  if (!/步行约 \d+ 米/.test(t)) { throw new Error('缺少步行米数'); }
  if (!t.includes('中央安检')) { throw new Error('陆→空应提示必经中央安检'); }
  for (const p of ['推荐路线', '优先电梯', '优先扶梯', '尽量少走楼梯']) {
    if (!t.includes(p)) { throw new Error(`缺少偏好档 ${p}`); }
  }
  if (!t.includes('开始指引')) { throw new Error('缺少开始指引按钮'); }
});

check('地图画布真的被绘制（Canvas 2D 调用非空）', () => {
  if (drawCalls.length < 20) { throw new Error(`绘制调用过少：${drawCalls.length}`); }
  const names = new Set(drawCalls.map((c) => c[0]));
  for (const need of ['clearRect', 'fillRect', 'arc', 'stroke', 'fillText']) {
    if (!names.has(need)) { throw new Error(`缺少绘制调用 ${need}`); }
  }
});

check('「修改出发位置」进入出发位置页（而不是目的地页），且不改动目的地', () => {
  const before = JSON.parse(localStorageStub.getItem('airport-guide') || '{}');
  const editBtn = findByText('修改出发位置');
  if (editBtn === null) { throw new Error('找不到「修改出发位置」'); }
  editBtn.click();
  const t = text();
  if (t.includes('选择目的地')) { throw new Error('错误地进入了目的地页（历史 bug：会覆盖目的地）'); }
  if (!t.includes('出发位置') && !t.includes('你现在在哪里')) { throw new Error('未进入出发位置页'); }
  const quick = buttons().find((b) => b.textContent.includes('北出发门'));
  if (quick === undefined) { throw new Error('找不到「北出发门」'); }
  quick.click();
  if (!text().includes('路线预览')) { throw new Error('选完起点未回到路线预览'); }
  const after = JSON.parse(localStorageStub.getItem('airport-guide') || '{}');
  if (JSON.stringify(before.recent) !== JSON.stringify(after.recent)) {
    throw new Error('仅修改起点不应改写最近目的地');
  }
});

check('切换偏好到「优先电梯」后仍在预览且偏好态生效', () => {
  const chip = findByText('优先电梯');
  if (chip === null) { throw new Error('找不到偏好 chip'); }
  chip.click();
  const t = text();
  if (!t.includes('路线预览')) { throw new Error('切换偏好后离开了预览'); }
  const active = buttons().filter((b) => b.className.includes('chip-active')).map((b) => b.textContent);
  if (!active.some((x) => x.includes('优先电梯'))) { throw new Error('偏好未高亮'); }
});

check('开始指引进入逐步模式并显示步骤计数', () => {
  const btn = findByText('开始指引');
  if (btn === null) { throw new Error('找不到开始指引'); }
  btn.click();
  const t = text();
  if (!t.includes('正在指引')) { throw new Error('未进入指引态'); }
  if (!/步骤 1\/\d+/.test(t)) { throw new Error('缺少步骤计数'); }
  if (!t.includes('查看全程步骤')) { throw new Error('缺少全程步骤入口'); }
});

check('逐步确认能走到完成页', () => {
  for (let i = 0; i < 12; i++) {
    if (text().includes('本次指引已完成')) { break; }
    const next = buttons().find((b) => b.className.includes('btn-primary'));
    if (next === undefined) { throw new Error(`第 ${i + 1} 步找不到主操作按钮`); }
    next.click();
  }
  if (!text().includes('本次指引已完成')) { throw new Error('走不到完成页'); }
  if (!text().includes('规划新的路线')) { throw new Error('完成页缺少重新规划入口'); }
});

check('上一步能回到指引态（状态机可逆）', () => {
  const btn = findByText('上一步');
  if (btn !== null) { btn.click(); }
  const back = findByText('规划新的路线');
  if (back !== null) { back.click(); }
  if (!text().includes('你想去哪里')) { throw new Error('重新规划未回到首页'); }
});

check('本地存储写入了最近目的地与语言', () => {
  const raw = localStorageStub.getItem('airport-guide');
  if (raw === null) { throw new Error('未写入 localStorage'); }
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed.recent) || parsed.recent.length === 0) { throw new Error('recent 未记录'); }
  if (parsed.recent[0] !== 'xha_p4_gA101') { throw new Error(`recent[0] 应为 A101，实际 ${parsed.recent[0]}`); }
});

check('中英切换生效', () => {
  const lang = buttons().find((b) => b.textContent === 'EN' || b.textContent === '中');
  if (lang === undefined) { throw new Error('找不到语言切换'); }
  lang.click();
  if (!text().includes('Where would you like to go')) { throw new Error('未切到英文'); }
  const back = buttons().find((b) => b.textContent === 'EN' || b.textContent === '中');
  back?.click();
});

check('楼层地图页可切换楼层并选中节点', () => {
  const floors = findByText('查看楼层地图');
  if (floors === null) { throw new Error('首页缺少楼层地图入口'); }
  floors.click();
  if (!text().includes('楼层地图')) { throw new Error('未进入楼层页'); }
  const tab = buttons().find((b) => b.textContent.trim() === 'B2');
  if (tab === undefined) { throw new Error('找不到 B2 楼层 chip'); }
  tab.click();
  if (!text().includes('B2')) { throw new Error('楼层未切换'); }
  const row = buttons().find((b) => b.textContent.includes('站台'));
  if (row !== undefined) {
    row.click();
    if (!text().includes('我在这里') || !text().includes('去这里')) {
      throw new Error('选中节点后未出现操作按钮');
    }
  }
});



console.log('');
if (failures.length === 0) {
  console.log(`全部通过 ✔（Canvas 绘制调用 ${drawCalls.length} 次）`);
  process.exit(0);
}
console.log(`${failures.length} 项失败：`);
for (const f of failures) { console.log(`  - ${f}`); }
process.exit(1);
