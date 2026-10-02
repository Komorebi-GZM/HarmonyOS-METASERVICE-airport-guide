// 绘制命令流：把"画什么"与"用什么画"分开。
//
// 这是 Apple 端可测性的关键：地图渲染是一批纯函数（输入图/路线/视口，输出命令数组），
// SwiftUI 的 Canvas 只负责逐条执行命令。于是"图层顺序、用色、标签阈值、命中半径"
// 这些容易出错的细节都能在 `swift test` 里断言，而不依赖真机截图。
//
// 与 Web 端 apps/web/src/map-view.ts 的图层顺序逐条对应。

import Foundation
import AirportCore

public enum TextAlign: String, Sendable {
  case left
  case center
  case right
}

public enum TextBaseline: String, Sendable {
  case top
  case middle
}

/// 一条绘制命令。坐标已是屏幕（视图）坐标，单位与 ArkUI 的 vp / Web 的 CSS px 对齐。
public enum DrawCommand: Equatable, Sendable {
  /// 填充矩形
  case fillRect(x: Double, y: Double, width: Double, height: Double, color: String)
  /// 折线（含圆角端点）
  case polyline(points: [Point], color: String, width: Double)
  /// 实心圆（可带描边）
  case circle(x: Double, y: Double, radius: Double, fill: String, stroke: String?, strokeWidth: Double)
  /// 文本（可带底色高亮，用于地图标签避让）
  case text(x: Double, y: Double, string: String, size: Double, color: String, align: TextAlign, baseline: TextBaseline, background: String?)
  /// 半透明底衬（标签底片）
  case labelPlate(x: Double, y: Double, width: Double, height: Double, color: String)

  public struct Point: Equatable, Sendable {
    public let x: Double
    public let y: Double
    public init(_ x: Double, _ y: Double) {
      self.x = x
      self.y = y
    }
  }
}

/// 地图渲染的输入（避免长参数列表，也方便测试构造）
public struct MapRenderInput {
  public var floor: String
  public var viewport: Viewport
  public var routeNodeIds: [String]
  public var currentRouteIndex: Int
  public var startId: String
  public var endId: String
  public var languageEn: Bool

  public init(
    floor: String,
    viewport: Viewport,
    routeNodeIds: [String] = [],
    currentRouteIndex: Int = -1,
    startId: String = "",
    endId: String = "",
    languageEn: Bool = false
  ) {
    self.floor = floor
    self.viewport = viewport
    self.routeNodeIds = routeNodeIds
    self.currentRouteIndex = currentRouteIndex
    self.startId = startId
    self.endId = endId
    self.languageEn = languageEn
  }
}

/// 可测的地图渲染器
public enum MapRenderer {
  /// 已走过 / 全程预览的路径色。ArkTS 的 FloorCanvas 实画的是这个值（与 Theme.ROUTE.trans 漂移），
  /// 此处按"实画值"对齐，漂移登记在 docs/TODO.md T-206。
  public static let routeDone = "#9ACCC6"
  public static let routeLive = "#007F7A"
  public static let corridorCasing = "#DCE6E8"
  public static let corridorFill = "#FFFFFF"
  public static let floorBase = "#E9F0F1"
  public static let hitRadius: Double = 22
  public static let markerEndColor = "#B86A12"

  /// 与 Web 端一致的节点半径规则
  public static func radius(of node: MapNode) -> Double {
    if node.type == "corridor" { return 2.6 }
    if node.type == "lift" || node.type == "escalator" || node.type == "stair" { return 4 }
    return 5.5
  }

  /// 标签可见性：放大到一定程度才显示全部，中等缩放只显示关键类型
  public static func shouldLabel(_ node: MapNode, zoom: Double) -> Bool {
    if node.type == "corridor" { return false }
    if zoom >= 0.85 { return true }
    if zoom >= 0.5 {
      return ["gate", "metro", "checkin", "security", "entrance", "exit"].contains(node.type)
    }
    return false
  }

