// 星海机场导航 · Web/PWA 客户端
// 六页流程与 ArkTS 版一致：首页 / 目的地 / 出发位置 / 路线 / 地铁 / 楼层地图。
// 逻辑全部来自 @airport-guide/core（与 ArkTS 端同源），这里只负责 DOM 与交互。

import {
  AIRPORT, CATEGORIES, HOT_DESTINATIONS, QUICK_STARTS,
  buildRouteView, catSymbol, changePreference, commitJourney,
  facilityLabel, floorLabel, gateCode, hasKey, listedPlaces, nodeName,
  place, recentPlaces, searchPlaces, swapJourney, t, typeLabel,
  newJourney, beginEdit, choosePlace, cancelEdit, startGuidance, advanceGuidance, previousStep,
} from '@core';
import type { MapNode, PlannerState, RouteStep, RouteView } from '@core';
import { createMapView } from './map-view.ts';
import type { MapView } from './map-view.ts';
import { load, save } from './storage.ts';
import './styles.css';

type ViewName = 'home' | 'target' | 'start' | 'route' | 'metro' | 'browse';

interface AppState {
  view: ViewName;
  lang: 'zh' | 'en';
  planner: PlannerState;
  recent: string[];
  pick: '' | 'start' | 'end';
  selectedId: string;
  category: string;
  query: string;
  browseFloor: string;
  toast: string;
  map: MapView | null;
}

const saved = load();
const state: AppState = {
  view: 'home',
  lang: saved.lang === 'en' ? 'en' : 'zh',
  planner: newJourney({ revision: 0 } as PlannerState),
  recent: saved.recent,
  pick: '',
  selectedId: '',
  category: 'all',
  query: '',
  browseFloor: AIRPORT.floorOrder[0],
  toast: '',
  map: null,
};

function en(): boolean {
  return state.lang === 'en';
}

function L(key: string): string {
  return hasKey(key) ? t(key, en()) : key;
}

// ------------------------------------------------------------------ DOM 小工具

type Child = Node | string | null | undefined | false;

function h(tag: string, attrs: Record<string, unknown> = {}, ...children: Child[]): HTMLElement {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) { continue; }
    if (k === 'class') { el.className = String(v); }
    else if (k === 'text') { el.textContent = String(v); }
    else if (k === 'html') { el.innerHTML = String(v); }
    else if (k.startsWith('on') && typeof v === 'function') {
      el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
    } else if (k === 'style' && typeof v === 'object') {
      Object.assign((el as HTMLElement).style, v as object);
    } else {
      el.setAttribute(k, String(v));
    }
  }
  for (const c of children) {
    if (c === null || c === undefined || c === false) { continue; }
    el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return el;
}

function go(view: ViewName): void {
  state.view = view;
  state.toast = '';
  render();
}

function persist(): void {
  save(state.lang, state.recent);
}

/** 确认路线时把目的地写入"最近查找"（与 ArkTS LocalStore 的写入时机一致） */
function commitRecent(endId: string): void {
  if (endId === '') { return; }
  state.recent = recentPlaces(AIRPORT, state.recent, endId);
  persist();
}

function toast(message: string): void {
  state.toast = message;
  render();
  window.setTimeout(() => {
    if (state.toast === message) {
      state.toast = '';
      render();
    }
  }, 2600);
}

function setPlanner(next: PlannerState, view?: ViewName): void {
  state.planner = next;
  if (view !== undefined) { state.view = view; }
  render();
}

// ------------------------------------------------------------------ 通用片段

function header(title: string, onBack?: () => void): HTMLElement {
  return h('header', { class: 'top' },
    onBack !== undefined
      ? h('button', { class: 'icon-btn', 'aria-label': L('back'), onclick: onBack }, '‹')
      : h('div', { class: 'brand' }, L('brand')),
    h('h1', { class: 'top-title' }, title),
    h('button', {
      class: 'lang-btn',
      onclick: () => {
        state.lang = state.lang === 'zh' ? 'en' : 'zh';
        persist();
        render();
      },
    }, state.lang === 'zh' ? 'EN' : '中'),
  );
}

