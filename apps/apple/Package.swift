// swift-tools-version: 6.0
// 星海机场导航 · Apple 端共享核心（Swift 移植）
//
// 数据来源：apps/apple/Sources/AirportCore/Resources/airport-data.json
//   该文件由 `python3 tools/export_shared.py` 从 ArkTS 真源生成，**请勿手改**。
// 回归：`swift test`（见 Tests/AirportCoreTests）。
//
// 注意：本沙箱环境下 SwiftPM 自身的 sandbox 会被外层拒绝，需要：
//   CLANG_MODULE_CACHE_PATH=$PWD/.module-cache swift test --disable-sandbox \
//     --scratch-path .build --cache-path .swiftpm/cache --config-path .swiftpm/config --security-path .swiftpm/security
// 在 Xcode 里打开 Package.swift 则无需这些参数。

import PackageDescription

let package = Package(
  name: "AirportGuide",
  platforms: [.macOS(.v13), .iOS(.v16)],
  products: [
    .library(name: "AirportCore", targets: ["AirportCore"]),
    .executable(name: "airport-cli", targets: ["AirportCLI"]),
  ],
  targets: [
    .target(
      name: "AirportCore",
      path: "Sources/AirportCore",
      resources: [.copy("Resources/airport-data.json")],
      swiftSettings: [.swiftLanguageMode(.v5)]
    ),
    .executableTarget(
      name: "AirportCLI",
      dependencies: ["AirportCore"],
      path: "Sources/AirportCLI",
      swiftSettings: [.swiftLanguageMode(.v5)]
    ),
    .testTarget(
      name: "AirportCoreTests",
      dependencies: ["AirportCore"],
      path: "Tests/AirportCoreTests",
      resources: [.copy("Fixtures/routes.json")],
      swiftSettings: [.swiftLanguageMode(.v5)]
    ),
  ]
)
