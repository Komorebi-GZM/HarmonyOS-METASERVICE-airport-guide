#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成元服务图标（星海机场 · 导航定位针）：
  app_icon.png 216x216（AppScope 应用图标，透明背景）
  icon.png     108x108（应用入口图标，透明背景）
  startIcon.png 216x216（启动窗图标，深色全底，防闪烁）
纯标准库（struct+zlib）写 PNG，不依赖第三方。
"""
import math
import os
import struct
import zlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MEDIA = os.path.join(ROOT, "harmony_app", "entry", "src", "main", "resources", "base", "media")
APPMEDIA = os.path.join(ROOT, "harmony_app", "AppScope", "resources", "base", "media")

# 配色（对齐 Theme：深青夜航底 + 导航蓝 pin + 白芯）
BG = (15, 31, 46, 255)        # #0F1F2E
PIN = (90, 156, 236, 255)     # #5A9CEC
CORE = (252, 252, 251, 255)   # #FCFCFB


def _chunk(typ: bytes, data: bytes) -> bytes:
    return (struct.pack(">I", len(data)) + typ + data
            + struct.pack(">I", zlib.crc32(typ + data) & 0xFFFFFFFF))


def png_bytes(size: int, opaque_bg: bool) -> bytes:
    rows = []
    cx = cy = size * 0.5
    r = size * 0.24            # pin 头半径
    tip_len = size * 0.22      # 尖端长度
    tip_x, tip_y = cx, cy + r + tip_len
    half_w = size * 0.06       # 尖端半宽
    core_r = r * 0.34          # 中心"当前位置"圆点
    for y in range(size):
        row = bytearray()
        for x in range(size):
            dx, dy = x - cx, y - cy
            d = math.hypot(dx, dy)
            col = None
            # 底：全底（仅启动图标）
            if opaque_bg:
                col = BG
            # pin 头（圆）
            if d <= r:
                col = PIN
            # 尖端（等腰三角：随 y 从 cy+r 收窄到 tip）
            if cy + r <= y <= tip_y:
                t = (y - (cy + r)) / tip_len
                if abs(x - tip_x) <= half_w * (1 - t):
                    col = PIN
            # 中心白芯（导航当前位置）
            if d <= core_r:
                col = CORE
            if col is None:
                row += b"\x00\x00\x00\x00"
            else:
                row += bytes(col)
        rows.append(row)
    raw = b"".join(b"\x00" + bytes(row) for row in rows)
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    return (b"\x89PNG\r\n\x1a\n" + _chunk(b"IHDR", ihdr)
            + _chunk(b"IDAT", zlib.compress(raw, 9)) + _chunk(b"IEND", b""))


def main():
    os.makedirs(MEDIA, exist_ok=True)
    os.makedirs(APPMEDIA, exist_ok=True)
    jobs = [
        (os.path.join(APPMEDIA, "app_icon.png"), 216, False),
        (os.path.join(MEDIA, "icon.png"), 108, False),
        (os.path.join(MEDIA, "startIcon.png"), 216, True),
    ]
    for path, size, opaque in jobs:
        with open(path, "wb") as f:
            f.write(png_bytes(size, opaque))
        print("icon:", os.path.relpath(path, ROOT), size, "x", size)


if __name__ == "__main__":
    main()