function placeRow(node: MapNode, action: () => void, extra?: string): HTMLElement {
  const code = gateCode(node);
  return h('button', { class: 'row', onclick: action },
    h('span', { class: 'row-symbol', text: catSymbol(node.type === 'gate' ? 'gate' : 'all') }),
    h('span', { class: 'row-main' },
      h('span', { class: 'row-name', text: nodeName(node, en()) }),
      h('span', { class: 'row-sub', text: `${typeLabel(node.type, en())} · ${floorLabel(node.floor, en())}${code !== '' ? ' · ' + code.toUpperCase() : ''}` }),
    ),
    extra !== undefined ? h('span', { class: 'row-badge', text: extra }) : null,
    h('span', { class: 'row-arrow', text: '›' }),
  );
}

function chips(items: Array<{ key: string; label: string; active?: boolean; onClick: () => void }>): HTMLElement {
  return h('div', { class: 'chips' }, ...items.map((i) => h('button', {
    class: 'chip' + (i.active === true ? ' chip-active' : ''),
    onclick: i.onClick,
  }, i.label)));
}

/** 目的地/出发位置共用的选择器（列表部分单独抽出，便于输入时局部刷新、不丢焦点） */
function pickerBody(mode: 'target' | 'start'): HTMLElement {
  const isTarget = mode === 'target';
  const list = state.query.trim().length > 0 || state.category !== 'all'
    ? searchPlaces(AIRPORT, state.query, isTarget ? state.category : 'all')
    : (isTarget ? listedPlaces(AIRPORT, state.category) : listedPlaces(AIRPORT, 'all'));

  return h('div', { class: 'picker-body' },
    list.length === 0
      ? h('div', { class: 'empty' },
          h('p', { class: 'empty-title', text: L('no_results') }),
          h('p', { class: 'empty-sub', text: L('no_results_hint') }))
      : h('div', { class: 'list' }, ...list.slice(0, 60).map((n) => placeRow(n, () => {
          if (isTarget) {
            const next = choosePlace(state.planner, n.id, false);
            if (state.planner.editing === 'end') {
              commitRecent(n.id);
              setPlanner(commitJourney(next), 'route');
            } else {
              state.query = '';
              state.category = 'all';
              setPlanner(next, 'start');
            }
          } else {
            commitRecent(n.id);
            setPlanner(commitJourney(choosePlace(state.planner, n.id, true)), 'route');
          }
        }))),
  );
}

function picker(mode: 'target' | 'start'): HTMLElement {
  const isTarget = mode === 'target';
  const searchBox = h('input', {
    class: 'search',
    type: 'search',
    placeholder: L('search'),
    value: state.query,
    oninput: (ev: Event) => {
      state.query = (ev.target as HTMLInputElement).value;
      const host = document.querySelector('.picker-body');
      if (host !== null) {
        // 只替换列表：输入框不重建，焦点与光标位置自然保留
        host.replaceWith(pickerBody(mode));
      }
    },
  }) as HTMLInputElement;

  const parts: Child[] = [];
  if (isTarget) {
    parts.push(chips(CATEGORIES.map((c) => ({
      key: c.key,
      label: `${c.symbol} ${en() ? c.nameEn : c.nameZh}`,
      active: state.category === c.key,
      onClick: () => { state.category = c.key; render(); },
    }))));
  }
  parts.push(searchBox);
  if (isTarget && state.query.length > 0) {
    parts.push(h('button', { class: 'link', onclick: () => { state.query = ''; render(); } }, L('clear')));
  }
  if (!isTarget) {
    parts.push(h('h2', { class: 'section', text: L('quick_starts') }));
    parts.push(h('div', { class: 'grid2' }, ...QUICK_STARTS
      .map((id) => place(AIRPORT, id))
      .filter((n): n is MapNode => n !== undefined)
      .map((n) => h('button', {
        class: 'quick',
        onclick: () => {
          commitRecent(state.planner.draftEnd);
          setPlanner(commitJourney(choosePlace(state.planner, n.id, true)), 'route');
        },
      }, h('span', { class: 'quick-name', text: nodeName(n, en()) }), h('span', { class: 'quick-sub', text: floorLabel(n.floor, en()) })))));
  }
  parts.push(pickerBody(mode));
  return h('div', { class: 'picker' }, ...parts);
}

