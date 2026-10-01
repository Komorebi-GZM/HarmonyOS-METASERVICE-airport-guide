import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const root = path.resolve(import.meta.dirname, '..');
const etsRoot = path.join(root, 'harmony_app/entry/src/main/ets');
const tsFile = 'C:/Program Files/Huawei/DevEco Studio/sdk/default/openharmony/ets/build-tools/ets-loader/node_modules/typescript/lib/typescript.js';
const ts = await import(pathToFileURL(tsFile));
const modules = new Map();
function loadEts(file) {
  const full = path.resolve(file);
  if (modules.has(full)) return modules.get(full).exports;
  const mod = { exports: {} };
  modules.set(full, mod);
  const source = fs.readFileSync(full, 'utf8');
  const js = ts.default.transpileModule(source, { compilerOptions: { module: ts.default.ModuleKind.CommonJS, target: ts.default.ScriptTarget.ES2020 } }).outputText;
  const localRequire = (id) => {
    if (!id.startsWith('.')) throw new Error(`Unsupported external import ${id} from ${full}`);
    let candidate = path.resolve(path.dirname(full), id);
    if (!path.extname(candidate)) candidate += '.ets';
    return loadEts(candidate);
  };
  vm.runInThisContext(`(function(require,module,exports){${js}\n})`, { filename: full })(localRequire, mod, mod.exports);
  return mod.exports;
}
function check(name, fn) { fn(); passed++; }
let passed = 0;
const map = loadEts(path.join(etsRoot, 'model/AirportMap.ets'));
const planner = loadEts(path.join(etsRoot, 'core/PlannerState.ets'));
const places = loadEts(path.join(etsRoot, 'core/Places.ets'));
const pathfinder = loadEts(path.join(etsRoot, 'core/Pathfinder.ets'));
const routeSteps = loadEts(path.join(etsRoot, 'core/RouteSteps.ets'));
const { Viewport } = loadEts(path.join(etsRoot, 'core/Viewport.ets'));

check('PlannerState transitions and immutability', () => {
  const original = new planner.PlannerState(); original.startId = 'xha_p4_doorW'; original.endId = 'xha_p4_gA101'; original.stage = 'guiding'; original.stepIndex = 2;
  const fresh = planner.newJourney(original, 'xha_p4_gB201', 'gate');
  assert.equal(fresh.startId, ''); assert.equal(fresh.endId, ''); assert.equal(fresh.draftStart, ''); assert.equal(fresh.draftEnd, 'xha_p4_gB201'); assert.equal(fresh.stepIndex, 0); assert.equal(fresh.stage, 'editing'); assert.equal(original.startId, 'xha_p4_doorW'); assert.equal(original.stepIndex, 2);
  const editing = planner.beginEdit(original, 'start'); const draft = planner.choosePlace(editing, 'xha_p4_doorN', true); const canceled = planner.cancelEdit(draft);
  assert.equal(canceled.startId, original.startId); assert.equal(canceled.endId, original.endId); assert.equal(canceled.stage, 'guiding'); assert.equal(canceled.stepIndex, 2);
  let s = planner.copyPlanner(draft); s.stage = 'guiding'; s.stepIndex = 2;
  s = planner.commitJourney(s); assert.equal(s.startId, 'xha_p4_doorN'); assert.equal(s.endId, original.endId); assert.equal(s.stage, 'preview'); assert.equal(s.stepIndex, 0);
  s = planner.startGuidance(s); s.stepIndex = 2; s = planner.changePreference(s, 1); assert.equal(s.preference, 1); assert.equal(s.stage, 'preview'); assert.equal(s.stepIndex, 0);
  s = planner.startGuidance(s); s.stepIndex = 2; s = planner.swapJourney(s); assert.equal(s.startId, 'xha_p4_gA101'); assert.equal(s.endId, 'xha_p4_doorN'); assert.equal(s.stage, 'preview'); assert.equal(s.stepIndex, 0);
  s = planner.startGuidance(s); s = planner.advanceGuidance(s, 3); assert.equal(s.stepIndex, 1); s = planner.advanceGuidance(s, 3); assert.equal(s.stepIndex, 2); s = planner.advanceGuidance(s, 3); assert.equal(s.stage, 'completed'); assert.equal(s.stepIndex, 2);
  s = planner.previousStep(s); assert.equal(s.stage, 'guiding'); assert.equal(s.stepIndex, 1);
});

