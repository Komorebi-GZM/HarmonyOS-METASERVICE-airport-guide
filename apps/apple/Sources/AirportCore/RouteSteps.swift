// 路线步骤：ArkTS core/RouteSteps.ets 的 Swift 移植。

import Foundation

public enum StepKind: String, Sendable {
  case walk
  case security
  case transfer
  case destination
}

public enum RouteStatus: String, Sendable {
  case ready
  case missing
  case invalid
  case same
  case unreachable
}

public struct RouteStep: Sendable, Equatable {
  public var kind: StepKind
  public var fromId: String
  public var toId: String
  public var floor: String
  public var toFloor: String
  public var legIndex: Int
  public var meters: Double
  public var facility: String
}

public struct RouteView: Sendable, Equatable {
  public var status: RouteStatus
  public var route: Route
  public var steps: [RouteStep]
  public var walkingMeters: Double
}

/// Route → 可逐步确认的步骤序列（含安检步骤与换层步骤）
public func buildRouteView(_ graph: AirportGraph, startId: String, endId: String, pref: Int) -> RouteView {
  var result = RouteView(status: .ready, route: .empty, steps: [], walkingMeters: 0)
  if startId.isEmpty || endId.isEmpty {
    result.status = .missing
    return result
  }
  if Places.place(graph, startId) == nil || Places.place(graph, endId) == nil {
    result.status = .invalid
    return result
  }
  if startId == endId {
    result.status = .same
    return result
  }
  guard let route = try? planRoute(graph, startId: startId, endId: endId, pref: pref) else {
    result.status = .unreachable
    return result
  }
  result.route = route
  if route.nodeIds.isEmpty {
    result.status = .unreachable
    return result
  }

  let securityId = graph.securityId
  for (legIndex, leg) in route.legs.enumerated() {
    var from = leg.nodeIds[0]
    var meters = 0.0
    for i in 1..<leg.nodeIds.count {
      meters += graph.rawWeight(ofType: "walk", leg.nodeIds[i - 1], leg.nodeIds[i]) ?? 0
      let isLastInLeg = i == leg.nodeIds.count - 1
      if leg.nodeIds[i] == securityId || isLastInLeg {
        result.steps.append(RouteStep(
          kind: .walk, fromId: from, toId: leg.nodeIds[i],
          floor: leg.floor, toFloor: leg.floor, legIndex: legIndex,
          meters: meters, facility: ""
        ))
        result.walkingMeters += meters
        from = leg.nodeIds[i]
        meters = 0
        if from == securityId && from != endId {
          result.steps.append(RouteStep(
            kind: .security, fromId: from, toId: from,
            floor: leg.floor, toFloor: leg.floor, legIndex: legIndex,
            meters: 0, facility: "security"
          ))
        }
      }
    }
    if legIndex < route.transitions.count {
      let tr = route.transitions[legIndex]
      result.steps.append(RouteStep(
        kind: .transfer, fromId: tr.fromId, toId: tr.toId,
        floor: tr.fromFloor, toFloor: tr.toFloor, legIndex: legIndex,
        meters: 0, facility: tr.viaType
      ))
    }
  }

  let endFloor = Places.place(graph, endId)?.floor ?? ""
  result.steps.append(RouteStep(
    kind: .destination, fromId: endId, toId: endId,
    floor: endFloor, toFloor: endFloor,
    legIndex: max(0, route.legs.count - 1), meters: 0, facility: ""
  ))
  return result
}

/// 步骤对应的主操作文案 key
public func stepActionKey(_ step: RouteStep, isLast: Bool) -> String {
  switch step.kind {
  case .security: return "passed_security"
  case .transfer: return "arrived_floor"
  case .destination: return "finish"
  case .walk: return isLast ? "finish" : "arrived_here"
  }
}
