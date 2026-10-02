// 本文件由 tools/build_weapp.mjs 从 packages/core 打包生成，请勿手改。
// 重新生成：node tools/build_weapp.mjs
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// packages/core/src/index.ts
var index_exports = {};
__export(index_exports, {
  AIRPORT: () => AIRPORT,
  APP: () => APP,
  AirportGraph: () => AirportGraph,
  AppModel: () => AppModel,
  BROWSE_INSETS: () => BROWSE_INSETS,
  CANVAS: () => CANVAS,
  CATEGORIES: () => CATEGORIES,
  HIT: () => HIT,
  HOT_DESTINATIONS: () => HOT_DESTINATIONS,
  I18N_KEYS: () => I18N_KEYS,
  LOC_KEYS: () => LOC_KEYS,
  MAP: () => MAP,
  MAP_SHA256: () => MAP_SHA256,
  MAX_ZOOM: () => MAX_ZOOM,
  MemoryStore: () => MemoryStore,
  PAN_MARGIN: () => PAN_MARGIN,
  PREFERENCE_COUNT: () => PREFERENCE_COUNT,
  PREF_AVOID_STAIR: () => PREF_AVOID_STAIR,
  PREF_ELEVATOR: () => PREF_ELEVATOR,
  PREF_ESCALATOR: () => PREF_ESCALATOR,
  PREF_MULT: () => PREF_MULT,
  PREF_SHORTEST: () => PREF_SHORTEST,
  PX_PER_METER: () => PX_PER_METER,
  QUICK_STARTS: () => QUICK_STARTS,
  ROUTE: () => ROUTE,
  ROUTE_INSETS: () => ROUTE_INSETS,
  TYPE_COLOR: () => TYPE_COLOR,
  VERTICAL_WEIGHT: () => VERTICAL_WEIGHT,
  Viewport: () => Viewport,
  advanceGuidance: () => advanceGuidance,
  allSteps: () => allSteps,
  beginEdit: () => beginEdit,
  buildRouteView: () => buildRouteView,
  cancelEdit: () => cancelEdit,
  catName: () => catName,
  catOf: () => catOf,
  catSymbol: () => catSymbol,
  categoryChips: () => categoryChips,
  changePreference: () => changePreference,
  choosePlace: () => choosePlace,
  commitJourney: () => commitJourney,
  copyPlanner: () => copyPlanner,
  dijkstra: () => dijkstra,
  effectiveWeight: () => effectiveWeight,
  emptyRoute: () => emptyRoute,
  facilityLabel: () => facilityLabel,
  fitFloorViewport: () => fitFloorViewport,
  fitRouteViewport: () => fitRouteViewport,
  floorLabel: () => floorLabel,
  floorOrder: () => floorOrder,
  floorShort: () => floorShort,
  gateCode: () => gateCode,
  hasKey: () => hasKey,
  hitTest: () => hitTest,
  initialAppState: () => initialAppState,
  labelWidth: () => labelWidth,
  listedPlaces: () => listedPlaces,
  meters: () => meters,
  metroDirections: () => metroDirections,
  metroSteps: () => metroSteps,
  newJourney: () => newJourney,
  newPlanner: () => newPlanner,
  nodeName: () => nodeName,
  nodeNameEn: () => nodeNameEn,
  nodeRadius: () => nodeRadius,
  place: () => place,
  placeName: () => placeName,
  planRoute: () => planRoute,
  popularCards: () => popularCards,
  preferenceChips: () => preferenceChips,
  preferenceKey: () => preferenceKey,
  preferenceLabel: () => preferenceLabel,
  previousStep: () => previousStep,
  publicPlace: () => publicPlace,
  quickStartCards: () => quickStartCards,
  recentPlaces: () => recentPlaces,
  renderFloor: () => renderFloor,
  routeMeters: () => routeMeters,
  rowSubtitle: () => rowSubtitle,
  rowTitle: () => rowTitle,
  searchPlaces: () => searchPlaces,
  shouldLabel: () => shouldLabel,
  startGuidance: () => startGuidance,
  statusTitle: () => statusTitle,
  stepAction: () => stepAction,
  stepActionKey: () => stepActionKey,
  stepKindOf: () => stepKindOf,
  stepTitle: () => stepTitle,
  summary: () => summary,
  swapJourney: () => swapJourney,
  t: () => t,
  typeColor: () => typeColor,
  typeLabel: () => typeLabel,
  withFields: () => withFields,
  withMapMode: () => withMapMode,
  withStage: () => withStage
});
module.exports = __toCommonJS(index_exports);

// packages/core/src/types.ts
function emptyRoute() {
  return { nodeIds: [], totalMeters: 0, legs: [], transitions: [], viaSecurity: false };
}