check('Places search and recent list', () => {
  const gate = map.XHA_NODES.find(n => n.type === 'gate'); assert.ok(gate);
  assert.ok(places.searchPlaces(gate.name).some(n => n.id === gate.id));
  const en = map.NODE_EN.get(gate.id); if (en) assert.ok(places.searchPlaces(en.toUpperCase()).some(n => n.id === gate.id));
  const code = places.gateCode(gate); const hits = places.searchPlaces(` ${code.toUpperCase()} `);
  assert.equal(hits[0].id, gate.id);
  const recent = places.recentPlaces(['bad', gate.id, ...map.XHA_NODES.slice(0, 10).map(n => n.id)], gate.id);
  assert.equal(recent.length, 6); assert.equal(recent[0], gate.id); assert.equal(new Set(recent).size, recent.length);
});

check('500 deterministic route pairs across four preferences', () => {
  let seed = 0x51a7e; const rand = (n) => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed % n; };
  const nodes = map.XHA_NODES;
  for (let i = 0; i < 500; i++) {
    let a = nodes[rand(nodes.length)], b = nodes[rand(nodes.length)]; if (a.id === b.id) b = nodes[(nodes.indexOf(b) + 1) % nodes.length];
    for (let pref = 0; pref < 4; pref++) {
      const route = pathfinder.planRoute(a.id, b.id, pref);
      assert.ok(route.nodeIds.length > 0, `${a.id} -> ${b.id}, pref ${pref} unreachable`);
      assert.equal(route.nodeIds[0], a.id); assert.equal(route.nodeIds.at(-1), b.id);
      for (let j = 1; j < route.nodeIds.length; j++) assert.ok(map.XHA_EDGES.some(e => (e.from === route.nodeIds[j - 1] && e.to === route.nodeIds[j]) || (e.to === route.nodeIds[j - 1] && e.from === route.nodeIds[j])), 'non-contiguous path');
      const crossSide = a.side !== b.side && a.id !== map.SECURITY_ID && b.id !== map.SECURITY_ID;
      assert.equal(route.viaSecurity, crossSide); if (crossSide) assert.ok(route.nodeIds.includes(map.SECURITY_ID), 'cross-side route skipped security');
      verifyRouteSteps(a.id, b.id, pref, route);
    }
  }
});

