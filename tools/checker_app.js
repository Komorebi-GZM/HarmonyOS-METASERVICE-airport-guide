/* airport-guide 节点图对照校准工具
 * 纯浏览器原生 JS，无依赖。配合 checker.html（打开即用）。
 * 把 real 平面图拖进来 -> 对齐/拖动/打点 -> 导出修正后的地图 JSON。
 */
'use strict';

/* ================= 调色板（沿用 dataviz 参考色板） ================= */
const NODE_COLOR = {
  entrance: '#008300', exit: '#16a34a', checkin: '#4a3aa7', security: '#e34948',
  gate: '#2a78d6', lift: '#eb6834', escalator: '#eda100', stair: '#884d4b',
  apm_station: '#e87ba4', metro: '#1baf7a', coach: '#52514e', parking: '#898781',
  baggage: '#0d9488', toilet: '#0ea5e9', hall: '#5b6478', corridor: '#9aa3b2',
};
const WAYPOINT = new Set(['corridor']);
const EDGE_STYLE = {
  walk: { color: '#b3aca1', width: 1.4, dash: null },
  elevator: { color: '#eb6834', width: 1.8, dash: [6, 4] },
  escalator: { color: '#eda100', width: 1.8, dash: [6, 4] },
  stair: { color: '#6b7280', width: 1.8, dash: [4, 4] },
  apm: { color: '#e87ba4', width: 2.0, dash: [8, 4] },
};
const STATUS = { UNCHECKED: 'unchecked', OK: 'ok', FLAG: 'flag', MOVED: 'moved' };
const STATUS_ORDER = [STATUS.UNCHECKED, STATUS.OK, STATUS.FLAG];
const STATUS_RING = { unchecked: '#c7c6bd', ok: '#008300', flag: '#e34948', moved: '#eb6834' };
const STATUS_CN = { unchecked: '未核对', ok: '已确认', flag: '存疑', moved: '已移动' };
const FONT = "system-ui, -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif";

/* ================= 全局状态 ================= */
const AIRPORTS = (window.AIRPORTS || {});   // 由 checker.html 注入 { XHA:{...} }
const S = {
  airport: null, floor: null,
  images: {},            // `${ap}:${floor}` -> { img, w, h }
  status: {},            // `${ap}:${floor}:${id}` -> STATUS
  pxPm: {},              // `${ap}:${floor}` -> 校准后的每米像素
  trans: {},             // `${ap}:${floor}` -> { s,tx,ty,rot,flipH,flipV }
  origin: {},            // `${ap}:${floor}` -> 该层节点坐标快照（原始 JSON）
  graph: {},             // `${ap}:${floor}` -> { cx,cy,w,h } 图坐标包围盒中心
  lastHit: null,
  dragNode: null, dragPan: null,
  tool: 'select',        // select | calibrate  *
  calib: null,           // calibrate: {pts:[]}
  showLabels: true, showEdges: true, opacity: 0.85,
};
/* * 拖动节点与点选都在 canvas 上直接做，tool 只区分"普通"与"校准比例尺" */

const cv = document.getElementById('cv');
const ctx = cv.getContext('2d');
let cssW = 0, cssH = 0;

/* ================= 工具函数 ================= */
function key() { return `${S.airport}:${S.floor}`; }
function imgRef() { return S.images[key()] || null; }
function imgDims() { const im = imgRef(); return im ? { w: im.w, h: im.h } : { w: cssW, h: cssH }; }
function graphNodes() { const m = AIRPORTS[S.airport]; return (m ? m.nodes : []).filter(n => n.floor === S.floor); }
function graphEdges() {
  const m = AIRPORTS[S.airport]; if (!m) return [];
  const ids = new Set(graphNodes().map(n => n.id));
  return m.edges.filter(e => ids.has(e.from) && ids.has(e.to));
}
function statusOf(id) { return S.status[`${key()}:${id}`] || STATUS.UNCHECKED; }
function setStatus(id, st) { S.status[`${key()}:${id}`] = st; renderPanel(); redraw(); }

