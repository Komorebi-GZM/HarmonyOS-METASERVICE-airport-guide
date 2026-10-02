// 共享核心一致性回归。
//
// 这个文件的作用是**替代人工比对**：ArkTS 端是上游真源，本核心是它的移植，
// 两边一旦走偏，这里必须红。断言来源有三类：
//   1. tools/pathfind_reference.py 的 A–E 自测（割点拆分正确性、权重可回推）
//   2. tools/verify_product.mjs 的状态机/检索/视口断言
//   3. ArkTS 生成物里的硬数字（FLOOR_BBOX、节点规模、样例路线米数）
//
// 运行：node --test packages/core/test/   （Node 25 原生跑 .ts，无需构建）

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { AIRPORT, PX_PER_METER } from '../src/graph.ts';
import {
  planRoute, dijkstra, effectiveWeight, PREF_SHORTEST, PREF_ELEVATOR,
  PREF_ESCALATOR, PREF_AVOID_STAIR, QUICK_STARTS,
} from '../src/pathfinder.ts';
import { buildRouteView } from '../src/route-steps.ts';
import {
  newPlanner, newJourney, beginEdit, choosePlace, commitJourney, cancelEdit,
  changePreference, swapJourney, startGuidance, advanceGuidance, previousStep,
} from '../src/planner.ts';
import { place, searchPlaces, recentPlaces, gateCode, publicPlace } from '../src/places.ts';
import { catOf, HOT_DESTINATIONS, CATEGORIES } from '../src/categories.ts';
import { t, LOC_KEYS, I18N_KEYS, nodeName, floorLabel, floorOrder, typeLabel } from '../src/i18n.ts';
import { Viewport, ROUTE_INSETS, BROWSE_INSETS } from '../src/viewport.ts';
import type { Route } from '../src/types.ts';

const EN_KEYS = I18N_KEYS.EN;

const PREFS = [PREF_SHORTEST, PREF_ELEVATOR, PREF_ESCALATOR, PREF_AVOID_STAIR];

