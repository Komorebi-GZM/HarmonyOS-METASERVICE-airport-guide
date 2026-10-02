// 应用状态机（平台无关）：六页流程、语言、最近地点、当前选中项。
//
// 同一套转移逻辑被三端共用：
//   - Web（apps/web）：状态存在模块内，动作后重新渲染 DOM
//   - 微信小程序（apps/weapp）：状态挂在 App 全局，动作后 setData
//   - Apple（apps/apple 的 AirportUI/AppModel.swift）：等价的 Swift 实现（27 项测试）
// 状态转移的确切行为由 packages/core/test/app-model.test.ts 与三端各自的端到端测试锁定。

import type { AirportGraph } from './graph.ts';
import type { MapNode, PlannerState, RouteView } from './types.ts';
import {
  newPlanner, newJourney, beginEdit, choosePlace, commitJourney, cancelEdit,
  changePreference, swapJourney, startGuidance, advanceGuidance, previousStep,
} from './planner.ts';
import { buildRouteView } from './route-steps.ts';
import { recentPlaces } from './places.ts';
import { t as translate } from './i18n.ts';

export type AppView = 'home' | 'target' | 'start' | 'route' | 'metro' | 'browse';
export type PickMode = '' | 'start' | 'end';
export type AppLang = 'zh' | 'en';

export interface AppState {
  view: AppView;
  lang: AppLang;
  planner: PlannerState;
  recent: string[];
  pick: PickMode;
  selectedId: string;
  category: string;
  query: string;
  browseFloor: string;
  toast: string;
}

/** 平台偏好存储：Web 用 localStorage、小程序用 wx.storage、测试用内存实现 */
export interface PreferencesStore {
  load(): { lang: string; recent: string[] };
  save(lang: string, recent: string[]): void;
}

export class MemoryStore implements PreferencesStore {
  lang: string;
  recent: string[];
  constructor(lang = 'zh', recent: string[] = []) {
    this.lang = lang;
    this.recent = recent.slice();
  }
  load(): { lang: string; recent: string[] } {
    return { lang: this.lang, recent: this.recent.slice() };
  }
  save(lang: string, recent: string[]): void {
    this.lang = lang;
    this.recent = recent.slice(0, 6);
  }
}

export function initialAppState(graph: AirportGraph, store: PreferencesStore): AppState {
  const saved = store.load();
  const recent: string[] = [];
  for (const id of saved.recent) {
    if (recent.length >= 6) { break; }
    if (graph.node(id) !== undefined && recent.indexOf(id) < 0) { recent.push(id); }
  }
  return {
    view: 'home',
    lang: saved.lang === 'en' ? 'en' : 'zh',
    planner: newPlanner(),
    recent,
    pick: '',
    selectedId: '',
    category: 'all',
    query: '',
    browseFloor: graph.floorOrder[0],
    toast: '',
  };
}

export class AppModel {
  readonly graph: AirportGraph;
  private readonly store: PreferencesStore;
  state: AppState;

  constructor(graph: AirportGraph, store: PreferencesStore) {
    this.graph = graph;
    this.store = store;
    this.state = initialAppState(graph, store);
  }

  // ------------------------------------------------------------ 派生查询

  get en(): boolean {
    return this.state.lang === 'en';
  }

  get routeView(): RouteView {
    const { startId, endId, preference } = this.state.planner;
    return buildRouteView(this.graph, startId, endId, preference);
  }

  get currentStep(): RouteView['steps'][number] | undefined {
    const view = this.routeView;
    if (view.status !== 'ready' || view.steps.length === 0) { return undefined; }
    return view.steps[Math.min(this.state.planner.stepIndex, view.steps.length - 1)];
  }

  node(id: string): MapNode | undefined {
    return this.graph.node(id);
  }

  /** 当前应显示的楼层：路线态跟随当前步骤，漫游态跟随 browseFloor */
  get activeFloor(): string {
    if (this.state.view === 'route') {
      const step = this.currentStep;
      if (step !== undefined && step.floor !== '') { return step.floor; }
      const start = this.graph.node(this.state.planner.startId);
      return start === undefined ? this.state.browseFloor : start.floor;
    }
    return this.state.browseFloor;
  }

  get routeNodeIds(): string[] {
    const view = this.routeView;
    return view.status === 'ready' ? view.route.nodeIds : [];
  }

  /** 当前路段在整条路线里的结束下标 */
  get currentRouteIndex(): number {
    const view = this.routeView;
    if (view.status !== 'ready') { return -1; }
    const step = this.currentStep;
    if (this.state.planner.stage === 'guiding' && step !== undefined) {
      const index = view.route.nodeIds.indexOf(step.toId);
      if (index >= 0) { return index; }
    }
    return view.route.nodeIds.length - 1;
  }

  // ------------------------------------------------------------ 转移

  go(view: AppView): void {
    this.state.view = view;
    this.state.toast = '';
  }

