// 目标分类 + 搜索：先把「目的地」归入 9 大分类，再在中文名/英文名上做子串检索
// ArkTS 禁用 Record 对象字面量 -> 类型/ID 分类映射用 Map
import { MapNode, NODE_EN } from './AirportMap';

export interface Category {
  key: string;
  nameZh: string;
  nameEn: string;
  symbol: string; // 行首装饰
}

// 分类 tab（需求文档 §4.3 映射表）
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

// 类型 -> 分类键（基础映射）
const TYPE_CAT: Map<string, string> = new Map<string, string>();
TYPE_CAT.set('gate', 'gate');
TYPE_CAT.set('checkin', 'checkin');
TYPE_CAT.set('security', 'checkin');
TYPE_CAT.set('entrance', 'door');
TYPE_CAT.set('exit', 'door');
TYPE_CAT.set('baggage', 'baggage');
TYPE_CAT.set('metro', 'metro');
TYPE_CAT.set('coach', 'transport');
TYPE_CAT.set('parking', 'parking');
TYPE_CAT.set('toilet', 'service');
TYPE_CAT.set('hall', 'service');
TYPE_CAT.set('corridor', 'service');
TYPE_CAT.set('lift', 'vertical');
TYPE_CAT.set('escalator', 'vertical');
TYPE_CAT.set('stair', 'vertical');

// 个别跨类型节点按 id 校正分类（数据里语义归并入更贴切的分类）
const ID_CAT: Map<string, string> = new Map<string, string>();
ID_CAT.set('xha_p1_luggage', 'baggage');      // 行李寄存处
ID_CAT.set('xha_b1_metroL', 'metro');         // 地铁站厅(非付费区)
ID_CAT.set('xha_b1_metroG', 'metro');         // 地铁闸机群
ID_CAT.set('xha_b2_pasg', 'metro');           // 站台联络通道
ID_CAT.set('xha_p1_linkG', 'parking');        // 航站楼间连廊（连接停车楼/地面）
ID_CAT.set('xha_b1_gtc', 'transport');        // 交通中心大厅
ID_CAT.set('xha_p1_bus', 'transport');        // 机场巴士站台

// 节点 -> 分类键
export function catOf(n: MapNode): string {
  const byId = ID_CAT.get(n.id);
  if (byId !== undefined) {
    return byId;
  }
  const byType = TYPE_CAT.get(n.type);
  return byType === undefined ? 'service' : byType;
}

export function catName(key: string, en: boolean): string {
  for (let i = 0; i < CATEGORIES.length; i++) {
    if (CATEGORIES[i].key === key) {
      return en ? CATEGORIES[i].nameEn : CATEGORIES[i].nameZh;
    }
  }
  return key;
}

// 分类符号（列表行首装饰）
export function catSymbol(key: string): string {
  for (let i = 0; i < CATEGORIES.length; i++) {
    if (CATEGORIES[i].key === key) {
      return CATEGORIES[i].symbol;
    }
  }
  return '•';
}

// 搜索/过滤：q 为空 -> 命中；否则中文名或英文名含子串（大小写不敏感）
export function matches(n: MapNode, q: string): boolean {
  if (q.length === 0) {
    return true;
  }
  const name = n.name;
  if (name.indexOf(q) >= 0) {
    return true;
  }
  const en = NODE_EN.get(n.id);
  if (en !== undefined && en.toLowerCase().indexOf(q.toLowerCase()) >= 0) {
    return true;
  }
  return false;
}

// 快捷目的地：总览页「高频直达」，展示优先序
export const HOT_DESTINATIONS: string[] = [
  'xha_p4_doorW', 'xha_p4_doorN', 'xha_p4_doorE',          // 出发
  'xha_p4_sec',                                            // 安检（必经）
  'xha_p4_airMall', 'xha_p3_food', 'xha_p3_loungeA',       // 空侧服务
  'xha_p4_gA101', 'xha_p4_gC308',                          // 登机口
  'xha_b2_platA', 'xha_b2_platB',                          // 地铁
  'xha_p2_bagA', 'xha_p1_taxi', 'xha_b1_gtc',              // 到港接驳
];