#!/usr/bin/env node
// 生成「渲染命令流」的跨语言基准：用 TypeScript 共享核心算出若干场景的完整命令序列，
// 供 Swift 端逐命令比对。
//
// 为什么需要它：寻路已经有 824 条路线基准（tools/gen_route_fixture.mjs），
// 但渲染是另一份实现（Swift 的 MapRenderer），它的图层顺序/用色/几何只要有一处写错，
// 观感就会不同 —— 而且这类错误在设备上很难发现。这里把命令流固化成 JSON，
// 让"三端画同一张图"从口头承诺变成可断言的事实。
//
// 用法：node tools/gen_render_fixture.mjs
//   产出：packages/core/test/fixtures/render.json
//         apps/apple/Tests/AirportCoreTests/Fixtures/render.json

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  AIRPORT, Viewport, renderFloor, planRoute, PREF_SHORTEST, MAP_SHA256,
} from '../packages/core/src/index.ts';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

/** 场景：视口参数显式给出，避免把"适配函数"的差异混进渲染比对 */
function viewportFor(floor, width, height) {
  const vp = new Viewport();
  vp.fitInsets(AIRPORT.floorBBox(floor), width, height, 24, 48, 72, 78);
  return vp;
}

const routeDoorW = planRoute(AIRPORT, 'xha_p4_doorW', 'xha_p4_gA101', PREF_SHORTEST);
const routeMetro = planRoute(AIRPORT, 'xha_b2_platA', 'xha_p4_airMall', PREF_SHORTEST);

const scenarios = [
  { name: '4F-漫游-无路线', floor: '4F', width: 380, height: 320, en: false },
  { name: '4F-漫游-英文', floor: '4F', width: 380, height: 320, en: true },
  { name: '4F-路线-全程', floor: '4F', width: 360, height: 300, en: false, route: routeDoorW, currentIndex: routeDoorW.nodeIds.length - 1, startId: 'xha_p4_doorW', endId: 'xha_p4_gA101' },
  { name: '4F-路线-当前段', floor: '4F', width: 360, height: 300, en: false, route: routeDoorW, currentIndex: 3, startId: 'xha_p4_doorW', endId: 'xha_p4_gA101' },
  { name: 'B2-路线-换乘', floor: 'B2', width: 360, height: 300, en: false, route: routeMetro, currentIndex: 2, startId: 'xha_b2_platA', endId: 'xha_p4_airMall' },
  { name: 'B1-漫游', floor: 'B1', width: 380, height: 320, en: false },
  { name: '2F-漫游', floor: '2F', width: 380, height: 320, en: false },
  { name: '4F-放大到出标签', floor: '4F', width: 380, height: 320, en: false, zoom: 3 },
  { name: '4F-放大-英文标签', floor: '4F', width: 380, height: 320, en: true, zoom: 3 },
  { name: '4F-缩小到无标签', floor: '4F', width: 380, height: 320, en: false, zoom: 0.35 },
];

const cases = scenarios.map((scenario) => {
  let viewport = viewportFor(scenario.floor, scenario.width, scenario.height);
  if (scenario.zoom !== undefined) {
    viewport.pinch(scenario.width / 2, scenario.height / 2, scenario.zoom / viewport.zoom);
  }
  const commands = renderFloor(AIRPORT, {
    floor: scenario.floor,
    viewport,
    width: scenario.width,
    height: scenario.height,
    routeNodeIds: scenario.route === undefined ? [] : scenario.route.nodeIds,
    currentRouteIndex: scenario.currentIndex ?? -1,
    startId: scenario.startId ?? '',
    endId: scenario.endId ?? '',
    en: scenario.en,
  });
  return {
    name: scenario.name,
    input: {
      floor: scenario.floor,
      width: scenario.width,
      height: scenario.height,
      zoom: viewport.zoom,
      tx: viewport.tx,
      ty: viewport.ty,
      routeNodeIds: scenario.route === undefined ? [] : scenario.route.nodeIds,
      currentRouteIndex: scenario.currentIndex ?? -1,
      startId: scenario.startId ?? '',
      endId: scenario.endId ?? '',
      en: scenario.en,
    },
    commandCount: commands.length,
    commands,
  };
});

const fixture = {
  schema: 1,
  generator: 'tools/gen_render_fixture.mjs',
  sourceMapSha256: MAP_SHA256,
  caseCount: cases.length,
  cases,
};

const body = JSON.stringify(fixture);
const targets = [
  join(ROOT, 'packages/core/test/fixtures/render.json'),
  join(ROOT, 'apps/apple/Tests/AirportCoreTests/Fixtures/render.json'),
];
for (const path of targets) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body);
  console.log(`写出 ${path.replace(ROOT + '/', '')}  (${(body.length / 1024).toFixed(0)} KB)`);
}

const total = cases.reduce((sum, c) => sum + c.commandCount, 0);
console.log(`共 ${cases.length} 个场景 / ${total} 条命令`);
for (const c of cases) {
  console.log(`  ${c.name.padEnd(22)} ${String(c.commandCount).padStart(4)} 条命令`);
}
