// 星海机场导航 · Web/PWA 客户端
//
// 本文件只做两件事：把共享核心的状态渲染成 DOM、把用户操作转发给共享核心。
// 六页流程、状态转移、文案、列表、绘制命令全部来自 @airport-guide/core
// （与微信小程序、macOS/iOS 端共用同一份实现），这里不再有第二份状态机。

import {
  AIRPORT, AppModel, CATEGORIES, HOT_DESTINATIONS,
  allSteps, categoryChips, listedPlaces, meters, metroDirections, metroSteps,
  place, popularCards, preferenceChips, quickStartCards, rowSubtitle, rowTitle,
  searchPlaces, statusTitle, stepAction, stepTitle, summary, t, floorLabel,
} from '@core';
import type { AppView, MapNode, RouteView } from '@core';
import { createMapView } from './map-view.ts';
import type { MapView } from './map-view.ts';
import { LocalStore } from './storage.ts';
import './styles.css';

const model = new AppModel(AIRPORT, new LocalStore());

function en(): boolean {
  return model.en;
}

function L(key: string): string {
  return t(key, en());
}

/** 统一入口：执行一个动作后重绘 */
function act(fn: () => void): void {
  fn();
  render();
}

let toastTimer = 0;

/** 模型设置的提示统一在这里显示并自动消失（避免每个页面各写一遍定时器） */
function scheduleToastClear(): void {
  if (model.state.toast === '') { return; }
  const message = model.state.toast;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    if (model.state.toast === message) {
      model.clearToast();
      render();
    }
  }, 2600);
}

// ------------------------------------------------------------------ DOM 小工具

type Child = Node | string | null | undefined | false;

function h(tag: string, attrs: Record<string, unknown> = {}, ...children: Child[]): HTMLElement {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) { continue; }
    if (k === 'class') { el.className = String(v); }
    else if (k === 'text') { el.textContent = String(v); }
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

// ------------------------------------------------------------------ 通用片段

function header(title: string, onBack?: () => void): HTMLElement {
  return h('header', { class: 'top' },
    onBack !== undefined
      ? h('button', { class: 'icon-btn', 'aria-label': L('back'), onclick: () => act(onBack) }, '‹')
      : h('div', { class: 'brand' }, L('brand')),
    h('h1', { class: 'top-title' }, title),
    h('button', {
      class: 'lang-btn',
      onclick: () => act(() => model.toggleLanguage()),
    }, en() ? '中' : 'EN'),
  );
}

function placeRow(node: MapNode, action: () => void): HTMLElement {
  return h('button', { class: 'row', onclick: () => act(action) },
    h('span', {
      class: 'row-symbol',
      text: CATEGORIES.find((c) => c.key === (node.type === 'gate' ? 'gate' : 'all'))?.symbol ?? '•',
    }),
    h('span', { class: 'row-main' },
      h('span', { class: 'row-name', text: rowTitle(node, en()) }),
      h('span', { class: 'row-sub', text: rowSubtitle(node, en()) }),
    ),
    h('span', { class: 'row-arrow', text: '›' }),
  );
}

function chips(items: Array<{ key: string; label: string; active?: boolean; onClick: () => void }>): HTMLElement {
  return h('div', { class: 'chips' }, ...items.map((i) => h('button', {
    class: 'chip' + (i.active === true ? ' chip-active' : ''),
    onclick: () => act(i.onClick),
  }, i.label)));
}

function quickCards(cards: Array<{ id: string; title: string; subtitle: string }>, onPick: (id: string) => void): HTMLElement {
  return h('div', { class: 'grid2' }, ...cards.map((card) => h('button', {
    class: 'quick',
    onclick: () => act(() => onPick(card.id)),
  },
    h('span', { class: 'quick-name', text: card.title }),
    h('span', { class: 'quick-sub', text: card.subtitle }),
  )));
}

/** 目的地 / 出发位置共用的列表（输入时只替换列表，输入框不重建，焦点不丢） */
function pickerBody(mode: 'target' | 'start'): HTMLElement {
  const isTarget = mode === 'target';
  const { query, category } = model.state;
  const list = isTarget && (query.trim().length > 0 || category !== 'all')
    ? searchPlaces(AIRPORT, query, category)
    : listedPlaces(AIRPORT, isTarget ? category : 'all');

  return h('div', { class: 'picker-body' },
    list.length === 0
      ? h('div', { class: 'empty' },
          h('p', { class: 'empty-title', text: L('no_results') }),
          h('p', { class: 'empty-sub', text: L('no_results_hint') }))
      : h('div', { class: 'list' }, ...list.slice(0, 60).map((node) => placeRow(node, () => {
          if (isTarget) { model.chooseTarget(node.id); } else { model.chooseStart(node.id); }
        }))),
  );
}

