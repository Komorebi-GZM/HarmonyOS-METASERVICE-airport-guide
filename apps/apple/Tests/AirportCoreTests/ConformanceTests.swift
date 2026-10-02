// Swift 端一致性回归：数据基线、参考样例、割点等价、状态机、检索、文案、视口。
// 断言来源与 TS 端 packages/core/test/conformance.test.ts 对应，保证两端"同一套标准"。

import XCTest
@testable import AirportCore

final class ConformanceTests: XCTestCase {
  let graph = AirportGraph.shared

  // ------------------------------------------------------------ 数据基线

  func testDataBaseline() throws {
    XCTAssertEqual(graph.nodes.count, 119)
    XCTAssertEqual(graph.edges.count, 145)
    XCTAssertEqual(graph.pxPerMeter, 2.0)
    XCTAssertEqual(graph.securityId, "xha_p4_sec")

    let sides = graph.sideCount()
    XCTAssertEqual(sides.land, 63)
    XCTAssertEqual(sides.air, 55)
    XCTAssertEqual(sides.gate, 1)

    XCTAssertEqual(graph.floorCounts(), ["4F": 55, "3F": 12, "2F": 21, "1F": 11, "B1": 14, "B2": 6])
    XCTAssertEqual(graph.floorOrder, ["4F", "3F", "2F", "1F", "B1", "B2"])

    // 与 AirportMap.ets 的 FLOOR_BBOX 逐条比对
    let expected: [String: [Double]] = [
      "4F": [130, 60, 950, 820],
      "3F": [250, 140, 830, 560],
      "2F": [250, 110, 830, 560],
      "1F": [250, 160, 830, 560],
      "B1": [150, 150, 880, 470],
      "B2": [300, 180, 700, 420],
    ]
    for (floor, box) in expected {
      XCTAssertEqual(graph.floorBBox(floor).array, box, "\(floor) 包围盒不一致")
    }

    // 边类型分布
    var counts: [String: Int] = [:]
    for edge in graph.edges { counts[edge.type, default: 0] += 1 }
    XCTAssertEqual(counts, ["walk": 124, "elevator": 13, "escalator": 4, "stair": 4])

    // 抽样文件校验
    XCTAssertEqual(graph.bundle.sourceMapSha256.count, 64)
    XCTAssertEqual(graph.bundle.i18n.count, 112)
  }

  // ------------------------------------------------------------ 参考样例

  func testGoldenSamples() throws {
    let samples: [(String, String, Double, Int, Bool)] = [
      ("xha_p4_doorW", "xha_p4_gC308", 635, 10, true),
      ("xha_p4_doorE", "xha_p3_loungeA", 505, 9, true),
      ("xha_p1_taxi", "xha_p4_gA101", 630, 10, true),
      ("xha_b2_platA", "xha_p4_airMall", 445, 10, true),
      ("xha_p2_bagA", "xha_p4_doorW", 250, 5, false),
      ("xha_b1_gtc", "xha_b2_platB", 300, 5, false),
    ]
    for (start, end, meters, nodeCount, viaSecurity) in samples {
      let route = try planRoute(graph, startId: start, endId: end, pref: PREF_SHORTEST)
      XCTAssertEqual(route.totalMeters, meters, "\(start) -> \(end) 米数")
      XCTAssertEqual(route.nodeIds.count, nodeCount, "\(start) -> \(end) 节点数")
      XCTAssertEqual(route.viaSecurity, viaSecurity, "\(start) -> \(end) 是否过安检")
      if viaSecurity {
        XCTAssertTrue(route.nodeIds.contains(graph.securityId))
      }
    }
  }

  // ------------------------------------------------------------ 割点与不变量

