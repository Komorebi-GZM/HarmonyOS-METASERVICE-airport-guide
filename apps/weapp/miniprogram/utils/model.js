// 共享状态机的单例包装：页面只 require 这里，不直接碰 core.js（生成物）。
//
// 为什么保持单例：ArkTS 端用 @Provide/@Consume 共享行程状态，Web 端用一个模块级 state，
// 小程序这里用模块级单例，语义一致 —— 六个页面看到的是同一份行程。

const core = require('./core.js');
const { wxStore } = require('./store.js');

let model = null;

function getModel() {
  if (model === null) {
    model = new core.AppModel(core.AIRPORT, wxStore);
  }
  return model;
}

/** 供测试注入内存 store 重新构造 */
function resetModel(store) {
  model = new core.AppModel(core.AIRPORT, store || wxStore);
  return model;
}

/** 页面之间的跳转：与 AppState.view 保持一致，避免两套路由真相 */
const ROUTES = {
  home: '/pages/home/index',
  target: '/pages/target/index',
  start: '/pages/start/index',
  route: '/pages/route/index',
  metro: '/pages/metro/index',
  browse: '/pages/browse/index',
};

function navigate(view) {
  wx.navigateTo({ url: ROUTES[view] });
}

function back(delta) {
  wx.navigateBack({ delta: delta || 1 });
}

module.exports = { core, getModel, resetModel, navigate, back, ROUTES };