// packages/core/src/generated/map-data.ts
var MAP_SHA256 = "a61d3d22cde1d320533c07d9a8f692dcf707110ca7f950a5de4f2913febbb256";
var MAP_RAW = {
  "meta": {
    "schema": 1,
    "airport": "XHA",
    "name": "星海国际机场 主航站楼",
    "pxPerMeter": 2,
    "floors": {
      "4F": "出发层",
      "3F": "空侧候机夹层",
      "2F": "到达层",
      "1F": "地面迎客层",
      "B1": "交通中心",
      "B2": "地铁站台"
    },
    "version": "1.0",
    "date": "2026-09-11",
    "note": "示意拓扑，非真实比例；坐标 = 图片来源坐标系",
    "source": "根据公开布局示意重构，非官方数据",
    "nodeTypes": [
      "baggage",
      "checkin",
      "coach",
      "corridor",
      "entrance",
      "escalator",
      "exit",
      "gate",
      "hall",
      "lift",
      "metro",
      "parking",
      "security",
      "stair",
      "toilet"
    ],
    "edgeTypes": [
      "elevator",
      "escalator",
      "stair",
      "walk"
    ]
  },
  "nodes": [
    {
      "id": "xha_p4_doorW",
      "name": "西出发门",
      "type": "entrance",
      "floor": "4F",
      "x": 250,
      "y": 60
    },
    {
      "id": "xha_p4_doorN",
      "name": "北出发门",
      "type": "entrance",
      "floor": "4F",
      "x": 540,
      "y": 60
    },
    {
      "id": "xha_p4_doorE",
      "name": "东出发门",
      "type": "entrance",
      "floor": "4F",
      "x": 830,
      "y": 60
    },
    {
      "id": "xha_p4_ckA",
      "name": "A岛值机(国际)",
      "type": "checkin",
      "floor": "4F",
      "x": 250,
      "y": 150
    },
    {
      "id": "xha_p4_ckB",
      "name": "B岛值机(国内)",
      "type": "checkin",
      "floor": "4F",
      "x": 430,
      "y": 150
    },
    {
      "id": "xha_p4_ckC",
      "name": "C岛值机(国内)",
      "type": "checkin",
      "floor": "4F",
      "x": 610,
      "y": 150
    },
    {
      "id": "xha_p4_ckD",
      "name": "D岛自助值机",
      "type": "checkin",
      "floor": "4F",
      "x": 790,
      "y": 150
    },
    {
      "id": "xha_p4_preSec",
      "name": "安检前大厅",
      "type": "corridor",
      "floor": "4F",
      "x": 540,
      "y": 230
    },
    {
      "id": "xha_p4_sec",
      "name": "中央安检大厅(唯一)",
      "type": "security",
      "floor": "4F",
      "x": 540,
      "y": 310
    },
    {
      "id": "xha_p4_airMall",
      "name": "空侧免税商业区",
      "type": "hall",
      "floor": "4F",
      "x": 540,
      "y": 400
    },
    {
      "id": "xha_p4_rest",
      "name": "出发层洗手间",
      "type": "toilet",
      "floor": "4F",
      "x": 370,
      "y": 500
    },
    {
      "id": "xha_p4_liftW",
      "name": "西区电梯",
      "type": "lift",
      "floor": "4F",
      "x": 250,
      "y": 240
    },
    {
      "id": "xha_p4_liftC",
      "name": "中庭观光电梯",
      "type": "lift",
      "floor": "4F",
      "x": 620,
      "y": 240
    },
    {
      "id": "xha_p4_liftE",
      "name": "东区电梯",
      "type": "lift",
      "floor": "4F",
      "x": 830,
      "y": 240
    },
    {
      "id": "xha_p4_liftWSl",
      "name": "空侧西电梯",
      "type": "lift",
      "floor": "4F",
      "x": 230,
      "y": 470
    },
    {
      "id": "xha_p4_liftCSl",
      "name": "空侧中庭电梯",
      "type": "lift",
      "floor": "4F",
      "x": 540,
      "y": 480
    },
    {
      "id": "xha_p4_liftESl",
      "name": "空侧东电梯",
      "type": "lift",
      "floor": "4F",
      "x": 850,
      "y": 470
    },
    {
      "id": "xha_p4_escY",
      "name": "空侧扶梯组",
      "type": "escalator",
      "floor": "4F",
      "x": 470,
      "y": 540
    },
    {
      "id": "xha_p4_stairY",
      "name": "空侧楼梯",
      "type": "stair",
      "floor": "4F",
      "x": 650,
      "y": 540
    },
    {
      "id": "xha_p4_a0",
      "name": "A指廊北口",
      "type": "corridor",
      "floor": "4F",
      "x": 250,
      "y": 560
    },
    {
      "id": "xha_p4_a1",
      "name": "A指廊中段",
      "type": "corridor",
      "floor": "4F",
      "x": 250,
      "y": 650
    },
    {
      "id": "xha_p4_a2",
      "name": "A指廊中后段",
      "type": "corridor",
      "floor": "4F",
      "x": 250,
      "y": 740
    },
    {
      "id": "xha_p4_a3",
      "name": "A指廊南端",
      "type": "corridor",
      "floor": "4F",
      "x": 250,
      "y": 820
    },
    {
      "id": "xha_p4_b0",
      "name": "B指廊北口",
      "type": "corridor",
      "floor": "4F",
      "x": 540,
      "y": 560
    },
    {
      "id": "xha_p4_b1",
      "name": "B指廊中段",
      "type": "corridor",
      "floor": "4F",
      "x": 540,
      "y": 650
    },
    {
      "id": "xha_p4_b2",
      "name": "B指廊中后段",
      "type": "corridor",
      "floor": "4F",
      "x": 540,
      "y": 740
    },
    {
      "id": "xha_p4_b3",
      "name": "B指廊南端",
      "type": "corridor",
      "floor": "4F",
      "x": 540,
      "y": 820
    },
    {
      "id": "xha_p4_c0",
      "name": "C指廊北口",
      "type": "corridor",
      "floor": "4F",
      "x": 830,
      "y": 560
    },
    {
      "id": "xha_p4_c1",
      "name": "C指廊中段",
      "type": "corridor",
      "floor": "4F",
      "x": 830,
      "y": 650
    },
    {
      "id": "xha_p4_c2",
      "name": "C指廊中后段",
      "type": "corridor",
      "floor": "4F",
      "x": 830,
      "y": 740
    },
    {
      "id": "xha_p4_c3",
      "name": "C指廊南端",
      "type": "corridor",
      "floor": "4F",
      "x": 830,
      "y": 820
    },
    {
      "id": "xha_p4_gA101",
      "name": "登机口A101",
      "type": "gate",
      "floor": "4F",
      "x": 130,
      "y": 560
    },
    {
      "id": "xha_p4_gA102",
      "name": "登机口A102",
      "type": "gate",
      "floor": "4F",
      "x": 370,
      "y": 560
    },
    {
      "id": "xha_p4_gA103",
      "name": "登机口A103",
      "type": "gate",
      "floor": "4F",
      "x": 130,
      "y": 650
    },
    {
      "id": "xha_p4_gA104",
      "name": "登机口A104",
      "type": "gate",
      "floor": "4F",
      "x": 370,
      "y": 650
    },
    {
      "id": "xha_p4_gA105",
      "name": "登机口A105",
      "type": "gate",
      "floor": "4F",
      "x": 130,
      "y": 740
    },
    {
      "id": "xha_p4_gA106",
      "name": "登机口A106",
      "type": "gate",
      "floor": "4F",
      "x": 370,
      "y": 740
    },
    {
      "id": "xha_p4_gA107",
      "name": "登机口A107",
      "type": "gate",
      "floor": "4F",
      "x": 130,
      "y": 820
    },
    {
      "id": "xha_p4_gA108",
      "name": "登机口A108",
      "type": "gate",
      "floor": "4F",
      "x": 370,
      "y": 820
    },
    {
      "id": "xha_p4_gB201",
      "name": "登机口B201",
      "type": "gate",
      "floor": "4F",
      "x": 420,
      "y": 560
    },
    {
      "id": "xha_p4_gB202",
      "name": "登机口B202",
      "type": "gate",
      "floor": "4F",
      "x": 660,
      "y": 560
    },
    {
      "id": "xha_p4_gB203",
      "name": "登机口B203",
      "type": "gate",
      "floor": "4F",
      "x": 420,
      "y": 650
    },
    {
      "id": "xha_p4_gB204",
      "name": "登机口B204",
      "type": "gate",
      "floor": "4F",
      "x": 660,
      "y": 650
    },
    {
      "id": "xha_p4_gB205",
      "name": "登机口B205",
      "type": "gate",
      "floor": "4F",
      "x": 420,
      "y": 740
    },
    {
      "id": "xha_p4_gB206",
      "name": "登机口B206",
      "type": "gate",
      "floor": "4F",
      "x": 660,
      "y": 740
    },
    {
      "id": "xha_p4_gB207",
      "name": "登机口B207",
      "type": "gate",
      "floor": "4F",
      "x": 420,
      "y": 820
    },
    {
      "id": "xha_p4_gB208",
      "name": "登机口B208",
      "type": "gate",
      "floor": "4F",
      "x": 660,
      "y": 820
    },
    {
      "id": "xha_p4_gC301",
      "name": "登机口C301",
      "type": "gate",
      "floor": "4F",
      "x": 710,
      "y": 560
    },
    {
      "id": "xha_p4_gC302",
      "name": "登机口C302",
      "type": "gate",
      "floor": "4F",
      "x": 950,
      "y": 560
    },
    {
      "id": "xha_p4_gC303",
      "name": "登机口C303",
      "type": "gate",
      "floor": "4F",
      "x": 710,
      "y": 650
    },
    {
      "id": "xha_p4_gC304",
      "name": "登机口C304",
      "type": "gate",
      "floor": "4F",
      "x": 950,
      "y": 650
    },
    {
      "id": "xha_p4_gC305",
      "name": "登机口C305",
      "type": "gate",
      "floor": "4F",
      "x": 710,
      "y": 740
    },
    {
      "id": "xha_p4_gC306",
      "name": "登机口C306",
      "type": "gate",
      "floor": "4F",
      "x": 950,
      "y": 740
    },
    {
      "id": "xha_p4_gC307",
      "name": "登机口C307",
      "type": "gate",
      "floor": "4F",
      "x": 710,
      "y": 820
    },
    {
      "id": "xha_p4_gC308",
      "name": "登机口C308",
      "type": "gate",
      "floor": "4F",
      "x": 950,
      "y": 820
    },
    {
      "id": "xha_p3_mezz",
      "name": "夹层中央厅",
      "type": "hall",
      "floor": "3F",
      "x": 540,
      "y": 400
    },
    {
      "id": "xha_p3_food",
      "name": "空侧餐饮区",
      "type": "hall",
      "floor": "3F",
      "x": 340,
      "y": 300
    },
    {
      "id": "xha_p3_deck",
      "name": "观景露台",
      "type": "corridor",
      "floor": "3F",
      "x": 540,
      "y": 140
    },
    {
      "id": "xha_p3_loungeA",
      "name": "贵宾休息室A",
      "type": "hall",
      "floor": "3F",
      "x": 760,
      "y": 270
    },
    {
      "id": "xha_p3_loungeB",
      "name": "贵宾休息室B",
      "type": "hall",
      "floor": "3F",
      "x": 760,
      "y": 520
    },
    {
      "id": "xha_p3_kids",
      "name": "亲子游乐区",
      "type": "corridor",
      "floor": "3F",
      "x": 260,
      "y": 520
    },
    {
      "id": "xha_p3_rest3",
      "name": "洗手间",
      "type": "toilet",
      "floor": "3F",
      "x": 420,
      "y": 540
    },
    {
      "id": "xha_p3_liftWSl",
      "name": "空侧西电梯",
      "type": "lift",
      "floor": "3F",
      "x": 250,
      "y": 440
    },
    {
      "id": "xha_p3_liftCSl",
      "name": "空侧中庭电梯",
      "type": "lift",
      "floor": "3F",
      "x": 540,
      "y": 480
    },
    {
      "id": "xha_p3_liftESl",
      "name": "空侧东电梯",
      "type": "lift",
      "floor": "3F",
      "x": 830,
      "y": 440
    },
    {
      "id": "xha_p3_escY",
      "name": "空侧扶梯组",
      "type": "escalator",
      "floor": "3F",
      "x": 470,
      "y": 560
    },
    {
      "id": "xha_p3_stairY",
      "name": "空侧楼梯",
      "type": "stair",
      "floor": "3F",
      "x": 650,
      "y": 560
    },
    {
      "id": "xha_p2_aw0",
      "name": "西到达廊北口",
      "type": "corridor",
      "floor": "2F",
      "x": 250,
      "y": 300
    },
    {
      "id": "xha_p2_aw1",
      "name": "西到达廊中段",
      "type": "corridor",
      "floor": "2F",
      "x": 250,
      "y": 430
    },
    {
      "id": "xha_p2_aw2",
      "name": "西到达廊南端",
      "type": "corridor",
      "floor": "2F",
      "x": 250,
      "y": 560
    },
    {
      "id": "xha_p2_ac0",
      "name": "中到达廊北口",
      "type": "corridor",
      "floor": "2F",
      "x": 540,
      "y": 300
    },
    {
      "id": "xha_p2_ac1",
      "name": "中到达廊中段",
      "type": "corridor",
      "floor": "2F",
      "x": 540,
      "y": 430
    },
    {
      "id": "xha_p2_ac2",
      "name": "中到达廊南端",
      "type": "corridor",
      "floor": "2F",
      "x": 540,
      "y": 560
    },
    {
      "id": "xha_p2_ae0",
      "name": "东到达廊北口",
      "type": "corridor",
      "floor": "2F",
      "x": 830,
      "y": 300
    },
    {
      "id": "xha_p2_ae1",
      "name": "东到达廊中段",
      "type": "corridor",
      "floor": "2F",
      "x": 830,
      "y": 430
    },
    {
      "id": "xha_p2_ae2",
      "name": "东到达廊南端",
      "type": "corridor",
      "floor": "2F",
      "x": 830,
      "y": 560
    },
    {
      "id": "xha_p2_bagA",
      "name": "行李提取A区",
      "type": "baggage",
      "floor": "2F",
      "x": 380,
      "y": 190
    },
    {
      "id": "xha_p2_bagB",
      "name": "行李提取B区",
      "type": "baggage",
      "floor": "2F",
      "x": 700,
      "y": 190
    },
    {
      "id": "xha_p2_arrHall",
      "name": "中央到达大厅",
      "type": "hall",
      "floor": "2F",
      "x": 540,
      "y": 230
    },
    {
      "id": "xha_p2_exitN",
      "name": "主到达出口",
      "type": "exit",
      "floor": "2F",
      "x": 540,
      "y": 110
    },
    {
      "id": "xha_p2_exitW",
      "name": "西到达出口",
      "type": "exit",
      "floor": "2F",
      "x": 250,
      "y": 110
    },
    {
      "id": "xha_p2_exitE",
      "name": "东到达出口",
      "type": "exit",
      "floor": "2F",
      "x": 830,
      "y": 110
    },
    {
      "id": "xha_p2_rest2",
      "name": "到达层洗手间",
      "type": "toilet",
      "floor": "2F",
      "x": 620,
      "y": 460
    },
    {
      "id": "xha_p2_liftW",
      "name": "西区电梯",
      "type": "lift",
      "floor": "2F",
      "x": 250,
      "y": 420
    },
    {
      "id": "xha_p2_liftC",
      "name": "中庭观光电梯",
      "type": "lift",
      "floor": "2F",
      "x": 540,
      "y": 380
    },
    {
      "id": "xha_p2_liftE",
      "name": "东区电梯",
      "type": "lift",
      "floor": "2F",
      "x": 830,
      "y": 420
    },
    {
      "id": "xha_p2_escC",
      "name": "中央扶梯组",
      "type": "escalator",
      "floor": "2F",
      "x": 540,
      "y": 470
    },
    {
      "id": "xha_p2_stairC",
      "name": "中庭楼梯",
      "type": "stair",
      "floor": "2F",
      "x": 450,
      "y": 470
    },
    {
      "id": "xha_p1_lobby",
      "name": "迎客·到达大厅",
      "type": "hall",
      "floor": "1F",
      "x": 540,
      "y": 300
    },
    {
      "id": "xha_p1_taxi",
      "name": "出租·网约上车点",
      "type": "coach",
      "floor": "1F",
      "x": 260,
      "y": 160
    },
    {
      "id": "xha_p1_bus",
      "name": "机场巴士站台",
      "type": "coach",
      "floor": "1F",
      "x": 820,
      "y": 160
    },
    {
      "id": "xha_p1_luggage",
      "name": "行李寄存处",
      "type": "corridor",
      "floor": "1F",
      "x": 400,
      "y": 480
    },
    {
      "id": "xha_p1_linkG",
      "name": "航站楼间连廊",
      "type": "corridor",
      "floor": "1F",
      "x": 700,
      "y": 480
    },
    {
      "id": "xha_p1_rest1",
      "name": "洗手间",
      "type": "toilet",
      "floor": "1F",
      "x": 540,
      "y": 460
    },
    {
      "id": "xha_p1_liftW",
      "name": "西区电梯",
      "type": "lift",
      "floor": "1F",
      "x": 250,
      "y": 420
    },
    {
      "id": "xha_p1_liftC",
      "name": "中庭观光电梯",
      "type": "lift",
      "floor": "1F",
      "x": 540,
      "y": 430
    },
    {
      "id": "xha_p1_liftE",
      "name": "东区电梯",
      "type": "lift",
      "floor": "1F",
      "x": 830,
      "y": 420
    },
    {
      "id": "xha_p1_escC",
      "name": "中央扶梯组",
      "type": "escalator",
      "floor": "1F",
      "x": 470,
      "y": 560
    },
    {
      "id": "xha_p1_stairC",
      "name": "中庭楼梯",
      "type": "stair",
      "floor": "1F",
      "x": 620,
      "y": 560
    },
    {
      "id": "xha_b1_gtc",
      "name": "交通中心大厅",
      "type": "hall",
      "floor": "B1",
      "x": 540,
      "y": 260
    },
    {
      "id": "xha_b1_metroL",
      "name": "地铁站厅(非付费区)",
      "type": "hall",
      "floor": "B1",
      "x": 380,
      "y": 300
    },
    {
      "id": "xha_b1_metroG",
      "name": "地铁闸机群",
      "type": "corridor",
      "floor": "B1",
      "x": 380,
      "y": 360
    },
    {
      "id": "xha_b1_coachC",
      "name": "机场大巴·长途站",
      "type": "coach",
      "floor": "B1",
      "x": 150,
      "y": 300
    },
    {
      "id": "xha_b1_taxiH",
      "name": "出租车·网约车候车区",
      "type": "coach",
      "floor": "B1",
      "x": 880,
      "y": 300
    },
    {
      "id": "xha_b1_park",
      "name": "P1停车楼",
      "type": "parking",
      "floor": "B1",
      "x": 700,
      "y": 440
    },
    {
      "id": "xha_b1_restB",
      "name": "洗手间",
      "type": "toilet",
      "floor": "B1",
      "x": 540,
      "y": 150
    },
    {
      "id": "xha_b1_liftW",
      "name": "西区电梯",
      "type": "lift",
      "floor": "B1",
      "x": 260,
      "y": 400
    },
    {
      "id": "xha_b1_liftC",
      "name": "中庭观光电梯",
      "type": "lift",
      "floor": "B1",
      "x": 540,
      "y": 400
    },
    {
      "id": "xha_b1_liftE",
      "name": "东区电梯",
      "type": "lift",
      "floor": "B1",
      "x": 800,
      "y": 400
    },
    {
      "id": "xha_b1_escC",
      "name": "中央扶梯组",
      "type": "escalator",
      "floor": "B1",
      "x": 540,
      "y": 340
    },
    {
      "id": "xha_b1_escM",
      "name": "地铁扶梯",
      "type": "escalator",
      "floor": "B1",
      "x": 380,
      "y": 440
    },
    {
      "id": "xha_b1_stairC",
      "name": "中庭楼梯",
      "type": "stair",
      "floor": "B1",
      "x": 620,
      "y": 300
    },
    {
      "id": "xha_b1_stairM",
      "name": "地铁楼梯",
      "type": "stair",
      "floor": "B1",
      "x": 620,
      "y": 470
    },
    {
      "id": "xha_b2_escM",
      "name": "地铁扶梯",
      "type": "escalator",
      "floor": "B2",
      "x": 360,
      "y": 420
    },
    {
      "id": "xha_b2_stairM",
      "name": "地铁楼梯",
      "type": "stair",
      "floor": "B2",
      "x": 620,
      "y": 420
    },
    {
      "id": "xha_b2_pasg",
      "name": "站台联络通道",
      "type": "corridor",
      "floor": "B2",
      "x": 500,
      "y": 360
    },
    {
      "id": "xha_b2_platA",
      "name": "站台·往市区方向",
      "type": "metro",
      "floor": "B2",
      "x": 300,
      "y": 260
    },
    {
      "id": "xha_b2_platB",
      "name": "站台·往星湖度假区",
      "type": "metro",
      "floor": "B2",
      "x": 700,
      "y": 260
    },
    {
      "id": "xha_b2_liftC",
      "name": "中庭观光电梯",
      "type": "lift",
      "floor": "B2",
      "x": 500,
      "y": 180
    }
  ],
  "edges": [
    {
      "from": "xha_p4_doorW",
      "to": "xha_p4_ckA",
      "type": "walk",
      "weight": 45
    },
    {
      "from": "xha_p4_doorN",
      "to": "xha_p4_ckB",
      "type": "walk",
      "weight": 70
    },
    {
      "from": "xha_p4_doorN",
      "to": "xha_p4_ckC",
      "type": "walk",
      "weight": 55
    },
    {
      "from": "xha_p4_doorE",
      "to": "xha_p4_ckD",
      "type": "walk",
      "weight": 50
    },
    {
      "from": "xha_p4_liftW",
      "to": "xha_p4_ckA",
      "type": "walk",
      "weight": 45
    },
    {
      "from": "xha_p4_liftC",
      "to": "xha_p4_preSec",
      "type": "walk",
      "weight": 40
    },
    {
      "from": "xha_p4_liftE",
      "to": "xha_p4_ckD",
      "type": "walk",
      "weight": 50
    },
    {
      "from": "xha_p4_ckA",
      "to": "xha_p4_preSec",
      "type": "walk",
      "weight": 150
    },
    {
      "from": "xha_p4_ckB",
      "to": "xha_p4_preSec",
      "type": "walk",
      "weight": 70
    },
    {
      "from": "xha_p4_ckC",
      "to": "xha_p4_preSec",
      "type": "walk",
      "weight": 55
    },
    {
      "from": "xha_p4_ckD",
      "to": "xha_p4_preSec",
      "type": "walk",
      "weight": 130
    },
    {
      "from": "xha_p4_preSec",
      "to": "xha_p4_sec",
      "type": "walk",
      "weight": 40
    },
    {
      "from": "xha_p4_sec",
      "to": "xha_p4_airMall",
      "type": "walk",
      "weight": 45
    },
    {
      "from": "xha_p4_airMall",
      "to": "xha_p4_liftWSl",
      "type": "walk",
      "weight": 160
    },
    {
      "from": "xha_p4_airMall",
      "to": "xha_p4_liftCSl",
      "type": "walk",
      "weight": 40
    },
    {
      "from": "xha_p4_airMall",
      "to": "xha_p4_liftESl",
      "type": "walk",
      "weight": 160
    },
    {
      "from": "xha_p4_airMall",
      "to": "xha_p4_escY",
      "type": "walk",
      "weight": 80
    },
    {
      "from": "xha_p4_airMall",
      "to": "xha_p4_stairY",
      "type": "walk",
      "weight": 90
    },
    {
      "from": "xha_p4_airMall",
      "to": "xha_p4_a0",
      "type": "walk",
      "weight": 165
    },
    {
      "from": "xha_p4_airMall",
      "to": "xha_p4_b0",
      "type": "walk",
      "weight": 80
    },
    {
      "from": "xha_p4_airMall",
      "to": "xha_p4_c0",
      "type": "walk",
      "weight": 165
    },
    {
      "from": "xha_p4_liftWSl",
      "to": "xha_p4_a0",
      "type": "walk",
      "weight": 45
    },
    {
      "from": "xha_p4_liftESl",
      "to": "xha_p4_c0",
      "type": "walk",
      "weight": 45
    },
    {
      "from": "xha_p4_stairY",
      "to": "xha_p4_b0",
      "type": "walk",
      "weight": 55
    },
    {
      "from": "xha_p4_rest",
      "to": "xha_p4_b0",
      "type": "walk",
      "weight": 90
    },
    {
      "from": "xha_p4_a0",
      "to": "xha_p4_a1",
      "type": "walk",
      "weight": 45
    },
    {
      "from": "xha_p4_a1",
      "to": "xha_p4_a2",
      "type": "walk",
      "weight": 45
    },
    {
      "from": "xha_p4_a2",
      "to": "xha_p4_a3",
      "type": "walk",
      "weight": 40
    },
    {
      "from": "xha_p4_b0",
      "to": "xha_p4_b1",
      "type": "walk",
      "weight": 45
    },
    {
      "from": "xha_p4_b1",
      "to": "xha_p4_b2",
      "type": "walk",
      "weight": 45
    },
    {
      "from": "xha_p4_b2",
      "to": "xha_p4_b3",
      "type": "walk",
      "weight": 40
    },
    {
      "from": "xha_p4_c0",
      "to": "xha_p4_c1",
      "type": "walk",
      "weight": 45
    },
    {
      "from": "xha_p4_c1",
      "to": "xha_p4_c2",
      "type": "walk",
      "weight": 45
    },
    {
      "from": "xha_p4_c2",
      "to": "xha_p4_c3",
      "type": "walk",
      "weight": 40
    },
    {
      "from": "xha_p4_gA101",
      "to": "xha_p4_a0",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gA102",
      "to": "xha_p4_a0",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gA103",
      "to": "xha_p4_a1",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gA104",
      "to": "xha_p4_a1",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gA105",
      "to": "xha_p4_a2",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gA106",
      "to": "xha_p4_a2",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gA107",
      "to": "xha_p4_a3",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gA108",
      "to": "xha_p4_a3",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gB201",
      "to": "xha_p4_b0",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gB202",
      "to": "xha_p4_b0",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gB203",
      "to": "xha_p4_b1",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gB204",
      "to": "xha_p4_b1",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gB205",
      "to": "xha_p4_b2",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gB206",
      "to": "xha_p4_b2",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gB207",
      "to": "xha_p4_b3",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gB208",
      "to": "xha_p4_b3",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gC301",
      "to": "xha_p4_c0",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gC302",
      "to": "xha_p4_c0",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gC303",
      "to": "xha_p4_c1",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gC304",
      "to": "xha_p4_c1",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gC305",
      "to": "xha_p4_c2",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gC306",
      "to": "xha_p4_c2",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gC307",
      "to": "xha_p4_c3",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p4_gC308",
      "to": "xha_p4_c3",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p3_mezz",
      "to": "xha_p3_food",
      "type": "walk",
      "weight": 110
    },
    {
      "from": "xha_p3_mezz",
      "to": "xha_p3_deck",
      "type": "walk",
      "weight": 130
    },
    {
      "from": "xha_p3_mezz",
      "to": "xha_p3_loungeA",
      "type": "walk",
      "weight": 130
    },
    {
      "from": "xha_p3_mezz",
      "to": "xha_p3_loungeB",
      "type": "walk",
      "weight": 125
    },
    {
      "from": "xha_p3_mezz",
      "to": "xha_p3_kids",
      "type": "walk",
      "weight": 150
    },
    {
      "from": "xha_p3_mezz",
      "to": "xha_p3_rest3",
      "type": "walk",
      "weight": 90
    },
    {
      "from": "xha_p3_mezz",
      "to": "xha_p3_liftWSl",
      "type": "walk",
      "weight": 145
    },
    {
      "from": "xha_p3_mezz",
      "to": "xha_p3_liftCSl",
      "type": "walk",
      "weight": 40
    },
    {
      "from": "xha_p3_mezz",
      "to": "xha_p3_liftESl",
      "type": "walk",
      "weight": 145
    },
    {
      "from": "xha_p3_mezz",
      "to": "xha_p3_escY",
      "type": "walk",
      "weight": 85
    },
    {
      "from": "xha_p3_mezz",
      "to": "xha_p3_stairY",
      "type": "walk",
      "weight": 95
    },
    {
      "from": "xha_p2_aw0",
      "to": "xha_p2_aw1",
      "type": "walk",
      "weight": 65
    },
    {
      "from": "xha_p2_aw1",
      "to": "xha_p2_aw2",
      "type": "walk",
      "weight": 65
    },
    {
      "from": "xha_p2_ac0",
      "to": "xha_p2_ac1",
      "type": "walk",
      "weight": 65
    },
    {
      "from": "xha_p2_ac1",
      "to": "xha_p2_ac2",
      "type": "walk",
      "weight": 65
    },
    {
      "from": "xha_p2_ae0",
      "to": "xha_p2_ae1",
      "type": "walk",
      "weight": 65
    },
    {
      "from": "xha_p2_ae1",
      "to": "xha_p2_ae2",
      "type": "walk",
      "weight": 65
    },
    {
      "from": "xha_p2_aw0",
      "to": "xha_p2_bagA",
      "type": "walk",
      "weight": 85
    },
    {
      "from": "xha_p2_ac0",
      "to": "xha_p2_arrHall",
      "type": "walk",
      "weight": 35
    },
    {
      "from": "xha_p2_ae0",
      "to": "xha_p2_bagB",
      "type": "walk",
      "weight": 85
    },
    {
      "from": "xha_p2_bagA",
      "to": "xha_p2_arrHall",
      "type": "walk",
      "weight": 80
    },
    {
      "from": "xha_p2_bagB",
      "to": "xha_p2_arrHall",
      "type": "walk",
      "weight": 80
    },
    {
      "from": "xha_p2_bagA",
      "to": "xha_p2_exitW",
      "type": "walk",
      "weight": 75
    },
    {
      "from": "xha_p2_bagB",
      "to": "xha_p2_exitE",
      "type": "walk",
      "weight": 75
    },
    {
      "from": "xha_p2_arrHall",
      "to": "xha_p2_exitN",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p2_arrHall",
      "to": "xha_p2_liftC",
      "type": "walk",
      "weight": 75
    },
    {
      "from": "xha_p2_arrHall",
      "to": "xha_p2_escC",
      "type": "walk",
      "weight": 120
    },
    {
      "from": "xha_p2_arrHall",
      "to": "xha_p2_stairC",
      "type": "walk",
      "weight": 130
    },
    {
      "from": "xha_p2_arrHall",
      "to": "xha_p2_rest2",
      "type": "walk",
      "weight": 120
    },
    {
      "from": "xha_p2_bagA",
      "to": "xha_p2_liftW",
      "type": "walk",
      "weight": 130
    },
    {
      "from": "xha_p2_liftW",
      "to": "xha_p2_aw0",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p2_bagB",
      "to": "xha_p2_liftE",
      "type": "walk",
      "weight": 130
    },
    {
      "from": "xha_p2_liftE",
      "to": "xha_p2_ae0",
      "type": "walk",
      "weight": 60
    },
    {
      "from": "xha_p2_escC",
      "to": "xha_p2_ac0",
      "type": "walk",
      "weight": 85
    },
    {
      "from": "xha_p1_lobby",
      "to": "xha_p1_taxi",
      "type": "walk",
      "weight": 155
    },
    {
      "from": "xha_p1_lobby",
      "to": "xha_p1_bus",
      "type": "walk",
      "weight": 155
    },
    {
      "from": "xha_p1_lobby",
      "to": "xha_p1_luggage",
      "type": "walk",
      "weight": 115
    },
    {
      "from": "xha_p1_lobby",
      "to": "xha_p1_linkG",
      "type": "walk",
      "weight": 120
    },
    {
      "from": "xha_p1_lobby",
      "to": "xha_p1_rest1",
      "type": "walk",
      "weight": 80
    },
    {
      "from": "xha_p1_lobby",
      "to": "xha_p1_liftW",
      "type": "walk",
      "weight": 155
    },
    {
      "from": "xha_p1_lobby",
      "to": "xha_p1_liftC",
      "type": "walk",
      "weight": 65
    },
    {
      "from": "xha_p1_lobby",
      "to": "xha_p1_liftE",
      "type": "walk",
      "weight": 155
    },
    {
      "from": "xha_p1_lobby",
      "to": "xha_p1_escC",
      "type": "walk",
      "weight": 135
    },
    {
      "from": "xha_p1_lobby",
      "to": "xha_p1_stairC",
      "type": "walk",
      "weight": 135
    },
    {
      "from": "xha_p1_luggage",
      "to": "xha_p1_linkG",
      "type": "walk",
      "weight": 150
    },
    {
      "from": "xha_b1_liftW",
      "to": "xha_b1_gtc",
      "type": "walk",
      "weight": 155
    },
    {
      "from": "xha_b1_liftC",
      "to": "xha_b1_gtc",
      "type": "walk",
      "weight": 70
    },
    {
      "from": "xha_b1_liftE",
      "to": "xha_b1_gtc",
      "type": "walk",
      "weight": 150
    },
    {
      "from": "xha_b1_escC",
      "to": "xha_b1_gtc",
      "type": "walk",
      "weight": 40
    },
    {
      "from": "xha_b1_stairC",
      "to": "xha_b1_gtc",
      "type": "walk",
      "weight": 45
    },
    {
      "from": "xha_b1_gtc",
      "to": "xha_b1_coachC",
      "type": "walk",
      "weight": 195
    },
    {
      "from": "xha_b1_gtc",
      "to": "xha_b1_taxiH",
      "type": "walk",
      "weight": 170
    },
    {
      "from": "xha_b1_gtc",
      "to": "xha_b1_park",
      "type": "walk",
      "weight": 120
    },
    {
      "from": "xha_b1_gtc",
      "to": "xha_b1_restB",
      "type": "walk",
      "weight": 55
    },
    {
      "from": "xha_b1_gtc",
      "to": "xha_b1_metroL",
      "type": "walk",
      "weight": 80
    },
    {
      "from": "xha_b1_metroL",
      "to": "xha_b1_metroG",
      "type": "walk",
      "weight": 30
    },
    {
      "from": "xha_b1_metroG",
      "to": "xha_b1_escM",
      "type": "walk",
      "weight": 40
    },
    {
      "from": "xha_b1_metroG",
      "to": "xha_b1_stairM",
      "type": "walk",
      "weight": 130
    },
    {
      "from": "xha_b1_metroG",
      "to": "xha_b1_liftC",
      "type": "walk",
      "weight": 80
    },
    {
      "from": "xha_b2_escM",
      "to": "xha_b2_platA",
      "type": "walk",
      "weight": 85
    },
    {
      "from": "xha_b2_escM",
      "to": "xha_b2_pasg",
      "type": "walk",
      "weight": 75
    },
    {
      "from": "xha_b2_stairM",
      "to": "xha_b2_platB",
      "type": "walk",
      "weight": 90
    },
    {
      "from": "xha_b2_stairM",
      "to": "xha_b2_pasg",
      "type": "walk",
      "weight": 65
    },
    {
      "from": "xha_b2_pasg",
      "to": "xha_b2_platA",
      "type": "walk",
      "weight": 110
    },
    {
      "from": "xha_b2_pasg",
      "to": "xha_b2_platB",
      "type": "walk",
      "weight": 110
    },
    {
      "from": "xha_b2_liftC",
      "to": "xha_b2_pasg",
      "type": "walk",
      "weight": 90
    },
    {
      "from": "xha_p4_liftWSl",
      "to": "xha_p3_liftWSl",
      "type": "elevator",
      "weight": 30
    },
    {
      "from": "xha_p4_liftCSl",
      "to": "xha_p3_liftCSl",
      "type": "elevator",
      "weight": 30
    },
    {
      "from": "xha_p4_liftESl",
      "to": "xha_p3_liftESl",
      "type": "elevator",
      "weight": 30
    },
    {
      "from": "xha_p4_escY",
      "to": "xha_p3_escY",
      "type": "escalator",
      "weight": 40
    },
    {
      "from": "xha_p4_stairY",
      "to": "xha_p3_stairY",
      "type": "stair",
      "weight": 25
    },
    {
      "from": "xha_p4_liftW",
      "to": "xha_p2_liftW",
      "type": "elevator",
      "weight": 30
    },
    {
      "from": "xha_p2_liftW",
      "to": "xha_p1_liftW",
      "type": "elevator",
      "weight": 30
    },
    {
      "from": "xha_p1_liftW",
      "to": "xha_b1_liftW",
      "type": "elevator",
      "weight": 30
    },
    {
      "from": "xha_p4_liftC",
      "to": "xha_p2_liftC",
      "type": "elevator",
      "weight": 30
    },
    {
      "from": "xha_p2_liftC",
      "to": "xha_p1_liftC",
      "type": "elevator",
      "weight": 30
    },
    {
      "from": "xha_p1_liftC",
      "to": "xha_b1_liftC",
      "type": "elevator",
      "weight": 30
    },
    {
      "from": "xha_b1_liftC",
      "to": "xha_b2_liftC",
      "type": "elevator",
      "weight": 30
    },
    {
      "from": "xha_p4_liftE",
      "to": "xha_p2_liftE",
      "type": "elevator",
      "weight": 30
    },
    {
      "from": "xha_p2_liftE",
      "to": "xha_p1_liftE",
      "type": "elevator",
      "weight": 30
    },
    {
      "from": "xha_p1_liftE",
      "to": "xha_b1_liftE",
      "type": "elevator",
      "weight": 30
    },
    {
      "from": "xha_p2_escC",
      "to": "xha_p1_escC",
      "type": "escalator",
      "weight": 40
    },
    {
      "from": "xha_p1_escC",
      "to": "xha_b1_escC",
      "type": "escalator",
      "weight": 40
    },
    {
      "from": "xha_p2_stairC",
      "to": "xha_p1_stairC",
      "type": "stair",
      "weight": 25
    },
    {
      "from": "xha_p1_stairC",
      "to": "xha_b1_stairC",
      "type": "stair",
      "weight": 25
    },
    {
      "from": "xha_b1_escM",
      "to": "xha_b2_escM",
      "type": "escalator",
      "weight": 40
    },
    {
      "from": "xha_b1_stairM",
      "to": "xha_b2_stairM",
      "type": "stair",
      "weight": 25
    }
  ]
};