function edgeBetween(a, b, type = undefined) {
  return map.XHA_EDGES.find(e => ((e.from === a && e.to === b) || (e.to === a && e.from === b)) && (type === undefined || e.type === type));
}
function verifyRouteSteps(startId, endId, pref, expectedRoute = pathfinder.planRoute(startId, endId, pref)) {
  const view = routeSteps.buildRouteView(startId, endId, pref);
  assert.equal(view.status, 'ready', `${startId} -> ${endId}, pref ${pref}: status`);
  assert.deepEqual(view.route.nodeIds, expectedRoute.nodeIds);
  const expected = []; let expectedWalking = 0;
  for (let li = 0; li < view.route.legs.length; li++) {
    const leg = view.route.legs[li]; let from = leg.nodeIds[0], meters = 0;
    for (let i = 1; i < leg.nodeIds.length; i++) {
      const prev = leg.nodeIds[i - 1], next = leg.nodeIds[i], edge = edgeBetween(prev, next, 'walk');
      assert.ok(edge, `missing walk edge ${prev} -> ${next}`);
      meters += edge.weight;
      if (next === map.SECURITY_ID || i === leg.nodeIds.length - 1) {
        expected.push({ kind: 'walk', fromId: from, toId: next, floor: leg.floor, toFloor: leg.floor, legIndex: li, meters, facility: '' });
        expectedWalking += meters; from = next; meters = 0;
        if (next === map.SECURITY_ID && next !== endId) expected.push({ kind: 'security', fromId: next, toId: next, floor: leg.floor, toFloor: leg.floor, legIndex: li, meters: 0, facility: 'security' });
      }
    }
    if (li < view.route.transitions.length) {
      const tr = view.route.transitions[li], fromAt = view.route.nodeIds.indexOf(tr.fromId), toAt = view.route.nodeIds.indexOf(tr.toId);
      assert.ok(fromAt >= 0 && toAt > fromAt, `transition path missing: ${tr.fromId} -> ${tr.toId}`);
      let transferMeters = 0, firstType = '';
      for (let i = fromAt + 1; i <= toAt; i++) {
        const edge = edgeBetween(view.route.nodeIds[i - 1], view.route.nodeIds[i]);
        assert.ok(edge && edge.type !== 'walk', `transition contains a walk edge: ${view.route.nodeIds[i - 1]} -> ${view.route.nodeIds[i]}`);
        if (firstType === '') firstType = edge.type;
        transferMeters += edge.weight;
      }
      assert.equal(tr.viaType, firstType); assert.equal(tr.meters, transferMeters);
      expected.push({ kind: 'transfer', fromId: tr.fromId, toId: tr.toId, floor: tr.fromFloor, toFloor: tr.toFloor, legIndex: li, meters: 0, facility: tr.viaType });
    }
    assert.equal(leg.floor, places.place(leg.nodeIds[0]).floor);
    for (const id of leg.nodeIds) assert.equal(places.place(id).floor, leg.floor, `${id}: wrong route leg floor`);
  }
  const end = places.place(endId);
  expected.push({ kind: 'destination', fromId: endId, toId: endId, floor: end.floor, toFloor: end.floor, legIndex: view.route.legs.length - 1, meters: 0, facility: '' });
  assert.deepEqual(view.steps, expected, `${startId} -> ${endId}, pref ${pref}: ordered steps`);
  assert.equal(view.walkingMeters, expectedWalking, `${startId} -> ${endId}, pref ${pref}: walking total`);
  assert.equal(view.steps.filter(s => s.kind === 'walk').reduce((sum, s) => sum + s.meters, 0), expectedWalking);
  return view.route;
}

check('RouteSteps cross-side round trips and friendly states', () => {
  const from = 'xha_p4_doorW', to = 'xha_p4_gA101'; const floors = [];
  for (let pref = 0; pref < 4; pref++) {
    const out = verifyRouteSteps(from, to, pref), back = verifyRouteSteps(to, from, pref);
    assert.equal(out.viaSecurity, true); assert.equal(back.viaSecurity, true);
    for (const id of [...out.nodeIds, ...back.nodeIds]) floors.push(places.place(id).floor);
    const legs = [...out.legs, ...back.legs];
    assert.ok(legs.some((l, i) => legs.slice(0, i).some(prev => prev.floor === l.floor)), 'round trip should revisit a floor across legs');
  }
  assert.ok(new Set(floors).size < floors.length, 'round-trip nodes should revisit floors');
  assert.equal(routeSteps.buildRouteView('', 'xha_p4_gA101', 0).status, 'missing');
  assert.equal(routeSteps.buildRouteView('invalid', 'xha_p4_gA101', 0).status, 'invalid');
  assert.equal(routeSteps.buildRouteView('xha_p4_gA101', 'xha_p4_gA101', 0).status, 'same');
});

