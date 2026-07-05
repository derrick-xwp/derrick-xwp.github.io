#!/usr/bin/env python3
"""Generate detailed academic presentation PDF for embodied training environment survey."""

from __future__ import annotations

import json
import re
import shutil
from dataclasses import dataclass, field
from pathlib import Path

from fpdf import FPDF

from paper_profile_builder import (
    PaperProfile,
    build_paper_profile,
    prefetch_images,
    sanitize_text,
)

ROOT = Path(__file__).resolve().parent
MD_FILE = ROOT / "训练环境构建调研.md"
PAPERS_FILE = ROOT / "papers.json"
INSIGHTS_FILE = ROOT / "theme_insights.json"
DIAGRAMS_FILE = ROOT / "theme_route_diagrams.json"
ASSETS_FILE = ROOT / "assets-paradigm-data.json"
OUTPUT_PDF = ROOT / "embodied_training_env_survey_presentation.pdf"
OUTPUT_PDF_ZH = ROOT / "具身智能训练环境构建_学术汇报.pdf"

STAGE_LABELS = [
    "①采集", "②感知", "③分解", "④生成", "⑤物理", "⑥装配", "⑦训练", "⑧迁移",
]

THEME_META_BY_ID = {
    "4.1": {"id": "theme-agentic", "paradigm": "生成式", "route": "主线 A · 智能体编排", "stages": "典型 ③④⑤⑥⑦"},
    "4.2": {"id": "theme-layout", "paradigm": "生成式", "route": "辅线 · 场景图/扩散布局", "stages": "典型 ③④，部分至 ⑥⑦"},
    "4.3": {"id": "theme-assets", "paradigm": "支撑层", "route": "仿真就绪资产管理", "stages": "④⑥"},
    "4.4": {"id": "theme-r2sim-compose", "paradigm": "重建式", "route": "主线 B · 组合式场景重建", "stages": "典型 ①②③④⑤⑥"},
    "4.5": {"id": "theme-articulation", "paradigm": "重建式", "route": "主线 C · 关节数字孪生", "stages": "典型 ①②③④⑥"},
    "4.6": {"id": "theme-cousins", "paradigm": "重建式", "route": "专题 · Digital Cousins", "stages": "典型 ①–⑧"},
    "4.7": {"id": "theme-deformable", "paradigm": "重建式", "route": "专题 · 可变形数字孪生", "stages": "典型 ①②⑤⑥"},
    "4.8": {"id": "theme-r2s2r", "paradigm": "支撑层", "route": "Real2Sim2Real 闭环", "stages": "⑥⑦⑧"},
    "4.9": {"id": "theme-platforms", "paradigm": "支撑层", "route": "仿真平台与评测基准", "stages": "⑥⑦"},
}

SECTION_NAMES = {
    "4.1": "生成式 · 智能体编排场景合成",
    "4.2": "生成式 · 场景图与扩散式布局合成",
    "4.3": "支撑层 · 仿真就绪资产",
    "4.4": "重建式 · 组合式场景重建",
    "4.5": "重建式 · 关节物体数字孪生",
    "4.6": "重建式 · Digital Cousins",
    "4.7": "重建式 · 可变形数字孪生",
    "4.8": "支撑层 · Real2Sim2Real 策略闭环",
    "4.9": "支撑层 · 仿真平台与数据扩展",
}


@dataclass
class PaperEntry:
    short_name: str
    theme_title: str
    stages: list[str] = field(default_factory=list)
    paradigm: str = ""
    route: str = ""
    theme_stages: str = ""


