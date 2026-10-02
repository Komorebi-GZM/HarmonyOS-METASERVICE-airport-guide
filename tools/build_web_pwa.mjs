#!/usr/bin/env node
// Web 端 PWA 收尾：把 vite 的构建产物变成可离线安装的应用。
//
// 做三件事（都在 dist/ 里，不改源码）：
//   1. 生成带内容指纹的 service worker：预缓存 app shell + 全部 JS/CSS/图标/清单
//   2. 校验 dist/index.html 引用了 manifest、且产物里确实有它
//   3. 输出预缓存体积，便于观察包体
//
// 为什么不用 vite-plugin-pwa：本项目刻意保持"零额外依赖"，用 30 行脚本生成 sw.js
// 反而更好审计（预缓存清单就是构建产物本身）。数据随包、无网络请求，所以缓存策略只需 cache-first。
//
// 用法：node tools/build_web_pwa.mjs   （前置：pnpm --filter @airport-guide/web build）

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DIST = join(ROOT, 'apps/web/dist');
const CACHE_PREFIX = 'airport-guide';

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

if (!existsSync(join(DIST, 'index.html'))) {
  console.error('缺少 apps/web/dist，请先运行：pnpm --filter @airport-guide/web build');
  process.exit(2);
}

/** 递归列出 dist 下的文件（相对路径，正斜杠） */
function listFiles(dir, base = dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) { out.push(...listFiles(full, base)); }
    else { out.push(relative(base, full).split('\\').join('/')); }
  }
  return out;
}

/** 需要预缓存的资源：app shell + 构建产物 + 图标/清单（排除 sourcemap 与 sw 自身） */
function precacheList() {
  const all = listFiles(DIST);
  return all
    .filter((f) => f !== 'sw.js' && !f.endsWith('.map'))
    .sort();
}

function cacheVersion(files) {
  // 用文件清单 + 大小做版本：内容变了版本就变，避免旧缓存
  const stamp = files.map((f) => `${f}:${statSync(join(DIST, f)).size}`).join('|');
  let hash = 0;
  for (let i = 0; i < stamp.length; i++) {
    hash = (hash * 31 + stamp.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

const files = precacheList();
const version = cacheVersion(files);
const cacheName = `${CACHE_PREFIX}-${version}`;

const sw = `// 由 tools/build_web_pwa.mjs 生成，请勿手改。
// 缓存版本：${cacheName}（内容指纹来自预缓存清单的文件名与体积）
const CACHE = '${cacheName}';
const PRECACHE = ${JSON.stringify(files, null, 2)};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 纯端侧应用：cache-first 即可；命中缓存直接返回，未命中才走网络（首次加载）
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') { return; }
  event.respondWith(
    caches.match(event.request).then((hit) => hit || fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match('./index.html')))
  );
});
`;

writeFileSync(join(DIST, 'sw.js'), sw);

console.log('Web PWA 收尾\n');

check('service worker 已生成且预缓存了全部构建产物', () => {
  const text = readFileSync(join(DIST, 'sw.js'), 'utf8');
  assert(text.includes(`const CACHE = '${cacheName}'`), '缓存版本缺失');
  for (const need of ['index.html']) {
    assert(text.includes(`"${need}"`), `未预缓存 ${need}`);
  }
  const js = readFileSync(join(DIST, 'index.html'), 'utf8').match(/assets\/[^"]+\.js/);
  const css = readFileSync(join(DIST, 'index.html'), 'utf8').match(/assets\/[^"]+\.css/);
  assert(js !== null, 'index.html 里找不到 JS 产物');
  assert(text.includes(js[0]), `未预缓存 ${js[0]}`);
  if (css !== null) { assert(text.includes(css[0]), `未预缓存 ${css[0]}`); }
  assert(!text.includes('.map"'), 'sourcemap 不应进预缓存');
});

check('index.html 引用了 manifest，且清单文件在产物里', () => {
  const html = readFileSync(join(DIST, 'index.html'), 'utf8');
  assert(/rel="manifest"/.test(html), 'index.html 缺少 <link rel="manifest">');
  for (const file of ['manifest.webmanifest', 'icon.svg', 'icon-maskable.svg']) {
    assert(existsSync(join(DIST, file)), `dist 里缺少 ${file}`);
  }
  const manifest = JSON.parse(readFileSync(join(DIST, 'manifest.webmanifest'), 'utf8'));
  assert(manifest.display === 'standalone', 'display 应为 standalone');
  assert(Array.isArray(manifest.icons) && manifest.icons.length >= 2, '图标清单不完整');
  assert(/^#/.test(manifest.theme_color), 'theme_color 应为色值');
});

check('预缓存体积在合理范围', () => {
  const bytes = files.reduce((sum, f) => sum + statSync(join(DIST, f)).size, 0);
  const kb = bytes / 1024;
  assert(kb < 800, `预缓存 ${kb.toFixed(0)} KB 偏大`);
  console.log(`      （预缓存 ${files.length} 个文件 / ${kb.toFixed(0)} KB，缓存名 ${cacheName}）`);
});

console.log('');
if (failures.length === 0) {
  console.log('PWA 检查通过 ✔（离线可用：app shell 与全部产物已预缓存）');
  process.exit(0);
}
console.log(`${failures.length} 项失败：`);
for (const f of failures) { console.log(`  - ${f}`); }
process.exit(1);
