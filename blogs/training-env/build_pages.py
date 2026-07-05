#!/usr/bin/env python3
"""Generate 训练环境构建调研.html from overview-shell.html + markdown detail."""

import html as html_module
import json
import re
import subprocess
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parent
NAV_FILE = ROOT / "nav.json"
MD_FILE = ROOT / "训练环境构建调研.md"
OVERVIEW_SHELL = ROOT / "overview-shell.html"
HTML_FILE = ROOT / "训练环境构建调研.html"
PARADIGM_DATA_FILE = ROOT / "assets-paradigm-data.json"


def load_nav():
    with NAV_FILE.open(encoding="utf-8") as f:
        return json.load(f)


def rewrite_md_links(text: str) -> str:
    def repl(match):
        label, url = match.group(1), match.group(2)
        if url.startswith(("http://", "https://", "#", "mailto:")):
            if label.endswith(".md"):
                label = label[:-3]
            return f"[{label}]({url})"
        if url.endswith(".md"):
            url = url[:-3] + ".html"
        if label.endswith(".md"):
            label = label[:-3]
        return f"[{label}]({url})"

    return re.sub(r"\[([^\]]+)\]\(([^)]+)\)", repl, text)


def fix_html_links(body: str) -> str:
    body = re.sub(
        r'(<a href="([^"#]+)\.html">)([^<]+)\.md(</a>)',
        r"\1\3\4",
        body,
    )
    return body


def pandoc_html(markdown_text: str) -> str:
    try:
        result = subprocess.run(
            ["pandoc", "-f", "gfm", "-t", "html"],
            input=markdown_text,
            text=True,
            capture_output=True,
            check=True,
        )
        return result.stdout.strip()
    except (FileNotFoundError, subprocess.CalledProcessError):
        import markdown as md_lib

        return md_lib.markdown(
            markdown_text,
            extensions=["tables", "fenced_code", "nl2br", "sane_lists", "extra"],
        )


def fix_mermaid_blocks(body: str):
    has_mermaid = False

    def repl(match):
        nonlocal has_mermaid
        has_mermaid = True
        content = html_module.unescape(match.group(1).strip())
        return f'<div class="mermaid">{content}</div>'

    body = re.sub(
        r'<pre><code class="language-mermaid">(.*?)</code></pre>',
        repl,
        body,
        flags=re.S,
    )
    body = re.sub(
        r'<pre class="mermaid"><code>(.*?)</code></pre>',
        repl,
        body,
        flags=re.S,
    )
    return body, has_mermaid


MAIN_THEME_PANELS = [
    ("3.1", "theme-agentic", "route-main", "Agentic", "generative", "agentic"),
    ("3.2", "theme-layout", "route-aux", "Layout", "generative", "layout"),
    ("3.3", "theme-r2sim-compose", "route-main", "Real-to-Sim", "reconstructive", "r2sim"),
    ("3.4", "theme-articulation", "route-main", "Articulated", "reconstructive", "articulated"),
    ("3.5", "theme-infrastructure", "route-plat", "Infrastructure", "infrastructure", "infrastructure"),
    ("3.6", "theme-foundation-orchestration", "route-plat", "Foundation", "generative", "foundation"),
]

APPENDIX_THEME_PANELS = [
    ("4.6", "theme-cousins", "route-rs-extra", "Digital Cousins", "reconstructive", "r2sim"),
    ("4.7", "theme-deformable", "route-rs-extra", "Deformable", "reconstructive", "articulated"),
]

THEME_PANELS = MAIN_THEME_PANELS + APPENDIX_THEME_PANELS