check('Viewport fit, pan clamp and focal zoom', () => {
  const v = new Viewport(); v.fit([10, 20, 210, 120], 400, 300, 20);
  assert.ok(v.zoom > 0); assert.ok(Math.abs(v.scrX(110) - 200) < 1); assert.ok(Math.abs(v.scrY(70) - 150) < 1);
  v.pan(10000, -10000); assert.ok(v.tx <= 400 - 56 - 10 * v.zoom + 1e-6); assert.ok(v.ty >= 56 - 120 * v.zoom - 1e-6);
  v.fit([0, 0, 200, 100], 500, 300, 10); const cx = 250, cy = 150; const wx = (cx - v.tx) / v.zoom, wy = (cy - v.ty) / v.zoom;
  v.pinch(cx, cy, 1.4); assert.ok(Math.abs(v.scrX(wx) - cx) < 1); assert.ok(Math.abs(v.scrY(wy) - cy) < 1);
  v.pinch(cx, cy, 100); assert.ok(v.zoom <= 5); v.pinch(cx, cy, 0.00001); assert.ok(v.zoom >= v.minZoom);
  const route = pathfinder.planRoute('xha_p4_doorW', 'xha_b2_platB', 0);
  assert.ok(route.legs.length >= 2, 'inset viewport case must cross floors');
  for (const leg of route.legs) {
    const coords = leg.nodeIds.map(id => places.place(id));
    const box = [Math.min(...coords.map(n => n.x)), Math.min(...coords.map(n => n.y)),
      Math.max(...coords.map(n => n.x)), Math.max(...coords.map(n => n.y))];
    if (box[2] - box[0] < 160) { box[0] -= 80; box[2] += 80; }
    if (box[3] - box[1] < 160) { box[1] -= 80; box[3] += 80; }
    const routeVp = new Viewport(); routeVp.fitInsets(box, 359, 320, 32, 48, 72, 90);
    for (const n of coords) {
      const x = routeVp.scrX(n.x), y = routeVp.scrY(n.y);
      assert.ok(x >= 32 - 1e-6 && x <= 359 - 72 + 1e-6, `${n.id} route x outside reserved viewport: ${x}`);
      assert.ok(y >= 48 - 1e-6 && y <= 320 - 90 + 1e-6, `${n.id} route y outside reserved viewport: ${y}`);
    }
  }
  const fullVp = new Viewport(); fullVp.fitInsets([130, 60, 950, 820], 359, 320, 24, 48, 72, 78);
  for (const [x, y] of [[130, 60], [950, 820]]) {
    assert.ok(fullVp.scrX(x) >= 24 - 1e-6 && fullVp.scrX(x) <= 359 - 72 + 1e-6);
    assert.ok(fullVp.scrY(y) >= 48 - 1e-6 && fullVp.scrY(y) <= 320 - 78 + 1e-6);
  }
});

check('Loc key symmetry and page literal coverage', () => {
  const loc = loadEts(path.join(etsRoot, 'model/Loc.ets')).Loc;
  const pages = ['pages', 'ui'].flatMap(dir => fs.readdirSync(path.join(etsRoot, dir), { withFileTypes: true }).filter(e => e.isFile() && e.name.endsWith('.ets')).map(e => path.join(etsRoot, dir, e.name)));
  const keys = new Set();
  for (const file of pages) {
    const source = fs.readFileSync(file, 'utf8'); let at = 0;
    while ((at = source.indexOf('Loc.t(', at)) >= 0) {
      let i = at + 6, depth = 1, quote = '';
      for (; i < source.length && depth > 0; i++) {
        const c = source[i];
        if (quote) { if (c === quote && source[i - 1] !== '\\') quote = ''; continue; }
        if (c === "'" || c === '"' || c === '`') { quote = c; continue; }
        if (c === '(') depth++; else if (c === ')') depth--;
        else if (c === ',' && depth === 1) break;
      }
      const arg = source.slice(at + 6, i);
      for (const m of arg.matchAll(/'([a-z][a-z0-9_]*)'/g)) keys.add(m[1]);
      at = i + 1;
    }
  }
  for (const k of ['route_complete','route_guiding','route_preview','pref_shortest','pref_elevator','pref_escalator','pref_avoid_stair','fit_route','full_floor','start_marker','end_marker']) keys.add(k);
  for (const k of ['start','transfer','destination','completed','guiding','new']) keys.delete(k);
  const missing = [...keys].filter(k => loc.t(k, false) === k || loc.t(k, true) === k);
  assert.deepEqual(missing, []);
  const known = ['brand','home_title','missing','invalid','same','unreachable','security'];
  for (const k of known) assert.notEqual(loc.t(k, false), k);
});

console.log(`PASS ${passed}/6 suites; route cases 2,000; nodes ${map.XHA_NODES.length}; edges ${map.XHA_EDGES.length}`);
