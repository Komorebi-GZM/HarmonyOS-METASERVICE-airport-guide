// 界面状态机：六页流程与本地偏好，与 Web 端 apps/web/src/main.ts 的行为一一对应。
//
// 只依赖 Foundation + AirportCore：SwiftUI 层把 AppState 放进 @State / @Observable，
// 逻辑本身可以在 swift test 里跑完整流程。

import Foundation
import AirportCore

public enum AppView: String, Sendable, CaseIterable {
  case home
  case target
  case start
  case route
  case metro
  case browse
}

public enum PickMode: String, Sendable {
  case none
  case start
  case end
}

public enum AppLanguage: String, Sendable {
  case zh
  case en
  public var isEn: Bool { self == .en }
  public var toggled: AppLanguage { self == .zh ? .en : .zh }
}

public struct AppState: Sendable, Equatable {
  public var view: AppView = .home
  public var language: AppLanguage = .zh
  public var planner = PlannerState()
  public var recent: [String] = []
  public var pick: PickMode = .none
  public var selectedId = ""
  public var category = "all"
  public var query = ""
  public var browseFloor = "4F"
  public var toast = ""

  public init() {}

  public var isEn: Bool { language.isEn }
}

/// 偏好存储：Apple 端用 UserDefaults；测试用内存实现，互不干扰
public protocol PreferencesStore: AnyObject {
  func load() -> (lang: String, recent: [String])
  func save(lang: String, recent: [String])
}

public final class UserDefaultsStore: PreferencesStore {
  private let defaults: UserDefaults
  private let key = "airport-guide"

  public init(defaults: UserDefaults = .standard) {
    self.defaults = defaults
  }

  public func load() -> (lang: String, recent: [String]) {
    guard let raw = defaults.string(forKey: key),
          let data = raw.data(using: .utf8),
          let decoded = try? JSONDecoder().decode([String: StoredChoices].self, from: data),
          let stored = decoded["value"] else {
      return ("zh", [])
    }
    return (stored.lang, Array(stored.recent.prefix(6)))
  }

  public func save(lang: String, recent: [String]) {
    let stored = StoredChoices(lang: lang, recent: Array(recent.prefix(6)))
    guard let data = try? JSONEncoder().encode(["value": stored]),
          let raw = String(data: data, encoding: .utf8) else { return }
    defaults.set(raw, forKey: key)
  }

  private struct StoredChoices: Codable {
    let lang: String
    let recent: [String]
  }
}

public final class MemoryStore: PreferencesStore {
  public private(set) var lang: String
  public private(set) var recent: [String]
  public init(lang: String = "zh", recent: [String] = []) {
    self.lang = lang
    self.recent = recent
  }
  public func load() -> (lang: String, recent: [String]) { (lang, recent) }
  public func save(lang: String, recent: [String]) {
    self.lang = lang
    self.recent = Array(recent.prefix(6))
  }
}

/// 应用模型：纯逻辑的状态容器（UI 无关）
public final class AppModel {
  public private(set) var state: AppState
  private let store: PreferencesStore
  private let graph: AirportGraph

  public init(store: PreferencesStore = UserDefaultsStore(), graph: AirportGraph = .shared) {
    self.store = store
    self.graph = graph
    var initial = AppState()
    let saved = store.load()
    initial.language = saved.lang == "en" ? .en : .zh
    // 与 ArkTS LocalStore 一致：只保留仍然存在的地点
    initial.recent = saved.recent.filter { graph.node($0) != nil }
    self.state = initial
  }

  // ------------------------------------------------------------ 查询

  public var routeView: RouteView {
    buildRouteView(graph, startId: state.planner.startId, endId: state.planner.endId, pref: state.planner.preference)
  }

  public var currentStep: RouteStep? {
    let view = routeView
    guard view.status == .ready, !view.steps.isEmpty else { return nil }
    return view.steps[min(state.planner.stepIndex, view.steps.count - 1)]
  }

  public func node(_ id: String) -> MapNode? { graph.node(id) }

  /// 当前应显示的楼层：路线态跟随当前步骤，漫游态跟随 browseFloor
  public var activeFloor: String {
    if state.view == .route, let step = currentStep {
      return step.floor.isEmpty ? state.browseFloor : step.floor
    }
    if state.view == .route {
      return graph.node(state.planner.startId)?.floor ?? state.browseFloor
    }
    return state.browseFloor
  }

  public var routeNodeIds: [String] {
    let view = routeView
    return view.status == .ready ? view.route.nodeIds : []
  }

  /// 当前路段在整条路线里的结束下标（用于高亮）
  public var currentRouteIndex: Int {
    let view = routeView
    guard view.status == .ready else { return -1 }
    if state.planner.stage == .guiding, let step = currentStep {
      if let idx = view.route.nodeIds.firstIndex(of: step.toId) { return idx }
    }
    return view.route.nodeIds.count - 1
  }

  // ------------------------------------------------------------ 转移

