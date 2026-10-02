#!/usr/bin/env bash
# 一键离线回归：从 ArkTS 真源一路验到三端客户端。
#
# 为什么需要它：这个仓库有 5 类检查、9 个脚本，散着跑容易漏。这里固定顺序，
# 任一步失败立即退出（set -e），并打印每一步在验什么。
#
# 用法：bash tools/check_all.sh     （等价于 npm run check:all）
#
# 与 CI 的关系：全部离线、零网络（除了首次 pnpm install），可直接作为 CI 的单一入口。

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

step() { printf '\n\033[1m== %s ==\033[0m\n' "$1"; }
ok()   { printf '   \033[32m✔\033[0m %s\n' "$1"; }

step "1/10 生成物漂移检测：重跑 gen_maps.py + gen_model.py，产物必须与提交版本一致"
python3 tools/gen_maps.py | sed 's/^/   /'
python3 tools/gen_model.py | sed 's/^/   /'
if ! git diff --quiet -- data/XHA_xinghai_t1.map.json harmony_app/entry/src/main/ets/model/AirportMap.ets; then
  echo "   ✘ 生成物与提交版本不一致（要么漏跑生成器，要么手改了生成物）："
  git diff --stat -- data/XHA_xinghai_t1.map.json harmony_app/entry/src/main/ets/model/AirportMap.ets | sed 's/^/     /'
  exit 1
fi
ok "地图数据链可复现，无漂移"

step "2/10 从 ArkTS 真源导出共享核心数据（地图 / 文案 / 标签 / 令牌 / 尺寸阶梯）"
python3 tools/export_shared.py | sed 's/^/   /'

step "3/10 ArkTS 寻路参考实现（Python 独立复算，500 组自测）"
python3 tools/pathfind_reference.py | tail -8 | sed 's/^/   /'

step "4/10 ArkTS 源码回归（Node 转译 .ets 后直接跑上游实现）"
node tools/verify_product.mjs | sed 's/^/   /'

step "5/10 TypeScript 类型检查（核心 + Web，strict）"
npx tsc --noEmit -p tsconfig.json | sed 's/^/   /'
ok "类型检查通过（0 error）"

step "6/10 共享核心回归（37 项：全量节点对 / 割点等价 / 渲染 / 状态机）"
npm test 2>&1 | grep -E "^ℹ (tests|pass|fail)" | sed 's/^/   /'

step "7/10 设计令牌一致性（6 项：三端同源 + 禁止硬编码）"
npm run test:tokens 2>&1 | tail -4 | sed 's/^/   /'

step "8/10 跨语言基准（824 条路线 + 664 条绘制命令）"
npm run fixtures 2>&1 | tail -3 | sed 's/^/   /'

step "9/10 Web：构建 + PWA 自检 + 端到端冒烟"
npm run web:build 2>&1 | tail -4 | sed 's/^/   /'
npm run test:web 2>&1 | tail -3 | sed 's/^/   /'

step "10/10 Apple（46 项）与微信小程序（9 项冒烟 + 5 项静态契约）"
npm run test:apple 2>&1 | grep -E "Executed [0-9]+ tests, with" | tail -1 | sed 's/^/   /'
npm run test:weapp 2>&1 | tail -3 | sed 's/^/   /'

printf '\n\033[1;32m全部通过 ✔\033[0m  真源 → 共享核心 → 三端客户端，一条链路验完\n'