/** 路线步骤的展示文案 */
function stepTitle(step: RouteStep): string {
  if (step.kind === 'security') { return L('pass_security'); }
  if (step.kind === 'transfer') {
    const fac = facilityLabel(step.facility, en());
    return `${L('take')}${fac} ${L('to_floor')} ${floorLabel(step.toFloor, en())}`;
  }
  if (step.kind === 'destination') {
    const n = place(AIRPORT, step.toId);
    return n === undefined ? L('destination_step') : `${L('arrived_here')} · ${nodeName(n, en())}`;
  }
  const n = place(AIRPORT, step.toId);
  const target = n === undefined ? '' : nodeName(n, en());
  return `${L('walk_to')} ${target}`;
}

function stepAction(step: RouteStep, isLast: boolean): string {
  if (step.kind === 'security') { return L('passed_security'); }
  if (step.kind === 'transfer') { return L('arrived_floor'); }
  if (step.kind === 'destination' || isLast) { return L('finish'); }
  return L('arrived_here');
}

function routeViewOf(): RouteView {
  return buildRouteView(AIRPORT, state.planner.startId, state.planner.endId, state.planner.preference);
}

function routeMetersText(view: RouteView): string {
  const transfers = view.route.transitions.length;
  const bits = [`${L('walking')} ${view.walkingMeters} ${L('meters')}`];
  if (transfers > 0) { bits.push(`${transfers} ${L('transfers')}`); }
  return bits.join(' · ');
}

/** 把当前步骤映射到整条路线的节点下标，供地图高亮 */
function currentRouteIndex(view: RouteView): number {
  if (view.route.nodeIds.length === 0) { return -1; }
  if (state.planner.stage === 'guiding') {
    const step = view.steps[Math.min(state.planner.stepIndex, view.steps.length - 1)];
    if (step !== undefined) {
      const idx = view.route.nodeIds.indexOf(step.toId);
      if (idx >= 0) { return idx; }
    }
  }
  return view.route.nodeIds.length - 1;
}

// ------------------------------------------------------------------ 视图

function homeView(): HTMLElement {
  const popular = HOT_DESTINATIONS.slice(0, 6)
    .map((id) => place(AIRPORT, id))
    .filter((n): n is MapNode => n !== undefined);
  const recent = state.recent
    .map((id) => place(AIRPORT, id))
    .filter((n): n is MapNode => n !== undefined);

  return h('div', { class: 'view' },
    header(L('brand')),
    h('div', { class: 'hero' },
      h('h2', { class: 'hero-title', text: L('home_title') }),
      h('p', { class: 'hero-sub', text: L('home_sub') }),
    ),
    h('div', { class: 'cards' },
      h('button', { class: 'card card-primary', onclick: () => { state.category = 'gate'; state.query = ''; go('target'); } },
        h('span', { class: 'card-icon', text: '✈' }), h('span', { class: 'card-text', text: L('go_gate') })),
      h('button', { class: 'card', onclick: () => go('metro') },
        h('span', { class: 'card-icon', text: '◆' }), h('span', { class: 'card-text', text: L('go_metro') })),
      h('button', { class: 'card', onclick: () => { state.category = 'service'; state.query = ''; go('target'); } },
        h('span', { class: 'card-icon', text: '☕' }), h('span', { class: 'card-text', text: L('go_service') })),
    ),
    h('h2', { class: 'section', text: L('popular') }),
    h('div', { class: 'grid2' }, ...popular.map((n) => h('button', {
      class: 'quick',
      onclick: () => {
        state.planner = newJourney(state.planner, n.id, n.type === 'gate' ? 'gate' : 'all');
        go('start');
      },
    }, h('span', { class: 'quick-name', text: nodeName(n, en()) }), h('span', { class: 'quick-sub', text: floorLabel(n.floor, en()) })))),
    recent.length > 0 ? h('h2', { class: 'section', text: L('recent') }) : null,
    recent.length > 0
      ? h('div', { class: 'list' }, ...recent.map((n) => placeRow(n, () => {
          state.planner = newJourney(state.planner, n.id, 'all');
          go('start');
        })))
      : null,
    h('div', { class: 'actions' },
      h('button', { class: 'btn', onclick: () => { state.pick = ''; state.selectedId = ''; go('browse'); } }, L('floors')),
      h('button', {
        class: 'btn',
        onclick: () => { state.pick = 'end'; state.selectedId = ''; go('browse'); },
      }, L('view_map')),
    ),
    h('p', { class: 'footnote', text: L('sample') }),
  );
}

