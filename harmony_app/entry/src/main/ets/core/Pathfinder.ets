// 寻路引擎：Dijkstra（米权）+ 安检必经拆分 + 换层偏好
// 唯一安检是陆侧↔空侧割点：异侧两点拆成「起→安检 + 安检→终」两段，严格等价于不可能绕过安检。
// ArkTS 禁用 Record 对象字面量 -> 垂直权重/偏好用 Map
import { MapNode, XHA_NODES, XHA_EDGES, SECURITY_ID } from '../model/AirportMap';

// 偏好档位（数值常量）
export const PREF_SHORTEST = 0;
export const PREF_ELEVATOR = 1;
export const PREF_ESCALATOR = 2;
export const PREF_AVOID_STAIR = 3;

// 垂直边基准权重（米）
const VERTICAL_WEIGHT: Map<string, number> = new Map<string, number>();
VERTICAL_WEIGHT.set('elevator', 30);
VERTICAL_WEIGHT.set('escalator', 40);
VERTICAL_WEIGHT.set('stair', 25);

// 偏好对垂直边类型的乘子：乘数越大越不偏好（walk 不参与）
const PREF_MULT: Map<string, number>[] = [
  new Map<string, number>().set('elevator', 1).set('escalator', 1).set('stair', 1),       // 最短距离
  new Map<string, number>().set('elevator', 0.7).set('escalator', 1.6).set('stair', 3.2), // 优先电梯
  new Map<string, number>().set('elevator', 1.3).set('escalator', 0.8).set('stair', 2.2), // 优先扶梯
  new Map<string, number>().set('elevator', 1.0).set('escalator', 1.4).set('stair', 6),   // 避开楼梯
];

// ---- 运行期图索引（首次使用惰性构建）----
let _adj: Map<string, Map<string, number>> | null = null;
let _etype: Map<string, string> | null = null;
let _nodeIndex: Map<string, MapNode> | null = null;

function edgeKey(a: string, b: string): string {
  return a < b ? a + '|' + b : b + '|' + a;
}

export function node(id: string): MapNode {
  if (_nodeIndex === null) {
    const idx = new Map<string, MapNode>();
    for (let i = 0; i < XHA_NODES.length; i++) {
      idx.set(XHA_NODES[i].id, XHA_NODES[i]);
    }
    _nodeIndex = idx;
  }
  const n = _nodeIndex.get(id);
  // 工程内保证全部引用存在；找不到时返回一个哨兵避免崩溃
  if (n === undefined) {
    throw new Error('unknown node: ' + id);
  }
  return n;
}

function adjTable(): Map<string, Map<string, number>> {
  if (_adj !== null) {
    return _adj;
  }
  const a = new Map<string, Map<string, number>>();
  for (let i = 0; i < XHA_EDGES.length; i++) {
    const e = XHA_EDGES[i];
    let m0 = a.get(e.from);
    if (m0 === undefined) {
      m0 = new Map<string, number>();
      a.set(e.from, m0);
    }
    let m1 = a.get(e.to);
    if (m1 === undefined) {
      m1 = new Map<string, number>();
      a.set(e.to, m1);
    }
    m0.set(e.to, e.weight);
    m1.set(e.from, e.weight);
  }
  _adj = a;
  return a;
}

function edgeType(u: string, v: string): string {
  if (_etype === null) {
    const t = new Map<string, string>();
    for (let i = 0; i < XHA_EDGES.length; i++) {
      const e = XHA_EDGES[i];
      t.set(edgeKey(e.from, e.to), e.type);
    }
    _etype = t;
  }
  const tp = _etype.get(edgeKey(u, v));
  return tp === undefined ? 'walk' : tp;
}

// 一条边的生效权重（米）
function edgeWeight(u: string, v: string, raw: number, pref: number): number {
  const tp = edgeType(u, v);
  if (tp === 'walk') {
    return raw;
  }
  const base = VERTICAL_WEIGHT.get(tp);
  const mult = PREF_MULT[pref].get(tp);
  const b = base === undefined ? 25 : base;
  const m = mult === undefined ? 1 : mult;
  return Math.round(b * m);
}

// Dijkstra，返回源到目标的节点序列（不含则空数组）
function dijkstra(pref: number, src: string, dst: string): string[] {
  const a = adjTable();
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
    visited.add(u);
    // 闭包捕获变量会丢失类型收窄 -> 冻结当前源点为 const 再进 forEach
    const cur = u;
    const nbrs = a.get(u);
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
      const nd = du + edgeWeight(cur, v, raw, pref);
      const old = dist.get(v);
      if (old === undefined || nd < old) {
        dist.set(v, nd);
        prev.set(v, cur);
      }
    });
  }
  // 回溯路径
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