METHOD_SECTION_INTROS = {
    "theme-agentic": {
        "title": "3.1 Agentic World Generation：智能体编排式世界生成",
        "verdict": "当前最接近端到端 Sim-Ready World 构建的路线；核心是由 LLM/VLM Agent 编排工具链并通过 Critic 闭环修正。",
        "one_liner": "这是当前最接近端到端 Sim-Ready World 构建的路线。它的核心不是单个生成模型，而是由 LLM/VLM Agent 编排布局生成、资产检索、Text-to-3D、物理检查和仿真装配，并通过 Critic 闭环不断修正语义与物理错误。",
        "papers": "SAGE · SceneSmith · SceneWeaver · SceneOrchestra · DisCo-Layout · PhyScensis · SimWorld Studio · RoboGen",
        "pipeline": "语言/任务条件 → Agent 任务分解 → 工具编排（布局 / 资产检索 / Text-to-3D / 代码生成）→ Physics / Semantic / Visual Critic → Isaac / USD / Gymnasium / PyBullet / Genesis 装配 → IL / RL / 下游任务验证",
        "judgment": "SAGE 和 SceneSmith 代表 Sim-Ready 全栈路线；SceneWeaver 和 SceneOrchestra 强调开放工具链和编排效率；DisCo-Layout 与 PhyScensis 更关注布局与物理关系；SimWorld Studio 和 RoboGen 将环境生成进一步接入策略学习闭环。",
        "details_label": "展开：Agentic World Generation 详细分析",
    },
    "theme-layout": {
        "title": "3.2 Layout-Level Scene Generation：布局级场景生成",
        "verdict": "擅长多样可控布局，但大量工作仍停留在 ③④⑤，更适合作为训练环境构建的上游模块。",
        "one_liner": "这一类方法擅长生成多样、可控、语义合理的室内布局，但大量工作仍停留在 ③④⑤，尚未真正进入 ⑥ 仿真装配和 ⑦ 策略训练。因此，它们更适合被视为训练环境构建的上游模块，而不是完整训练环境。",
        "papers": "Holodeck · PhyScene · ProcTHOR · DynScene · InstructScene · CommonScenes · DiffuScene · LayoutGPT · EchoScene · MiDiffusion · ATISS · SPREAD · SceneFormer · CasLayout",
        "groups": [
            ("A. 已接近训练环境的布局生成", "Holodeck · PhyScene · ProcTHOR · DynScene"),
            ("B. 以布局质量和可控性为主", "DiffuScene · ATISS · SceneFormer · MiDiffusion · CasLayout"),
            ("C. 场景图 / 语言条件可控生成", "CommonScenes · InstructScene · EchoScene · LayoutGPT · SPREAD"),
        ],
        "judgment": "这一路线的价值在于低成本扩大场景分布，提升导航、重排和操作任务的数据多样性。但如果缺少 Sim-Ready 资产、碰撞体、关节物体和任务接口，它们仍然只是 Scene Generation，而不是完整 Training Environment。",
        "details_label": "展开：Layout-Level Scene Generation 详细分析",
    },
    "theme-r2sim-compose": {
        "title": "3.3 Real-to-Sim Scene Reconstruction：从真实观测到可仿真世界",
        "verdict": "把真实世界转换为可部署仿真环境；关键矛盾是视觉轨与物理轨的对齐。",
        "one_liner": "重建式路线的核心是把真实世界转换为可部署的仿真环境。它比纯生成式方法更接近真实分布，但难点在于如何同时保证视觉真实、几何准确、碰撞稳定和物理可交互。",
        "papers": "SimRecon · HoloScene · WANDERLAND · Re3Sim · SimuScene · Phi-Scene · Vid2Sim · DP-Recon · DreMa",
        "pipeline": "真实视频 / 单图 / RGB-D / 城市漫游 → 3DGS / mesh / 神经场重建 → 实例分解 / Scene Graph / 支撑拓扑 → 形状补全 / 物理装配 / 碰撞校验 → Isaac / Unity / PyBullet / SAPIEN 部署 → IL / RL / Sim2Real / Real2Sim2Real",
        "judgment": "这一类工作的关键矛盾是「视觉轨」和「物理轨」的对齐：3DGS 等神经渲染表征能提供高保真外观，但策略训练需要 mesh、碰撞体、刚体参数和关节约束。未来的 Sim-Ready 重建很可能走向 3DGS + mesh + physics metadata 的混合表征。",
        "callout": "视觉真实 ≠ 物理可训练",
        "details_label": "展开：Real-to-Sim Scene Reconstruction 详细分析",
    },
    "theme-articulation": {
        "title": "3.4 Articulated Object Digital Twins：关节物体数字孪生",
        "verdict": "从静态场景走向可交互环境的关键；为 Agentic 与 Real-to-Sim 提供可操作资产基础。",
        "one_liner": "如果训练环境只包含静态家具和刚体物体，机器人很难学习真实家庭任务。关节数字孪生路线关注门、抽屉、柜子、旋钮等可动物体，目标是从真实观测中恢复部件、关节轴、运动范围和 URDF/USD，使其成为可操作资产。",
        "papers": "FunREC · DRAWER · Ditto · Neural Implicit · ArtGS · ArticulatedGS · VideoArtGS · Articulat3D · ArtiTwinSplat · Part2GS · PD2GS",
        "judgment": "这一路线是 Sim-Ready World 从「静态场景」走向「可交互环境」的关键。它不一定直接生成完整房间，但为 Agentic Generation 和 Real-to-Sim Reconstruction 提供了可操作资产基础。",
        "details_label": "展开：Articulated Object Digital Twins 详细分析",
    },
    "theme-infrastructure": {
        "title": "3.5 Infrastructure Layer：资产、仿真器、Benchmark 与闭环基础设施",
        "verdict": "不直接定义场景构建路线，但决定生成或重建出来的世界能否被训练系统使用。",
        "one_liner": "基础设施层不直接定义场景构建路线，但决定生成或重建出来的世界能否真正被训练系统使用。它包括 Sim-Ready 资产库、并行仿真平台、任务 benchmark、演示数据生成和 Real2Sim2Real 闭环。",
        "cards": [
            ("A. Sim-Ready Assets", "ArtVIP · SimFoundry", "提供 mesh / URDF / USD / articulated assets"),
            ("B. Simulation & Benchmark Platforms", "Isaac Lab · ManiSkill3 · SAPIEN · Habitat · BEHAVIOR-1K · RLBench · CALVIN · LIBERO", "提供并行物理仿真、任务接口、benchmark 与 rollout 能力"),
            ("C. Real2Sim2Real / Data Loop", "Re3Sim · RialTo · GaussGym · GSWorld · SplatSim · Video2Robo · MimicGen · SkillMimicGen", "连接真实数据、仿真环境、策略训练和真实系统评测"),
        ],
        "judgment": "仿真平台不是场景构建本身。Isaac Lab、ManiSkill3、Habitat 等主要解决 ⑥⑦ 的承载问题；它们需要与前端生成式或重建式管线结合，才能形成完整训练环境构建闭环。",
        "details_label": "展开：Infrastructure Layer 详细分析",
    },
    "theme-foundation-orchestration": {
        "title": "3.6 Foundation Model Orchestration：基础模型编排式世界生成",
        "verdict": "",
        "one_liner": "将多个基础模型组织成稳定的 Sim-Ready 资产 / 场景生产线；八阶段模块映射见 §1.3 表格，代表工作 EmbodiedGen。",
        "formula": "Task / Image / Text → LLM/VLM 理解与分解 → 2D / 3D / Texture / Articulation / Scene 模型调用 → 质量检查与物理恢复 → URDF / mesh / 3DGS / USD 输出 → Simulator-ready assets",
        "papers": "EmbodiedGen",
        "strengths": "覆盖资产、纹理、关节物体和场景；工程可扩展；可随基础模型升级。",
        "weaknesses": "链路复杂；物理属性估计不稳定；策略训练与真实迁移验证仍不足。",
        "details_label": "展开：Foundation Model Orchestration 详细分析",
    },
}

THEME_STAGE_DATA = {
    "theme-agentic": "345678",
    "theme-layout": "345",
    "theme-r2sim-compose": "12345678",
    "theme-articulation": "123456",
    "theme-infrastructure": "45678",
    "theme-foundation-orchestration": "234567",
    "theme-cousins": "12345678",
    "theme-deformable": "1256",
}

