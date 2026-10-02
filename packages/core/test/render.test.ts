// 渲染器回归：图层顺序、用色、标签阈值、命中半径、适配范围。
// 这是三端（Web / 小程序 / Swift）共同的渲染契约；Swift 端另有逐命令比对（tools/gen_render_fixture.mjs）。

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  AIRPORT, CANVAS, renderFloor, hitTest, fitFloorViewport, fitRouteViewport,
  nodeRadius, shouldLabel, labelWidth, planRoute, PREF_SHORTEST,
  type DrawCommand,
} from '../src/index.ts';
import type { MapNode } from '../src/types.ts';

const SIZE = { width: 380, height: 320 };

function render(overrides: Partial<Parameters<typeof renderFloor>[1]> = {}): DrawCommand[] {
  const floor = overrides.floor ?? '4F';
  const viewport = overrides.viewport ?? fitFloorViewport(AIRPORT, floor, SIZE.width, SIZE.height);
  return renderFloor(AIRPORT, {
    floor,
    viewport,
    width: SIZE.width,
    height: SIZE.height,
    ...overrides,
  });
}

function kinds(commands: DrawCommand[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const c of commands) { out[c.kind] = (out[c.kind] ?? 0) + 1; }
  return out;
}

test('渲染命令：首条底色 + 次条楼层底板，尺寸等于画布', () => {
  const commands = render();
  assert.equal(commands[0].kind, 'fillRect');
  assert.deepEqual(commands[0], {
    kind: 'fillRect', x: 0, y: 0, width: SIZE.width, height: SIZE.height,
    color: AIRPORT.tokens.MAP.surface,
  });
  assert.equal(commands[1].kind, 'fillRect');
  // 底板用色由该层陆/空节点占比决定（4F 空侧节点占多数，因此是 airWash）
  const nodes = AIRPORT.floorNodes('4F');
  const land = nodes.filter((n) => n.side === 'land').length;
  const expectedWash = land * 2 >= nodes.length ? AIRPORT.tokens.MAP.landWash : AIRPORT.tokens.MAP.airWash;
  if (commands[1].kind === 'fillRect') {
    assert.equal(commands[1].color, expectedWash, `4F 陆侧 ${land}/${nodes.length}`);
    assert.ok(commands[1].width > 0 && commands[1].height > 0);
  }
});

test('渲染命令：走廊是深浅两条描边，顺序为外深内浅', () => {
  const strokes = render().filter((c) => c.kind === 'polyline');
  assert.equal(strokes.length, 2);
  assert.equal(strokes[0].kind === 'polyline' && strokes[0].color, CANVAS.corridorCasing);
  assert.equal(strokes[1].kind === 'polyline' && strokes[1].color, CANVAS.corridorFill);
  if (strokes[0].kind === 'polyline' && strokes[1].kind === 'polyline') {
    assert.ok(strokes[0].width >= strokes[1].width, '外描边应更宽');
    assert.equal(strokes[0].points.length, strokes[1].points.length);
  }
});

test('渲染命令：每个节点一个圆，走廊节点不描边', () => {
  const commands = render();
  const circles = commands.filter((c) => c.kind === 'circle');
  assert.equal(circles.length, AIRPORT.floorNodes('4F').length);
  for (const node of AIRPORT.floorNodes('4F')) {
    const match = circles.find((c) => c.kind === 'circle' && Math.abs(c.radius - Math.max(2, nodeRadius(node) * Math.min(Math.max(fitFloorViewport(AIRPORT, '4F', SIZE.width, SIZE.height).zoom, 0.8), 2))) < 1e-9);
    assert.ok(match, `${node.id} 缺少对应圆形`);
  }
  const corridor = AIRPORT.floorNodes('4F').find((n) => n.type === 'corridor') as MapNode;
  const vp = fitFloorViewport(AIRPORT, '4F', SIZE.width, SIZE.height);
  const corridorCircle = circles.find((c) => c.kind === 'circle'
    && Math.abs(c.x - vp.scrX(corridor.x)) < 1e-9
    && Math.abs(c.y - vp.scrY(corridor.y)) < 1e-9);
  assert.ok(corridorCircle, '未找到走廊节点的圆');
  assert.equal(corridorCircle.kind === 'circle' && corridorCircle.stroke, null, '走廊节点不应描白边');
});

