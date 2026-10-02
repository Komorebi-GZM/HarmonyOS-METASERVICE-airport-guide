// 共享状态机回归：与 Apple 端 AppModelTests（27 项中的 8 项）覆盖同样的行为，
// 保证三端流程一致；Web 端另有端到端冒烟走真实 DOM。

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { AIRPORT, AppModel, MemoryStore } from '../src/index.ts';

function model(store = new MemoryStore()): AppModel {
  return new AppModel(AIRPORT, store);
}

test('完整流程：首页 → 目的地 → 起点 → 路线 → 指引 → 完成 → 重开', () => {
  const store = new MemoryStore();
  const m = model(store);
  assert.equal(m.state.view, 'home');

  m.startTargetFlow('gate');
  assert.equal(m.state.view, 'target');
  m.chooseTarget('xha_p4_gA101');
  assert.equal(m.state.view, 'start');
  assert.equal(m.state.planner.draftEnd, 'xha_p4_gA101');

  m.chooseStart('xha_p4_doorW');
  assert.equal(m.state.view, 'route');
  assert.equal(m.state.planner.stage, 'preview');
  const view = m.routeView;
  assert.equal(view.status, 'ready');
  assert.ok(view.route.nodeIds.includes(AIRPORT.securityId), '陆→空应经过中央安检');
  assert.equal(m.state.recent[0], 'xha_p4_gA101');
  assert.equal(store.recent[0], 'xha_p4_gA101', '确认路线时应落盘最近地点');

  m.setPreference(1);
  assert.equal(m.state.planner.preference, 1);
  assert.equal(m.state.planner.stage, 'preview');

  m.beginGuidance();
  assert.equal(m.state.planner.stage, 'guiding');
  assert.equal(m.currentStep?.kind, 'walk');

  let steps = 0;
  while (m.state.planner.stage === 'guiding' && steps < 20) {
    m.advance();
    steps += 1;
  }
  assert.equal(m.state.planner.stage, 'completed');
  assert.equal(steps, view.steps.length);

  m.restart();
  assert.equal(m.state.view, 'home');
  assert.equal(m.state.planner.stage, 'editing');
  assert.equal(m.state.planner.startId, '');
});

test('步骤前后跳转与当前楼层跟随', () => {
  const m = model();
  m.chooseDestinationFromHome('xha_b2_platA');
  m.chooseStart('xha_p4_doorW');
  m.beginGuidance();
  const total = m.routeView.steps.length;
  assert.ok(total > 2);

  const visited = new Set<string>();
  for (let i = 0; i < total; i++) {
    visited.add(m.activeFloor);
    m.advance();
  }
  assert.ok(visited.has('4F'), `应经过 4F：${[...visited]}`);
  assert.ok(visited.has('B2'), `应到达 B2：${[...visited]}`);

  // 走完会进入 completed，且 jumpToStep 只在指引态生效 —— 先用「上一步」回到指引态
  assert.equal(m.state.planner.stage, 'completed');
  m.previous();
  assert.equal(m.state.planner.stage, 'guiding');

  m.jumpToStep(0);
  assert.equal(m.state.planner.stepIndex, 0);
  assert.equal(m.state.planner.stage, 'guiding');
  m.previous();
  assert.equal(m.state.planner.stepIndex, 0, '上一步不应越界');
  m.jumpToStep(total - 1);
  assert.equal(m.state.planner.stepIndex, total - 1);
});

test('语言切换会落盘并在重建后恢复', () => {
  const store = new MemoryStore();
  const m = model(store);
  assert.equal(m.en, false);
  m.toggleLanguage();
  assert.equal(m.en, true);
  assert.equal(store.lang, 'en');
  assert.equal(model(store).en, true, '重建后应恢复语言');
});

test('最近列表：上限 6、去重、加载时剔除失效地点', () => {
  const store = new MemoryStore('zh', ['xha_p4_gA101', '不存在的地点']);
  const m = model(store);
  assert.deepEqual(m.state.recent, ['xha_p4_gA101']);

  for (const id of ['xha_p4_gB201', 'xha_p4_gC308', 'xha_b2_platB', 'xha_p1_taxi', 'xha_b1_gtc', 'xha_p2_bagA', 'xha_p4_doorN']) {
    m.chooseDestinationFromHome(id);
    m.chooseStart('xha_p4_doorW');
  }
  assert.ok(m.state.recent.length <= 6);
  assert.equal(new Set(m.state.recent).size, m.state.recent.length);
});