CORE_PAPERS = [
    {"name": "SAGE", "cat": "Agentic", "input": "语言任务", "output": "Isaac USD 场景", "stages": "③④⑤⑥⑦", "sim": "Yes", "policy": "Yes", "real": "Discussed", "contrib": "Agent+Critic 全栈", "weak": "真机迁移进行中"},
    {"name": "SceneSmith", "cat": "Agentic", "input": "文本房间/任务", "output": "Isaac/USD", "stages": "③④⑤⑥⑦", "sim": "Yes", "policy": "Yes", "real": "No", "contrib": "Agentic 并发生成", "weak": "室内场景为主"},
    {"name": "SceneWeaver", "cat": "Agentic", "input": "开放词汇指令", "output": "多仿真器场景", "stages": "③④⑤⑥⑦", "sim": "Yes", "policy": "Partial", "real": "No", "contrib": "可扩展工具链", "weak": "物理可靠性参差"},
    {"name": "RoboGen", "cat": "Agentic", "input": "GPT-4 任务", "output": "PyBullet/Genesis", "stages": "③④⑤⑥⑦", "sim": "Yes", "policy": "Yes", "real": "Discussed", "contrib": "环境+技能共生成", "weak": "资产质量依赖库"},
    {"name": "Holodeck", "cat": "Layout", "input": "GPT-4 prompt", "output": "AI2-THOR 布局", "stages": "③④⑤⑥⑦", "sim": "Yes", "policy": "Yes", "real": "No", "contrib": "语言→可训练 THOR", "weak": "物体库受限"},
    {"name": "ProcTHOR", "cat": "Layout", "input": "程序化参数", "output": "AI2-THOR 10万+房间", "stages": "④⑤⑥⑦", "sim": "Yes", "policy": "Yes", "real": "No", "contrib": "规模化程序化", "weak": "视觉/物理简化"},
    {"name": "PhyScene", "cat": "Layout", "input": "房间类型", "output": "Isaac 交互场景", "stages": "③④⑤⑥⑦", "sim": "Yes", "policy": "Partial", "real": "No", "contrib": "物理引导扩散", "weak": "布局复杂度有限"},
    {"name": "DiffuScene", "cat": "Layout", "input": "户型条件", "output": "室内布局", "stages": "③④", "sim": "No", "policy": "No", "real": "No", "contrib": "扩散布局基线", "weak": "无 Sim 部署"},
    {"name": "SimRecon", "cat": "Real-to-Sim", "input": "室内 RGB 视频", "output": "Isaac/SAPIEN", "stages": "①②③④⑤⑥", "sim": "Yes", "policy": "No", "real": "No", "contrib": "组合式重建", "weak": "未报策略训练"},
    {"name": "HoloScene", "cat": "Real-to-Sim", "input": "单段视频", "output": "交互 Digital Twin", "stages": "①②③④⑤⑥", "sim": "Yes", "policy": "No", "real": "No", "contrib": "能量优化孪生", "weak": "未报 IL/RL"},
    {"name": "Vid2Sim", "cat": "Real-to-Sim", "input": "单目户外视频", "output": "Unity 交互场景", "stages": "①②④⑤⑥⑦", "sim": "Yes", "policy": "Yes", "real": "Discussed", "contrib": "GS+mesh 混合", "weak": "户外为主"},
    {"name": "Re3Sim", "cat": "Real-to-Sim", "input": "多视角真实场景", "output": "Isaac 高保真", "stages": "①②③④⑤⑥⑦⑧", "sim": "Yes", "policy": "Yes", "real": "Yes", "contrib": "Real2Sim 数据闭环", "weak": "重建成本高"},
    {"name": "DRAWER", "cat": "Articulated", "input": "多视角扫描", "output": "USD+Isaac Lab", "stages": "①②③④⑤⑥⑦⑧", "sim": "Yes", "policy": "Partial", "real": "Yes", "contrib": "Real2Sim2Real 门/抽屉", "weak": "单物体为主"},
    {"name": "FunREC", "cat": "Articulated", "input": "Egocentric RGB-D", "output": "URDF→Isaac", "stages": "①②③④⑤⑥⑦", "sim": "Yes", "policy": "Yes", "real": "Partial", "contrib": "野外关节发现", "weak": "场景级不完整"},
    {"name": "EmbodiedGen", "cat": "Model Orchestration", "input": "Text / Image", "output": "URDF + mesh / 3DGS + scenes", "stages": "②③④⑤⑥·Partial⑦", "sim": "Yes", "policy": "Partial", "real": "Discussed", "contrib": "基础模型编排式 Sim-Ready asset factory", "weak": "策略训练和真实迁移验证仍不足"},
    {"name": "ArtVIP", "cat": "Infrastructure", "input": "扫描/合成", "output": "Omniverse USD", "stages": "④⑥", "sim": "Yes", "policy": "No", "real": "No", "contrib": "关节资产库", "weak": "策展非生成"},
    {"name": "ManiSkill3", "cat": "Infrastructure", "input": "—", "output": "SAPIEN 并行 API", "stages": "⑥⑦", "sim": "Yes", "policy": "Yes", "real": "Partial", "contrib": "GPU 并行操作 benchmark", "weak": "不承担场景构建"},
    {"name": "Isaac Lab", "cat": "Infrastructure", "input": "—", "output": "Isaac Sim 环境", "stages": "⑥⑦", "sim": "Yes", "policy": "Yes", "real": "Discussed", "contrib": "工业级 RL/IL 平台", "weak": "需前端场景管线"},
    {"name": "BEHAVIOR-1K", "cat": "Infrastructure", "input": "—", "output": "OmniGibson 1000 活动", "stages": "⑥⑦", "sim": "Yes", "policy": "Yes", "real": "No", "contrib": "日常活动 benchmark", "weak": "资产固定"},
    {"name": "RialTo", "cat": "Infrastructure", "input": "真机 demo+扫描", "output": "Isaac Orbit USD", "stages": "①②⑥⑦⑧", "sim": "Yes", "policy": "Yes", "real": "Yes", "contrib": "Real→Sim→Real 闭环", "weak": "单场景定制"},
]