function picker(mode: 'target' | 'start'): HTMLElement {
  const isTarget = mode === 'target';
  const searchBox = h('input', {
    class: 'search',
    type: 'search',
    placeholder: L('search'),
    value: isTarget ? model.state.query : '',
    oninput: (ev: Event) => {
      if (!isTarget) { return; }
      model.setQuery((ev.target as HTMLInputElement).value);
      const host = document.querySelector('.picker-body');
      if (host !== null) { host.replaceWith(pickerBody(mode)); }
    },
  }) as HTMLInputElement;

  const parts: Child[] = [];
  if (isTarget) {
    parts.push(chips(categoryChips(en()).map((c) => ({
      key: c.key,
      label: c.label,
      active: model.state.category === c.key,
      onClick: () => model.setCategory(c.key),
    }))));
  }
  parts.push(searchBox);
  if (isTarget && model.state.query.length > 0) {
    parts.push(h('button', { class: 'link', onclick: () => act(() => model.setQuery('')) }, L('clear')));
  }
  if (!isTarget) {
    parts.push(h('h2', { class: 'section', text: L('quick_starts') }));
    parts.push(quickCards(quickStartCards(en()), (id) => model.chooseStart(id)));
  }
  parts.push(pickerBody(mode));
  return h('div', { class: 'picker' }, ...parts);
}

function summaryCard(view: RouteView): HTMLElement {
  const start = place(AIRPORT, model.state.planner.startId);
  const end = place(AIRPORT, model.state.planner.endId);
  return h('div', { class: 'summary' },
    h('div', { class: 'summary-line' },
      h('span', { class: 'dot dot-start' }),
      h('span', { text: start === undefined ? '' : rowTitle(start, en()) })),
    h('div', { class: 'summary-line' },
      h('span', { class: 'dot dot-end' }),
      h('span', { text: end === undefined ? '' : rowTitle(end, en()) })),
    h('p', { class: 'summary-meta', text: summary(view, en()) }),
    h('p', {
      class: 'summary-badge' + (view.route.viaSecurity ? ' badge-warn' : ''),
      text: L(view.route.viaSecurity ? 'via_security' : 'same_side'),
    }),
  );
}

// ------------------------------------------------------------------ 视图

function homeView(): HTMLElement {
  const recent = model.state.recent
    .map((id) => place(AIRPORT, id))
    .filter((n): n is MapNode => n !== undefined);

  return h('div', { class: 'view' },
    header(L('brand')),
    h('div', { class: 'hero' },
      h('h2', { class: 'hero-title', text: L('home_title') }),
      h('p', { class: 'hero-sub', text: L('home_sub') })),
    h('div', { class: 'cards' },
      h('button', { class: 'card card-primary', onclick: () => act(() => model.startTargetFlow('gate')) },
        h('span', { class: 'card-icon', text: '✈' }), h('span', { class: 'card-text', text: L('go_gate') })),
      h('button', { class: 'card', onclick: () => act(() => model.startMetroFlow()) },
        h('span', { class: 'card-icon', text: '◆' }), h('span', { class: 'card-text', text: L('go_metro') })),
      h('button', { class: 'card', onclick: () => act(() => model.startTargetFlow('service')) },
        h('span', { class: 'card-icon', text: '☕' }), h('span', { class: 'card-text', text: L('go_service') }))),
    h('h2', { class: 'section', text: L('popular') }),
    quickCards(popularCards(en(), HOT_DESTINATIONS.length), (id) => model.chooseDestinationFromHome(id)),
    recent.length > 0 ? h('h2', { class: 'section', text: L('recent') }) : null,
    recent.length > 0
      ? h('div', { class: 'list' }, ...recent.map((node) => placeRow(node, () => model.chooseDestinationFromHome(node.id))))
      : null,
    h('div', { class: 'actions' },
      h('button', { class: 'btn', onclick: () => act(() => model.openBrowse()) }, L('floors')),
      h('button', { class: 'btn', onclick: () => act(() => model.openBrowseForDestination()) }, L('view_map'))),
    h('p', { class: 'footnote', text: L('sample') }),
  );
}