// packages/core/src/generated/tokens.ts
var APP = {
  bg: "#F4F7F9",
  card: "#FFFFFF",
  card2: "#E9F3F2",
  line: "#DFE7EB",
  text: "#172B3A",
  sub: "#657582",
  accent: "#007F7A",
  accentSoft: "#D5EEEB",
  gold: "#B86A12",
  gtext: "#86500E"
};
var MAP = {
  surface: "#F6F8F8",
  grid: "#EEF2F3",
  ink: "#172B3A",
  ink2: "#657582",
  muted: "#A6B6BF",
  corridor: "#FFFFFF",
  landWash: "#EDF2F4",
  airWash: "#E5F2F0"
};
var ROUTE = {
  color: "#007F7A",
  case: "#FFFFFF",
  trans: "#B7DBD7"
};
var HIT = "#007F7A";
var TYPE_COLOR = {
  entrance: "#007F7A",
  exit: "#007F7A",
  checkin: "#486A85",
  security: "#B86A12",
  gate: "#286DAB",
  lift: "#657582",
  escalator: "#657582",
  stair: "#657582",
  metro: "#007F7A",
  coach: "#486A85",
  parking: "#486A85",
  baggage: "#007F7A",
  toilet: "#486A85",
  hall: "#486A85",
  corridor: "#A6B6BF"
};

