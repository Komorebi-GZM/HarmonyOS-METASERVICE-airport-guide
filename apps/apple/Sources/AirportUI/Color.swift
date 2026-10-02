// 颜色解析：绘制命令里的颜色是字符串（与 ArkTS / Web 的写法一致），
// 这里把 `#RRGGBB`、`#RGB`、`rgba(r,g,b,a)` 解析成可测的分量，SwiftUI 层再转成 Color。

import Foundation

public struct RGBAColor: Equatable, Sendable {
  public let red: Double
  public let green: Double
  public let blue: Double
  public let alpha: Double

  public init(red: Double, green: Double, blue: Double, alpha: Double = 1) {
    self.red = red
    self.green = green
    self.blue = blue
    self.alpha = alpha
  }

  /// 支持 `#RGB` / `#RRGGBB` / `rgba(r,g,b,a)` / `rgb(r,g,b)`
  public init?(string: String) {
    let text = string.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    if text.hasPrefix("#") {
      let hex = String(text.dropFirst())
      func component(_ slice: Substring) -> Double? {
        guard let value = UInt8(slice, radix: 16) else { return nil }
        return Double(value) / 255
      }
      if hex.count == 3 {
        var expanded = ""
        for ch in hex { expanded.append(ch); expanded.append(ch) }
        guard expanded.count == 6 else { return nil }
        let chars = Array(expanded)
        guard let r = component(Substring(String(chars[0...1]))),
              let g = component(Substring(String(chars[2...3]))),
              let b = component(Substring(String(chars[4...5]))) else { return nil }
        self.init(red: r, green: g, blue: b)
        return
      }
      if hex.count == 6 || hex.count == 8 {
        let chars = Array(hex)
        guard let r = component(Substring(String(chars[0...1]))),
              let g = component(Substring(String(chars[2...3]))),
              let b = component(Substring(String(chars[4...5]))) else { return nil }
        var a = 1.0
        if hex.count == 8, let alpha = component(Substring(String(chars[6...7]))) { a = alpha }
        self.init(red: r, green: g, blue: b, alpha: a)
        return
      }
      return nil
    }
    if text.hasPrefix("rgba(") || text.hasPrefix("rgb(") {
      let inner = text
        .replacingOccurrences(of: "rgba(", with: "")
        .replacingOccurrences(of: "rgb(", with: "")
        .replacingOccurrences(of: ")", with: "")
      let parts = inner.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }
      guard parts.count >= 3,
            let r = Double(parts[0]), let g = Double(parts[1]), let b = Double(parts[2]) else { return nil }
      let a = parts.count >= 4 ? (Double(parts[3]) ?? 1) : 1
      self.init(red: r / 255, green: g / 255, blue: b / 255, alpha: a)
      return
    }
    return nil
  }
}
