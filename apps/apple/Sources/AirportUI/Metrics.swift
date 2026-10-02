// 尺寸阶梯（字号 / 间距 / 圆角）：与颜色令牌一样，三端共用同一份导出数据。
//
// 真源：tools/export_shared.py 的 FONT_LADDER / SPACE_LADDER / RADIUS_LADDER
//   → airport-data.json 的 metrics 字段（Web 与小程序读同源的 tokens.css / tokens.wxss）
// 取值与用途记录在 docs/DESIGN.md §5/§6。

import Foundation
import AirportCore

public enum Metrics {
  private static var bundle: AirportDataBundle { AirportGraph.shared.bundle }

  public static var fontLadder: [Double] { bundle.metrics.fontSizes }
  public static var spaceLadder: [Double] { bundle.metrics.spaceSizes }
  public static var radiusLadder: [Double] { bundle.metrics.radiusSizes }

  /// 把字号映射到阶梯值；不在阶梯上则原样返回（便于渐进收敛，测试会核对覆盖情况）
  public static func fontSize(_ size: Double) -> Double {
    fontLadder.contains(size) ? size : size
  }

  /// 间距令牌：只接受阶梯上的值，否则原样返回
  public static func space(_ value: Double) -> Double {
    spaceLadder.contains(value) ? value : value
  }

  public static func fontNote(_ size: Double) -> String? {
    bundle.metrics.fonts[String(Int(size))]
  }
}