def load_json(path: Path) -> dict:
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def parse_markdown_tables(md_text: str) -> list[PaperEntry]:
    papers: list[PaperEntry] = []
    table_row_re = re.compile(r"^\|\s*\*\*(.+?)\*\*\s*\|(.+)\|$", re.MULTILINE)
    for theme_id, current_meta in THEME_META_BY_ID.items():
        pattern = (
            rf"### {re.escape(theme_id)}[^\n]*\n\n"
            rf"(?:>.*?\n\n)?"
            rf"\|.*?\n\|[-| ]+\n((?:\|.*?\n)+)"
        )
        match = re.search(pattern, md_text, re.DOTALL)
        if not match:
            continue
        for row_match in table_row_re.finditer(match.group(1)):
            name = row_match.group(1).strip()
            cells = [c.strip() for c in row_match.group(2).split("|")]
            if len(cells) < 8:
                continue
            papers.append(
                PaperEntry(
                    short_name=name,
                    theme_title=theme_id,
                    stages=cells[:8],
                    paradigm=current_meta["paradigm"],
                    route=current_meta["route"],
                    theme_stages=current_meta["stages"],
                )
            )
    return papers


def find_font() -> str:
    for p in [
        Path(r"C:\Windows\Fonts\msyh.ttc"),
        Path(r"C:\Windows\Fonts\simhei.ttf"),
        Path(r"C:\Windows\Fonts\simsun.ttc"),
    ]:
        if p.exists():
            return str(p)
    raise FileNotFoundError("No Chinese font found")


def stage_bar(stages: list[str]) -> str:
    return "  ".join(
        f"{STAGE_LABELS[i]}{'●' if s and s != '—' else '○'}"
        for i, s in enumerate(stages)
    )


def service_value(paper: PaperEntry) -> str:
    active = [i + 1 for i, s in enumerate(paper.stages) if s and s != "—"]
    stage_map = {
        1: "提供观测/条件入口",
        2: "感知重建几何外观",
        3: "场景/实例分解",
        4: "生成仿真就绪资产",
        5: "物理一致性校验",
        6: "仿真器装配部署",
        7: "策略训练验证",
        8: "Sim2Real 迁移闭环",
    }
    parts = [stage_map[s] for s in active[:5]]
    tail = {
        "生成式": "以条件生成扩展场景多样性。",
        "重建式": "锚定真实观测，利于 sim-real 对齐。",
        "支撑层": "为流水线提供基础设施与评测底座。",
    }.get(paper.paradigm, "")
    return sanitize_text("；".join(parts) + "。" + tail)