function targetView(): HTMLElement {
  return h('div', { class: 'view' },
    header(L('target_title'), () => model.backFromTarget()),
    h('p', { class: 'hint', text: L('target_hint') }),
    picker('target'),
  );
}

function startView(): HTMLElement {
  const target = place(AIRPORT, model.state.planner.draftEnd);
  return h('div', { class: 'view' },
    header(L('start_title'), () => model.backFromStart()),
    target !== undefined
      ? h('div', { class: 'selected' },
          h('span', { class: 'selected-label', text: L('selected_target') }),
          h('span', { class: 'selected-name', text: rowTitle(target, en()) }))
      : null,
    h('p', { class: 'hint', text: L('start_hint') }),
    picker('start'),
  );
}

function metroView(): HTMLElement {
  return h('div', { class: 'view' },
    header(L('metro_title'), () => model.backHome()),
    h('h2', { class: 'hero-title small', text: L('metro_heading') }),
    h('p', { class: 'hint', text: L('metro_hint') }),
    h('div', { class: 'cards' }, ...metroDirections(en()).map((direction) => h('button', {
      class: 'card',
      onclick: () => act(() => model.chooseMetroDirection(direction.targetId)),
    },
      h('span', { class: 'card-icon', text: '◆' }),
      h('span', { class: 'card-stack' },
        h('span', { class: 'card-text', text: direction.title }),
        h('span', { class: 'card-sub', text: direction.subtitle }))))),
    h('h2', { class: 'section', text: L('metro_steps') }),
    h('ol', { class: 'steps3' }, ...metroSteps(en()).map((text) => h('li', { text }))),
  );
}

function routePane(): HTMLElement {
  const view = model.routeView;
  const stage = model.state.planner.stage;
  const titleKey = stage === 'preview' ? 'route_preview' : stage === 'guiding' ? 'route_guiding' : 'route_title';

  if (view.status !== 'ready') {
    return h('div', { class: 'view' },
      header(L('route_title'), () => model.backHome()),
      h('div', { class: 'empty' },
        h('p', { class: 'empty-title', text: statusTitle(view.status, en()) }),
        h('p', { class: 'empty-sub', text: L('error_hint') })),
      h('div', { class: 'actions' },
        h('button', { class: 'btn btn-primary', onclick: () => act(() => model.startTargetFlow('all')) }, L('choose_again'))),
    );
  }

  const body: Child[] = [summaryCard(view)];

  if (stage !== 'completed') {
    body.push(h('div', { class: 'map-host', id: 'map' }));
  }

  if (stage === 'preview') {
    body.push(chips(preferenceChips(en()).map((c) => ({
      key: c.key,
      label: c.label,
      active: String(model.state.planner.preference) === c.key,
      onClick: () => model.setPreference(Number(c.key)),
    }))));
    body.push(h('div', { class: 'actions' },
      h('button', { class: 'btn btn-primary', onclick: () => act(() => model.beginGuidance()) }, L('begin')),
      h('button', { class: 'btn', onclick: () => act(() => model.editStart()) }, L('edit_from')),
      h('button', { class: 'btn', onclick: () => act(() => model.editDestination()) }, L('edit_to')),
      h('button', { class: 'btn', onclick: () => act(() => model.swap()) }, L('swap'))));
  } else if (stage === 'guiding') {
    const step = model.currentStep;
    const index = model.state.planner.stepIndex;
    body.push(h('div', { class: 'step-card' },
      h('div', { class: 'step-head' },
        h('span', { class: 'step-index', text: `${L('step')} ${index + 1}/${view.steps.length}` }),
        h('span', { class: 'step-floor', text: step === undefined ? '' : floorLabel(step.floor, en()) })),
      h('p', { class: 'step-title', text: step === undefined ? '' : stepTitle(step, en()) }),
      step !== undefined && step.meters > 0
        ? h('p', { class: 'step-meters', text: `${meters(step.meters)} ${L('meters')}` })
        : null,
      h('p', { class: 'step-hint', text: L('manual') })));
    body.push(h('div', { class: 'actions' },
      h('button', {
        class: 'btn btn-primary',
        onclick: () => act(() => model.advance()),
      }, step === undefined ? L('finish') : stepAction(step, index === view.steps.length - 1, en())),
      h('button', {
        class: 'btn',
        disabled: index === 0 ? '' : undefined,
        onclick: () => act(() => model.previous()),
      }, L('previous'))));
  } else {
    body.push(h('div', { class: 'empty' },
      h('p', { class: 'empty-title', text: L('route_complete') }),
      h('p', { class: 'empty-sub', text: L('route_complete_hint') })));
    body.push(h('div', { class: 'actions' },
      h('button', { class: 'btn btn-primary', onclick: () => act(() => model.restart()) }, L('new_journey'))));
  }

  body.push(h('details', { class: 'all-steps' },
    h('summary', { text: L('all_steps') }),
    h('ol', { class: 'step-list' }, ...allSteps(view, en()).map((text, i) => h('li', {
      class: i === model.state.planner.stepIndex && stage === 'guiding' ? 'step-current' : '',
      onclick: () => act(() => model.jumpToStep(i)),
    }, text)))));

  return h('div', { class: 'view' }, header(L(titleKey), () => model.backHome()), ...body);
}