  func testAllPairsReachableAndCutVertexEquivalence() throws {
    let ids = graph.nodes.map(\.id)
    var checked = 0
    var crossChecked = 0
    for start in ids {
      for end in ids where end != start {
        let route = try planRoute(graph, startId: start, endId: end, pref: PREF_SHORTEST)
        XCTAssertFalse(route.nodeIds.isEmpty, "\(start) -> \(end) 不可达")
        XCTAssertEqual(route.nodeIds.first, start)
        XCTAssertEqual(route.nodeIds.last, end)
        checked += 1

        // 异侧：拆两段必须与全图 Dijkstra 逐节点等价
        let crossSide = graph.node(start)!.side != graph.node(end)!.side
        if crossSide && start != graph.securityId && end != graph.securityId {
          let full = dijkstra(graph, pref: PREF_SHORTEST, src: start, dst: end)
          XCTAssertEqual(route.nodeIds, full, "\(start) -> \(end) 割点拆分与全图 Dijkstra 不一致")
          XCTAssertTrue(route.nodeIds.contains(graph.securityId), "\(start) -> \(end) 绕过安检")
          crossChecked += 1
        } else if !crossSide {
          XCTAssertFalse(route.nodeIds.contains(graph.securityId), "\(start) -> \(end) 同侧却过安检")
        }

        // legs / transitions 结构不变量
        XCTAssertEqual(route.legs.count, route.transitions.count + 1)
        let split = route.legs.reduce(0) { $0 + $1.meters } + route.transitions.reduce(0) { $0 + $1.meters }
        XCTAssertEqual(split, route.totalMeters, "\(start) -> \(end) 分段米数之和 != totalMeters")
        for leg in route.legs {
          XCTAssertFalse(leg.nodeIds.isEmpty)
          for id in leg.nodeIds {
            XCTAssertEqual(graph.node(id)!.floor, leg.floor, "leg 内跨层：\(id)")
          }
        }
        for transition in route.transitions {
          XCTAssertNotEqual(transition.fromFloor, transition.toFloor)
          XCTAssertEqual(transition.viaName, graph.node(transition.fromId)!.name)
        }
        // 相邻节点必须是真实边
        for i in 1..<route.nodeIds.count {
          XCTAssertNotNil(graph.rawWeight(route.nodeIds[i - 1], route.nodeIds[i]), "路径不连续")
        }
      }
    }
    XCTAssertEqual(checked, 119 * 118)
    XCTAssertGreaterThan(crossChecked, 1000, "异侧样本过少，分布可疑")
  }

  func testPreferenceChangesRoutingOnly() throws {
    let start = "xha_p1_taxi"
    let end = "xha_p4_gA101"
    var stairCounts: [Int] = []
    for pref in 0..<PREFERENCE_COUNT {
      let route = try planRoute(graph, startId: start, endId: end, pref: pref)
      XCTAssertFalse(route.nodeIds.isEmpty)
      // 显示米数用原始权重：与偏好无关
      let raw = route.nodeIds.indices.dropFirst().reduce(0.0) { acc, i in
        acc + (graph.rawWeight(route.nodeIds[i - 1], route.nodeIds[i]) ?? 0)
      }
      XCTAssertEqual(raw, route.totalMeters)
      stairCounts.append(route.transitions.filter { $0.viaType == "stair" }.count)
    }
    XCTAssertLessThanOrEqual(stairCounts[PREF_ELEVATOR], stairCounts[PREF_SHORTEST], "优先电梯档反而走了更多楼梯")
  }

  func testMergeTransitLegs() throws {
    // 1F → B1 → B2：B1 只是过站，应合并成「1F 乘电梯直达 B2」
    let down = try planRoute(graph, startId: "xha_p1_taxi", endId: "xha_b2_platA", pref: PREF_SHORTEST)
    XCTAssertEqual(down.nodeIds.map { graph.node($0)!.floor }, ["1F", "1F", "1F", "B1", "B2", "B2", "B2"])
    XCTAssertEqual(down.legs.map(\.floor), ["1F", "B2"], "B1 过站腿未被合并")
    XCTAssertEqual(down.transitions.count, 1)
    XCTAssertEqual(down.transitions[0].viaType, "elevator")
    XCTAssertEqual(down.totalMeters, 480)

    // B2 → B1 → 1F → 2F → 4F：多段过站全部吸收
    let up = try planRoute(graph, startId: "xha_b2_platA", endId: "xha_p4_airMall", pref: PREF_SHORTEST)
    XCTAssertEqual(up.legs.map(\.floor), ["B2", "4F"])
    XCTAssertEqual(up.transitions.count, 1)
    XCTAssertEqual(up.totalMeters, 445)
    XCTAssertTrue(up.viaSecurity)
  }

  // ------------------------------------------------------------ 步骤

