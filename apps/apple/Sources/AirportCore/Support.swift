// 配套能力：地点检索、分类、双语文案、视口。
// 分别对应 ArkTS 的 core/Places.ets、model/Categories.ets、model/{Loc,Localization}.ets、core/Viewport.ets。

import Foundation

// ---------------------------------------------------------------- 地点检索

public enum Places {
  /// 虽是 corridor，但语义上用户可见（白名单）
  static let publicCorridors: Set<String> = [
    "xha_p4_preSec", "xha_p3_deck", "xha_p3_kids", "xha_p1_luggage",
    "xha_p1_linkG", "xha_b1_metroG", "xha_b2_pasg",
  ]

  public static func place(_ graph: AirportGraph, _ id: String) -> MapNode? { graph.node(id) }

  public static func placeName(_ graph: AirportGraph, _ id: String, en: Bool) -> String {
    guard let node = place(graph, id) else { return "" }
    return I18n.nodeName(node, en: en)
  }

  public static func isPublic(_ node: MapNode) -> Bool {
    node.type != "corridor" || publicCorridors.contains(node.id)
  }

  /// 登机口编号（A101 → "a101"），非登机口返回空串
  public static func gateCode(_ node: MapNode) -> String {
    node.type == "gate" ? node.name.replacingOccurrences(of: "登机口", with: "").lowercased() : ""
  }

  public static func search(_ graph: AirportGraph, query: String, category: String = "all") -> [MapNode] {
    let q = query.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    var out: [MapNode] = []
    for node in graph.nodes {
      if !isPublic(node) { continue }
      if category != "all" && Categories.catOf(node) != category { continue }
      if q.isEmpty
        || node.name.lowercased().contains(q)
        || I18n.nodeName(node, en: true).lowercased().contains(q)
        || (node.type == "gate" && gateCode(node).contains(q)) {
        out.append(node)
      }
    }
    // 编号完全相等排最前（稳定排序，保持原有相对顺序）
    return out.enumerated().sorted { a, b in
      let ea = !q.isEmpty && gateCode(a.element) == q ? 0 : 1
      let eb = !q.isEmpty && gateCode(b.element) == q ? 0 : 1
      return ea == eb ? a.offset < b.offset : ea < eb
    }.map(\.element)
  }

  public static func recent(_ graph: AirportGraph, ids: [String], id: String) -> [String] {
    var out: [String] = []
    if place(graph, id) != nil { out.append(id) }
    for candidate in ids where out.count < 6 {
      if candidate != id && !out.contains(candidate) && place(graph, candidate) != nil {
        out.append(candidate)
      }
    }
    return out
  }

  public static func listed(_ graph: AirportGraph, category: String = "all") -> [MapNode] {
    graph.nodes.filter { isPublic($0) && (category == "all" || Categories.catOf($0) == category) }
  }
}

// ---------------------------------------------------------------- 分类

public struct Category: Sendable, Equatable {
  public let key: String
  public let nameZh: String
  public let nameEn: String
  public let symbol: String
}

public enum Categories {
  public static let all: [Category] = [
    Category(key: "all", nameZh: "全部", nameEn: "All", symbol: "⌘"),
    Category(key: "gate", nameZh: "登机口", nameEn: "Gates", symbol: "✈"),
    Category(key: "checkin", nameZh: "值机·安检", nameEn: "Check-in", symbol: "✓"),
    Category(key: "door", nameZh: "出入口", nameEn: "Doors", symbol: "⇄"),
    Category(key: "baggage", nameZh: "行李", nameEn: "Baggage", symbol: "◫"),
    Category(key: "metro", nameZh: "地铁", nameEn: "Metro", symbol: "◆"),
    Category(key: "transport", nameZh: "接驳交通", nameEn: "Pickups", symbol: "▣"),
    Category(key: "parking", nameZh: "停车·地面", nameEn: "Parking", symbol: "▤"),
    Category(key: "service", nameZh: "商业·服务", nameEn: "Services", symbol: "☕"),
    Category(key: "vertical", nameZh: "换层设施", nameEn: "Verticals", symbol: "⇕"),
  ]

  static let typeCat: [String: String] = [
    "gate": "gate", "checkin": "checkin", "security": "checkin",
    "entrance": "door", "exit": "door", "baggage": "baggage",
    "metro": "metro", "coach": "transport", "parking": "parking",
    "toilet": "service", "hall": "service", "corridor": "service",
    "lift": "vertical", "escalator": "vertical", "stair": "vertical",
  ]

  /// 个别跨类型节点按 id 校正分类
  static let idCat: [String: String] = [
    "xha_p1_luggage": "baggage",
    "xha_b1_metroL": "metro",
    "xha_b1_metroG": "metro",
    "xha_b2_pasg": "metro",
    "xha_p1_linkG": "parking",
    "xha_b1_gtc": "transport",
    "xha_p1_bus": "transport",
  ]

  public static func catOf(_ node: MapNode) -> String {
    if let byId = idCat[node.id] { return byId }
    return typeCat[node.type] ?? "service"
  }

  public static func name(_ key: String, en: Bool) -> String {
    guard let category = all.first(where: { $0.key == key }) else { return key }
    return en ? category.nameEn : category.nameZh
  }

  public static func symbol(_ key: String) -> String {
    all.first(where: { $0.key == key })?.symbol ?? "•"
  }

