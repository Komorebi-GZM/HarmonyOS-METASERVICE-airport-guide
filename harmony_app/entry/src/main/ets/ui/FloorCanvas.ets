// 楼层画布：程序化「手绘」底图 + 拓扑叠加 + 路线高亮（含 0..1 绘制动效）
// 背景与拓扑共用同一 Viewport 变换，保证天然对齐（图片来源坐标系，pxPerMeter=2）
import { MapNode, XHA_NODES, XHA_EDGES, FLOOR_BBOX, SECURITY_ID, PX_PER_METER } from '../model/AirportMap';
import { nodeName } from '../model/Localization';
import { Viewport } from '../core/Viewport';
import { MAP, TYPE_COLOR, ROUTE, HIT } from './Theme';

interface Pt {
  x: number;
  y: number;
}

// 模块级一次性索引（119 节点，构造成本低）
const NODE_IDX: Map<string, MapNode> = new Map<string, MapNode>();
for (let i = 0; i < XHA_NODES.length; i++) {
  NODE_IDX.set(XHA_NODES[i].id, XHA_NODES[i]);
}

@Component
export struct FloorCanvas {
  @Prop @Watch('onProps') floor: string = '4F';
  @Prop @Watch('onProps') lang: string = 'zh';
  @Prop @Watch('onProps') pathNodeIds: string[] = []; // 本层路线节点（空 = 不画路线）
  @Prop @Watch('onProps') viaSecurity: boolean = false; // 本层路线是否过安检必经咽喉
  @Prop @Watch('onProps') isStart: boolean = false; // 本层是起点所在层
  @Prop @Watch('onProps') isEnd: boolean = false; // 本层是终点所在层
  @Prop @Watch('onProps') progress: number = 1; // 0..1 路线绘制进度（动效）
  @Prop @Watch('onProps') selectable: boolean = false; // 可点选节点回调
  onNodeTap: (id: string) => void = (id: string) => {
  };

  private ctx: CanvasRenderingContext2D = new CanvasRenderingContext2D(new RenderingContextSettings(true));
  private view: Viewport = new Viewport();
  private ready: boolean = false;
  private fitFloor: string = ''; // 已适配的楼层：切换楼层才重置视口，平移/缩放不清
  private lastPanX: number = 0;
  private lastPanY: number = 0;
  private lastScale: number = 1;

  onProps(): void {
    if (this.ready) {
      this.draw();
    }
  }

  aboutToDisappear(): void {
    this.ready = false;
  }

  // ================= 主绘制 =================
  private draw(): void {
    if (!this.ready) {
      return;
    }
    const ctx = this.ctx;
    const w = ctx.width;
    const h = ctx.height;
    if (w <= 0 || h <= 0) {
      return;
    }
    const bb = FLOOR_BBOX.get(this.floor);
    if (bb === undefined) {
      return;
    }
    // 仅切楼层(或首次)重算视口；编移/缩放期间保持用户视野
    if (this.fitFloor !== this.floor) {
      this.view.fit(bb, w, h, 52);
      this.fitFloor = this.floor;
    }
    ctx.clearRect(0, 0, w, h);
    this.drawBase(ctx, bb);
    this.drawTopology(ctx);
    this.drawScaleBar(ctx);
    this.drawRoute(ctx);
  }

