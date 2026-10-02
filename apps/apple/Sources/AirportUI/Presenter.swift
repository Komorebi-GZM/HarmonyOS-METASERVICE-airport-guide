// 呈现层：把核心数据翻译成界面要显示的文字与列表。
// 纯函数、只依赖 AirportCore + Foundation，因此可以在 swift test 里逐条断言（见 Tests/AirportUITests）。

import Foundation
import AirportCore

/// 列表卡片（ForEach 需要 Identifiable，元组无法做 keyPath）
public struct PlaceCard: Identifiable, Sendable, Equatable {
  public let id: String
  public let title: String
  public let subtitle: String

  public init(id: String, title: String, subtitle: String) {
    self.id = id
    self.title = title
    self.subtitle = subtitle
  }
}

/// 横向 chips
public struct Chip: Identifiable, Sendable, Equatable {
  public let key: String
  public let label: String
  public var id: String { key }

  public init(key: String, label: String) {
    self.key = key
    self.label = label
  }
}

/// 地铁方向入口
public struct MetroDirection: Identifiable, Sendable, Equatable {
  public let targetId: String
  public let title: String
  public let subtitle: String
  public var id: String { targetId }

  public init(targetId: String, title: String, subtitle: String) {
    self.targetId = targetId
    self.title = title
    self.subtitle = subtitle
  }
}

public enum Presenter {
  /// 米数：整数不显示小数点
  public static func meters(_ value: Double) -> String {
    value == value.rounded() ? String(Int(value)) : String(format: "%.1f", value)
  }

  /// 路线概要："步行约 325 米 · 4 次换层"
  public static func summary(_ view: RouteView, en: Bool) -> String {
    var parts = ["\(I18n.t("walking", en: en)) \(meters(view.walkingMeters)) \(I18n.t("meters", en: en))"]
    let transfers = view.route.transitions.count
    if transfers > 0 {
      parts.append("\(transfers) \(I18n.t("transfers", en: en))")
    }
    return parts.joined(separator: " · ")
  }

  /// 步骤标题
  public static func stepTitle(_ step: RouteStep, en: Bool) -> String {
    switch step.kind {
    case .security:
      return I18n.t("pass_security", en: en)
    case .transfer:
      let facility = I18n.facilityLabel(step.facility, en: en)
      let floor = I18n.floorLabel(step.toFloor, en: en)
      return "\(I18n.t("take", en: en))\(facility) \(I18n.t("to_floor", en: en)) \(floor)"
    case .destination:
      guard let node = AirportGraph.shared.node(step.toId) else {
        return I18n.t("destination_step", en: en)
      }
      return "\(I18n.t("arrived_here", en: en)) · \(I18n.nodeName(node, en: en))"
    case .walk:
      let name = AirportGraph.shared.node(step.toId).map { I18n.nodeName($0, en: en) } ?? ""
      return "\(I18n.t("walk_to", en: en)) \(name)"
    }
  }

  /// 步骤主操作按钮文案
  public static func stepAction(_ step: RouteStep, isLast: Bool, en: Bool) -> String {
    switch step.kind {
    case .security: return I18n.t("passed_security", en: en)
    case .transfer: return I18n.t("arrived_floor", en: en)
    case .destination: return I18n.t("finish", en: en)
    case .walk: return isLast ? I18n.t("finish", en: en) : I18n.t("arrived_here", en: en)
    }
  }

  /// 四档偏好的显示名
  public static func preferenceLabel(_ index: Int, en: Bool) -> String {
    I18n.t(preferenceKey(index), en: en)
  }

  /// 异常状态标题（missing / invalid / same / unreachable）
  public static func statusTitle(_ status: RouteStatus, en: Bool) -> String {
    I18n.t(status.rawValue, en: en)
  }

  /// 目的地分类 chips（键 + 显示名）
  public static func categoryChips(en: Bool) -> [Chip] {
    Categories.all.map { Chip(key: $0.key, label: "\($0.symbol) \(en ? $0.nameEn : $0.nameZh)") }
  }

  /// 目的地/起点列表行：名称 + 副标题（类型 · 楼层 · 编号）
  public static func rowTitle(_ node: MapNode, en: Bool) -> String {
    I18n.nodeName(node, en: en)
  }

  public static func rowSubtitle(_ node: MapNode, en: Bool) -> String {
    var parts = [I18n.typeLabel(node.type, en: en), I18n.floorLabel(node.floor, en: en)]
    let code = Places.gateCode(node)
    if !code.isEmpty { parts.append(code.uppercased()) }
    return parts.joined(separator: " · ")
  }

  /// 首页"常用目的地"卡片（名称 + 楼层）
  public static func popularCards(en: Bool, limit: Int = 6) -> [PlaceCard] {
    let graph = AirportGraph.shared
    return Categories.hotDestinations.prefix(limit).compactMap { id in
      guard let node = graph.node(id) else { return nil }
      return PlaceCard(id: id, title: I18n.nodeName(node, en: en), subtitle: I18n.floorLabel(node.floor, en: en))
    }
  }

  /// 常见出发位置卡片
  public static func quickStartCards(en: Bool) -> [PlaceCard] {
    let graph = AirportGraph.shared
    return QUICK_STARTS.compactMap { id in
      guard let node = graph.node(id) else { return nil }
      return PlaceCard(id: id, title: I18n.nodeName(node, en: en), subtitle: I18n.floorLabel(node.floor, en: en))
    }
  }

  /// 地铁两个方向的入口（标题 / 副标题 / 目标站点）
  public static func metroDirections(en: Bool) -> [MetroDirection] {
    [
      MetroDirection(targetId: "xha_b2_platA", title: I18n.t("city", en: en), subtitle: I18n.t("city_sub", en: en)),
      MetroDirection(targetId: "xha_b2_platB", title: I18n.t("resort", en: en), subtitle: I18n.t("resort_sub", en: en)),
    ]
  }

  /// 到站台的三个环节
  public static func metroSteps(en: Bool) -> [String] {
    ["metro_gate", "metro_down", "metro_wait"].map { I18n.t($0, en: en) }
  }

  /// 「查看全程步骤」列表
  public static func allSteps(_ view: RouteView, en: Bool) -> [String] {
    view.steps.enumerated().map { index, step in
      "\(index + 1). \(stepTitle(step, en: en))"
    }
  }

  /// 搜索/分类筛选后的列表（走核心的检索，保证与 ArkTS / Web 同规则）
  public static func places(query: String, category: String, limit: Int = 60) -> [MapNode] {
    let graph = AirportGraph.shared
    let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)
    if trimmed.isEmpty && category == "all" {
      return Array(Places.listed(graph).prefix(limit))
    }
    return Array(Places.search(graph, query: query, category: category).prefix(limit))
  }
}
