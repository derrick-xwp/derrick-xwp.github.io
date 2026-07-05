#!/usr/bin/env python3
"""Build rich per-paper profiles for presentation PDF."""

from __future__ import annotations

import hashlib
import json
import re
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent
CACHE_DIR = ROOT / "presentation_cache" / "images"

IMAGE_PRIORITY = (
    "method",
    "pipeline",
    "framework",
    "architecture",
    "overview",
    "teaser",
    "model",
    "approach",
)

IMAGE_SKIP = ("symbol", "logo", "icon", "favicon", "avatar", ".svg")

ASSET_PAPER_MAP = {
    "EmbodiedGen": "generative",
    "ArtVIP": "curated",
    "SimFoundry": "real2sim",
}


@dataclass
class PaperProfile:
    core_problem: str = ""
    solution: str = ""
    future_research: list[str] = field(default_factory=list)
    related_work: list[str] = field(default_factory=list)
    compute: str = ""
    implementation: str = ""
    method_summary: str = ""
    context_snippet: str = ""
    cluster_label: str = ""
    cluster_hint: str = ""
    framework_image: Path | None = None
    method_axes: dict[str, str] = field(default_factory=dict)


def load_json(path: Path) -> dict:
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def sanitize_text(text: str) -> str:
    return (
        str(text)
        .replace("\u2194", "<->")
        .replace("↔", "<->")
        .replace("–", "-")
        .replace("—", "-")
        .replace("→", "->")
    )


def pick_framework_image(paper: dict) -> str | None:
    images = paper.get("images") or []
    if not images:
        return None
    ranked: list[tuple[int, str]] = []
    for img in images:
        url = (img.get("url") or "").strip()
        if not url or any(s in url.lower() for s in IMAGE_SKIP):
            continue
        low = url.lower()
        score = 100
        for i, key in enumerate(IMAGE_PRIORITY):
            if key in low:
                score = i
                break
        ranked.append((score, url))
    if not ranked:
        return None
    ranked.sort(key=lambda x: x[0])
    return ranked[0][1]


def download_image(url: str, paper_key: str, timeout: int = 8) -> Path | None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    ext = Path(url.split("?")[0]).suffix.lower() or ".img"
    if ext not in {".png", ".jpg", ".jpeg", ".webp", ".gif"}:
        ext = ".img"
    digest = hashlib.md5(url.encode()).hexdigest()[:10]
    safe_key = re.sub(r"[^\w\-]+", "_", paper_key)
    raw_path = CACHE_DIR / f"{safe_key}_{digest}{ext}"
    out_path = CACHE_DIR / f"{safe_key}_{digest}.jpg"
    fail_path = CACHE_DIR / f"{safe_key}_{digest}.fail"

    if out_path.exists() and out_path.stat().st_size > 1000:
        return out_path
    if fail_path.exists():
        return None

    if not raw_path.exists():
        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "Mozilla/5.0 (HK2026 survey PDF generator)"},
            )
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                data = resp.read()
            if len(data) < 500:
                fail_path.touch()
                return None
            raw_path.write_bytes(data)
        except (urllib.error.URLError, TimeoutError, OSError, ValueError):
            fail_path.touch()
            return None

    try:
        with Image.open(raw_path) as im:
            im = im.convert("RGB")
            im.thumbnail((1000, 1000))
            im.save(out_path, "JPEG", quality=80)
        return out_path
    except OSError:
        if raw_path.suffix.lower() in {".png", ".jpg", ".jpeg"} and raw_path.stat().st_size > 500:
            return raw_path
        fail_path.touch()
        return None


def prefetch_images(paper_names: list[str], bib: dict, workers: int = 6) -> int:
    tasks = []
    for name in paper_names:
        url = pick_framework_image(bib.get(name, {}))
        if url:
            tasks.append((name, url))
    ok = 0
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = [pool.submit(download_image, url, name) for name, url in tasks]
        for fut in futures:
            try:
                if fut.result(timeout=20):
                    ok += 1
            except Exception:
                pass
    return ok


def extract_paper_context(name: str, diagram_data: dict) -> str:
    guides = diagram_data.get("diagram_guide") or []
    if isinstance(guides, str):
        guides = [guides]
    snippets: list[str] = []
    for para in guides:
        if name not in para:
            continue
        for chunk in re.split(r"[。；]", para):
            if name in chunk and len(chunk.strip()) > 12:
                snippets.append(chunk.strip())
    return sanitize_text("。".join(snippets[:2]) + ("。" if snippets else ""))


def find_cluster(diagram_data: dict, cluster_id: str) -> dict | None:
    for cluster in diagram_data.get("clusters") or []:
        if cluster.get("id") == cluster_id:
            return cluster
    return None


def axis_lines(meta: dict, diagram_data: dict, skip: set[str] | None = None) -> list[str]:
    skip = skip or {"cluster", "stages", "diff"}
    labels = {ax["key"]: ax["label"] for ax in diagram_data.get("compare_axes") or []}
    lines = []
    for key, val in meta.items():
        if key in skip or not val or val == "-":
            continue
        label = labels.get(key, key)
        lines.append(f"{label}：{val}")
    return lines


