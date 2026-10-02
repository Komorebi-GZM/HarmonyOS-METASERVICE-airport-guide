// 跨语言基准：把 TypeScript 共享核心算出的 824 条路线 + 4 条边界样本逐条比对。
//
// 这是"Swift 移植没走偏"的硬证据：不仅总米数一致，**节点序列、步骤序列、换层序列都逐项相等**，
// 因此并列最短路时的取舍也必须与 TS 端一致。
//
// 基准由 `node tools/gen_route_fixture.mjs` 生成（同一份文件也被 TS 端使用）。

import XCTest
@testable import AirportCore

private struct Fixture: Decodable {
  let schema: Int
  let generator: String
  let sourceMapSha256: String
  let routeCount: Int
  let routes: [RouteCase]
  let edgeCases: [RouteCase]
}

private struct RouteCase: Decodable {
  let start: String
  let end: String
  let pref: Int
  let status: String
  let nodeIds: [String]
  let totalMeters: Double
  let viaSecurity: Bool
  let legs: [Leg]
  let transitions: [Transition]
  let steps: [Step]
  let walkingMeters: Double

  struct Leg: Decodable {
    let floor: String
    let count: Int
    let meters: Double
  }

  struct Transition: Decodable {
    let fromId: String
    let toId: String
    let viaType: String
    let fromFloor: String
    let toFloor: String
    let meters: Double
  }

  struct Step: Decodable {
    let kind: String
    let fromId: String
    let toId: String
    let floor: String
    let toFloor: String
    let meters: Double
    let facility: String
  }
}

final class FixtureParityTests: XCTestCase {
  let graph = AirportGraph.shared

  private func loadFixture() throws -> Fixture {
    guard let url = Bundle.module.url(forResource: "routes", withExtension: "json") else {
      throw AirportError.missingResource("routes.json")
    }
    let data = try Data(contentsOf: url)
    return try JSONDecoder().decode(Fixture.self, from: data)
  }

  func testFixtureMatchesCurrentData() throws {
    let fixture = try loadFixture()
    XCTAssertEqual(fixture.schema, 1)
    XCTAssertEqual(fixture.sourceMapSha256, graph.bundle.sourceMapSha256,
                   "基准是用另一份地图数据生成的，请重跑 tools/gen_route_fixture.mjs")
    XCTAssertEqual(fixture.routeCount, fixture.routes.count)
    XCTAssertEqual(fixture.routes.count, 824)
    XCTAssertGreaterThan(fixture.routes.filter(\.viaSecurity).count, 300)
  }

  func testRouteByRouteParity() throws {
    let fixture = try loadFixture()
    var mismatches: [String] = []
    var comparedRoutes = 0

    for item in fixture.routes + fixture.edgeCases {
      let label = "\(item.start.isEmpty ? "<empty>" : item.start) -> \(item.end.isEmpty ? "<empty>" : item.end) pref=\(item.pref)"
      let view = buildRouteView(graph, startId: item.start, endId: item.end, pref: item.pref)

      if view.status.rawValue != item.status {
        mismatches.append("\(label): status \(view.status.rawValue) != \(item.status)")
        continue
      }
      if item.status != "ready" {
        // 非 ready 状态下不应产出路线
        if !view.route.nodeIds.isEmpty || view.walkingMeters != 0 {
          mismatches.append("\(label): 非 ready 却产出了路线")
        }
        continue
      }

      comparedRoutes += 1
      let route = view.route

      if route.nodeIds != item.nodeIds {
        mismatches.append("\(label): 节点序列不一致（Swift \(route.nodeIds.count) 个 / TS \(item.nodeIds.count) 个）")
        continue
      }
      if route.totalMeters != item.totalMeters {
        mismatches.append("\(label): totalMeters \(route.totalMeters) != \(item.totalMeters)")
        continue
      }
      if route.viaSecurity != item.viaSecurity {
        mismatches.append("\(label): viaSecurity \(route.viaSecurity) != \(item.viaSecurity)")
        continue
      }
      if route.legs.map(\.floor) != item.legs.map(\.floor)
        || route.legs.map(\.nodeIds.count) != item.legs.map(\.count)
        || route.legs.map(\.meters) != item.legs.map(\.meters) {
        mismatches.append("\(label): legs 不一致")
        continue
      }
      if route.transitions.count != item.transitions.count {
        mismatches.append("\(label): transitions 数量不一致")
        continue
      }
      for (a, b) in zip(route.transitions, item.transitions) {
        if a.fromId != b.fromId || a.toId != b.toId || a.viaType != b.viaType
          || a.fromFloor != b.fromFloor || a.toFloor != b.toFloor || a.meters != b.meters {
          mismatches.append("\(label): transition \(a.fromId)->\(a.toId) 不一致")
          break
        }
      }
      if view.walkingMeters != item.walkingMeters {
        mismatches.append("\(label): walkingMeters \(view.walkingMeters) != \(item.walkingMeters)")
        continue
      }
      if view.steps.count != item.steps.count {
        mismatches.append("\(label): 步骤数量 \(view.steps.count) != \(item.steps.count)")
        continue
      }
      for (a, b) in zip(view.steps, item.steps) {
        if a.kind.rawValue != b.kind || a.fromId != b.fromId || a.toId != b.toId
          || a.floor != b.floor || a.toFloor != b.toFloor
          || a.meters != b.meters || a.facility != b.facility {
          mismatches.append("\(label): 步骤 \(a.kind.rawValue) \(a.fromId)->\(a.toId) 不一致")
          break
        }
      }
    }

    if !mismatches.isEmpty {
      XCTFail("与 TS 基准不一致 \(mismatches.count) 处：\n" + mismatches.prefix(12).joined(separator: "\n"))
    }
    XCTAssertEqual(comparedRoutes, fixture.routes.count, "实际比对条数与基准不符")
  }
}
