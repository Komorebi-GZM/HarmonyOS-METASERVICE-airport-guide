// AirportUI 回归：呈现层文案、地图绘制命令、颜色解析、应用状态机与本地偏好。
// 这些都是 SwiftUI 之外的可测逻辑；GUI 只做"解释命令 + 摆放视图"。

import XCTest
@testable import AirportUI
@testable import AirportCore

final class PresenterTests: XCTestCase {
  let graph = AirportGraph.shared

  func testMetersFormatting() {
    XCTAssertEqual(Presenter.meters(635), "635")
    XCTAssertEqual(Presenter.meters(12.5), "12.5")
    XCTAssertEqual(Presenter.meters(0), "0")
  }

  func testSummaryUsesWalkingMetersAndTransfers() {
    let view = buildRouteView(graph, startId: "xha_b2_platA", endId: "xha_p4_airMall", pref: 0)
    let zh = Presenter.summary(view, en: false)
    XCTAssertTrue(zh.contains("步行约 325 米"), zh)
    XCTAssertTrue(zh.contains("1 次换层"), zh)
    let en = Presenter.summary(view, en: true)
    XCTAssertTrue(en.contains("Walking 325 m"), en)
  }

  func testStepTitlesCoverAllKinds() {
    let view = buildRouteView(graph, startId: "xha_p4_doorW", endId: "xha_p4_gA101", pref: 0)
    let kinds = Set(view.steps.map(\.kind))
    XCTAssertTrue(kinds.contains(.walk))
    XCTAssertTrue(kinds.contains(.security))
    XCTAssertTrue(kinds.contains(.destination))

    let titles = view.steps.map { Presenter.stepTitle($0, en: false) }
    for title in titles { XCTAssertFalse(title.isEmpty) }
    XCTAssertTrue(titles.contains("通过中央安检"), titles.joined(separator: " | "))

    let transfer = buildRouteView(graph, startId: "xha_p1_taxi", endId: "xha_p4_gA101", pref: 0)
      .steps.first { $0.kind == .transfer }
    XCTAssertNotNil(transfer)
    XCTAssertTrue(Presenter.stepTitle(transfer!, en: false).contains("乘电梯"), Presenter.stepTitle(transfer!, en: false))
    XCTAssertTrue(Presenter.stepTitle(transfer!, en: true).contains("elevator"))
    XCTAssertEqual(Presenter.stepAction(transfer!, isLast: false, en: false), "已到达下一层")
  }

  func testStepActionFollowsKindAndPosition() {
    let view = buildRouteView(graph, startId: "xha_p4_doorW", endId: "xha_p4_gA101", pref: 0)
    for (index, step) in view.steps.enumerated() {
      let label = Presenter.stepAction(step, isLast: index == view.steps.count - 1, en: false)
      XCTAssertFalse(label.isEmpty)
      if step.kind == .security { XCTAssertEqual(label, "已通过安检") }
      if step.kind == .transfer { XCTAssertEqual(label, "已到达下一层") }
      if index == view.steps.count - 1 { XCTAssertEqual(label, "确认到达目的地") }
    }
  }

  func testCategoryChipsAndPreferenceLabels() {
    let chips = Presenter.categoryChips(en: false)
    XCTAssertEqual(chips.count, 10)
    XCTAssertEqual(chips.first?.key, "all")
    XCTAssertTrue(chips[1].label.contains("登机口"))
    XCTAssertEqual(Presenter.preferenceLabel(0, en: false), "推荐路线")
    XCTAssertEqual(Presenter.preferenceLabel(3, en: true), "Minimize stairs")
  }

  func testStatusTitlesMatchCoreKeys() {
    XCTAssertEqual(Presenter.statusTitle(.missing, en: false), "请先选择起点和目的地")
    XCTAssertEqual(Presenter.statusTitle(.invalid, en: false), "这个地点已不可用")
    XCTAssertEqual(Presenter.statusTitle(.same, en: false), "起点和目的地相同")
    XCTAssertEqual(Presenter.statusTitle(.unreachable, en: false), "暂无可达路线")
  }

  func testRowSubtitleIncludesTypeFloorAndGateCode() {
    let gate = graph.node("xha_p4_gA101")!
    let subtitle = Presenter.rowSubtitle(gate, en: false)
    XCTAssertTrue(subtitle.contains("登机口"), subtitle)
    XCTAssertTrue(subtitle.contains("出发层"), subtitle)
    XCTAssertTrue(subtitle.contains("A101"), subtitle)
  }

