// 视口：绘制与命中测试共用同一套 vp 坐标。
// 与 ArkTS 端 core/Viewport.ets 逐行对应（含 56 的平移留白与 fit×0.75 的缩放下限）。

export const PAN_MARGIN = 56;
export const MAX_ZOOM = 5;

export class Viewport {
  zoom = 1;
  tx = 0;
  ty = 0;
  private bbox: [number, number, number, number] = [0, 0, 1, 1];
  private w = 1;
  private h = 1;
  minZoom = 0.1;

  reset(): void {
    this.zoom = 1;
    this.tx = 0;
    this.ty = 0;
  }

  fit(bbox: [number, number, number, number], w: number, h: number, pad: number): void {
    this.fitInsets(bbox, w, h, pad, pad, pad, pad);
  }

  fitInsets(
    bbox: [number, number, number, number],
    w: number,
    h: number,
    left: number,
    top: number,
    right: number,
    bottom: number,
  ): void {
    this.bbox = bbox;
    this.w = w;
    this.h = h;
    const bw = Math.max(1, bbox[2] - bbox[0]);
    const bh = Math.max(1, bbox[3] - bbox[1]);
    const innerW = Math.max(1, w - left - right);
    const innerH = Math.max(1, h - top - bottom);
    this.zoom = Math.max(0.05, Math.min(innerW / bw, innerH / bh));
    this.minZoom = this.zoom * 0.75;
    this.tx = left + (innerW - bw * this.zoom) / 2 - bbox[0] * this.zoom;
    this.ty = top + (innerH - bh * this.zoom) / 2 - bbox[1] * this.zoom;
  }

  scrX(x: number): number {
    return this.tx + x * this.zoom;
  }

  scrY(y: number): number {
    return this.ty + y * this.zoom;
  }

  /** 屏幕坐标 -> 世界坐标（命中测试与"点空白处"用） */
  worldX(sx: number): number {
    return (sx - this.tx) / this.zoom;
  }

  worldY(sy: number): number {
    return (sy - this.ty) / this.zoom;
  }

  pan(dx: number, dy: number): void {
    this.tx += dx;
    this.ty += dy;
    this.clampT();
  }

  pinch(cx: number, cy: number, factor: number): void {
    const z = Math.max(this.minZoom, Math.min(MAX_ZOOM, this.zoom * factor));
    const k = z / this.zoom;
    this.tx = cx - (cx - this.tx) * k;
    this.ty = cy - (cy - this.ty) * k;
    this.zoom = z;
    this.clampT();
  }

  zoomBy(cx: number, cy: number, step: number): void {
    this.pinch(cx, cy, step);
  }

  private clampT(): void {
    const margin = PAN_MARGIN;
    this.tx = Math.max(
      margin - this.bbox[2] * this.zoom,
      Math.min(this.w - margin - this.bbox[0] * this.zoom, this.tx),
    );
    this.ty = Math.max(
      margin - this.bbox[3] * this.zoom,
      Math.min(this.h - margin - this.bbox[1] * this.zoom, this.ty),
    );
  }
}

/** ArkTS 端各页面的 inset 组合（路线视图 / 全层漫游），迁移时保持一致 */
export const ROUTE_INSETS = { left: 32, top: 48, right: 72, bottom: 90 };
export const BROWSE_INSETS = { left: 24, top: 48, right: 72, bottom: 78 };
