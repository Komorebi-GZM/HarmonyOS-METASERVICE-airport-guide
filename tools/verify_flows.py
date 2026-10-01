#!/usr/bin/env python3
"""Extended, evidence-producing UI flows for an already running HarmonyOS target.

This deliberately reuses EmulatorSmoke's hdc/layout helpers. It never installs
the HAP and never starts, stops, or otherwise manages an emulator process.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from pathlib import Path
from typing import Any, Callable

TOOLS = Path(__file__).resolve().parent
ROOT = TOOLS.parent
sys.path.insert(0, str(TOOLS))
from smoke_emulator import (  # noqa: E402
    EmulatorSmoke, SmokeFailure, bounds_center, node_id, node_text, walk_nodes,
)

MAP_DATA = ROOT / "data" / "XHA_xinghai_t1.map.json"
MAP_MODEL = ROOT / "harmony_app" / "entry" / "src" / "main" / "ets" / "model" / "AirportMap.ets"
FLOORS = ("4F", "3F", "2F", "1F", "B1", "B2")
DENSITY_PX_PER_VP = 3.5  # 560 dpi on the authorized API 24 test target.
LABELS = {
    "zh": {
        "gate_entry": "去登机口", "service_entry": "找设施", "metro_entry": "坐地铁",
        "gate_category": "登机口", "services_category": "商业·服务",
        "metro_city": "往市区", "metro_resort": "往星湖度假区",
        "route_options": "路线偏好", "next_step": "下一步",
        "preview": "路线预览", "guiding": "正在指引", "same": "起点和目的地相同",
        "choose_again": "重新选择地点", "begin": "开始指引", "all_steps": "查看全程步骤",
        "return_current": "回到当前步骤",
        "previous": "上一步", "start_here": "我在这里", "start_set": "已选择出发位置",
        "choose_next": "接下来选择目的地", "target_placeholder": "请选择目的地",
        "apply": "更新路线", "new_journey": "规划新的路线", "completed": "本次指引已完成",
        "choose_target": "请选择目的地", "doorw": "西出发门",
    },
    "en": {
        "gate_entry": "Find a gate", "service_entry": "Find facilities", "metro_entry": "Take the metro",
        "gate_category": "Gates", "services_category": "Services",
        "metro_city": "To the city", "metro_resort": "To Xinghu Resort",
        "route_options": "Route preference", "next_step": "Next",
        "preview": "Route preview", "guiding": "Route guidance", "same": "Starting point and destination are the same",
        "choose_again": "Choose places again", "begin": "Start guidance", "all_steps": "All route steps",
        "return_current": "Return to current step",
        "previous": "Previous step", "start_here": "I am here", "start_set": "Starting point selected",
        "choose_next": "Now choose a destination", "target_placeholder": "Choose a destination",
        "apply": "Update route", "new_journey": "Plan another route", "completed": "Guidance completed",
        "choose_target": "Choose a destination",
    },
}


def rect(attrs: dict[str, Any]) -> tuple[float, float, float, float] | None:
    value = next((attrs.get(k) for k in ("bounds", "bound", "rect", "frame") if attrs.get(k) is not None), None)
    if isinstance(value, dict):
        vals = (value.get("left", value.get("x", value.get("x1"))),
                value.get("top", value.get("y", value.get("y1"))),
                value.get("right", value.get("x2")), value.get("bottom", value.get("y2")))
    elif isinstance(value, (list, tuple)) and len(value) >= 4:
        vals = value[:4]
    elif value is not None:
        nums = re.findall(r"-?\d+(?:\.\d+)?", str(value))
        if len(nums) < 4:
            return None
        vals = nums[:4]
    else:
        return None
    try:
        left, top, right, bottom = map(float, vals)
        return left, top, right, bottom
    except (TypeError, ValueError):
        return None


class FlowSmoke(EmulatorSmoke):
    def __init__(self, target: str, out_dir: Path, language: str) -> None:
        super().__init__(target, out_dir, language)
        self.labels = LABELS[language]
        self.failures: list[dict[str, str]] = []
        self.steps: list[dict[str, str]] = []
        self.nodes, self.names_en, self.bboxes, self.insets = self.load_source_map()

    @staticmethod
    def load_source_map() -> tuple[dict[str, dict[str, Any]], dict[str, str], dict[str, list[float]], tuple[tuple[int, ...], tuple[int, ...]]]:
        data = json.loads(MAP_DATA.read_text(encoding="utf-8"))
        nodes = {str(n["id"]): n for n in data["nodes"]}
        model = MAP_MODEL.read_text(encoding="utf-8")
        pattern = re.compile(r'FLOOR_BBOX\.set\("([^"]+)",\s*\[\s*(-?[\d.]+),\s*(-?[\d.]+),\s*(-?[\d.]+),\s*(-?[\d.]+)\s*\]\)')
        boxes = {m.group(1): [float(m.group(i)) for i in range(2, 6)] for m in pattern.finditer(model)}
        names_en = {m.group(1): m.group(2) for m in re.finditer(r'NODE_EN\.set\("([^"]+)",\s*"((?:[^"\\]|\\.)*)"\)', model)}
        fit_calls = [tuple(int(m.group(i)) for i in range(1, 5)) for m in re.finditer(
            r'this\.view\.fitInsets\(bb,\s*this\.canvasW\(\),\s*this\.canvasH\(\),\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)',
            (ROOT / "harmony_app" / "entry" / "src" / "main" / "ets" / "ui" / "FloorCanvas.ets").read_text(encoding="utf-8"))]
        if not nodes or not all(f in boxes for f in FLOORS):
            raise SmokeFailure("机场地图源数据或楼层边界读取失败")
        if len(fit_calls) < 2:
            raise SmokeFailure("FloorCanvas fitInsets 源码配置不可解析")
        # Source order is route fit, then full-floor fit in FloorCanvas.fit.
        return nodes, names_en, boxes, (fit_calls[0], fit_calls[1])

    def place_name(self, place_id: str) -> str:
        node = self.nodes.get(place_id)
        if node is None:
            raise SmokeFailure(f"地图源数据中没有节点 {place_id}")
        return self.names_en.get(place_id, str(node["name"])) if self.language == "en" else str(node["name"])

    def has_text(self, layout: Any, text: str) -> bool:
        return text in self.all_text(layout)

    def stable(self, name: str, predicate: Callable[[Any], bool], description: str,
               *, screenshot: bool = True) -> Any:
        self.last_stage = name
        layout = self.wait_for(predicate, description)
        image = ""
        if screenshot:
            layout, text = self.evidence(name)
            if not predicate(layout):
                raise SmokeFailure(f"截图时布局状态改变：{description}")
            image = str(self.out_dir / f"{self.counter:02d}_{name}.jpeg")
        else:
            text = self.all_text(layout)
        json_path = self.out_dir / f"{self.counter:02d}_{name}.json"
        self.steps.append({"name": name, "layout": str(json_path), "screenshot": image,
                           "assertion": description})
        self.passed.append(name)
        return layout

    def has_id(self, wanted: str) -> Callable[[Any], bool]:
        return lambda tree: self.find_id(tree, wanted) is not None

    def has_any_text(self, *values: str) -> Callable[[Any], bool]:
        return lambda tree: any(v in self.all_text(tree) for v in values)

    def click_and_wait(self, layout: Any, action: Callable[[Any], None], name: str,
                       predicate: Callable[[Any], bool], description: str,
                       *, screenshot: bool = True) -> Any:
        self.last_stage = name
        action(layout)
        return self.stable(name, predicate, description, screenshot=screenshot)

    def click_place(self, layout: Any, place_id: str) -> Any:
        wanted = "place_" + place_id
        if self.find_id(layout, wanted) is None:
            field = self.find_id(layout, "place_search")
            if field is None:
                raise SmokeFailure(f"选择地点时找不到 {wanted} 或 place_search")
            self.click_id(layout, "place_search")
            self.input_text(self.place_name(place_id))
            layout = self.wait_for(self.has_id(wanted), f"搜索结果出现 {wanted}")
        self.click_id(layout, wanted)
        return self.wait_for(lambda tree: self.is_enabled(self.find_id(tree, "primary_action")),
                             f"选择地点 {place_id} 后主操作可用")

    def choose_category(self, layout: Any, category: str) -> Any:
        self.click_text(layout, category)
        return self.wait_for(self.has_id("place_list"), f"地点分类 {category} 已显示结果")

    def confirm_picker(self, layout: Any, name: str) -> Any:
        self.click_id(layout, "primary_action")
        return self.stable(name, self.has_id("primary_action"), "选择器确认后的下一页出现")

    def route_preview(self, layout: Any, name: str) -> Any:
        return self.stable(name, self.has_any_text(self.labels["preview"]), "路线预览标题出现")

    def open_home_entry(self, text: str, name: str) -> Any:
        layout = self.launch()
        layout = self.set_language(layout)
        if self.language == "en" and not self.has_text(layout, "Where would you like to go?"):
            raise SmokeFailure("应用没有切换为英文")
        if self.language == "zh" and not self.has_text(layout, "你想去哪里？"):
            raise SmokeFailure("应用没有切换为中文")
        self.stable(name + "_home", self.has_id("home_search"), "首页与语言设置稳定")
        self.click_text(layout, text)
        return self.stable(name + "_entry", self.has_id("place_search") if text == self.labels["gate_entry"] or text == self.labels["service_entry"] else self.has_id("metro_xha_b2_platA"),
                           "首页入口打开对应选择页")

    def gate_entry_to_preview(self) -> None:
        layout = self.open_home_entry(self.labels["gate_entry"], "home_gate")
        layout = self.click_place(layout, "xha_p4_gA101")
        self.click_id(layout, "primary_action")
        layout = self.wait_for(self.has_id("place_xha_p4_doorW"), "出发点列表出现")
        layout = self.click_place(layout, "xha_p4_doorW")
        self.click_id(layout, "primary_action")
        layout = self.route_preview(layout, "gate_route_preview")
        if not self.has_text(layout, self.place_name("xha_p4_gA101")):
            raise SmokeFailure("登机口入口路线预览没有 A101 目的地")

    def service_same_place_recovery(self) -> None:
        layout = self.open_home_entry(self.labels["service_entry"], "home_service")
        layout = self.click_place(layout, "xha_p4_rest")
        self.click_id(layout, "primary_action")
        layout = self.wait_for(self.has_id("place_xha_p4_doorW"), "设施路线的起点列表出现")
        layout = self.click_place(layout, "xha_p4_doorW")
        self.click_id(layout, "primary_action")
        layout = self.route_preview(layout, "same_floor_facility_preview")
        if not self.has_text(layout, self.place_name("xha_p4_rest")):
            # The destination row names the restroom; verify it through the
            # source-model name in the active language where available.
            expected = self.place_name("xha_p4_rest")
            if expected not in self.all_text(layout):
                raise SmokeFailure("设施同层路线预览没有显示选定的卫生间")
        self.click_id(layout, "edit_start")
        layout = self.wait_for(self.has_id("place_search"), "编辑起点选择页出现")
        layout = self.click_place(layout, "xha_p4_rest")
        self.click_id(layout, "primary_action")
        layout = self.stable("same_endpoint_error", self.has_any_text(self.labels["same"]), "相同起终点显示友好错误")
        self.click_text(layout, self.labels["choose_again"])
        layout = self.wait_for(self.has_id("place_search"), "错误恢复后重新选择地点")
        layout = self.click_place(layout, "xha_p4_rest")
        self.click_id(layout, "primary_action")
        layout = self.wait_for(self.has_id("place_xha_p4_doorW"), "恢复路线起点选择页出现")
        layout = self.click_place(layout, "xha_p4_doorW")
        self.click_id(layout, "primary_action")
        self.route_preview(layout, "same_endpoint_recovered")

    def metro_direction(self, place_id: str, direction: str, name: str) -> Any:
        layout = self.open_home_entry(self.labels["metro_entry"], name)
        self.click_id(layout, "metro_" + place_id)
        layout = self.wait_for(self.has_id("place_xha_p4_doorW"), f"{direction} 方向进入起点选择")
        layout = self.click_place(layout, "xha_p4_doorW")
        self.click_id(layout, "primary_action")
        return self.route_preview(layout, name + "_preview")

    @staticmethod
    def step_number(layout: Any) -> tuple[int, int] | None:
        match = re.search(r"(?:Step|步骤)\s*(\d+)\s*/\s*(\d+)", EmulatorSmoke.all_text(layout), re.I)
        return (int(match.group(1)), int(match.group(2))) if match else None

    def advanced_guidance_and_state(self) -> None:
        layout = self.metro_direction("xha_b2_platB", self.labels["metro_resort"], "cross_floor_route")
        self.click_text(layout, self.labels["begin"])
        layout = self.stable("guidance_started", self.has_any_text(self.labels["guiding"]), "路线进入指引")
        initial = self.step_number(layout)
        if initial is None or initial[0] != 1:
            raise SmokeFailure(f"指引未从第 1 步开始：{initial}")
        active_legs = [int(match.group(1)) for _, a in walk_nodes(layout)
                       if (match := re.match(r"route_leg_(\d+)$", node_id(a)))]
        if len(active_legs) < 2:
            raise SmokeFailure("跨层路线没有足够的 route_leg 楼层标签")
        # Switch the displayed floor while preserving the active guidance step.
        other_leg = next((i for i in active_legs if i != 0), None)
        if other_leg is None:
            raise SmokeFailure("没有可查看的其他路线楼层")
        layout = self.click_and_wait(layout, lambda tree: self.click_id(tree, f"route_leg_{other_leg}"),
                                     "guidance_other_route_leg", self.has_any_text(self.labels["return_current"]),
                                     "查看其他路线楼层时步骤继续进行")
        if self.step_number(layout) != initial:
            raise SmokeFailure("查看其他 route_leg 改变了当前指引步骤")
        self.click_text(layout, self.labels["return_current"])
        layout = self.stable("guidance_return_current", self.has_id("previous_step"), "回到当前指引楼层")
        if self.step_number(layout) != initial:
            raise SmokeFailure("返回当前楼层时指引步骤发生改变")
        self.click_id(layout, "all_route_steps")
        layout = self.stable("guidance_all_steps_open", self.has_any_text(self.labels["all_steps"]), "全程步骤面板展开")
        self.run(["shell", "uitest", "uiInput", "keyEvent", "2"])
        layout = self.stable("guidance_all_steps_closed", self.has_id("all_route_steps"), "关闭全程步骤面板并返回指引")
        if self.step_number(layout) != initial:
            raise SmokeFailure("展开/关闭全程步骤改变了进度")
        self.click_id(layout, "primary_action")
        expected = initial[0] + 1
        layout = self.stable("guidance_advanced", lambda tree: self.step_number(tree) is not None and self.step_number(tree)[0] == expected,
                             "确认当前步骤后进度前进")
        self.click_id(layout, "previous_step")
        layout = self.stable("guidance_previous", lambda tree: self.step_number(tree) == initial,
                             "上一步返回原进度")
        self.click_id(layout, "edit_start")
        layout = self.wait_for(self.has_id("place_search"), "编辑起点页面出现")
        self.run(["shell", "uitest", "uiInput", "keyEvent", "2"])
        layout = self.stable("edit_cancel_keeps_progress", self.has_id("previous_step"), "取消编辑返回路线指引")
        if self.step_number(layout) != initial:
            raise SmokeFailure("取消修改起点丢失了指引进度")
        self.click_id(layout, "edit_start")
        layout = self.wait_for(self.has_id("place_search"), "再次打开起点编辑页")
        layout = self.click_place(layout, "xha_p4_doorE")
        self.click_id(layout, "primary_action")
        layout = self.route_preview(layout, "edit_confirm_resets_preview")
        if self.find_id(layout, "previous_step") is not None:
            raise SmokeFailure("确认修改端点后仍处于路线指引")
        self.click_id(layout, "preference_1")
        layout = self.route_preview(layout, "preference_keeps_preview")
        if self.find_id(layout, "previous_step") is not None:
            raise SmokeFailure("路线偏好操作后没有停留在预览")
        self.click_text(layout, self.labels["begin"])
        layout = self.stable("guidance_restarted", self.has_any_text(self.labels["guiding"]), "修改后的路线可以重新指引")
        if self.step_number(layout) is None or self.step_number(layout)[0] != 1:
            raise SmokeFailure("偏好预览重新开始后没有从第 1 步开始")
        if self.labels["next_step"] not in self.all_text(layout):
            raise SmokeFailure("路线指引没有显示下一步提示")
        self.click_id(layout, "route_preferences")
        layout = self.stable("guidance_preferences_open", self.has_id("preference_1"), "指引中的路线偏好菜单展开")
        self.click_id(layout, "preference_1")
        layout = self.route_preview(layout, "guidance_preference_replans_preview")
        if self.find_id(layout, "previous_step") is not None:
            raise SmokeFailure("指引中调整偏好后未回到预览")
        self.click_text(layout, self.labels["begin"])
        layout = self.stable("guidance_after_preference", self.has_any_text(self.labels["guiding"]), "调整偏好后可以重新开始指引")
        if self.step_number(layout) is None or self.step_number(layout)[0] != 1:
            raise SmokeFailure("指引中调整偏好后没有重置到第 1 步")
        self.click_id(layout, "primary_action")
        layout = self.stable("guidance_progress_before_swap", lambda tree: self.step_number(tree) is not None and self.step_number(tree)[0] == 2,
                             "交换前已有指引进度")
        self.click_id(layout, "reverse_route")
        layout = self.route_preview(layout, "swap_resets_preview")
        if self.find_id(layout, "previous_step") is not None:
            raise SmokeFailure("交换起终点后仍处于路线指引")
        # Finish every manual step so that the new-journey action is exercised.
        for _ in range(30):
            if self.has_text(layout, self.labels["completed"]):
                break
            if self.find_id(layout, "primary_action") is not None and self.has_text(layout, self.labels["begin"]):
                self.click_text(layout, self.labels["begin"])
                layout = self.wait_for(self.has_any_text(self.labels["guiding"]), "交换路线开始指引")
            else:
                current = self.step_number(layout)
                if current is None:
                    raise SmokeFailure("路线完成循环中找不到当前步骤")
                self.click_id(layout, "primary_action")
                layout = self.wait_for(lambda tree: self.has_text(tree, self.labels["completed"]) or
                                       (self.step_number(tree) is not None and self.step_number(tree)[0] == current[0] + 1),
                                       "路线前进一步或完成")
        if not self.has_text(layout, self.labels["completed"]):
            raise SmokeFailure("完成路线的步骤数超过上限")
        layout = self.stable("guidance_completed", self.has_any_text(self.labels["completed"]), "最终确认后显示完成状态")
        self.click_text(layout, self.labels["new_journey"])
        layout = self.stable("new_journey_empty", self.has_id("primary_action"), "新行程进入空目的地选择")
        if self.is_enabled(self.find_id(layout, "primary_action")):
            raise SmokeFailure("新行程预填了目的地，确认按钮应禁用")
        if not self.has_text(layout, self.labels["choose_target"]):
            raise SmokeFailure("新行程没有显示空目的地提示")

    def home_floor_scroll(self) -> None:
        layout = self.launch()
        layout = self.set_language(layout)
        self.stable("home_floor_top", self.has_id("home_search"), "首页滚动视图稳定")
        visible: set[str] = set()
        for _ in range(9):
            for floor in FLOORS:
                if floor not in visible and self.floor_on_screen(layout, floor):
                    layout = self.stable("floor_tile_" + floor, lambda tree, f=floor: self.floor_on_screen(tree, f),
                                         f"楼层入口 {floor} 已滚动到屏幕可见范围")
                    visible.add(floor)
            if len(visible) == len(FLOORS):
                break
            # A device-size-relative swipe moves the real page scroll view.
            screen = self.screen_rect(layout)
            screen = screen or (0, 0, 540, 960)
            width = screen[2] - screen[0]; height = screen[3] - screen[1]
            x = round(screen[0] + width / 2); self.run(["shell", "uitest", "uiInput", "swipe", str(x), str(round(screen[1] + height * .82)), str(x), str(round(screen[1] + height * .30)), "450"])
            time.sleep(0.4)
            layout, _ = self.dump("home_floor_scroll")
        if len(visible) != len(FLOORS):
            raise SmokeFailure(f"首页滚动未让六个楼层入口均进入布局可视范围：{sorted(visible)}")
        self.stable("home_six_floors_visible", lambda tree: len(visible) == len(FLOORS) and
                    any(attrs.get("pagePath") == "pages/Index" for _, attrs in walk_nodes(tree)),
                    "滚动后六层入口都可定位")

    def floor_on_screen(self, layout: Any, floor: str) -> bool:
        found = self.find_id(layout, "floor_" + floor)
        bounds = rect(found[1]) if found else None
        screen = self.screen_rect(layout)
        if not bounds or not screen:
            return False
        center = ((bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2)
        return screen[0] <= center[0] <= screen[2] and screen[1] <= center[1] <= screen[3]

    def scroll_to_id(self, layout: Any, wanted: str, *, toward_bottom: bool) -> Any:
        for _ in range(12):
            found = self.find_id(layout, wanted)
            bounds = rect(found[1]) if found else None
            screen = self.screen_rect(layout)
            if bounds and screen and screen[0] <= (bounds[0] + bounds[2]) / 2 <= screen[2] and screen[1] <= (bounds[1] + bounds[3]) / 2 <= screen[3]:
                return layout
            screen = screen or (0, 0, 1320, 2856)
            width = screen[2] - screen[0]; height = screen[3] - screen[1]
            x = round(screen[0] + width / 2)
            if toward_bottom:
                y1, y2 = round(screen[1] + height * .82), round(screen[1] + height * .30)
            else:
                y1, y2 = round(screen[1] + height * .28), round(screen[1] + height * .82)
            self.run(["shell", "uitest", "uiInput", "swipe", str(x), str(y1), str(x), str(y2), "450"])
            time.sleep(.4)
            layout, _ = self.dump("scroll_to_" + wanted)
        raise SmokeFailure(f"滚动后仍无法让控件进入屏幕：{wanted}")

    @staticmethod
    def screen_rect(layout: Any) -> tuple[float, float, float, float] | None:
        candidates = [rect(attrs) for _, attrs in walk_nodes(layout)]
        candidates = [b for b in candidates if b and b[2] > b[0] and b[3] > b[1]]
        return max(candidates, key=lambda b: (b[2] - b[0]) * (b[3] - b[1])) if candidates else None

    def map_canvas_click(self, layout: Any, node_id_value: str) -> tuple[Any, tuple[int, int]]:
        canvas = self.find_id(layout, "floor_canvas")
        if canvas is None:
            raise SmokeFailure("楼层地图没有 floor_canvas")
        bounds = rect(canvas[1])
        node = self.nodes.get(node_id_value)
        if bounds is None or node is None:
            raise SmokeFailure(f"缺少画布边界或地图源节点：{node_id_value}")
        left, top, right, bottom = bounds
        floor = str(node["floor"]); x0, y0, x1, y1 = self.bboxes[floor]
        # Inspector bounds and hdc click coordinates use physical pixels; the
        # Canvas viewport is measured in vp by onAreaChange/canvasFont.
        width = (right - left) / DENSITY_PX_PER_VP
        height = (bottom - top) / DENSITY_PX_PER_VP
        bw, bh = max(1, x1 - x0), max(1, y1 - y0)
        pad_l, pad_t, pad_r, pad_b = self.insets[1]
        inner_w = max(1, width - pad_l - pad_r); inner_h = max(1, height - pad_t - pad_b)
        zoom = max(.05, min(inner_w / bw, inner_h / bh))
        tx = pad_l + (inner_w - bw * zoom) / 2 - x0 * zoom
        ty = pad_t + (inner_h - bh * zoom) / 2 - y0 * zoom
        point = (round(left + (tx + float(node["x"]) * zoom) * DENSITY_PX_PER_VP),
                 round(top + (ty + float(node["y"]) * zoom) * DENSITY_PX_PER_VP))
        self.run(["shell", "uitest", "uiInput", "click", str(point[0]), str(point[1])])
        return node, point

    def map_start_feedback_to_route(self) -> None:
        layout = self.launch()
        layout = self.set_language(layout)
        layout = self.scroll_to_id(layout, "floor_4F", toward_bottom=True)
        self.click_id(layout, "floor_4F")
        layout = self.stable("browse_floor_4f", self.has_id("floor_canvas"), "首页 4F 入口打开地图")
        layout = self.click_and_wait(layout, lambda tree: self.click_id(tree, "map_zoom_in"), "map_zoom", self.has_id("floor_canvas"), "地图放大后仍可见画布")
        layout = self.click_and_wait(layout, lambda tree: self.click_id(tree, "map_fit_floor"), "map_fit_floor", self.has_id("map_fit_floor"), "全层按钮可见且地图已适配")
        # Start from a real data node using AirportMap coordinates and the
        # current canvas bounds; no app state is mocked or injected.
        self.map_canvas_click(layout, "xha_p4_doorW")
        layout = self.stable("map_node_detail", self.has_any_text(self.place_name("xha_p4_doorW")), "点击地图节点打开地点详情")
        self.click_text(layout, self.labels["start_here"])
        layout = self.stable("map_start_feedback", self.has_any_text(self.labels["start_set"]), "设为起点后显示反馈")
        self.click_text(layout, self.labels["choose_next"])
        layout = self.wait_for(self.has_id("place_search"), "从起点反馈进入目的地选择")
        layout = self.choose_category(layout, self.labels["gate_category"])
        layout = self.click_place(layout, "xha_p4_gA101")
        self.click_id(layout, "primary_action")
        self.route_preview(layout, "map_start_then_destination_preview")

    def write_report(self, ok: bool, error: str = "", *, scope: str = "full") -> Path:
        report = {
            "ok": ok, "target": self.target, "language": self.language,
            "scope": scope,
            "passed": self.passed, "steps": self.steps,
            "failures": self.failures,
            "sourceMap": str(MAP_DATA), "finishedAt": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        }
        filename = "verify_flows_report.json" if scope == "full" else f"verify_flows_{scope}_report.json"
        path = self.out_dir / filename
        path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
        return path

    def execute(self, *, scope: str = "full") -> int:
        error = ""
        try:
            if scope == "full":
                self.gate_entry_to_preview()
            if scope in ("full", "metro"):
                self.metro_direction("xha_b2_platA", self.labels["metro_city"], "metro_city")
                self.metro_direction("xha_b2_platB", self.labels["metro_resort"], "metro_resort")
            if scope == "full":
                self.service_same_place_recovery()
            if scope in ("full", "state"):
                self.advanced_guidance_and_state()
            if scope in ("full", "map"):
                self.home_floor_scroll()
                self.map_start_feedback_to_route()
        except Exception as exc:
            error = f"{type(exc).__name__}: {exc}"
            self.failures.append({"stage": self.last_stage, "error": error})
            self.fail_artifacts()
            self.write_report(False, error, scope=scope)
            raise
        report = self.write_report(True, scope=scope)
        print("PASS: " + ", ".join(self.passed))
        print(f"JSON 报告：{report}")
        return 0


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="对已运行的机场导览应用执行额外可复现 UI 流程")
    parser.add_argument("--target", required=True, help="hdc 设备 ID")
    parser.add_argument("--out", required=True, type=Path, help="截图、布局及 JSON 报告输出目录")
    parser.add_argument("--language", choices=("zh", "en"), default="zh", help="测试语言")
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--map-only", action="store_true", help="只重跑六层滚动与地图选择流程")
    group.add_argument("--state-only", action="store_true", help="只重跑跨层指引、偏好和行程状态流程")
    group.add_argument("--metro-only", action="store_true", help="只验证地铁两个方向")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    os.environ.setdefault("PYTHONUTF8", "1")
    args = parse_args(argv)
    smoke = FlowSmoke(args.target, args.out, args.language)
    try:
        scope = "map" if args.map_only else "state" if args.state_only else "metro" if args.metro_only else "full"
        return smoke.execute(scope=scope)
    except Exception as exc:
        print(f"FAIL [{smoke.last_stage}]：{exc}", file=sys.stderr)
        print(f"JSON 报告：{smoke.out_dir / 'verify_flows_report.json'}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
