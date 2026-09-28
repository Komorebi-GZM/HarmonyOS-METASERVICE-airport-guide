// 主题色与类型色：浅色地图面 + 深青应用皮肤
// 类型色与 tools/preview_nodes.py 一致，保证预览/装机观感统一
// ArkTS：对象字面量必须对应显式声明的接口 -> 色板用接口注解；配色字典用 Map

export interface AppPalette {
  bg: string;
  card: string;
  card2: string;
  line: string;
  text: string;
  sub: string;
  accent: string;
  accentSoft: string;
  gold: string;
  gtext: string;
}

export const APP: AppPalette = {
  bg: '#0F1F2E',     // 深青夜航底
  card: '#16344B',   // 卡片
  card2: '#1D3E58',  // 次级卡片/浮层
  line: '#274A64',   // 描边
  text: '#F2F6FB',   // 主文案
  sub: '#93A7BF',    // 次文案
  accent: '#3E8BE5', // 主强调（蓝）
  accentSoft: '#7FB2EF',
  gold: '#E5B257',   // 安检/必经要点强调
  gtext: '#FFE9B0',
};

export interface MapPalette {
  surface: string;
  grid: string;
  ink: string;
  ink2: string;
  muted: string;
  corridor: string;
  landWash: string;
  airWash: string;
}

export const MAP: MapPalette = {
  surface: '#FCFCFB', // 地图纸面
  grid: '#ECE9E0',    // 网格线
  ink: '#141414',     // 墨色主
  ink2: '#5A5752',    // 次墨
  muted: '#8C8983',   // 淡墨
  corridor: '#B6AFA2',// 通道带
  landWash: '#F7F3E8',// 陆侧暖底
  airWash: '#F1F6FC', // 空侧冷底
};

// 节点类型配色（与 preview_nodes.py 一致）
export const TYPE_COLOR: Map<string, string> = new Map<string, string>();
TYPE_COLOR.set('entrance', '#0A8F3C');   // 出发门：绿
TYPE_COLOR.set('exit', '#0A8F3C');       // 到达出口：绿
TYPE_COLOR.set('checkin', '#B5731F');    // 值机：金棕
TYPE_COLOR.set('security', '#E34948');   // 安检：警示红（必经）
TYPE_COLOR.set('gate', '#2A78D6');       // 登机口：蓝
TYPE_COLOR.set('lift', '#EB6834');       // 电梯：橙
TYPE_COLOR.set('escalator', '#EB6834');  // 扶梯：橙
TYPE_COLOR.set('stair', '#73716A');      // 楼梯：灰
TYPE_COLOR.set('metro', '#5B4A9E');      // 地铁：紫
TYPE_COLOR.set('coach', '#A5522F');      // 大巴/出租：赭
TYPE_COLOR.set('parking', '#4E8E86');    // 停车：蓝绿
TYPE_COLOR.set('baggage', '#008E97');    // 行李：青
TYPE_COLOR.set('toilet', '#2E9E9E');     // 洗手间：青绿
TYPE_COLOR.set('hall', '#C07A2E');       // 大厅/商业：琥珀
TYPE_COLOR.set('corridor', '#85806F');   // 通道/中转：橄榄

export interface RoutePalette {
  color: string;
  case: string;
  trans: string;
}

export const ROUTE: RoutePalette = {
  color: '#E34948',   // 路线主线：与安检同色，强化「必经安检」叙事
  case: '#FFFFFF',    // 白色描边
  trans: 'rgba(227,73,72,0.30)', // 换层段落描边
};

// 按住/命中提示色
export const HIT = '#3E8BE5';