THEME_PAPERS = {
    "theme-agentic": [
        "SAGE",
        "SceneSmith",
        "SceneWeaver",
        "SceneOrchestra",
        "DisCo-Layout",
        "PhyScensis",
        "SimWorld Studio",
        "RoboGen",
    ],
    "theme-layout": [
        "Holodeck",
        "PhyScene",
        "ProcTHOR",
        "DynScene",
        "InstructScene",
        "CommonScenes",
        "DiffuScene",
        "LayoutGPT",
        "EchoScene",
        "MiDiffusion",
        "ATISS",
        "SPREAD",
        "SceneFormer",
        "CasLayout",
    ],
    "theme-assets": ["ArtVIP", "SimFoundry"],
    "theme-foundation-orchestration": ["EmbodiedGen"],
    "theme-infrastructure": [
        "ArtVIP",
        "SimFoundry",
        "ManiSkill3",
        "Isaac Lab",
        "SAPIEN",
        "robosuite",
        "MuJoCo Playground",
        "RoboCasa",
        "Behavior-1k",
        "LIBERO",
        "RLBench",
        "CALVIN",
        "iGibson 2.0",
        "Habitat 3.0",
        "Robotwin 2.0",
        "ThreeDWorld",
        "MimicGen",
        "SkillMimicGen",
        "GaussGym",
        "RoboGSim",
        "GSWorld",
        "SplatSim",
        "RL-GSBridge",
        "Re3Sim",
        "Real2Render2Real",
        "Video2Robo",
        "RoboSplat",
        "X-Sim",
        "EmbodiedDreamer",
        "Real-is-Sim",
        "EmbodiedSplat (Nav)",
        "RialTo",
    ],
    "theme-r2sim-compose": [
        "SimRecon",
        "HoloScene",
        "WANDERLAND",
        "Re3Sim",
        "SimuScene",
        "Phi-Scene",
        "Vid2Sim",
        "DP-Recon",
        "DreMa",
    ],
    "theme-articulation": [
        "FunREC",
        "DRAWER",
        "Ditto",
        "VideoArtGS",
        "ArtGS",
        "ArticulatedGS",
        "Neural Implicit",
        "Articulat3D",
        "ArtiTwinSplat",
        "Part2GS",
        "PD2GS",
    ],
    "theme-cousins": ["Digital Cousins", "GRS", "RoLA", "WorldComposer"],
    "theme-deformable": [
        "PAC-NeRF",
        "Spring-Gaus",
        "PhysGaussian",
        "PhysTwin",
        "SoMA",
    ],
    "theme-r2s2r": [
        "GaussGym",
        "RoboGSim",
        "GSWorld",
        "SplatSim",
        "RL-GSBridge",
        "Re3Sim",
        "Real2Render2Real",
        "Video2Robo",
        "RoboSplat",
        "X-Sim",
        "EmbodiedDreamer",
        "Real-is-Sim",
        "EmbodiedSplat (Nav)",
        "RialTo",
    ],
    "theme-platforms": [
        "ManiSkill3",
        "Isaac Lab",
        "SAPIEN",
        "robosuite",
        "MuJoCo Playground",
        "RoboCasa",
        "Behavior-1k",
        "LIBERO",
        "RLBench",
        "CALVIN",
        "iGibson 2.0",
        "Habitat 3.0",
        "Robotwin 2.0",
        "ThreeDWorld",
        "MimicGen",
        "SkillMimicGen",
    ],
}

PAPERS_FILE = ROOT / "papers.json"
MANUAL_MEDIA_FILE = ROOT / "paper_media_manual.json"
INSIGHTS_FILE = ROOT / "theme_insights.json"
ROUTE_DIAGRAMS_FILE = ROOT / "theme_route_diagrams.json"


def load_theme_insights() -> dict:
    if not INSIGHTS_FILE.exists():
        return {}
    return json.loads(INSIGHTS_FILE.read_text(encoding="utf-8"))


def render_list_items(items: list) -> str:
    if not items:
        return ""
    return "<ul>" + "".join(f"<li>{escape(str(x))}</li>" for x in items) + "</ul>"


def render_theme_route_intro(theme_id: str, insights_db: dict) -> str:
    data = insights_db.get(theme_id) or {}
    intro = data.get("route_intro")
    if not intro:
        return ""
    return f'<p class="theme-route-intro">{escape(intro)}</p>'


def load_route_diagrams() -> dict:
    if not ROUTE_DIAGRAMS_FILE.exists():
        return {}
    return json.loads(ROUTE_DIAGRAMS_FILE.read_text(encoding="utf-8"))