  func testRouteStepsStatuses() throws {
    XCTAssertEqual(buildRouteView(graph, startId: "", endId: "xha_p4_gA101", pref: 0).status, .missing)
    XCTAssertEqual(buildRouteView(graph, startId: "xha_p4_gA101", endId: "", pref: 0).status, .missing)
    XCTAssertEqual(buildRouteView(graph, startId: "invalid", endId: "xha_p4_gA101", pref: 0).status, .invalid)
    XCTAssertEqual(buildRouteView(graph, startId: "xha_p4_gA101", endId: "xha_p4_gA101", pref: 0).status, .same)

    let view = buildRouteView(graph, startId: "xha_p4_doorW", endId: "xha_p4_gA101", pref: 0)
    XCTAssertEqual(view.status, .ready)
    XCTAssertEqual(view.steps.last?.kind, .destination)
    XCTAssertEqual(view.steps.filter { $0.kind == .security }.count, 1)
    XCTAssertEqual(view.steps.filter { $0.kind == .transfer }.count, view.route.transitions.count)
    let walkSum = view.steps.filter { $0.kind == .walk }.reduce(0.0) { $0 + $1.meters }
    XCTAssertEqual(walkSum, view.walkingMeters)

    var rawWalk = 0.0
    for i in 1..<view.route.nodeIds.count {
      rawWalk += graph.rawWeight(ofType: "walk", view.route.nodeIds[i - 1], view.route.nodeIds[i]) ?? 0
    }
    XCTAssertEqual(view.walkingMeters, rawWalk)
  }

  // ------------------------------------------------------------ 状态机

  func testPlannerTransitions() throws {
    var original = PlannerState()
    original.startId = "xha_p4_doorW"
    original.endId = "xha_p4_gA101"
    original.stage = .guiding
    original.stepIndex = 2

    let fresh = newJourney(original, endId: "xha_p4_gB201", category: "gate")
    XCTAssertEqual(fresh.startId, "")
    XCTAssertEqual(fresh.draftEnd, "xha_p4_gB201")
    XCTAssertEqual(fresh.stage, .editing)
    XCTAssertEqual(original.startId, "xha_p4_doorW", "原状态不可被就地修改")

    var s = beginEdit(original, field: .start)
    s = choosePlace(s, id: "xha_p4_doorN", start: true)
    s = cancelEdit(s)
    XCTAssertEqual(s.startId, original.startId)
    XCTAssertEqual(s.stage, .guiding)
    XCTAssertEqual(s.stepIndex, 2)

    s = choosePlace(beginEdit(original, field: .start), id: "xha_p4_doorN", start: true)
    s.stage = .guiding
    s.stepIndex = 2
    s = commitJourney(s)
    XCTAssertEqual(s.startId, "xha_p4_doorN")
    XCTAssertEqual(s.stage, .preview)
    XCTAssertEqual(s.stepIndex, 0)

    s = startGuidance(s)
    s.stepIndex = 2
    s = changePreference(s, PREF_ELEVATOR)
    XCTAssertEqual(s.preference, PREF_ELEVATOR)
    XCTAssertEqual(s.stage, .preview)
    XCTAssertEqual(s.stepIndex, 0)

    s = startGuidance(s)
    s.stepIndex = 2
    s = swapJourney(s)
    XCTAssertEqual(s.startId, "xha_p4_gA101")
    XCTAssertEqual(s.endId, "xha_p4_doorN")

    s = startGuidance(s)
    s = advanceGuidance(s, count: 3)
    XCTAssertEqual(s.stepIndex, 1)
    s = advanceGuidance(s, count: 3)
    XCTAssertEqual(s.stepIndex, 2)
    s = advanceGuidance(s, count: 3)
    XCTAssertEqual(s.stage, .completed)
    s = previousStep(s)
    XCTAssertEqual(s.stage, .guiding)
    XCTAssertEqual(s.stepIndex, 1)
  }

  // ------------------------------------------------------------ 检索 / 文案 / 视口

  func testSearchAndRecent() throws {
    let gate = graph.nodes.first { $0.type == "gate" }!
    XCTAssertTrue(Places.search(graph, query: gate.name).contains { $0.id == gate.id })

    let code = Places.gateCode(gate)
    let hits = Places.search(graph, query: " \(code.uppercased()) ")
    XCTAssertEqual(hits.first?.id, gate.id, "编号完全相等应排最前")

    let ids = ["bad", gate.id] + graph.nodes.prefix(10).map(\.id)
    let recent = Places.recent(graph, ids: ids, id: gate.id)
    XCTAssertEqual(recent.count, 6)
    XCTAssertEqual(recent.first, gate.id)
    XCTAssertEqual(Set(recent).count, recent.count)

    XCTAssertTrue(Places.search(graph, query: "zzz不存在的名字").isEmpty)
    XCTAssertTrue(Places.search(graph, query: "", category: "gate").allSatisfy { Categories.catOf($0) == "gate" })
    XCTAssertTrue(Places.search(graph, query: "").allSatisfy { Places.isPublic($0) })
    XCTAssertTrue(Places.search(graph, query: "A101").first?.id == "xha_p4_gA101")
  }