  public static func color(of type: String) -> String {
    AirportGraph.shared.bundle.tokens.TYPE_COLOR[type] ?? "#486A85"
  }

  /// 生成某层的全部绘制命令（顺序即图层顺序）
  public static func render(_ graph: AirportGraph, _ input: MapRenderInput) -> [DrawCommand] {
    let vp = input.viewport
    let floor = input.floor
    var commands: [DrawCommand] = []

    // 1. 底色
    let surface = graph.bundle.tokens.MAP["surface"] ?? "#F6F8F8"
    commands.append(.fillRect(x: 0, y: 0, width: 1000, height: 1000, color: surface))

    // 2. 楼层底板（按该层陆/空节点占比选色）
    let nodes = graph.floorNodes(floor)
    let landCount = nodes.filter { $0.side == .land }.count
    let bbox = graph.floorBBox(floor)
    let wash = (landCount * 2 >= nodes.count)
      ? (graph.bundle.tokens.MAP["landWash"] ?? "#EDF2F4")
      : (graph.bundle.tokens.MAP["airWash"] ?? "#E5F2F0")
    commands.append(.fillRect(
      x: vp.scrX(bbox.minX), y: vp.scrY(bbox.minY),
      width: (bbox.maxX - bbox.minX) * vp.zoom,
      height: (bbox.maxY - bbox.minY) * vp.zoom,
      color: wash
    ))

    // 3. walk 走廊：深色外描边 + 白色内芯（双描边）
    let onFloor = Set(nodes.map(\.id))
    var corridorPoints: [DrawCommand.Point] = []
    for edge in graph.edges where edge.type == "walk" {
      guard onFloor.contains(edge.from), onFloor.contains(edge.to) else { continue }
      let a = graph.node(edge.from)!
      let b = graph.node(edge.to)!
      corridorPoints.append(.init(vp.scrX(a.x), vp.scrY(a.y)))
      corridorPoints.append(.init(vp.scrX(b.x), vp.scrY(b.y)))
    }
    if !corridorPoints.isEmpty {
      commands.append(.polyline(points: corridorPoints, color: corridorCasing, width: max(6, 22 * vp.zoom)))
      commands.append(.polyline(points: corridorPoints, color: corridorFill, width: max(4, 18 * vp.zoom)))
    }

    // 4. 路径：全程（褪色）+ 当前路段（强调）
    if input.routeNodeIds.count > 1 {
      let pathPoints = input.routeNodeIds.compactMap { id -> DrawCommand.Point? in
        guard let node = graph.node(id) else { return nil }
        return .init(vp.scrX(node.x), vp.scrY(node.y))
      }
      let doneWidth = max(4, 5 * min(vp.zoom + 0.6, 1.6))
      commands.append(.polyline(points: pathPoints, color: routeDone, width: doneWidth))
      if input.currentRouteIndex >= 0 && input.currentRouteIndex < input.routeNodeIds.count {
        let from = max(0, input.currentRouteIndex - 1)
        let slice = input.routeNodeIds[from...input.currentRouteIndex].compactMap { id -> DrawCommand.Point? in
          guard let node = graph.node(id) else { return nil }
          return .init(vp.scrX(node.x), vp.scrY(node.y))
        }
        if slice.count > 1 {
          commands.append(.polyline(points: slice, color: routeLive, width: max(5, 6 * min(vp.zoom + 0.6, 1.6))))
        }
      }
    }

    // 5. 节点
    let nodeScale = min(max(vp.zoom, 0.8), 2)
    for node in nodes {
      let radius = max(2, radius(of: node) * nodeScale)
      commands.append(.circle(
        x: vp.scrX(node.x), y: vp.scrY(node.y), radius: radius,
        fill: color(of: node.type),
        stroke: node.type == "corridor" ? nil : "#FFFFFF",
        strokeWidth: 1.4
      ))
    }

    // 6. 标签（带底片，避免压住线条）
    let ink = graph.bundle.tokens.MAP["ink"] ?? "#172B3A"
    for node in nodes where shouldLabel(node, zoom: vp.zoom) {
      let text = I18n.nodeName(node, en: input.languageEn)
      guard !text.isEmpty else { continue }
      let size = vp.zoom >= 1.6 ? 12.0 : 11.0
      let lx = vp.scrX(node.x) + 8
      let ly = vp.scrY(node.y) - 9
      let width = Double(text.count) * size * 0.62 + 4
      commands.append(.labelPlate(x: lx - 2, y: ly - size / 2 - 1, width: width, height: size + 2, color: "rgba(255,255,255,0.86)"))
      commands.append(.text(x: lx, y: ly, string: text, size: size, color: ink, align: .left, baseline: .middle, background: nil))
    }

    // 7. 起终点标记
    if let start = graph.node(input.startId), start.floor == floor {
      commands.append(.circle(
        x: vp.scrX(start.x), y: vp.scrY(start.y), radius: 11,
        fill: routeLive, stroke: "#FFFFFF", strokeWidth: 2
      ))
      commands.append(.text(
        x: vp.scrX(start.x), y: vp.scrY(start.y), string: I18n.t("start_marker", en: input.languageEn),
        size: 12, color: "#FFFFFF", align: .center, baseline: .middle, background: nil
      ))
    }
    if let end = graph.node(input.endId), end.floor == floor {
      commands.append(.circle(
        x: vp.scrX(end.x), y: vp.scrY(end.y), radius: 11,
        fill: markerEndColor, stroke: "#FFFFFF", strokeWidth: 2
      ))
      commands.append(.text(
        x: vp.scrX(end.x), y: vp.scrY(end.y), string: I18n.t("end_marker", en: input.languageEn),
        size: 12, color: "#FFFFFF", align: .center, baseline: .middle, background: nil
      ))
    }

    // 8. 楼层水印
    let ink2 = graph.bundle.tokens.MAP["ink2"] ?? "#657582"
    commands.append(.text(x: 348, y: 10, string: floor, size: 13, color: ink2, align: .right, baseline: .top, background: nil))

    return commands
  }

