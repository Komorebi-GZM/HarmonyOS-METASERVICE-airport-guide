// 目的地页：分类 chips + 搜索 + 列表
const { core, getModel, navigate, back } = require('../../utils/model.js');
const present = require('../../utils/present.js');

Page({
  data: {},

  onShow() {
    this.setData(present.target(getModel()));
  },

  onToggleLang() {
    getModel().toggleLanguage();
    this.setData(present.target(getModel()));
  },

  onBack() {
    const model = getModel();
    model.backFromTarget();
    back(1);
  },

  onCategory(e) {
    getModel().setCategory(e.currentTarget.dataset.key);
    this.setData(present.target(getModel()));
  },

  onSearchInput(e) {
    getModel().setQuery(e.detail.value);
    this.setData(present.target(getModel()));
  },

  onClear() {
    getModel().setQuery('');
    this.setData(present.target(getModel()));
  },

  onPick(e) {
    const model = getModel();
    const editingEnd = model.state.planner.editing === 'end';
    model.chooseTarget(e.currentTarget.dataset.id);
    if (editingEnd) { back(1); } else { navigate('start'); }
  },
});