function applyT(gx, gy) {
  // 图坐标 -> 图像坐标（含翻转/旋转/缩放/平移）
  let x = gx - S.graph[key()].cx, y = gy - S.graph[key()].cy;
  const t = S.trans[key()];
  if (t.flipH) x = -x;
  if (t.flipV) y = -y;
  const rad = t.rot * Math.PI / 180;
  const rx = x * Math.cos(rad) - y * Math.sin(rad);
  const ry = x * Math.sin(rad) + y * Math.cos(rad);
  const d = imgDims();
  return { x: d.w / 2 + rx * t.s + t.tx, y: d.h / 2 + ry * t.s + t.ty };
}
function invT(ix, iy) {
  const t = S.trans[key()], d = imgDims();
  let x = (ix - d.w / 2 - t.tx) / t.s, y = (iy - d.h / 2 - t.ty) / t.s;
  const rad = -t.rot * Math.PI / 180;
  const rx = x * Math.cos(rad) - y * Math.sin(rad);
  const ry = x * Math.sin(rad) + y * Math.cos(rad);
  // 求逆次序：上面已反向旋转，这里再撤销翻转
  let gx = rx, gy = ry;
  if (t.flipH) gx = -gx;
  if (t.flipV) gy = -gy;
  return { x: gx + S.graph[key()].cx, y: gy + S.graph[key()].cy };
}

/* ================= 视图（图像 -> 画布，保持整图可见） ================= */
function view() {
  const d = imgDims();
  const s = Math.min((cssW - 24) / Math.max(1, d.w), (cssH - 24) / Math.max(1, d.h));
  return { s, ox: (cssW - d.w * s) / 2, oy: (cssH - d.h * s) / 2 };
}
function i2c(x, y) { const v = view(); return { x: x * v.s + v.ox, y: y * v.s + v.oy }; }
function c2i(x, y) { const v = view(); return { x: (x - v.ox) / v.s, y: (y - v.oy) / v.s }; }

function graphToCanvas(n) { const p = applyT(n.x, n.y); return i2c(p.x, p.y); }

/* ================= 初始化 / 楼层切换 ================= */
function ensureFloorInit(f) {
  if (S.graph[key()]) return;
  const nodes = graphNodes();
  if (!nodes.length) return;
  let minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
  nodes.forEach(n => { minx = Math.min(minx, n.x); maxx = Math.max(maxx, n.x); miny = Math.min(miny, n.y); maxy = Math.max(maxy, n.y); });
  S.graph[key()] = { cx: (minx + maxx) / 2, cy: (miny + maxy) / 2, w: maxx - minx, h: maxy - miny };
  S.origin[key()] = JSON.parse(JSON.stringify(nodes.map(n => ({ id: n.id, x: n.x, y: n.y }))));
  resetTransform();
}
function resetTransform() {
  const im = imgRef();
  const d = im ? { w: im.w, h: im.h } : { w: 1000, h: 700 };
  const g = S.graph[key()] || { w: 1000, h: 800, cx: 500, cy: 400 };
  let s = 1;
  if (g.w > 0 && g.h > 0) s = Math.min(d.w / g.w, d.h / g.h) * 0.85;
  S.trans[key()] = { s: Math.max(0.05, s), tx: 0, ty: 0, rot: 0, flipH: false, flipV: false };
  redraw();
}
function setAnchor(s2) {} // 保留：留给以后做“单点吸附”用（当前未启用）

function selectAirport(code) { S.airport = code; selectFloor(0); }
function selectFloor(idx) {
  const m = AIRPORTS[S.airport];
  const floors = Object.keys(m.meta.floors);
  S.floor = floors[idx];
  ensureFloorInit(S.floor);
  updateChrome(); renderPanel(); redraw();
}
function setImage(fileOrDataUrl) {
  const im = new Image();
  im.onload = () => {
    S.images[key()] = { img: im, w: im.naturalWidth || im.width, h: im.naturalHeight || im.height };
    resetTransform();
  };
  if (typeof fileOrDataUrl === 'string') im.src = fileOrDataUrl;
  else im.src = URL.createObjectURL(fileOrDataUrl);
}