  func testPopularAndQuickCardsResolve() {
    let popular = Presenter.popularCards(en: false)
    XCTAssertEqual(popular.count, 6)
    for card in popular {
      XCTAssertNotNil(graph.node(card.id))
      XCTAssertFalse(card.title.isEmpty)
      XCTAssertFalse(card.subtitle.isEmpty)
    }
    XCTAssertEqual(Presenter.quickStartCards(en: false).count, QUICK_STARTS.count)
  }

  func testMetroDirections() {
    let directions = Presenter.metroDirections(en: false)
    XCTAssertEqual(directions.count, 2)
    XCTAssertEqual(directions[0].targetId, "xha_b2_platA")
    XCTAssertEqual(directions[1].targetId, "xha_b2_platB")
    XCTAssertTrue(directions[0].subtitle.contains("B2"))
    XCTAssertEqual(Presenter.metroSteps(en: false).count, 3)
  }

  func testPlacesFilteringUsesCoreRules() {
    // 空查询 + all → 只返回对外可见地点
    let all = Presenter.places(query: "", category: "all")
    XCTAssertFalse(all.isEmpty)
    XCTAssertTrue(all.allSatisfy { Places.isPublic($0) })
    // 编号检索
    let hit = Presenter.places(query: " a101 ", category: "all")
    XCTAssertEqual(hit.first?.id, "xha_p4_gA101")
    // 分类过滤
    let gates = Presenter.places(query: "", category: "gate")
    XCTAssertTrue(gates.allSatisfy { Categories.catOf($0) == "gate" })
    XCTAssertFalse(gates.isEmpty)
  }
}

final class RendererTests: XCTestCase {
  let graph = AirportGraph.shared
  /// 与 TS 端 packages/core/test/render.test.ts 使用同一组画布尺寸
  let SIZE = (width: 380.0, height: 320.0)

  func testLayerOrderAndRequiredCalls() {
    var vp = MapRenderer.fitFloor(graph, floor: "4F", width: 380, height: 320)
    XCTAssertGreaterThan(vp.zoom, 0)
    let commands = MapRenderer.render(graph, MapRenderInput(floor: "4F", viewport: vp, width: SIZE.width, height: SIZE.height))

    // 首条是底色，第二条是楼层底板
    guard case .fillRect(_, _, _, _, let surfaceColor) = commands[0] else {
      return XCTFail("第一条命令应为底色填充")
    }
    XCTAssertEqual(surfaceColor, graph.bundle.tokens.MAP["surface"])
    guard case .fillRect = commands[1] else { return XCTFail("第二条应为楼层底板") }

    // 走廊双描边（外深内浅）
    let corridorStrokes = commands.compactMap { command -> String? in
      if case .polyline(_, let color, _) = command, color == MapRenderer.corridorCasing || color == MapRenderer.corridorFill {
        return color
      }
      return nil
    }
    XCTAssertEqual(corridorStrokes.count, 2, "走廊应有深浅两条描边")
    XCTAssertEqual(corridorStrokes[0], MapRenderer.corridorCasing)

    // 节点圆：4F 有 55 个节点
    let circles = commands.filter { if case .circle = $0 { return true } else { return false } }
    XCTAssertEqual(circles.count, graph.floorNodes("4F").count)
  }

  func testRouteLayerOnlyWhenRoutePresent() {
    var vp = MapRenderer.fitFloor(graph, floor: "4F", width: 380, height: 320)
    let without = MapRenderer.render(graph, MapRenderInput(floor: "4F", viewport: vp, width: SIZE.width, height: SIZE.height))
    let routeColorPolylines = without.filter { command in
      if case .polyline(_, let color, _) = command { return color == MapRenderer.routeDone }
      return false
    }
    XCTAssertTrue(routeColorPolylines.isEmpty, "无路线时不应出现路径层")

    let route = try! planRoute(graph, startId: "xha_p4_doorW", endId: "xha_p4_gA101", pref: 0)
    let withRoute = MapRenderer.render(graph, MapRenderInput(
      floor: "4F", viewport: vp, width: SIZE.width, height: SIZE.height, routeNodeIds: route.nodeIds,
      currentRouteIndex: route.nodeIds.count - 1,
      startId: "xha_p4_doorW", endId: "xha_p4_gA101"
    ))
    let hasDone = withRoute.contains { command in
      if case .polyline(_, let color, _) = command { return color == MapRenderer.routeDone }
      return false
    }
    let hasLive = withRoute.contains { command in
      if case .polyline(_, let color, _) = command { return color == MapRenderer.routeLive }
      return false
    }
    XCTAssertTrue(hasDone && hasLive, "路线态应同时有全程色与当前段色")
  }

