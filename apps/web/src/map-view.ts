// Canvas 2D 地图渲染器 —— harmony_app/.../ui/FloorCanvas.ets 的 Web 移植。
// 保留原设计的图层顺序与用色语义，去掉 ArkUI 特有的手势/组件部分。
//
// 用色来源：packages/core 的令牌（APP/MAP/TYPE_COLOR/ROUTE/HIT）。
// 注意：ArkTS 版 FloorCanvas 里路径实画色是硬编码的 #9ACCC6（与 Theme.ROUTE.trans 漂移），
// 这里先按"实画色"对齐以保持一致观感，漂移已在 docs/TODO.md（T-206）登记。

import {
  AIRPORT, MAP, TYPE_COLOR, Viewport, ROUTE_INSETS, BROWSE_INSETS,
  nodeName, t,
} from '@core';
import type { MapNode } from '@core';

const ROUTE_DONE = '#9ACCC6';   // 已走过 / 全程预览色（对齐 ArkTS 实画值）
const ROUTE_LIVE = '#007F7A';   // 当前路段（APP.accent）
const CORRIDOR_CASING = '#DCE6E8';
const CORRIDOR_FILL = '#FFFFFF';
const FLOOR_BASE = '#E9F0F1';
const HIT_RADIUS = 22;

export interface MapViewOptions {
  onNodeTap?: (node: MapNode) => void;
}

export interface MapView {
  setFloor(floor: string): void;
  setRoute(nodeIds: string[], currentIndex: number): void;
  clearRoute(): void;
  setMarkers(startId: string, endId: string): void;
  fitFloor(): void;
  fitRoute(): void;
  zoomBy(step: number): void;
  getFloor(): string;
  redraw(): void;
  destroy(): void;
}

function radiusOf(node: MapNode): number {
  if (node.type === 'corridor') { return 2.6; }
  if (node.type === 'lift' || node.type === 'escalator' || node.type === 'stair') { return 4; }
  return 5.5;
}

function shouldLabel(node: MapNode, zoom: number): boolean {
  if (node.type === 'corridor') { return false; }
  if (zoom >= 0.85) { return true; }
  if (zoom >= 0.5) {
    return node.type === 'gate' || node.type === 'metro' || node.type === 'checkin'
      || node.type === 'security' || node.type === 'entrance' || node.type === 'exit';
  }
  return false;
}