def build_asset_profile(name: str, assets_data: dict, bib: dict) -> PaperProfile:
    branch_id = ASSET_PAPER_MAP[name]
    branch = next(b for b in assets_data["branches"] if b["id"] == branch_id)
    row = next(r for r in assets_data["compare_rows"] if r["branch"] == branch_id)
    pains = assets_data["consensus"]["pains"]
    profile = PaperProfile(
        core_problem=sanitize_text(
            f"具身训练环境构建的横切瓶颈：{pains[0]}；{pains[2]}"
        ),
        solution=sanitize_text(
            f"{branch['summary']} 规模化路径：{branch['label']}。"
        ),
        future_research=[
            sanitize_text(t)
            for t in assets_data.get("roadmap_caption", "").split("。")[:2]
            if len(t.strip()) > 8
        ][:2]
        + [sanitize_text(x) for x in branch.get("tradeoffs", [])[:1]],
        related_work=[
            "与智能体编排主线（SAGE/SceneSmith）形成资产 RAG 互补",
            "与组合重建主线（SimFoundry/SimRecon）形成 Real2Sim 工厂互补",
            "与关节孪生主线共享 URDF/USD 导出规范",
        ],
        compute=sanitize_text(
            f"输入：{row['input']}；规模化：{row['scale']}；"
            f"物理接地：{row['physics']}；闭环：{row['loop']}"
        ),
        implementation=sanitize_text(
            f"格式：{row['format']}；下游：{row['downstream']}；"
            f"挂载阶段：{branch['mount']}"
        ),
        method_summary=sanitize_text(branch["summary"]),
        cluster_label=branch["label"],
        cluster_hint=sanitize_text("；".join(branch.get("strengths", [])[:2])),
        method_axes={
            "优势": "；".join(branch.get("strengths", [])[:2]),
            "权衡": "；".join(branch.get("tradeoffs", [])[:2]),
        },
    )
    paper = bib.get(name, {})
    url = pick_framework_image(paper)
    if url:
        profile.framework_image = download_image(url, name)
    return profile


def build_paper_profile(
    name: str,
    theme_id: str,
    stage_cells: list[str],
    diagrams_db: dict,
    insights_db: dict,
    bib: dict,
    assets_data: dict | None = None,
) -> PaperProfile:
    if name in ASSET_PAPER_MAP and assets_data:
        return build_asset_profile(name, assets_data, bib)

    diagram_data = diagrams_db.get(theme_id, {})
    theme_insight = insights_db.get(theme_id, {})
    meta = (diagram_data.get("papers") or {}).get(name, {})
    cluster = find_cluster(diagram_data, meta.get("cluster", ""))

    context = extract_paper_context(name, diagram_data)
    route_intro = theme_insight.get("route_intro", "")
    cluster_label = cluster.get("label", "") if cluster else ""
    cluster_hint = cluster.get("hint", "") if cluster else ""

    core_problem = sanitize_text(
        route_intro.split("。")[0]
        + (f"。本工作定位于「{cluster_label}」子路线：{cluster_hint}" if cluster_label else "")
    )

    diff = meta.get("diff", "")
    axis_detail = axis_lines(meta, diagram_data)
    solution_parts = [f"核心创新：{diff}"] if diff else []
    solution_parts.extend(axis_detail[:5])
    active_stages = [
        f"{i+1}阶段：{s}"
        for i, s in enumerate(stage_cells)
        if s and s != "-"
    ]
    if active_stages:
        solution_parts.append("流水线贡献：" + "；".join(active_stages[:4]))
    solution = sanitize_text("。".join(solution_parts))

    future: list[str] = []
    for item in theme_insight.get("future_trends", [])[:2]:
        future.append(sanitize_text(item))
    for item in theme_insight.get("challenges", [])[:1]:
        future.append(f"待解难点：{sanitize_text(item)}")
    training = meta.get("training", "")
    deploy = meta.get("deploy") or meta.get("backend", "")
    if training in ("-", "—", ""):
        future.append("尚未系统报告⑦策略训练或真机迁移验证")
    if deploy in ("-", "—", "") and theme_id not in ("theme-platforms", "theme-r2s2r"):
        future.append("仿真装配与引擎部署链路仍不完整")

    related: list[str] = []
    if cluster:
        peers = [p for p in cluster.get("papers", []) if p != name]
        if peers:
            related.append(f"同聚类相关工作：{'、'.join(peers)}")
        if cluster_hint:
            related.append(f"技术谱系定位：{sanitize_text(cluster_hint)}")
    caption = diagram_data.get("caption", "")
    if caption:
        related.append(sanitize_text(caption))
    if context:
        related.append(context)

    compute = sanitize_text(theme_insight.get("compute", "见主题级算力评估"))
    if meta.get("gpu"):
        compute = sanitize_text(f"{meta['gpu']}；{compute}")

    impl_parts = axis_detail[:6]
    paper = bib.get(name, {})
    if paper.get("github"):
        impl_parts.append(f"开源实现：{paper['github']}")
    if paper.get("project"):
        impl_parts.append(f"项目主页：{paper['project']}")
    implementation = sanitize_text("；".join(impl_parts))

    profile = PaperProfile(
        core_problem=core_problem,
        solution=solution,
        future_research=future[:4],
        related_work=related[:4],
        compute=compute,
        implementation=implementation,
        method_summary=sanitize_text(diff or cluster_hint),
        context_snippet=context,
        cluster_label=cluster_label,
        cluster_hint=sanitize_text(cluster_hint),
        method_axes={k: sanitize_text(v) for k, v in meta.items() if k not in {"cluster", "stages"}},
    )

    url = pick_framework_image(paper)
    if url:
        profile.framework_image = download_image(url, name)
    return profile