def render_theme_route_diagram(theme_id: str, diagrams_db: dict) -> tuple[str, bool]:
    data = diagrams_db.get(theme_id)
    if not data:
        return "", False

    title = escape(data.get("title", "技术路线对比图"))
    caption = escape(data.get("caption", ""))
    parts = [
        f'<section class="theme-route-diagram" aria-labelledby="{theme_id}-route-diagram-title">',
        f'<h4 class="theme-route-diagram-title" id="{theme_id}-route-diagram-title">{title}</h4>',
    ]
    if caption:
        parts.append(f'<p class="theme-route-diagram-caption">{caption}</p>')

    shared = data.get("shared_stages") or []
    if shared:
        stage_cells = []
        for i, stage in enumerate(shared):
            if i:
                stage_cells.append('<span class="trm-stage-arrow" aria-hidden="true">→</span>')
            stage_cells.append(
                '<div class="trm-stage">'
                f'<span class="trm-stage-label">{escape(stage.get("label", ""))}</span>'
                f'<span class="trm-stage-desc">{escape(stage.get("desc", ""))}</span>'
                "</div>"
            )
        parts.append(
            '<div class="trm-shared-pipeline" role="list" aria-label="共同技术骨架">'
            + "".join(stage_cells)
            + "</div>"
        )

    clusters = data.get("clusters") or []
    papers_meta = data.get("papers") or {}
    if clusters:
        cluster_html = []
        for cluster in clusters:
            cid = cluster.get("id", "")
            paper_chips = []
            for key in cluster.get("papers") or []:
                meta = papers_meta.get(key, {})
                stages = meta.get("stages") or []
                covered = sum(1 for x in stages if x)
                total = len(stages) or 6
                paper_chips.append(
                    '<span class="trm-paper-chip" data-cluster="'
                    + escape(cid)
                    + '">'
                    f'<strong>{escape(key)}</strong>'
                    f'<span class="trm-paper-coverage">{covered}/{total} 阶段</span>'
                    "</span>"
                )
            cluster_html.append(
                '<article class="trm-cluster" data-cluster-id="'
                + escape(cid)
                + '">'
                f'<h5 class="trm-cluster-title">{escape(cluster.get("label", ""))}</h5>'
                f'<p class="trm-cluster-hint">{escape(cluster.get("hint", ""))}</p>'
                f'<div class="trm-cluster-papers">{"".join(paper_chips)}</div>'
                "</article>"
            )
        parts.append('<div class="trm-cluster-grid">' + "".join(cluster_html) + "</div>")

    mermaid_src = data.get("mermaid")
    has_mermaid = bool(mermaid_src)
    if has_mermaid:
        parts.append(f'<div class="mermaid theme-route-mermaid">{mermaid_src}</div>')

    guide = data.get("diagram_guide")
    if guide:
        guide_paras = [guide] if isinstance(guide, str) else list(guide)
        guide_kicker = escape(data.get("diagram_guide_kicker") or "路线图导读")
        guide_parts = [
            '<div class="theme-route-diagram-guide" role="note">',
            f'<p class="theme-route-diagram-guide-kicker">{guide_kicker}</p>',
        ]
        for para in guide_paras:
            if para:
                guide_parts.append(
                    f'<p class="theme-route-diagram-guide-text">{escape(str(para))}</p>'
                )
        guide_parts.append("</div>")
        parts.append("".join(guide_parts))

    axes = data.get("compare_axes") or []
    paper_keys = THEME_PAPERS.get(theme_id, [])
    if axes and paper_keys:
        thead = "<tr><th scope=\"col\">论文</th>" + "".join(
            f'<th scope="col">{escape(ax.get("label", ""))}</th>' for ax in axes
        ) + "</tr>"
        rows = []
        for key in paper_keys:
            meta = papers_meta.get(key, {})
            cluster_id = meta.get("cluster", "")
            cells = [f'<td><strong>{escape(key)}</strong></td>']
            for ax in axes:
                val = meta.get(ax.get("key", ""), "—")
                cells.append(f"<td>{escape(str(val))}</td>")
            rows.append(
                f'<tr data-cluster="{escape(cluster_id)}">{"".join(cells)}</tr>'
            )
        parts.append(
            '<div class="trm-compare-wrap">'
            '<table class="trm-compare-table te-data-table">'
            f"<thead>{thead}</thead>"
            f'<tbody>{"".join(rows)}</tbody>'
            "</table></div>"
        )

    if clusters:
        legend = "".join(
            f'<span class="trm-legend-item" data-cluster="{escape(c.get("id", ""))}">'
            f'{escape(c.get("label", ""))}</span>'
            for c in clusters
        )
        parts.append(f'<div class="trm-legend" aria-label="聚类图例">{legend}</div>')

    caption_after = data.get("caption_after")
    if caption_after:
        paras = (
            caption_after
            if isinstance(caption_after, list)
            else [p.strip() for p in str(caption_after).split("\n\n") if p.strip()]
        )
        if paras:
            after_kicker = escape(data.get("diagram_guide_kicker") or "路线图导读")
            parts.append('<div class="theme-route-diagram-guide" role="note">')
            parts.append(f'<p class="theme-route-diagram-guide-kicker">{after_kicker}</p>')
            for para in paras:
                parts.append(
                    f'<p class="theme-route-diagram-guide-text">{escape(para)}</p>'
                )
            parts.append("</div>")

    parts.append("</section>")
    return "".join(parts), has_mermaid


def render_model_badges_line(line: str) -> str:
    tokens = [t.strip() for t in re.split(r"\s*(?:/|\+)\s*", line) if t.strip()]
    return "".join(f'<span class="te-model-badge">{escape(t)}</span>' for t in tokens)


def render_method_intro(theme_id: str) -> str:
    intro = METHOD_SECTION_INTROS.get(theme_id)
    if not intro:
        return ""

    parts = [
        f'<div class="method-section-intro">',
        f'<p class="method-one-liner">{escape(intro["one_liner"])}</p>',
    ]
    if intro.get("papers"):
        parts.append(
            f'<p class="method-meta"><span class="method-meta-label">代表论文</span>{escape(intro["papers"])}</p>'
        )
    if intro.get("pipeline"):
        parts.append(
            f'<p class="method-meta"><span class="method-meta-label">典型 pipeline</span>{escape(intro["pipeline"])}</p>'
        )
    if intro.get("formula"):
        parts.append(
            f'<p class="method-meta method-formula"><span class="method-meta-label">路线公式</span>{escape(intro["formula"])}</p>'
        )
    if intro.get("model_groups"):
        parts.append('<div class="method-model-groups">')
        for badges, desc in intro["model_groups"]:
            parts.append(
                f'<article class="method-model-group">'
                f'<div class="te-model-badge-row">{render_model_badges_line(badges)}</div>'
                f'<p class="method-model-group-desc">{escape(desc)}</p>'
                f"</article>"
            )
        parts.append("</div>")
    if intro.get("groups"):
        parts.append('<div class="method-groups">')
        for label, papers in intro["groups"]:
            parts.append(
                f'<div class="method-group"><strong>{escape(label)}</strong><span>{escape(papers)}</span></div>'
            )
        parts.append("</div>")
    if intro.get("cards"):
        parts.append('<div class="method-infra-cards">')
        for title, papers, role in intro["cards"]:
            parts.append(
                f'<article class="method-infra-card"><h5>{escape(title)}</h5>'
                f'<p class="method-infra-papers">{escape(papers)}</p>'
                f'<p class="method-infra-role">{escape(role)}</p></article>'
            )
        parts.append("</div>")
    if intro.get("strengths"):
        parts.append(
            f'<p class="method-meta"><span class="method-meta-label">优势</span>{escape(intro["strengths"])}</p>'
        )
    if intro.get("weaknesses"):
        parts.append(
            f'<p class="method-meta"><span class="method-meta-label">短板</span>{escape(intro["weaknesses"])}</p>'
        )
    if intro.get("judgment"):
        parts.append(f'<p class="method-judgment">{escape(intro["judgment"])}</p>')
    if intro.get("callout"):
        parts.append(
            f'<div class="method-callout" role="note"><strong>{escape(intro["callout"])}</strong></div>'
        )
    parts.append("</div>")
    return "".join(parts)


def render_collapsible_details(label: str, inner_html: str) -> str:
    if not inner_html.strip():
        return ""
    return (
        f'<details class="collapsible-details">'
        f'<summary class="collapsible-details-summary">{escape(label)}</summary>'
        f'<div class="collapsible-details-body">{inner_html}</div>'
        f"</details>"
    )


