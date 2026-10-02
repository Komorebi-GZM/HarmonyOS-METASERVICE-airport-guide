// 寻路引擎：ArkTS core/Pathfinder.ets 与 TS packages/core/src/pathfinder.ts 的 Swift 移植。
//
// 刻意保留"朴素 O(V²) + 按插入顺序线性扫描"的实现：119 节点下性能无差异，
// 但能保证与另外两端在同一组并列最短路中选出**同一条**路径（已由 tests/fixtures 逐节点校验）。

import Foundation

public let PREF_SHORTEST = 0
public let PREF_ELEVATOR = 1
public let PREF_ESCALATOR = 2
public let PREF_AVOID_STAIR = 3
public let PREFERENCE_COUNT = 4

/// 垂直边基准权重（米）。`apm` 是上游文档保留但 ArkTS 权重表漏掉的类型，这里补齐 350。
public let VERTICAL_WEIGHT: [String: Double] = [
  "elevator": 30,
  "escalator": 40,
  "stair": 25,
  "apm": 350,
]

/// 偏好乘子：越大越不偏好（walk 不参与）
public let PREF_MULT: [[String: Double]] = [
  ["elevator": 1, "escalator": 1, "stair": 1, "apm": 1],
  ["elevator": 0.7, "escalator": 1.6, "stair": 3.2, "apm": 1],
  ["elevator": 1.3, "escalator": 0.8, "stair": 2.2, "apm": 1],
  ["elevator": 1.0, "escalator": 1.4, "stair": 6, "apm": 1],
]

public struct RouteLeg: Sendable, Equatable {
  public var floor: String
  public var nodeIds: [String]
  public var meters: Double
}

public struct RouteTransition: Sendable, Equatable {
  public var fromId: String
  public var toId: String
  public var viaType: String
  public var viaName: String
  public var fromFloor: String
  public var toFloor: String
  public var meters: Double
}

public struct Route: Sendable, Equatable {
  public var nodeIds: [String]
  public var totalMeters: Double
  public var legs: [RouteLeg]
  public var transitions: [RouteTransition]
  public var viaSecurity: Bool

  public static let empty = Route(nodeIds: [], totalMeters: 0, legs: [], transitions: [], viaSecurity: false)
}

public func preferenceKey(_ pref: Int) -> String {
  switch pref {
  case PREF_ELEVATOR: return "pref_elevator"
  case PREF_ESCALATOR: return "pref_escalator"
  case PREF_AVOID_STAIR: return "pref_avoid_stair"
  default: return "pref_shortest"
  }
}

/// 一条边的生效权重：walk 用原始米权，垂直边用基准 × 偏好乘子（四舍五入）
public func effectiveWeight(_ graph: AirportGraph, _ u: String, _ v: String, _ raw: Double, _ pref: Int) -> Double {
  let type = graph.edgeType(u, v)
  if type == "walk" { return raw }
  let base = VERTICAL_WEIGHT[type] ?? 25
  let mult = PREF_MULT[pref][type] ?? 1
  return (base * mult).rounded()
}

/// Dijkstra，返回源到目标的节点序列（不可达返回空数组）
public func dijkstra(_ graph: AirportGraph, pref: Int, src: String, dst: String) -> [String] {
  var dist: [String: Double] = [src: 0]
  var prev: [String: String] = [:]
  var visited = Set<String>()
  var order: [String] = [src]

  while true {
    var current: String?
    var best = Double.infinity
    for key in order {
      if visited.contains(key) { continue }
      if let d = dist[key], d < best {
        best = d
        current = key
      }
    }
    guard let u = current else { break }
    if u == dst { break }
    visited.insert(u)
    let weight = dist[u] ?? 0

    for neighbor in graph.neighbors(u) {
      let v = neighbor.id
      if visited.contains(v) { continue }
      let candidate = weight + effectiveWeight(graph, u, v, neighbor.weight, pref)
      if let old = dist[v] {
        if candidate < old {
          dist[v] = candidate
          prev[v] = u
        }
      } else {
        dist[v] = candidate
        prev[v] = u
        order.append(v)
      }
    }
  }

  var path: [String] = []
  var cursor = dst
  while cursor != src {
    path.append(cursor)
    guard let p = prev[cursor] else { return [] }
    cursor = p
  }
  path.append(src)
  return path.reversed()
}

