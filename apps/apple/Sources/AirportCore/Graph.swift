// 数据模型与图：ArkTS（model/AirportMap.ets + core/Pathfinder.ets 的邻接表）的 Swift 移植。
//
// 与 ArkTS 端的差异（与 TypeScript 共享核心保持一致）：
//   - 陆/空侧（side）与楼层包围盒改为**加载期**现算，算法同 tools/gen_model.py；
//   - 同一对节点出现不同类型/同类型不同权重的平行边时**直接报错**，不静默覆盖；
//   - 邻接表显式保留"边在 JSON 中的插入顺序"，使 Dijkstra 在并列最短时的取舍与 TS 端一致。

import Foundation

// ---------------------------------------------------------------- 原始数据

public struct RawMapNode: Codable, Sendable, Hashable {
  public let id: String
  public let name: String
  public let type: String
  public let floor: String
  public let x: Double
  public let y: Double
}

public struct RawMapEdge: Codable, Sendable, Hashable {
  public let from: String
  public let to: String
  public let type: String
  public let weight: Double
}

public struct RawMeta: Codable, Sendable {
  public let airport: String
  public let name: String
  public let pxPerMeter: Double
  public let floors: [String: String]
}

public struct RawMap: Codable, Sendable {
  public let meta: RawMeta
  public let nodes: [RawMapNode]
  public let edges: [RawMapEdge]
}

public struct Translation: Codable, Sendable {
  public let key: String
  public let zh: String
  public let en: String
}

public struct LocalizedText: Codable, Sendable {
  public let zh: String
  public let en: String
}

public struct Tokens: Codable, Sendable {
  public let APP: [String: String]
  public let MAP: [String: String]
  public let ROUTE: [String: String]
  public let HIT: String
  public let TYPE_COLOR: [String: String]
}

/// `airport-data.json` 的整体结构（由 tools/export_shared.py 生成）
public struct AirportDataBundle: Codable, Sendable {
  public let schema: Int
  public let sourceMapSha256: String
  public let map: RawMap
  public let i18n: [Translation]
  public let typeLabels: [String: LocalizedText]
  public let floorLabels: [String: LocalizedText]
  public let nodeEn: [String: String]
  public let tokens: Tokens

  public static func load() throws -> AirportDataBundle {
    guard let url = Bundle.module.url(forResource: "airport-data", withExtension: "json") else {
      throw AirportError.missingResource("airport-data.json")
    }
    let data = try Data(contentsOf: url)
    return try JSONDecoder().decode(AirportDataBundle.self, from: data)
  }
}

public enum AirportError: Error, CustomStringConvertible {
  case missingResource(String)
  case invalidData(String)
  case unknownNode(String)
  case duplicateSecurity(Int)
  case noEntrance
  case emptyAirSide
  case parallelEdge(String)

  public var description: String {
    switch self {
    case .missingResource(let name): return "缺少资源文件：\(name)"
    case .invalidData(let why): return "数据非法：\(why)"
    case .unknownNode(let id): return "未知节点：\(id)"
    case .duplicateSecurity(let n): return "必须恰有一个安检节点，实际 \(n) 个"
    case .noEntrance: return "数据里没有 entrance 节点，无法判定陆侧"
    case .emptyAirSide: return "空侧为空，陆/空侧判定失效"
    case .parallelEdge(let why): return "平行边冲突：\(why)"
    }
  }
}

// ---------------------------------------------------------------- 图

public enum Side: String, Sendable {
  case land
  case air
  case gate
}

public struct MapNode: Sendable, Hashable {
  public let id: String
  public let name: String
  public let type: String
  public let floor: String
  public let x: Double
  public let y: Double
  public let side: Side
}

public struct MapEdge: Sendable, Hashable {
  public let from: String
  public let to: String
  public let type: String
  public let weight: Double
}

public struct BBox: Sendable, Equatable {
  public let minX: Double
  public let minY: Double
  public let maxX: Double
  public let maxY: Double
  public var array: [Double] { [minX, minY, maxX, maxY] }
}

public struct Neighbor: Sendable {
  public let id: String
  public var weight: Double
}

public final class AirportGraph {
  public let bundle: AirportDataBundle
  public let nodes: [MapNode]
  public let edges: [MapEdge]
  public let securityId: String
  public let floorOrder: [String]
  public let floorLabels: [String: String]
  public let pxPerMeter: Double
  private let initialFloorOrder: [String]

  private let index: [String: MapNode]
  private var adjacency: [String: [Neighbor]] = [:]
  private var neighborPosition: [String: [String: Int]] = [:]
  private var edgeTypes: [String: String] = [:]

