// 地图渲染器（平台无关）：把"画什么"编译成一批绘制命令。
//
// 为什么放在核心而不是各端 UI 里：
//   Web（DOM Canvas）、微信小程序（Canvas 2D）、Swift（SwiftUI Canvas）三端画的是同一张图，
//   图层顺序、用色、标签阈值、命中半径这些细节一旦各写一遍必然漂移。
//   现在三端都只做"解释命令"，规则只在这里定义一次，并可被跨语言基准逐命令比对。
//
// 与 ArkTS 的 harmony_app/.../ui/FloorCanvas.ets 图层顺序一一对应：
//   底色 → 楼层底板 → 走廊双描边 → 路径（全程/当前段）→ 节点 → 标签 → 起终点标记 → 楼层水印

import type { AirportGraph } from './graph.ts';
import type { MapNode } from './types.ts';
import { Viewport, ROUTE_INSETS, BROWSE_INSETS } from './viewport.ts';
import { nodeName, t } from './i18n.ts';

export interface DrawPoint {
  x: number;
  y: number;
}

/** 一条绘制命令；坐标为视图（屏幕）坐标 */
export type DrawCommand =
  | { kind: 'fillRect'; x: number; y: number; width: number; height: number; color: string }
  | { kind: 'polyline'; points: DrawPoint[]; color: string; width: number }
  | { kind: 'circle'; x: number; y: number; radius: number; fill: string; stroke: string | null; strokeWidth: number }
  | { kind: 'labelPlate'; x: number; y: number; width: number; height: number; color: string }
  | {
      kind: 'text';
      x: number;
      y: number;
      string: string;
      size: number;
      color: string;
      align: 'left' | 'center' | 'right';
      baseline: 'top' | 'middle';
    };

/**
 * 画布上的固定用色。
 * 注意 `routeDone`：ArkTS 的 FloorCanvas 实画的是 #9ACCC6，而 Theme.ROUTE.trans 是 #B7DBD7
 * （两者已漂移，见 docs/TODO.md T-206）。这里按"实画值"对齐，保证三端观感一致。
 */
export const CANVAS = {
  routeDone: '#9ACCC6',
  routeLive: '#007F7A',
  corridorCasing: '#DCE6E8',
  corridorFill: '#FFFFFF',
  floorBase: '#E9F0F1',
  markerEnd: '#B86A12',
  hitRadius: 22,
} as const;

/** 标签底片宽度估算（三端一致的口径：不依赖 measureText，便于逐命令比对） */
export function labelWidth(text: string, size: number): number {
  return text.length * size * 0.62 + 4;
}

export interface RenderInput {
  floor: string;
  viewport: Viewport;
  width: number;
  height: number;
  routeNodeIds?: string[];
  currentRouteIndex?: number;
  startId?: string;
  endId?: string;
  en?: boolean;
}

/** 与 ArkTS / Swift 一致的节点半径规则 */
export function nodeRadius(node: MapNode): number {
  if (node.type === 'corridor') { return 2.6; }
  if (node.type === 'lift' || node.type === 'escalator' || node.type === 'stair') { return 4; }
  return 5.5;
}

/** 标签可见性：放大到一定程度显示全部，中等缩放只显示关键类型 */
export function shouldLabel(node: MapNode, zoom: number): boolean {
  if (node.type === 'corridor') { return false; }
  if (zoom >= 0.85) { return true; }
  if (zoom >= 0.5) {
    return node.type === 'gate' || node.type === 'metro' || node.type === 'checkin'
      || node.type === 'security' || node.type === 'entrance' || node.type === 'exit';
  }
  return false;
}

export function typeColor(graph: AirportGraph, type: string): string {
  return graph.tokens.TYPE_COLOR[type] ?? '#486A85';
}

