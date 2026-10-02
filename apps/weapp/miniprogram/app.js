// 小程序入口：预加载共享核心（地图数据随包，无网络请求）。
// 状态机在 utils/model.js 里，页面直接 require 使用。
const { getModel } = require('./utils/model.js');

App({
  onLaunch() {
    // 触发一次加载：把地图与最近地点读进内存（纯本地，无网络）
    const model = getModel();
    console.log('[airport-guide] 已加载', model.graph.nodes.length, '个节点 /', model.graph.edges.length, '条边');
  },
});