/* ================= 绘制 ================= */
function sizeCanvas() {
  const r = cv.parentElement.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  cssW = Math.max(200, Math.round(r.width));
  cssH = Math.max(200, Math.round(r.height));
  cv.width = Math.round(cssW * dpr);
  cv.height = Math.round(cssH * dpr);
  cv.style.width = cssW + 'px';
  cv.style.height = cssH + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
function redraw() {
  if (!ctx || !S.airport) return;
  sizeCanvas();
  const v = view();
  // 棋盘背景
  ctx.fillStyle = '#f4f3f0';
  ctx.fillRect(0, 0, cssW, cssH);
  ctx.fillStyle = '#e9e8e3';
  const c = 20;
  for (let y = 0; y < cssH; y += c) for (let x = 0; x < cssW; x += c)
    if (((x / c) + (y / c)) % 2 === 0) ctx.fillRect(x, y, c, c);

  const im = imgRef();
  const d = imgDims();
  if (im) {
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, cssW, cssH); ctx.clip();
    ctx.drawImage(im.img, v.ox, v.oy, d.w * v.s, d.h * v.s);
    ctx.restore();
  }
  if (!S.graph[key()]) return;

  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, cssW, cssH); ctx.clip();
  ctx.globalAlpha = S.opacity;

  // 边
  if (S.showEdges) {
    for (const e of graphEdges()) {
      const a = AIRPORTS[S.airport].nodes.find(n => n.id === e.from);
      const b = AIRPORTS[S.airport].nodes.find(n => n.id === e.to);
      if (!a || !b) continue;
      const pa = graphToCanvas(a), pb = graphToCanvas(b);
      const st = EDGE_STYLE[e.type] || EDGE_STYLE.walk;
      ctx.strokeStyle = st.color; ctx.lineWidth = st.width;
      ctx.setLineDash(st.dash || []);
      ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  // 节点
  for (const n of graphNodes()) {
    const p = graphToCanvas(n);
    const type = n.type;
    const isWay = WAYPOINT.has(type);
    const rad = isWay ? 4.5 : 7;
    // 状态外圈
    ctx.strokeStyle = STATUS_RING[statusOf(n.id)] || STATUS_RING[STATUS.UNCHECKED];
    ctx.lineWidth = statusOf(n.id) === STATUS.UNCHECKED ? 1.5 : 2.5;
    ctx.beginPath(); ctx.arc(p.x, p.y, rad + 2.5, 0, Math.PI * 2); ctx.stroke();
    // 类型圆点
    ctx.fillStyle = NODE_COLOR[type] || '#9ca3af';
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(p.x, p.y, rad, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // 选中的高亮
    if (S.lastHit && S.lastHit.id === n.id) {
      ctx.strokeStyle = '#0b0b0b'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(p.x, p.y, rad + 5, 0, Math.PI * 2); ctx.stroke();
    }
    // 标签
    if (S.showLabels && !isWay) {
      ctx.font = `${n.type === 'gate' ? 11 : 12}px ${FONT}`;
      const tx0 = p.x + rad + 3, ty0 = p.y + 4;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 3;
      ctx.strokeText(n.name, tx0, ty0);
      ctx.fillStyle = '#52514e';
      ctx.fillText(n.name, tx0, ty0);
    }
  }
  ctx.restore();

  // 顶部信息条
  ctx.font = `12px ${FONT}`;
  ctx.fillStyle = 'rgba(11,11,11,0.55)';
  const info = `${AIRPORTS[S.airport].meta.name} · ${S.floor} ${AIRPORTS[S.airport].meta.floors[S.floor]} · ${graphNodes().length}节点/${graphEdges().length}边`;
  const w = ctx.measureText(info).width + 16;
  ctx.fillStyle = 'rgba(252,252,251,0.85)';
  roundRect(8, 8, w, 24, 6); ctx.fill();
  ctx.fillStyle = '#0b0b0b';
  ctx.fillText(info, 16, 25);
  // 比例尺信息（校准后）
  const ppm = S.pxPm[key()];
  if (ppm) {
    const txt = `1px ≈ ${(1 / ppm).toFixed(2)}m（已校准）`;
    ctx.fillStyle = 'rgba(252,252,251,0.85)';
    const w2 = ctx.measureText(txt).width + 16;
    roundRect(8, 38, w2, 24, 6); ctx.fill();
    ctx.fillStyle = '#52514e'; ctx.fillText(txt, 16, 55);
  }
}
function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

/* ================= 交互 ================= */
function nodeAt(cxIn, cyIn) {
  const d0 = view().s;
  let best = null, bd = 14 / Math.min(1, Math.max(0.2, Math.sqrt(d0)));
  for (const n of graphNodes()) {
    const p = graphToCanvas(n);
    const dd = Math.hypot(p.x - cxIn, p.y - cyIn);
    if (dd < bd) { bd = dd; best = n; }
  }
  return best;
}
cv.addEventListener('pointerdown', (e) => {
  cv.setPointerCapture(e.pointerId);
  const pos = { x: e.clientX - cv.getBoundingClientRect().left, y: e.clientY - cv.getBoundingClientRect().top };
  if (S.tool === 'calibrate') {
    if (!imgRef()) { toast('先加载当前层的平面图'); S.tool = 'select'; return; }
    const ip = c2i(pos.x, pos.y);
    if (!S.calib) S.calib = { pts: [] };
    S.calib.pts.push(ip);
    if (S.calib.pts.length === 2) {
      finishCalibrate();
    } else {
      toast('再点第二个点（同一段已知距离）');
    }
    return;
  }
  const n = nodeAt(pos.x, pos.y);
  if (n) {
    S.dragNode = { id: n.id, x0: pos.x, y0: pos.y, moved: false };
  } else {
    const t = S.trans[key()];
    S.dragPan = { x0: pos.x, y0: pos.y, tx0: t.tx, ty0: t.ty };
  }
});
cv.addEventListener('pointermove', (e) => {
  const rect = cv.getBoundingClientRect();
  const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  if (S.dragNode) {
    const n = AIRPORTS[S.airport].nodes.find(x => x.id === S.dragNode.id);
    if (!n) return;
    const dx = pos.x - S.dragNode.x0, dy = pos.y - S.dragNode.y0;
    if (Math.hypot(dx, dy) > 4) S.dragNode.moved = true;
    if (S.dragNode.moved) {
      const ip = c2i(pos.x, pos.y);
      const g = invT(ip.x, ip.y);
      n.x = Math.min(20000, Math.max(-20000, g.x));
      n.y = Math.min(20000, Math.max(-20000, g.y));
      setStatus(n.id, STATUS.MOVED);
    }
  } else if (S.dragPan) {
    const t = S.trans[key()];
    t.tx = S.dragPan.tx0 + (pos.x - S.dragPan.x0) / view().s;
    t.ty = S.dragPan.ty0 + (pos.y - S.dragPan.y0) / view().s;
    redraw();
  }
});
cv.addEventListener('pointerup', (e) => {
  const rect = cv.getBoundingClientRect();
  const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  if (S.dragNode) {
    const moved = S.dragNode.moved;
    const n = AIRPORTS[S.airport].nodes.find(x => x.id === S.dragNode.id);
    if (!moved && n) {
      const next = STATUS_ORDER[(STATUS_ORDER.indexOf(statusOf(n.id)) + 1) % STATUS_ORDER.length];
      setStatus(n.id, next);
    }
    S.dragNode = null;
  }
  S.dragPan = null;
  S.lastHit = null;
});
cv.addEventListener('wheel', (e) => {
  e.preventDefault();
  if (!S.graph[key()]) return;
  const rect = cv.getBoundingClientRect();
  const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  const ip = c2i(pos.x, pos.y);
  const t = S.trans[key()];
  const before = invT(ip.x, ip.y);
  t.s = Math.min(200, Math.max(0.02, t.s * (e.deltaY > 0 ? 0.92 : 1.08)));
  const want = applyT(before.x, before.y);
  t.tx += ip.x - want.x;
  t.ty += ip.y - want.y;
  redraw();
}, { passive: false });

function finishCalibrate() {
  const [a, b] = S.calib.pts;
  const meters = parseFloat(prompt('这两点的实际距离是多少米？（例如一条指廊 90）'));
  if (!isFinite(meters) || meters <= 0) { S.calib = null; toast('已取消校准'); return; }
  const px = Math.hypot(a.x - b.x, a.y - b.y);
  S.pxPm[key()] = px / meters;
  S.calib = null;
  S.tool = 'select';
  redraw();
  toast(`已校准：1 米 = ${(px / meters).toFixed(2)} 像素`);
}

/* ================= 面板 ================= */
function el(tag, cls, html) { const x = document.createElement(tag); if (cls) x.className = cls; if (html != null) x.innerHTML = html; return x; }

function updateChrome() {
  const m = AIRPORTS[S.airport];
  if (!m) return;
  document.getElementById('apName').textContent = `${m.meta.name}（${S.airport}）`;
  const tabs = document.getElementById('floorTabs');
  tabs.innerHTML = '';
  Object.keys(m.meta.floors).forEach((f, i) => {
    const b = el('button', 'chip' + (f === S.floor ? ' on' : ''), esc(f));
    b.title = m.meta.floors[f];
    b.onclick = () => selectFloor(i);
    tabs.appendChild(b);
  });
  const im = imgRef();
  document.getElementById('imgState').textContent = im ? `已加载 ${im.w}×${im.h}` : '未加载图片（可先看拓扑）';
  document.getElementById('ppmShown').textContent = S.pxPm[key()] ? (S.pxPm[key()] / 1).toFixed(2) + ' px/m' : '未校准';
}
function renderPanel() {
  const list = document.getElementById('nodeList');
  list.innerHTML = '';
  const nodes = graphNodes();
  let ok = 0, fl = 0, mv = 0;
  for (const n of nodes) {
    const st = statusOf(n.id);
    if (st === STATUS.OK) ok++; else if (st === STATUS.FLAG) fl++; else if (st === STATUS.MOVED) mv++;
  }
  document.getElementById('progText').textContent = `${ok}✓ ${mv}↦ ${fl}✗ / 共${nodes.length} 未核对${nodes.length - ok - fl - mv}`;
  for (const n of nodes) {
    const st = statusOf(n.id);
    const row = el('div', 'row');
    const name = el('span', 'nm', esc(n.name));
    name.title = n.id;
    const chip = el('span', `st st-${st}`, esc(STATUS_CN[st]));
    row.appendChild(name); row.appendChild(chip);
    const mk = (label, s, cls) => { const b = el('button', 'mini ' + cls, label); b.onclick = () => setStatus(n.id, s); return b; };
    row.appendChild(mk('✓', STATUS.OK, 'ok'));
    row.appendChild(mk('✗', STATUS.FLAG, 'flag'));
    row.appendChild(mk('清', STATUS.UNCHECKED, 'un'));
    if (st === STATUS.MOVED) {
      const c = el('span', 'xy', esc(`(${Math.round(n.x)},${Math.round(n.y)})`));
      row.appendChild(c);
    }
    list.appendChild(row);
  }
}
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2600);
}
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

