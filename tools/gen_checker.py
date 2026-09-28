#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把 data/*.map.json 注入 tools/checker.html，双击即可离线打开对照校准页。
用法：python3 tools/gen_checker.py
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "data")
HTML_TEMPLATE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "checker.html")
TOKEN = "/*__AIRPORTS_JSON__*/"

def main():
    airports = {}
    for fn in sorted(os.listdir(DATA_DIR)):
        if fn.endswith(".map.json"):
            with open(os.path.join(DATA_DIR, fn), encoding="utf-8") as f:
                m = json.load(f)
            airports[m["meta"]["airport"]] = m
    with open(HTML_TEMPLATE, encoding="utf-8") as f:
        html = f.read()
    assert TOKEN in html, "checker.html 缺失注入占位符"
    inject = "window.AIRPORTS = " + json.dumps(airports, ensure_ascii=False, separators=(",", ":")) + ";"
    html = html.replace(TOKEN, inject, 1)
    with open(HTML_TEMPLATE, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"已注入 {list(airports)} 到 {HTML_TEMPLATE}")

if __name__ == "__main__":
    main()