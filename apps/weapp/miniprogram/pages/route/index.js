// 路线页：概要 + Canvas 地图 + 偏好 + 逐步指引
const { getModel, back, navigate } = require('../../utils/model.js');
const present = require('../../utils/present.js');
const { createMapController } = require('../../utils/render.js');

Page({
  data: {},

  onReady() {
    this.map = createMapController(this, '#map', {
      onNodeTap: () => {},
    });
    this.map.mount().then(() => this.syncMap());
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const model = getModel();
    this.setData(present.route(model));
    this.syncMap();
  },

  syncMap() {
    if (!this.map) { return; }
    const model = getModel();
    const data = present.route(model);
    if (data.ready) {
      this.map.setRoute(data.routeNodeIds, data.currentIndex, model.state.planner.startId,
        model.state.planner.endId, model.en);
    } else {
      this.map.setMarkers(model.state.planner.startId, model.state.planner.endId);
    }
  },

  onToggleLang() {
    getModel().toggleLanguage();
    this.refresh();
  },

  onBack() {
    getModel().backHome();
    wx.reLaunch({ url: '/pages/home/index' });
  },

  onPreference(e) {
    getModel().setPreference(Number(e.currentTarget.dataset.key));
    this.refresh();
  },

  onBegin() {
    getModel().beginGuidance();
    this.refresh();
  },

  onAdvance() {
    getModel().advance();
    this.refresh();
  },

  onPrevious() {
    getModel().previous();
    this.refresh();
  },

  onEditFrom() {
    getModel().editStart();
    wx.redirectTo({ url: '/pages/start/index' });
  },

  onEditTo() {
    getModel().editDestination();
    navigate('target');
  },

  onSwap() {
    getModel().swap();
    this.refresh();
  },

  onRestart() {
    getModel().restart();
    wx.reLaunch({ url: '/pages/home/index' });
  },

  onChooseAgain() {
    getModel().startTargetFlow('all');
    wx.redirectTo({ url: '/pages/target/index' });
  },

  onJumpStep(e) {
    getModel().jumpToStep(Number(e.currentTarget.dataset.index));
    this.refresh();
  },

  onTouchStart(e) { if (this.map) { this.map.touchStart(e); } },
  onTouchMove(e) { if (this.map) { this.map.touchMove(e); } },
  onTouchEnd(e) { if (this.map) { this.map.touchEnd(e); } },
  onZoomIn() { if (this.map) { this.map.zoomBy(1.35); } },
  onZoomOut() { if (this.map) { this.map.zoomBy(0.75); } },
  onFitRoute() { if (this.map) { this.map.fitRoute(); } },
});
