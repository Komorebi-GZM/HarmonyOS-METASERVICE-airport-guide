#!/usr/bin/env python3
"""Capture unmodified, full-resolution product screenshots from an installed emulator."""
from __future__ import annotations

import re
import time
from pathlib import Path

from PIL import Image

from verify_flows import FlowSmoke


ROOT = Path(__file__).resolve().parent.parent
TARGET = "127.0.0.1:5555"
OUT = ROOT / "docs" / "images" / "product-20261001" / "phone"
LAYOUTS = ROOT / ".temp" / "product-20261001" / "capture-layouts"


class ProductCapture(FlowSmoke):
    def __init__(self) -> None:
        super().__init__(TARGET, LAYOUTS, "zh")
        OUT.mkdir(parents=True, exist_ok=True)

    def capture(self, name: str, predicate, description: str):
        layout = self.wait_for(predicate, description)
        time.sleep(1.0)  # Let page transitions and Canvas redraws settle.
        layout, _ = self.dump("capture_" + name)
        if not predicate(layout):
            raise RuntimeError("截图前状态已改变：" + description)
        remote = "/data/local/tmp/xha_product_" + name + ".jpeg"
        local = OUT / (name + ".jpeg")
        self.run(["shell", "snapshot_display", "-f", remote])
        self.recv(remote, local)
        with Image.open(local) as image:
            if image.format != "JPEG" or image.size != (1320, 2848):
                raise RuntimeError(f"截图格式或分辨率不符：{local.name} {image.format} {image.size}")
        print("CAPTURE", local.name, flush=True)
        return layout

    def home_zh(self):
        layout = self.launch()
        return self.set_language(layout)

    def run_capture(self) -> None:
        layout = self.home_zh()
        layout = self.capture("01-home", self.has_id("home_search"), "中文空行程首页")

        self.click_id(layout, "home_search")
        layout = self.wait_for(self.has_id("place_search"), "目的地选择页")
        layout = self.choose_category(layout, "登机口")
        layout = self.click_place(layout, "xha_p4_gA101")
        layout = self.capture("02-destination-a101", lambda tree: self.is_enabled(self.find_id(tree, "primary_action"))
                              and "登机口A101" in self.all_text(tree), "已选 A101，键盘收起")

        self.click_id(layout, "primary_action")
        layout = self.wait_for(self.has_id("place_xha_p4_doorW"), "起点选择页")
        layout = self.click_place(layout, "xha_p4_doorW")
        layout = self.capture("03-start-west-departure", lambda tree: self.is_enabled(self.find_id(tree, "primary_action"))
                              and "西出发门" in self.all_text(tree), "已选西出发门")

        self.click_id(layout, "primary_action")
        layout = self.capture("04-security-route-preview", self.has_any_text("路线预览"), "含中央安检路线预览")
        if "中央安检" not in self.all_text(layout):
            raise RuntimeError("预览未显示中央安检提示")

        self.click_text(layout, "开始指引")
        layout = self.capture("05-guidance-next-step", lambda tree: "正在指引" in self.all_text(tree)
                              and "下一步" in self.all_text(tree), "当前步骤和下一步")
        for _ in range(8):
            if "已通过安检" in self.all_text(layout):
                break
            self.click_id(layout, "primary_action")
            layout = self.wait_for(self.has_any_text("正在指引"), "前进到安检步骤")
        layout = self.capture("06-security-confirmation", self.has_any_text("已通过安检"), "安检确认步骤")

        for _ in range(16):
            if "本次指引已完成" in self.all_text(layout):
                break
            self.click_id(layout, "primary_action")
            layout = self.wait_for(lambda tree: "正在指引" in self.all_text(tree)
                                   or "本次指引已完成" in self.all_text(tree), "逐步确认至完成")
        self.capture("07-completed", self.has_any_text("本次指引已完成"), "行程完成页")

        layout = self.home_zh()
        self.click_text(layout, "坐地铁")
        layout = self.capture("08-metro-directions", self.has_id("metro_xha_b2_platA"), "地铁方向选择页")
        self.click_id(layout, "metro_xha_b2_platA")
        layout = self.wait_for(self.has_id("place_xha_p4_doorW"), "地铁路线起点选择页")
        layout = self.click_place(layout, "xha_p4_doorW")
        self.click_id(layout, "primary_action")
        layout = self.wait_for(self.has_any_text("路线预览"), "地铁跨层路线预览")
        self.click_id(layout, "preference_1")  # Prefer the lift for the transfer image.
        layout = self.capture("09-metro-cross-floor-preview", self.has_any_text("路线预览"), "优先电梯的地铁跨层预览")

        self.click_text(layout, "开始指引")
        layout = self.wait_for(self.has_any_text("正在指引"), "地铁路线开始指引")
        for _ in range(12):
            if "已到达下一层" in self.all_text(layout) and "电梯" in self.all_text(layout):
                break
            self.click_id(layout, "primary_action")
            layout = self.wait_for(lambda tree: "正在指引" in self.all_text(tree)
                                   or "本次指引已完成" in self.all_text(tree), "前进到电梯换层")
        self.capture("10-elevator-transfer", lambda tree: "已到达下一层" in self.all_text(tree)
                     and "电梯" in self.all_text(tree), "电梯换层确认")

        layout = self.home_zh()
        layout = self.scroll_to_id(layout, "floor_4F", toward_bottom=True)
        self.click_id(layout, "floor_4F")
        layout = self.wait_for(self.has_id("map_fit_floor"), "4F 全层地图")
        self.click_id(layout, "map_fit_floor")
        self.capture("11-floor-4f-map", self.has_id("floor_canvas"), "4F 全层地图")


def main() -> None:
    capture = ProductCapture()
    try:
        capture.run_capture()
    finally:
        try:
            capture.home_zh()  # Leave the user's emulator on the Chinese home page.
        except Exception as exc:
            print("首页恢复失败：", exc, flush=True)


if __name__ == "__main__":
    main()