/// 规划路线：异侧（陆↔空）拆「起→安检 + 安检→终」；同侧或起终点在安检则单段 Dijkstra
public func planRoute(_ graph: AirportGraph, startId: String, endId: String, pref: Int) throws -> Route {
  let security = graph.securityId
  var seq: [String] = []
  var viaSecurity = false

  if startId == security || endId == security {
    seq = dijkstra(graph, pref: pref, src: startId, dst: endId)
  } else {
    let s = try graph.requireNode(startId)
    let e = try graph.requireNode(endId)
    if s.side == e.side {
      seq = dijkstra(graph, pref: pref, src: startId, dst: endId)
    } else {
      viaSecurity = true
      let first = dijkstra(graph, pref: pref, src: startId, dst: security)
      let second = dijkstra(graph, pref: pref, src: security, dst: endId)
      if first.isEmpty || second.isEmpty { return .empty }
      seq = first + second.dropFirst()
    }
  }
  if seq.isEmpty { return .empty }

  // 分段成 legs（同层连续段）+ transitions（跨层）；米数一律用原始权重，偏好只影响选路
  var legs: [RouteLeg] = []
  var transitions: [RouteTransition] = []
  var total = 0.0
  var currentFloor = try graph.requireNode(seq[0]).floor
  var ids: [String] = [seq[0]]
  var legMeters = 0.0

  for i in 1..<seq.count {
    let u = seq[i - 1]
    let v = seq[i]
    let raw = graph.rawWeight(u, v) ?? 0
    total += raw
    let floorOfV = try graph.requireNode(v).floor
    if floorOfV != currentFloor {
      legs.append(RouteLeg(floor: currentFloor, nodeIds: ids, meters: legMeters))
      transitions.append(RouteTransition(
        fromId: u, toId: v, viaType: graph.edgeType(u, v),
        viaName: try graph.requireNode(u).name,
        fromFloor: currentFloor, toFloor: floorOfV, meters: raw
      ))
      currentFloor = floorOfV
      ids = [v]
      legMeters = 0
    } else {
      legMeters += raw
      ids.append(v)
    }
  }
  if !ids.isEmpty {
    legs.append(RouteLeg(floor: currentFloor, nodeIds: ids, meters: legMeters))
  }

  let merged = mergeTransitLegs(legs, transitions)
  return Route(
    nodeIds: seq, totalMeters: total,
    legs: merged.legs, transitions: merged.transitions, viaSecurity: viaSecurity
  )
}

/// 把单节点的过站腿（非起点/终点）与两侧换乘合并成一条直达换乘
func mergeTransitLegs(_ legs: [RouteLeg], _ trans: [RouteTransition]) -> (legs: [RouteLeg], transitions: [RouteTransition]) {
  var outLegs: [RouteLeg] = []
  var outTrans: [RouteTransition] = []
  var i = 0
  while i < legs.count {
    outLegs.append(legs[i])
    if i == legs.count - 1 { break }
    var t = trans[i]
    var j = i + 1
    while j < legs.count - 1 && legs[j].nodeIds.count == 1 {
      let t2 = trans[j]
      t = RouteTransition(
        fromId: t.fromId, toId: t2.toId, viaType: t.viaType, viaName: t.viaName,
        fromFloor: t.fromFloor, toFloor: t2.toFloor, meters: t.meters + t2.meters
      )
      j += 1
    }
    outTrans.append(t)
    i = j
  }
  return (outLegs, outTrans)
}

/// 常用快捷起点（模拟当前位置）
public let QUICK_STARTS: [String] = [
  "xha_p4_doorW", "xha_p4_doorN", "xha_p4_doorE",
  "xha_p2_exitN", "xha_b2_platA", "xha_b2_platB",
  "xha_p1_taxi", "xha_b1_gtc",
]
