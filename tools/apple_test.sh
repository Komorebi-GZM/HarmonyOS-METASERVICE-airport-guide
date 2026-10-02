#!/usr/bin/env bash
# Apple 端核心回归 / 运行：swift test 或 swift run airport-cli
#
# 为什么需要这个脚本：本机沙箱不允许 SwiftPM 写 ~/Library/Caches 与系统 clang module cache，
# 也不允许它套用自己的 sandbox-exec，因此把缓存指到仓库内并加 --disable-sandbox。
# 在 Xcode 里打开 apps/apple/Package.swift 时不需要这些参数。
#
# 用法：
#   bash tools/apple_test.sh test
#   bash tools/apple_test.sh run airport-cli
#   bash tools/apple_test.sh run airport-cli --from xha_p1_taxi --to xha_p4_gA101 --steps
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APPLE="$ROOT/apps/apple"
export CLANG_MODULE_CACHE_PATH="$APPLE/.module-cache"
cd "$APPLE"

SPM_OPTS=(--disable-sandbox --manifest-cache none
  --scratch-path "$APPLE/.build"
  --cache-path "$APPLE/.swiftpm/cache"
  --config-path "$APPLE/.swiftpm/config"
  --security-path "$APPLE/.swiftpm/security")

CMD="${1:-test}"; shift || true
if [ "$CMD" = "run" ]; then
  # 注意：`swift run <目标> ...` 里目标之后的参数会传给目标本身，
  # 因此 SwiftPM 选项必须放在目标名之前。
  TARGET="${1:-airport-cli}"; shift || true
  exec swift run "${SPM_OPTS[@]}" "$TARGET" "$@"
fi
exec swift "$CMD" "${SPM_OPTS[@]}" "$@"
