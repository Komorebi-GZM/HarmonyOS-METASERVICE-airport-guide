#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
寻路引擎参照实现 + 自测（开发文档 §4.5）

与 harmony_app/.../core/Pathfinder.ets 使用同一套权重与拆分逻辑：
  1. 异侧(陆↔空)：拆「起→安检 + 安检→终」两段（安检为唯一割点）
  2. 同侧 / 起点终点在安检：全图 Dijkstra 单段
  3. 垂直边权重 = 基准(30/40/25) × 偏好乘子；walk 边用原始米权

自测：
  A. 500 随机起点对（含全部异侧组合）必然可达
  B. 异侧 route 必经安检，且与「全图 Dijkstra」逐节点等价（割点拆分的正确性）
  C. 同侧 route 绝不经过安检
  D. 逐层 legs 内只含同层节点；跨层边类型 ∈ {elevator, escalator, stair}；
     transitions 的 viaName 即换层设施
  E. 相邻节点必须是图内一条边且权重生效 = totalMeters

用法: python3 tools/pathfind_reference.py
"""
import json
import random
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "data", "XHA_xinghai_t1.map.json")

PREF_SHORTEST = 0
PREF_MULT = [
    {"elevator": 1.0, "escalator": 1.0, "stair": 1.0},
    {"elevator": 0.7, "escalator": 1.6, "stair": 3.2},
    {"elevator": 1.3, "escalator": 0.8, "stair": 2.2},
    {"elevator": 1.0, "escalator": 1.4, "stair": 6.0},
]
VW = {"elevator": 30, "escalator": 40, "stair": 25}


def load():
    m = json.load(open(SRC, encoding="utf-8"))
    nodes = {n["id"]: n for n in m["nodes"]}
    edges = [(e["from"], e["to"], e["type"], e["weight"]) for e in m["edges"]]
    adj = {i: {} for i in nodes}
    etype = {}
    for a, b, t, w in edges:
        adj[a][b] = w
        adj[b][a] = w
        for x, y in ((a, b), (b, a)):
            k = (x, y) if x < y else (y, x)
            etype[k] = t
    sec = [n for n in m["nodes"] if n["type"] == "security"][0]["id"]
    return m, nodes, adj, etype, sec


def dijkstra(nodes, adj, etype, pref, src, dst):
    """返回 (dist, prev) 或路径；顶点集合小，朴素 O(V^2) 即可"""
    INF = float("inf")
    dist = {i: INF for i in nodes}
    prev = {i: None for i in nodes}
    dist[src] = 0
    vset = set(nodes)
    mult = PREF_MULT[pref]

    def w(a, b):
        t = etype[minmax(a, b)]
        r = adj[a][b]
        if t == "walk":
            return r
        return round(VW[t] * mult[t])

    while vset:
        u = min(vset, key=lambda x: dist[x])
        vset.remove(u)
        if u == dst:
            break
        if dist[u] == INF:
            break
        for v in adj[u]:
            nd = dist[u] + w(u, v)
            if nd < dist[v]:
                dist[v] = nd
                prev[v] = u
    # 回溯
    if prev[dst] is None and src != dst:
        return None
    path = []
    cur = dst
    while cur is not None:
        path.append(cur)
        cur = prev[cur]
    path.reverse()
    return path


def minmax(a, b):
    return (a, b) if a < b else (b, a)


def plan(nodes, adj, etype, sec, pref, start, end):
    """与 Pathfinder.ets planRoute 一一对应"""
    s, e = nodes[start], nodes[end]
    if start == sec or end == sec:
        return dijkstra(nodes, adj, etype, pref, start, end), (start == sec or end == sec)
    if s["side"] == e["side"]:
        return dijkstra(nodes, adj, etype, pref, start, end), False
    p1 = dijkstra(nodes, adj, etype, pref, start, sec)
    p2 = dijkstra(nodes, adj, etype, pref, sec, end)
    if p1 is None or p2 is None:
        return None, True
    return p1 + p2[1:], True


def main():
    random.seed(20260914)
    m, nodes, adj, etype, sec = load()
    # 与 gen_model.py 相同的陆/空侧判定：从第一个入口 BFS（跳过安检）
    anchor = next(n["id"] for n in m["nodes"] if n["type"] == "entrance")
    seen, stack = {anchor}, [anchor]
    while stack:
        u = stack.pop()
        for v in adj[u]:
            if v == sec or v in seen:
                continue
            seen.add(v)
            stack.append(v)
    for i in nodes:
        nodes[i]["side"] = "gate" if i == sec else ("land" if i in seen else "air")
    ids = list(nodes)
    land = [i for i in ids if nodes[i]["side"] == "land"]
    air = [i for i in ids if nodes[i]["side"] == "air"]
    print(f"节点 {len(ids)}（land {len(land)} / air {len(air)} / gate 1）| 阈值安检={sec}")

    checks = ["A reachable", "B cross==full", "C same no-sec", "D legs/trans", "E edges"]
    count = {c: 0 for c in checks}

    def w_eff(a, b, pref):
        t = etype[minmax(a, b)]
        r = adj[a][b]
        return r if t == "walk" else round(VW[t] * PREF_MULT[pref][t])

    for k in range(500):
        pref = k % 4
        start = random.choice(ids)
        end = random.choice(ids)
        if start == end:
            end = air[0] if start in land else land[0]

        path, via_sec = plan(nodes, adj, etype, sec, pref, start, end)
        assert path is not None, f"[{k}] {start}->{end} 不可达"
        count["A reachable"] += 1

        if via_sec:
            # B: 割点拆分 == 全图 Dijkstra
            full = dijkstra(nodes, adj, etype, pref, start, end)
            assert full == path, f"[{k}] 拆分 {path} != 全图 {full}"
            assert sec in path, f"[{k}] 异侧路线竟然绕过安检"
            count["B cross==full"] += 1
        else:
            assert sec not in path, f"[{k}] 同侧路线竟含安检"
            count["C same no-sec"] += 1

        # D: legs / transitions / total 回推
        floor = [nodes[i]["floor"] for i in path]
        total = 0
        legs, trans = [], []
        curf, ids2, legm = floor[0], [path[0]], 0
        for a, b in zip(path, path[1:]):
            w = w_eff(a, b, pref)
            total += w
            assert etype[minmax(a, b)] is not None, f"[{k}] {a}-{b} 无边"
            if nodes[b]["floor"] != curf:
                legs.append((curf, ids2, legm))
                t = etype[minmax(a, b)]
                assert t in ("elevator", "escalator", "stair"), f"[{k}] 跨层边类型={t}"
                trans.append((a, b, t, nodes[a]["name"], curf, nodes[b]["floor"], w))
                curf, ids2, legm = nodes[b]["floor"], [b], 0
            else:
                legm += w
                ids2.append(b)
        legs.append((curf, ids2, legm))
        assert total > 0, f"[{k}] total=0"
        assert len(trans) == sum(1 for a, b in zip(path, path[1:]) if nodes[a]["floor"] != nodes[b]["floor"])
        assert all(len(ids2) >= 1 for _, ids2, _ in legs)
        count["D legs/trans"] += 1

        # E: 逐对权重求和 == total
        s2 = sum(w_eff(a, b, pref) for a, b in zip(path, path[1:]))
        assert s2 == total, f"[{k}] 权重累加 {s2} != total {total}"
        count["E edges"] += 1

    print("自测通过 ✔")
    for c in checks:
        print(f"  {c:18s} {count[c]}")

    # 有趣基准样例，打印给人看
    samples = [
        ("xha_p4_doorW", "xha_p4_gC308", "出发门→远端登机口(异侧↔空)"),
        ("xha_p4_doorE", "xha_p3_loungeA", "出发门→贵宾休息室(跨2层)"),
        ("xha_p1_taxi", "xha_p4_gA101", "出租车→登机口(跨3层)"),
        ("xha_b2_platA", "xha_p4_airMall", "地铁站台→免税区(跨4层)"),
        ("xha_p2_bagA", "xha_p4_doorW", "行李→出发门(同侧)"),
        ("xha_b1_gtc", "xha_b2_platB", "交通中心→地铁(同侧地下)"),
    ]
    print("\n样例路线（偏好=最短）：")
    for a, b, note in samples:
        p, via = plan(nodes, adj, etype, sec, PREF_SHORTEST, a, b)
        meters = sum(w_eff(x, y, PREF_SHORTEST) for x, y in zip(p, p[1:]))
        sec_badge = " [必经安检]" if via else ""
        print(f"  {note}{sec_badge}  {meters} m  {len(p)} 节点  {p[0]} → {p[-1]}")


if __name__ == "__main__":
    main()