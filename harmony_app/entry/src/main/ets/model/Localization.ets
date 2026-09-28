// 语义文案：类型标签（中/英）、楼层名、节点名（含英文兜底）
// ArkTS 禁用 Record 对象字面量 -> 类型双语表用 Map
import { MapNode, FLOOR_LABELS, FLOOR_LABELS_EN, NODE_EN, FLOOR_ORDER } from './AirportMap';

// 节点类型 -> 中文标签（列表与图例共用）
export const TYPE_ZH: Map<string, string> = new Map<string, string>();
TYPE_ZH.set('entrance', '出发门');
TYPE_ZH.set('exit', '到达出口');
TYPE_ZH.set('checkin', '值机/自助');
TYPE_ZH.set('security', '安检');
TYPE_ZH.set('gate', '登机口');
TYPE_ZH.set('lift', '电梯');
TYPE_ZH.set('escalator', '扶梯');
TYPE_ZH.set('stair', '楼梯');
TYPE_ZH.set('metro', '地铁');
TYPE_ZH.set('coach', '大巴/出租');
TYPE_ZH.set('parking', '停车');
TYPE_ZH.set('baggage', '行李提取');
TYPE_ZH.set('toilet', '洗手间');
TYPE_ZH.set('hall', '大厅/商业');
TYPE_ZH.set('corridor', '通道/中转');

export const TYPE_EN: Map<string, string> = new Map<string, string>();
TYPE_EN.set('entrance', 'Departure Gate');
TYPE_EN.set('exit', 'Arrival Exit');
TYPE_EN.set('checkin', 'Check-in');
TYPE_EN.set('security', 'Security');
TYPE_EN.set('gate', 'Gate');
TYPE_EN.set('lift', 'Elevator');
TYPE_EN.set('escalator', 'Escalator');
TYPE_EN.set('stair', 'Stairs');
TYPE_EN.set('metro', 'Metro');
TYPE_EN.set('coach', 'Coach/Taxi');
TYPE_EN.set('parking', 'Parking');
TYPE_EN.set('baggage', 'Baggage');
TYPE_EN.set('toilet', 'Restroom');
TYPE_EN.set('hall', 'Hall/Shopping');
TYPE_EN.set('corridor', 'Walkway');

export function typeLabel(type: string, en: boolean): string {
  const m = en ? TYPE_EN : TYPE_ZH;
  const t = m.get(type);
  return t === undefined ? type : t;
}

// 楼层：中文名/英文名/简称
export function floorName(floor: string, en: boolean): string {
  const m = en ? FLOOR_LABELS_EN : FLOOR_LABELS;
  const t = m.get(floor);
  return t === undefined ? floor : t;
}

export function floorShort(floor: string): string {
  return floor; // 4F/B1 等本身已是短标签
}

// 节点显示名：优先英文(生成表)，缺失回落中文
export function nodeName(n: MapNode, en: boolean): string {
  if (en) {
    const e = NODE_EN.get(n.id);
    return e === undefined ? n.name : e;
  }
  return n.name;
}

export function floorOrder(): string[] {
  return FLOOR_ORDER;
}