function browseView(): HTMLElement {
  const floors = AIRPORT.floorOrder;
  const current = model.state.browseFloor;
  const selected = model.state.selectedId === '' ? undefined : place(AIRPORT, model.state.selectedId);
  const nodes = AIRPORT.floorNodes(current).filter((n) => n.type !== 'corridor');

  return h('div', { class: 'view' },
    header(L('browse_title'), () => model.backFromBrowse()),
    h('p', { class: 'hint', text: L('browse_hint') }),
    chips(floors.map((f) => ({
      key: f,
      label: f,
      active: current === f,
      onClick: () => model.setBrowseFloor(f),
    }))),
    h('div', { class: 'map-host tall', id: 'map' }),
    h('div', { class: 'actions compact' },
      h('button', { class: 'btn', onclick: () => map?.fitFloor() }, L('full_floor')),
      h('button', { class: 'btn', onclick: () => map?.zoomBy(1.35) }, '+'),
      h('button', { class: 'btn', onclick: () => map?.zoomBy(0.75) }, '−')),
    selected !== undefined
      ? h('div', { class: 'detail' },
          h('p', { class: 'detail-name', text: rowTitle(selected, en()) }),
          h('p', { class: 'detail-sub', text: rowSubtitle(selected, en()) }),
          h('div', { class: 'actions' },
            h('button', {
              class: 'btn',
              onclick: () => {
                act(() => model.setStartFromMap(selected.id));
                map?.setMarkers(selected.id, model.state.planner.endId);
              },
            }, L('pick_start')),
            h('button', {
              class: 'btn btn-primary',
              onclick: () => act(() => model.routeToFromMap(selected.id)),
            }, L('pick_dest'))))
      : h('h2', { class: 'section', text: L('legend') }),
    selected === undefined
      ? h('div', { class: 'list' }, ...nodes.slice(0, 40).map((node) => placeRow(node, () => model.selectNode(node.id))))
      : null,
  );
}

function currentView(): HTMLElement {
  const view: AppView = model.state.view;
  if (view === 'target') { return targetView(); }
  if (view === 'start') { return startView(); }
  if (view === 'route') { return routePane(); }
  if (view === 'metro') { return metroView(); }
  if (view === 'browse') { return browseView(); }
  return homeView();
}

// ------------------------------------------------------------------ 渲染

let map: MapView | null = null;

function render(): void {
  const root = document.getElementById('app');
  if (root === null) { return; }
  map?.destroy();
  map = null;
  root.replaceChildren(currentView());
  if (model.state.toast !== '') {
    root.appendChild(h('div', { class: 'toast', text: model.state.toast }));
    scheduleToastClear();
  }

  const host = document.getElementById('map');
  if (host !== null) {
    map = createMapView(host, en, {
      onNodeTap: (node) => act(() => model.selectNode(node.id)),
    });
    map.setMarkers(model.state.planner.startId, model.state.planner.endId);
    if (model.state.view === 'route') {
      const view = model.routeView;
      if (view.status === 'ready') {
        map.setRoute(view.route.nodeIds, model.currentRouteIndex);
        map.setMarkers(model.state.planner.startId, model.state.planner.endId);
      }
    } else if (model.state.view === 'browse') {
      map.setFloor(model.state.browseFloor);
    }
    map.redraw();
  }
}

render();

// PWA：生产构建下注册 service worker（离线可用）。开发模式下不注册，避免缓存干扰调试。
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // 注册失败不影响在线使用（本应用本身无网络请求）
    });
  });
}

// 便于调试与控制台验证
(window as unknown as { __airport: unknown }).__airport = {
  model,
  AIRPORT,
  get view(): string { return model.state.view; },
};
