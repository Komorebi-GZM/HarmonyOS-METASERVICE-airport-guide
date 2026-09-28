// 视口变换：图片来源坐标系 -> 画布屏幕坐标（zoom/translate 单一映射）
// 背景与拓扑共用同一变换，保证「手绘底图 + 拓扑叠加」天然对齐。中心点不动式缩放。
export class Viewport {
  zoom: number = 1;
  tx: number = 0; // 屏幕 = tx + 图x * zoom
  ty: number = 0;

  constructor() {
    this.reset();
  }

  reset(): void {
    this.zoom = 1;
    this.tx = 0;
    this.ty = 0;
  }

  // 适配包围盒 [minX,minY,maxX,maxY] 到 w×h，留 pad 边距；居中
  fit(bbox: number[], w: number, h: number, pad: number): void {
    const bw = bbox[2] - bbox[0];
    const bh = bbox[3] - bbox[1];
    if (bw <= 0 || bh <= 0 || w <= 0 || h <= 0) {
      return;
    }
    const z = Math.min((w - 2 * pad) / bw, (h - 2 * pad) / bh);
    this.zoom = Math.min(Math.max(z, 0.15), 8);
    this.tx = (w - bw * this.zoom) / 2 - bbox[0] * this.zoom;
    this.ty = (h - bh * this.zoom) / 2 - bbox[1] * this.zoom;
  }

  scrX(x: number): number {
    return this.tx + x * this.zoom;
  }

  scrY(y: number): number {
    return this.ty + y * this.zoom;
  }

  pan(dx: number, dy: number): void {
    this.tx += dx;
    this.ty += dy;
    this.clampT();
  }

  // 以 (cx,cy) 为不动点缩放
  pinch(cx: number, cy: number, factor: number): void {
    const z2 = Math.min(Math.max(this.zoom * factor, 0.15), 8);
    const k = z2 / this.zoom;
    this.tx = cx - (cx - this.tx) * k;
    this.ty = cy - (cy - this.ty) * k;
    this.zoom = z2;
  }

  private clampT(): void {
    const m = 2000;
    if (this.tx < -m) {
      this.tx = -m;
    }
    if (this.tx > m) {
      this.tx = m;
    }
    if (this.ty < -m) {
      this.ty = -m;
    }
    if (this.ty > m) {
      this.ty = m;
    }
  }
}