// packages/core/src/graph.ts
var PX_PER_METER = MAP_RAW.meta.pxPerMeter;
function edgeKey(a, b) {
  return a < b ? a + "|" + b : b + "|" + a;
}
var AirportGraph = class {
  constructor(raw) {
    __publicField(this, "raw");
    __publicField(this, "nodes", []);
    __publicField(this, "edges", []);
    __publicField(this, "nodeIndex", /* @__PURE__ */ new Map());
    /** nodeId -> (neighborId -> 原始米权) */
    __publicField(this, "adjacency", /* @__PURE__ */ new Map());
    /** 规范化节点对 -> 边类型 */
    __publicField(this, "edgeTypes", /* @__PURE__ */ new Map());
    __publicField(this, "securityId");
    __publicField(this, "floorOrder");
    __publicField(this, "floorLabels");
    /** 设计令牌（来自 ArkTS 的 Theme.ets，见 tools/export_shared.py） */
    __publicField(this, "tokens", { APP, MAP, ROUTE, HIT, TYPE_COLOR });
    this.raw = raw;
    this.floorLabels = raw.meta.floors;
    this.floorOrder = Object.keys(raw.meta.floors);
    const secs = raw.nodes.filter((n) => n.type === "security");
    if (secs.length !== 1) {
      throw new Error(`必须恰有一个安检节点，实际 ${secs.length} 个`);
    }
    this.securityId = secs[0].id;
    this.edges = raw.edges.map((e) => ({ from: e.from, to: e.to, type: e.type, weight: e.weight }));
    for (const e of this.edges) {
      let m0 = this.adjacency.get(e.from);
      if (m0 === void 0) {
        m0 = /* @__PURE__ */ new Map();
        this.adjacency.set(e.from, m0);
      }
      let m1 = this.adjacency.get(e.to);
      if (m1 === void 0) {
        m1 = /* @__PURE__ */ new Map();
        this.adjacency.set(e.to, m1);
      }
      if (m0.has(e.to) && m0.get(e.to) !== e.weight) {
        throw new Error(`平行边权重冲突：${e.from} -> ${e.to}`);
      }
      m0.set(e.to, e.weight);
      m1.set(e.from, e.weight);
      const k = edgeKey(e.from, e.to);
      const prev = this.edgeTypes.get(k);
      if (prev !== void 0 && prev !== e.type) {
        throw new Error(`同一对节点存在不同类型的边：${e.from} <-> ${e.to}（${prev} / ${e.type}）`);
      }
      this.edgeTypes.set(k, e.type);
    }
    const sides = this.computeSides();
    for (const n of raw.nodes) {
      const node = {
        id: n.id,
        name: n.name,
        type: n.type,
        floor: n.floor,
        x: n.x,
        y: n.y,
        side: sides.get(n.id)
      };
      this.nodes.push(node);
      this.nodeIndex.set(node.id, node);
    }
  }
  /** 与 gen_model.py 相同的陆/空侧判定 */
  computeSides() {
    const anchor = this.raw.nodes.find((n) => n.type === "entrance");
    if (anchor === void 0) {
      throw new Error("数据里没有 entrance 节点，无法判定陆侧");
    }
    const seen = /* @__PURE__ */ new Set([anchor.id]);
    const stack = [anchor.id];
    while (stack.length > 0) {
      const u = stack.pop();
      const nbrs = this.adjacency.get(u);
      if (nbrs === void 0) {
        continue;
      }
      nbrs.forEach((_w, v) => {
        if (v === this.securityId || seen.has(v)) {
          return;
        }
        seen.add(v);
        stack.push(v);
      });
    }
    const sides = /* @__PURE__ */ new Map();
    let air = 0;
    let land = 0;
    for (const n of this.raw.nodes) {
      let side;
      if (n.id === this.securityId) {
        side = "gate";
      } else if (seen.has(n.id)) {
        side = "land";
        land += 1;
      } else {
        side = "air";
        air += 1;
      }
      sides.set(n.id, side);
    }
    if (air === 0) {
      throw new Error("空侧为空，陆/空侧判定失效");
    }
    return sides;
  }
  node(id) {
    return this.nodeIndex.get(id);
  }
  /** 与 ArkTS 端 node() 一致：未命中直接抛错，避免静默算出错误路线 */
  requireNode(id) {
    const n = this.nodeIndex.get(id);
    if (n === void 0) {
      throw new Error("unknown node: " + id);
    }
    return n;
  }
  neighbors(id) {
    return this.adjacency.get(id);
  }
  edgeType(a, b) {
    const t2 = this.edgeTypes.get(edgeKey(a, b));
    return t2 === void 0 ? "walk" : t2;
  }
  /** 原始米权（不含偏好），与 ArkTS 端 adjTable().get(u).get(v) 等价 */
  rawWeight(a, b) {
    var _a;
    return (_a = this.adjacency.get(a)) == null ? void 0 : _a.get(b);
  }
  /** 指定类型的原始米权，非该类型返回 undefined */
  rawWeightOfType(a, b, type) {
    if (this.edgeType(a, b) !== type) {
      return void 0;
    }
    return this.rawWeight(a, b);
  }
  floorNodes(floor) {
    return this.nodes.filter((n) => n.floor === floor);
  }
  /** [minX, minY, maxX, maxY]，与 gen_model.py 的 FLOOR_BBOX 一致 */
  floorBBox(floor) {
    const list = this.floorNodes(floor);
    if (list.length === 0) {
      return [0, 0, 1, 1];
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const n of list) {
      if (n.x < minX) {
        minX = n.x;
      }
      if (n.y < minY) {
        minY = n.y;
      }
      if (n.x > maxX) {
        maxX = n.x;
      }
      if (n.y > maxY) {
        maxY = n.y;
      }
    }
    return [minX, minY, maxX, maxY];
  }
  /** 全图包围盒（用于总览） */
  allBBox() {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const n of this.nodes) {
      if (n.x < minX) {
        minX = n.x;
      }
      if (n.y < minY) {
        minY = n.y;
      }
      if (n.x > maxX) {
        maxX = n.x;
      }
      if (n.y > maxY) {
        maxY = n.y;
      }
    }
    return [minX, minY, maxX, maxY];
  }
  sideCount() {
    let land = 0;
    let air = 0;
    let gate = 0;
    for (const n of this.nodes) {
      if (n.side === "land") {
        land += 1;
      } else if (n.side === "air") {
        air += 1;
      } else {
        gate += 1;
      }
    }
    return { land, air, gate };
  }
  floorCounts() {
    var _a;
    const out = {};
    for (const n of this.nodes) {
      out[n.floor] = ((_a = out[n.floor]) != null ? _a : 0) + 1;
    }
    return out;
  }
};
var AIRPORT = new AirportGraph(MAP_RAW);

// packages/core/src/pathfinder.ts
var PREF_SHORTEST = 0;
var PREF_ELEVATOR = 1;
var PREF_ESCALATOR = 2;
var PREF_AVOID_STAIR = 3;
var PREFERENCE_COUNT = 4;
var VERTICAL_WEIGHT = /* @__PURE__ */ new Map([
  ["elevator", 30],
  ["escalator", 40],
  ["stair", 25],
  ["apm", 350]
]);
var PREF_MULT = [
  /* @__PURE__ */ new Map([["elevator", 1], ["escalator", 1], ["stair", 1], ["apm", 1]]),
  /* @__PURE__ */ new Map([["elevator", 0.7], ["escalator", 1.6], ["stair", 3.2], ["apm", 1]]),
  /* @__PURE__ */ new Map([["elevator", 1.3], ["escalator", 0.8], ["stair", 2.2], ["apm", 1]]),
  /* @__PURE__ */ new Map([["elevator", 1], ["escalator", 1.4], ["stair", 6], ["apm", 1]])
];
function preferenceKey(pref) {
  if (pref === PREF_ELEVATOR) {
    return "pref_elevator";
  }
  if (pref === PREF_ESCALATOR) {
    return "pref_escalator";
  }
  if (pref === PREF_AVOID_STAIR) {
    return "pref_avoid_stair";
  }
  return "pref_shortest";
}
function effectiveWeight(graph, u, v, raw, pref) {
  var _a;
  const type = graph.edgeType(u, v);
  if (type === "walk") {
    return raw;
  }
  const base = VERTICAL_WEIGHT.get(type);
  const mult = (_a = PREF_MULT[pref]) == null ? void 0 : _a.get(type);
  const b = base === void 0 ? 25 : base;
  const m = mult === void 0 ? 1 : mult;
  return Math.round(b * m);
}
function dijkstra(graph, pref, src, dst) {
  const dist = /* @__PURE__ */ new Map();
  const prev = /* @__PURE__ */ new Map();
  const visited = /* @__PURE__ */ new Set();
  dist.set(src, 0);
  for (; ; ) {
    let u = null;
    let best = Infinity;
    dist.forEach((d, k) => {
      if (!visited.has(k) && d < best) {
        best = d;
        u = k;
      }
    });
    if (u === null) {
      break;
    }
    if (u === dst) {
      break;
    }
    const cur2 = u;
    visited.add(cur2);
    const nbrs = graph.neighbors(cur2);
    if (nbrs === void 0) {
      continue;
    }
    nbrs.forEach((raw, v) => {
      if (visited.has(v)) {
        return;
      }
      const du = dist.get(cur2);
      if (du === void 0) {
        return;
      }
      const nd = du + effectiveWeight(graph, cur2, v, raw, pref);
      const old = dist.get(v);
      if (old === void 0 || nd < old) {
        dist.set(v, nd);
        prev.set(v, cur2);
      }
    });
  }
  const path = [];
  let cur = dst;
  while (cur !== src) {
    path.push(cur);
    const p = prev.get(cur);
    if (p === void 0) {
      return [];
    }
    cur = p;
  }
  path.push(src);
  path.reverse();
  return path;
}
function planRoute(graph, startId, endId, pref) {
  const sec = graph.securityId;
  let seq;
  let viaSec = false;
  if (startId === sec || endId === sec) {
    seq = dijkstra(graph, pref, startId, endId);
  } else {
    const s = graph.requireNode(startId);
    const e = graph.requireNode(endId);
    if (s.side === e.side) {
      seq = dijkstra(graph, pref, startId, endId);
    } else {
      viaSec = true;
      const p1 = dijkstra(graph, pref, startId, sec);
      const p2 = dijkstra(graph, pref, sec, endId);
      if (p1.length === 0 || p2.length === 0) {
        return emptyRoute();
      }
      seq = p1.concat(p2.slice(1));
    }
  }
  if (seq.length === 0) {
    return emptyRoute();
  }
  const legs = [];
  const transitions = [];
  let total = 0;
  let curFloor = graph.requireNode(seq[0]).floor;
  let ids = [seq[0]];
  let legMeters = 0;
  for (let i = 1; i < seq.length; i++) {
    const u = seq[i - 1];
    const v = seq[i];
    const raw = graph.rawWeight(u, v);
    const m = raw === void 0 ? 0 : raw;
    total += m;
    if (graph.requireNode(v).floor !== curFloor) {
      legs.push({ floor: curFloor, nodeIds: ids, meters: legMeters });
      transitions.push({
        fromId: u,
        toId: v,
        viaType: graph.edgeType(u, v),
        viaName: graph.requireNode(u).name,
        fromFloor: curFloor,
        toFloor: graph.requireNode(v).floor,
        meters: m
      });
      curFloor = graph.requireNode(v).floor;
      ids = [v];
      legMeters = 0;
    } else {
      legMeters += m;
      ids.push(v);
    }
  }
  if (ids.length > 0) {
    legs.push({ floor: curFloor, nodeIds: ids, meters: legMeters });
  }
  const merged = mergeTransitLegs(legs, transitions);
  return {
    nodeIds: seq,
    totalMeters: total,
    legs: merged.legs,
    transitions: merged.transitions,
    viaSecurity: viaSec
  };
}
function mergeTransitLegs(legs, trans) {
  const outL = [];
  const outT = [];
  let i = 0;
  while (i < legs.length) {
    outL.push(legs[i]);
    if (i === legs.length - 1) {
      break;
    }
    let t2 = trans[i];
    let j = i + 1;
    while (j < legs.length - 1 && legs[j].nodeIds.length === 1) {
      const t22 = trans[j];
      t2 = {
        fromId: t2.fromId,
        toId: t22.toId,
        viaType: t2.viaType,
        viaName: t2.viaName,
        fromFloor: t2.fromFloor,
        toFloor: t22.toFloor,
        meters: t2.meters + t22.meters
      };
      j += 1;
    }
    outT.push(t2);
    i = j;
  }
  return { legs: outL, transitions: outT };
}
var QUICK_STARTS = [
  "xha_p4_doorW",
  "xha_p4_doorN",
  "xha_p4_doorE",
  "xha_p2_exitN",
  "xha_b2_platA",
  "xha_b2_platB",
  "xha_p1_taxi",
  "xha_b1_gtc"
];
function routeMeters(graph, nodeIds) {
  var _a;
  let total = 0;
  for (let i = 1; i < nodeIds.length; i++) {
    total += (_a = graph.rawWeight(nodeIds[i - 1], nodeIds[i])) != null ? _a : 0;
  }
  return total;
}