/** 生成某层的全部绘制命令（顺序即图层顺序） */
export function renderFloor(graph: AirportGraph, input: RenderInput): DrawCommand[] {
  const vp = input.viewport;
  const floor = input.floor;
  const en = input.en === true;
  const routeIds = input.routeNodeIds ?? [];
  const currentIndex = input.currentRouteIndex ?? -1;
  const startId = input.startId ?? '';
  const endId = input.endId ?? '';
  const commands: DrawCommand[] = [];

  // 1. 底色
  commands.push({
    kind: 'fillRect', x: 0, y: 0, width: input.width, height: input.height,
    color: graph.tokens.MAP.surface,
  });

  // 2. 楼层底板（按该层陆/空节点占比选色）
  const nodes = graph.floorNodes(floor);
  const landCount = nodes.filter((n) => n.side === 'land').length;
  const bbox = graph.floorBBox(floor);
  const wash = landCount * 2 >= nodes.length ? graph.tokens.MAP.landWash : graph.tokens.MAP.airWash;
  commands.push({
    kind: 'fillRect',
    x: vp.scrX(bbox[0]), y: vp.scrY(bbox[1]),
    width: (bbox[2] - bbox[0]) * vp.zoom,
    height: (bbox[3] - bbox[1]) * vp.zoom,
    color: wash,
  });

  // 3. 走廊：深色外描边 + 白色内芯
  const onFloor = new Set(nodes.map((n) => n.id));
  const casing: DrawPoint[] = [];
  const fill: DrawPoint[] = [];
  for (const edge of graph.edges) {
    if (edge.type !== 'walk') { continue; }
    if (!onFloor.has(edge.from) || !onFloor.has(edge.to)) { continue; }
    const a = graph.requireNode(edge.from);
    const b = graph.requireNode(edge.to);
    casing.push({ x: vp.scrX(a.x), y: vp.scrY(a.y) }, { x: vp.scrX(b.x), y: vp.scrY(b.y) });
    fill.push({ x: vp.scrX(a.x), y: vp.scrY(a.y) }, { x: vp.scrX(b.x), y: vp.scrY(b.y) });
  }
  if (casing.length > 0) {
    commands.push({ kind: 'polyline', points: casing, color: CANVAS.corridorCasing, width: Math.max(6, 22 * vp.zoom) });
    commands.push({ kind: 'polyline', points: fill, color: CANVAS.corridorFill, width: Math.max(4, 18 * vp.zoom) });
  }

  // 4. 路径：全程（褪色）+ 当前路段（强调）
  if (routeIds.length > 1) {
    const all: DrawPoint[] = [];
    for (const id of routeIds) {
      const node = graph.node(id);
      if (node !== undefined) { all.push({ x: vp.scrX(node.x), y: vp.scrY(node.y) }); }
    }
    commands.push({
      kind: 'polyline', points: all, color: CANVAS.routeDone,
      width: Math.max(4, 5 * Math.min(vp.zoom + 0.6, 1.6)),
    });
    if (currentIndex >= 0 && currentIndex < routeIds.length) {
      const from = Math.max(0, currentIndex - 1);
      const slice: DrawPoint[] = [];
      for (const id of routeIds.slice(from, currentIndex + 1)) {
        const node = graph.node(id);
        if (node !== undefined) { slice.push({ x: vp.scrX(node.x), y: vp.scrY(node.y) }); }
      }
      if (slice.length > 1) {
        commands.push({
          kind: 'polyline', points: slice, color: CANVAS.routeLive,
          width: Math.max(5, 6 * Math.min(vp.zoom + 0.6, 1.6)),
        });
      }
    }
  }

  // 5. 节点
  const nodeScale = Math.min(Math.max(vp.zoom, 0.8), 2);
  for (const node of nodes) {
    commands.push({
      kind: 'circle',
      x: vp.scrX(node.x), y: vp.scrY(node.y),
      radius: Math.max(2, nodeRadius(node) * nodeScale),
      fill: typeColor(graph, node.type),
      stroke: node.type === 'corridor' ? null : '#FFFFFF',
      strokeWidth: 1.4,
    });
  }

  // 6. 标签（带底片，避免压住线条）
  for (const node of nodes) {
    if (!shouldLabel(node, vp.zoom)) { continue; }
    const text = nodeName(node, en);
    if (text.length === 0) { continue; }
    const size = vp.zoom >= 1.6 ? 12 : 11;
    const lx = vp.scrX(node.x) + 8;
    const ly = vp.scrY(node.y) - 9;
    commands.push({
      kind: 'labelPlate', x: lx - 2, y: ly - size / 2 - 1,
      width: labelWidth(text, size), height: size + 2, color: 'rgba(255,255,255,0.86)',
    });
    commands.push({
      kind: 'text', x: lx, y: ly, string: text, size, color: graph.tokens.MAP.ink,
      align: 'left', baseline: 'middle',
    });
  }

  // 7. 起终点标记（只画在各自所属楼层）
  const start = startId === '' ? undefined : graph.node(startId);
  if (start !== undefined && start.floor === floor) {
    commands.push({
      kind: 'circle', x: vp.scrX(start.x), y: vp.scrY(start.y), radius: 11,
      fill: CANVAS.routeLive, stroke: '#FFFFFF', strokeWidth: 2,
    });
    commands.push({
      kind: 'text', x: vp.scrX(start.x), y: vp.scrY(start.y), string: t('start_marker', en),
      size: 12, color: '#FFFFFF', align: 'center', baseline: 'middle',
    });
  }
  const end = endId === '' ? undefined : graph.node(endId);
  if (end !== undefined && end.floor === floor) {
    commands.push({
      kind: 'circle', x: vp.scrX(end.x), y: vp.scrY(end.y), radius: 11,
      fill: CANVAS.markerEnd, stroke: '#FFFFFF', strokeWidth: 2,
    });
    commands.push({
      kind: 'text', x: vp.scrX(end.x), y: vp.scrY(end.y), string: t('end_marker', en),
      size: 12, color: '#FFFFFF', align: 'center', baseline: 'middle',
    });
  }

  // 8. 楼层水印
  commands.push({
    kind: 'text', x: input.width - 12, y: 10, string: floor, size: 13,
    color: graph.tokens.MAP.ink2, align: 'right', baseline: 'top',
  });

  return commands;
}

