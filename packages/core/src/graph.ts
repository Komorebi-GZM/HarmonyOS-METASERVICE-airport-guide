// 图模型：把 data/XHA_xinghai_t1.map.json 变成带邻接表与陆/空侧判定的运行时图。
//
// 与 ArkTS 端的差异（有意的改进）：
//   ArkTS 端由 tools/gen_model.py 在**构建期**算 side / 楼层 bbox，并编译进 AirportMap.ets。
//   共享核心改为**加载期**算，好处是 Web / 小程序 / Swift 都只需要那份 JSON，
//   不必再维护第二套代码生成器。算法与 gen_model.py 完全一致：
//     从第一个 entrance 出发做 BFS（跳过安检节点）→ 可达者 land，其余 air，安检本身 gate。
//
// 真源：tools/gen_model.py（side/bbox）、harmony_app/.../core/Pathfinder.ets（邻接表）

import { MAP_RAW } from './generated/map-data.ts';
import type { MapNode, MapEdge, RawAirportMap, Side } from './types.ts';

export const PX_PER_METER: number = MAP_RAW.meta.pxPerMeter;

function edgeKey(a: string, b: string): string {
  return a < b ? a + '|' + b : b + '|' + a;
}

export class AirportGraph {
  readonly raw: RawAirportMap;
  readonly nodes: MapNode[] = [];
  readonly edges: MapEdge[] = [];
  readonly nodeIndex = new Map<string, MapNode>();
  /** nodeId -> (neighborId -> 原始米权) */
  readonly adjacency = new Map<string, Map<string, number>>();
  /** 规范化节点对 -> 边类型 */
  readonly edgeTypes = new Map<string, string>();
  readonly securityId: string;
  readonly floorOrder: string[];
  readonly floorLabels: Record<string, string>;

  constructor(raw: RawAirportMap) {
    this.raw = raw;
    this.floorLabels = raw.meta.floors;
    this.floorOrder = Object.keys(raw.meta.floors);

    const secs = raw.nodes.filter((n) => n.type === 'security');
    if (secs.length !== 1) {
      throw new Error(`必须恰有一个安检节点，实际 ${secs.length} 个`);
    }
    this.securityId = secs[0].id;

    this.edges = raw.edges.map((e) => ({ from: e.from, to: e.to, type: e.type, weight: e.weight }));

    for (const e of this.edges) {
      let m0 = this.adjacency.get(e.from);
      if (m0 === undefined) { m0 = new Map<string, number>(); this.adjacency.set(e.from, m0); }
      let m1 = this.adjacency.get(e.to);
      if (m1 === undefined) { m1 = new Map<string, number>(); this.adjacency.set(e.to, m1); }
      if (m0.has(e.to) && m0.get(e.to) !== e.weight) {
        throw new Error(`平行边权重冲突：${e.from} -> ${e.to}`);
      }
      m0.set(e.to, e.weight);
      m1.set(e.from, e.weight);

      const k = edgeKey(e.from, e.to);
      const prev = this.edgeTypes.get(k);
      if (prev !== undefined && prev !== e.type) {
        // 与 ArkTS 端 _etype 的隐患同源：这里显式失败而不是静默覆盖
        throw new Error(`同一对节点存在不同类型的边：${e.from} <-> ${e.to}（${prev} / ${e.type}）`);
      }
      this.edgeTypes.set(k, e.type);
    }

    const sides = this.computeSides();
    for (const n of raw.nodes) {
      const node: MapNode = {
        id: n.id, name: n.name, type: n.type, floor: n.floor, x: n.x, y: n.y,
        side: sides.get(n.id) as Side,
      };
      this.nodes.push(node);
      this.nodeIndex.set(node.id, node);
    }
  }

