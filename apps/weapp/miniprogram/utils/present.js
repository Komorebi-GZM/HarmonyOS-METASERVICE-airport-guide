// 页面数据构造：把状态机 + 呈现层的结果拍平成 setData 需要的普通对象。
// 单独抽出来是为了可测：小程序 smoke 测试直接调用这些函数断言文案与列表，不必渲染 WXML。

const { core } = require('./model.js');
const P = core;

/** 首页 */
function home(model) {
  const en = model.en;
  return {
    langLabel: en ? '中' : 'EN',
    brand: P.t('brand', en),
    heroTitle: P.t('home_title', en),
    heroSub: P.t('home_sub', en),
    goGate: P.t('go_gate', en),
    goMetro: P.t('go_metro', en),
    goService: P.t('go_service', en),
    popularTitle: P.t('popular', en),
    popular: P.popularCards(en),
    recentTitle: P.t('recent', en),
    recent: model.state.recent
      .map((id) => model.node(id))
      .filter((n) => n !== undefined)
      .map((n) => ({ id: n.id, title: P.rowTitle(n, en), subtitle: P.rowSubtitle(n, en) })),
    floorsLabel: P.t('floors', en),
    mapLabel: P.t('view_map', en),
    sample: P.t('sample', en),
  };
}

/** 目的地页 */
function target(model) {
  const en = model.en;
  const state = model.state;
  const places = state.query.trim().length > 0 || state.category !== 'all'
    ? P.searchPlaces(core.AIRPORT, state.query, state.category)
    : P.listedPlaces(core.AIRPORT, state.category);
  return {
    langLabel: en ? '中' : 'EN',
    title: P.t('target_title', en),
    hint: P.t('target_hint', en),
    searchHint: P.t('search', en),
    query: state.query,
    categories: P.categoryChips(en),
    activeCategory: state.category,
    places: places.slice(0, 60).map((n) => ({
      id: n.id, title: P.rowTitle(n, en), subtitle: P.rowSubtitle(n, en),
    })),
    empty: places.length === 0,
    noResults: P.t('no_results', en),
    noResultsHint: P.t('no_results_hint', en),
    clearLabel: P.t('clear', en),
  };
}

/** 出发位置页 */
function start(model) {
  const en = model.en;
  const state = model.state;
  const targetNode = model.node(state.planner.draftEnd);
  const places = P.searchPlaces(core.AIRPORT, '', 'all');
  return {
    langLabel: en ? '中' : 'EN',
    title: P.t('start_title', en),
    hint: P.t('start_hint', en),
    selectedLabel: P.t('selected_target', en),
    selectedName: targetNode === undefined ? '' : P.rowTitle(targetNode, en),
    quickTitle: P.t('quick_starts', en),
    quick: P.quickStartCards(en),
    searchHint: P.t('search', en),
    places: places.slice(0, 60).map((n) => ({
      id: n.id, title: P.rowTitle(n, en), subtitle: P.rowSubtitle(n, en),
    })),
    mapLabel: P.t('view_map', en),
  };
}

/** 路线页 */
function route(model) {
  const en = model.en;
  const state = model.state;
  const view = model.routeView;
  const startNode = model.node(state.planner.startId);
  const endNode = model.node(state.planner.endId);
  const base = {
    langLabel: en ? '中' : 'EN',
    stage: state.planner.stage,
    startName: startNode === undefined ? '' : P.rowTitle(startNode, en),
    endName: endNode === undefined ? '' : P.rowTitle(endNode, en),
  };

  if (view.status !== 'ready') {
    return Object.assign(base, {
      ready: false,
      statusTitle: P.statusTitle(view.status, en),
      errorHint: P.t('error_hint', en),
      chooseAgain: P.t('choose_again', en),
      title: P.t('route_title', en),
    });
  }

  const index = Math.min(state.planner.stepIndex, view.steps.length - 1);
  const step = view.steps[index];
  return Object.assign(base, {
    ready: true,
    title: P.t(state.planner.stage === 'preview' ? 'route_preview'
      : state.planner.stage === 'guiding' ? 'route_guiding' : 'route_title', en),
    summary: P.summary(view, en),
    securityNote: P.t(view.route.viaSecurity ? 'via_security' : 'same_side', en),
    viaSecurity: view.route.viaSecurity,
    preferences: P.preferenceChips(en),
    activePreference: String(state.planner.preference),
    stagePreview: state.planner.stage === 'preview',
    stageGuiding: state.planner.stage === 'guiding',
    stageCompleted: state.planner.stage === 'completed',
    begin: P.t('begin', en),
    editFrom: P.t('edit_from', en),
    editTo: P.t('edit_to', en),
    swap: P.t('swap', en),
    stepIndexText: `${P.t('step', en)} ${index + 1}/${view.steps.length}`,
    stepFloor: P.floorLabel(step.floor, en),
    stepTitle: P.stepTitle(step, en),
    stepMeters: step.meters > 0 ? `${P.meters(step.meters)} ${P.t('meters', en)}` : '',
    manual: P.t('manual', en),
    actionLabel: P.stepAction(step, index === view.steps.length - 1, en),
    previousLabel: P.t('previous', en),
    previousDisabled: index === 0,
    completeTitle: P.t('route_complete', en),
    completeHint: P.t('route_complete_hint', en),
    newJourney: P.t('new_journey', en),
    allStepsLabel: P.t('all_steps', en),
    steps: P.allSteps(view, en).map((text, i) => ({ text, current: i === index && state.planner.stage === 'guiding' })),
    routeNodeIds: view.route.nodeIds,
    currentIndex: model.currentRouteIndex,
    activeFloor: model.activeFloor,
  });
}

/** 地铁页 */
function metro(model) {
  const en = model.en;
  return {
    langLabel: en ? '中' : 'EN',
    title: P.t('metro_title', en),
    heading: P.t('metro_heading', en),
    hint: P.t('metro_hint', en),
    directions: P.metroDirections(en),
    stepsTitle: P.t('metro_steps', en),
    steps: P.metroSteps(en),
  };
}

/** 楼层地图页 */
function browse(model) {
  const en = model.en;
  const state = model.state;
  const selected = model.node(state.selectedId);
  const nodes = core.AIRPORT.floorNodes(state.browseFloor).filter((n) => n.type !== 'corridor');
  return {
    langLabel: en ? '中' : 'EN',
    title: P.t('browse_title', en),
    hint: P.t('browse_hint', en),
    floors: core.AIRPORT.floorOrder.map((f) => ({ key: f, label: f, active: f === state.browseFloor })),
    activeFloor: state.browseFloor,
    hasSelection: selected !== undefined,
    selectedName: selected === undefined ? '' : P.rowTitle(selected, en),
    selectedSub: selected === undefined ? '' : P.rowSubtitle(selected, en),
    pickStart: P.t('pick_start', en),
    pickDest: P.t('pick_dest', en),
    legend: P.t('legend', en),
    nodes: selected === undefined
      ? nodes.map((n) => ({ id: n.id, title: P.rowTitle(n, en), subtitle: P.rowSubtitle(n, en) }))
      : [],
    fullFloor: P.t('full_floor', en),
    zoomIn: P.t('zoom_in', en),
    zoomOut: P.t('zoom_out', en),
    startId: state.planner.startId,
    endId: state.planner.endId,
  };
}

/** 轻提示 */
function toast(model) {
  return { toast: model.state.toast };
}

module.exports = { home, target, start, route, metro, browse, toast };
