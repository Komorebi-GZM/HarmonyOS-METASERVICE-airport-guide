// 寻路引擎：Dijkstra（米权）+ 安检必经拆分 + 换层偏好。
//
// 与 ArkTS 端 core/Pathfinder.ets 逐行对应，刻意保留"朴素 O(V²)"实现：
//   119 节点的规模下性能无差异，而**完全一致的遍历/插入顺序**能保证
//   与 ArkTS 版选出同一条最短路（并列最短时的取舍也一致）。
//
// 唯一有意的差异：VERTICAL_WEIGHT 补上了 `apm` 350。
//   上游文档与 gen_maps.py 都保留了 apm（旅客捷运）类型，但 ArkTS 与
//   pathfind_reference.py 的权重表都缺这一项——ArkTS 会静默按 25m 处理，
//   参考实现会 KeyError。当前数据没有 apm 边，所以补上不改变任何现有结果。

import type { AirportGraph } from './graph.ts';
import type { Route, RouteLeg, RouteTransition } from './types.ts';
import { emptyRoute } from './types.ts';

// 偏好档位（数值常量，与 ArkTS 的 PREF_* 一致）
export const PREF_SHORTEST = 0;
export const PREF_ELEVATOR = 1;
export const PREF_ESCALATOR = 2;
export const PREF_AVOID_STAIR = 3;
export const PREFERENCE_COUNT = 4;

/** 垂直边基准权重（米） */
export const VERTICAL_WEIGHT = new Map<string, number>([
  ['elevator', 30],
  ['escalator', 40],
  ['stair', 25],
  ['apm', 350],
]);

/** 偏好对垂直边类型的乘子：越大越不偏好（walk 不参与） */
export const PREF_MULT: Map<string, number>[] = [
  new Map<string, number>([['elevator', 1], ['escalator', 1], ['stair', 1], ['apm', 1]]),
  new Map<string, number>([['elevator', 0.7], ['escalator', 1.6], ['stair', 3.2], ['apm', 1]]),
  new Map<string, number>([['elevator', 1.3], ['escalator', 0.8], ['stair', 2.2], ['apm', 1]]),
  new Map<string, number>([['elevator', 1.0], ['escalator', 1.4], ['stair', 6], ['apm', 1]]),
];

export function preferenceKey(pref: number): string {
  if (pref === PREF_ELEVATOR) { return 'pref_elevator'; }
  if (pref === PREF_ESCALATOR) { return 'pref_escalator'; }
  if (pref === PREF_AVOID_STAIR) { return 'pref_avoid_stair'; }
  return 'pref_shortest';
}

/** 一条边的生效权重（米）：walk 用原始米权，垂直边用基准 × 偏好乘子 */
export function effectiveWeight(graph: AirportGraph, u: string, v: string, raw: number, pref: number): number {
  const type = graph.edgeType(u, v);
  if (type === 'walk') {
    return raw;
  }
  const base = VERTICAL_WEIGHT.get(type);
  const mult = PREF_MULT[pref]?.get(type);
  const b = base === undefined ? 25 : base;
  const m = mult === undefined ? 1 : mult;
  return Math.round(b * m);
}

/** Dijkstra，返回源到目标的节点序列（不含则空数组） */
export function dijkstra(graph: AirportGraph, pref: number, src: string, dst: string): string[] {
  const dist = new Map<string, number>();
  const prev = new Map<string, string>();
  const visited = new Set<string>();
  dist.set(src, 0);
  for (;;) {
    let u: string | null = null;
    let best = Infinity;
    dist.forEach((d: number, k: string) => {
      if (!visited.has(k) && d < best) {
        best = d;
        u = k;
      }
    });
    if (u === null) {
      break;
    }
    if (u === dst) {
      break;
    }
    const cur = u as string;
    visited.add(cur);
    const nbrs = graph.neighbors(cur);
    if (nbrs === undefined) {
      continue;
    }
    nbrs.forEach((raw: number, v: string) => {
      if (visited.has(v)) {
        return;
      }
      const du = dist.get(cur);
      if (du === undefined) {
        return;
      }
      const nd = du + effectiveWeight(graph, cur, v, raw, pref);
      const old = dist.get(v);
      if (old === undefined || nd < old) {
        dist.set(v, nd);
        prev.set(v, cur);
      }
    });
  }
  const path: string[] = [];
  let cur = dst;
  while (cur !== src) {
    path.push(cur);
    const p = prev.get(cur);
    if (p === undefined) {
      return []; // 不可达
    }
    cur = p;
  }
  path.push(src);
  path.reverse();
  return path;
}

