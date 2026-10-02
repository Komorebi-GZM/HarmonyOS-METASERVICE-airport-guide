// 目的地分类与快捷目的地。
// 与 ArkTS 端 model/Categories.ets 逐行对应。

import type { MapNode, Category } from './types.ts';

export type { Category };

export const CATEGORIES: Category[] = [
  { key: 'all', nameZh: '全部', nameEn: 'All', symbol: '⌘' },
  { key: 'gate', nameZh: '登机口', nameEn: 'Gates', symbol: '✈' },
  { key: 'checkin', nameZh: '值机·安检', nameEn: 'Check-in', symbol: '✓' },
  { key: 'door', nameZh: '出入口', nameEn: 'Doors', symbol: '⇄' },
  { key: 'baggage', nameZh: '行李', nameEn: 'Baggage', symbol: '◫' },
  { key: 'metro', nameZh: '地铁', nameEn: 'Metro', symbol: '◆' },
  { key: 'transport', nameZh: '接驳交通', nameEn: 'Pickups', symbol: '▣' },
  { key: 'parking', nameZh: '停车·地面', nameEn: 'Parking', symbol: '▤' },
  { key: 'service', nameZh: '商业·服务', nameEn: 'Services', symbol: '☕' },
  { key: 'vertical', nameZh: '换层设施', nameEn: 'Verticals', symbol: '⇕' },
];

const TYPE_CAT: Map<string, string> = new Map<string, string>([
  ['gate', 'gate'],
  ['checkin', 'checkin'],
  ['security', 'checkin'],
  ['entrance', 'door'],
  ['exit', 'door'],
  ['baggage', 'baggage'],
  ['metro', 'metro'],
  ['coach', 'transport'],
  ['parking', 'parking'],
  ['toilet', 'service'],
  ['hall', 'service'],
  ['corridor', 'service'],
  ['lift', 'vertical'],
  ['escalator', 'vertical'],
  ['stair', 'vertical'],
]);

/** 个别跨类型节点按 id 校正分类 */
const ID_CAT: Map<string, string> = new Map<string, string>([
  ['xha_p1_luggage', 'baggage'],
  ['xha_b1_metroL', 'metro'],
  ['xha_b1_metroG', 'metro'],
  ['xha_b2_pasg', 'metro'],
  ['xha_p1_linkG', 'parking'],
  ['xha_b1_gtc', 'transport'],
  ['xha_p1_bus', 'transport'],
]);

export function catOf(n: MapNode): string {
  const byId = ID_CAT.get(n.id);
  if (byId !== undefined) {
    return byId;
  }
  const byType = TYPE_CAT.get(n.type);
  return byType === undefined ? 'service' : byType;
}

export function catName(key: string, en: boolean): string {
  for (const c of CATEGORIES) {
    if (c.key === key) {
      return en ? c.nameEn : c.nameZh;
    }
  }
  return key;
}

export function catSymbol(key: string): string {
  for (const c of CATEGORIES) {
    if (c.key === key) {
      return c.symbol;
    }
  }
  return '•';
}

/** 快捷目的地：总览页「高频直达」，展示优先序 */
export const HOT_DESTINATIONS: string[] = [
  'xha_p4_doorW', 'xha_p4_doorN', 'xha_p4_doorE',
  'xha_p4_sec',
  'xha_p4_airMall', 'xha_p3_food', 'xha_p3_loungeA',
  'xha_p4_gA101', 'xha_p4_gC308',
  'xha_b2_platA', 'xha_b2_platB',
  'xha_p2_bagA', 'xha_p1_taxi', 'xha_b1_gtc',
];