def render_core_paper_table() -> str:
    rows = []
    for p in CORE_PAPERS:
        tip = escape(f'{p["contrib"]}；短板：{p["weak"]}')
        rows.append(
            "<tr>"
            f'<td><strong>{escape(p["name"])}</strong></td>'
            f'<td><span class="te-tag te-tag-cat">{escape(p["cat"])}</span></td>'
            f'<td>{escape(p["input"])}</td>'
            f'<td>{escape(p["output"])}</td>'
            f'<td class="te-cell-stages">{escape(p["stages"])}</td>'
            f'<td><span class="te-readiness te-readiness-{p["sim"].lower()}">{escape(p["sim"])}</span></td>'
            f'<td><span class="te-readiness te-readiness-{p["policy"].lower()}">{escape(p["policy"])}</span></td>'
            f'<td><span class="te-readiness te-readiness-{p["real"].lower()}">{escape(p["real"])}</span></td>'
            f'<td title="{tip}">{escape(p["contrib"])}</td>'
            f'<td title="{tip}">{escape(p["weak"])}</td>'
            "</tr>"
        )
    return (
        '<div class="te-table-wrap te-core-table-wrap">'
        '<table class="te-data-table te-core-paper-table">'
        "<thead><tr>"
        "<th scope=\"col\">论文</th><th scope=\"col\">类别</th><th scope=\"col\">输入</th>"
        "<th scope=\"col\">输出</th><th scope=\"col\">覆盖阶段</th>"
        "<th scope=\"col\">Sim-Ready</th><th scope=\"col\">Policy-Ready</th><th scope=\"col\">Real-Ready</th>"
        "<th scope=\"col\">核心贡献</th><th scope=\"col\">主要短板</th>"
        "</tr></thead>"
        f"<tbody>{''.join(rows)}</tbody>"
        "</table></div>"
    )


def render_theme_insights(theme_id: str, insights_db: dict) -> str:
    data = insights_db.get(theme_id)
    if not data:
        return ""

    blocks = []

    if data.get("challenges"):
        blocks.append(
            '<section class="theme-insight-block">'
            "<h4>重点难点</h4>"
            + render_list_items(data["challenges"])
            + "</section>"
        )
    if data.get("research_questions"):
        blocks.append(
            '<section class="theme-insight-block">'
            "<h4>核心研究问题</h4>"
            + render_list_items(data["research_questions"])
            + "</section>"
        )
    if data.get("future_trends"):
        blocks.append(
            '<section class="theme-insight-block">'
            "<h4>未来研究趋势</h4>"
            + render_list_items(data["future_trends"])
            + "</section>"
        )

    meta_rows = []
    if data.get("compute"):
        meta_rows.append(
            f'<div class="theme-insight-meta-row">'
            f'<span class="theme-insight-meta-label">效率与算力</span>'
            f'<p>{escape(data["compute"])}</p></div>'
        )
    if data.get("generality"):
        meta_rows.append(
            f'<div class="theme-insight-meta-row">'
            f'<span class="theme-insight-meta-label">通用性评估</span>'
            f'<p>{escape(data["generality"])}</p></div>'
        )
    if data.get("industry"):
        meta_rows.append(
            f'<div class="theme-insight-meta-row">'
            f'<span class="theme-insight-meta-label">业界采用</span>'
            f'<p>{escape(data["industry"])}</p></div>'
        )

    news_html = ""
    news = data.get("news") or []
    if news:
        items = []
        for item in news:
            title = escape(item.get("title", ""))
            url = escape(item.get("url", ""))
            source = escape(item.get("source", ""))
            date = escape(item.get("date", ""))
            meta = " · ".join(x for x in [source, date] if x)
            items.append(
                f'<li class="theme-news-item">'
                f'<a href="{url}" target="_blank" rel="noopener noreferrer">{title}</a>'
                + (f'<span class="theme-news-meta">{meta}</span>' if meta else "")
                + "</li>"
            )
        news_html = (
            '<section class="theme-insight-news">'
            "<h4>相关业界动态</h4>"
            f'<ul class="theme-news-list">{"".join(items)}</ul>'
            '<p class="theme-insight-news-note">来源为公开新闻、技术博客与项目主页，仅供调研参考。</p>'
            "</section>"
        )

    return (
        '<div class="theme-insight-panel">'
        '<div class="theme-insight-grid">'
        + "".join(blocks)
        + "</div>"
        + (
            '<div class="theme-insight-meta">'
            + "".join(meta_rows)
            + "</div>"
            if meta_rows
            else ""
        )
        + news_html
        + "</div>"
    )


def load_papers() -> dict:
    if not PAPERS_FILE.exists():
        return {}
    papers = json.loads(PAPERS_FILE.read_text(encoding="utf-8"))
    if not MANUAL_MEDIA_FILE.exists():
        return papers

    manual = json.loads(MANUAL_MEDIA_FILE.read_text(encoding="utf-8"))
    for key, extra in manual.items():
        if key not in papers or not isinstance(extra, dict):
            continue
        for field in ("images", "videos"):
            incoming = extra.get(field)
            if not incoming:
                continue
            existing = papers[key].get(field) or []
            seen = set()
            merged = []
            for item in existing + incoming:
                sig = json.dumps(item, sort_keys=True)
                if sig in seen:
                    continue
                seen.add(sig)
                merged.append(item)
            papers[key][field] = merged
    return papers


def filter_paper_images(images: list | None) -> list:
    if not images:
        return []
    out = []
    for img in images:
        url = (img.get("url") or "").lower()
        if not url:
            continue
        if url.endswith(".svg"):
            continue
        if any(s in url for s in ("symbol", "favicon", "logo", "icon")):
            continue
        out.append(img)
    if not out:
        out = [img for img in images if img.get("url")]
    return out[:5]