  func testHotDestinationsExist() throws {
    for id in QUICK_STARTS { XCTAssertNotNil(graph.node(id), "快捷起点缺失：\(id)") }
    for id in Categories.hotDestinations { XCTAssertNotNil(graph.node(id), "热门目的地缺失：\(id)") }
    XCTAssertEqual(Categories.all.count, 10)
  }

  func testI18nCompleteness() throws {
    let keys = I18n.keys
    XCTAssertEqual(keys.count, 112)
    XCTAssertEqual(Set(keys).count, 112)
    for key in keys {
      XCTAssertFalse(I18n.t(key, en: false).isEmpty, "\(key) 中文为空")
      XCTAssertFalse(I18n.t(key, en: true).isEmpty, "\(key) 英文为空")
      XCTAssertNotEqual(I18n.t(key, en: false), key, "\(key) 中文缺失")
    }
    XCTAssertEqual(I18n.t("__not_a_key__", en: false), "__not_a_key__")
    XCTAssertEqual(I18n.floorOrder(), ["4F", "3F", "2F", "1F", "B1", "B2"])
    XCTAssertEqual(I18n.floorLabel("4F", en: false), "出发层")
    XCTAssertEqual(I18n.floorLabel("4F", en: true), "Departures")
    XCTAssertEqual(I18n.typeLabel("gate", en: false), "登机口")
    XCTAssertEqual(I18n.typeLabel("gate", en: true), "Gate")
    for node in graph.nodes {
      XCTAssertFalse(I18n.nodeName(node, en: false).isEmpty)
      XCTAssertFalse(I18n.nodeName(node, en: true).isEmpty)
    }
  }

  func testViewport() throws {
    let bbox = graph.floorBBox("4F")
    var viewport = Viewport()
    viewport.fitInsets(bbox, width: 360, height: 320,
                       left: Insets.route.left, top: Insets.route.top,
                       right: Insets.route.right, bottom: Insets.route.bottom)
    for node in graph.floorNodes("4F") {
      XCTAssertGreaterThanOrEqual(viewport.scrX(node.x), Insets.route.left - 1e-6)
      XCTAssertLessThanOrEqual(viewport.scrX(node.x), 360 - Insets.route.right + 1e-6)
      XCTAssertGreaterThanOrEqual(viewport.scrY(node.y), Insets.route.top - 1e-6)
      XCTAssertLessThanOrEqual(viewport.scrY(node.y), 320 - Insets.route.bottom + 1e-6)
    }

    var v = Viewport()
    v.fit(bbox, width: 360, height: 320, pad: 20)
    v.pan(10000, -10000)
    XCTAssertLessThanOrEqual(v.tx, 360 - 56 - bbox.minX * v.zoom + 1e-6)
    XCTAssertGreaterThanOrEqual(v.ty, 56 - bbox.maxY * v.zoom - 1e-6)

    v.fit(bbox, width: 360, height: 320, pad: 20)
    let cx = 180.0, cy = 160.0
    let wx = v.worldX(cx), wy = v.worldY(cy)
    v.pinch(cx, cy, factor: 1.4)
    XCTAssertEqual(v.scrX(wx), cx, accuracy: 1e-6)
    XCTAssertEqual(v.scrY(wy), cy, accuracy: 1e-6)
    v.pinch(cx, cy, factor: 1000)
    XCTAssertLessThanOrEqual(v.zoom, Viewport.maxZoom + 1e-9)
    v.pinch(cx, cy, factor: 1e-9)
    XCTAssertGreaterThanOrEqual(v.zoom, v.minZoom - 1e-9)
  }

  // ------------------------------------------------------------ 与 ArkTS 相反的两处有意差异

  func testApmWeightIsPresent() throws {
    // ArkTS 的权重表缺 apm（会兜底成 25m 楼梯）；这里必须按 350m 处理
    XCTAssertEqual(VERTICAL_WEIGHT["apm"], 350)
    XCTAssertEqual(PREF_MULT[PREF_SHORTEST]["apm"], 1)
  }

  func testTokensAndLabelsExported() throws {
    let tokens = graph.bundle.tokens
    XCTAssertEqual(tokens.APP["accent"], "#007F7A")
    XCTAssertEqual(tokens.HIT, "#007F7A")
    XCTAssertEqual(tokens.TYPE_COLOR.count, 15)
    XCTAssertEqual(tokens.TYPE_COLOR["gate"], "#286DAB")
    XCTAssertEqual(graph.bundle.typeLabels["gate"]?.zh, "登机口")
    XCTAssertEqual(graph.bundle.nodeEn["xha_p4_gA101"], "Gate A101")
  }
}
