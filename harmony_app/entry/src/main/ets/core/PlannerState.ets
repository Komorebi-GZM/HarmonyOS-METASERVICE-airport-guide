// Replace the session object on every update so @Provide/@Consume observe all changes.
export class PlannerState {
  startId: string = ''; endId: string = ''; draftStart: string = ''; draftEnd: string = '';
  preference: number = 0; stage: string = 'editing'; stepIndex: number = 0;
  category: string = 'all'; query: string = ''; browseFloor: string = '4F';
  mapMode: string = 'browse'; editing: string = 'new'; revision: number = 0;
}
export function copyPlanner(s: PlannerState): PlannerState {
  const n = new PlannerState();
  n.startId = s.startId; n.endId = s.endId; n.draftStart = s.draftStart; n.draftEnd = s.draftEnd;
  n.preference = s.preference; n.stage = s.stage; n.stepIndex = s.stepIndex; n.category = s.category;
  n.query = s.query; n.browseFloor = s.browseFloor; n.mapMode = s.mapMode; n.editing = s.editing; n.revision = s.revision + 1;
  return n;
}
export function newJourney(s: PlannerState, endId: string = '', category: string = 'all'): PlannerState {
  const n = new PlannerState(); n.draftEnd = endId; n.category = category; n.revision = s.revision + 1; return n;
}
export function beginEdit(s: PlannerState, field: string): PlannerState {
  const n = copyPlanner(s); n.draftStart = s.startId; n.draftEnd = s.endId; n.editing = field; n.category = 'all'; n.query = ''; return n;
}
export function choosePlace(s: PlannerState, id: string, start: boolean): PlannerState {
  const n = copyPlanner(s); if (start) { n.draftStart = id; } else { n.draftEnd = id; } return n;
}
export function commitJourney(s: PlannerState): PlannerState {
  const n = copyPlanner(s); n.startId = s.draftStart; n.endId = s.draftEnd; n.stage = 'preview'; n.stepIndex = 0; n.editing = 'new'; return n;
}
export function cancelEdit(s: PlannerState): PlannerState {
  const n = copyPlanner(s); n.draftStart = s.startId; n.draftEnd = s.endId; n.editing = 'new'; return n;
}
export function changePreference(s: PlannerState, value: number): PlannerState {
  const n = copyPlanner(s); n.preference = value; n.stage = 'preview'; n.stepIndex = 0; return n;
}
export function swapJourney(s: PlannerState): PlannerState {
  const n = copyPlanner(s); n.startId = s.endId; n.endId = s.startId; n.draftStart = n.startId; n.draftEnd = n.endId; n.stage = 'preview'; n.stepIndex = 0; return n;
}
export function startGuidance(s: PlannerState): PlannerState {
  const n = copyPlanner(s); n.stage = 'guiding'; n.stepIndex = 0; return n;
}
export function advanceGuidance(s: PlannerState, count: number): PlannerState {
  const n = copyPlanner(s); if (s.stage !== 'guiding' || count < 1) { return n; }
  if (s.stepIndex >= count - 1) { n.stage = 'completed'; } else { n.stepIndex = s.stepIndex + 1; } return n;
}
export function previousStep(s: PlannerState): PlannerState {
  const n = copyPlanner(s); n.stepIndex = Math.max(0, s.stepIndex - 1); n.stage = 'guiding'; return n;
}
