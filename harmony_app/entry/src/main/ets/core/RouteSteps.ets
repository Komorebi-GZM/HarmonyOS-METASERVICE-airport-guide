import { XHA_EDGES, SECURITY_ID } from '../model/AirportMap';
import { Route, planRoute } from './Pathfinder';
import { place } from './Places';
export interface RouteStep { kind: string; fromId: string; toId: string; floor: string; toFloor: string; legIndex: number; meters: number; facility: string; }
export interface RouteView { status: string; route: Route; steps: RouteStep[]; walkingMeters: number; }
function edgeMeters(a: string, b: string): number {
  for (let i = 0; i < XHA_EDGES.length; i++) {
    const e = XHA_EDGES[i];
    if (e.type === 'walk' && ((e.from === a && e.to === b) || (e.from === b && e.to === a))) { return e.weight; }
  } return 0;
}
export function buildRouteView(startId: string, endId: string, pref: number): RouteView {
  const empty: Route = { nodeIds: [], totalMeters: 0, legs: [], transitions: [], viaSecurity: false };
  const result: RouteView = { status: 'ready', route: empty, steps: [], walkingMeters: 0 };
  if (startId === '' || endId === '') { result.status = 'missing'; return result; }
  if (place(startId) === undefined || place(endId) === undefined) { result.status = 'invalid'; return result; }
  if (startId === endId) { result.status = 'same'; return result; }
  result.route = planRoute(startId, endId, pref);
  if (result.route.nodeIds.length === 0) { result.status = 'unreachable'; return result; }
  for (let li = 0; li < result.route.legs.length; li++) {
    const leg = result.route.legs[li]; let from = leg.nodeIds[0]; let meters = 0;
    for (let i = 1; i < leg.nodeIds.length; i++) {
      meters += edgeMeters(leg.nodeIds[i - 1], leg.nodeIds[i]);
      if (leg.nodeIds[i] === SECURITY_ID || i === leg.nodeIds.length - 1) {
        const step: RouteStep = { kind: 'walk', fromId: from, toId: leg.nodeIds[i], floor: leg.floor, toFloor: leg.floor, legIndex: li, meters: meters, facility: '' };
        result.steps.push(step); result.walkingMeters += meters; from = leg.nodeIds[i]; meters = 0;
        if (from === SECURITY_ID && from !== endId) {
          const sec: RouteStep = { kind: 'security', fromId: from, toId: from, floor: leg.floor, toFloor: leg.floor, legIndex: li, meters: 0, facility: 'security' };
          result.steps.push(sec);
        }
      }
    }
    if (li < result.route.transitions.length) {
      const tr = result.route.transitions[li];
      const step: RouteStep = { kind: 'transfer', fromId: tr.fromId, toId: tr.toId, floor: tr.fromFloor, toFloor: tr.toFloor, legIndex: li, meters: 0, facility: tr.viaType };
      result.steps.push(step);
    }
  }
  const end = place(endId);
  const final: RouteStep = { kind: 'destination', fromId: endId, toId: endId, floor: end === undefined ? '' : end.floor, toFloor: end === undefined ? '' : end.floor, legIndex: result.route.legs.length - 1, meters: 0, facility: '' };
  result.steps.push(final); return result;
}