function targetView(): HTMLElement {
  return h('div', { class: 'view' },
    header(L('target_title'), () => go(state.planner.editing === 'end' ? 'route' : 'home')),
    h('p', { class: 'hint', text: L('target_hint') }),
    picker('target'),
  );
}

function startView(): HTMLElement {
  const target = place(AIRPORT, state.planner.draftEnd);
  const back: ViewName = state.planner.editing === 'start' ? 'route' : 'home';
  return h('div', { class: 'view' },
    header(L('start_title'), () => {
      if (state.planner.editing === 'start') { state.planner = cancelEdit(state.planner); }
      go(back);
    }),
    target !== undefined
      ? h('div', { class: 'selected' },
          h('span', { class: 'selected-label', text: L('selected_target') }),
          h('span', { class: 'selected-name', text: nodeName(target, en()) }))
      : null,
    h('p', { class: 'hint', text: L('start_hint') }),
    picker('start'),
  );
}

function metroView(): HTMLElement {
  const dirs: Array<['city' | 'resort', string, string, string]> = [
    ['city', 'city', 'city_sub', 'xha_b2_platA'],
    ['resort', 'resort', 'resort_sub', 'xha_b2_platB'],
  ];
  return h('div', { class: 'view' },
    header(L('metro_title'), () => go('home')),
    h('h2', { class: 'hero-title small', text: L('metro_heading') }),
    h('p', { class: 'hint', text: L('metro_hint') }),
    h('div', { class: 'cards' }, ...dirs.map(([, nameKey, subKey, targetId]) => h('button', {
      class: 'card',
      onclick: () => {
        const next = newJourney(state.planner, targetId, 'metro');
        setPlanner(choosePlace(next, targetId, false), 'start');
      },
    }, h('span', { class: 'card-icon', text: '◆' }),
       h('span', { class: 'card-stack' },
         h('span', { class: 'card-text', text: L(nameKey) }),
         h('span', { class: 'card-sub', text: L(subKey) }))))),
    h('h2', { class: 'section', text: L('metro_steps') }),
    h('ol', { class: 'steps3' },
      h('li', { text: L('metro_gate') }),
      h('li', { text: L('metro_down') }),
      h('li', { text: L('metro_wait') })),
  );
}