  public init(bundle: AirportDataBundle) throws {
    self.bundle = bundle
    self.pxPerMeter = bundle.map.meta.pxPerMeter
    self.floorLabels = bundle.map.meta.floors
    // Swift 的 Dictionary 不保留 JSON 键顺序，因此按"节点首次出现的楼层顺序"推导，
    // 结果与 meta.floors 的声明顺序一致（数据里节点就是按 4F→3F→2F→1F→B1→B2 排列的）
    var floorsSeen: [String] = []
    for raw in bundle.map.nodes where !floorsSeen.contains(raw.floor) {
      floorsSeen.append(raw.floor)
    }
    self.initialFloorOrder = floorsSeen

    let security = bundle.map.nodes.filter { $0.type == "security" }
    self.floorOrder = floorsSeen
    guard security.count == 1 else { throw AirportError.duplicateSecurity(security.count) }
    self.securityId = security[0].id

    self.edges = bundle.map.edges.map { MapEdge(from: $0.from, to: $0.to, type: $0.type, weight: $0.weight) }

    for edge in edges {
      try Self.setNeighbor(&adjacency, &neighborPosition, edge.from, edge.to, edge.weight)
      try Self.setNeighbor(&adjacency, &neighborPosition, edge.to, edge.from, edge.weight)
      let key = Self.edgeKey(edge.from, edge.to)
      if let prev = edgeTypes[key], prev != edge.type {
        throw AirportError.parallelEdge("\(edge.from) <-> \(edge.to)（\(prev) / \(edge.type)）")
      }
      edgeTypes[key] = edge.type
    }

    let sides = try Self.computeSides(nodes: bundle.map.nodes, adjacency: adjacency, securityId: securityId)
    var built: [MapNode] = []
    var lookup: [String: MapNode] = [:]
    for raw in bundle.map.nodes {
      let node = MapNode(
        id: raw.id, name: raw.name, type: raw.type, floor: raw.floor,
        x: raw.x, y: raw.y, side: sides[raw.id] ?? .air
      )
      built.append(node)
      lookup[node.id] = node
    }
    self.nodes = built
    self.index = lookup
  }

  /// 与 ArkTS 的 Map.set 语义一致：已存在的邻居只更新权重，插入位置不变
  private static func setNeighbor(
    _ adjacency: inout [String: [Neighbor]],
    _ position: inout [String: [String: Int]],
    _ u: String,
    _ v: String,
    _ weight: Double
  ) throws {
    var list = adjacency[u] ?? []
    if let idx = position[u]?[v] {
      if list[idx].weight != weight {
        throw AirportError.parallelEdge("\(u) -> \(v) 权重冲突（\(list[idx].weight) / \(weight)）")
      }
      list[idx].weight = weight
    } else {
      position[u, default: [:]][v] = list.count
      list.append(Neighbor(id: v, weight: weight))
    }
    adjacency[u] = list
  }

  private static func edgeKey(_ a: String, _ b: String) -> String {
    a < b ? a + "|" + b : b + "|" + a
  }

  /// 与 tools/gen_model.py 相同的陆/空侧判定：从第一个 entrance BFS，跳过安检节点
  private static func computeSides(
    nodes: [RawMapNode],
    adjacency: [String: [Neighbor]],
    securityId: String
  ) throws -> [String: Side] {
    guard let anchor = nodes.first(where: { $0.type == "entrance" }) else {
      throw AirportError.noEntrance
    }
    var seen: Set<String> = [anchor.id]
    var stack: [String] = [anchor.id]
    while let u = stack.popLast() {
      for neighbor in adjacency[u] ?? [] {
        if neighbor.id == securityId || seen.contains(neighbor.id) { continue }
        seen.insert(neighbor.id)
        stack.append(neighbor.id)
      }
    }
    var sides: [String: Side] = [:]
    var airCount = 0
    for node in nodes {
      if node.id == securityId {
        sides[node.id] = .gate
      } else if seen.contains(node.id) {
        sides[node.id] = .land
      } else {
        sides[node.id] = .air
        airCount += 1
      }
    }
    guard airCount > 0 else { throw AirportError.emptyAirSide }
    return sides
  }

  // -------------------------------------------------------------- 查询

  public func node(_ id: String) -> MapNode? { index[id] }

  public func requireNode(_ id: String) throws -> MapNode {
    guard let node = index[id] else { throw AirportError.unknownNode(id) }
    return node
  }

  public func neighbors(_ id: String) -> [Neighbor] { adjacency[id] ?? [] }

  public func edgeType(_ a: String, _ b: String) -> String {
    edgeTypes[Self.edgeKey(a, b)] ?? "walk"
  }

  public func rawWeight(_ a: String, _ b: String) -> Double? {
    guard let idx = neighborPosition[a]?[b] else { return nil }
    return adjacency[a]?[idx].weight
  }

  public func rawWeight(ofType type: String, _ a: String, _ b: String) -> Double? {
    guard edgeType(a, b) == type else { return nil }
    return rawWeight(a, b)
  }

  public func floorNodes(_ floor: String) -> [MapNode] { nodes.filter { $0.floor == floor } }

  public func floorBBox(_ floor: String) -> BBox {
    let list = floorNodes(floor)
    guard !list.isEmpty else { return BBox(minX: 0, minY: 0, maxX: 1, maxY: 1) }
    let xs = list.map(\.x)
    let ys = list.map(\.y)
    return BBox(minX: xs.min()!, minY: ys.min()!, maxX: xs.max()!, maxY: ys.max()!)
  }

  public func sideCount() -> (land: Int, air: Int, gate: Int) {
    var land = 0, air = 0, gate = 0
    for node in nodes {
      switch node.side {
      case .land: land += 1
      case .air: air += 1
      case .gate: gate += 1
      }
    }
    return (land, air, gate)
  }

  public func floorCounts() -> [String: Int] {
    var out: [String: Int] = [:]
    for node in nodes { out[node.floor, default: 0] += 1 }
    return out
  }

  /// 进程内共享实例（数据随包，不会变）
  public static let shared: AirportGraph = {
    do {
      return try AirportGraph(bundle: AirportDataBundle.load())
    } catch {
      fatalError("加载机场数据失败：\(error)")
    }
  }()
}