/** 命中测试：视图坐标 → 最近的可见节点（默认半径 22），三端行为一致 */
export function hitTest(
  graph: AirportGraph,
  floor: string,
  viewport: Viewport,
  x: number,
  y: number,
  radius: number = CANVAS.hitRadius,
): MapNode | undefined {
  let best: MapNode | undefined;
  let bestDistance = radius;
  for (const node of graph.floorNodes(floor)) {
    const dx = viewport.scrX(node.x) - x;
    const dy = viewport.scrY(node.y) - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = node;
    }
  }
  return best;
}

/** 漫游模式：适配整层 */
export function fitFloorViewport(graph: AirportGraph, floor: string, width: number, height: number): Viewport {
  const vp = new Viewport();
  vp.fitInsets(
    graph.floorBBox(floor), width, height,
    BROWSE_INSETS.left, BROWSE_INSETS.top, BROWSE_INSETS.right, BROWSE_INSETS.bottom,
  );
  return vp;
}

/** 路线模式：适配整条路线（外扩 pad） */
export function fitRouteViewport(
  graph: AirportGraph,
  nodeIds: string[],
  width: number,
  height: number,
  pad: number = 24,
): Viewport {
  const vp = new Viewport();
  if (nodeIds.length === 0) { return vp; }
  let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
  for (const id of nodeIds) {
    const node = graph.node(id);
    if (node === undefined) { continue; }
    if (node.x < minX) { minX = node.x; }
    if (node.y < minY) { minY = node.y; }
    if (node.x > maxX) { maxX = node.x; }
    if (node.y > maxY) { maxY = node.y; }
  }
  if (!Number.isFinite(minX)) { return vp; }
  vp.fitInsets(
    [minX - pad, minY - pad, maxX + pad, maxY + pad], width, height,
    ROUTE_INSETS.left, ROUTE_INSETS.top, ROUTE_INSETS.right, ROUTE_INSETS.bottom,
  );
  return vp;
}