// packages/core/src/generated/i18n-data.ts
var TEXTS = [
  { key: "brand", zh: "星海机场", en: "Xinghai Airport" },
  { key: "home_title", zh: "你想去哪里？", en: "Where would you like to go?" },
  { key: "home_sub", zh: "主航站楼 · 六层导览", en: "Main terminal · Six floors" },
  { key: "search", zh: "搜索登机口、设施或地点", en: "Search gates, facilities or places" },
  { key: "search_hint", zh: "试试 A101、洗手间或地铁", en: "Try A101, restroom or metro" },
  { key: "go_gate", zh: "去登机口", en: "Find a gate" },
  { key: "go_metro", zh: "坐地铁", en: "Take the metro" },
  { key: "go_service", zh: "找设施", en: "Find facilities" },
  { key: "popular", zh: "常用目的地", en: "Popular destinations" },
  { key: "recent", zh: "最近查找", en: "Recent places" },
  { key: "floors", zh: "查看楼层地图", en: "Explore floor maps" },
  { key: "view_map", zh: "在地图上选择位置", en: "Choose on the map" },
  { key: "home_tip", zh: "先选目的地，再选你现在的位置", en: "Choose a destination, then your starting point" },
  { key: "sample", zh: "星海机场示例导览 · 位置由你手动选择", en: "Xinghai airport example · Select your location manually" },
  { key: "target_title", zh: "选择目的地", en: "Destination" },
  { key: "target_heading", zh: "你想去哪里？", en: "Choose your destination" },
  { key: "target_hint", zh: "选好地点后，下一步选择出发位置", en: "Next, choose where you are starting from" },
  { key: "start_title", zh: "出发位置", en: "Starting point" },
  { key: "start_heading", zh: "你现在在哪里？", en: "Where are you now?" },
  { key: "start_hint", zh: "请选择你所在的地点，或在地图上点选", en: "Choose your location from the list or map" },
  { key: "step_one", zh: "第 1 步 · 目的地", en: "Step 1 · Destination" },
  { key: "step_two", zh: "第 2 步 · 出发位置", en: "Step 2 · Starting point" },
  { key: "next_start", zh: "选择出发位置", en: "Choose starting point" },
  { key: "view_route", zh: "从这里出发，查看路线", en: "View route from here" },
  { key: "apply", zh: "更新路线", en: "Update route" },
  { key: "selected_target", zh: "前往", en: "Going to" },
  { key: "selected_start", zh: "从这里出发", en: "Starting from" },
  { key: "choose_target", zh: "请选择目的地", en: "Choose a destination" },
  { key: "choose_start", zh: "请选择出发位置", en: "Choose a starting point" },
  { key: "no_results", zh: "没有找到这个地点", en: "No matching places" },
  { key: "no_results_hint", zh: "试试登机口编号，或换一个分类", en: "Try a gate number or another category" },
  { key: "clear", zh: "清除搜索", en: "Clear search" },
  { key: "all", zh: "全部", en: "All" },
  { key: "quick_starts", zh: "常见出发位置", en: "Common starting points" },
  { key: "results", zh: "地点", en: "Places" },
  { key: "cancel", zh: "取消", en: "Cancel" },
  { key: "back", zh: "返回", en: "Back" },
  { key: "metro_title", zh: "坐地铁", en: "Metro" },
  { key: "metro_heading", zh: "你准备去哪个方向？", en: "Which direction are you going?" },
  { key: "metro_hint", zh: "选好方向后，再选择你现在的位置", en: "Choose a direction, then your starting point" },
  { key: "city", zh: "往市区", en: "To the city" },
  { key: "resort", zh: "往星湖度假区", en: "To Xinghu Resort" },
  { key: "city_sub", zh: "市区方向 · B2 站台", en: "City-bound · Platform B2" },
  { key: "resort_sub", zh: "星湖方向 · B2 站台", en: "Resort-bound · Platform B2" },
  { key: "metro_steps", zh: "到站台的三个环节", en: "Three steps to the platform" },
  { key: "metro_gate", zh: "到 B1 地铁闸机", en: "Reach the B1 metro gates" },
  { key: "metro_down", zh: "乘扶梯或楼梯到 B2", en: "Take an escalator or stairs to B2" },
  { key: "metro_wait", zh: "到所选方向站台候车", en: "Wait at your chosen platform" },
  { key: "browse_title", zh: "楼层地图", en: "Floor maps" },
  { key: "browse_heading", zh: "点选地点，查看详情", en: "Tap a place for details" },
  { key: "browse_hint", zh: "拖动或缩放地图，点击设施标记", en: "Drag or zoom, then tap a facility" },
  { key: "pick_start", zh: "我在这里", en: "I am here" },
  { key: "pick_dest", zh: "去这里", en: "Go here" },
  { key: "start_set", zh: "已选择出发位置", en: "Starting point selected" },
  { key: "choose_next", zh: "接下来选择目的地", en: "Now choose a destination" },
  { key: "full_floor", zh: "查看全层", en: "Fit floor" },
  { key: "fit_route", zh: "查看路线", en: "Fit route" },
  { key: "zoom_in", zh: "放大地图", en: "Zoom in" },
  { key: "zoom_out", zh: "缩小地图", en: "Zoom out" },
  { key: "legend", zh: "设施 · 点选查看", en: "Facilities · Tap for details" },
  { key: "route_title", zh: "路线指引", en: "Route guide" },
  { key: "route_preview", zh: "路线预览", en: "Route preview" },
  { key: "route_guiding", zh: "正在指引", en: "Route guidance" },
  { key: "route_complete", zh: "本次指引已完成", en: "Guidance completed" },
  { key: "route_complete_hint", zh: "感谢使用，祝你一路顺利", en: "Have a pleasant journey" },
  { key: "walking", zh: "步行约", en: "Walking" },
  { key: "meters", zh: "米", en: "m" },
  { key: "transfers", zh: "次换层", en: "floor changes" },
  { key: "via_security", zh: "这条路线需要通过中央安检", en: "This route passes through central security" },
  { key: "same_side", zh: "这条路线无需经过中央安检", en: "No central security on this route" },
  { key: "manual", zh: "按照指引行走，到达后手动确认", en: "Follow the route and confirm each step manually" },
  { key: "begin", zh: "开始指引", en: "Start guidance" },
  { key: "arrived_here", zh: "已到达此处", en: "I am here" },
  { key: "passed_security", zh: "已通过安检", en: "I passed security" },
  { key: "arrived_floor", zh: "已到达下一层", en: "I reached the next floor" },
  { key: "finish", zh: "确认到达目的地", en: "Confirm arrival" },
  { key: "previous", zh: "上一步", en: "Previous step" },
  { key: "all_steps", zh: "查看全程步骤", en: "All route steps" },
  { key: "edit_from", zh: "修改出发位置", en: "Edit starting point" },
  { key: "edit_to", zh: "修改目的地", en: "Edit destination" },
  { key: "swap", zh: "交换起终点", en: "Reverse route" },
  { key: "new_journey", zh: "规划新的路线", en: "Plan another route" },
  { key: "route_options", zh: "路线偏好", en: "Route preference" },
  { key: "pref_shortest", zh: "推荐路线", en: "Recommended" },
  { key: "pref_elevator", zh: "优先电梯", en: "Prefer elevator" },
  { key: "pref_escalator", zh: "优先扶梯", en: "Prefer escalator" },
  { key: "pref_avoid_stair", zh: "尽量少走楼梯", en: "Minimize stairs" },
  { key: "walk_to", zh: "沿通道前往", en: "Walk along the corridor to" },
  { key: "pass_security", zh: "通过中央安检", en: "Pass central security" },
  { key: "take", zh: "乘", en: "Take" },
  { key: "elevator", zh: "电梯", en: "elevator" },
  { key: "escalator", zh: "扶梯", en: "escalator" },
  { key: "stair", zh: "楼梯", en: "stairs" },
  { key: "to_floor", zh: "前往", en: "to" },
  { key: "destination_step", zh: "到达目的地后确认完成", en: "Confirm when you reach your destination" },
  { key: "from", zh: "从", en: "From" },
  { key: "to", zh: "到", en: "To" },
  { key: "step", zh: "步骤", en: "Step" },
  { key: "next_step", zh: "下一步", en: "Next" },
  { key: "missing", zh: "请先选择起点和目的地", en: "Choose both starting point and destination" },
  { key: "invalid", zh: "这个地点已不可用", en: "This place is no longer available" },
  { key: "same", zh: "起点和目的地相同", en: "Starting point and destination are the same" },
  { key: "unreachable", zh: "暂无可达路线", en: "No route is available" },
  { key: "error_hint", zh: "重新选择地点即可继续规划", en: "Choose another place to continue" },
  { key: "choose_again", zh: "重新选择地点", en: "Choose places again" },
  { key: "security", zh: "安检", en: "Security" },
  { key: "start_marker", zh: "起", en: "S" },
  { key: "end_marker", zh: "终", en: "D" },
  { key: "start_label", zh: "起点", en: "Start" },
  { key: "end_label", zh: "终点", en: "Destination" },
  { key: "browse_other", zh: "正在查看其他路段", en: "Viewing another route segment" },
  { key: "return_current", zh: "回到当前步骤", en: "Return to current step" }
];