  func testMarkersAppearOnTheirOwnFloorOnly() {
    var vp = MapRenderer.fitFloor(graph, floor: "4F", width: 380, height: 320)
    let onFour = MapRenderer.render(graph, MapRenderInput(floor: "4F", viewport: vp, width: SIZE.width, height: SIZE.height, startId: "xha_p4_doorW", endId: "xha_p4_gA101"))
    let markerCircles = onFour.filter { command in
      if case .circle(_, _, let radius, let fill, _, _) = command {
        return radius == 11 && (fill == MapRenderer.routeLive || fill == MapRenderer.markerEndColor)
      }
      return false
    }
    XCTAssertEqual(markerCircles.count, 2, "起终点都在 4F 时应有两个标记")

    // B2 站台作起点时，4F 上不应出现起点标记
    let otherFloor = MapRenderer.render(graph, MapRenderInput(floor: "4F", viewport: vp, width: SIZE.width, height: SIZE.height, startId: "xha_b2_platA"))
    let strayMarkers = otherFloor.filter { command in
      if case .circle(_, _, let radius, _, _, _) = command { return radius == 11 }
      return false
    }
    XCTAssertTrue(strayMarkers.isEmpty, "其他楼层的标记不应画在 4F")
  }

  func testLabelVisibilityThresholds() {
    let gate = graph.node("xha_p4_gA101")!
    let corridor = graph.nodes.first { $0.type == "corridor" }!
    XCTAssertFalse(MapRenderer.shouldLabel(corridor, zoom: 3))
    XCTAssertFalse(MapRenderer.shouldLabel(gate, zoom: 0.4))
    XCTAssertTrue(MapRenderer.shouldLabel(gate, zoom: 0.6))
    XCTAssertTrue(MapRenderer.shouldLabel(gate, zoom: 1.2))
    let toilet = graph.nodes.first { $0.type == "toilet" }!
    XCTAssertFalse(MapRenderer.shouldLabel(toilet, zoom: 0.6), "中等缩放下非关键类型不显示标签")
    XCTAssertTrue(MapRenderer.shouldLabel(toilet, zoom: 0.9))
  }

  func testNodeRadiusRules() {
    XCTAssertEqual(MapRenderer.radius(of: graph.nodes.first { $0.type == "corridor" }!), 2.6)
    XCTAssertEqual(MapRenderer.radius(of: graph.nodes.first { $0.type == "lift" }!), 4)
    XCTAssertEqual(MapRenderer.radius(of: graph.node("xha_p4_gA101")!), 5.5)
  }

  func testHitTestPicksNearestWithinRadius() {
    let vp = MapRenderer.fitFloor(graph, floor: "4F", width: 380, height: 320)
    let gate = graph.node("xha_p4_gA101")!
    let x = vp.scrX(gate.x), y = vp.scrY(gate.y)
    XCTAssertEqual(MapRenderer.hitTest(graph, floor: "4F", viewport: vp, x: x, y: y)?.id, gate.id)

    // 用显式小半径验证"超出半径即不命中"，避免受邻近节点分布影响
    XCTAssertNil(MapRenderer.hitTest(graph, floor: "4F", viewport: vp, x: x + 10, y: y, radius: 2))
    XCTAssertNotNil(MapRenderer.hitTest(graph, floor: "4F", viewport: vp, x: x + 10, y: y, radius: 22))

    // 再找一个确实远离所有节点的空白点，验证默认半径下不命中
    var emptyPoint: (Double, Double)?
    for candidateX in stride(from: 10.0, to: 370.0, by: 10) {
      for candidateY in stride(from: 10.0, to: 310.0, by: 10) {
        let nearest = MapRenderer.hitTest(graph, floor: "4F", viewport: vp, x: candidateX, y: candidateY)
        if nearest == nil { emptyPoint = (candidateX, candidateY); break }
      }
      if emptyPoint != nil { break }
    }
    XCTAssertNotNil(emptyPoint, "画布上总应存在远离所有节点的空白点")
    if let point = emptyPoint {
      XCTAssertNil(MapRenderer.hitTest(graph, floor: "4F", viewport: vp, x: point.0, y: point.1))
    }
  }

