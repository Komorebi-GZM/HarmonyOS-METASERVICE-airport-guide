// 地点检索与可见性。
// 与 ArkTS 端 core/Places.ets 逐行对应。

import type { AirportGraph } from './graph.ts';
import type { MapNode } from './types.ts';
import { nodeName } from './i18n.ts';
import { catOf } from './categories.ts';

/** 虽然是 corridor，但语义上是用户可见地点（白名单） */
const PUBLIC_CORRIDORS: string[] = [
  'xha_p4_preSec', 'xha_p3_deck', 'xha_p3_kids', 'xha_p1_luggage',
  'xha_p1_linkG', 'xha_b1_metroG', 'xha_b2_pasg',
];

export function place(graph: AirportGraph, id: string): MapNode | undefined {
  return graph.node(id);
}

export function placeName(graph: AirportGraph, id: string, en: boolean): string {
  const n = place(graph, id);
  return n === undefined ? '' : nodeName(n, en);
}

export function publicPlace(n: MapNode): boolean {
  return n.type !== 'corridor' || PUBLIC_CORRIDORS.indexOf(n.id) >= 0;
}

/** 登机口编号（A101 -> "a101"），非登机口返回空串 */
export function gateCode(n: MapNode): string {
  return n.type === 'gate' ? n.name.replace('登机口', '').toLowerCase() : '';
}

export function searchPlaces(graph: AirportGraph, query: string, category: string = 'all'): MapNode[] {
  const q = query.trim().toLowerCase();
  const out: MapNode[] = [];
  for (const n of graph.nodes) {
    if (!publicPlace(n) || (category !== 'all' && catOf(n) !== category)) {
      continue;
    }
    if (
      q.length === 0 ||
      n.name.toLowerCase().indexOf(q) >= 0 ||
      nodeName(n, true).toLowerCase().indexOf(q) >= 0 ||
      (n.type === 'gate' && gateCode(n).indexOf(q) >= 0)
    ) {
      out.push(n);
    }
  }
  // 编号完全相等排最前（输入 " a101 " 时应直接命中 A101）
  out.sort((a: MapNode, b: MapNode): number => {
    const exactA = q.length > 0 && gateCode(a) === q ? 0 : 1;
    const exactB = q.length > 0 && gateCode(b) === q ? 0 : 1;
    return exactA - exactB;
  });
  return out;
}

export function recentPlaces(graph: AirportGraph, ids: string[], id: string): string[] {
  const out: string[] = [];
  if (place(graph, id) !== undefined) {
    out.push(id);
  }
  for (let i = 0; i < ids.length && out.length < 6; i++) {
    if (ids[i] !== id && out.indexOf(ids[i]) < 0 && place(graph, ids[i]) !== undefined) {
      out.push(ids[i]);
    }
  }
  return out;
}

/** 分类下可用于列表展示的地点（过滤纯拓扑中转点） */
export function listedPlaces(graph: AirportGraph, category: string = 'all'): MapNode[] {
  return graph.nodes.filter((n) => publicPlace(n) && (category === 'all' || catOf(n) === category));
}