test('渲染命令：没有路线时不画路径层', () => {
  const polylines = render().filter((c) => c.kind === 'polyline');
  const routeColors = polylines.filter((c) => c.kind === 'polyline' && (c.color === CANVAS.routeDone || c.color === CANVAS.routeLive));
  assert.equal(routeColors.length, 0);
});

test('渲染命令：有路线时同时出现全程色与当前段色', () => {
  const route = planRoute(AIRPORT, 'xha_p4_doorW', 'xha_p4_gA101', PREF_SHORTEST);
  const commands = render({
    routeNodeIds: route.nodeIds,
    currentRouteIndex: route.nodeIds.length - 1,
    startId: 'xha_p4_doorW',
    endId: 'xha_p4_gA101',
  });
  const polylines = commands.filter((c) => c.kind === 'polyline');
  assert.ok(polylines.some((c) => c.kind === 'polyline' && c.color === CANVAS.routeDone));
  assert.ok(polylines.some((c) => c.kind === 'polyline' && c.color === CANVAS.routeLive));
});

test('渲染命令：起终点标记只画在各自所属楼层', () => {
  const onFour = render({ startId: 'xha_p4_doorW', endId: 'xha_p4_gA101' });
  const markers = onFour.filter((c) => c.kind === 'circle' && c.radius === 11);
  assert.equal(markers.length, 2);
  assert.deepEqual(markers.map((c) => c.kind === 'circle' && c.fill).sort(), [CANVAS.markerEnd, CANVAS.routeLive].sort());

  const stray = render({ startId: 'xha_b2_platA' });
  assert.equal(stray.filter((c) => c.kind === 'circle' && c.radius === 11).length, 0, 'B2 的起点不应画在 4F');

  const b2 = render({ floor: 'B2', startId: 'xha_b2_platA' });
  assert.equal(b2.filter((c) => c.kind === 'circle' && c.radius === 11).length, 1);
});

test('渲染命令：楼层水印贴右对齐，文本为楼层号', () => {
  const commands = render({ floor: 'B1' });
  const last = commands[commands.length - 1];
  assert.equal(last.kind, 'text');
  if (last.kind === 'text') {
    assert.equal(last.string, 'B1');
    assert.equal(last.align, 'right');
    assert.equal(last.x, SIZE.width - 12);
    assert.equal(last.color, AIRPORT.tokens.MAP.ink2);
  }
});

test('标签阈值：走廊永不显示；关键类型在中等缩放下显示', () => {
  const gate = AIRPORT.node('xha_p4_gA101') as MapNode;
  const corridor = AIRPORT.nodes.find((n) => n.type === 'corridor') as MapNode;
  const toilet = AIRPORT.nodes.find((n) => n.type === 'toilet') as MapNode;
  assert.equal(shouldLabel(corridor, 3), false);
  assert.equal(shouldLabel(gate, 0.4), false);
  assert.equal(shouldLabel(gate, 0.5), true);
  assert.equal(shouldLabel(toilet, 0.5), false);
  assert.equal(shouldLabel(toilet, 0.85), true);
});

test('标签：放大后出现底片与文本，且文本来自双语表', () => {
  const vp = fitFloorViewport(AIRPORT, '4F', SIZE.width, SIZE.height);
  const zoomed = new (Object.getPrototypeOf(vp).constructor as new () => typeof vp)();
  zoomed.fitInsets(AIRPORT.floorBBox('4F'), SIZE.width, SIZE.height, 0, 0, 0, 0);
  zoomed.pinch(SIZE.width / 2, SIZE.height / 2, 3);

  const zh = renderFloor(AIRPORT, { floor: '4F', viewport: zoomed, width: SIZE.width, height: SIZE.height, en: false });
  const en = renderFloor(AIRPORT, { floor: '4F', viewport: zoomed, width: SIZE.width, height: SIZE.height, en: true });
  const zhTexts = zh.filter((c) => c.kind === 'text').map((c) => c.kind === 'text' && c.string);
  const enTexts = en.filter((c) => c.kind === 'text').map((c) => c.kind === 'text' && c.string);
  assert.ok(zhTexts.includes('登机口A101'), `中文标签缺失：${zhTexts.slice(0, 5).join(',')}`);
  assert.ok(enTexts.includes('Gate A101'), `英文标签缺失：${enTexts.slice(0, 5).join(',')}`);
  assert.ok(zh.filter((c) => c.kind === 'labelPlate').length > 10, '放大后应有大量标签底片');
});

