// 行程状态：ArkTS core/PlannerState.ets 的 Swift 移植。
//
// ArkTS 用"每次更新都替换整个对象"驱动 @Provide/@Consume；Swift 的 struct 天然是值语义，
// 因此这里保留同名纯函数、每个函数返回新值，UI 层用 @State 接收即可。

import Foundation

public enum RouteStage: String, Sendable {
  case editing
  case preview
  case guiding
  case completed
}

public enum MapMode: String, Sendable {
  case browse
  case route
}

public enum EditField: String, Sendable {
  case new
  case start
  case end
}

public struct PlannerState: Sendable, Equatable {
  public var startId = ""
  public var endId = ""
  public var draftStart = ""
  public var draftEnd = ""
  public var preference = 0
  public var stage: RouteStage = .editing
  public var stepIndex = 0
  public var category = "all"
  public var query = ""
  public var browseFloor = "4F"
  public var mapMode: MapMode = .browse
  public var editing: EditField = .new
  public var revision = 0

  public init() {}
}

public func copyPlanner(_ s: PlannerState) -> PlannerState {
  var n = s
  n.revision = s.revision + 1
  return n
}

public func newJourney(_ s: PlannerState, endId: String = "", category: String = "all") -> PlannerState {
  var n = PlannerState()
  n.draftEnd = endId
  n.category = category
  n.revision = s.revision + 1
  return n
}

public func beginEdit(_ s: PlannerState, field: EditField) -> PlannerState {
  var n = copyPlanner(s)
  n.draftStart = s.startId
  n.draftEnd = s.endId
  n.editing = field
  n.category = "all"
  n.query = ""
  return n
}

public func choosePlace(_ s: PlannerState, id: String, start: Bool) -> PlannerState {
  var n = copyPlanner(s)
  if start { n.draftStart = id } else { n.draftEnd = id }
  return n
}

public func commitJourney(_ s: PlannerState) -> PlannerState {
  var n = copyPlanner(s)
  n.startId = s.draftStart
  n.endId = s.draftEnd
  n.stage = .preview
  n.stepIndex = 0
  n.editing = .new
  return n
}

public func cancelEdit(_ s: PlannerState) -> PlannerState {
  var n = copyPlanner(s)
  n.draftStart = s.startId
  n.draftEnd = s.endId
  n.editing = .new
  return n
}

public func changePreference(_ s: PlannerState, _ value: Int) -> PlannerState {
  var n = copyPlanner(s)
  n.preference = value
  n.stage = .preview
  n.stepIndex = 0
  return n
}

public func swapJourney(_ s: PlannerState) -> PlannerState {
  var n = copyPlanner(s)
  n.startId = s.endId
  n.endId = s.startId
  n.draftStart = n.startId
  n.draftEnd = n.endId
  n.stage = .preview
  n.stepIndex = 0
  return n
}

public func startGuidance(_ s: PlannerState) -> PlannerState {
  var n = copyPlanner(s)
  n.stage = .guiding
  n.stepIndex = 0
  return n
}

public func advanceGuidance(_ s: PlannerState, count: Int) -> PlannerState {
  var n = copyPlanner(s)
  guard s.stage == .guiding, count >= 1 else { return n }
  if s.stepIndex >= count - 1 {
    n.stage = .completed
  } else {
    n.stepIndex = s.stepIndex + 1
  }
  return n
}

public func previousStep(_ s: PlannerState) -> PlannerState {
  var n = copyPlanner(s)
  n.stepIndex = max(0, s.stepIndex - 1)
  n.stage = .guiding
  return n
}