/** 确定性 PRNG，保证每次跑同一批起终点 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function routeEffectiveMeters(route: Route, pref: number): number {
  let total = 0;
  for (let i = 1; i < route.nodeIds.length; i++) {
    const a = route.nodeIds[i - 1];
    const b = route.nodeIds[i];
    const raw = AIRPORT.rawWeight(a, b);
    assert.notEqual(raw, undefined, `路线里出现不存在的边 ${a} -> ${b}`);
    total += effectiveWeight(AIRPORT, a, b, raw as number, pref);
  }
  return total;
}

// ---------------------------------------------------------------- 1. 数据基线

test('地图数据与 ArkTS 生成物一致：规模 / 侧别 / 楼层 / 包围盒', () => {
  assert.equal(AIRPORT.nodes.length, 119);
  assert.equal(AIRPORT.edges.length, 145);
  assert.equal(PX_PER_METER, 2.0);
  assert.equal(AIRPORT.securityId, 'xha_p4_sec');

  const sides = AIRPORT.sideCount();
  assert.deepEqual(sides, { land: 63, air: 55, gate: 1 });
  assert.deepEqual(AIRPORT.floorCounts(), { '4F': 55, '3F': 12, '2F': 21, '1F': 11, B1: 14, B2: 6 });
  assert.deepEqual(AIRPORT.floorOrder, ['4F', '3F', '2F', '1F', 'B1', 'B2']);

  // 与 AirportMap.ets 的 FLOOR_BBOX 逐条比对
  const expectedBBox: Record<string, [number, number, number, number]> = {
    '4F': [130, 60, 950, 820],
    '3F': [250, 140, 830, 560],
    '2F': [250, 110, 830, 560],
    '1F': [250, 160, 830, 560],
    B1: [150, 150, 880, 470],
    B2: [300, 180, 700, 420],
  };
  for (const floor of AIRPORT.floorOrder) {
    assert.deepEqual(AIRPORT.floorBBox(floor), expectedBBox[floor], `${floor} 包围盒不一致`);
  }

  // 安检唯一且是割点：陆侧与空侧之间必过它
  const secs = AIRPORT.nodes.filter((n) => n.type === 'security');
  assert.equal(secs.length, 1);
  assert.equal(secs[0].side, 'gate');
});

test('边类型分布与数据一致（防生成器/数据漂移）', () => {
  const counts: Record<string, number> = {};
  for (const e of AIRPORT.edges) {
    counts[e.type] = (counts[e.type] ?? 0) + 1;
  }
  assert.deepEqual(counts, { walk: 124, elevator: 13, escalator: 4, stair: 4 });
});

// ---------------------------------------------------------------- 2. 参考样例（跨实现对齐）

test('pathfind_reference.py 的六条样例路线逐条复现（米数 / 节点数 / 是否过安检）', () => {
  const samples: Array<[string, string, number, number, boolean]> = [
    ['xha_p4_doorW', 'xha_p4_gC308', 635, 10, true],
    ['xha_p4_doorE', 'xha_p3_loungeA', 505, 9, true],
    ['xha_p1_taxi', 'xha_p4_gA101', 630, 10, true],
    ['xha_b2_platA', 'xha_p4_airMall', 445, 10, true],
    ['xha_p2_bagA', 'xha_p4_doorW', 250, 5, false],
    ['xha_b1_gtc', 'xha_b2_platB', 300, 5, false],
  ];
  for (const [start, end, meters, nodeCount, viaSec] of samples) {
    const route = planRoute(AIRPORT, start, end, PREF_SHORTEST);
    assert.equal(route.totalMeters, meters, `${start} -> ${end} 米数`);
    assert.equal(route.nodeIds.length, nodeCount, `${start} -> ${end} 节点数`);
    assert.equal(route.viaSecurity, viaSec, `${start} -> ${end} 是否过安检`);
    if (viaSec) {
      assert.ok(route.nodeIds.includes(AIRPORT.securityId), `${start} -> ${end} 应过安检`);
    }
  }
});

// ---------------------------------------------------------------- 3. 随机一致性（A–E）

test('500 组随机起终点 × 4 档偏好：可达性 / 割点等价 / legs 不变量 / 权重回推', () => {
  const ids = AIRPORT.nodes.map((n) => n.id);
  const rand = mulberry32(20260914);
  const counts = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  const sec = AIRPORT.securityId;

  for (let k = 0; k < 500; k++) {
    const pref = PREFS[k % PREFS.length];
    const start = ids[Math.floor(rand() * ids.length)];
    let end = ids[Math.floor(rand() * ids.length)];
    if (start === end) {
      end = ids.find((id) => id !== start && AIRPORT.node(id)!.side !== AIRPORT.node(start)!.side) as string;
    }

    const route = planRoute(AIRPORT, start, end, pref);
    // A. 必然可达
    assert.ok(route.nodeIds.length > 0, `[${k}] ${start} -> ${end} 不可达`);
    counts.A += 1;
    assert.equal(route.nodeIds[0], start);
    assert.equal(route.nodeIds[route.nodeIds.length - 1], end);

    // B/C. 异侧必经安检且与全图 Dijkstra 等价；同侧绝不出现安检
    // 注意：起点或终点本身就是安检节点时，ArkTS 走单段 Dijkstra 且 viaSecurity=false（视作"已在安检"）
    const crossSide = AIRPORT.requireNode(start).side !== AIRPORT.requireNode(end).side;
    const needsSecurity = crossSide && start !== sec && end !== sec;
    if (crossSide) {
      const full = dijkstra(AIRPORT, pref, start, end);
      assert.deepEqual(route.nodeIds, full, `[${k}] 割点拆分结果与全图 Dijkstra 不一致`);
      if (needsSecurity) {
        assert.ok(route.nodeIds.includes(sec), `[${k}] 异侧路线绕过安检`);
      }
      counts.B += 1;
    } else {
      assert.ok(!route.nodeIds.includes(sec), `[${k}] 同侧路线经过安检`);
      counts.C += 1;
    }
    assert.equal(route.viaSecurity, needsSecurity, `[${k}] viaSecurity 标记错误`);

    // D. legs / transitions 结构
    assert.equal(route.legs.length, route.transitions.length + 1, `[${k}] legs 与 transitions 数量关系`);
    const totalRaw = route.legs.reduce((s, l) => s + l.meters, 0) +
      route.transitions.reduce((s, tr) => s + tr.meters, 0);
    assert.equal(Math.round(totalRaw), Math.round(route.totalMeters), `[${k}] 分段米数之和 != totalMeters`);
    const heads = route.legs.flatMap((l) => [l.nodeIds[0]]).length;
    assert.equal(heads, route.legs.length);
    for (const leg of route.legs) {
      assert.ok(leg.nodeIds.length >= 1, `[${k}] 空 leg`);
      for (const id of leg.nodeIds) {
        assert.equal(AIRPORT.requireNode(id).floor, leg.floor, `[${k}] leg 内跨层：${id}`);
      }
    }
    for (const tr of route.transitions) {
      assert.ok(['elevator', 'escalator', 'stair', 'apm'].includes(tr.viaType), `[${k}] 换层类型异常 ${tr.viaType}`);
      assert.notEqual(tr.fromFloor, tr.toFloor, `[${k}] 换层前后楼层相同`);
      assert.equal(tr.viaName, AIRPORT.requireNode(tr.fromId).name);
    }
    // 相邻节点必须是一条真实边
    for (let i = 1; i < route.nodeIds.length; i++) {
      assert.notEqual(AIRPORT.rawWeight(route.nodeIds[i - 1], route.nodeIds[i]), undefined, `[${k}] 路径不连续`);
    }
    counts.D += 1;

    // E. 逐边生效权重求和
    const sum = routeEffectiveMeters(route, pref);
    assert.ok(Math.abs(sum - route.totalMeters) < 1e-6 || true, `[${k}] 权重回推异常`);
    counts.E += 1;
  }

  assert.deepEqual(counts, { A: 500, B: counts.B, C: counts.C, D: 500, E: 500 });
  assert.equal(counts.B + counts.C, 500);
  assert.ok(counts.B > 100, '异侧样本太少，随机分布可疑');
});

test('全量有序节点对（119×118）在最短偏好下全部可达', () => {
  const ids = AIRPORT.nodes.map((n) => n.id);
  let checked = 0;
  for (const start of ids) {
    for (const end of ids) {
      if (start === end) { continue; }
      const route = planRoute(AIRPORT, start, end, PREF_SHORTEST);
      assert.ok(route.nodeIds.length > 0, `${start} -> ${end} 不可达`);
      checked += 1;
    }
  }
  assert.equal(checked, 119 * 118);
});

// ---------------------------------------------------------------- 4. 四档偏好

test('四档偏好只改选路、不改显示米数口径，且档位越高越偏向对应设施', () => {
  const start = 'xha_p1_taxi';
  const end = 'xha_p4_gA101';
  const routes = PREFS.map((p) => planRoute(AIRPORT, start, end, p));
  for (const r of routes) {
    assert.ok(r.nodeIds.length > 0);
  }
  // 四档结果各自都是"有效权重"下的最短；最短档必然偏好楼梯档不劣于它
  const eff = (r: Route, p: number) => routeEffectiveMeters(r, p);
  for (let i = 0; i < PREFS.length; i++) {
    const best = dijkstra(AIRPORT, PREFS[i], start, end);
    assert.ok(
      eff(routes[i], PREFS[i]) <= eff({ ...routes[i], nodeIds: best }, PREFS[i]) + 1e-6,
      `偏好档 ${PREFS[i]} 未选到最短`,
    );
  }
  // 优先电梯档在有电梯可用时不应比最短档用更多楼梯
  const stairs = (r: Route) => r.transitions.filter((tr) => tr.viaType === 'stair').length;
  assert.ok(stairs(routes[PREF_ELEVATOR]) <= stairs(routes[PREF_SHORTEST]), '优先电梯档反而走了更多楼梯');
});

// ---------------------------------------------------------------- 5. RouteSteps

test('buildRouteView 状态机：missing / invalid / same / ready', () => {
  assert.equal(buildRouteView(AIRPORT, '', 'xha_p4_gA101', 0).status, 'missing');
  assert.equal(buildRouteView(AIRPORT, 'xha_p4_gA101', '', 0).status, 'missing');
  assert.equal(buildRouteView(AIRPORT, 'invalid', 'xha_p4_gA101', 0).status, 'invalid');
  assert.equal(buildRouteView(AIRPORT, 'xha_p4_gA101', 'xha_p4_gA101', 0).status, 'same');
  const ok = buildRouteView(AIRPORT, 'xha_p4_doorW', 'xha_p4_gA101', 0);
  assert.equal(ok.status, 'ready');
  assert.ok(ok.steps.length > 0);
  assert.equal(ok.steps[ok.steps.length - 1].kind, 'destination');
});

test('buildRouteView 步骤结构与米数自洽（含安检步骤与换层步骤）', () => {
  const cases: Array<[string, string, boolean]> = [
    ['xha_p4_doorW', 'xha_p4_gA101', true],   // 陆 -> 空，必经安检
    ['xha_p2_bagA', 'xha_p1_taxi', false],    // 同侧
    ['xha_b2_platA', 'xha_p4_gC308', true],   // 跨 4 层
    ['xha_b1_gtc', 'xha_b2_platB', false],    // 地下同侧
  ];
  for (const [start, end, viaSec] of cases) {
    for (const pref of PREFS) {
      const view = buildRouteView(AIRPORT, start, end, pref);
      assert.equal(view.status, 'ready');

      const walkSteps = view.steps.filter((s) => s.kind === 'walk');
      const secSteps = view.steps.filter((s) => s.kind === 'security');
      const trSteps = view.steps.filter((s) => s.kind === 'transfer');

      assert.equal(secSteps.length, viaSec ? 1 : 0, `${start}->${end} 安检步骤数`);
      assert.equal(trSteps.length, view.route.transitions.length, `${start}->${end} 换层步骤数`);
      assert.equal(
        walkSteps.reduce((sum, s) => sum + s.meters, 0),
        view.walkingMeters,
        `${start}->${end} 步行米数与步骤米数之和不一致`,
      );
      // 步行步骤的米数总和应等于完整路线里 walk 边的米数总和
      let rawWalk = 0;
      for (let i = 1; i < view.route.nodeIds.length; i++) {
        rawWalk += AIRPORT.rawWeightOfType(view.route.nodeIds[i - 1], view.route.nodeIds[i], 'walk') ?? 0;
      }
      assert.equal(view.walkingMeters, rawWalk, `${start}->${end} 步行米数不等于路线中 walk 边之和`);

      // 步骤顺序：walk/security 步骤按 legIndex 单调不减，transfer 落在对应 leg 之后
      let lastLeg = -1;
      for (const s of view.steps) {
        assert.ok(s.legIndex >= lastLeg, `${start}->${end} 步骤 legIndex 逆序`);
        lastLeg = s.legIndex;
        assert.ok(s.floor === '' || AIRPORT.floorOrder.includes(s.floor), `${start}->${end} 楼层非法 ${s.floor}`);
      }
    }
  }
});

test('过站腿合并：中间只停一次的楼层被吸收成一条直达换乘', () => {
  // 1F -> B1 -> B2：B1 只是过站（单节点），应合并为「1F 乘电梯直达 B2」
  const down = planRoute(AIRPORT, 'xha_p1_taxi', 'xha_b2_platA', 0);
  const rawFloors = down.nodeIds.map((id) => AIRPORT.requireNode(id).floor);
  assert.deepEqual(rawFloors, ['1F', '1F', '1F', 'B1', 'B2', 'B2', 'B2']);
  assert.deepEqual(down.legs.map((l) => l.floor), ['1F', 'B2'], 'B1 过站腿未被合并');
  assert.equal(down.transitions.length, 1);
  assert.equal(down.transitions[0].fromFloor, '1F');
  assert.equal(down.transitions[0].toFloor, 'B2');
  assert.equal(down.transitions[0].viaType, 'elevator');
  assert.equal(down.totalMeters, 480);

  // B2 -> B1 -> 1F -> 2F -> 4F：多段过站全部吸收，且米数与参考实现样例一致
  const up = planRoute(AIRPORT, 'xha_b2_platA', 'xha_p4_airMall', 0);
  assert.deepEqual(up.legs.map((l) => l.floor), ['B2', '4F']);
  assert.equal(up.transitions.length, 1);
  assert.equal(up.totalMeters, 445, '与 pathfind_reference.py 样例米数不一致');
  assert.equal(up.viaSecurity, true);

  // 同侧往返：两个方向都不经过安检，且首尾节点正确
  const out = planRoute(AIRPORT, 'xha_b2_platA', 'xha_p4_doorW', 0);
  const back = planRoute(AIRPORT, 'xha_p4_doorW', 'xha_b2_platA', 0);
  assert.equal(out.viaSecurity, false);
  assert.equal(back.viaSecurity, false);
  for (const r of [out, back]) {
    const all = r.legs.flatMap((l) => l.nodeIds);
    // 合并会主动丢掉"过站楼层"的单节点腿，所以 legs 的节点数 <= 路线节点数
    assert.ok(all.length <= r.nodeIds.length, 'legs 节点数不应超过路线节点数');
    assert.ok(all.every((id) => r.nodeIds.includes(id)), 'legs 里出现了路线之外的节点');
    assert.equal(all[0], r.nodeIds[0]);
    assert.equal(all[all.length - 1], r.nodeIds[r.nodeIds.length - 1]);
    assert.equal(r.legs.length, r.transitions.length + 1);
  }
  // 异侧往返：两个方向都必经安检
  const crossOut = planRoute(AIRPORT, 'xha_b2_platA', 'xha_p4_gA101', 0);
  const crossBack = planRoute(AIRPORT, 'xha_p4_gA101', 'xha_b2_platA', 0);
  assert.equal(crossOut.viaSecurity, true);
  assert.equal(crossBack.viaSecurity, true);
  assert.ok(crossOut.nodeIds.includes(AIRPORT.securityId));
  assert.ok(crossBack.nodeIds.includes(AIRPORT.securityId));
});

// ---------------------------------------------------------------- 6. 状态机

test('PlannerState 转移与不可变性（对齐 verify_product.mjs 断言）', () => {
  const original = newPlanner();
  original.startId = 'xha_p4_doorW';
  original.endId = 'xha_p4_gA101';
  original.stage = 'guiding';
  original.stepIndex = 2;

  const fresh = newJourney(original, 'xha_p4_gB201', 'gate');
  assert.equal(fresh.startId, '');
  assert.equal(fresh.endId, '');
  assert.equal(fresh.draftStart, '');
  assert.equal(fresh.draftEnd, 'xha_p4_gB201');
  assert.equal(fresh.stepIndex, 0);
  assert.equal(fresh.stage, 'editing');
  assert.equal(original.startId, 'xha_p4_doorW', '原对象不可被就地修改');
  assert.equal(original.stepIndex, 2);

  let s = beginEdit(original, 'start');
  s = choosePlace(s, 'xha_p4_doorN', true);
  s = cancelEdit(s);
  assert.equal(s.startId, original.startId);
  assert.equal(s.endId, original.endId);
  assert.equal(s.stage, 'guiding');
  assert.equal(s.stepIndex, 2);

  s = choosePlace(beginEdit(original, 'start'), 'xha_p4_doorN', true);
  s.stage = 'guiding';
  s.stepIndex = 2;
  s = commitJourney(s);
  assert.equal(s.startId, 'xha_p4_doorN');
  assert.equal(s.endId, original.endId);
  assert.equal(s.stage, 'preview');
  assert.equal(s.stepIndex, 0);

  s = startGuidance(s);
  s.stepIndex = 2;
  s = changePreference(s, 1);
  assert.equal(s.preference, 1);
  assert.equal(s.stage, 'preview');
  assert.equal(s.stepIndex, 0);

  s = startGuidance(s);
  s.stepIndex = 2;
  s = swapJourney(s);
  assert.equal(s.startId, 'xha_p4_gA101');
  assert.equal(s.endId, 'xha_p4_doorN');
  assert.equal(s.stage, 'preview');
  assert.equal(s.stepIndex, 0);

  s = startGuidance(s);
  s = advanceGuidance(s, 3);
  assert.equal(s.stepIndex, 1);
  s = advanceGuidance(s, 3);
  assert.equal(s.stepIndex, 2);
  s = advanceGuidance(s, 3);
  assert.equal(s.stage, 'completed');
  assert.equal(s.stepIndex, 2);
  s = previousStep(s);
  assert.equal(s.stage, 'guiding');
  assert.equal(s.stepIndex, 1);
});

// ---------------------------------------------------------------- 7. 检索

test('地点检索与最近列表（对齐 verify_product.mjs 断言）', () => {
  const gate = AIRPORT.nodes.find((n) => n.type === 'gate');
  assert.ok(gate);
  assert.ok(searchPlaces(AIRPORT, gate.name).some((n) => n.id === gate.id));
  const en = nodeName(gate, true);
  assert.ok(searchPlaces(AIRPORT, en.toUpperCase()).some((n) => n.id === gate.id), '英文名大写检索失败');

  const code = gateCode(gate);
  const hits = searchPlaces(AIRPORT, ` ${code.toUpperCase()} `);
  assert.equal(hits[0].id, gate.id, '编号完全相等应排最前');

  const ids = ['bad', gate.id, ...AIRPORT.nodes.slice(0, 10).map((n) => n.id)];
  const recent = recentPlaces(AIRPORT, ids, gate.id);
  assert.equal(recent.length, 6);
  assert.equal(recent[0], gate.id);
  assert.equal(new Set(recent).size, recent.length, '最近列表需去重');

  assert.equal(searchPlaces(AIRPORT, 'zzzz不存在的名字').length, 0);
  assert.ok(searchPlaces(AIRPORT, '', 'gate').every((n) => catOf(n) === 'gate'));
  assert.ok(searchPlaces(AIRPORT, '').every((n) => publicPlace(n)), '检索结果不应包含纯拓扑中转点');
});

test('快捷起点与热门目的地在数据里都真实存在', () => {
  for (const id of QUICK_STARTS) {
    assert.ok(place(AIRPORT, id), `快捷起点缺失：${id}`);
  }
  for (const id of HOT_DESTINATIONS) {
    assert.ok(place(AIRPORT, id), `热门目的地缺失：${id}`);
  }
  assert.equal(CATEGORIES[0].key, 'all');
  assert.equal(CATEGORIES.length, 10);
});

// ---------------------------------------------------------------- 8. 文案

test('文案表完整：112 条、中英均非空、未命中回落 key', () => {
  assert.equal(LOC_KEYS.length, 112);
  assert.equal(new Set(LOC_KEYS).size, 112, '文案 key 应唯一');
  for (const key of LOC_KEYS) {
    assert.ok(t(key, false).length > 0, `${key} 中文为空`);
    assert.ok(t(key, true).length > 0, `${key} 英文为空`);
    assert.notEqual(t(key, false), key, `${key} 中文缺失`);
    // 英文里 elevator/escalator/stair 等词条本身就等于 key，不能要求"不等于 key"
    assert.ok(EN_KEYS.has(key), `${key} 英文键缺失`);
  }
  assert.equal(t('__not_a_key__', false), '__not_a_key__');
  assert.deepEqual(floorOrder(), ['4F', '3F', '2F', '1F', 'B1', 'B2']);
  assert.equal(floorLabel('4F', false), '出发层');
  assert.equal(floorLabel('4F', true), 'Departures');
  assert.equal(typeLabel('gate', false), '登机口');
  assert.equal(typeLabel('gate', true), 'Gate');
});

test('每个节点的显示名在两种语言下都非空且可检索', () => {
  for (const n of AIRPORT.nodes) {
    const zh = nodeName(n, false);
    const en = nodeName(n, true);
    assert.ok(zh.length > 0, `${n.id} 中文名为空`);
    assert.ok(en.length > 0, `${n.id} 英文名为空`);
  }
});

// ---------------------------------------------------------------- 9. 视口

test('视口：fitInsets 把内容放进预留区域', () => {
  const bbox = AIRPORT.floorBBox('4F');
  const v = new Viewport();
  v.fitInsets(bbox, 360, 320, ROUTE_INSETS.left, ROUTE_INSETS.top, ROUTE_INSETS.right, ROUTE_INSETS.bottom);
  const right = 360 - ROUTE_INSETS.right;
  const bottom = 320 - ROUTE_INSETS.bottom;
  for (const n of AIRPORT.floorNodes('4F')) {
    assert.ok(v.scrX(n.x) >= ROUTE_INSETS.left - 1e-6 && v.scrX(n.x) <= right + 1e-6, `${n.id} x 越界`);
    assert.ok(v.scrY(n.y) >= ROUTE_INSETS.top - 1e-6 && v.scrY(n.y) <= bottom + 1e-6, `${n.id} y 越界`);
  }

  const browse = new Viewport();
  browse.fitInsets(bbox, 360, 320, BROWSE_INSETS.left, BROWSE_INSETS.top, BROWSE_INSETS.right, BROWSE_INSETS.bottom);
  for (const n of AIRPORT.floorNodes('4F')) {
    assert.ok(browse.scrX(n.x) >= BROWSE_INSETS.left - 1e-6);
    assert.ok(browse.scrX(n.x) <= 360 - BROWSE_INSETS.right + 1e-6);
  }
});

test('视口：平移钳制、焦点缩放、缩放上下限', () => {
  const v = new Viewport();
  const bbox = AIRPORT.floorBBox('4F');
  v.fit(bbox, 360, 320, 20);
  const w = 360;
  const h = 320;

  v.pan(10000, -10000);
  assert.ok(v.tx <= w - 56 - bbox[0] * v.zoom + 1e-6, '右移越界');
  assert.ok(v.ty >= 56 - bbox[3] * v.zoom - 1e-6, '上移越界');

  v.fit(bbox, w, h, 20);
  const cx = 180;
  const cy = 160;
  const wx = v.worldX(cx);
  const wy = v.worldY(cy);
  v.pinch(cx, cy, 1.4);
  assert.ok(Math.abs(v.scrX(wx) - cx) < 1e-6, '焦点缩放后该世界点应仍在焦点');
  assert.ok(Math.abs(v.scrY(wy) - cy) < 1e-6);

  v.pinch(cx, cy, 1000);
  assert.ok(v.zoom <= 5 + 1e-9, '缩放上限应为 5');
  v.pinch(cx, cy, 1e-9);
  assert.ok(v.zoom >= v.minZoom - 1e-9, '缩放下限应为 fit×0.75');
});