  func testFitRouteKeepsRouteInsideInsets() {
    let route = try! planRoute(graph, startId: "xha_p1_taxi", endId: "xha_p4_gA101", pref: 0)
    let vp = MapRenderer.fitRoute(graph, nodeIds: route.nodeIds, width: 360, height: 320)
    for id in route.nodeIds {
      let node = graph.node(id)!
      XCTAssertGreaterThanOrEqual(vp.scrX(node.x), Insets.route.left - 1e-6)
      XCTAssertLessThanOrEqual(vp.scrX(node.x), 360 - Insets.route.right + 1e-6)
      XCTAssertGreaterThanOrEqual(vp.scrY(node.y), Insets.route.top - 1e-6)
      XCTAssertLessThanOrEqual(vp.scrY(node.y), 320 - Insets.route.bottom + 1e-6)
    }
  }

  func testPickStartFromMapActuallySetsTheStart() {
    let model = AppModel(store: MemoryStore(), graph: .shared)
    model.openBrowse()
    model.setBrowseFloor("4F")
    model.setStartFromMap("xha_p4_doorW")

    XCTAssertEqual(model.state.planner.draftStart, "xha_p4_doorW", "未把选中的点写成起点")
    XCTAssertEqual(model.state.toast, "已选择出发位置")

    // 随后「去这里」应基于新起点成行
    model.routeToFromMap("xha_p4_gA101")
    XCTAssertEqual(model.state.planner.stage, .preview)
    XCTAssertEqual(model.routeView.status, .ready)
    XCTAssertEqual(model.state.planner.startId, "xha_p4_doorW", "确认路线时起点仍是旧值")
  }

  func testSizeLadderIsExportedAndCoversTheUI() {
    let metrics = AirportGraph.shared.bundle.metrics
    XCTAssertEqual(metrics.fontSizes.count, 13, "字号阶梯应有 13 档")
    XCTAssertEqual(metrics.spaceSizes.count, 10, "间距阶梯应有 10 档")
    XCTAssertEqual(metrics.radiusSizes, [9, 11, 14, 16], "圆角阶梯应与 DESIGN.md §6 一致")
    XCTAssertEqual(metrics.fontSizes, [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 24, 28])

    // 阶梯覆盖 UI 里用到的字号（Theme.font 只在阶梯上取值，否则视觉会漂）
    for size in [11.0, 12, 13, 14, 15, 16, 17, 19, 22, 28] {
      XCTAssertTrue(metrics.fontSizes.contains(size), "UI 用到的字号 \(size) 不在阶梯上")
    }
    XCTAssertEqual(Metrics.fontLadder, metrics.fontSizes)
    XCTAssertEqual(Metrics.spaceLadder, metrics.spaceSizes)
    // 不在阶梯上的值原样返回，便于渐进收敛
    XCTAssertEqual(Metrics.fontSize(37), 37)
    XCTAssertEqual(Metrics.fontSize(19), 19)
  }

  func testColorParsing() {
    XCTAssertEqual(RGBAColor(string: "#007F7A"), RGBAColor(red: 0, green: 127.0 / 255, blue: 122.0 / 255))
    XCTAssertEqual(RGBAColor(string: "#fff"), RGBAColor(red: 1, green: 1, blue: 1))
    let rgba = RGBAColor(string: "rgba(255,255,255,0.86)")
    XCTAssertEqual(rgba?.alpha ?? 0, 0.86, accuracy: 1e-9)
    XCTAssertEqual(rgba?.red ?? 0, 1, accuracy: 1e-9)
    XCTAssertNil(RGBAColor(string: "not-a-color"))
    // 所有导出令牌都应能解析（否则地图会画出灰块）
    let tokens = graph.bundle.tokens
    for (key, value) in tokens.APP {
      XCTAssertNotNil(RGBAColor(string: value), "APP.\(key) 颜色无法解析：\(value)")
    }
    for (key, value) in tokens.MAP {
      XCTAssertNotNil(RGBAColor(string: value), "MAP.\(key) 颜色无法解析：\(value)")
    }
    for (key, value) in tokens.TYPE_COLOR {
      XCTAssertNotNil(RGBAColor(string: value), "TYPE_COLOR.\(key) 无法解析：\(value)")
    }
  }
}

