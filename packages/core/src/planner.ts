// 行程状态：ArkTS 端用"每次更新都替换整个对象"来让 @Provide/@Consume 观察到变化。
// 共享核心保留同样的语义（纯函数、返回新对象、revision 递增），
// 这样 Web / 小程序 / Swift 的 UI 层都可以用同一套状态机，只是观察机制不同。
//
// 真源：harmony_app/entry/src/main/ets/core/PlannerState.ets

import type { EditField, MapMode, PlannerState, RouteStage } from './types.ts';

export function newPlanner(): PlannerState {
  return {
    startId: '',
    endId: '',
    draftStart: '',
    draftEnd: '',
    preference: 0,
    stage: 'editing',
    stepIndex: 0,
    category: 'all',
    query: '',
    browseFloor: '4F',
    mapMode: 'browse',
    editing: 'new',
    revision: 0,
  };
}

export function copyPlanner(s: PlannerState): PlannerState {
  return {
    startId: s.startId,
    endId: s.endId,
    draftStart: s.draftStart,
    draftEnd: s.draftEnd,
    preference: s.preference,
    stage: s.stage,
    stepIndex: s.stepIndex,
    category: s.category,
    query: s.query,
    browseFloor: s.browseFloor,
    mapMode: s.mapMode,
    editing: s.editing,
    revision: s.revision + 1,
  };
}

export function newJourney(s: PlannerState, endId: string = '', category: string = 'all'): PlannerState {
  const n = newPlanner();
  n.draftEnd = endId;
  n.category = category;
  n.revision = s.revision + 1;
  return n;
}

export function beginEdit(s: PlannerState, field: EditField): PlannerState {
  const n = copyPlanner(s);
  n.draftStart = s.startId;
  n.draftEnd = s.endId;
  n.editing = field;
  n.category = 'all';
  n.query = '';
  return n;
}

export function choosePlace(s: PlannerState, id: string, start: boolean): PlannerState {
  const n = copyPlanner(s);
  if (start) { n.draftStart = id; } else { n.draftEnd = id; }
  return n;
}

export function commitJourney(s: PlannerState): PlannerState {
  const n = copyPlanner(s);
  n.startId = s.draftStart;
  n.endId = s.draftEnd;
  n.stage = 'preview';
  n.stepIndex = 0;
  n.editing = 'new';
  return n;
}

export function cancelEdit(s: PlannerState): PlannerState {
  const n = copyPlanner(s);
  n.draftStart = s.startId;
  n.draftEnd = s.endId;
  n.editing = 'new';
  return n;
}

export function changePreference(s: PlannerState, value: number): PlannerState {
  const n = copyPlanner(s);
  n.preference = value;
  n.stage = 'preview';
  n.stepIndex = 0;
  return n;
}

export function swapJourney(s: PlannerState): PlannerState {
  const n = copyPlanner(s);
  n.startId = s.endId;
  n.endId = s.startId;
  n.draftStart = n.startId;
  n.draftEnd = n.endId;
  n.stage = 'preview';
  n.stepIndex = 0;
  return n;
}

export function startGuidance(s: PlannerState): PlannerState {
  const n = copyPlanner(s);
  n.stage = 'guiding';
  n.stepIndex = 0;
  return n;
}

export function advanceGuidance(s: PlannerState, count: number): PlannerState {
  const n = copyPlanner(s);
  if (s.stage !== 'guiding' || count < 1) {
    return n;
  }
  if (s.stepIndex >= count - 1) {
    n.stage = 'completed';
  } else {
    n.stepIndex = s.stepIndex + 1;
  }
  return n;
}

export function previousStep(s: PlannerState): PlannerState {
  const n = copyPlanner(s);
  n.stepIndex = Math.max(0, s.stepIndex - 1);
  n.stage = 'guiding';
  return n;
}

/** 单独设置某个字段（Web/小程序 UI 用，避免每加一个交互就改核心） */
export function withFields(s: PlannerState, patch: Partial<PlannerState>): PlannerState {
  const n = copyPlanner(s);
  Object.assign(n, patch);
  return n;
}

export function withStage(s: PlannerState, stage: RouteStage): PlannerState {
  const n = copyPlanner(s);
  n.stage = stage;
  n.stepIndex = stage === 'preview' ? 0 : n.stepIndex;
  return n;
}

export function withMapMode(s: PlannerState, mapMode: MapMode): PlannerState {
  const n = copyPlanner(s);
  n.mapMode = mapMode;
  return n;
}