class SurveyPDF(FPDF):
    def __init__(self, font_path: str):
        super().__init__(orientation="L", unit="mm", format="A4")
        self.add_font("zh", "", font_path)
        self.add_font("zh", "B", font_path)
        self.set_auto_page_break(auto=False, margin=12)

    def footer(self):
        self.set_y(-9)
        self.set_font("zh", "", 8)
        self.set_text_color(130, 130, 130)
        self.cell(0, 8, f"第 {self.page_no()} 页", align="C")

    def _paper_header(self, paper: PaperEntry, idx: int, total: int, bib: dict):
        suffix = "（跨主题）" if paper.short_name == "Re3Sim" and paper.theme_title == "4.8" else ""
        self.set_fill_color(241, 245, 249)
        self.rect(0, 0, 297, 32, style="F")
        self.set_xy(12, 8)
        self.set_font("zh", "B", 15)
        self.set_text_color(15, 23, 42)
        self.cell(0, 7, f"{paper.short_name}{suffix}  ({idx}/{total})")
        self.set_xy(12, 16)
        self.set_font("zh", "", 8)
        self.set_text_color(71, 85, 105)
        info = bib.get(paper.short_name, {})
        cite = info.get("title", paper.short_name)
        extra = f"{info.get('authors', '')}. {info.get('venue', '')}"
        if info.get("arxiv"):
            extra += f"  arXiv:{info['arxiv']}"
        self.multi_cell(273, 4, sanitize_text(f"{cite} | {extra}"))

    def _section_block(self, x: float, y: float, w: float, title: str, body: str, h: float | None = None):
        self.set_xy(x, y)
        self.set_font("zh", "B", 9)
        self.set_text_color(29, 78, 216)
        self.cell(w, 5, title)
        self.ln(5)
        self.set_x(x)
        self.set_font("zh", "", 8)
        self.set_text_color(30, 41, 59)
        if h:
            self.multi_cell(w, 4, sanitize_text(body), max_line_height=4)
        else:
            self.multi_cell(w, 4, sanitize_text(body))

    def _draw_image_box(self, x: float, y: float, w: float, h: float, image: Path | None, caption: str):
        self.set_draw_color(203, 213, 225)
        self.rect(x, y, w, h, style="D")
        if image and image.exists():
            try:
                self.image(str(image), x + 2, y + 2, w - 4, h - 14)
            except Exception:
                self._image_placeholder(x, y, w, h, "配图加载失败")
        else:
            self._image_placeholder(x, y, w, h, "暂无框架图\n(项目页未收录)")
        self.set_xy(x, y + h - 10)
        self.set_font("zh", "", 7)
        self.set_text_color(100, 116, 139)
        self.cell(w, 4, sanitize_text(caption), align="C")

    def _image_placeholder(self, x, y, w, h, text: str):
        self.set_fill_color(248, 250, 252)
        self.rect(x + 2, y + 2, w - 4, h - 14, style="F")
        self.set_xy(x + 4, y + h / 2 - 8)
        self.set_font("zh", "", 8)
        self.set_text_color(148, 163, 184)
        self.multi_cell(w - 8, 4, sanitize_text(text), align="C")

    def paper_detail_pages(
        self,
        idx: int,
        total: int,
        paper: PaperEntry,
        profile: PaperProfile,
        bib: dict,
    ):
        # --- Page 1: framework image + core problem + solution ---
        self.add_page()
        self._paper_header(paper, idx, total, bib)

        img_x, img_y, img_w, img_h = 12, 36, 118, 108
        caption = profile.cluster_label or paper.route
        self._draw_image_box(img_x, img_y, img_w, img_h, profile.framework_image, f"方法框架图 · {caption}")

        text_x, text_w = 136, 149
        y = 36
        if profile.cluster_hint:
            self._section_block(text_x, y, text_w, "技术路线定位", profile.cluster_hint)
            y = self.get_y() + 3

        self._section_block(text_x, y, text_w, "核心问题", profile.core_problem)
        y = self.get_y() + 3
        self._section_block(text_x, y, text_w, "解决方案", profile.solution)

        y = max(self.get_y() + 4, 150)
        self.set_fill_color(239, 246, 255)
        self.rect(12, y, 273, 44, style="F")
        self._section_block(15, y + 3, 267, "八阶段参与", stage_bar(paper.stages))
        stage_lines = [
            f"{STAGE_LABELS[i]}：{s}"
            for i, s in enumerate(paper.stages)
            if s and s != "—"
        ]
        self._section_block(15, self.get_y() + 1, 267, "阶段细节", "；".join(stage_lines[:6]))

        # --- Page 2: related work, future, compute, implementation ---
        self.add_page()
        self._paper_header(paper, idx, total, bib)

        col_w = 132
        left_x, right_x = 12, 150
        y0 = 36

        related = "\n".join(f"· {x}" for x in profile.related_work) or "· 见主题技术路线对比图"
        future = "\n".join(f"· {x}" for x in profile.future_research) or "· 见主题未来趋势"
        self._section_block(left_x, y0, col_w, "与相关工作的关系", related)
        y_left = self.get_y() + 4
        self._section_block(left_x, y_left, col_w, "未来研究方向 / 待解问题", future)

        self._section_block(right_x, y0, col_w, "算力需求", profile.compute)
        y_right = self.get_y() + 4
        self._section_block(right_x, y_right, col_w, "实现方法 / 工程要点", profile.implementation)

        y_bottom = max(self.get_y(), y_left) + 6
        self.set_fill_color(254, 252, 232)
        self.rect(12, y_bottom, 273, 28, style="F")
        self._section_block(15, y_bottom + 3, 267, "服务「具身智能训练场景构建」主线", service_value(paper))

        if profile.context_snippet:
            y_ctx = y_bottom + 32
            self.set_fill_color(245, 245, 245)
            self.rect(12, y_ctx, 273, min(42, 210 - y_ctx - 10), style="F")
            self._section_block(15, y_ctx + 3, 267, "调研笔记摘录", profile.context_snippet)