final class AppModelTests: XCTestCase {
  func testFullJourneyFlow() {
    let store = MemoryStore()
    let model = AppModel(store: store, graph: .shared)

    XCTAssertEqual(model.state.view, .home)
    model.startTargetFlow(category: "gate")
    XCTAssertEqual(model.state.view, .target)

    model.chooseTarget("xha_p4_gA101")
    XCTAssertEqual(model.state.view, .start)
    XCTAssertEqual(model.state.planner.draftEnd, "xha_p4_gA101")

    model.chooseStart("xha_p4_doorW")
    XCTAssertEqual(model.state.view, .route)
    XCTAssertEqual(model.state.planner.stage, .preview)
    let view = model.routeView
    XCTAssertEqual(view.status, .ready)
    XCTAssertTrue(view.route.nodeIds.contains(AirportGraph.shared.securityId))

    // 里程写入最近列表（确认路线时）
    XCTAssertEqual(model.state.recent.first, "xha_p4_gA101")
    XCTAssertEqual(store.recent.first, "xha_p4_gA101", "偏好应落盘")

    model.setPreference(1)
    XCTAssertEqual(model.state.planner.preference, 1)
    XCTAssertEqual(model.state.planner.stage, .preview)

    model.beginGuidance()
    XCTAssertEqual(model.state.planner.stage, .guiding)
    XCTAssertEqual(model.currentStep?.kind, .walk)

    var guardCount = 0
    while model.state.planner.stage == .guiding && guardCount < 20 {
      model.advance()
      guardCount += 1
    }
    XCTAssertEqual(model.state.planner.stage, .completed)
    XCTAssertEqual(guardCount, view.steps.count)

    model.restart()
    XCTAssertEqual(model.state.view, .home)
    XCTAssertEqual(model.state.planner.stage, .editing)
    XCTAssertEqual(model.state.planner.startId, "")
  }

  func testGuidingStepNavigationAndJump() {
    let model = AppModel(store: MemoryStore(), graph: .shared)
    model.chooseDestinationFromHome("xha_b2_platA")
    model.chooseStart("xha_p4_doorW")
    model.beginGuidance()
    let total = model.routeView.steps.count
    XCTAssertGreaterThan(total, 2)

    model.advance()
    XCTAssertEqual(model.state.planner.stepIndex, 1)
    model.previous()
    XCTAssertEqual(model.state.planner.stepIndex, 0)
    model.previous()
    XCTAssertEqual(model.state.planner.stepIndex, 0, "上一步不应越界")

    model.jumpToStep(total - 1)
    XCTAssertEqual(model.state.planner.stepIndex, total - 1)
    model.jumpToStep(1)
    XCTAssertEqual(model.state.planner.stepIndex, 1)
    XCTAssertEqual(model.state.planner.stage, .guiding)
  }

  func testActiveFloorFollowsCurrentStep() {
    let model = AppModel(store: MemoryStore(), graph: .shared)
    model.chooseDestinationFromHome("xha_b2_platA")
    model.chooseStart("xha_p4_doorW")
    model.beginGuidance()
    var seenFloors = Set<String>()
    for _ in 0..<model.routeView.steps.count {
      seenFloors.insert(model.activeFloor)
      model.advance()
    }
    XCTAssertTrue(seenFloors.contains("4F"), "应经过 4F：\(seenFloors)")
    XCTAssertTrue(seenFloors.contains("B2"), "应到达 B2：\(seenFloors)")
  }

  func testLanguageTogglePersists() {
    let store = MemoryStore()
    let model = AppModel(store: store, graph: .shared)
    XCTAssertFalse(model.state.isEn)
    model.toggleLanguage()
    XCTAssertTrue(model.state.isEn)
    XCTAssertEqual(store.lang, "en")

    let reloaded = AppModel(store: store, graph: .shared)
    XCTAssertTrue(reloaded.state.isEn, "重启后应恢复语言")
  }