function routePane(): HTMLElement {
  const view = routeViewOf();
  const stage = state.planner.stage;
  const prefLabel = (p: number): string => {
    const keys = ['pref_shortest', 'pref_elevator', 'pref_escalator', 'pref_avoid_stair'];
    return L(keys[p] ?? 'pref_shortest');
  };

  if (view.status !== 'ready') {
    return h('div', { class: 'view' },
      header(L('route_title'), () => go('home')),
      h('div', { class: 'empty' },
        h('p', { class: 'empty-title', text: L(view.status) }),
        h('p', { class: 'empty-sub', text: L('error_hint') })),
      h('div', { class: 'actions' },
        h('button', { class: 'btn btn-primary', onclick: () => { state.query = ''; state.category = 'all'; go('target'); } }, L('choose_again'))),
    );
  }

  const start = place(AIRPORT, state.planner.startId);
  const end = place(AIRPORT, state.planner.endId);
  const step = view.steps[Math.min(state.planner.stepIndex, view.steps.length - 1)];
  const body: Child[] = [];

  body.push(h('div', { class: 'summary' },
    h('div', { class: 'summary-line' },
      h('span', { class: 'dot dot-start' }), h('span', { text: start === undefined ? '' : nodeName(start, en()) })),
    h('div', { class: 'summary-line' },
      h('span', { class: 'dot dot-end' }), h('span', { text: end === undefined ? '' : nodeName(end, en()) })),
    h('p', { class: 'summary-meta', text: routeMetersText(view) }),
    h('p', { class: 'summary-badge' + (view.route.viaSecurity ? ' badge-warn' : ''), text: view.route.viaSecurity ? L('via_security') : L('same_side') }),
  ));

  if (stage === 'preview') {
    body.push(h('div', { class: 'map-host', id: 'map' }));
    body.push(chips([0, 1, 2, 3].map((p) => ({
      key: String(p),
      label: prefLabel(p),
      active: state.planner.preference === p,
      onClick: () => setPlanner(changePreference(state.planner, p)),
    }))));
    body.push(h('div', { class: 'actions' },
      h('button', { class: 'btn btn-primary', onclick: () => setPlanner(startGuidance(state.planner)) }, L('begin')),
      h('button', { class: 'btn', onclick: () => setPlanner(beginEdit(state.planner, 'start'), 'start') }, L('edit_from')),
      h('button', { class: 'btn', onclick: () => setPlanner(beginEdit(state.planner, 'end'), 'target') }, L('edit_to')),
      h('button', { class: 'btn', onclick: () => setPlanner(swapJourney(state.planner)) }, L('swap')),
    ));
  } else if (stage === 'guiding') {
    body.push(h('div', { class: 'map-host', id: 'map' }));
    body.push(h('div', { class: 'step-card' },
      h('div', { class: 'step-head' },
        h('span', { class: 'step-index', text: `${L('step')} ${state.planner.stepIndex + 1}/${view.steps.length}` }),
        h('span', { class: 'step-floor', text: step === undefined ? '' : floorLabel(step.floor, en()) })),
      h('p', { class: 'step-title', text: step === undefined ? '' : stepTitle(step) }),
      step !== undefined && step.meters > 0
        ? h('p', { class: 'step-meters', text: `${step.meters} ${L('meters')}` })
        : null,
      h('p', { class: 'step-hint', text: L('manual') }),
    ));
    body.push(h('div', { class: 'actions' },
      h('button', {
        class: 'btn btn-primary',
        onclick: () => setPlanner(advanceGuidance(state.planner, view.steps.length)),
      }, step === undefined ? L('finish') : stepAction(step, state.planner.stepIndex === view.steps.length - 1)),
      h('button', {
        class: 'btn',
        disabled: state.planner.stepIndex === 0 ? '' : undefined,
        onclick: () => setPlanner(previousStep(state.planner)),
      }, L('previous')),
    ));
  } else {
    body.push(h('div', { class: 'empty' },
      h('p', { class: 'empty-title', text: L('route_complete') }),
      h('p', { class: 'empty-sub', text: L('route_complete_hint') })));
    body.push(h('div', { class: 'actions' },
      h('button', { class: 'btn btn-primary', onclick: () => setPlanner(newJourney(state.planner), 'home') }, L('new_journey'))));
  }

  body.push(h('details', { class: 'all-steps' },
    h('summary', { text: L('all_steps') }),
    h('ol', { class: 'step-list' }, ...view.steps.map((s, i) => h('li', {
      class: i === state.planner.stepIndex && stage === 'guiding' ? 'step-current' : '',
      onclick: () => {
        if (stage === 'guiding') {
          let next = state.planner;
          while (next.stepIndex < i) { next = advanceGuidance(next, view.steps.length); }
          while (next.stepIndex > i) { next = previousStep(next); }
          setPlanner(next);
        }
      },
    }, `${i + 1}. ${stepTitle(s)}`)))));

  return h('div', { class: 'view' }, header(L(stage === 'preview' ? 'route_preview' : stage === 'guiding' ? 'route_guiding' : 'route_title'), () => go('home')), ...body);
}

