// 小程序 Canvas 2D 解释器：与 Web 端 map-view.ts 一样，只负责"执行绘制命令"。
// 图层顺序、用色、标签阈值、命中半径全部来自共享核心的 render.js（打包在 core.js 里）。

const { core } = require('./model.js');
const { renderFloor, hitTest, fitFloorViewport, fitRouteViewport } = core;

const ROUTE_INSETS = core.ROUTE_INSETS;
const BROWSE_INSETS = core.BROWSE_INSETS;

/** 初始化 canvas 2d 节点（小程序要求显式取 node 并设置物理像素） */
function initCanvas(page, selector) {
  return new Promise((resolve) => {
    wx.createSelectorQuery()
      .in(page)
      .select(selector)
      .fields({ node: true, size: true })
      .exec((res) => {
        const item = res && res[0];
        if (!item || !item.node) { resolve(null); return; }
        const canvas = item.node;
        const ctx = canvas.getContext('2d');
        const dpr = (wx.getWindowInfo && wx.getWindowInfo().pixelRatio) || 2;
        canvas.width = Math.round(item.width * dpr);
        canvas.height = Math.round(item.height * dpr);
        ctx.scale(dpr, dpr);
        resolve({ canvas, ctx, width: item.width, height: item.height });
      });
  });
}

/** 把命令流画到 ctx 上 */
function paint(ctx, commands) {
  for (let i = 0; i < commands.length; i++) {
    const c = commands[i];
    if (c.kind === 'fillRect') {
      ctx.fillStyle = c.color;
      ctx.fillRect(c.x, c.y, c.width, c.height);
    } else if (c.kind === 'labelPlate') {
      ctx.fillStyle = c.color;
      if (typeof ctx.roundRect === 'function') {
        ctx.beginPath();
        ctx.roundRect(c.x, c.y, c.width, c.height, 3);
        ctx.fill();
      } else {
        ctx.fillRect(c.x, c.y, c.width, c.height);
      }
    } else if (c.kind === 'polyline') {
      if (c.points.length < 2) { continue; }
      ctx.strokeStyle = c.color;
      ctx.lineWidth = c.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(c.points[0].x, c.points[0].y);
      for (let j = 1; j < c.points.length; j++) {
        ctx.lineTo(c.points[j].x, c.points[j].y);
      }
      ctx.stroke();
    } else if (c.kind === 'circle') {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      ctx.fillStyle = c.fill;
      ctx.fill();
      if (c.stroke !== null) {
        ctx.lineWidth = c.strokeWidth;
        ctx.strokeStyle = c.stroke;
        ctx.stroke();
      }
    } else if (c.kind === 'text') {
      ctx.font = c.size + 'px sans-serif';
      ctx.textAlign = c.align;
      ctx.textBaseline = c.baseline === 'middle' ? 'middle' : 'top';
      ctx.fillStyle = c.color;
      ctx.fillText(c.string, c.x, c.y);
    }
  }
}

/** 地图控制器：视口状态 + 渲染 + 手势（拖拽/双指缩放/点选） */
function createMapController(page, selector, options) {
  const state = {
    ctx: null,
    width: 380,
    height: 320,
    viewport: new core.Viewport(),
    floor: core.AIRPORT.floorOrder[0],
    routeIds: [],
    currentIndex: -1,
    startId: '',
    endId: '',
    en: false,
    dragging: false,
    moved: false,
    lastX: 0,
    lastY: 0,
    pinchDistance: 0,
  };

  function fitFloor() {
    state.viewport = fitFloorViewport(core.AIRPORT, state.floor, state.width, state.height);
  }

  function fitRoute() {
    if (state.routeIds.length === 0) { fitFloor(); return; }
    state.viewport = fitRouteViewport(core.AIRPORT, state.routeIds, state.width, state.height);
  }

  function draw() {
    if (state.ctx === null) { return; }
    const commands = renderFloor(core.AIRPORT, {
      floor: state.floor,
      viewport: state.viewport,
      width: state.width,
      height: state.height,
      routeNodeIds: state.routeIds,
      currentRouteIndex: state.currentIndex,
      startId: state.startId,
      endId: state.endId,
      en: state.en,
    });
    state.ctx.clearRect(0, 0, state.width, state.height);
    paint(state.ctx, commands);
  }

  return {
    state,
    async mount() {
      const node = await initCanvas(page, selector);
      if (node === null) { return null; }
      state.ctx = node.ctx;
      state.width = node.width;
      state.height = node.height;
      fitFloor();
      draw();
      return node;
    },
    setFloor(floor) { state.floor = floor; state.currentIndex = -1; fitFloor(); draw(); },
    setRoute(routeIds, currentIndex, startId, endId, en) {
      state.routeIds = routeIds.slice();
      state.currentIndex = currentIndex;
      state.startId = startId || '';
      state.endId = endId || '';
      state.en = en === true;
      const first = state.routeIds[0];
      if (first) {
        const node = core.AIRPORT.node(first);
        if (node) { state.floor = node.floor; }
      }
      fitRoute();
      draw();
    },
    setMarkers(startId, endId) { state.startId = startId || ''; state.endId = endId || ''; draw(); },
    fitFloor, fitRoute,
    zoomBy(step) { state.viewport.zoomBy(state.width / 2, state.height / 2, step); draw(); },
    redraw: draw,
    touchStart(e) {
      const t = e.touches[0];
      state.dragging = true;
      state.moved = false;
      state.lastX = t.x;
      state.lastY = t.y;
      state.pinchDistance = e.touches.length >= 2
        ? Math.hypot(e.touches[0].x - e.touches[1].x, e.touches[0].y - e.touches[1].y)
        : 0;
    },
    touchMove(e) {
      if (e.touches.length >= 2) {
        const d = Math.hypot(e.touches[0].x - e.touches[1].x, e.touches[0].y - e.touches[1].y);
        if (state.pinchDistance > 0 && d > 0) {
          state.viewport.pinch(
            (e.touches[0].x + e.touches[1].x) / 2,
            (e.touches[0].y + e.touches[1].y) / 2,
            d / state.pinchDistance,
          );
          state.moved = true;
          draw();
        }
        state.pinchDistance = d;
        return;
      }
      const t = e.touches[0];
      const dx = t.x - state.lastX;
      const dy = t.y - state.lastY;
      if (Math.abs(dx) + Math.abs(dy) >= 3) { state.moved = true; }
      state.lastX = t.x;
      state.lastY = t.y;
      state.viewport.pan(dx, dy);
      draw();
    },
    touchEnd(e) {
      state.dragging = false;
      state.pinchDistance = 0;
      if (state.moved || typeof options.onNodeTap !== 'function') { return; }
      const t = (e.changedTouches && e.changedTouches[0]) || null;
      if (t === null) { return; }
      const hit = hitTest(core.AIRPORT, state.floor, state.viewport, t.x, t.y);
      options.onNodeTap(hit || null);
    },
  };
}

module.exports = { initCanvas, paint, createMapController, ROUTE_INSETS, BROWSE_INSETS };