  // ---------------- 底图：纸面 + 网格 + 通道带 + 轮廓 ----------------
  private drawBase(ctx: CanvasRenderingContext2D, bb: number[]): void {
    // 纸面
    ctx.fillStyle = MAP.surface;
    ctx.fillRect(0, 0, ctx.width, ctx.height);

    // 网格（25m 一格）
    const step = PX_PER_METER * 25;
    ctx.strokeStyle = MAP.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let gx = Math.floor(bb[0] / step) * step; gx <= bb[2]; gx += step) {
      const sx = this.view.scrX(gx);
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, ctx.height);
    }
    for (let gy = Math.floor(bb[1] / step) * step; gy <= bb[3]; gy += step) {
      const sy = this.view.scrY(gy);
      ctx.moveTo(0, sy);
      ctx.lineTo(ctx.width, sy);
    }
    ctx.stroke();

    // 航站楼轮廓（略大于包围盒）
    ctx.strokeStyle = 'rgba(20,20,20,0.22)';
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, this.view.scrX(bb[0]) - 26, this.view.scrY(bb[1]) - 26,
      (this.view.scrX(bb[2]) - this.view.scrX(bb[0])) + 52,
      (this.view.scrY(bb[3]) - this.view.scrY(bb[1])) + 52, 22);

    // 通道带：由同层 walk 边推演（半透明宽线）
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(182,175,162,0.55)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    this.eachFloorEdge(false, (a, b) => {
      ctx.moveTo(this.view.scrX(a.x), this.view.scrY(a.y));
      ctx.lineTo(this.view.scrX(b.x), this.view.scrY(b.y));
    });
    ctx.stroke();
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
    ctx.stroke();
  }

  // 遍历本层边（同层 walk 或非 walk），回调两节点
  private eachFloorEdge(verticalOnly: boolean, fn: (a: MapNode, b: MapNode) => void): void {
    const floor = this.floor;
    for (let i = 0; i < XHA_EDGES.length; i++) {
      const e = XHA_EDGES[i];
      if (e.type === 'walk' === verticalOnly) {
        continue;
      }
      const a = NODE_IDX.get(e.from);
      const b = NODE_IDX.get(e.to);
      if (a === undefined || b === undefined) {
        continue;
      }
      if (a.floor !== floor || b.floor !== floor) {
        continue;
      }
      fn(a, b);
    }
  }

  // ---------------- 拓扑：边 + 节点 + 标注 ----------------
  private drawTopology(ctx: CanvasRenderingContext2D): void {
    const zoom = this.view.zoom;
    // 边
    const floor = this.floor;
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';
    for (let i = 0; i < XHA_EDGES.length; i++) {
      const e = XHA_EDGES[i];
      if (e.type === 'walk') {
        continue; // walk 已在通道带表达
      }
      const a = NODE_IDX.get(e.from);
      const b = NODE_IDX.get(e.to);
      if (a === undefined || b === undefined) {
        continue;
      }
      if (a.floor !== floor || b.floor !== floor) {
        continue;
      }
      ctx.beginPath();
      ctx.moveTo(this.view.scrX(a.x), this.view.scrY(a.y));
      ctx.lineTo(this.view.scrX(b.x), this.view.scrY(b.y));
      ctx.strokeStyle = e.type === 'stair' ? 'rgba(115,113,106,0.5)' : 'rgba(235,104,52,0.5)';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // 节点
    for (let i = 0; i < XHA_NODES.length; i++) {
      const n = XHA_NODES[i];
      if (n.floor !== floor) {
        continue;
      }
      const sx = this.view.scrX(n.x);
      const sy = this.view.scrY(n.y);
      const c = TYPE_COLOR.get(n.type);
      const color = c === undefined ? MAP.muted : c;
      let r = 3.2;
      if (n.id === SECURITY_ID) {
        r = 6.5;
      } else if (n.type === 'gate' || n.type === 'metro' || n.type === 'baggage' || n.type === 'checkin') {
        r = 4;
      }
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = MAP.surface;
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }

    // 标注：放大到阈值以上才绘制，避免贴标签糊成一团
    if (zoom > 0.55) {
      for (let i = 0; i < XHA_NODES.length; i++) {
        const n = XHA_NODES[i];
        if (n.floor !== floor || !this.shouldLabel(n)) {
          continue;
        }
        let txt = this.lang === 'en' ? nodeName(n, true) : n.name;
        if (this.lang === 'zh' && n.type === 'gate' && txt.startsWith('登机口')) {
          txt = txt.substring(3); // 登机口A101 -> A101
        }
        const sx = this.view.scrX(n.x);
        const sy = this.view.scrY(n.y) + 13;
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(252,252,251,0.9)';
        ctx.strokeText(txt, sx, sy);
        ctx.fillStyle = 'rgba(20,20,20,0.78)';
        ctx.fillText(txt, sx, sy);
      }
    }
  }

  // 什么节点值得贴标签（走廊/换层设施本身不做目标，仅少数语义节点）
  private shouldLabel(n: MapNode): boolean {
    const t = n.type;
    if (t === 'corridor' || t === 'lift' || t === 'escalator' || t === 'stair') {
      return n.id === 'xha_p1_luggage' || n.id === 'xha_b1_metroG' || n.id === 'xha_b2_pasg';
    }
    return true;
  }

  // ---------------- 比例尺 ----------------
  private drawScaleBar(ctx: CanvasRenderingContext2D): void {
    const meters = 20;
    const len = meters * PX_PER_METER * this.view.zoom;
    const y = ctx.height - 14;
    const x = 12;
    ctx.strokeStyle = 'rgba(20,20,20,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y);
    ctx.moveTo(x, y - 4);
    ctx.lineTo(x, y + 4);
    ctx.moveTo(x + len, y - 4);
    ctx.lineTo(x + len, y + 4);
    ctx.stroke();
    ctx.font = '10px sans-serif';
    ctx.fillStyle = 'rgba(20,20,20,0.5)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(meters + 'm', x + len / 2, y - 5);
  }

  // ---------------- 路线（含动效进度） ----------------
  private drawRoute(ctx: CanvasRenderingContext2D): void {
    const ids = this.pathNodeIds;
    if (ids.length < 2) {
      return;
    }
    // 本层路线点（按顺序）
    const pts: Pt[] = [];
    for (let i = 0; i < ids.length; i++) {
      const n = NODE_IDX.get(ids[i]);
      if (n === undefined || n.floor !== this.floor) {
        continue;
      }
      pts.push({ x: this.view.scrX(n.x), y: this.view.scrY(n.y) });
    }
    if (pts.length < 2) {
      return;
    }
    const seg = this.cutPolyline(pts, this.progress);
    if (seg.length < 2) {
      return;
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // 白描边
    ctx.strokeStyle = ROUTE.case;
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.moveTo(seg[0].x, seg[0].y);
    for (let i = 1; i < seg.length; i++) {
      ctx.lineTo(seg[i].x, seg[i].y);
    }
    ctx.stroke();
    // 主色线
    ctx.strokeStyle = ROUTE.color;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(seg[0].x, seg[0].y);
    for (let i = 1; i < seg.length; i++) {
      ctx.lineTo(seg[i].x, seg[i].y);
    }
    ctx.stroke();

    // 起点 / 终点
    const first = NODE_IDX.get(ids[0]);
    const last = NODE_IDX.get(ids[ids.length - 1]);
    if (this.progress >= 0.999) {
      if (this.isStart && first !== undefined && first.floor === this.floor) {
        this.pinMarker(ctx, this.view.scrX(first.x), this.view.scrY(first.y), '#0A8F3C');
      }
      if (this.isEnd && last !== undefined && last.floor === this.floor) {
        this.pinMarker(ctx, this.view.scrX(last.x), this.view.scrY(last.y), HIT);
      }
    }

    // 安检必经徽标
    if (this.viaSecurity) {
      this.drawSecurityBadge(ctx);
    }
  }

  // 按进度把折线裁剪成「屏坐标点数组」：不足一段时线性内插
  private cutPolyline(pts: Pt[], frac: number): Pt[] {
    const out: Pt[] = [];
    const n = pts.length;
    if (n === 0) {
      return out;
    }
    out.push(pts[0]);
    let total = 0;
    const lens: number[] = [];
    for (let i = 1; i < n; i++) {
      const dx = pts[i].x - pts[i - 1].x;
      const dy = pts[i].y - pts[i - 1].y;
      const l = Math.sqrt(dx * dx + dy * dy);
      lens.push(l);
      total += l;
    }
    if (total <= 0) {
      return pts;
    }
    const target = total * Math.max(0, Math.min(1, frac));
    let acc = 0;
    for (let i = 0; i < lens.length; i++) {
      if (acc + lens[i] >= target) {
        const t = lens[i] > 0 ? (target - acc) / lens[i] : 0;
        out.push({ x: pts[i].x + (pts[i + 1].x - pts[i].x) * t, y: pts[i].y + (pts[i + 1].y - pts[i].y) * t });
        return out;
      }
      acc += lens[i];
      out.push(pts[i + 1]);
    }
    return out;
  }

  private pinMarker(ctx: CanvasRenderingContext2D, sx: number, sy: number, color: string): void {
    ctx.beginPath();
    ctx.arc(sx, sy, 9, 0, 2 * Math.PI);
    ctx.fillStyle = MAP.surface;
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(sx, sy, 3, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
  }

  private drawSecurityBadge(ctx: CanvasRenderingContext2D): void {
    const sn = NODE_IDX.get(SECURITY_ID);
    if (sn === undefined || sn.floor !== this.floor) {
      return;
    }
    const sx = this.view.scrX(sn.x);
    const sy = this.view.scrY(sn.y);
    ctx.beginPath();
    ctx.arc(sx, sy, 4, 0, 2 * Math.PI);
    ctx.fillStyle = ROUTE.color;
    ctx.fill();
    const label = this.lang === 'zh' ? '安检' : 'SEC';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = 'rgba(227,73,72,0.95)';
    ctx.fillText(label, sx, sy - 8);
  }

  // ================= 交互：平移 / 缩放 / 点选 =================
  // 返回类型不写注解：Gesture 家族在本 SDK 是「值」(工厂函数)，无类型名；让编译器从调用推断
  private gestures() {
    return GestureGroup(GestureMode.Parallel,
      PanGesture({ fingers: 1, distance: 4 })
        .onActionStart(() => {
          this.lastPanX = 0;
          this.lastPanY = 0;
        })
        .onActionUpdate((e: GestureEvent | undefined) => {
          if (e === undefined) {
            return;
          }
          const dx = e.offsetX - this.lastPanX;
          const dy = e.offsetY - this.lastPanY;
          this.lastPanX = e.offsetX;
          this.lastPanY = e.offsetY;
          this.view.pan(dx, dy);
          this.draw();
        }),
      PinchGesture({ fingers: 2, distance: 3 })
        .onActionStart(() => {
          this.lastScale = 1;
        })
        .onActionUpdate((e: GestureEvent | undefined) => {
          if (e === undefined) {
            return;
          }
          const factor = e.scale / this.lastScale;
          this.lastScale = e.scale;
          this.view.pinch(e.pinchCenterX, e.pinchCenterY, factor);
          this.draw();
        }));
  }

  private handleTap(e: ClickEvent): void {
    if (!this.selectable) {
      return;
    }
    const cx = e.x;
    const cy = e.y;
    const tol = 26;
    let bestId = '';
    let bestDist = Number.MAX_VALUE;
    for (let i = 0; i < XHA_NODES.length; i++) {
      const n = XHA_NODES[i];
      if (n.floor !== this.floor) {
        continue;
      }
      const sx = this.view.scrX(n.x);
      const sy = this.view.scrY(n.y);
      const dx = sx - cx;
      const dy = sy - cy;
      const d = dx * dx + dy * dy;
      if (d < bestDist) {
        bestDist = d;
        bestId = n.id;
      }
    }
    if (bestId.length > 0 && bestDist <= tol * tol) {
      this.onNodeTap(bestId);
    }
  }

  build() {
    Canvas(this.ctx)
      .width('100%')
      .height('100%')
      .backgroundColor(MAP.surface)
      .onReady(() => {
        this.ready = true;
        this.draw();
      })
      .onAreaChange(() => {
        this.draw();
      })
      .gesture(this.gestures())
      .onClick((e: ClickEvent) => {
        this.handleTap(e);
      });
  }
}