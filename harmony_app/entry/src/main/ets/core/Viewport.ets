// Drawing and hit testing share vp coordinates; pan limits follow the current canvas.
export class Viewport {
  zoom: number = 1; tx: number = 0; ty: number = 0;
  private bbox: number[] = [0, 0, 1, 1]; private w: number = 1; private h: number = 1; private minZoom: number = 0.1;
  reset(): void { this.zoom = 1; this.tx = 0; this.ty = 0; }
  fit(bbox: number[], w: number, h: number, pad: number): void {
    this.fitInsets(bbox, w, h, pad, pad, pad, pad);
  }
  fitInsets(bbox: number[], w: number, h: number, left: number, top: number, right: number, bottom: number): void {
    this.bbox = bbox; this.w = w; this.h = h;
    const bw = Math.max(1, bbox[2] - bbox[0]); const bh = Math.max(1, bbox[3] - bbox[1]);
    const innerW = Math.max(1, w - left - right); const innerH = Math.max(1, h - top - bottom);
    this.zoom = Math.max(0.05, Math.min(innerW / bw, innerH / bh));
    this.minZoom = this.zoom * 0.75;
    this.tx = left + (innerW - bw * this.zoom) / 2 - bbox[0] * this.zoom;
    this.ty = top + (innerH - bh * this.zoom) / 2 - bbox[1] * this.zoom;
  }
  scrX(x: number): number { return this.tx + x * this.zoom; }
  scrY(y: number): number { return this.ty + y * this.zoom; }
  pan(dx: number, dy: number): void { this.tx += dx; this.ty += dy; this.clampT(); }
  pinch(cx: number, cy: number, factor: number): void {
    const z = Math.max(this.minZoom, Math.min(5, this.zoom * factor)); const k = z / this.zoom;
    this.tx = cx - (cx - this.tx) * k; this.ty = cy - (cy - this.ty) * k; this.zoom = z; this.clampT();
  }
  private clampT(): void {
    const margin = 56; this.tx = Math.max(margin - this.bbox[2] * this.zoom, Math.min(this.w - margin - this.bbox[0] * this.zoom, this.tx));
    this.ty = Math.max(margin - this.bbox[3] * this.zoom, Math.min(this.h - margin - this.bbox[1] * this.zoom, this.ty));
  }
}