  func testRecentListIsBoundedAndFilteredOnLoad() {
    let store = MemoryStore(lang: "zh", recent: ["xha_p4_gA101", "不存在的地点"])
    let model = AppModel(store: store, graph: .shared)
    XCTAssertEqual(model.state.recent, ["xha_p4_gA101"], "加载时应剔除已失效地点")

    for id in ["xha_p4_gB201", "xha_p4_gC308", "xha_b2_platB", "xha_p1_taxi", "xha_b1_gtc", "xha_p2_bagA", "xha_p4_doorN"] {
      model.chooseDestinationFromHome(id)
      model.chooseStart("xha_p4_doorW")
    }
    XCTAssertLessThanOrEqual(model.state.recent.count, 6)
    XCTAssertEqual(Set(model.state.recent).count, model.state.recent.count, "最近列表需去重")
  }

  func testMetroFlowAndBrowseFlow() {
    let model = AppModel(store: MemoryStore(), graph: .shared)
    model.startMetroFlow()
    XCTAssertEqual(model.state.view, .metro)
    model.chooseMetroDirection(targetId: "xha_b2_platA")
    XCTAssertEqual(model.state.view, .start)
    XCTAssertEqual(model.state.planner.draftEnd, "xha_b2_platA")

    model.chooseStart("xha_p4_doorW")
    XCTAssertEqual(model.state.view, .route)

    model.openBrowse()
    XCTAssertEqual(model.state.view, .browse)
    model.setBrowseFloor("B2")
    XCTAssertEqual(model.state.browseFloor, "B2")
    model.selectNode("xha_b2_platA")
    XCTAssertEqual(model.state.selectedId, "xha_b2_platA")
    model.setStartFromMap("xha_b2_platA")
    XCTAssertFalse(model.state.toast.isEmpty, "应给出「已选择出发位置」提示")
    model.routeToFromMap("xha_p4_gA101")
    XCTAssertEqual(model.state.view, .route)
    XCTAssertEqual(model.state.planner.endId, "xha_p4_gA101")
  }

  func testBrowseBackGoesToTargetWhenPickingDestination() {
    let model = AppModel(store: MemoryStore(), graph: .shared)
    model.openBrowseForDestination()
    XCTAssertEqual(model.state.pick, .end)
    model.backFromBrowse()
    XCTAssertEqual(model.state.view, .target, "从「在地图上选择」进来时返回目的地页")

    model.openBrowse()
    model.backFromBrowse()
    XCTAssertEqual(model.state.view, .home, "从首页进入楼层地图时返回首页")
  }

  func testEditAndSwap() {
    let model = AppModel(store: MemoryStore(), graph: .shared)
    model.chooseDestinationFromHome("xha_p4_gA101")
    model.chooseStart("xha_p4_doorW")

    // 修改出发位置 → 进入「出发位置」页（不是目的地页）
    model.editStart()
    XCTAssertEqual(model.state.view, .start)
    XCTAssertEqual(model.state.planner.editing, .start)
    let destinationBefore = model.state.planner.endId
    model.chooseStart("xha_p4_doorE")
    XCTAssertEqual(model.state.view, .route)
    XCTAssertEqual(model.state.planner.startId, "xha_p4_doorE")
    XCTAssertEqual(model.state.planner.endId, destinationBefore, "修改起点不应改动目的地")

    // 修改目的地 → 进入「目的地」页，选完即提交
    model.editDestination()
    XCTAssertEqual(model.state.view, .target)
    XCTAssertEqual(model.state.planner.editing, .end)
    model.chooseTarget("xha_p4_gC308")
    XCTAssertEqual(model.state.view, .route)
    XCTAssertEqual(model.state.planner.endId, "xha_p4_gC308")

    // 交换后：起点 = 原目的地（xha_p4_gC308），终点 = 原起点（xha_p4_doorE）
    model.swap()
    XCTAssertEqual(model.state.planner.startId, "xha_p4_gC308")
    XCTAssertEqual(model.state.planner.endId, "xha_p4_doorE")
    XCTAssertEqual(model.state.planner.stage, .preview)
  }

  func testInvalidRouteStatesSurface() {
    let model = AppModel(store: MemoryStore(), graph: .shared)
    XCTAssertEqual(model.routeView.status, .missing)
    model.chooseDestinationFromHome("xha_p4_gA101")
    model.chooseStart("xha_p4_gA101")
    XCTAssertEqual(model.routeView.status, .same)
  }
}