  /// 快捷目的地：总览页"高频直达"，展示优先序
  public static let hotDestinations: [String] = [
    "xha_p4_doorW", "xha_p4_doorN", "xha_p4_doorE",
    "xha_p4_sec",
    "xha_p4_airMall", "xha_p3_food", "xha_p3_loungeA",
    "xha_p4_gA101", "xha_p4_gC308",
    "xha_b2_platA", "xha_b2_platB",
    "xha_p2_bagA", "xha_p1_taxi", "xha_b1_gtc",
  ]
}

// ---------------------------------------------------------------- 双语

public enum I18n {
  private static let zh: [String: String] = {
    var map: [String: String] = [:]
    for t in AirportGraph.shared.bundle.i18n { map[t.key] = t.zh }
    return map
  }()

  private static let en: [String: String] = {
    var map: [String: String] = [:]
    for t in AirportGraph.shared.bundle.i18n { map[t.key] = t.en }
    return map
  }()

  public static var keys: [String] { AirportGraph.shared.bundle.i18n.map(\.key) }

  /// 文案查表；未命中回落 key 本身
  public static func t(_ key: String, en isEn: Bool) -> String {
    let map = isEn ? en : zh
    return map[key] ?? key
  }

  public static func hasKey(_ key: String) -> Bool { zh[key] != nil }

  public static func floorLabel(_ floor: String, en isEn: Bool) -> String {
    guard let text = AirportGraph.shared.bundle.floorLabels[floor] else { return floor }
    return isEn ? text.en : text.zh
  }

  public static func floorShort(_ floor: String) -> String { floor }

  public static func typeLabel(_ type: String, en isEn: Bool) -> String {
    guard let text = AirportGraph.shared.bundle.typeLabels[type] else { return type }
    return isEn ? text.en : text.zh
  }

  /// 节点显示名：优先英文（生成表），缺失回落中文；安检节点特殊处理
  public static func nodeName(_ node: MapNode, en isEn: Bool) -> String {
    if node.type == "security" {
      return isEn ? "Central Security" : "中央安检大厅"
    }
    if isEn {
      return AirportGraph.shared.bundle.nodeEn[node.id] ?? node.name
    }
    return node.name
  }

  public static func floorOrder() -> [String] { AirportGraph.shared.floorOrder }

  public static func facilityLabel(_ viaType: String, en isEn: Bool) -> String {
    switch viaType {
    case "elevator": return t("elevator", en: isEn)
    case "escalator": return t("escalator", en: isEn)
    case "stair": return t("stair", en: isEn)
    default: return viaType
    }
  }
}

// ---------------------------------------------------------------- 视口

public struct Viewport: Sendable {
  public static let panMargin: Double = 56
  public static let maxZoom: Double = 5

  public var zoom: Double = 1
  public var tx: Double = 0
  public var ty: Double = 0
  public var minZoom: Double = 0.1

  private var bbox: BBox = BBox(minX: 0, minY: 0, maxX: 1, maxY: 1)
  private var width: Double = 1
  private var height: Double = 1

  public init() {}

  public mutating func reset() {
    zoom = 1
    tx = 0
    ty = 0
  }

  public mutating func fit(_ bbox: BBox, width w: Double, height h: Double, pad: Double) {
    fitInsets(bbox, width: w, height: h, left: pad, top: pad, right: pad, bottom: pad)
  }

  public mutating func fitInsets(
    _ bbox: BBox, width w: Double, height h: Double,
    left: Double, top: Double, right: Double, bottom: Double
  ) {
    self.bbox = bbox
    self.width = w
    self.height = h
    let bw = max(1, bbox.maxX - bbox.minX)
    let bh = max(1, bbox.maxY - bbox.minY)
    let innerW = max(1, w - left - right)
    let innerH = max(1, h - top - bottom)
    zoom = max(0.05, min(innerW / bw, innerH / bh))
    minZoom = zoom * 0.75
    tx = left + (innerW - bw * zoom) / 2 - bbox.minX * zoom
    ty = top + (innerH - bh * zoom) / 2 - bbox.minY * zoom
  }

  public func scrX(_ x: Double) -> Double { tx + x * zoom }
  public func scrY(_ y: Double) -> Double { ty + y * zoom }
  public func worldX(_ sx: Double) -> Double { (sx - tx) / zoom }
  public func worldY(_ sy: Double) -> Double { (sy - ty) / zoom }

  public mutating func pan(_ dx: Double, _ dy: Double) {
    tx += dx
    ty += dy
    clampT()
  }

  public mutating func pinch(_ cx: Double, _ cy: Double, factor: Double) {
    let z = max(minZoom, min(Viewport.maxZoom, zoom * factor))
    let k = z / zoom
    tx = cx - (cx - tx) * k
    ty = cy - (cy - ty) * k
    zoom = z
    clampT()
  }

  private mutating func clampT() {
    let margin = Viewport.panMargin
    tx = max(margin - bbox.maxX * zoom, min(width - margin - bbox.minX * zoom, tx))
    ty = max(margin - bbox.maxY * zoom, min(height - margin - bbox.minY * zoom, ty))
  }
}

/// ArkTS 端各页面的 inset 组合（路线视图 / 全层漫游）
public enum Insets {
  public static let route = (left: 32.0, top: 48.0, right: 72.0, bottom: 90.0)
  public static let browse = (left: 24.0, top: 48.0, right: 72.0, bottom: 78.0)
}