test('标签底片宽度：与文本长度、字号线性相关', () => {
  const sample = '登机口A101';
  assert.equal(labelWidth(sample, 11), sample.length * 11 * 0.62 + 4);
  assert.ok(labelWidth('Gate A101', 11) > labelWidth('A101', 11));
});

test('命中测试：最近优先、越界不命中、半径可调', () => {
  const vp = fitFloorViewport(AIRPORT, '4F', SIZE.width, SIZE.height);
  const gate = AIRPORT.node('xha_p4_gA101') as MapNode;
  const x = vp.scrX(gate.x);
  const y = vp.scrY(gate.y);
  assert.equal(hitTest(AIRPORT, '4F', vp, x, y)?.id, gate.id);
  assert.equal(hitTest(AIRPORT, '4F', vp, x + 10, y, 2), undefined, '小半径下 10px 外应不命中');
  assert.ok(hitTest(AIRPORT, '4F', vp, x + 10, y, CANVAS.hitRadius) !== undefined, '默认半径下应命中');

  let empty: { x: number; y: number } | undefined;
  for (let cx = 10; cx < SIZE.width - 10 && empty === undefined; cx += 10) {
    for (let cy = 10; cy < SIZE.height - 10; cy += 10) {
      if (hitTest(AIRPORT, '4F', vp, cx, cy) === undefined) { empty = { x: cx, y: cy }; break; }
    }
  }
  assert.ok(empty !== undefined, '画布上应存在远离所有节点的空白点');
});

test('适配：整层与整条路线都落在预留区域内', () => {
  for (const floor of AIRPORT.floorOrder) {
    const vp = fitFloorViewport(AIRPORT, floor, 360, 320);
    for (const node of AIRPORT.floorNodes(floor)) {
      assert.ok(vp.scrX(node.x) >= 24 - 1e-6 && vp.scrX(node.x) <= 360 - 72 + 1e-6, `${node.id} x 越界`);
      assert.ok(vp.scrY(node.y) >= 48 - 1e-6 && vp.scrY(node.y) <= 320 - 78 + 1e-6, `${node.id} y 越界`);
    }
  }

  const route = planRoute(AIRPORT, 'xha_p1_taxi', 'xha_p4_gA101', PREF_SHORTEST);
  const vp = fitRouteViewport(AIRPORT, route.nodeIds, 360, 320);
  for (const id of route.nodeIds) {
    const node = AIRPORT.node(id) as MapNode;
    assert.ok(vp.scrX(node.x) >= 32 - 1e-6 && vp.scrX(node.x) <= 360 - 72 + 1e-6, `${id} x 越界`);
    assert.ok(vp.scrY(node.y) >= 48 - 1e-6 && vp.scrY(node.y) <= 320 - 90 + 1e-6, `${id} y 越界`);
  }
});

test('命令流可序列化（跨语言基准与小程序传输都依赖这一点）', () => {
  const route = planRoute(AIRPORT, 'xha_b2_platA', 'xha_p4_airMall', PREF_SHORTEST);
  const commands = render({
    floor: 'B2', routeNodeIds: route.nodeIds, currentRouteIndex: 1,
    startId: 'xha_b2_platA', endId: 'xha_p4_airMall',
  });
  const round = JSON.parse(JSON.stringify(commands)) as DrawCommand[];
  assert.deepEqual(round, commands);
  for (const command of commands) {
    assert.equal(typeof command.kind, 'string');
    assert.ok(!Object.values(command).some((v) => typeof v === 'number' && !Number.isFinite(v)), '不应出现 Infinity/NaN');
  }
  assert.deepEqual(kinds(commands), kinds(round));
});