  toggleLanguage(): void {
    this.state.lang = this.state.lang === 'zh' ? 'en' : 'zh';
    this.persist();
  }

  setToast(message: string): void {
    this.state.toast = message;
  }

  clearToast(): void {
    this.state.toast = '';
  }

  startTargetFlow(category: string): void {
    this.state.category = category;
    this.state.query = '';
    this.go('target');
  }

  startMetroFlow(): void {
    this.go('metro');
  }

  openBrowse(): void {
    this.state.pick = '';
    this.state.selectedId = '';
    this.go('browse');
  }

  openBrowseForDestination(): void {
    this.state.pick = 'end';
    this.state.selectedId = '';
    this.go('browse');
  }

  chooseDestinationFromHome(id: string): void {
    const node = this.graph.node(id);
    const category = node !== undefined && node.type === 'gate' ? 'gate' : 'all';
    this.state.planner = newJourney(this.state.planner, id, category);
    this.go('start');
  }

  chooseTarget(id: string): void {
    const next = choosePlace(this.state.planner, id, false);
    if (this.state.planner.editing === 'end') {
      this.commitRecent(id);
      this.state.planner = commitJourney(next);
      this.go('route');
    } else {
      this.state.planner = next;
      this.state.query = '';
      this.state.category = 'all';
      this.go('start');
    }
  }

  chooseStart(id: string): void {
    this.commitRecent(this.state.planner.draftEnd);
    this.state.planner = commitJourney(choosePlace(this.state.planner, id, true));
    this.go('route');
  }

  setCategory(key: string): void {
    this.state.category = key;
  }

  setQuery(text: string): void {
    this.state.query = text;
  }

  selectNode(id: string): void {
    this.state.selectedId = id;
  }

  setBrowseFloor(floor: string): void {
    this.state.browseFloor = floor;
    this.state.selectedId = '';
  }

  chooseMetroDirection(targetId: string): void {
    const next = newJourney(this.state.planner, targetId, 'metro');
    this.state.planner = choosePlace(next, targetId, false);
    this.go('start');
  }

  /**
   * 地图页"我在这里"。
   * 与 ArkTS 端 pages/FloorBrowse.ets 的 chooseStart() 对齐：**必须真正把该点写成起点**
   * （draftStart），只弹提示不写状态会让随后的"去这里"用到旧起点。
   */
  setStartFromMap(id: string): void {
    this.state.planner = choosePlace(this.state.planner, id, true);
    this.state.pick = 'start';
    this.setToast(this.t('start_set'));
  }

  routeToFromMap(id: string): void {
    this.commitRecent(id);
    this.state.planner = commitJourney(choosePlace(this.state.planner, id, false));
    this.go('route');
  }

  setPreference(index: number): void {
    this.state.planner = changePreference(this.state.planner, index);
  }

  beginGuidance(): void {
    this.state.planner = startGuidance(this.state.planner);
  }

  advance(): void {
    this.state.planner = advanceGuidance(this.state.planner, this.routeView.steps.length);
  }

  previous(): void {
    this.state.planner = previousStep(this.state.planner);
  }

  jumpToStep(index: number): void {
    if (this.state.planner.stage !== 'guiding') { return; }
    const count = this.routeView.steps.length;
    let next = this.state.planner;
    while (next.stepIndex < index) { next = advanceGuidance(next, count); }
    while (next.stepIndex > index) { next = previousStep(next); }
    this.state.planner = next;
  }

  /** 修改出发位置 → 出发位置页（不是目的地页） */
  editStart(): void {
    this.state.planner = beginEdit(this.state.planner, 'start');
    this.go('start');
  }

  editDestination(): void {
    this.state.planner = beginEdit(this.state.planner, 'end');
    this.go('target');
  }

  backFromStart(): void {
    if (this.state.planner.editing === 'start') {
      this.state.planner = cancelEdit(this.state.planner);
      this.go('route');
    } else {
      this.go('home');
    }
  }

  backFromTarget(): void {
    if (this.state.planner.editing === 'end') {
      this.state.planner = cancelEdit(this.state.planner);
      this.go('route');
    } else {
      this.go('home');
    }
  }

  backFromBrowse(): void {
    const back: AppView = this.state.pick === 'end' ? 'target' : 'home';
    this.state.pick = '';
    this.go(back);
  }

  swap(): void {
    this.state.planner = swapJourney(this.state.planner);
  }

  restart(): void {
    this.state.planner = newJourney(this.state.planner);
    this.go('home');
  }

  backHome(): void {
    this.go('home');
  }

  /** 确认路线时把目的地写入"最近查找"（与 ArkTS / Swift 一致：仅改起点不写） */
  private commitRecent(id: string): void {
    if (id === '') { return; }
    this.state.recent = recentPlaces(this.graph, this.state.recent, id);
    this.persist();
  }

  private persist(): void {
    this.store.save(this.state.lang, this.state.recent);
  }

  /** 便捷：文案查表（沿用当前语言） */
  t(key: string): string {
    return translate(key, this.en);
  }
}
