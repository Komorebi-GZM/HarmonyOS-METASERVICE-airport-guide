// 首页：三张主卡片 + 常用目的地 + 最近查找 + 两个入口
const { getModel, navigate } = require('../../utils/model.js');
const present = require('../../utils/present.js');

Page({
  data: {},

  onShow() {
    this.refresh();
  },

  refresh() {
    this.setData(present.home(getModel()));
  },

  onToggleLang() {
    getModel().toggleLanguage();
    this.refresh();
  },

  onGoGate() {
    getModel().startTargetFlow('gate');
    navigate('target');
  },

  onGoMetro() {
    getModel().startMetroFlow();
    navigate('metro');
  },

  onGoService() {
    getModel().startTargetFlow('service');
    navigate('target');
  },

  onPickPopular(e) {
    getModel().chooseDestinationFromHome(e.currentTarget.dataset.id);
    navigate('start');
  },

  onOpenFloors() {
    getModel().openBrowse();
    navigate('browse');
  },

  onOpenMapPicker() {
    getModel().openBrowseForDestination();
    navigate('browse');
  },
});