function browseView(): HTMLElement {
  const floors = AIRPORT.floorOrder;
  const current = state.browseFloor;
  const selected = state.selectedId === '' ? undefined : place(AIRPORT, state.selectedId);
  const nodes = AIRPORT.floorNodes(current).filter((n) => n.type !== 'corridor');

  return h('div', { class: 'view' },
    header(L('browse_title'), () => {
      const back: ViewName = state.pick === 'end' ? 'target' : 'home';
      state.pick = '';
      go(back);
    }),
    h('p', { class: 'hint', text: L('browse_hint') }),
    chips(floors.map((f) => ({
      key: f,
      label: f,
      active: current === f,
      onClick: () => { state.selectedId = ''; state.browseFloor = f; render(); },
    }))),
    h('div', { class: 'map-host tall', id: 'map' }),
    h('div', { class: 'actions compact' },
      h('button', { class: 'btn', onclick: () => state.map?.fitFloor() }, L('full_floor')),
      h('button', { class: 'btn', onclick: () => state.map?.zoomBy(1.35) }, '+'),
      h('button', { class: 'btn', onclick: () => state.map?.zoomBy(0.75) }, '−'),
    ),
    selected !== undefined
      ? h('div', { class: 'detail' },
          h('p', { class: 'detail-name', text: nodeName(selected, en()) }),
          h('p', { class: 'detail-sub', text: `${typeLabel(selected.type, en())} · ${floorLabel(selected.floor, en())}` }),
          h('div', { class: 'actions' },
            h('button', {
              class: 'btn',
              onclick: () => {
                state.map?.setMarkers(selected.id, state.planner.endId);
                toast(L('start_set'));
                state.pick = 'start';
              },
            }, L('pick_start')),
            h('button', {
              class: 'btn btn-primary',
              onclick: () => {
                const next = choosePlace(state.planner, selected.id, false);
                setPlanner(commitJourney(next), 'route');
              },
            }, L('pick_dest')),
          ))
      : h('h2', { class: 'section', text: L('legend') }),
    selected === undefined
      ? h('div', { class: 'list' }, ...nodes.slice(0, 40).map((n) => placeRow(n, () => {
          state.selectedId = n.id;
          render();
        })))
      : null,
  );
}

function currentView(): HTMLElement {
  // 防线：行程回到 editing（例如刚重置）时不该停留在路线页，否则会渲染出"已完成"分支
  if (state.view === 'route' && state.planner.stage === 'editing') {
    state.view = 'home';
  }
  if (state.view === 'target') { return targetView(); }
  if (state.view === 'start') { return startView(); }
  if (state.view === 'route') { return routePane(); }
  if (state.view === 'metro') { return metroView(); }
  if (state.view === 'browse') { return browseView(); }
  return homeView();
}

// ------------------------------------------------------------------ 渲染

function render(): void {
  const root = document.getElementById('app');
  if (root === null) { return; }
  state.map?.destroy();
  state.map = null;
  root.replaceChildren(currentView());
  if (state.toast !== '') {
    root.appendChild(h('div', { class: 'toast', text: state.toast }));
  }

  const host = document.getElementById('map');
  if (host !== null) {
    const needRoute = state.view === 'route';
    const map = createMapView(host, en, {
      onNodeTap: (node) => {
        if (state.view === 'browse') {
          state.selectedId = node.id;
          render();
        }
      },
    });
    state.map = map;
    map.setMarkers(state.planner.startId, state.planner.endId);
    if (needRoute) {
      const view = routeViewOf();
      if (view.status === 'ready') {
        map.setRoute(view.route.nodeIds, currentRouteIndex(view));
      }
      map.setMarkers(state.planner.startId, state.planner.endId);
    } else if (state.view === 'browse') {
      map.setFloor(state.browseFloor);
    }
    map.redraw();
  }
}

render();

// 便于调试：控制台里可直接访问核心与应用状态
(window as unknown as { __airport: unknown }).__airport = { AIRPORT, state };
