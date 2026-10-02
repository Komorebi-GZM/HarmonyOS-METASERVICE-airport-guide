// Canvas 2D 地图视图 —— Web 端只是"绘制命令流的解释器"。
//
// 图层顺序、用色、标签阈值、命中半径全部来自 @core 的 render.ts（与小程序的解释器共用同一份规则）。
// 这里只负责：画布尺寸/DPR、手势（拖拽/捏合/点选）、把 DrawCommand 翻译成 Canvas 2D 调用。

import {
  AIRPORT, Viewport, renderFloor, hitTest, fitFloorViewport, fitRouteViewport,
  type DrawCommand,
} from '@core';
import type { MapNode } from '@core';

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

export function createMapView(container: HTMLElement, lang: () => boolean, opts: MapViewOptions = {}): MapView {
  const wrap = document.createElement('div');
  wrap.className = 'map';
  const canvas = document.createElement('canvas');
  canvas.className = 'map-canvas';
  wrap.appendChild(canvas);
  container.appendChild(wrap);

  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  let vp = new Viewport();
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
  let pinchDistance: number | undefined;

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

  function fitFloorNow(): void {
    vp = fitFloorViewport(AIRPORT, floor, cssW, cssH);
  }

  function fitRouteNow(): void {
    if (routeIds.length === 0) { fitFloorNow(); return; }
    vp = fitRouteViewport(AIRPORT, routeIds, cssW, cssH);
  }

  /** 把命令流翻译成 Canvas 2D 调用 */
  function interpret(command: DrawCommand): void {
    switch (command.kind) {
      case 'fillRect':
        ctx.fillStyle = command.color;
        ctx.fillRect(command.x, command.y, command.width, command.height);
        return;
      case 'labelPlate': {
        ctx.fillStyle = command.color;
        const r = 3;
        const roundRect = (ctx as CanvasRenderingContext2D & {
          roundRect?: (x: number, y: number, w: number, h: number, radii: number) => void;
        }).roundRect;
        if (typeof roundRect === 'function') {
          ctx.beginPath();
          roundRect.call(ctx, command.x, command.y, command.width, command.height, r);
          ctx.fill();
        } else {
          ctx.fillRect(command.x, command.y, command.width, command.height);
        }
        return;
      }
      case 'polyline': {
        if (command.points.length < 2) { return; }
        ctx.strokeStyle = command.color;
        ctx.lineWidth = command.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(command.points[0].x, command.points[0].y);
        for (let i = 1; i < command.points.length; i++) {
          ctx.lineTo(command.points[i].x, command.points[i].y);
        }
        ctx.stroke();
        return;
      }
      case 'circle': {
        ctx.beginPath();
        ctx.arc(command.x, command.y, command.radius, 0, Math.PI * 2);
        ctx.fillStyle = command.fill;
        ctx.fill();
        if (command.stroke !== null) {
          ctx.lineWidth = command.strokeWidth;
          ctx.strokeStyle = command.stroke;
          ctx.stroke();
        }
        return;
      }
      case 'text': {
        ctx.font = `${command.size}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = command.align;
        ctx.textBaseline = command.baseline === 'middle' ? 'middle' : 'top';
        ctx.fillStyle = command.color;
        ctx.fillText(command.string, command.x, command.y);
        return;
      }
    }
  }

  function draw(): void {
    const commands = renderFloor(AIRPORT, {
      floor,
      viewport: vp,
      width: cssW,
      height: cssH,
      routeNodeIds: routeIds,
      currentRouteIndex: currentIndex,
      startId,
      endId,
      en: lang(),
    });
    ctx.clearRect(0, 0, cssW, cssH);
    for (const command of commands) { interpret(command); }
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
      const distance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (pinchDistance !== undefined && pinchDistance > 0) {
        vp.pinch((pts[0].x + pts[1].x) / 2, (pts[0].y + pts[1].y) / 2, distance / pinchDistance);
        moved = true;
        draw();
      }
      pinchDistance = distance;
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
    if (pointers.size < 2) { pinchDistance = undefined; }
    if (pointers.size === 0) { dragging = false; }
    if (p !== undefined && !moved && opts.onNodeTap !== undefined) {
      const hit = hitTest(AIRPORT, floor, vp, p.x, p.y);
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
        const node = AIRPORT.node(first);
        if (node !== undefined) { floor = node.floor; }
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
