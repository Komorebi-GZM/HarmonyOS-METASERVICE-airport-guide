// 双语与语义文案。
// 复合了 ArkTS 端的 model/Loc.ets（UI 文案 112 条）与 model/Localization.ets（类型/楼层/节点名）。
// 文案真源仍是 Loc.ets —— 本文件读的是 tools/export_shared.py 从它导出的 generated/i18n-data.ts。

import { TEXTS } from './generated/i18n-data.ts';
import {
  TYPE_ZH, TYPE_EN, FLOOR_LABELS, FLOOR_LABELS_EN, NODE_EN,
} from './generated/labels.ts';
import type { MapNode } from './types.ts';

const ZH = new Map<string, string>();
const EN = new Map<string, string>();
for (const t of TEXTS) {
  ZH.set(t.key, t.zh);
  EN.set(t.key, t.en);
}

export const LOC_KEYS: string[] = TEXTS.map((t) => t.key);

/** 文案查表；未命中回落 key 本身（与 ArkTS Loc.t 一致） */
export function t(key: string, en: boolean): string {
  const text = (en ? EN : ZH).get(key);
  return text === undefined ? key : text;
}

export function hasKey(key: string): boolean {
  return ZH.has(key);
}

/** 楼层全名：4F -> 出发层 / Departures */
export function floorLabel(floor: string, en: boolean): string {
  const text = (en ? FLOOR_LABELS_EN : FLOOR_LABELS)[floor];
  return text === undefined ? floor : text;
}

export function floorShort(floor: string): string {
  return floor;
}

export function typeLabel(type: string, en: boolean): string {
  const m = en ? TYPE_EN : TYPE_ZH;
  const v = m[type];
  return v === undefined ? type : v;
}

/** 节点显示名：优先英文（生成表），缺失回落中文；安检节点特殊处理 */
export function nodeName(n: MapNode, en: boolean): string {
  if (n.type === 'security') {
    return en ? 'Central Security' : '中央安检大厅';
  }
  if (en) {
    const e = NODE_EN[n.id];
    return e === undefined ? n.name : e;
  }
  return n.name;
}

export function nodeNameEn(id: string, fallback: string): string {
  const e = NODE_EN[id];
  return e === undefined ? fallback : e;
}

export function floorOrder(): string[] {
  return Object.keys(FLOOR_LABELS);
}

/** 换层设施的中文/英文名（电梯/扶梯/楼梯/捷运），用于步骤文案 */
export function facilityLabel(viaType: string, en: boolean): string {
  if (viaType === 'elevator') { return t('elevator', en); }
  if (viaType === 'escalator') { return t('escalator', en); }
  if (viaType === 'stair') { return t('stair', en); }
  return viaType;
}

export const I18N_KEYS = { ZH, EN };
