// 渲染命令流的跨语言比对：Swift 的 MapRenderer 必须与 TypeScript 的 render.ts 产出**逐条相同**的命令。
//
// 基准由 `node tools/gen_render_fixture.mjs` 生成（10 个场景 / 664 条命令，含地图缩放阈值与中英标签）。
// 这条断言把"三端画同一张图"从口头承诺变成事实：图层顺序、用色、几何、标签底片宽度、水印位置全都锁死。

import XCTest
@testable import AirportCore
@testable import AirportUI

private struct RenderFixture: Decodable {
  let schema: Int
  let generator: String
  let sourceMapSha256: String
  let caseCount: Int
  let cases: [RenderCase]
}

private struct RenderCase: Decodable {
  let name: String
  let input: RenderInputFixture
  let commandCount: Int
  let commands: [Cmd]
}

private struct RenderInputFixture: Decodable {
  let floor: String
  let width: Double
  let height: Double
  let zoom: Double
  let tx: Double
  let ty: Double
  let routeNodeIds: [String]
  let currentRouteIndex: Int
  let startId: String
  let endId: String
  let en: Bool
}

private struct Cmd: Decodable {
  let kind: String
  let x: Double?
  let y: Double?
  let width: Double?
  let height: Double?
  let color: String?
  let points: [Pt]?
  let radius: Double?
  let fill: String?
  let stroke: String?
  let strokeWidth: Double?
  let string: String?
  let size: Double?
  let align: String?
  let baseline: String?
}

private struct Pt: Decodable {
  let x: Double
  let y: Double
}

final class RendererParityTests: XCTestCase {
  private let graph = AirportGraph.shared
  private let tolerance = 1e-9

  private func loadFixture() throws -> RenderFixture {
    guard let url = Bundle.module.url(forResource: "render", withExtension: "json") else {
      throw AirportError.missingResource("render.json")
    }
    return try JSONDecoder().decode(RenderFixture.self, from: Data(contentsOf: url))
  }

  private func near(_ a: Double?, _ b: Double?) -> Bool {
    guard let a, let b else { return a == nil && b == nil }
    return abs(a - b) <= tolerance
  }

  func testFixtureMatchesCurrentData() throws {
    let fixture = try loadFixture()
    XCTAssertEqual(fixture.schema, 1)
    XCTAssertEqual(fixture.cases.count, fixture.caseCount)
    XCTAssertEqual(fixture.cases.count, 10)
    XCTAssertEqual(fixture.sourceMapSha256, graph.bundle.sourceMapSha256,
                   "渲染基准是用另一份地图数据生成的，请重跑 tools/gen_render_fixture.mjs")
    let total = fixture.cases.reduce(0) { $0 + $1.commands.count }
    XCTAssertEqual(total, 664, "命令总数与基准不符")
  }

  func testCommandByCommandParity() throws {
    let fixture = try loadFixture()
    var issues: [String] = []

    for testCase in fixture.cases {
      let input = testCase.input
      let viewport = Viewport(zoom: input.zoom, tx: input.tx, ty: input.ty)
      let actual = MapRenderer.render(graph, MapRenderInput(
        floor: input.floor,
        viewport: viewport,
        width: input.width,
        height: input.height,
        routeNodeIds: input.routeNodeIds,
        currentRouteIndex: input.currentRouteIndex,
        startId: input.startId,
        endId: input.endId,
        languageEn: input.en
      ))

      guard actual.count == testCase.commands.count else {
        issues.append("\(testCase.name): 命令数 \(actual.count) != \(testCase.commands.count)")
        continue
      }

      for (index, pair) in zip(actual, testCase.commands).enumerated() {
        let (got, want) = pair
        let label = "\(testCase.name) #\(index)"

        switch got {
        case let .fillRect(x, y, width, height, color):
          guard want.kind == "fillRect", near(x, want.x), near(y, want.y),
                near(width, want.width), near(height, want.height), color == want.color else {
            issues.append("\(label): fillRect 不一致")
            continue
          }
        case let .labelPlate(x, y, width, height, color):
          guard want.kind == "labelPlate", near(x, want.x), near(y, want.y),
                near(width, want.width), near(height, want.height), color == want.color else {
            issues.append("\(label): labelPlate 不一致（宽度 \(width) vs \(want.width ?? -1)）")
            continue
          }
        case let .polyline(points, color, width):
          guard want.kind == "polyline", color == want.color, near(width, want.width),
                let expectedPoints = want.points, expectedPoints.count == points.count else {
            issues.append("\(label): polyline 头部不一致")
            continue
          }
          var mismatch = false
          for (i, point) in points.enumerated() where !near(point.x, expectedPoints[i].x) || !near(point.y, expectedPoints[i].y) {
            mismatch = true
            break
          }
          if mismatch {
            issues.append("\(label): polyline 顶点不一致")
            continue
          }
        case let .circle(x, y, radius, fill, stroke, strokeWidth):
          guard want.kind == "circle", near(x, want.x), near(y, want.y), near(radius, want.radius),
                fill == want.fill, stroke == want.stroke, near(strokeWidth, want.strokeWidth) else {
            issues.append("\(label): circle 不一致")
            continue
          }
        case let .text(x, y, string, size, color, align, baseline, _):
          guard want.kind == "text", near(x, want.x), near(y, want.y), string == want.string,
                near(size, want.size), color == want.color,
                align.rawValue == want.align, baseline.rawValue == want.baseline else {
            issues.append("\(label): text 不一致（\(string) @\(x),\(y) vs \(want.string ?? "-") @\(want.x ?? -1),\(want.y ?? -1)）")
            continue
          }
        }
      }
    }

    if !issues.isEmpty {
      XCTFail("与 TS 渲染基准不一致 \(issues.count) 处：\n" + issues.prefix(15).joined(separator: "\n"))
    }
  }

  func testLayerOrderInvariants() throws {
    let fixture = try loadFixture()
    for testCase in fixture.cases {
      let input = testCase.input
      let viewport = Viewport(zoom: input.zoom, tx: input.tx, ty: input.ty)
      let commands = MapRenderer.render(graph, MapRenderInput(
        floor: input.floor, viewport: viewport, width: input.width, height: input.height,
        routeNodeIds: input.routeNodeIds, currentRouteIndex: input.currentRouteIndex,
        startId: input.startId, endId: input.endId, languageEn: input.en
      ))
      // 首条必是底色，次条必是楼层底板，末条必是楼层水印
      guard case .fillRect(_, _, let w, let h, _) = commands[0] else {
        return XCTFail("\(testCase.name): 首条应为 fillRect")
      }
      XCTAssertEqual(w, input.width)
      XCTAssertEqual(h, input.height)
      guard case .fillRect = commands[1] else { return XCTFail("\(testCase.name): 次条应为楼层底板") }
      guard case let .text(_, _, floorText, _, _, align, baseline, _) = commands[commands.count - 1],
            align == .right, baseline == .top else {
        return XCTFail("\(testCase.name): 末条应为右对齐楼层水印")
      }
      XCTAssertEqual(floorText, input.floor)
    }
  }
}
