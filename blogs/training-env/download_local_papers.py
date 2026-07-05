#!/usr/bin/env python3
"""Download survey papers to local-papers/ (§4.1 agentic + §4.5 articulation)."""

import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent / "local-papers"
ROOT.mkdir(exist_ok=True)
FETCH_TIMEOUT = 90

AGENTIC_PAPERS = [
    # §4.1 agentic orchestration
    ("2602.10116", "SAGE"),
    ("2602.09153", "SceneSmith"),
    ("2509.20414", "SceneWeaver"),
    ("2604.19907", "SceneOrchestra"),
    ("2510.02178", "DisCo-Layout"),
    ("2602.14968", "PhyScensis"),
    ("2605.09423", "SimWorldStudio"),
    ("2311.01455", "RoboGen"),
    # §4.3 sim-ready assets
    ("2506.10600", "EmbodiedGen"),
    ("2506.04941", "ArtVIP"),
    ("2606.28276", "SimFoundry"),
]

ARTICULATION_PAPERS = [
    ("2604.05621", "FunREC"),
    ("2306.08533", "Ditto"),
    ("2509.17647", "VideoArtGS"),
    ("2502.19459", "ArtGS"),
    ("2603.11606", "Articulat3D"),
    ("2606.24628", "ArtiTwinSplat"),
    ("2506.17212", "Part2GS"),
    ("2506.09663", "PD2GS"),
]

COUSINS_PAPERS = [
    ("2410.07408", "DigitalCousins"),
    ("2410.15536", "GRS"),
    ("2509.22970", "RoLA"),
    ("2604.15805", "WorldComposer"),
]

COMPOSE_PAPERS = [
    # §4.4 compositional scene reconstruction
    ("2603.02133", "SimRecon"),
    ("2510.05560", "HoloScene"),
    ("2511.20620", "WANDERLAND"),
    ("2502.08645", "Re3Sim"),
    ("2606.03994", "SimuScene"),
    ("2606.21596", "Phi-Scene"),
    ("2501.06693", "Vid2Sim"),
    ("2503.14830", "DP-Recon"),
    ("2412.14957", "DreMa"),
]

LAYOUT_PAPERS = [
    # §4.2 scene graph / diffusion layout
    ("2312.09067", "Holodeck"),
    ("2404.09465", "PhyScene"),
    ("2206.06994", "ProcTHOR"),
    ("2402.04717", "InstructScene"),
    ("2305.11337", "CommonScenes"),
    ("2303.14207", "DiffuScene"),
    ("2305.15393", "LayoutGPT"),
    ("2405.00915", "EchoScene"),
    ("2405.21066", "MiDiffusion"),
    ("2110.06199", "ATISS"),
    ("2603.27573", "SPREAD"),
    ("2012.09793", "SceneFormer"),
    ("2604.27361", "CasLayout"),
]

DYN_SCENE_URL = (
    "https://openaccess.thecvf.com/content/CVPR2025/papers/"
    "Lee_DynScene_Scalable_Generation_of_Dynamic_Robotic_Manipulation_Scenes_for_Embodied_CVPR_2025_paper.pdf"
)

SAGE_LOCAL = (
    Path(__file__).resolve().parents[3]
    / "cvpr2026"
    / "cvpr2026"
    / "Xia_SAGE_Scalable_Agentic_3D_Scene_Generation_for_Embodied_AI_CVPR_2026_paper.pdf"
)


def fetch_url(url: str, dest: Path) -> None:
    req = urllib.request.Request(url, headers={"User-Agent": "HK2026-survey/1.0"})
    with urllib.request.urlopen(req, timeout=FETCH_TIMEOUT) as resp:
        dest.write_bytes(resp.read())


def fetch(arxiv_id: str, name: str) -> None:
    dest = ROOT / f"{arxiv_id}_{name}.pdf"
    if dest.exists() and dest.stat().st_size > 100_000:
        print(f"skip {name}")
        return
    url = f"https://arxiv.org/pdf/{arxiv_id}.pdf"
    print(f"fetch {name} ({arxiv_id}) ...")
    try:
        fetch_url(url, dest)
        print(f"  ok {dest.stat().st_size // 1024} KB")
    except Exception as exc:
        print(f"  fail: {exc}")


def fetch_dynscene() -> None:
    dest = ROOT / "direct_DynScene.pdf"
    if dest.exists() and dest.stat().st_size > 100_000:
        print("skip DynScene")
        return
    print("fetch DynScene (CVPR 2025) ...")
    try:
        fetch_url(DYN_SCENE_URL, dest)
        print(f"  ok {dest.stat().st_size // 1024} KB")
    except Exception as exc:
        print(f"  fail: {exc}")


def main():
    if SAGE_LOCAL.exists():
        dest = ROOT / "2602.10116_SAGE.pdf"
        if not dest.exists() or dest.stat().st_size < 100_000:
            dest.write_bytes(SAGE_LOCAL.read_bytes())
            print(f"copied SAGE -> {dest.name}")

    print("=== §4.1 agentic ===")
    for arxiv_id, name in AGENTIC_PAPERS:
        fetch(arxiv_id, name)

    print("=== §4.5 articulation ===")
    for arxiv_id, name in ARTICULATION_PAPERS:
        fetch(arxiv_id, name)

    print("=== §4.6 digital cousins ===")
    for arxiv_id, name in COUSINS_PAPERS:
        fetch(arxiv_id, name)

    print("=== §4.4 compositional reconstruction ===")
    for arxiv_id, name in COMPOSE_PAPERS:
        fetch(arxiv_id, name)

    print("=== §4.2 layout / diffusion ===")
    for arxiv_id, name in LAYOUT_PAPERS:
        fetch(arxiv_id, name)
    fetch_dynscene()

    print("note: DRAWER / ArticulatedGS / Neural Implicit have no arXiv id in papers.json")


if __name__ == "__main__":
    main()