def render_paper_media_block(paper: dict, *, defer_images: bool = True) -> str:
    images = filter_paper_images(paper.get("images"))
    videos = paper.get("videos") or []
    if not images and not videos:
        return ""

    parts = ['<div class="paper-ref-media">']
    if images:
        if defer_images:
            count = len(images)
            parts.append('<div class="paper-media-gallery paper-media-gallery--deferred">')
            parts.append(
                '<button type="button" class="paper-media-gallery-open" '
                f'aria-label="预览配图 {count} 张">'
                '<span class="paper-media-gallery-open-icon" aria-hidden="true">▣</span>'
                '<span class="paper-media-gallery-open-label">预览配图</span>'
                f'<span class="paper-media-gallery-open-count">{count} 张</span>'
                "</button>"
            )
            parts.append('<div class="paper-media-gallery-items" hidden aria-hidden="true">')
            for img in images:
                alt = escape(img.get("alt") or "项目配图")
                url = escape(img["url"])
                parts.append(
                    f'<button type="button" class="paper-media-thumb" tabindex="-1" '
                    f'data-image-url="{url}" data-image-alt="{alt}"></button>'
                )
            parts.append("</div></div>")
        else:
            parts.append('<div class="paper-media-images" role="list">')
            for img in images:
                alt = escape(img.get("alt") or "项目配图")
                url = escape(img["url"])
                parts.append(
                    f'<button type="button" class="paper-media-thumb" role="listitem" '
                    f'data-image-url="{url}" data-image-alt="{alt}">'
                    f'<img src="{url}" alt="{alt}" loading="lazy" decoding="async">'
                    f"</button>"
                )
            parts.append("</div>")
    if videos:
        parts.append('<div class="paper-media-videos">')
        for idx, video in enumerate(videos):
            title = escape(video.get("title") or f"演示视频 {idx + 1}")
            vtype = video.get("type")
            if vtype == "youtube" and video.get("id"):
                parts.append(
                    f'<button type="button" class="paper-media-play" '
                    f'data-video-type="youtube" data-video-id="{escape(video["id"])}" '
                    f'aria-label="{title}">▶ {title}</button>'
                )
            elif vtype == "mp4" and video.get("url"):
                parts.append(
                    f'<button type="button" class="paper-media-play" '
                    f'data-video-type="mp4" data-video-url="{escape(video["url"])}" '
                    f'aria-label="{title}">▶ {title}</button>'
                )
        parts.append("</div>")
    parts.append('<div class="paper-media-player" hidden></div>')
    parts.append("</div>")
    return "".join(parts)


def render_paper_refs(theme_id: str, papers_db: dict) -> str:
    keys = THEME_PAPERS.get(theme_id, [])
    if not keys:
        return ""

    items = []
    for key in keys:
        paper = papers_db.get(key)
        if not paper:
            continue

        links = []
        if paper.get("arxiv"):
            links.append(
                f'<a href="https://arxiv.org/abs/{escape(paper["arxiv"])}" '
                f'target="_blank" rel="noopener noreferrer">arXiv:{escape(paper["arxiv"])}</a>'
            )
        if paper.get("github"):
            links.append(
                f'<a href="{escape(paper["github"])}" '
                f'target="_blank" rel="noopener noreferrer">GitHub</a>'
            )
        if paper.get("project"):
            links.append(
                f'<a href="{escape(paper["project"])}" '
                f'target="_blank" rel="noopener noreferrer">Project</a>'
            )

        title = paper.get("title", key)
        cite_text = (
            f'{escape(paper.get("authors", ""))}, '
            f'<em>{escape(title)}</em>. '
            f'{escape(paper.get("venue", ""))}.'
        )
        links_html = " · ".join(links)
        media_html = render_paper_media_block(paper)
        items.append(
            f'<li class="paper-ref-item">'
            f'<div class="paper-ref-main">'
            f'<span class="paper-ref-cite">{cite_text}</span>'
            + (f' <span class="paper-ref-links">{links_html}</span>' if links_html else "")
            + "</div>"
            + media_html
            + "</li>"
        )

    if not items:
        return ""

    return (
        '<div class="paper-refs">'
        '<h4 class="paper-refs-heading">论文资料</h4>'
        f'<ul class="paper-ref-list">{"".join(items)}</ul>'
        "</div>"
    )


def clean_markdown_tail(html: str) -> str:
    html = re.sub(r"<blockquote>.*?</blockquote>\s*", "", html, flags=re.S)
    return html.strip()


def split_route_diagram_html(route_diagram_html: str) -> tuple[str, str]:
    """Keep compare table visible; fold long guides and mermaid into supplementary."""
    if not route_diagram_html:
        return "", ""
    guide_m = re.search(r'(<div class="theme-route-diagram-guide".*?</div>)', route_diagram_html, re.S)
    mermaid_m = re.search(r'(<div class="mermaid theme-route-mermaid".*?</div>)', route_diagram_html, re.S)
    supplementary = ""
    visible = route_diagram_html
    for block in (guide_m, mermaid_m):
        if block:
            supplementary += block.group(1)
            visible = visible.replace(block.group(1), "")
    return visible.strip(), supplementary.strip()


