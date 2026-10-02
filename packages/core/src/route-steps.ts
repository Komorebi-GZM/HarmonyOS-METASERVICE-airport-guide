// 路线视图：把 Route 变成用户能逐步确认的步骤序列 + 状态。
// 与 ArkTS 端 core/RouteSteps.ets 逐行对应。

import type { AirportGraph } from './graph.ts';
import type { Route, RouteStep, RouteView, StepKind } from './types.ts';
import { emptyRoute } from './types.ts';
import { planRoute } from './pathfinder.ts';
import { place } from './places.ts';

function edgeMeters(graph: AirportGraph, a: string, b: string): number {
  return graph.rawWeightOfType(a, b, 'walk') ?? 0;
}

export function buildRouteView(graph: AirportGraph, startId: string, endId: string, pref: number): RouteView {
  const result: RouteView = {
    status: 'ready',
    route: emptyRoute(),
    steps: [],
    walkingMeters: 0,
  };
  if (startId === '' || endId === '') {
    result.status = 'missing';
    return result;
  }
  if (place(graph, startId) === undefined || place(graph, endId) === undefined) {
    result.status = 'invalid';
    return result;
  }
  if (startId === endId) {
    result.status = 'same';
    return result;
  }
  result.route = planRoute(graph, startId, endId, pref);
  if (result.route.nodeIds.length === 0) {
    result.status = 'unreachable';
    return result;
  }
  const secId = graph.securityId;
  for (let li = 0; li < result.route.legs.length; li++) {
    const leg = result.route.legs[li];
    let from = leg.nodeIds[0];
    let meters = 0;
    for (let i = 1; i < leg.nodeIds.length; i++) {
      meters += edgeMeters(graph, leg.nodeIds[i - 1], leg.nodeIds[i]);
      if (leg.nodeIds[i] === secId || i === leg.nodeIds.length - 1) {
        const step: RouteStep = {
          kind: 'walk',
          fromId: from,
          toId: leg.nodeIds[i],
          floor: leg.floor,
          toFloor: leg.floor,
          legIndex: li,
          meters,
          facility: '',
        };
        result.steps.push(step);
        result.walkingMeters += meters;
        from = leg.nodeIds[i];
        meters = 0;
        if (from === secId && from !== endId) {
          const sec: RouteStep = {
            kind: 'security',
            fromId: from,
            toId: from,
            floor: leg.floor,
            toFloor: leg.floor,
            legIndex: li,
            meters: 0,
            facility: 'security',
          };
          result.steps.push(sec);
        }
      }
    }
    if (li < result.route.transitions.length) {
      const tr = result.route.transitions[li];
      const step: RouteStep = {
        kind: 'transfer',
        fromId: tr.fromId,
        toId: tr.toId,
        floor: tr.fromFloor,
        toFloor: tr.toFloor,
        legIndex: li,
        meters: 0,
        facility: tr.viaType,
      };
      result.steps.push(step);
    }
  }
  const end = place(graph, endId);
  const final: RouteStep = {
    kind: 'destination',
    fromId: endId,
    toId: endId,
    floor: end === undefined ? '' : end.floor,
    toFloor: end === undefined ? '' : end.floor,
    legIndex: result.route.legs.length - 1,
    meters: 0,
    facility: '',
  };
  result.steps.push(final);
  return result;
}

/** 步骤对应的主操作文案 key（与 ArkTS 页面里的分支保持同一套语义） */
export function stepActionKey(step: RouteStep, isLast: boolean): string {
  if (step.kind === 'security') { return 'passed_security'; }
  if (step.kind === 'transfer') { return 'arrived_floor'; }
  if (step.kind === 'destination' || isLast) { return 'finish'; }
  return 'arrived_here';
}

export function stepKindOf(step: RouteStep): StepKind {
  return step.kind;
}