/**
 * 规划路线。
 * - 异侧（陆↔空）：必经安检，拆两段拼接；安检作为途经点。
 * - 同侧 / 起终点在安检：直接 Dijkstra。
 */
export function planRoute(graph: AirportGraph, startId: string, endId: string, pref: number): Route {
  const sec = graph.securityId;
  let seq: string[];
  let viaSec = false;
  if (startId === sec || endId === sec) {
    seq = dijkstra(graph, pref, startId, endId);
  } else {
    const s = graph.requireNode(startId);
    const e = graph.requireNode(endId);
    if (s.side === e.side) {
      seq = dijkstra(graph, pref, startId, endId);
    } else {
      viaSec = true;
      const p1 = dijkstra(graph, pref, startId, sec);
      const p2 = dijkstra(graph, pref, sec, endId);
      if (p1.length === 0 || p2.length === 0) {
        return emptyRoute();
      }
      seq = p1.concat(p2.slice(1));
    }
  }
  if (seq.length === 0) {
    return emptyRoute();
  }

  // 分段成 legs（同层连续段）+ transitions（跨层）
  // 米数一律用数据原始权重（walk=真实米数，垂直=基准 30/40/25）；偏好只影响选路，不改显示距离
  const legs: RouteLeg[] = [];
  const transitions: RouteTransition[] = [];
  let total = 0;
  let curFloor = graph.requireNode(seq[0]).floor;
  let ids: string[] = [seq[0]];
  let legMeters = 0;
  for (let i = 1; i < seq.length; i++) {
    const u = seq[i - 1];
    const v = seq[i];
    const raw = graph.rawWeight(u, v);
    const m = raw === undefined ? 0 : raw;
    total += m;
    if (graph.requireNode(v).floor !== curFloor) {
      legs.push({ floor: curFloor, nodeIds: ids, meters: legMeters });
      transitions.push({
        fromId: u,
        toId: v,
        viaType: graph.edgeType(u, v),
        viaName: graph.requireNode(u).name,
        fromFloor: curFloor,
        toFloor: graph.requireNode(v).floor,
        meters: m,
      });
      curFloor = graph.requireNode(v).floor;
      ids = [v];
      legMeters = 0;
    } else {
      legMeters += m;
      ids.push(v);
    }
  }
  if (ids.length > 0) {
    legs.push({ floor: curFloor, nodeIds: ids, meters: legMeters });
  }
  const merged = mergeTransitLegs(legs, transitions);
  return {
    nodeIds: seq,
    totalMeters: total,
    legs: merged.legs,
    transitions: merged.transitions,
    viaSecurity: viaSec,
  };
}

/**
 * 把单节点的过站腿（非起点/终点）与两侧换乘合并成一条直达换乘。
 * 例：legs=[4F, 2F(单节点 lift), 1F] → legs=[4F, 1F]，transitions=[4F lift→1F 一次]
 */
function mergeTransitLegs(legs: RouteLeg[], trans: RouteTransition[]): { legs: RouteLeg[]; transitions: RouteTransition[] } {
  const outL: RouteLeg[] = [];
  const outT: RouteTransition[] = [];
  let i = 0;
  while (i < legs.length) {
    outL.push(legs[i]);
    if (i === legs.length - 1) {
      break;
    }
    let t: RouteTransition = trans[i];
    let j = i + 1;
    while (j < legs.length - 1 && legs[j].nodeIds.length === 1) {
      const t2: RouteTransition = trans[j];
      t = {
        fromId: t.fromId,
        toId: t2.toId,
        viaType: t.viaType,
        viaName: t.viaName,
        fromFloor: t.fromFloor,
        toFloor: t2.toFloor,
        meters: t.meters + t2.meters,
      };
      j += 1;
    }
    outT.push(t);
    i = j;
  }
  return { legs: outL, transitions: outT };
}

/** 常用快捷起点（模拟当前位置），展示优先序 */
export const QUICK_STARTS: string[] = [
  'xha_p4_doorW', 'xha_p4_doorN', 'xha_p4_doorE',
  'xha_p2_exitN', 'xha_b2_platA', 'xha_b2_platB',
  'xha_p1_taxi', 'xha_b1_gtc',
];

/** 路线总米数（用原始权重逐边累加，与 totalMeters 同口径） */
export function routeMeters(graph: AirportGraph, nodeIds: string[]): number {
  let total = 0;
  for (let i = 1; i < nodeIds.length; i++) {
    total += graph.rawWeight(nodeIds[i - 1], nodeIds[i]) ?? 0;
  }
  return total;
}
