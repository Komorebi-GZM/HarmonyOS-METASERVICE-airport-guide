// 平台无关的类型定义。字段名与 ArkTS 端保持一致，便于逐行对照。
// 真源：harmony_app/entry/src/main/ets/{model,core}/*.ets

export interface RawMapNode {
  id: string;
  name: string;
  type: string;
  floor: string;
  x: number;
  y: number;
}

export interface RawMapEdge {
  from: string;
  to: string;
  type: string;
  weight: number;
}

export interface RawAirportMeta {
  schema?: number;
  airport: string;
  name: string;
  pxPerMeter: number;
  floors: Record<string, string>;
  /** 以下字段由数据源写入，运行时不一定存在（类型检查暴露了它们此前未声明） */
  version?: string;
  date?: string;
  note?: string;
  source?: string;
  nodeTypes?: string[];
  edgeTypes?: string[];
}

export interface RawAirportMap {
  meta: RawAirportMeta;
  nodes: RawMapNode[];
  edges: RawMapEdge[];
}

/** land=陆侧 / air=空侧 / gate=安检咽喉（唯一割点） */
export type Side = 'land' | 'air' | 'gate';

export interface MapNode extends RawMapNode {
  side: Side;
}

export interface MapEdge extends RawMapEdge {}

export interface RouteLeg {
  floor: string;
  nodeIds: string[];
  meters: number;
}

export interface RouteTransition {
  fromId: string;
  toId: string;
  viaType: string;
  viaName: string;
  fromFloor: string;
  toFloor: string;
  meters: number;
}

export interface Route {
  nodeIds: string[];
  totalMeters: number;
  legs: RouteLeg[];
  transitions: RouteTransition[];
  viaSecurity: boolean;
}

export function emptyRoute(): Route {
  return { nodeIds: [], totalMeters: 0, legs: [], transitions: [], viaSecurity: false };
}

export type StepKind = 'walk' | 'security' | 'transfer' | 'destination';

export interface RouteStep {
  kind: StepKind;
  fromId: string;
  toId: string;
  floor: string;
  toFloor: string;
  legIndex: number;
  meters: number;
  facility: string;
}

export type RouteStatus = 'ready' | 'missing' | 'invalid' | 'same' | 'unreachable';

export interface RouteView {
  status: RouteStatus;
  route: Route;
  steps: RouteStep[];
  walkingMeters: number;
}

export type RouteStage = 'editing' | 'preview' | 'guiding' | 'completed';
export type MapMode = 'browse' | 'route';
export type EditField = 'new' | 'start' | 'end';

export interface PlannerState {
  startId: string;
  endId: string;
  draftStart: string;
  draftEnd: string;
  preference: number;
  stage: RouteStage;
  stepIndex: number;
  category: string;
  query: string;
  browseFloor: string;
  mapMode: MapMode;
  editing: EditField;
  revision: number;
}

export interface SavedChoices {
  lang: string;
  recent: string[];
}

export interface AppPalette {
  bg: string; card: string; card2: string; line: string; text: string;
  sub: string; accent: string; accentSoft: string; gold: string; gtext: string;
}

export interface MapPalette {
  surface: string; grid: string; ink: string; ink2: string; muted: string;
  corridor: string; landWash: string; airWash: string;
}

export interface RoutePalette {
  color: string; case: string; trans: string;
}

export interface Category {
  key: string;
  nameZh: string;
  nameEn: string;
  symbol: string;
}
