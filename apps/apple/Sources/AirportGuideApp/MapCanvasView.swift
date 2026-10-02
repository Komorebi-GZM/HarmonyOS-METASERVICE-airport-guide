// SwiftUI 地图视图：把 AirportUI 的绘制命令流逐条画出来，并处理拖拽/捏合/点选。
//
// 这里刻意保持"薄"：图层顺序、用色、标签阈值、命中半径全部来自 MapRenderer（已被 swift test 覆盖），
// 本文件只负责坐标空间、手势与命令解释。

import SwiftUI
import AirportCore
import AirportUI

extension Color {
  init(_ rgba: RGBAColor) {
    self.init(.sRGB, red: rgba.red, green: rgba.green, blue: rgba.blue, opacity: rgba.alpha)
  }

  init?(hex: String) {
    guard let rgba = RGBAColor(string: hex) else { return nil }
    self.init(rgba)
  }
}

struct MapCanvasView: View {
  let floor: String
  let routeNodeIds: [String]
  let currentRouteIndex: Int
  let startId: String
  let endId: String
  let languageEn: Bool
  var onTapNode: (MapNode?) -> Void

  @State private var viewport = Viewport()
  @State private var fitKey = ""
  @State private var dragOrigin: CGSize = .zero
  @State private var zoomBase: Double = 1

  private var graph: AirportGraph { .shared }

  var body: some View {
    GeometryReader { geo in
      Canvas { context, size in
        let input = MapRenderInput(
          floor: floor,
          viewport: viewport,
          width: size.width,
          height: size.height,
          routeNodeIds: routeNodeIds,
          currentRouteIndex: currentRouteIndex,
          startId: startId,
          endId: endId,
          languageEn: languageEn
        )
        for command in MapRenderer.render(graph, input) {
          draw(command, in: &context, size: size)
        }
      }
      .background(Color(hex: graph.bundle.tokens.MAP["surface"] ?? "#F6F8F8") ?? Color.white)
      .contentShape(Rectangle())
      .onAppear { refit(size: geo.size) }
      .onChange(of: floor) { _, _ in refit(size: geo.size, force: true) }
      .onChange(of: routeNodeIds) { _, _ in refit(size: geo.size, force: true) }
      .onChange(of: geo.size) { _, newValue in refit(size: newValue) }
      .gesture(
        DragGesture(minimumDistance: 3)
          .onChanged { value in
            let dx = value.translation.width - dragOrigin.width
            let dy = value.translation.height - dragOrigin.height
            dragOrigin = value.translation
            viewport.pan(dx, dy)
          }
          .onEnded { value in
            dragOrigin = .zero
            if abs(value.translation.width) < 4 && abs(value.translation.height) < 4 {
              let hit = MapRenderer.hitTest(graph, floor: floor, viewport: viewport,
                                            x: value.location.x, y: value.location.y)
              onTapNode(hit)
            }
          }
      )
      .simultaneousGesture(
        MagnificationGesture()
          .onChanged { scale in
            let factor = scale / zoomBase
            zoomBase = scale
            viewport.pinch(geo.size.width / 2, geo.size.height / 2, factor: factor)
          }
          .onEnded { _ in zoomBase = 1 }
      )
      .overlay(alignment: .bottomTrailing) {
        HStack(spacing: 8) {
          mapButton("plus") { viewport.pinch(geo.size.width / 2, geo.size.height / 2, factor: 1.35) }
          mapButton("minus") { viewport.pinch(geo.size.width / 2, geo.size.height / 2, factor: 0.75) }
        }
        .padding(10)
      }
    }
  }

  private func mapButton(_ systemName: String, action: @escaping () -> Void) -> some View {
    Button(action: action) {
      Image(systemName: systemName)
        .font(Theme.font(14, .bold))
        .frame(width: 32, height: 32)
        .background(.thinMaterial, in: Circle())
    }
    .buttonStyle(.plain)
  }

  /// 只在"楼层/路线/尺寸"变化时重新适配，避免用户拖动后被重置
  private func refit(size: CGSize, force: Bool = false) {
    let key = "\(floor)|\(routeNodeIds.count)|\(Int(size.width))x\(Int(size.height))"
    if !force && key == fitKey { return }
    fitKey = key
    if routeNodeIds.isEmpty {
      viewport = MapRenderer.fitFloor(graph, floor: floor, width: size.width, height: size.height)
    } else {
      viewport = MapRenderer.fitRoute(graph, nodeIds: routeNodeIds, width: size.width, height: size.height)
    }
  }

  private func draw(_ command: DrawCommand, in context: inout GraphicsContext, size: CGSize) {
    switch command {
    case let .fillRect(x, y, width, height, color):
      let rect = CGRect(x: x, y: y, width: width, height: height)
      context.fill(Path(rect), with: .color(Color(hex: color) ?? .gray))

    case let .polyline(points, color, width):
      guard points.count > 1 else { return }
      var path = Path()
      path.move(to: CGPoint(x: points[0].x, y: points[0].y))
      for point in points.dropFirst() {
        path.addLine(to: CGPoint(x: point.x, y: point.y))
      }
      context.stroke(path, with: .color(Color(hex: color) ?? .gray),
                     style: StrokeStyle(lineWidth: width, lineCap: .round, lineJoin: .round))

    case let .circle(x, y, radius, fill, stroke, strokeWidth):
      let rect = CGRect(x: x - radius, y: y - radius, width: radius * 2, height: radius * 2)
      context.fill(Path(ellipseIn: rect), with: .color(Color(hex: fill) ?? .gray))
      if let stroke {
        context.stroke(Path(ellipseIn: rect), with: .color(Color(hex: stroke) ?? .white),
                       style: StrokeStyle(lineWidth: strokeWidth))
      }

    case let .labelPlate(x, y, width, height, color):
      let rect = CGRect(x: x, y: y, width: width, height: height)
      context.fill(Path(roundedRect: rect, cornerRadius: 3), with: .color(Color(hex: color) ?? .white))

    case let .text(x, y, string, size_, color, align, baseline, _):
      var text = Text(string).font(.system(size: size_))
      text = text.foregroundColor(Color(hex: color) ?? .black)
      let resolved = context.resolve(text)
      let metrics = resolved.measure(in: size)
      var dx = x
      if align == .center { dx -= metrics.width / 2 }
      if align == .right { dx -= metrics.width }
      var dy = y
      if baseline == .middle { dy -= metrics.height / 2 }
      context.draw(resolved, at: CGPoint(x: dx, y: dy), anchor: .topLeading)
    }
  }
}
