// 地铁页：两个方向 + 到站台三步
const { getModel, back, navigate } = require('../../utils/model.js');
const present = require('../../utils/present.js');

Page({
  data: {},

  onShow() {
    this.setData(present.metro(getModel()));
  },

  onToggleLang() {
    getModel().toggleLanguage();
    this.setData(present.metro(getModel()));
  },

  onBack() {
    getModel().backHome();
    back(1);
  },

  onDirection(e) {
    getModel().chooseMetroDirection(e.currentTarget.dataset.id);
    navigate('start');
  },
});
