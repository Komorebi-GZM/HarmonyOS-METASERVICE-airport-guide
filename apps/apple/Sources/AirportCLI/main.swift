// 星海机场导航 · Apple 端命令行示例
//
// 用途：在 macOS 上直接运行共享核心（不需要模拟器、不需要 GUI），验证寻路与文案；
// 也是下一步 SwiftUI 界面的"最小可运行参照"。
//
// 用法：
//   swift run airport-cli                       # 打印 6 条参考样例（与 pathfind_reference.py 同口径）
//   swift run airport-cli --from xha_p1_taxi --to xha_p4_gA101 --steps
//   swift run airport-cli --from xha_b2_platA --to xha_p4_airMall --pref 1 --lang en

import Foundation
import AirportCore

let graph = AirportGraph.shared
let arguments = CommandLine.arguments

func argValue(_ name: String) -> String? {
  guard let idx = arguments.firstIndex(of: name), idx + 1 < arguments.count else { return nil }
  return arguments[idx + 1]
}

let langEn = argValue("--lang") == "en"
let showSteps = arguments.contains("--steps")
let pref = Int(argValue("--pref") ?? "0") ?? 0
let metersUnit = I18n.t("meters", en: langEn)

func meters(_ value: Double) -> String {
  value == value.rounded() ? String(Int(value)) : String(format: "%.1f", value)
}

/// 单条路线的文字说明
func describe(_ start: String, _ end: String, _ pref: Int, label: String) -> String {
  let view = buildRouteView(graph, startId: start, endId: end, pref: pref)
  guard view.status == .ready else {
    return "  \(label)  ✗ \(view.status.rawValue)"
  }
  let route = view.route
  let badge = route.viaSecurity ? (langEn ? " [via security]" : " [必经安检]") : ""
  var lines: [String] = []
  // 两个口径都打印：totalMeters = 含换层的总里程（与 pathfind_reference.py 一致），
  // walkingMeters = 只累计 walk 边（ArkTS 的 UI 用的就是这个，故界面上的"步行约"会小于总里程）。
  // 该口径差异已登记在 docs/TODO.md（T-017）。
  let totals = "总 \(meters(route.totalMeters)) \(metersUnit) / 步行 \(meters(view.walkingMeters)) \(metersUnit)"
  let head = "  \(label)\(badge)  \(totals)  \(route.nodeIds.count) 节点  \(start) → \(end)"
  lines.append(head)
  if showSteps {
    for (index, step) in view.steps.enumerated() {
      let floorText = step.floor.isEmpty ? "" : " · " + I18n.floorLabel(step.floor, en: langEn)
      let amount = step.meters > 0 ? "  \(meters(step.meters)) \(metersUnit)" : ""
      lines.append("      \(index + 1). [\(step.kind.rawValue)] \(step.fromId) → \(step.toId)\(floorText)\(amount)")
    }
  }
  return lines.joined(separator: "\n")
}

print("星海国际机场 XHA · Apple 端共享核心")
let floors = graph.floorOrder.joined(separator: " ")
print("节点 \(graph.nodes.count) / 边 \(graph.edges.count) / 楼层 \(floors)")
let sides = graph.sideCount()
print("陆侧 \(sides.land) / 空侧 \(sides.air) / 安检 \(sides.gate) · 唯一安检 = \(graph.securityId)")

if let from = argValue("--from"), let to = argValue("--to") {
  let prefName = I18n.t(preferenceKey(pref), en: langEn)
  print("\n路线（偏好 \(prefName)）：")
  print(describe(from, to, pref, label: "自定义"))
} else {
  let samples: [(String, String, String)] = [
    ("xha_p4_doorW", "xha_p4_gC308", "出发门→远端登机口"),
    ("xha_p4_doorE", "xha_p3_loungeA", "出发门→贵宾休息室(跨2层)"),
    ("xha_p1_taxi", "xha_p4_gA101", "出租车→登机口(跨3层)"),
    ("xha_b2_platA", "xha_p4_airMall", "地铁站台→免税区(跨4层)"),
    ("xha_p2_bagA", "xha_p4_doorW", "行李→出发门(同侧)"),
    ("xha_b1_gtc", "xha_b2_platB", "交通中心→地铁(同侧地下)"),
  ]
  let hint = showSteps ? "，含逐步指引" : "（加 --steps 看逐步指引）"
  print("\n参考样例（偏好 = 最短）\(hint)：")
  for (start, end, label) in samples {
    print(describe(start, end, PREF_SHORTEST, label: label))
  }

  print("\n四档偏好对比（出租车 → A101）：")
  for index in 0..<PREFERENCE_COUNT {
    let route = try? planRoute(graph, startId: "xha_p1_taxi", endId: "xha_p4_gA101", pref: index)
    let facilities = route?.transitions.map { $0.viaType }.joined(separator: "+") ?? "-"
    let name = I18n.t(preferenceKey(index), en: langEn)
    let total = meters(route?.totalMeters ?? 0)
    print("  \(name)：\(total) 米 · 换层 \(facilities)")
  }
}
