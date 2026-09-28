// 极简路由参数总线：单 Navigation + NavPathStack 下的页面间传参
// 元服务单实例、无并行页面栈，模块级静态参数比泛化 param 类型更稳（规避 ArkTS 动态类型雷区）
export const NAV_SELECT_TARGET = 'SelectTarget';
export const NAV_SELECT_START = 'SelectStart';
export const NAV_PLAN = 'Route';
export const NAV_METRO = 'MetroGuide';
export const NAV_BROWSE = 'FloorBrowse';

export class Router {
  // 寻路参数
  static startId: string = 'xha_p4_doorW'; // 默认：西出发门（模拟当前位置）
  static endId: string = 'xha_p4_gA101';
  static endNameZh: string = '';
  static endNameEn: string = '';
  static endFloor: string = '';

  // 地铁方向：city=市区 / resort=星湖度假区
  static metroDir: string = 'city';

  // 楼层浏览：FloorBrowse 打开时的初始页
  static browseFloor: string = '4F';
}