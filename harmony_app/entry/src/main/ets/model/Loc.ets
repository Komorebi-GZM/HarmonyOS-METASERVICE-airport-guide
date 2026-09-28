// 全局文案表：运行时中/英切换（不依赖系统语言，元服务内自控）
// key 与 resources/base|en_US/element/string.json 命名对齐，便于将来并轨
// ArkTS 禁用 Record 对象字面量 -> 用 Map.set 逐条写入；两表键必须一一对应（有审计脚本兜底）
import { FLOOR_LABELS, FLOOR_LABELS_EN } from './AirportMap';

const ZH: Map<string, string> = new Map<string, string>();
ZH.set('home_title', '星海国际机场');
ZH.set('home_sub', '主航站楼 · 六层导览');
ZH.set('btn_find', '找登机口 · 设施');
ZH.set('btn_metro', '地铁换乘');
ZH.set('btn_browse', '楼层漫游');
ZH.set('sec_floors', '楼层导览');
ZH.set('sel_title', '选择目的地');
ZH.set('sel_search', '搜索：登机口 / 地铁 / 安检…');
ZH.set('sel_start_label', '起点');
ZH.set('sel_pick_start', '选择起点');
ZH.set('sel_anywhere', '任意节点');
ZH.set('sel_quick_start', '快捷起点（模拟当前位置）');
ZH.set('sel_empty', '没有匹配的结果');
ZH.set('route_title', '路线');
ZH.set('route_total', '全程');
ZH.set('route_via_security', '途中需通过中央安检大厅');
ZH.set('route_same_side', '同侧直达，无需安检');
ZH.set('route_by_elevator', '电梯');
ZH.set('route_by_escalator', '扶梯');
ZH.set('route_by_stair', '楼梯');
ZH.set('route_meters', '米');
ZH.set('route_no_path', '暂无可达路线');
ZH.set('route_transfer_to', '换乘');
ZH.set('route_arrived', '已到达目的地');
ZH.set('route_levels', '楼层');
ZH.set('trans_count', '次换层');
ZH.set('common_pref', '寻路偏好');
ZH.set('pref_shortest', '最短距离');
ZH.set('pref_elevator', '优先电梯');
ZH.set('pref_escalator', '优先扶梯');
ZH.set('pref_avoid_stair', '避开楼梯');
ZH.set('metro_title', '地铁换乘');
ZH.set('metro_dir_city', '往市区方向');
ZH.set('metro_dir_resort', '往星湖度假区');
ZH.set('metro_hint', '选择出行方向，自动规划到对应站台');
ZH.set('metro_plat_sub', 'B2 地铁站台');
ZH.set('metro_step_gate_t', '过闸');
ZH.set('metro_step_gate_d', '到 B1 地铁闸机群过闸');
ZH.set('metro_step_descend_t', '下 B2');
ZH.set('metro_step_descend_d', '乘地铁扶梯 / 楼梯下到 B2');
ZH.set('metro_step_plat_t', '候车');
ZH.set('metro_step_plat_d', '在 B2 站台等车');
ZH.set('browse_title', '楼层浏览');
ZH.set('browse_tap_hint', '点击节点查看');
ZH.set('pick_dest', '设为目的地');
ZH.set('pick_start', '设为出发点');
ZH.set('planner_from', '出发点');
ZH.set('planner_to', '终点');
ZH.set('planner_swap', '交换');
ZH.set('planner_go', '确认');
ZH.set('common_cancel', '取消');

const EN: Map<string, string> = new Map<string, string>();
EN.set('home_title', 'Xinghai Int’l Airport');
EN.set('home_sub', 'Main Terminal · 6 levels');
EN.set('btn_find', 'Find Gate & Facility');
EN.set('btn_metro', 'Metro Transfer');
EN.set('btn_browse', 'Browse Floors');
EN.set('sec_floors', 'FLOORS');
EN.set('sel_title', 'Select Destination');
EN.set('sel_search', 'Search: gate / metro / security…');
EN.set('sel_start_label', 'Start');
EN.set('sel_pick_start', 'Choose start');
EN.set('sel_anywhere', 'Any node');
EN.set('sel_quick_start', 'Quick start (simulated location)');
EN.set('sel_empty', 'No matching results');
EN.set('route_title', 'Route');
EN.set('route_total', 'Total');
EN.set('route_via_security', 'Pass through Central Security');
EN.set('route_same_side', 'Same side, no security');
EN.set('route_by_elevator', 'elevator');
EN.set('route_by_escalator', 'escalator');
EN.set('route_by_stair', 'stairs');
EN.set('route_meters', 'm');
EN.set('route_no_path', 'No route found');
EN.set('route_transfer_to', 'Transfer to');
EN.set('route_arrived', 'Arrived at destination');
EN.set('route_levels', 'levels');
EN.set('trans_count', 'transfers');
EN.set('common_pref', 'Routing preference');
EN.set('pref_shortest', 'Shortest');
EN.set('pref_elevator', 'Prefer elevator');
EN.set('pref_escalator', 'Prefer escalator');
EN.set('pref_avoid_stair', 'Avoid stairs');
EN.set('metro_title', 'Metro Transfer');
EN.set('metro_dir_city', 'To City Center');
EN.set('metro_dir_resort', 'To Xinghu Resort');
EN.set('metro_hint', 'Pick a direction to auto-plan the route');
EN.set('metro_plat_sub', 'Metro platform B2');
EN.set('metro_step_gate_t', 'Tap through gates');
EN.set('metro_step_gate_d', 'At B1 metro gates, tap through');
EN.set('metro_step_descend_t', 'Go down');
EN.set('metro_step_descend_d', 'Escalator / stairs down to B2');
EN.set('metro_step_plat_t', 'Wait');
EN.set('metro_step_plat_d', 'Wait on the B2 platform');
EN.set('browse_title', 'Floor Browse');
EN.set('browse_tap_hint', 'Tap a node to inspect');
EN.set('pick_dest', 'Set as destination');
EN.set('pick_start', 'Set as start');
EN.set('planner_from', 'From');
EN.set('planner_to', 'To');
EN.set('planner_swap', 'Swap');
EN.set('planner_go', 'Confirm');
EN.set('common_cancel', 'Cancel');

export class Loc {
  static t(key: string, en: boolean): string {
    const m = en ? EN : ZH;
    const v = m.get(key);
    return v === undefined ? key : v;
  }

  // 楼层名（跟随语言）
  static floor(floor: string, en: boolean): string {
    const m = en ? FLOOR_LABELS_EN : FLOOR_LABELS;
    const v = m.get(floor);
    return v === undefined ? floor : v;
  }
}