  /// 命中测试：屏幕点 → 最近的可见节点（半径 22 内），与 Web / ArkTS 行为一致
  public static func hitTest(
    _ graph: AirportGraph,
    floor: String,
    viewport: Viewport,
    x: Double,
    y: Double,
    radius: Double = MapRenderer.hitRadius
  ) -> MapNode? {
    var best: MapNode?
    var bestDistance = radius
    for node in graph.floorNodes(floor) {
      let dx = viewport.scrX(node.x) - x
      let dy = viewport.scrY(node.y) - y
      let distance = (dx * dx + dy * dy).squareRoot()
      if distance < bestDistance {
        bestDistance = distance
        best = node
      }
    }
    return best
  }

  /// 适配某层（漫游模式）与适配某条路线（路线模式）—— 与 Web 端同一套 inset
  public static func fitFloor(_ graph: AirportGraph, floor: String, width: Double, height: Double) -> Viewport {
    var vp = Viewport()
    vp.fitInsets(graph.floorBBox(floor), width: width, height: height,
                 left: Insets.browse.left, top: Insets.browse.top,
                 right: Insets.browse.right, bottom: Insets.browse.bottom)
    return vp
  }

  public static func fitRoute(_ graph: AirportGraph, nodeIds: [String], width: Double, height: Double, pad: Double = 24) -> Viewport {
    var vp = Viewport()
    guard !nodeIds.isEmpty else { return vp }
    var minX = Double.infinity, minY = Double.infinity
    var maxX = -Double.infinity, maxY = -Double.infinity
    for id in nodeIds {
      guard let node = graph.node(id) else { continue }
      minX = min(minX, node.x); minY = min(minY, node.y)
      maxX = max(maxX, node.x); maxY = max(maxY, node.y)
    }
    if !minX.isFinite { return vp }
    vp.fitInsets(
      BBox(minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad),
      width: width, height: height,
      left: Insets.route.left, top: Insets.route.top,
      right: Insets.route.right, bottom: Insets.route.bottom
    )
    return vp
  }
}
