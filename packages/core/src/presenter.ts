// 呈现层（平台无关）：把核心数据翻译成界面要显示的文字与列表。
// Web / 小程序共用；Apple 端有等价的 Swift 实现（apps/apple/Sources/AirportUI/Presenter.swift）。

import { AIRPORT } from './graph.ts';
import type { RouteStep, RouteStatus, RouteView, MapNode } from './types.ts';
import { t, typeLabel, floorLabel, facilityLabel, nodeName } from './i18n.ts';
import { QUICK_STARTS } from './pathfinder.ts';
import { CATEGORIES, HOT_DESTINATIONS } from './categories.ts';
import type { Category } from './types.ts';
import { gateCode } from './places.ts';

export interface PlaceCard {
  id: string;
  title: string;
  subtitle: string;
}

export interface Chip {
  key: string;
  label: string;
}

export interface MetroDirection {
  targetId: string;
  title: string;
  subtitle: string;
}

/** 米数：整数不带小数点 */
export function meters(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

/** 路线概要："步行约 325 米 · 1 次换层" */
export function summary(view: RouteView, en: boolean): string {
  const parts = [`${t('walking', en)} ${meters(view.walkingMeters)} ${t('meters', en)}`];
  const transfers = view.route.transitions.length;
  if (transfers > 0) {
    parts.push(`${transfers} ${t('transfers', en)}`);
  }
  return parts.join(' · ');
}

export function stepTitle(step: RouteStep, en: boolean): string {
  if (step.kind === 'security') { return t('pass_security', en); }
  if (step.kind === 'transfer') {
    // 英文需要空格分隔（ArkTS 原文 "Take"+"elevator" 会拼成 Takeelevator，见 docs/TODO.md T-014）
    const join = en ? ' ' : '';
    return `${t('take', en)}${join}${facilityLabel(step.facility, en)} ${t('to_floor', en)} ${floorLabel(step.toFloor, en)}`;
  }
  if (step.kind === 'destination') {
    const node = AIRPORT.node(step.toId);
    return node === undefined ? t('destination_step', en) : `${t('arrived_here', en)} · ${nodeName(node, en)}`;
  }
  const node = AIRPORT.node(step.toId);
  return `${t('walk_to', en)} ${node === undefined ? '' : nodeName(node, en)}`;
}

export function stepAction(step: RouteStep, isLast: boolean, en: boolean): string {
  if (step.kind === 'security') { return t('passed_security', en); }
  if (step.kind === 'transfer') { return t('arrived_floor', en); }
  if (step.kind === 'destination' || isLast) { return t('finish', en); }
  return t('arrived_here', en);
}

export function preferenceLabel(index: number, en: boolean): string {
  const keys = ['pref_shortest', 'pref_elevator', 'pref_escalator', 'pref_avoid_stair'];
  return t(keys[index] ?? 'pref_shortest', en);
}

export function preferenceChips(en: boolean): Chip[] {
  return [0, 1, 2, 3].map((i) => ({ key: String(i), label: preferenceLabel(i, en) }));
}

export function statusTitle(status: RouteStatus, en: boolean): string {
  return t(status, en);
}

export function categoryChips(en: boolean): Chip[] {
  return CATEGORIES.map((c: Category) => ({
    key: c.key,
    label: `${c.symbol} ${en ? c.nameEn : c.nameZh}`,
  }));
}

export function rowTitle(node: MapNode, en: boolean): string {
  return nodeName(node, en);
}

export function rowSubtitle(node: MapNode, en: boolean): string {
  const parts = [typeLabel(node.type, en), floorLabel(node.floor, en)];
  const code = gateCode(node);
  if (code !== '') { parts.push(code.toUpperCase()); }
  return parts.join(' · ');
}

export function popularCards(en: boolean, limit = 6): PlaceCard[] {
  const out: PlaceCard[] = [];
  for (const id of HOT_DESTINATIONS.slice(0, limit)) {
    const node = AIRPORT.node(id);
    if (node !== undefined) {
      out.push({ id, title: nodeName(node, en), subtitle: floorLabel(node.floor, en) });
    }
  }
  return out;
}

export function quickStartCards(en: boolean): PlaceCard[] {
  const out: PlaceCard[] = [];
  for (const id of QUICK_STARTS) {
    const node = AIRPORT.node(id);
    if (node !== undefined) {
      out.push({ id, title: nodeName(node, en), subtitle: floorLabel(node.floor, en) });
    }
  }
  return out;
}

export function metroDirections(en: boolean): MetroDirection[] {
  return [
    { targetId: 'xha_b2_platA', title: t('city', en), subtitle: t('city_sub', en) },
    { targetId: 'xha_b2_platB', title: t('resort', en), subtitle: t('resort_sub', en) },
  ];
}

export function metroSteps(en: boolean): string[] {
  return ['metro_gate', 'metro_down', 'metro_wait'].map((k) => t(k, en));
}

export function allSteps(view: RouteView, en: boolean): string[] {
  return view.steps.map((step, index) => `${index + 1}. ${stepTitle(step, en)}`);
}