/* ================= 导出 ================= */
function currentCheck() {
  const m = AIRPORTS[S.airport];
  return {
    airport: S.airport, name: m.meta.name, date: new Date().toISOString().slice(0, 10),
    floors: Object.keys(m.meta.floors).map(f => {
      const nodes = m.nodes.filter(n => n.floor === f).map(n => ({ id: n.id, name: n.name, type: n.type, status: statusOf(n.id), x: n.x, y: n.y }));
      return { floor: f, pxPerMeter: S.pxPm[`${S.airport}:${f}`] || null, nodes };
    }),
  };
}
function exportMap() {
  const m = AIRPORTS[S.airport];
  const copy = JSON.parse(JSON.stringify(m));
  const counts = {};
  Object.keys(copy.meta.floors).forEach(f => {
    counts[f] = { unchecked: 0, ok: 0, flag: 0, moved: 0 };
    copy.nodes.filter(n => n.floor === f).forEach(n => { counts[f][statusOf(n.id)]++; });
  });
  copy.meta.check = counts;
  if (Object.keys(S.pxPm).length) {
    const fppm = {};
    Object.keys(copy.meta.floors).forEach(f => { const v = S.pxPm[`${S.airport}:${f}`]; if (v) fppm[f] = v; });
    if (Object.keys(fppm).length) copy.meta.floorPxPerMeter = fppm;
  }
  download(`${S.airport}_checked.map.json`, JSON.stringify(copy, null, 2));
  toast('已导出地图 JSON（含修正坐标与核对状态）');
}
function exportReport() {
  download(`${S.airport}_check-report.json`, JSON.stringify(currentCheck(), null, 2));
  toast('已导出核对报告');
}
function download(name, text) {
  const b = new Blob([text], { type: 'application/json;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(b); a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 5000);
}
function restoreFloor() {
  const snap = S.origin[key()];
  const m = AIRPORTS[S.airport];
  if (!snap) return;
  const map = new Map(snap.map(s => [s.id, s]));
  m.nodes.forEach(n => { const o = map.get(n.id); if (o) { n.x = o.x; n.y = o.y; } });
  Object.keys(S.status).filter(k => k.startsWith(key() + ':')).forEach(k => delete S.status[k]);
  resetTransform(); renderPanel();
  toast('已还原本层节点坐标并清空标记');
}

/* ================= 事件绑定 / 启动 ================= */
function bind() {
  document.querySelectorAll('.apTab').forEach(b => b.addEventListener('click', () => { selectAirport(b.dataset.ap); }));
  document.getElementById('fileInput').addEventListener('change', (e) => {
    const f = e.target.files[0];
    if (f) { setImage(f); toast(`已载入 ${f.name}`); }
    e.target.value = '';
  });
  const drop = document.getElementById('dropZone');
  ['dragover', 'dragenter'].forEach(ev => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('click', () => document.getElementById('fileInput').click());
  drop.addEventListener('drop', (e) => { const f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) { setImage(f); toast(`已载入 ${f.name}`); } });
  document.getElementById('btnReset').addEventListener('click', resetTransform);
  document.getElementById('btnRot').addEventListener('click', () => { S.trans[key()].rot = (S.trans[key()].rot + 90) % 360; redraw(); });
  document.getElementById('btnFlipH').addEventListener('click', () => { S.trans[key()].flipH = !S.trans[key()].flipH; redraw(); });
  document.getElementById('btnFlipV').addEventListener('click', () => { S.trans[key()].flipV = !S.trans[key()].flipV; redraw(); });
  document.getElementById('btnCalib').addEventListener('click', () => { if (!imgRef()) { toast('先加载当前层平面图再校准'); return; } S.tool = S.tool === 'calibrate' ? 'select' : 'calibrate'; S.calib = null; toast(S.tool === 'calibrate' ? '校准模式：点两个已知距离的点' : '退出校准'); });
  document.getElementById('btnOkAll').addEventListener('click', () => {
    graphNodes().forEach(n => { if (statusOf(n.id) === STATUS.UNCHECKED) setStatus(n.id, STATUS.OK); });
    toast('未核对项已全部标记 ✓');
  });
  document.getElementById('btnRestore').addEventListener('click', restoreFloor);
  document.getElementById('btnExportMap').addEventListener('click', exportMap);
  document.getElementById('btnExportReport').addEventListener('click', exportReport);
  const op = document.getElementById('op');
  op.addEventListener('input', () => { S.opacity = parseFloat(op.value); document.getElementById('opVal').textContent = Math.round(S.opacity * 100) + '%'; redraw(); });
  document.getElementById('showLabels').addEventListener('change', (e) => { S.showLabels = e.target.checked; redraw(); });
  document.getElementById('showEdges').addEventListener('change', (e) => { S.showEdges = e.target.checked; redraw(); });
  window.addEventListener('resize', redraw);
  cv.addEventListener('contextmenu', (e) => e.preventDefault());
}
function boot() {
  if (!AIRPORTS || !Object.keys(AIRPORTS).length) {
    document.getElementById('body').innerHTML = '<div style="padding:40px;font-family:system-ui">数据未嵌入：请先运行 <code>python3 tools/gen_checker.py</code> 再打开本页。</div>';
    return;
  }
  bind(); sizeCanvas();
  const first = Object.keys(AIRPORTS)[0];
  selectAirport(first);
}
boot();