// 共享核心入口：Web / 微信小程序 / Swift(经 JSON 桥) 都从这里取能力。
//
// 设计约束：
//   1. 本目录**不依赖任何平台 API**（无 DOM、无 wx.*、无 ArkTS Kit）。
//   2. 只用可擦除的 TypeScript 语法，Node 25 可直接 `node --test` 运行，无需构建。
//   3. 一切事实性数据（地图/文案/令牌/标签）来自 generated/，由 tools/export_shared.py 从 ArkTS 真源导出。

export * from './types.ts';
export { AirportGraph, AIRPORT, PX_PER_METER } from './graph.ts';
export {
  PREF_SHORTEST, PREF_ELEVATOR, PREF_ESCALATOR, PREF_AVOID_STAIR, PREFERENCE_COUNT,
  VERTICAL_WEIGHT, PREF_MULT, preferenceKey, effectiveWeight, dijkstra, planRoute,
  QUICK_STARTS, routeMeters,
} from './pathfinder.ts';
export { buildRouteView, stepActionKey, stepKindOf } from './route-steps.ts';
export {
  newPlanner, copyPlanner, newJourney, beginEdit, choosePlace, commitJourney, cancelEdit,
  changePreference, swapJourney, startGuidance, advanceGuidance, previousStep,
  withFields, withStage, withMapMode,
} from './planner.ts';
export {
  place, placeName, publicPlace, gateCode, searchPlaces, recentPlaces, listedPlaces,
} from './places.ts';
export {
  CATEGORIES, catOf, catName, catSymbol, HOT_DESTINATIONS,
} from './categories.ts';
export {
  LOC_KEYS, I18N_KEYS, t, hasKey, floorLabel, floorShort, typeLabel, nodeName, nodeNameEn,
  floorOrder, facilityLabel,
} from './i18n.ts';
export { Viewport, PAN_MARGIN, MAX_ZOOM, ROUTE_INSETS, BROWSE_INSETS } from './viewport.ts';
export { APP, MAP, ROUTE, HIT, TYPE_COLOR } from './generated/tokens.ts';
export { MAP_SHA256 } from './generated/map-data.ts';