def build_single_panel(
    chunk: str,
    meta: tuple,
    papers_db: dict,
    insights_db: dict,
    diagrams_db: dict,
    *,
    default_open: bool = False,
) -> tuple[str, bool]:
    num, theme_id, route_class, badge, paradigm, route = meta
    h3_m = re.match(r"<h3[^>]*>(.*?)</h3>", chunk, re.S)
    if not h3_m:
        return chunk, False

    title_plain = METHOD_SECTION_INTROS.get(theme_id, {}).get("title") or re.sub(
        r"<[^>]+>", "", h3_m.group(1)
    ).strip()
    intro_data = METHOD_SECTION_INTROS.get(theme_id, {})
    verdict = intro_data.get("verdict", "")
    details_label = intro_data.get(
        "details_label", f"展开：{title_plain} 详细分析"
    )

    route_intro_html = render_theme_route_intro(theme_id, insights_db)
    route_diagram_html, diagram_mermaid = render_theme_route_diagram(theme_id, diagrams_db)
    diagram_visible, diagram_supplementary = split_route_diagram_html(route_diagram_html)
    paradigm_html = ""
    if theme_id == "theme-infrastructure":
        diagram_mermaid = True
        paradigm_html = (
            '<div id="te-assets-paradigm-root" data-paradigm-view="assets" aria-busy="true">'
            '<p class="tpv-loading">正在加载技术路线图…</p></div>'
        )

    insight_theme_id = theme_id
    if theme_id == "theme-infrastructure":
        insight_html = (
            render_theme_insights("theme-platforms", insights_db)
            + render_theme_insights("theme-r2s2r", insights_db)
        )
    else:
        insight_html = render_theme_insights(insight_theme_id, insights_db)
    paper_refs_html = render_paper_refs(theme_id, papers_db)
    if theme_id == "theme-infrastructure":
        paper_refs_html = (
            render_paper_refs("theme-assets", papers_db)
            + render_paper_refs("theme-r2s2r", papers_db)
            + render_paper_refs("theme-platforms", papers_db)
        )

    collapsed_inner = route_intro_html + diagram_supplementary + insight_html + paper_refs_html
    collapsed_html = render_collapsible_details(details_label, collapsed_inner)

    visible_body = (
        render_method_intro(theme_id)
        + paradigm_html
        + diagram_visible
        + collapsed_html
    )

    open_attr = " open" if default_open else ""
    stage_data = THEME_STAGE_DATA.get(theme_id, "345678")
    panel = (
        f'<details class="theme-panel {route_class}" id="{theme_id}"'
        f' data-paradigm="{escape(paradigm)}" data-route="{escape(route)}"'
        f' data-stages="{escape(stage_data)}"{open_attr}>'
        f'<summary class="theme-panel-summary">'
        f'<span class="theme-route-badge">{escape(badge)}</span>'
        f'<span class="theme-panel-title">{escape(title_plain)}</span>'
        f'<span class="theme-panel-chevron" aria-hidden="true"></span>'
        f"</summary>"
        f'<div class="theme-panel-body">'
        + visible_body
        + "</div></details>"
    )
    return panel, diagram_mermaid


def enhance_theme_panels(html: str) -> tuple[str, str, bool]:
    start_m = re.search(r"<h2[^>]*>\s*4\.\s*(?:文献|论文)", html)
    if not start_m:
        return "", "", False
    end_m = re.search(r"<h2[^>]*>\s*5\.\s*附录", html)
    if not end_m:
        return "", "", False

    middle = html[start_m.end() : end_m.start()]
    appendix_tail = html[end_m.start() :]

    first_h3 = re.search(r"<h3[^>]*>", middle)
    if not first_h3:
        return "", appendix_tail, False

    rest = middle[first_h3.start() :]
    chunks = re.split(r"(?=<h3[^>]*>)", rest)

    method_panels = []
    appendix_panels = []
    papers_db = load_papers()
    insights_db = load_theme_insights()
    diagrams_db = load_route_diagrams()
    panel_has_mermaid = False

    for chunk in chunks:
        if not chunk.strip():
            continue
        h3_m = re.match(r"<h3[^>]*>(.*?)</h3>", chunk, re.S)
        if not h3_m:
            continue

        title_plain = re.sub(r"<[^>]+>", "", h3_m.group(1)).strip()
        num_m = re.match(r"(3\.\d)", title_plain) or re.match(r"(4\.[67])", title_plain)
        if not num_m:
            continue

        num = num_m.group(1)
        meta = next((t for t in THEME_PANELS if t[0] == num), None)
        if not meta:
            continue

        is_main = num in {t[0] for t in MAIN_THEME_PANELS}
        panel, diagram_mermaid = build_single_panel(
            chunk,
            meta,
            papers_db,
            insights_db,
            diagrams_db,
            default_open=False,
        )
        if diagram_mermaid:
            panel_has_mermaid = True
        if is_main:
            method_panels.append(panel)
        else:
            appendix_panels.append(panel)

    method_html = (
        '<div class="theme-panels theme-panels-main">' + "".join(method_panels) + "</div>"
        if method_panels
        else ""
    )
    appendix_html = ""
    return method_html, appendix_html, panel_has_mermaid


def process_markdown_body(md_text: str) -> tuple[str, str, bool]:
    body = pandoc_html(rewrite_md_links(md_text))
    body = fix_html_links(body)
    body, has_mermaid = fix_mermaid_blocks(body)
    method_html, appendix_html, panel_mermaid = enhance_theme_panels(body)
    return method_html, appendix_html, has_mermaid or panel_mermaid


def render_paradigm_data_script() -> str:
    if not PARADIGM_DATA_FILE.is_file():
        return ""
    data = PARADIGM_DATA_FILE.read_text(encoding="utf-8").strip()
    return f'\n  <script type="application/json" id="assets-paradigm-data">\n{data}\n</script>'


def render_page(method_html: str, appendix_html: str, has_mermaid: bool) -> None:
    shell = OVERVIEW_SHELL.read_text(encoding="utf-8")
    page = shell.replace("<!-- METHOD_SECTIONS -->", method_html)
    page = page.replace("<!-- CORE_PAPER_TABLE -->", render_core_paper_table())

    page = re.sub(r"<!--\s*BUILD TEMPLATE.*?-->\s*", "", page, count=1, flags=re.S)

    mermaid_scripts = ""
    if has_mermaid:
        mermaid_scripts = (
            '\n  <script src="vendor/mermaid.min.js"></script>'
            '\n  <script src="mermaid-init.js"></script>'
            + render_paradigm_data_script()
            + '\n  <script src="assets-paradigm-view.js"></script>'
        )
    interactive_script = '\n  <script src="training-env-interactive.js"></script>'

    page = page.replace("<!-- MERMAID_SCRIPTS -->", mermaid_scripts)
    page = page.replace("<!-- INTERACTIVE_SCRIPT -->", interactive_script)

    HTML_FILE.write_text(page, encoding="utf-8")
    print("Wrote", HTML_FILE.relative_to(ROOT))


def main():
    md_text = MD_FILE.read_text(encoding="utf-8")
    method_html, appendix_html, has_mermaid = process_markdown_body(md_text)
    render_page(method_html, appendix_html, has_mermaid)

    index_html = ROOT / "index.html"
    index_html.write_text(
        """<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="refresh" content="0; url=训练环境构建调研.html" />
  <title>训练环境构建调研</title>
  <script>location.replace("训练环境构建调研.html");</script>
</head>
<body>
  <p><a href="训练环境构建调研.html">正在进入训练环境构建调研…</a></p>
</body>
</html>
""",
        encoding="utf-8",
    )
    print("Wrote index.html")


if __name__ == "__main__":
    main()
