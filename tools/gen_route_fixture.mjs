#!/usr/bin/env node
// 生成「跨语言寻路基准」：用 TypeScript 共享核心算出一批路线的完整结果，
// 作为 Swift（以及将来的小程序）端逐节点对齐的黄金样本。
//
// 为什么需要它：各端各自实现寻路时，"代码看起来一样"不算证据。这里把 TS 端的
// 真实输出（节点序列、米数、是否过安检、步骤序列）固化成 JSON，Swift 测试逐条比对，
// 一旦某端选路不同（哪怕总米数相同但走了另一条并列最短路）就会红。
//
// 用法：node tools/gen_route_fixture.mjs
//   产出：packages/core/test/fixtures/routes.json
//         apps/apple/Tests/AirportCoreTests/Fixtures/routes.json

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  AIRPORT, planRoute, buildRouteView, PREF_SHORTEST, PREF_ELEVATOR,
  PREF_ESCALATOR, PREF_AVOID_STAIR, MAP_SHA256,
} from '../packages/core/src/index.ts';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const PREFS = [PREF_SHORTEST, PREF_ELEVATOR, PREF_ESCALATOR, PREF_AVOID_STAIR];

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

const GOLDEN = [
  ['xha_p4_doorW', 'xha_p4_gC308'],
  ['xha_p4_doorE', 'xha_p3_loungeA'],
  ['xha_p1_taxi', 'xha_p4_gA101'],
  ['xha_b2_platA', 'xha_p4_airMall'],
  ['xha_p2_bagA', 'xha_p4_doorW'],
  ['xha_b1_gtc', 'xha_b2_platB'],
];

const ids = AIRPORT.nodes.map((n) => n.id);
const rand = mulberry32(20260914);
const pairs = [];
for (const [a, b] of GOLDEN) { pairs.push([a, b]); }
for (let i = 0; i < 200; i++) {
  const a = ids[Math.floor(rand() * ids.length)];
  let b = ids[Math.floor(rand() * ids.length)];
  if (a === b) {
    b = ids.find((id) => id !== a && AIRPORT.node(id).side !== AIRPORT.node(a).side) ?? ids[0];
  }
  pairs.push([a, b]);
}

function snapshot(start, end, pref) {
  const view = buildRouteView(AIRPORT, start, end, pref);
  if (view.status !== 'ready') {
    // 与各端一致：状态不 ready 时不做寻路（planRoute 对非法 id 会抛错）
    return {
      start, end, pref, status: view.status,
      nodeIds: [], totalMeters: 0, viaSecurity: false,
      legs: [], transitions: [], steps: [], walkingMeters: 0,
    };
  }
  const route = planRoute(AIRPORT, start, end, pref);
  return {
    start,
    end,
    pref,
    status: view.status,
    nodeIds: route.nodeIds,
    totalMeters: route.totalMeters,
    viaSecurity: route.viaSecurity,
    legs: route.legs.map((l) => ({ floor: l.floor, count: l.nodeIds.length, meters: l.meters })),
    transitions: route.transitions.map((t) => ({
      fromId: t.fromId, toId: t.toId, viaType: t.viaType, fromFloor: t.fromFloor, toFloor: t.toFloor, meters: t.meters,
    })),
    steps: view.steps.map((s) => ({
      kind: s.kind, fromId: s.fromId, toId: s.toId, floor: s.floor, toFloor: s.toFloor, meters: s.meters, facility: s.facility,
    })),
    walkingMeters: view.walkingMeters,
  };
}

const routes = [];
for (const [start, end] of pairs) {
  for (const pref of PREFS) {
    routes.push(snapshot(start, end, pref));
  }
}

// 额外固定几条边界状态，供各端断言"异常分支也一致"
const edgeCases = [
  ['', 'xha_p4_gA101'],
  ['xha_p4_gA101', ''],
  ['not_a_node', 'xha_p4_gA101'],
  ['xha_p4_gA101', 'xha_p4_gA101'],
].map(([start, end]) => snapshot(start, end, PREF_SHORTEST));

const fixture = {
  schema: 1,
  generator: 'tools/gen_route_fixture.mjs',
  sourceMapSha256: MAP_SHA256,
  nodeCount: AIRPORT.nodes.length,
  edgeCount: AIRPORT.edges.length,
  prefCount: PREFS.length,
  routeCount: routes.length,
  routes,
  edgeCases,
};

// 紧凑输出：这是生成物、由测试逐字段消费，缩进只会让 diff 变成十几万行噪声
const body = JSON.stringify(fixture);
const targets = [
  join(ROOT, 'packages/core/test/fixtures/routes.json'),
  join(ROOT, 'apps/apple/Tests/AirportCoreTests/Fixtures/routes.json'),
];
for (const path of targets) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body);
  console.log(`写出 ${path.replace(ROOT + '/', '')}  (${body.length} 字节)`);
}
console.log(`共 ${routes.length} 条路线（${pairs.length} 组起终点 × ${PREFS.length} 档偏好）+ ${edgeCases.length} 条边界样本`);
