// 出发位置页：已选目的地 + 常见出发位置 + 搜索列表
const { core, getModel, navigate, back } = require('../../utils/model.js');
const present = require('../../utils/present.js');

Page({
  data: {},

  onShow() {
    this.setData(present.start(getModel()));
  },

  onToggleLang() {
    getModel().toggleLanguage();
    this.setData(present.start(getModel()));
  },

  onBack() {
    getModel().backFromStart();
    back(1);
  },

  onQuick(e) {
    getModel().chooseStart(e.currentTarget.dataset.id);
    wx.redirectTo({ url: '/pages/route/index' });
  },

  onPick(e) {
    getModel().chooseStart(e.currentTarget.dataset.id);
    wx.redirectTo({ url: '/pages/route/index' });
  },

  onOpenMapPicker() {
    getModel().openBrowseForDestination();
    navigate('browse');
  },
});