test('修改出发位置进入出发位置页，且不改动目的地与最近列表', () => {
  const m = model();
  m.chooseDestinationFromHome('xha_p4_gA101');
  m.chooseStart('xha_p4_doorW');
  const destination = m.state.planner.endId;
  const recentBefore = m.state.recent.slice();

  m.editStart();
  assert.equal(m.state.view, 'start');
  assert.equal(m.state.planner.editing, 'start');
  m.chooseStart('xha_p4_doorE');
  assert.equal(m.state.view, 'route');
  assert.equal(m.state.planner.startId, 'xha_p4_doorE');
  assert.equal(m.state.planner.endId, destination, '修改起点不应改动目的地');
  assert.deepEqual(m.state.recent, recentBefore, '修改起点不应写最近列表');

  m.editDestination();
  assert.equal(m.state.view, 'target');
  m.chooseTarget('xha_p4_gC308');
  assert.equal(m.state.view, 'route');
  assert.equal(m.state.planner.endId, 'xha_p4_gC308');

  m.swap();
  assert.equal(m.state.planner.startId, 'xha_p4_gC308');
  assert.equal(m.state.planner.endId, 'xha_p4_doorE');
  assert.equal(m.state.planner.stage, 'preview');
});

test('编辑态返回：放弃草稿并回路线页', () => {
  const m = model();
  m.chooseDestinationFromHome('xha_p4_gA101');
  m.chooseStart('xha_p4_doorW');
  m.editStart();
  m.state.planner.draftStart = 'xha_p4_doorN';   // 模拟"在出发位置页选了另一个地点"（草稿态）
  m.backFromStart();
  assert.equal(m.state.view, 'route');
  assert.equal(m.state.planner.editing, 'new');
  assert.equal(m.state.planner.startId, 'xha_p4_doorW', '放弃草稿应保留原起点');

  m.editDestination();
  m.backFromTarget();
  assert.equal(m.state.view, 'route');
  assert.equal(m.state.planner.endId, 'xha_p4_gA101');
});

test('地铁流程与楼层地图流程', () => {
  const m = model();
  m.startMetroFlow();
  assert.equal(m.state.view, 'metro');
  m.chooseMetroDirection('xha_b2_platA');
  assert.equal(m.state.view, 'start');
  assert.equal(m.state.planner.draftEnd, 'xha_b2_platA');
  m.chooseStart('xha_p4_doorW');
  assert.equal(m.state.view, 'route');

  m.openBrowse();
  assert.equal(m.state.view, 'browse');
  m.setBrowseFloor('B2');
  assert.equal(m.state.browseFloor, 'B2');
  m.selectNode('xha_b2_platA');
  assert.equal(m.state.selectedId, 'xha_b2_platA');
  m.setStartFromMap('xha_b2_platA');
  assert.ok(m.state.toast.length > 0, '应提示已选择出发位置');
  m.setBrowseFloor('B1');
  assert.equal(m.state.selectedId, '', '切层应清空选中');

  m.routeToFromMap('xha_p4_gA101');
  assert.equal(m.state.view, 'route');
  assert.equal(m.state.planner.endId, 'xha_p4_gA101');

  m.openBrowseForDestination();
  assert.equal(m.state.pick, 'end');
  m.backFromBrowse();
  assert.equal(m.state.view, 'target');
  m.openBrowse();
  m.backFromBrowse();
  assert.equal(m.state.view, 'home');
});

test('异常状态：missing / same / invalid', () => {
  const m = model();
  assert.equal(m.routeView.status, 'missing');
  m.chooseDestinationFromHome('xha_p4_gA101');
  m.chooseStart('xha_p4_gA101');
  assert.equal(m.routeView.status, 'same');

  const broken = model();
  broken.state.planner.startId = 'xha_p4_doorW';
  broken.state.planner.endId = '不存在';
  assert.equal(broken.routeView.status, 'invalid');
  assert.deepEqual(broken.routeNodeIds, []);
  assert.equal(broken.currentRouteIndex, -1);
});