  public func go(_ view: AppView) {
    state.view = view
    state.toast = ""
  }

  public func toggleLanguage() {
    state.language = state.language.toggled
    persist()
  }

  public func setToast(_ message: String) { state.toast = message }
  public func clearToast() { state.toast = "" }

  /// 首页三张主卡片
  public func startTargetFlow(category: String) {
    state.category = category
    state.query = ""
    go(.target)
  }

  public func startMetroFlow() {
    go(.metro)
  }

  public func openBrowseForDestination() {
    state.pick = .end
    state.selectedId = ""
    go(.browse)
  }

  public func openBrowse() {
    state.pick = .none
    state.selectedId = ""
    go(.browse)
  }

  /// 首页/最近列表里直接选目的地
  public func chooseDestinationFromHome(_ id: String) {
    state.planner = newJourney(state.planner, endId: id, category: graph.node(id)?.type == "gate" ? "gate" : "all")
    go(.start)
  }

  /// 目的地页选中某个地点
  public func chooseTarget(_ id: String) {
    let next = choosePlace(state.planner, id: id, start: false)
    if state.planner.editing == .end {
      commitRecent(id)
      state.planner = commitJourney(next)
      go(.route)
    } else {
      state.planner = next
      state.query = ""
      state.category = "all"
      go(.start)
    }
  }

  /// 出发位置页选中某个地点
  public func chooseStart(_ id: String) {
    commitRecent(state.planner.draftEnd)
    state.planner = commitJourney(choosePlace(state.planner, id: id, start: true))
    go(.route)
  }

  public func setCategory(_ key: String) {
    state.category = key
  }

  public func setQuery(_ text: String) {
    state.query = text
  }

  public func selectNode(_ id: String) {
    state.selectedId = id
  }

  public func setBrowseFloor(_ floor: String) {
    state.browseFloor = floor
    state.selectedId = ""
  }

  /// 地铁方向 → 记下目标站台，进入选起点
  public func chooseMetroDirection(targetId: String) {
    let next = newJourney(state.planner, endId: targetId, category: "metro")
    state.planner = choosePlace(next, id: targetId, start: false)
    go(.start)
  }

  /// 地图页"我在这里"
  public func setStartFromMap(_ id: String) {
    state.pick = .start
    setToast(I18n.t("start_set", en: state.isEn))
  }

  /// 地图页"去这里"
  public func routeToFromMap(_ id: String) {
    commitRecent(id)
    state.planner = commitJourney(choosePlace(state.planner, id: id, start: false))
    go(.route)
  }

  // ------------------------------------------------------------ 路线页

  public func setPreference(_ index: Int) {
    state.planner = changePreference(state.planner, index)
  }

  public func beginGuidance() {
    state.planner = startGuidance(state.planner)
  }

  public func advance() {
    let view = routeView
    state.planner = advanceGuidance(state.planner, count: view.steps.count)
  }

  public func previous() {
    state.planner = previousStep(state.planner)
  }

  public func jumpToStep(_ index: Int) {
    guard state.planner.stage == .guiding else { return }
    let view = routeView
    var next = state.planner
    while next.stepIndex < index { next = advanceGuidance(next, count: view.steps.count) }
    while next.stepIndex > index { next = previousStep(next) }
    state.planner = next
  }

  /// 修改出发位置 → 进入「出发位置」页（与 ArkTS 的 edit_from → SelectStart 一致）
  public func editStart() {
    state.planner = beginEdit(state.planner, field: .start)
    go(.start)
  }

  /// 修改目的地 → 进入「目的地」页；选完即提交（chooseTarget 判断 editing == .end）
  public func editDestination() {
    state.planner = beginEdit(state.planner, field: .end)
    go(.target)
  }

  /// 从「出发位置」页返回：编辑态回路线页并放弃草稿，否则回首页
  public func backFromStart() {
    if state.planner.editing == .start {
      state.planner = cancelEdit(state.planner)
      go(.route)
    } else {
      go(.home)
    }
  }

  /// 从「目的地」页返回
  public func backFromTarget() {
    if state.planner.editing == .end {
      state.planner = cancelEdit(state.planner)
      go(.route)
    } else {
      go(.home)
    }
  }

  public func swap() {
    state.planner = swapJourney(state.planner)
  }

  public func restart() {
    state.planner = newJourney(state.planner)
    go(.home)
  }

  public func backHome() {
    go(.home)
  }

  /// 从浏览页返回时：如果是"选目的地"进来的，回到目的地页
  public func backFromBrowse() {
    let back: AppView = state.pick == .end ? .target : .home
    state.pick = .none
    go(back)
  }

  // ------------------------------------------------------------ 偏好持久化

  private func commitRecent(_ id: String) {
    guard !id.isEmpty else { return }
    state.recent = Places.recent(graph, ids: state.recent, id: id)
    persist()
  }

  private func persist() {
    store.save(lang: state.language.rawValue, recent: state.recent)
  }
}