export function createMapView(container: HTMLElement, lang: () => boolean, opts: MapViewOptions = {}): MapView {
  const wrap = document.createElement('div');
  wrap.className = 'map';
  const canvas = document.createElement('canvas');
  canvas.className = 'map-canvas';
  wrap.appendChild(canvas);
  container.appendChild(wrap);

  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  const vp = new Viewport();
  let floor = AIRPORT.floorOrder[0];
  let routeIds: string[] = [];
  let currentIndex = -1;
  let startId = '';
  let endId = '';
  let cssW = 320;
  let cssH = 320;
  let dragging = false;
  let moved = false;
  let lastX = 0;
  let lastY = 0;
  const pointers = new Map<number, { x: number; y: number }>();

  function resize(): void {
    const rect = wrap.getBoundingClientRect();
    cssW = Math.max(240, Math.round(rect.width));
    cssH = Math.max(220, Math.round(rect.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function fitRouteNow(): void {
    if (routeIds.length === 0) { fitFloorNow(); return; }
    let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
    for (const id of routeIds) {
      const n = AIRPORT.node(id);
      if (n === undefined) { continue; }
      if (n.x < minX) { minX = n.x; }
      if (n.y < minY) { minY = n.y; }
      if (n.x > maxX) { maxX = n.x; }
      if (n.y > maxY) { maxY = n.y; }
    }
    const pad = 24;
    vp.fitInsets([minX - pad, minY - pad, maxX + pad, maxY + pad], cssW, cssH,
      ROUTE_INSETS.left, ROUTE_INSETS.top, ROUTE_INSETS.right, ROUTE_INSETS.bottom);
  }

  function fitFloorNow(): void {
    vp.fitInsets(AIRPORT.floorBBox(floor), cssW, cssH,
      BROWSE_INSETS.left, BROWSE_INSETS.top, BROWSE_INSETS.right, BROWSE_INSETS.bottom);
  }

  function drawCorridors(): void {
    const nodes = AIRPORT.floorNodes(floor);
    const onFloor = new Set(nodes.map((n) => n.id));
    const segs: Array<[MapNode, MapNode]> = [];
    for (const e of AIRPORT.edges) {
      if (e.type !== 'walk') { continue; }
      if (!onFloor.has(e.from) || !onFloor.has(e.to)) { continue; }
      const a = AIRPORT.requireNode(e.from);
      const b = AIRPORT.requireNode(e.to);
      segs.push([a, b]);
    }
    const width = Math.max(6, 22 * vp.zoom);
    const inner = Math.max(4, 18 * vp.zoom);
    ctx.lineCap = 'round';
    ctx.strokeStyle = CORRIDOR_CASING;
    ctx.lineWidth = width;
    ctx.beginPath();
    for (const [a, b] of segs) {
      ctx.moveTo(vp.scrX(a.x), vp.scrY(a.y));
      ctx.lineTo(vp.scrX(b.x), vp.scrY(b.y));
    }
    ctx.stroke();
    ctx.strokeStyle = CORRIDOR_FILL;
    ctx.lineWidth = inner;
    ctx.stroke();
  }

  function pathLine(ids: string[], color: string, width: number): void {
    if (ids.length < 2) { return; }
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i < ids.length; i++) {
      const n = AIRPORT.node(ids[i]);
      if (n === undefined) { continue; }
      if (i === 0) { ctx.moveTo(vp.scrX(n.x), vp.scrY(n.y)); }
      else { ctx.lineTo(vp.scrX(n.x), vp.scrY(n.y)); }
    }
    ctx.stroke();
  }

  function drawMarker(node: MapNode, color: string, label: string): void {
    const x = vp.scrX(node.x);
    const y = vp.scrY(node.y);
    ctx.beginPath();
    ctx.arc(x, y, 11, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y + 0.5);
  }

  function drawLabel(node: MapNode, zoom: number): void {
    const text = nodeName(node, lang());
    if (text.length === 0) { return; }
    const x = vp.scrX(node.x);
    const y = vp.scrY(node.y);
    const size = zoom >= 1.6 ? 12 : 11;
    ctx.font = `${size}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const w = ctx.measureText(text).width;
    const lx = x + 8;
    const ly = y - 9;
    ctx.fillStyle = 'rgba(255,255,255,0.86)';
    ctx.fillRect(lx - 2, ly - size / 2 - 1, w + 4, size + 2);
    ctx.fillStyle = MAP.ink;
    ctx.fillText(text, lx, ly);
  }

  function draw(): void {
    ctx.clearRect(0, 0, cssW, cssH);
    ctx.fillStyle = MAP.surface;
    ctx.fillRect(0, 0, cssW, cssH);

    // 楼层底板
    const bbox = AIRPORT.floorBBox(floor);
    const nodes = AIRPORT.floorNodes(floor);
    const landCount = nodes.filter((n) => n.side === 'land').length;
    ctx.fillStyle = landCount * 2 >= nodes.length ? MAP.landWash : MAP.airWash;
    const bx = vp.scrX(bbox[0]);
    const by = vp.scrY(bbox[1]);
    ctx.fillRect(bx, by, (bbox[2] - bbox[0]) * vp.zoom, (bbox[3] - bbox[1]) * vp.zoom);

    drawCorridors();

    // 路径：全程（褪色）+ 当前路段（强调）
    if (routeIds.length > 1) {
      pathLine(routeIds, ROUTE_DONE, Math.max(4, 5 * Math.min(vp.zoom + 0.6, 1.6)));
      if (currentIndex >= 0) {
        const from = Math.max(0, currentIndex - 1);
        pathLine(routeIds.slice(from, currentIndex + 1), ROUTE_LIVE, Math.max(5, 6 * Math.min(vp.zoom + 0.6, 1.6)));
      }
    }

    // 节点
    for (const n of nodes) {
      const r = radiusOf(n);
      ctx.beginPath();
      ctx.arc(vp.scrX(n.x), vp.scrY(n.y), Math.max(2, r * Math.min(Math.max(vp.zoom, 0.8), 2)), 0, Math.PI * 2);
      ctx.fillStyle = TYPE_COLOR[n.type] ?? '#486A85';
      ctx.fill();
      if (n.type !== 'corridor') {
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();
      }
    }

    for (const n of nodes) {
      if (shouldLabel(n, vp.zoom)) { drawLabel(n, vp.zoom); }
    }

    const s = startId === '' ? undefined : AIRPORT.node(startId);
    const e = endId === '' ? undefined : AIRPORT.node(endId);
    if (s !== undefined && s.floor === floor) {
      drawMarker(s, ROUTE_LIVE, t('start_marker', lang()));
    }
    if (e !== undefined && e.floor === floor) {
      drawMarker(e, '#B86A12', t('end_marker', lang()));
    }

    // 楼层名水印
    ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillStyle = MAP.ink2;
    ctx.fillText(floor, cssW - 12, 10);
  }

  function pick(sx: number, sy: number): MapNode | undefined {
    let best: MapNode | undefined;
    let bestD = HIT_RADIUS;
    for (const n of AIRPORT.floorNodes(floor)) {
      const dx = vp.scrX(n.x) - sx;
      const dy = vp.scrY(n.y) - sy;
      const d = Math.hypot(dx, dy);
      if (d < bestD) { bestD = d; best = n; }
    }
    return best;
  }

  function localPoint(ev: PointerEvent): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
  }

  canvas.addEventListener('pointerdown', (ev: PointerEvent) => {
    canvas.setPointerCapture(ev.pointerId);
    pointers.set(ev.pointerId, localPoint(ev));
    dragging = true;
    moved = false;
    const p = localPoint(ev);
    lastX = p.x;
    lastY = p.y;
  });

  canvas.addEventListener('pointermove', (ev: PointerEvent) => {
    if (!pointers.has(ev.pointerId)) { return; }
    const p = localPoint(ev);
    pointers.set(ev.pointerId, p);
    if (pointers.size >= 2) {
      const pts = [...pointers.values()];
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const prevD = (canvas as HTMLCanvasElement & { __pinch?: number }).__pinch;
      if (prevD !== undefined && prevD > 0) {
        const cx = (pts[0].x + pts[1].x) / 2;
        const cy = (pts[0].y + pts[1].y) / 2;
        vp.pinch(cx, cy, d / prevD);
        moved = true;
        draw();
      }
      (canvas as HTMLCanvasElement & { __pinch?: number }).__pinch = d;
      return;
    }
    if (dragging) {
      const dx = p.x - lastX;
      const dy = p.y - lastY;
      if (Math.abs(dx) + Math.abs(dy) >= 3) { moved = true; }
      lastX = p.x;
      lastY = p.y;
      vp.pan(dx, dy);
      draw();
    }
  });

  function endPointer(ev: PointerEvent): void {
    const p = pointers.get(ev.pointerId);
    pointers.delete(ev.pointerId);
    if (pointers.size < 2) {
      (canvas as HTMLCanvasElement & { __pinch?: number }).__pinch = undefined;
    }
    if (pointers.size === 0) { dragging = false; }
    if (p !== undefined && !moved && opts.onNodeTap !== undefined) {
      const hit = pick(p.x, p.y);
      if (hit !== undefined) { opts.onNodeTap(hit); }
    }
  }
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);

  canvas.addEventListener('wheel', (ev: WheelEvent) => {
    ev.preventDefault();
    const rect = canvas.getBoundingClientRect();
    vp.pinch(ev.clientX - rect.left, ev.clientY - rect.top, ev.deltaY < 0 ? 1.12 : 0.89);
    draw();
  }, { passive: false });

  const observer = new ResizeObserver(() => resize());
  observer.observe(wrap);
  resize();
  fitFloorNow();
  draw();

  return {
    setFloor(f: string): void {
      floor = f;
      fitFloorNow();
      draw();
    },
    setRoute(ids: string[], index: number): void {
      routeIds = ids.slice();
      currentIndex = index;
      const first = routeIds[0];
      if (first !== undefined) {
        const n = AIRPORT.node(first);
        if (n !== undefined) { floor = n.floor; }
      }
      fitRouteNow();
      draw();
    },
    clearRoute(): void {
      routeIds = [];
      currentIndex = -1;
      draw();
    },
    setMarkers(s: string, e: string): void {
      startId = s;
      endId = e;
      draw();
    },
    fitFloor(): void {
      fitFloorNow();
      draw();
    },
    fitRoute(): void {
      fitRouteNow();
      draw();
    },
    zoomBy(step: number): void {
      vp.zoomBy(cssW / 2, cssH / 2, step);
      draw();
    },
    getFloor(): string {
      return floor;
    },
    redraw(): void {
      draw();
    },
    destroy(): void {
      observer.disconnect();
      wrap.remove();
    },
  };
}
