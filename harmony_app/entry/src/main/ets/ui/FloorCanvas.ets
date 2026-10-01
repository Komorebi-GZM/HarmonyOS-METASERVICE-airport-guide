import { LengthMetricsUnit } from '@kit.ArkUI';
import { MapNode, XHA_NODES, XHA_EDGES, FLOOR_BBOX, SECURITY_ID } from '../model/AirportMap';
import { nodeName } from '../model/Localization';
import { Loc } from '../model/Loc';
import { Viewport } from '../core/Viewport';
import { publicPlace, place } from '../core/Places';
import { MAP, APP, TYPE_COLOR } from './Theme';
import { AppIcon } from './Common';
interface LabelBox { x: number; y: number; w: number; h: number; }
@Component
export struct FloorCanvas {
  @Prop @Watch('changed') floor: string = '4F';
  @Prop @Watch('changed') lang: string = 'zh';
  @Prop @Watch('changed') pathNodeIds: string[] = [];
  @Prop @Watch('changed') currentIds: string[] = [];
  @Prop @Watch('changed') startId: string = '';
  @Prop @Watch('changed') endId: string = '';
  @Prop @Watch('changed') selectedId: string = '';
  @Prop selectable: boolean = false;
  onNodeTap: (id: string) => void = () => {};
  private ctx: CanvasRenderingContext2D = new CanvasRenderingContext2D(new RenderingContextSettings(true), LengthMetricsUnit.DEFAULT);
  private view: Viewport = new Viewport();
  private ready: boolean = false; private fitKey: string = '';
  private areaW: number = 0; private areaH: number = 0;
  private panX: number = 0; private panY: number = 0; private pinchScale: number = 1;
  private canvasW(): number { return this.areaW > 0 ? this.areaW : this.ctx.width; }
  private canvasH(): number { return this.areaH > 0 ? this.areaH : this.ctx.height; }
  private canvasFont(size: number, bold: boolean = false): string {
    return (bold ? 'bold ' : '') + this.getUIContext().fp2px(size) + 'px HarmonyOS Sans';
  }
  changed(): void { if (this.ready) { this.draw(); } }
  private fit(route: boolean): void {
    let bb = FLOOR_BBOX.get(this.floor);
    if (bb === undefined) { return; }
    if (route && this.pathNodeIds.length > 0) {
      const box: number[] = [Number.MAX_VALUE, Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE];
      for (let i = 0; i < this.pathNodeIds.length; i++) {
        const n = place(this.pathNodeIds[i]);
        if (n !== undefined && n.floor === this.floor) {
          box[0] = Math.min(box[0], n.x); box[1] = Math.min(box[1], n.y); box[2] = Math.max(box[2], n.x); box[3] = Math.max(box[3], n.y);
        }
      }
      if (box[0] !== Number.MAX_VALUE) {
        if (box[2] - box[0] < 160) { box[0] -= 80; box[2] += 80; }
        if (box[3] - box[1] < 160) { box[1] -= 80; box[3] += 80; }
        bb = box;
      }
    }
    // Reserve space for the right zoom controls and bottom route buttons.
    if (route) { this.view.fitInsets(bb, this.canvasW(), this.canvasH(), 32, 48, 72, 90); }
    else { this.view.fitInsets(bb, this.canvasW(), this.canvasH(), 24, 48, 72, 78); }
  }
  private draw(): void {
    if (!this.ready || this.areaW < 1 || this.areaH < 1) { return; }
    const key = this.floor + ':' + this.canvasW() + ':' + this.canvasH() + ':' + this.pathNodeIds.join(',');
    if (key !== this.fitKey) { this.fitKey = key; this.fit(this.pathNodeIds.length > 0); }
    const c = this.ctx; c.clearRect(0, 0, this.canvasW(), this.canvasH()); c.fillStyle = MAP.surface;
    c.fillRect(0, 0, this.canvasW(), this.canvasH());
    const bb = FLOOR_BBOX.get(this.floor);
    if (bb === undefined) { return; }
    c.fillStyle = '#E9F0F1';
    c.fillRect(this.view.scrX(bb[0]) - 18, this.view.scrY(bb[1]) - 18, (bb[2] - bb[0]) * this.view.zoom + 36, (bb[3] - bb[1]) * this.view.zoom + 36);
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (let i = 0; i < XHA_EDGES.length; i++) {
      const e = XHA_EDGES[i]; const a = place(e.from); const b = place(e.to);
      if (e.type !== 'walk' || a === undefined || b === undefined || a.floor !== this.floor || b.floor !== this.floor) { continue; }
      c.beginPath(); c.moveTo(this.view.scrX(a.x), this.view.scrY(a.y)); c.lineTo(this.view.scrX(b.x), this.view.scrY(b.y));
      c.lineWidth = 22; c.strokeStyle = '#DCE6E8'; c.stroke(); c.lineWidth = 18; c.strokeStyle = '#FFFFFF'; c.stroke();
    }
    this.line(this.pathNodeIds, '#9ACCC6', 5);
    if (this.currentIds.length > 0) {
      this.line(this.currentIds, APP.accent, 6);
      this.arrows(this.currentIds);
    }
    for (let i = 0; i < XHA_NODES.length; i++) {
      const n = XHA_NODES[i]; if (n.floor !== this.floor || !publicPlace(n)) { continue; }
      this.marker(n);
    }
    this.endpoint(this.startId, false); this.endpoint(this.endId, true); this.labels();
    c.font = this.canvasFont(16, true); c.fillStyle = APP.text; c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText(this.floor, 16, 16);
  }
  private line(ids: string[], color: string, width: number): void {
    if (ids.length < 2) { return; }
    const c = this.ctx; c.beginPath(); let began = false;
    for (let i = 0; i < ids.length; i++) {
      const n = place(ids[i]); if (n === undefined || n.floor !== this.floor) { continue; }
      const x = this.view.scrX(n.x); const y = this.view.scrY(n.y);
      if (!began) { c.moveTo(x, y); began = true; } else { c.lineTo(x, y); }
    }
    c.strokeStyle = '#FFFFFF'; c.lineWidth = width + 4; c.stroke(); c.strokeStyle = color; c.lineWidth = width; c.stroke();
  }
  private arrows(ids: string[]): void {
    const c = this.ctx;
    for (let i = 1; i < ids.length; i++) {
      const a = place(ids[i - 1]); const b = place(ids[i]);
      if (a === undefined || b === undefined || a.floor !== this.floor || b.floor !== this.floor) { continue; }
      const dx = this.view.scrX(b.x) - this.view.scrX(a.x); const dy = this.view.scrY(b.y) - this.view.scrY(a.y);
      const length = Math.sqrt(dx * dx + dy * dy); if (length < 28) { continue; }
      const x = (this.view.scrX(a.x) + this.view.scrX(b.x)) / 2;
      const y = (this.view.scrY(a.y) + this.view.scrY(b.y)) / 2;
      const ux = dx / length; const uy = dy / length;
      c.beginPath(); c.moveTo(x + ux * 5, y + uy * 5); c.lineTo(x - ux * 4 - uy * 4, y - uy * 4 + ux * 4);
      c.lineTo(x - ux * 4 + uy * 4, y - uy * 4 - ux * 4); c.closePath(); c.fillStyle = '#FFFFFF'; c.fill();
    }
  }
  private marker(n: MapNode): void {
    const c = this.ctx; const x = this.view.scrX(n.x); const y = this.view.scrY(n.y);
    const selected = n.id === this.selectedId || this.currentIds.indexOf(n.id) >= 0;
    const color = n.id === SECURITY_ID ? APP.gold : (TYPE_COLOR.get(n.type) || APP.accent);
    c.beginPath(); c.arc(x, y, selected ? 10 : 6, 0, Math.PI * 2); c.fillStyle = '#FFFFFF'; c.fill();
    c.strokeStyle = color; c.lineWidth = selected ? 3 : 1.8; c.stroke();
    c.beginPath(); c.arc(x, y, 2.2, 0, Math.PI * 2); c.fillStyle = color; c.fill();
  }
  private endpoint(id: string, end: boolean): void {
    const n = place(id); if (n === undefined || n.floor !== this.floor) { return; }
    const c = this.ctx; const x = this.view.scrX(n.x); const y = this.view.scrY(n.y);
    c.fillStyle = end ? APP.text : APP.accent;
    if (end) { c.fillRect(x - 11, y - 11, 22, 22); }
    else { c.beginPath(); c.arc(x, y, 12, 0, Math.PI * 2); c.fill(); }
    c.font = this.canvasFont(14, true); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#FFFFFF';
    c.fillText(Loc.t(end ? 'end_marker' : 'start_marker', this.lang === 'en'), x, y);
  }
  private priority(n: MapNode): number {
    if (n.id === this.startId || n.id === this.endId || n.id === this.selectedId) { return 0; }
    if (n.id === SECURITY_ID || (this.currentIds.indexOf(n.id) >= 0 &&
      (n.type === 'lift' || n.type === 'escalator' || n.type === 'stair'))) { return 1; }
    return this.pathNodeIds.indexOf(n.id) >= 0 || this.currentIds.indexOf(n.id) >= 0 ? 2 : 3;
  }
  private labels(): void {
    const nodes: MapNode[] = [];
    for (let i = 0; i < XHA_NODES.length; i++) {
      const n = XHA_NODES[i];
      if (n.floor === this.floor && publicPlace(n)) { nodes.push(n); }
    }
    nodes.sort((a: MapNode, b: MapNode): number => this.priority(a) - this.priority(b));
    const boxes: LabelBox[] = []; const c = this.ctx;
    // Keep labels clear of the start/end and current security or transfer markers.
    for (let i = 0; i < nodes.length; i++) {
      if (this.priority(nodes[i]) <= 1) {
        boxes.push({ x: this.view.scrX(nodes[i].x) - 13, y: this.view.scrY(nodes[i].y) - 13, w: 26, h: 26 });
      }
    }
    c.font = this.canvasFont(14); c.textAlign = 'center'; c.textBaseline = 'middle';
    const labelH = this.getUIContext().px2vp(this.getUIContext().fp2px(14)) * 1.25;
    const gap = Math.max(3, labelH * 0.15);
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i]; const p = this.priority(n);
      if (p > 2 && this.view.zoom < 0.4 && n.type !== 'gate' && n.type !== 'metro' && n.type !== 'checkin') { continue; }
      let name = nodeName(n, this.lang === 'en');
      if (n.type === 'gate') { name = name.replace('登机口', '').replace('Gate ', ''); }
      if (name.length > 22 && p > 0) { name = name.substring(0, 20) + '…'; }
      const x = this.view.scrX(n.x); const y = this.view.scrY(n.y);
      const w = c.measureText(name).width + 10;
      const candidates: LabelBox[] = [
        { x: x - w / 2, y: y + 16, w: w, h: labelH },
        { x: x - w / 2, y: y - 16 - labelH, w: w, h: labelH },
        { x: x + 16, y: y - labelH / 2, w: w, h: labelH },
        { x: x - w - 16, y: y - labelH / 2, w: w, h: labelH }
      ];
      let chosen: LabelBox | undefined = undefined;
      let fallback: LabelBox | undefined = undefined;
      for (let k = 0; k < candidates.length; k++) {
        const candidate = candidates[k];
        if (candidate.x < 6 || candidate.x + w > this.canvasW() - 6 || candidate.y < 42 ||
          candidate.y + candidate.h > this.canvasH() - 58) { continue; }
        if (fallback === undefined) { fallback = candidate; }
        let overlaps = false;
        for (let j = 0; j < boxes.length; j++) {
          const b = boxes[j];
          if (candidate.x < b.x + b.w + 4 && candidate.x + candidate.w + 4 > b.x &&
            candidate.y < b.y + b.h + gap && candidate.y + candidate.h + gap > b.y) { overlaps = true; break; }
        }
        if (!overlaps) { chosen = candidate; break; }
      }
      if (chosen === undefined && p === 0) { chosen = fallback; }
      if (chosen === undefined) { continue; }
      boxes.push(chosen); c.fillStyle = '#FFFFFF'; c.fillRect(chosen.x, chosen.y, chosen.w, chosen.h);
      c.fillStyle = p < 2 ? APP.text : MAP.ink2;
      c.fillText(name, chosen.x + chosen.w / 2, chosen.y + chosen.h / 2);
    }
  }
  private zoomBy(factor: number): void { this.view.pinch(this.canvasW() / 2, this.canvasH() / 2, factor); this.draw(); }
  private gestures() {
    return GestureGroup(GestureMode.Parallel,
      PanGesture({ fingers: 1, distance: 5 }).onActionStart(() => { this.panX = 0; this.panY = 0; })
        .onActionUpdate((e: GestureEvent | undefined) => {
          if (e === undefined) { return; }
          this.view.pan(e.offsetX - this.panX, e.offsetY - this.panY); this.panX = e.offsetX; this.panY = e.offsetY; this.draw();
        }),
      PinchGesture({ fingers: 2, distance: 3 }).onActionStart(() => { this.pinchScale = 1; })
        .onActionUpdate((e: GestureEvent | undefined) => {
          if (e === undefined) { return; }
          this.view.pinch(e.pinchCenterX, e.pinchCenterY, e.scale / this.pinchScale); this.pinchScale = e.scale; this.draw();
        }));
  }
  private tap(e: ClickEvent): void {
    if (!this.selectable) { return; }
    let id = ''; let best = 24 * 24;
    for (let i = 0; i < XHA_NODES.length; i++) {
      const n = XHA_NODES[i]; if (n.floor !== this.floor || !publicPlace(n)) { continue; }
      const dx = this.view.scrX(n.x) - e.x; const dy = this.view.scrY(n.y) - e.y;
      const d = dx * dx + dy * dy; if (d < best) { best = d; id = n.id; }
    }
    if (id !== '') { this.onNodeTap(id); }
  }
  @Builder
  control(name: string, key: string, run: () => void) {
    Button() { AppIcon({ name: name, iconSize: 22 }) }.width(48).height(48).backgroundColor(APP.card).borderRadius(12)
      .id('map_' + key).accessibilityText(Loc.t(key, this.lang === 'en')).onClick(() => run())
  }
  build() {
    Stack() {
      Canvas(this.ctx).id('floor_canvas').width('100%').height('100%')
        .onReady(() => { this.ready = true; this.draw(); })
        .onAreaChange((_oldArea, newArea) => {
          const width = parseFloat(newArea.width.toString()); const height = parseFloat(newArea.height.toString());
          if (width > 0 && height > 0 && (Math.abs(width - this.areaW) > 1 || Math.abs(height - this.areaH) > 1)) {
            this.areaW = width; this.areaH = height; this.fitKey = '';
            setTimeout(() => this.draw(), 0);
          }
        })
        .gesture(this.gestures()).onClick((e: ClickEvent) => this.tap(e))
        .accessibilityText(this.floor + ' ' + Loc.floor(this.floor, this.lang === 'en'))
      Column() {
        Row() {
          Column({ space: 8 }) {
            this.control('plus', 'zoom_in', () => this.zoomBy(1.35))
            this.control('minus', 'zoom_out', () => this.zoomBy(0.75))
          }
        }.width('100%').justifyContent(FlexAlign.End)
        Row({ space: 8 }) {
          Button(Loc.t('full_floor', this.lang === 'en')).id('map_fit_floor').height(48).fontSize(14)
            .backgroundColor(APP.card).fontColor(APP.accent).borderRadius(12).onClick(() => { this.fit(false); this.draw(); })
          if (this.pathNodeIds.length > 0) {
            Button(Loc.t('fit_route', this.lang === 'en')).id('map_fit_route').height(48).fontSize(14)
              .backgroundColor(APP.card).fontColor(APP.accent).borderRadius(12).onClick(() => { this.fit(true); this.draw(); })
          }
        }.width('100%')
      }.width('100%').height('100%').padding(12).justifyContent(FlexAlign.SpaceBetween)
        .hitTestBehavior(HitTestMode.Transparent)
    }.width('100%').height('100%').backgroundColor(MAP.surface).borderRadius(18).clip(true)
  }
}
