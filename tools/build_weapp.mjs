#!/usr/bin/env node
// 把平台无关的共享核心打包成「微信小程序可直接 require 的单文件」。
//
// 为什么需要打包：小程序不支持 TypeScript、也不支持 ESM，只认 CommonJS 的 require()。
// 核心本身（packages/core）是纯逻辑、无平台 API，因此可以原样打包，不需要为小程序改一行代码。
//
// 用法：node tools/build_weapp.mjs
//   产出：apps/weapp/miniprogram/utils/core.js（生成物，勿手改）

import { build } from 'esbuild';
import { readFileSync, statSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const ENTRY = join(ROOT, 'packages/core/src/index.ts');
const OUT = join(ROOT, 'apps/weapp/miniprogram/utils/core.js');

mkdirSync(dirname(OUT), { recursive: true });

const result = await build({
  entryPoints: [ENTRY],
  outfile: OUT,
  bundle: true,
  format: 'cjs',
  platform: 'neutral',
  // 小程序 JS 引擎（iOS JavaScriptCore / Android V8）支持 ES2017 足够
  target: ['es2017'],
  charset: 'utf8',
  legalComments: 'none',
  banner: {
    js: '// 本文件由 tools/build_weapp.mjs 从 packages/core 打包生成，请勿手改。\n'
      + '// 重新生成：node tools/build_weapp.mjs',
  },
  metafile: true,
});

const size = statSync(OUT).size;
const inputs = Object.entries(result.metafile.outputs)[0]?.[1]?.inputs ?? {};
const moduleCount = Object.keys(inputs).length;

console.log(`已生成 apps/weapp/miniprogram/utils/core.js`);
console.log(`  体积 ${(size / 1024).toFixed(1)} KB · 合并 ${moduleCount} 个模块 · 目标 es2017/CommonJS`);

// 自检：产物必须是 CommonJS 且能被 Node 加载（Node 的 CJS 与小程序 require 语义一致）
const code = readFileSync(OUT, 'utf8');
if (!code.includes('module.exports')) {
  console.error('✘ 产物不是 CommonJS，小程序无法 require');
  process.exit(1);
}
// 用 vm 以 CommonJS 语义加载产物：仓库根是 "type": "module"，
// 直接 require() 会把这个 .js 当 ESM（小程序侧没有这个概念，不受影响）。
const vm = await import('node:vm');
const sandbox = { module: { exports: {} }, exports: {}, console, require: () => { throw new Error('产物不应有外部依赖'); } };
sandbox.exports = sandbox.module.exports;
vm.createContext(sandbox);
vm.runInContext(code, sandbox, { filename: 'core.js' });
const mod = sandbox.module.exports;
const required = ['AIRPORT', 'AppModel', 'MemoryStore', 'renderFloor', 'hitTest', 'planRoute', 't', 'summary'];
const missing = required.filter((name) => mod[name] === undefined);
if (missing.length > 0) {
  console.error(`✘ 产物缺少导出：${missing.join(', ')}`);
  process.exit(1);
}
if (mod.AIRPORT.nodes.length !== 119) {
  console.error(`✘ 产物里的地图节点数异常：${mod.AIRPORT.nodes.length}`);
  process.exit(1);
}
console.log(`  ✔ 自检通过：可 require，导出 ${Object.keys(mod).length} 个符号，地图 ${mod.AIRPORT.nodes.length} 节点`);