// ---- 路线数据结构 ----
export interface RouteLeg {
  floor: string;
  nodeIds: string[];
  meters: number;
}

export interface RouteTransition {
  fromId: string;
  toId: string;
  viaType: string; // elevator/escalator/stair
  viaName: string; // 换层设施名（乘“中庭观光电梯”）
  fromFloor: string;
  toFloor: string;
  meters: number;
}

export interface Route {
  nodeIds: string[];
  totalMeters: number;
  legs: RouteLeg[];
  transitions: RouteTransition[];
  viaSecurity: boolean;
}

/**
 * 规划路线。
 * - 异侧（陆↔空）：必经安检，拆两段拼接；安检作为途经点。
 * - 同侧 / 起终点在安检：直接 Dijkstra。
 */
export function planRoute(startId: string, endId: string, pref: number): Route {
  const empty: Route = { nodeIds: [], totalMeters: 0, legs: [], transitions: [], viaSecurity: false };
  let seq: string[];
  let viaSec = false;
  const sec = SECURITY_ID;
  if (startId === sec || endId === sec) {
    seq = dijkstra(pref, startId, endId);
  } else {
    const s = node(startId);
    const e = node(endId);
    if (s.side === e.side) {
      seq = dijkstra(pref, startId, endId);
    } else {
      viaSec = true;
      const p1 = dijkstra(pref, startId, sec);
      const p2 = dijkstra(pref, sec, endId);
      if (p1.length === 0 || p2.length === 0) {
        return empty;
      }
      seq = p1.concat(p2.slice(1));
    }
  }
  if (seq.length === 0) {
    return empty;
  }
  // 分段成 legs（同层连续段）+ transitions（跨层）
  // 米数一律用数据原始权重（walk=真实米数，垂直=基准 30/40/25）；偏好只影响选路，不改显示距离
  const legs: RouteLeg[] = [];
  const transitions: RouteTransition[] = [];
  let total = 0;
  let curFloor = node(seq[0]).floor;
  let ids: string[] = [seq[0]];
  let legMeters = 0;
  for (let i = 1; i < seq.length; i++) {
    const u = seq[i - 1];
    const v = seq[i];
    const raw = adjTable().get(u)?.get(v);
    const m = raw === undefined ? 0 : raw;
    total += m;
    if (node(v).floor !== curFloor) {
      legs.push({ floor: curFloor, nodeIds: ids, meters: legMeters });
      transitions.push({
        fromId: u, toId: v, viaType: edgeType(u, v),
        viaName: node(u).name, fromFloor: curFloor, toFloor: node(v).floor, meters: m,
      });
      curFloor = node(v).floor;
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
  // 合并「过站中转」腿：如 4F→2F→1F 只有 2F 停一下电梯，把两段换乘并为一条直达，消除空 Tab
  const merged = mergeTransitLegs(legs, transitions);
  return { nodeIds: seq, totalMeters: total, legs: merged.legs, transitions: merged.transitions, viaSecurity: viaSec };
}

// 把单节点的过站腿（非起点/终点）与两侧换乘合并成一条直达换乘。
// 例：legs=[4F, 2F(单节点 lift), 1F] → legs=[4F, 1F]，transitions=[4F lift→1F 一次]
interface MergedLegs {
  legs: RouteLeg[];
  transitions: RouteTransition[];
}
function mergeTransitLegs(legs: RouteLeg[], trans: RouteTransition[]): MergedLegs {
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
    // 连续的过站单节点腿，全部吸收进同一条直达换乘
    while (j < legs.length - 1 && legs[j].nodeIds.length === 1) {
      const t2: RouteTransition = trans[j];
      t = {
        fromId: t.fromId, toId: t2.toId, viaType: t.viaType, viaName: t.viaName,
        fromFloor: t.fromFloor, toFloor: t2.toFloor, meters: t.meters + t2.meters,
      };
      j++;
    }
    outT.push(t);
    i = j;
  }
  return { legs: outL, transitions: outT };
}

// 常用快捷起点（模拟当前位置），展示优先序
export const QUICK_STARTS: string[] = [
  'xha_p4_doorW', 'xha_p4_doorN', 'xha_p4_doorE',
  'xha_p2_exitN', 'xha_b2_platA', 'xha_b2_platB',
  'xha_p1_taxi', 'xha_b1_gtc',
];