// packages/core/src/generated/labels.ts
var TYPE_ZH = {
  "entrance": "出发门",
  "exit": "到达出口",
  "checkin": "值机/自助",
  "security": "安检",
  "gate": "登机口",
  "lift": "电梯",
  "escalator": "扶梯",
  "stair": "楼梯",
  "metro": "地铁",
  "coach": "大巴/出租",
  "parking": "停车",
  "baggage": "行李提取",
  "toilet": "洗手间",
  "hall": "大厅/商业",
  "corridor": "通道/中转"
};
var TYPE_EN = {
  "entrance": "Departure Gate",
  "exit": "Arrival Exit",
  "checkin": "Check-in",
  "security": "Security",
  "gate": "Gate",
  "lift": "Elevator",
  "escalator": "Escalator",
  "stair": "Stairs",
  "metro": "Metro",
  "coach": "Coach/Taxi",
  "parking": "Parking",
  "baggage": "Baggage",
  "toilet": "Restroom",
  "hall": "Hall/Shopping",
  "corridor": "Walkway"
};
var FLOOR_LABELS = {
  "4F": "出发层",
  "3F": "空侧候机夹层",
  "2F": "到达层",
  "1F": "地面迎客层",
  "B1": "交通中心",
  "B2": "地铁站台"
};
var FLOOR_LABELS_EN = {
  "4F": "Departures",
  "3F": "Airside Mezzanine",
  "2F": "Arrivals",
  "1F": "Ground Welcome",
  "B1": "Transport Center",
  "B2": "Metro Platform"
};
var NODE_EN = {
  "xha_p4_doorW": "West Departure Gate",
  "xha_p4_doorN": "North Departure Gate",
  "xha_p4_doorE": "East Departure Gate",
  "xha_p4_ckA": "Check-in A (Int'l)",
  "xha_p4_ckB": "Check-in B (Domestic)",
  "xha_p4_ckC": "Check-in C (Domestic)",
  "xha_p4_ckD": "Self Check-in D",
  "xha_p4_preSec": "Pre-security Hall",
  "xha_p4_sec": "Central Security (Sole)",
  "xha_p4_airMall": "Airside Duty-free",
  "xha_p4_rest": "Restrooms (Dep.)",
  "xha_p4_liftW": "West Elevator",
  "xha_p4_liftC": "Atrium Elevator",
  "xha_p4_liftE": "East Elevator",
  "xha_p4_liftWSl": "Airside West Elevator",
  "xha_p4_liftCSl": "Airside Atrium Elevator",
  "xha_p4_liftESl": "Airside East Elevator",
  "xha_p4_escY": "Airside Escalators",
  "xha_p4_stairY": "Airside Stairs",
  "xha_p4_a0": "Pier A · North",
  "xha_p4_a1": "Pier A · Mid",
  "xha_p4_a2": "Pier A · Mid-late",
  "xha_p4_a3": "Pier A · South",
  "xha_p4_b0": "Pier B · North",
  "xha_p4_b1": "Pier B · Mid",
  "xha_p4_b2": "Pier B · Mid-late",
  "xha_p4_b3": "Pier B · South",
  "xha_p4_c0": "Pier C · North",
  "xha_p4_c1": "Pier C · Mid",
  "xha_p4_c2": "Pier C · Mid-late",
  "xha_p4_c3": "Pier C · South",
  "xha_p4_gA101": "Gate A101",
  "xha_p4_gA102": "Gate A102",
  "xha_p4_gA103": "Gate A103",
  "xha_p4_gA104": "Gate A104",
  "xha_p4_gA105": "Gate A105",
  "xha_p4_gA106": "Gate A106",
  "xha_p4_gA107": "Gate A107",
  "xha_p4_gA108": "Gate A108",
  "xha_p4_gB201": "Gate B201",
  "xha_p4_gB202": "Gate B202",
  "xha_p4_gB203": "Gate B203",
  "xha_p4_gB204": "Gate B204",
  "xha_p4_gB205": "Gate B205",
  "xha_p4_gB206": "Gate B206",
  "xha_p4_gB207": "Gate B207",
  "xha_p4_gB208": "Gate B208",
  "xha_p4_gC301": "Gate C301",
  "xha_p4_gC302": "Gate C302",
  "xha_p4_gC303": "Gate C303",
  "xha_p4_gC304": "Gate C304",
  "xha_p4_gC305": "Gate C305",
  "xha_p4_gC306": "Gate C306",
  "xha_p4_gC307": "Gate C307",
  "xha_p4_gC308": "Gate C308",
  "xha_p3_mezz": "Mezzanine Hall",
  "xha_p3_food": "Airside Food Court",
  "xha_p3_deck": "Observation Deck",
  "xha_p3_loungeA": "Lounge A",
  "xha_p3_loungeB": "Lounge B",
  "xha_p3_kids": "Kids Play Area",
  "xha_p3_rest3": "Restrooms",
  "xha_p3_liftWSl": "Airside West Elevator",
  "xha_p3_liftCSl": "Airside Atrium Elevator",
  "xha_p3_liftESl": "Airside East Elevator",
  "xha_p3_escY": "Airside Escalators",
  "xha_p3_stairY": "Airside Stairs",
  "xha_p2_aw0": "West Arrivals · North",
  "xha_p2_aw1": "West Arrivals · Mid",
  "xha_p2_aw2": "West Arrivals · South",
  "xha_p2_ac0": "Central Arrivals · North",
  "xha_p2_ac1": "Central Arrivals · Mid",
  "xha_p2_ac2": "Central Arrivals · South",
  "xha_p2_ae0": "East Arrivals · North",
  "xha_p2_ae1": "East Arrivals · Mid",
  "xha_p2_ae2": "East Arrivals · South",
  "xha_p2_bagA": "Baggage Claim A",
  "xha_p2_bagB": "Baggage Claim B",
  "xha_p2_arrHall": "Central Arrivals Hall",
  "xha_p2_exitN": "Main Arrival Exit",
  "xha_p2_exitW": "West Arrival Exit",
  "xha_p2_exitE": "East Arrival Exit",
  "xha_p2_rest2": "Restrooms (Arr.)",
  "xha_p2_liftW": "West Elevator",
  "xha_p2_liftC": "Atrium Elevator",
  "xha_p2_liftE": "East Elevator",
  "xha_p2_escC": "Central Escalators",
  "xha_p2_stairC": "Atrium Stairs",
  "xha_p1_lobby": "Welcome & Arrivals Lobby",
  "xha_p1_taxi": "Taxi & Ride-hailing Pickup",
  "xha_p1_bus": "Shuttle Stop",
  "xha_p1_luggage": "Luggage Storage",
  "xha_p1_linkG": "Terminal Link Bridge",
  "xha_p1_rest1": "Restrooms",
  "xha_p1_liftW": "West Elevator",
  "xha_p1_liftC": "Atrium Elevator",
  "xha_p1_liftE": "East Elevator",
  "xha_p1_escC": "Central Escalators",
  "xha_p1_stairC": "Atrium Stairs",
  "xha_b1_gtc": "Transport Center Hall",
  "xha_b1_metroL": "Metro Concourse (Unpaid)",
  "xha_b1_metroG": "Metro Gates",
  "xha_b1_coachC": "Coach & Long-distance",
  "xha_b1_taxiH": "Taxi & Ride-hailing Wait",
  "xha_b1_park": "P1 Car Park",
  "xha_b1_restB": "Restrooms",
  "xha_b1_liftW": "West Elevator",
  "xha_b1_liftC": "Atrium Elevator",
  "xha_b1_liftE": "East Elevator",
  "xha_b1_escC": "Central Escalators",
  "xha_b1_escM": "Metro Escalator",
  "xha_b1_stairC": "Atrium Stairs",
  "xha_b1_stairM": "Metro Stairs",
  "xha_b2_escM": "Metro Escalator",
  "xha_b2_stairM": "Metro Stairs",
  "xha_b2_pasg": "Platform Passage",
  "xha_b2_platA": "Platform · City Center",
  "xha_b2_platB": "Platform · Xinghu Resort",
  "xha_b2_liftC": "Atrium Elevator"
};

// packages/core/src/i18n.ts
var ZH = /* @__PURE__ */ new Map();
var EN = /* @__PURE__ */ new Map();
for (const t2 of TEXTS) {
  ZH.set(t2.key, t2.zh);
  EN.set(t2.key, t2.en);
}
var LOC_KEYS = TEXTS.map((t2) => t2.key);
function t(key, en) {
  const text = (en ? EN : ZH).get(key);
  return text === void 0 ? key : text;
}
function hasKey(key) {
  return ZH.has(key);
}
function floorLabel(floor, en) {
  const text = (en ? FLOOR_LABELS_EN : FLOOR_LABELS)[floor];
  return text === void 0 ? floor : text;
}
function floorShort(floor) {
  return floor;
}
function typeLabel(type, en) {
  const m = en ? TYPE_EN : TYPE_ZH;
  const v = m[type];
  return v === void 0 ? type : v;
}
function nodeName(n, en) {
  if (n.type === "security") {
    return en ? "Central Security" : "中央安检大厅";
  }
  if (en) {
    const e = NODE_EN[n.id];
    return e === void 0 ? n.name : e;
  }
  return n.name;
}
function nodeNameEn(id, fallback) {
  const e = NODE_EN[id];
  return e === void 0 ? fallback : e;
}
function floorOrder() {
  return Object.keys(FLOOR_LABELS);
}
function facilityLabel(viaType, en) {
  if (viaType === "elevator") {
    return t("elevator", en);
  }
  if (viaType === "escalator") {
    return t("escalator", en);
  }
  if (viaType === "stair") {
    return t("stair", en);
  }
  return viaType;
}
var I18N_KEYS = { ZH, EN };

// packages/core/src/categories.ts
var CATEGORIES = [
  { key: "all", nameZh: "全部", nameEn: "All", symbol: "⌘" },
  { key: "gate", nameZh: "登机口", nameEn: "Gates", symbol: "✈" },
  { key: "checkin", nameZh: "值机·安检", nameEn: "Check-in", symbol: "✓" },
  { key: "door", nameZh: "出入口", nameEn: "Doors", symbol: "⇄" },
  { key: "baggage", nameZh: "行李", nameEn: "Baggage", symbol: "◫" },
  { key: "metro", nameZh: "地铁", nameEn: "Metro", symbol: "◆" },
  { key: "transport", nameZh: "接驳交通", nameEn: "Pickups", symbol: "▣" },
  { key: "parking", nameZh: "停车·地面", nameEn: "Parking", symbol: "▤" },
  { key: "service", nameZh: "商业·服务", nameEn: "Services", symbol: "☕" },
  { key: "vertical", nameZh: "换层设施", nameEn: "Verticals", symbol: "⇕" }
];
var TYPE_CAT = /* @__PURE__ */ new Map([
  ["gate", "gate"],
  ["checkin", "checkin"],
  ["security", "checkin"],
  ["entrance", "door"],
  ["exit", "door"],
  ["baggage", "baggage"],
  ["metro", "metro"],
  ["coach", "transport"],
  ["parking", "parking"],
  ["toilet", "service"],
  ["hall", "service"],
  ["corridor", "service"],
  ["lift", "vertical"],
  ["escalator", "vertical"],
  ["stair", "vertical"]
]);
var ID_CAT = /* @__PURE__ */ new Map([
  ["xha_p1_luggage", "baggage"],
  ["xha_b1_metroL", "metro"],
  ["xha_b1_metroG", "metro"],
  ["xha_b2_pasg", "metro"],
  ["xha_p1_linkG", "parking"],
  ["xha_b1_gtc", "transport"],
  ["xha_p1_bus", "transport"]
]);
function catOf(n) {
  const byId = ID_CAT.get(n.id);
  if (byId !== void 0) {
    return byId;
  }
  const byType = TYPE_CAT.get(n.type);
  return byType === void 0 ? "service" : byType;
}
function catName(key, en) {
  for (const c of CATEGORIES) {
    if (c.key === key) {
      return en ? c.nameEn : c.nameZh;
    }
  }
  return key;
}
function catSymbol(key) {
  for (const c of CATEGORIES) {
    if (c.key === key) {
      return c.symbol;
    }
  }
  return "•";
}
var HOT_DESTINATIONS = [
  "xha_p4_doorW",
  "xha_p4_doorN",
  "xha_p4_doorE",
  "xha_p4_sec",
  "xha_p4_airMall",
  "xha_p3_food",
  "xha_p3_loungeA",
  "xha_p4_gA101",
  "xha_p4_gC308",
  "xha_b2_platA",
  "xha_b2_platB",
  "xha_p2_bagA",
  "xha_p1_taxi",
  "xha_b1_gtc"
];

// packages/core/src/places.ts
var PUBLIC_CORRIDORS = [
  "xha_p4_preSec",
  "xha_p3_deck",
  "xha_p3_kids",
  "xha_p1_luggage",
  "xha_p1_linkG",
  "xha_b1_metroG",
  "xha_b2_pasg"
];
function place(graph, id) {
  return graph.node(id);
}
function placeName(graph, id, en) {
  const n = place(graph, id);
  return n === void 0 ? "" : nodeName(n, en);
}
function publicPlace(n) {
  return n.type !== "corridor" || PUBLIC_CORRIDORS.indexOf(n.id) >= 0;
}
function gateCode(n) {
  return n.type === "gate" ? n.name.replace("登机口", "").toLowerCase() : "";
}
function searchPlaces(graph, query, category = "all") {
  const q = query.trim().toLowerCase();
  const out = [];
  for (const n of graph.nodes) {
    if (!publicPlace(n) || category !== "all" && catOf(n) !== category) {
      continue;
    }
    if (q.length === 0 || n.name.toLowerCase().indexOf(q) >= 0 || nodeName(n, true).toLowerCase().indexOf(q) >= 0 || n.type === "gate" && gateCode(n).indexOf(q) >= 0) {
      out.push(n);
    }
  }
  out.sort((a, b) => {
    const exactA = q.length > 0 && gateCode(a) === q ? 0 : 1;
    const exactB = q.length > 0 && gateCode(b) === q ? 0 : 1;
    return exactA - exactB;
  });
  return out;
}
function recentPlaces(graph, ids, id) {
  const out = [];
  if (place(graph, id) !== void 0) {
    out.push(id);
  }
  for (let i = 0; i < ids.length && out.length < 6; i++) {
    if (ids[i] !== id && out.indexOf(ids[i]) < 0 && place(graph, ids[i]) !== void 0) {
      out.push(ids[i]);
    }
  }
  return out;
}
function listedPlaces(graph, category = "all") {
  return graph.nodes.filter((n) => publicPlace(n) && (category === "all" || catOf(n) === category));
}