  /** 与 gen_model.py 相同的陆/空侧判定 */
  private computeSides(): Map<string, Side> {
    const anchor = this.raw.nodes.find((n) => n.type === 'entrance');
    if (anchor === undefined) {
      throw new Error('数据里没有 entrance 节点，无法判定陆侧');
    }
    const seen = new Set<string>([anchor.id]);
    const stack: string[] = [anchor.id];
    while (stack.length > 0) {
      const u = stack.pop() as string;
      const nbrs = this.adjacency.get(u);
      if (nbrs === undefined) { continue; }
      nbrs.forEach((_w, v) => {
        if (v === this.securityId || seen.has(v)) { return; }
        seen.add(v);
        stack.push(v);
      });
    }
    const sides = new Map<string, Side>();
    let air = 0;
    let land = 0;
    for (const n of this.raw.nodes) {
      let side: Side;
      if (n.id === this.securityId) { side = 'gate'; }
      else if (seen.has(n.id)) { side = 'land'; land += 1; }
      else { side = 'air'; air += 1; }
      sides.set(n.id, side);
    }
    if (air === 0) {
      throw new Error('空侧为空，陆/空侧判定失效');
    }
    return sides;
  }

  node(id: string): MapNode | undefined {
    return this.nodeIndex.get(id);
  }

  /** 与 ArkTS 端 node() 一致：未命中直接抛错，避免静默算出错误路线 */
  requireNode(id: string): MapNode {
    const n = this.nodeIndex.get(id);
    if (n === undefined) {
      throw new Error('unknown node: ' + id);
    }
    return n;
  }

  neighbors(id: string): Map<string, number> | undefined {
    return this.adjacency.get(id);
  }

  edgeType(a: string, b: string): string {
    const t = this.edgeTypes.get(edgeKey(a, b));
    return t === undefined ? 'walk' : t;
  }

  /** 原始米权（不含偏好），与 ArkTS 端 adjTable().get(u).get(v) 等价 */
  rawWeight(a: string, b: string): number | undefined {
    return this.adjacency.get(a)?.get(b);
  }

  /** 指定类型的原始米权，非该类型返回 undefined */
  rawWeightOfType(a: string, b: string, type: string): number | undefined {
    if (this.edgeType(a, b) !== type) { return undefined; }
    return this.rawWeight(a, b);
  }

  floorNodes(floor: string): MapNode[] {
    return this.nodes.filter((n) => n.floor === floor);
  }

  /** [minX, minY, maxX, maxY]，与 gen_model.py 的 FLOOR_BBOX 一致 */
  floorBBox(floor: string): [number, number, number, number] {
    const list = this.floorNodes(floor);
    if (list.length === 0) { return [0, 0, 1, 1]; }
    let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
    for (const n of list) {
      if (n.x < minX) { minX = n.x; }
      if (n.y < minY) { minY = n.y; }
      if (n.x > maxX) { maxX = n.x; }
      if (n.y > maxY) { maxY = n.y; }
    }
    return [minX, minY, maxX, maxY];
  }

  /** 全图包围盒（用于总览） */
  allBBox(): [number, number, number, number] {
    let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
    for (const n of this.nodes) {
      if (n.x < minX) { minX = n.x; }
      if (n.y < minY) { minY = n.y; }
      if (n.x > maxX) { maxX = n.x; }
      if (n.y > maxY) { maxY = n.y; }
    }
    return [minX, minY, maxX, maxY];
  }

  sideCount(): { land: number; air: number; gate: number } {
    let land = 0; let air = 0; let gate = 0;
    for (const n of this.nodes) {
      if (n.side === 'land') { land += 1; }
      else if (n.side === 'air') { air += 1; }
      else { gate += 1; }
    }
    return { land, air, gate };
  }

  floorCounts(): Record<string, number> {
    const out: Record<string, number> = {};
    for (const n of this.nodes) {
      out[n.floor] = (out[n.floor] ?? 0) + 1;
    }
    return out;
  }
}

export const AIRPORT: AirportGraph = new AirportGraph(MAP_RAW);