def build_pdf():
    md_text = MD_FILE.read_text(encoding="utf-8")
    papers = parse_markdown_tables(md_text)
    bib = load_json(PAPERS_FILE)
    insights = load_json(INSIGHTS_FILE)
    diagrams = load_json(DIAGRAMS_FILE)
    assets = load_json(ASSETS_FILE) if ASSETS_FILE.exists() else None
    font_path = find_font()
    pdf = SurveyPDF(font_path)

    pdf.add_page()
    pdf.set_fill_color(15, 23, 42)
    pdf.rect(0, 0, 297, 210, style="F")
    pdf.set_y(48)
    pdf.set_font("zh", "B", 26)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(0, 12, "具身智能训练环境构建", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(6)
    pdf.set_font("zh", "", 13)
    pdf.set_text_color(148, 163, 184)
    pdf.cell(0, 8, "详细学术汇报 · 含框架图 / 核心问题 / 方案 / 未来工作", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 8, f"共 {len(papers)} 篇 · 每篇 2 页 · 八阶段 × 双范式 × 三主线", align="C")

    theme_order = list(THEME_META_BY_ID.keys())
    theme_groups = {t: [] for t in theme_order}
    for p in papers:
        theme_groups[p.theme_title].append(p)

    total = len(papers)
    unique_names = sorted({p.short_name for p in papers})
    cached = len(list((ROOT / "presentation_cache" / "images").glob("*.jpg"))) if (ROOT / "presentation_cache" / "images").exists() else 0
    if cached < len(unique_names) // 2:
        print(f"Prefetching framework images ({cached} cached)...", flush=True)
        prefetched = prefetch_images(unique_names, bib)
        print(f"Cached images after prefetch: {prefetched}", flush=True)
    else:
        print(f"Using {cached} cached framework images", flush=True)

    print(f"Generating PDF pages...", flush=True)
    global_idx = 0
    images_ok = 0

    for theme_key in theme_order:
        group = theme_groups[theme_key]
        if not group:
            continue
        meta = THEME_META_BY_ID[theme_key]
        theme_id = meta["id"]
        intro = insights.get(theme_id, {}).get("route_intro", "")

        pdf.add_page()
        pdf.set_fill_color(30, 41, 59)
        pdf.rect(0, 0, 297, 38, style="F")
        pdf.set_xy(14, 10)
        pdf.set_font("zh", "B", 18)
        pdf.set_text_color(255, 255, 255)
        pdf.cell(0, 8, f"{theme_key}  {SECTION_NAMES[theme_key]}")
        pdf.set_xy(14, 44)
        pdf.set_font("zh", "", 10)
        pdf.set_text_color(30, 41, 59)
        pdf.multi_cell(269, 5, sanitize_text(intro))

        for paper in group:
            global_idx += 1
            profile = build_paper_profile(
                paper.short_name,
                theme_id,
                paper.stages,
                diagrams,
                insights,
                bib,
                assets,
            )
            if profile.framework_image:
                images_ok += 1
            pdf.paper_detail_pages(global_idx, total, paper, profile, bib)

    pdf.output(str(OUTPUT_PDF))
    if OUTPUT_PDF.resolve() != OUTPUT_PDF_ZH.resolve():
        shutil.copy2(OUTPUT_PDF, OUTPUT_PDF_ZH)

    print(f"Generated: {OUTPUT_PDF}")
    print(f"Also copied: {OUTPUT_PDF_ZH}")
    print(f"Papers: {total}, Pages: {pdf.page_no()}, Images: {images_ok}/{total}")


if __name__ == "__main__":
    build_pdf()