// packages/core/src/route-steps.ts
function edgeMeters(graph, a, b) {
  var _a;
  return (_a = graph.rawWeightOfType(a, b, "walk")) != null ? _a : 0;
}
function buildRouteView(graph, startId, endId, pref) {
  const result = {
    status: "ready",
    route: emptyRoute(),
    steps: [],
    walkingMeters: 0
  };
  if (startId === "" || endId === "") {
    result.status = "missing";
    return result;
  }
  if (place(graph, startId) === void 0 || place(graph, endId) === void 0) {
    result.status = "invalid";
    return result;
  }
  if (startId === endId) {
    result.status = "same";
    return result;
  }
  result.route = planRoute(graph, startId, endId, pref);
  if (result.route.nodeIds.length === 0) {
    result.status = "unreachable";
    return result;
  }
  const secId = graph.securityId;
  for (let li = 0; li < result.route.legs.length; li++) {
    const leg = result.route.legs[li];
    let from = leg.nodeIds[0];
    let meters2 = 0;
    for (let i = 1; i < leg.nodeIds.length; i++) {
      meters2 += edgeMeters(graph, leg.nodeIds[i - 1], leg.nodeIds[i]);
      if (leg.nodeIds[i] === secId || i === leg.nodeIds.length - 1) {
        const step = {
          kind: "walk",
          fromId: from,
          toId: leg.nodeIds[i],
          floor: leg.floor,
          toFloor: leg.floor,
          legIndex: li,
          meters: meters2,
          facility: ""
        };
        result.steps.push(step);
        result.walkingMeters += meters2;
        from = leg.nodeIds[i];
        meters2 = 0;
        if (from === secId && from !== endId) {
          const sec = {
            kind: "security",
            fromId: from,
            toId: from,
            floor: leg.floor,
            toFloor: leg.floor,
            legIndex: li,
            meters: 0,
            facility: "security"
          };
          result.steps.push(sec);
        }
      }
    }
    if (li < result.route.transitions.length) {
      const tr = result.route.transitions[li];
      const step = {
        kind: "transfer",
        fromId: tr.fromId,
        toId: tr.toId,
        floor: tr.fromFloor,
        toFloor: tr.toFloor,
        legIndex: li,
        meters: 0,
        facility: tr.viaType
      };
      result.steps.push(step);
    }
  }
  const end = place(graph, endId);
  const final = {
    kind: "destination",
    fromId: endId,
    toId: endId,
    floor: end === void 0 ? "" : end.floor,
    toFloor: end === void 0 ? "" : end.floor,
    legIndex: result.route.legs.length - 1,
    meters: 0,
    facility: ""
  };
  result.steps.push(final);
  return result;
}
function stepActionKey(step, isLast) {
  if (step.kind === "security") {
    return "passed_security";
  }
  if (step.kind === "transfer") {
    return "arrived_floor";
  }
  if (step.kind === "destination" || isLast) {
    return "finish";
  }
  return "arrived_here";
}
function stepKindOf(step) {
  return step.kind;
}

// packages/core/src/planner.ts
function newPlanner() {
  return {
    startId: "",
    endId: "",
    draftStart: "",
    draftEnd: "",
    preference: 0,
    stage: "editing",
    stepIndex: 0,
    category: "all",
    query: "",
    browseFloor: "4F",
    mapMode: "browse",
    editing: "new",
    revision: 0
  };
}
function copyPlanner(s) {
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
    revision: s.revision + 1
  };
}
function newJourney(s, endId = "", category = "all") {
  const n = newPlanner();
  n.draftEnd = endId;
  n.category = category;
  n.revision = s.revision + 1;
  return n;
}
function beginEdit(s, field) {
  const n = copyPlanner(s);
  n.draftStart = s.startId;
  n.draftEnd = s.endId;
  n.editing = field;
  n.category = "all";
  n.query = "";
  return n;
}
function choosePlace(s, id, start) {
  const n = copyPlanner(s);
  if (start) {
    n.draftStart = id;
  } else {
    n.draftEnd = id;
  }
  return n;
}
function commitJourney(s) {
  const n = copyPlanner(s);
  n.startId = s.draftStart;
  n.endId = s.draftEnd;
  n.stage = "preview";
  n.stepIndex = 0;
  n.editing = "new";
  return n;
}
function cancelEdit(s) {
  const n = copyPlanner(s);
  n.draftStart = s.startId;
  n.draftEnd = s.endId;
  n.editing = "new";
  return n;
}
function changePreference(s, value) {
  const n = copyPlanner(s);
  n.preference = value;
  n.stage = "preview";
  n.stepIndex = 0;
  return n;
}
function swapJourney(s) {
  const n = copyPlanner(s);
  n.startId = s.endId;
  n.endId = s.startId;
  n.draftStart = n.startId;
  n.draftEnd = n.endId;
  n.stage = "preview";
  n.stepIndex = 0;
  return n;
}
function startGuidance(s) {
  const n = copyPlanner(s);
  n.stage = "guiding";
  n.stepIndex = 0;
  return n;
}
function advanceGuidance(s, count) {
  const n = copyPlanner(s);
  if (s.stage !== "guiding" || count < 1) {
    return n;
  }
  if (s.stepIndex >= count - 1) {
    n.stage = "completed";
  } else {
    n.stepIndex = s.stepIndex + 1;
  }
  return n;
}
function previousStep(s) {
  const n = copyPlanner(s);
  n.stepIndex = Math.max(0, s.stepIndex - 1);
  n.stage = "guiding";
  return n;
}
function withFields(s, patch) {
  const n = copyPlanner(s);
  Object.assign(n, patch);
  return n;
}
function withStage(s, stage) {
  const n = copyPlanner(s);
  n.stage = stage;
  n.stepIndex = stage === "preview" ? 0 : n.stepIndex;
  return n;
}
function withMapMode(s, mapMode) {
  const n = copyPlanner(s);
  n.mapMode = mapMode;
  return n;
}

