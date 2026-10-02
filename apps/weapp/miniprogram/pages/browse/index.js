// 楼层地图页：楼层 chips + Canvas + 详情/列表
const { core, getModel, back, navigate } = require('../../utils/model.js');
const present = require('../../utils/present.js');
const { createMapController } = require('../../utils/render.js');

Page({
  data: {},

  onReady() {
    this.map = createMapController(this, '#map', {
      onNodeTap: (node) => {
        if (node) {
          getModel().selectNode(node.id);
          this.refresh();
        }
      },
    });
    this.map.mount().then(() => {
      const model = getModel();
      this.map.setFloor(model.state.browseFloor);
      this.map.setMarkers(model.state.planner.startId, model.state.planner.endId);
    });
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const model = getModel();
    this.setData(present.browse(model));
    if (this.map) {
      this.map.setFloor(model.state.browseFloor);
      this.map.setMarkers(model.state.planner.startId, model.state.planner.endId);
    }
  },

  onToggleLang() {
    getModel().toggleLanguage();
    this.refresh();
  },

  onBack() {
    getModel().backFromBrowse();
    back(1);
  },

  onFloor(e) {
    getModel().setBrowseFloor(e.currentTarget.dataset.key);
    this.refresh();
  },

  onSelect(e) {
    getModel().selectNode(e.currentTarget.dataset.id);
    this.refresh();
  },

  onPickStart() {
    const model = getModel();
    model.setStartFromMap(model.state.selectedId);
    wx.showToast({ title: model.t('start_set'), icon: 'none' });
    if (this.map) { this.map.setMarkers(model.state.selectedId, model.state.planner.endId); }
    this.refresh();
  },

  onPickDest() {
    const model = getModel();
    model.routeToFromMap(model.state.selectedId);
    wx.redirectTo({ url: '/pages/route/index' });
  },

  onFitFloor() { if (this.map) { this.map.fitFloor(); } },
  onZoomIn() { if (this.map) { this.map.zoomBy(1.35); } },
  onZoomOut() { if (this.map) { this.map.zoomBy(0.75); } },
  onTouchStart(e) { if (this.map) { this.map.touchStart(e); } },
  onTouchMove(e) { if (this.map) { this.map.touchMove(e); } },
  onTouchEnd(e) { if (this.map) { this.map.touchEnd(e); } },
});