// packages/core/src/presenter.ts
function meters(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
function summary(view, en) {
  const parts = [`${t("walking", en)} ${meters(view.walkingMeters)} ${t("meters", en)}`];
  const transfers = view.route.transitions.length;
  if (transfers > 0) {
    parts.push(`${transfers} ${t("transfers", en)}`);
  }
  return parts.join(" · ");
}
function stepTitle(step, en) {
  if (step.kind === "security") {
    return t("pass_security", en);
  }
  if (step.kind === "transfer") {
    const join = en ? " " : "";
    return `${t("take", en)}${join}${facilityLabel(step.facility, en)} ${t("to_floor", en)} ${floorLabel(step.toFloor, en)}`;
  }
  if (step.kind === "destination") {
    const node2 = AIRPORT.node(step.toId);
    return node2 === void 0 ? t("destination_step", en) : `${t("arrived_here", en)} · ${nodeName(node2, en)}`;
  }
  const node = AIRPORT.node(step.toId);
  return `${t("walk_to", en)} ${node === void 0 ? "" : nodeName(node, en)}`;
}
function stepAction(step, isLast, en) {
  if (step.kind === "security") {
    return t("passed_security", en);
  }
  if (step.kind === "transfer") {
    return t("arrived_floor", en);
  }
  if (step.kind === "destination" || isLast) {
    return t("finish", en);
  }
  return t("arrived_here", en);
}
function preferenceLabel(index, en) {
  var _a;
  const keys = ["pref_shortest", "pref_elevator", "pref_escalator", "pref_avoid_stair"];
  return t((_a = keys[index]) != null ? _a : "pref_shortest", en);
}
function preferenceChips(en) {
  return [0, 1, 2, 3].map((i) => ({ key: String(i), label: preferenceLabel(i, en) }));
}
function statusTitle(status, en) {
  return t(status, en);
}
function categoryChips(en) {
  return CATEGORIES.map((c) => ({
    key: c.key,
    label: `${c.symbol} ${en ? c.nameEn : c.nameZh}`
  }));
}
function rowTitle(node, en) {
  return nodeName(node, en);
}
function rowSubtitle(node, en) {
  const parts = [typeLabel(node.type, en), floorLabel(node.floor, en)];
  const code = gateCode(node);
  if (code !== "") {
    parts.push(code.toUpperCase());
  }
  return parts.join(" · ");
}
function popularCards(en, limit = 6) {
  const out = [];
  for (const id of HOT_DESTINATIONS.slice(0, limit)) {
    const node = AIRPORT.node(id);
    if (node !== void 0) {
      out.push({ id, title: nodeName(node, en), subtitle: floorLabel(node.floor, en) });
    }
  }
  return out;
}
function quickStartCards(en) {
  const out = [];
  for (const id of QUICK_STARTS) {
    const node = AIRPORT.node(id);
    if (node !== void 0) {
      out.push({ id, title: nodeName(node, en), subtitle: floorLabel(node.floor, en) });
    }
  }
  return out;
}
function metroDirections(en) {
  return [
    { targetId: "xha_b2_platA", title: t("city", en), subtitle: t("city_sub", en) },
    { targetId: "xha_b2_platB", title: t("resort", en), subtitle: t("resort_sub", en) }
  ];
}
function metroSteps(en) {
  return ["metro_gate", "metro_down", "metro_wait"].map((k) => t(k, en));
}
function allSteps(view, en) {
  return view.steps.map((step, index) => `${index + 1}. ${stepTitle(step, en)}`);
}

// packages/core/src/app-model.ts
var MemoryStore = class {
  constructor(lang = "zh", recent = []) {
    __publicField(this, "lang");
    __publicField(this, "recent");
    this.lang = lang;
    this.recent = recent.slice();
  }
  load() {
    return { lang: this.lang, recent: this.recent.slice() };
  }
  save(lang, recent) {
    this.lang = lang;
    this.recent = recent.slice(0, 6);
  }
};
function initialAppState(graph, store) {
  const saved = store.load();
  const recent = [];
  for (const id of saved.recent) {
    if (recent.length >= 6) {
      break;
    }
    if (graph.node(id) !== void 0 && recent.indexOf(id) < 0) {
      recent.push(id);
    }
  }
  return {
    view: "home",
    lang: saved.lang === "en" ? "en" : "zh",
    planner: newPlanner(),
    recent,
    pick: "",
    selectedId: "",
    category: "all",
    query: "",
    browseFloor: graph.floorOrder[0],
    toast: ""
  };
}
var AppModel = class {
  constructor(graph, store) {
    __publicField(this, "graph");
    __publicField(this, "store");
    __publicField(this, "state");
    this.graph = graph;
    this.store = store;
    this.state = initialAppState(graph, store);
  }
  // ------------------------------------------------------------ 派生查询
  get en() {
    return this.state.lang === "en";
  }
  get routeView() {
    const { startId, endId, preference } = this.state.planner;
    return buildRouteView(this.graph, startId, endId, preference);
  }
  get currentStep() {
    const view = this.routeView;
    if (view.status !== "ready" || view.steps.length === 0) {
      return void 0;
    }
    return view.steps[Math.min(this.state.planner.stepIndex, view.steps.length - 1)];
  }
  node(id) {
    return this.graph.node(id);
  }
  /** 当前应显示的楼层：路线态跟随当前步骤，漫游态跟随 browseFloor */
  get activeFloor() {
    if (this.state.view === "route") {
      const step = this.currentStep;
      if (step !== void 0 && step.floor !== "") {
        return step.floor;
      }
      const start = this.graph.node(this.state.planner.startId);
      return start === void 0 ? this.state.browseFloor : start.floor;
    }
    return this.state.browseFloor;
  }
  get routeNodeIds() {
    const view = this.routeView;
    return view.status === "ready" ? view.route.nodeIds : [];
  }
  /** 当前路段在整条路线里的结束下标 */
  get currentRouteIndex() {
    const view = this.routeView;
    if (view.status !== "ready") {
      return -1;
    }
    const step = this.currentStep;
    if (this.state.planner.stage === "guiding" && step !== void 0) {
      const index = view.route.nodeIds.indexOf(step.toId);
      if (index >= 0) {
        return index;
      }
    }
    return view.route.nodeIds.length - 1;
  }
  // ------------------------------------------------------------ 转移
  go(view) {
    this.state.view = view;
    this.state.toast = "";
  }
  toggleLanguage() {
    this.state.lang = this.state.lang === "zh" ? "en" : "zh";
    this.persist();
  }
  setToast(message) {
    this.state.toast = message;
  }
  clearToast() {
    this.state.toast = "";
  }
  startTargetFlow(category) {
    this.state.category = category;
    this.state.query = "";
    this.go("target");
  }
  startMetroFlow() {
    this.go("metro");
  }
  openBrowse() {
    this.state.pick = "";
    this.state.selectedId = "";
    this.go("browse");
  }
  openBrowseForDestination() {
    this.state.pick = "end";
    this.state.selectedId = "";
    this.go("browse");
  }
  chooseDestinationFromHome(id) {
    const node = this.graph.node(id);
    const category = node !== void 0 && node.type === "gate" ? "gate" : "all";
    this.state.planner = newJourney(this.state.planner, id, category);
    this.go("start");
  }
  chooseTarget(id) {
    const next = choosePlace(this.state.planner, id, false);
    if (this.state.planner.editing === "end") {
      this.commitRecent(id);
      this.state.planner = commitJourney(next);
      this.go("route");
    } else {
      this.state.planner = next;
      this.state.query = "";
      this.state.category = "all";
      this.go("start");
    }
  }
  chooseStart(id) {
    this.commitRecent(this.state.planner.draftEnd);
    this.state.planner = commitJourney(choosePlace(this.state.planner, id, true));
    this.go("route");
  }
  setCategory(key) {
    this.state.category = key;
  }
  setQuery(text) {
    this.state.query = text;
  }
  selectNode(id) {
    this.state.selectedId = id;
  }
  setBrowseFloor(floor) {
    this.state.browseFloor = floor;
    this.state.selectedId = "";
  }
  chooseMetroDirection(targetId) {
    const next = newJourney(this.state.planner, targetId, "metro");
    this.state.planner = choosePlace(next, targetId, false);
    this.go("start");
  }
  setStartFromMap(id) {
    this.state.pick = "start";
    this.setToast(this.t("start_set"));
  }
  routeToFromMap(id) {
    this.commitRecent(id);
    this.state.planner = commitJourney(choosePlace(this.state.planner, id, false));
    this.go("route");
  }
  setPreference(index) {
    this.state.planner = changePreference(this.state.planner, index);
  }
  beginGuidance() {
    this.state.planner = startGuidance(this.state.planner);
  }
  advance() {
    this.state.planner = advanceGuidance(this.state.planner, this.routeView.steps.length);
  }
  previous() {
    this.state.planner = previousStep(this.state.planner);
  }
  jumpToStep(index) {
    if (this.state.planner.stage !== "guiding") {
      return;
    }
    const count = this.routeView.steps.length;
    let next = this.state.planner;
    while (next.stepIndex < index) {
      next = advanceGuidance(next, count);
    }
    while (next.stepIndex > index) {
      next = previousStep(next);
    }
    this.state.planner = next;
  }
  /** 修改出发位置 → 出发位置页（不是目的地页） */
  editStart() {
    this.state.planner = beginEdit(this.state.planner, "start");
    this.go("start");
  }
  editDestination() {
    this.state.planner = beginEdit(this.state.planner, "end");
    this.go("target");
  }
  backFromStart() {
    if (this.state.planner.editing === "start") {
      this.state.planner = cancelEdit(this.state.planner);
      this.go("route");
    } else {
      this.go("home");
    }
  }
  backFromTarget() {
    if (this.state.planner.editing === "end") {
      this.state.planner = cancelEdit(this.state.planner);
      this.go("route");
    } else {
      this.go("home");
    }
  }
  backFromBrowse() {
    const back = this.state.pick === "end" ? "target" : "home";
    this.state.pick = "";
    this.go(back);
  }
  swap() {
    this.state.planner = swapJourney(this.state.planner);
  }
  restart() {
    this.state.planner = newJourney(this.state.planner);
    this.go("home");
  }
  backHome() {
    this.go("home");
  }
  /** 确认路线时把目的地写入"最近查找"（与 ArkTS / Swift 一致：仅改起点不写） */
  commitRecent(id) {
    if (id === "") {
      return;
    }
    this.state.recent = recentPlaces(this.graph, this.state.recent, id);
    this.persist();
  }
  persist() {
    this.store.save(this.state.lang, this.state.recent);
  }
  /** 便捷：文案查表（沿用当前语言） */
  t(key) {
    return t(key, this.en);
  }
};

// packages/core/src/viewport.ts
var PAN_MARGIN = 56;
var MAX_ZOOM = 5;
var Viewport = class {
  constructor() {
    __publicField(this, "zoom", 1);
    __publicField(this, "tx", 0);
    __publicField(this, "ty", 0);
    __publicField(this, "bbox", [0, 0, 1, 1]);
    __publicField(this, "w", 1);
    __publicField(this, "h", 1);
    __publicField(this, "minZoom", 0.1);
  }
  reset() {
    this.zoom = 1;
    this.tx = 0;
    this.ty = 0;
  }
  fit(bbox, w, h, pad) {
    this.fitInsets(bbox, w, h, pad, pad, pad, pad);
  }
  fitInsets(bbox, w, h, left, top, right, bottom) {
    this.bbox = bbox;
    this.w = w;
    this.h = h;
    const bw = Math.max(1, bbox[2] - bbox[0]);
    const bh = Math.max(1, bbox[3] - bbox[1]);
    const innerW = Math.max(1, w - left - right);
    const innerH = Math.max(1, h - top - bottom);
    this.zoom = Math.max(0.05, Math.min(innerW / bw, innerH / bh));
    this.minZoom = this.zoom * 0.75;
    this.tx = left + (innerW - bw * this.zoom) / 2 - bbox[0] * this.zoom;
    this.ty = top + (innerH - bh * this.zoom) / 2 - bbox[1] * this.zoom;
  }
  scrX(x) {
    return this.tx + x * this.zoom;
  }
  scrY(y) {
    return this.ty + y * this.zoom;
  }
  /** 屏幕坐标 -> 世界坐标（命中测试与"点空白处"用） */
  worldX(sx) {
    return (sx - this.tx) / this.zoom;
  }
  worldY(sy) {
    return (sy - this.ty) / this.zoom;
  }
  pan(dx, dy) {
    this.tx += dx;
    this.ty += dy;
    this.clampT();
  }
  pinch(cx, cy, factor) {
    const z = Math.max(this.minZoom, Math.min(MAX_ZOOM, this.zoom * factor));
    const k = z / this.zoom;
    this.tx = cx - (cx - this.tx) * k;
    this.ty = cy - (cy - this.ty) * k;
    this.zoom = z;
    this.clampT();
  }
  zoomBy(cx, cy, step) {
    this.pinch(cx, cy, step);
  }
  clampT() {
    const margin = PAN_MARGIN;
    this.tx = Math.max(
      margin - this.bbox[2] * this.zoom,
      Math.min(this.w - margin - this.bbox[0] * this.zoom, this.tx)
    );
    this.ty = Math.max(
      margin - this.bbox[3] * this.zoom,
      Math.min(this.h - margin - this.bbox[1] * this.zoom, this.ty)
    );
  }
};
var ROUTE_INSETS = { left: 32, top: 48, right: 72, bottom: 90 };
var BROWSE_INSETS = { left: 24, top: 48, right: 72, bottom: 78 };

// packages/core/src/render.ts
var CANVAS = {
  routeDone: "#9ACCC6",
  routeLive: "#007F7A",
  corridorCasing: "#DCE6E8",
  corridorFill: "#FFFFFF",
  floorBase: "#E9F0F1",
  markerEnd: "#B86A12",
  hitRadius: 22
};
function labelWidth(text, size) {
  return text.length * size * 0.62 + 4;
}
function nodeRadius(node) {
  if (node.type === "corridor") {
    return 2.6;
  }
  if (node.type === "lift" || node.type === "escalator" || node.type === "stair") {
    return 4;
  }
  return 5.5;
}
function shouldLabel(node, zoom) {
  if (node.type === "corridor") {
    return false;
  }
  if (zoom >= 0.85) {
    return true;
  }
  if (zoom >= 0.5) {
    return node.type === "gate" || node.type === "metro" || node.type === "checkin" || node.type === "security" || node.type === "entrance" || node.type === "exit";
  }
  return false;
}
function typeColor(graph, type) {
  var _a;
  return (_a = graph.tokens.TYPE_COLOR[type]) != null ? _a : "#486A85";
}
function renderFloor(graph, input) {
  var _a, _b, _c, _d;
  const vp = input.viewport;
  const floor = input.floor;
  const en = input.en === true;
  const routeIds = (_a = input.routeNodeIds) != null ? _a : [];
  const currentIndex = (_b = input.currentRouteIndex) != null ? _b : -1;
  const startId = (_c = input.startId) != null ? _c : "";
  const endId = (_d = input.endId) != null ? _d : "";
  const commands = [];
  commands.push({
    kind: "fillRect",
    x: 0,
    y: 0,
    width: input.width,
    height: input.height,
    color: graph.tokens.MAP.surface
  });
  const nodes = graph.floorNodes(floor);
  const landCount = nodes.filter((n) => n.side === "land").length;
  const bbox = graph.floorBBox(floor);
  const wash = landCount * 2 >= nodes.length ? graph.tokens.MAP.landWash : graph.tokens.MAP.airWash;
  commands.push({
    kind: "fillRect",
    x: vp.scrX(bbox[0]),
    y: vp.scrY(bbox[1]),
    width: (bbox[2] - bbox[0]) * vp.zoom,
    height: (bbox[3] - bbox[1]) * vp.zoom,
    color: wash
  });
  const onFloor = new Set(nodes.map((n) => n.id));
  const casing = [];
  const fill = [];
  for (const edge of graph.edges) {
    if (edge.type !== "walk") {
      continue;
    }
    if (!onFloor.has(edge.from) || !onFloor.has(edge.to)) {
      continue;
    }
    const a = graph.requireNode(edge.from);
    const b = graph.requireNode(edge.to);
    casing.push({ x: vp.scrX(a.x), y: vp.scrY(a.y) }, { x: vp.scrX(b.x), y: vp.scrY(b.y) });
    fill.push({ x: vp.scrX(a.x), y: vp.scrY(a.y) }, { x: vp.scrX(b.x), y: vp.scrY(b.y) });
  }
  if (casing.length > 0) {
    commands.push({ kind: "polyline", points: casing, color: CANVAS.corridorCasing, width: Math.max(6, 22 * vp.zoom) });
    commands.push({ kind: "polyline", points: fill, color: CANVAS.corridorFill, width: Math.max(4, 18 * vp.zoom) });
  }
  if (routeIds.length > 1) {
    const all = [];
    for (const id of routeIds) {
      const node = graph.node(id);
      if (node !== void 0) {
        all.push({ x: vp.scrX(node.x), y: vp.scrY(node.y) });
      }
    }
    commands.push({
      kind: "polyline",
      points: all,
      color: CANVAS.routeDone,
      width: Math.max(4, 5 * Math.min(vp.zoom + 0.6, 1.6))
    });
    if (currentIndex >= 0 && currentIndex < routeIds.length) {
      const from = Math.max(0, currentIndex - 1);
      const slice = [];
      for (const id of routeIds.slice(from, currentIndex + 1)) {
        const node = graph.node(id);
        if (node !== void 0) {
          slice.push({ x: vp.scrX(node.x), y: vp.scrY(node.y) });
        }
      }
      if (slice.length > 1) {
        commands.push({
          kind: "polyline",
          points: slice,
          color: CANVAS.routeLive,
          width: Math.max(5, 6 * Math.min(vp.zoom + 0.6, 1.6))
        });
      }
    }
  }
  const nodeScale = Math.min(Math.max(vp.zoom, 0.8), 2);
  for (const node of nodes) {
    commands.push({
      kind: "circle",
      x: vp.scrX(node.x),
      y: vp.scrY(node.y),
      radius: Math.max(2, nodeRadius(node) * nodeScale),
      fill: typeColor(graph, node.type),
      stroke: node.type === "corridor" ? null : "#FFFFFF",
      strokeWidth: 1.4
    });
  }
  for (const node of nodes) {
    if (!shouldLabel(node, vp.zoom)) {
      continue;
    }
    const text = nodeName(node, en);
    if (text.length === 0) {
      continue;
    }
    const size = vp.zoom >= 1.6 ? 12 : 11;
    const lx = vp.scrX(node.x) + 8;
    const ly = vp.scrY(node.y) - 9;
    commands.push({
      kind: "labelPlate",
      x: lx - 2,
      y: ly - size / 2 - 1,
      width: labelWidth(text, size),
      height: size + 2,
      color: "rgba(255,255,255,0.86)"
    });
    commands.push({
      kind: "text",
      x: lx,
      y: ly,
      string: text,
      size,
      color: graph.tokens.MAP.ink,
      align: "left",
      baseline: "middle"
    });
  }
  const start = startId === "" ? void 0 : graph.node(startId);
  if (start !== void 0 && start.floor === floor) {
    commands.push({
      kind: "circle",
      x: vp.scrX(start.x),
      y: vp.scrY(start.y),
      radius: 11,
      fill: CANVAS.routeLive,
      stroke: "#FFFFFF",
      strokeWidth: 2
    });
    commands.push({
      kind: "text",
      x: vp.scrX(start.x),
      y: vp.scrY(start.y),
      string: t("start_marker", en),
      size: 12,
      color: "#FFFFFF",
      align: "center",
      baseline: "middle"
    });
  }
  const end = endId === "" ? void 0 : graph.node(endId);
  if (end !== void 0 && end.floor === floor) {
    commands.push({
      kind: "circle",
      x: vp.scrX(end.x),
      y: vp.scrY(end.y),
      radius: 11,
      fill: CANVAS.markerEnd,
      stroke: "#FFFFFF",
      strokeWidth: 2
    });
    commands.push({
      kind: "text",
      x: vp.scrX(end.x),
      y: vp.scrY(end.y),
      string: t("end_marker", en),
      size: 12,
      color: "#FFFFFF",
      align: "center",
      baseline: "middle"
    });
  }
  commands.push({
    kind: "text",
    x: input.width - 12,
    y: 10,
    string: floor,
    size: 13,
    color: graph.tokens.MAP.ink2,
    align: "right",
    baseline: "top"
  });
  return commands;
}
function hitTest(graph, floor, viewport, x, y, radius = CANVAS.hitRadius) {
  let best;
  let bestDistance = radius;
  for (const node of graph.floorNodes(floor)) {
    const dx = viewport.scrX(node.x) - x;
    const dy = viewport.scrY(node.y) - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = node;
    }
  }
  return best;
}
function fitFloorViewport(graph, floor, width, height) {
  const vp = new Viewport();
  vp.fitInsets(
    graph.floorBBox(floor),
    width,
    height,
    BROWSE_INSETS.left,
    BROWSE_INSETS.top,
    BROWSE_INSETS.right,
    BROWSE_INSETS.bottom
  );
  return vp;
}
function fitRouteViewport(graph, nodeIds, width, height, pad = 24) {
  const vp = new Viewport();
  if (nodeIds.length === 0) {
    return vp;
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const id of nodeIds) {
    const node = graph.node(id);
    if (node === void 0) {
      continue;
    }
    if (node.x < minX) {
      minX = node.x;
    }
    if (node.y < minY) {
      minY = node.y;
    }
    if (node.x > maxX) {
      maxX = node.x;
    }
    if (node.y > maxY) {
      maxY = node.y;
    }
  }
  if (!Number.isFinite(minX)) {
    return vp;
  }
  vp.fitInsets(
    [minX - pad, minY - pad, maxX + pad, maxY + pad],
    width,
    height,
    ROUTE_INSETS.left,
    ROUTE_INSETS.top,
    ROUTE_INSETS.right,
    ROUTE_INSETS.bottom
  );
  return vp;
}
