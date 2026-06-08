#!/usr/bin/env python3
"""Sync markdown from pages/embodied-platforms and build static HTML for GitHub Pages."""

from __future__ import annotations

import argparse
import html as html_module
import json
import os
import re
import shutil
import subprocess
from html import escape
from pathlib import Path
from typing import Tuple

ROOT = Path(__file__).resolve().parent
SOURCE_ROOT = ROOT.parents[2] / "embodied-platforms"
NAV_SOURCE = SOURCE_ROOT / "site" / "nav.json"
NAV_FILE = ROOT / "nav.json"
OVERVIEW_MD = "主页.md"
OVERVIEW_MD_FILES = frozenset({"主页.md", "总体介绍.md"})
DEFAULT_INDEX = "主页.html"

FOLDER_TO_SECTION = {
    "ai2thor": "ai2thor",
    "sapien": "sapien",
    "tdw": "tdw",
    "igibson": "igibson",
    "deepmind_lab": "deepmind-lab",
    "virtualhome": "virtualhome",
    "chalet": "chalet",
    "vrkitchen": "vrkitchen",
    "behavior_1k": "behavior",
}

LINK_REWRITES = {
    "../nvidia2/总体介绍.md": "../nvidia/总体介绍.md",
    "../Habitat%20(Meta%20AI)/总体介绍.md": "https://aihabitat.org/",
    "../Habitat (Meta AI)/总体介绍.md": "https://aihabitat.org/",
}

# Local snapshots under embodied-platforms/code/ → official GitHub (for GitHub Pages)
CODE_REPO_BASES = {
    "ManiSkill-main": "https://github.com/haosulab/ManiSkill/blob/main",
    "SAPIEN-master": "https://github.com/haosulab/SAPIEN/blob/main",
    "virtualhome-master": "https://github.com/xavierpuigf/virtualhome/blob/master",
    "tdw-master": "https://github.com/threedworld-mit/tdw/blob/master",
    "lab-master": "https://github.com/google-deepmind/lab/blob/main",
    "BEHAVIOR-1K-main": "https://github.com/StanfordVL/BEHAVIOR-1K/blob/main",
    "VRKitchen-master": "https://github.com/xfgao/VRKitchen/blob/master",
    "CHALET-main": "https://github.com/lil-lab/chalet/blob/master",
    "CIFF-main": "https://github.com/lil-lab/ciff/blob/master",
}

REPOS_LINK_REWRITES = {
    "../repos/ai2thor/": "https://github.com/allenai/ai2thor",
    "../repos/sapien/": "https://github.com/haosulab/SAPIEN",
    "../repos/maniskill/": "https://github.com/haosulab/ManiSkill",
    "../repos/tdw/": "https://github.com/threedworld-mit/tdw",
    "../repos/igibson/": "https://github.com/StanfordVL/iGibson",
    "../repos/habitat-lab/": "https://github.com/facebookresearch/habitat-lab",
    "../repos/deepmind_lab/": "https://github.com/google-deepmind/lab",
    "../repos/virtualhome/": "https://github.com/xavierpuigf/virtualhome",
    "../repos/chalet/": "https://github.com/lil-lab/chalet",
    "../repos/vrkitchen/": "https://github.com/xfgao/VRKitchen",
    "../repos/behavior_1k/": "https://github.com/StanfordVL/BEHAVIOR-1K",
}


def sync_content() -> None:
    if not SOURCE_ROOT.is_dir():
        raise SystemExit(f"Source not found: {SOURCE_ROOT}")

    for path in SOURCE_ROOT.rglob("*.md"):
        rel = path.relative_to(SOURCE_ROOT)
        if rel.parts and rel.parts[0] in {"repos", "site", "code"}:
            continue
        dest = ROOT / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, dest)
        print("Synced", rel)

    if NAV_SOURCE.is_file():
        shutil.copy2(NAV_SOURCE, NAV_FILE)
        print("Synced nav.json")


def load_nav():
    with NAV_FILE.open(encoding="utf-8") as f:
        return json.load(f)


def nav_doc_md_path(path: str) -> str:
    if path.endswith(".html"):
        return path[:-5] + ".md"
    return path


def md_path_to_html(md_path: str) -> Path:
    if md_path.endswith(".md"):
        return ROOT / md_path.replace(".md", ".html")
    return ROOT / md_path


def github_blob_url(local_path: str) -> str | None:
    """Map ../code/Repo/file or embodied-platforms/code/Repo/file to GitHub blob URL."""
    for prefix in ("../code/", "embodied-platforms/code/", "code/"):
        if local_path.startswith(prefix):
            rest = local_path[len(prefix) :]
            break
    else:
        return None
    repo, _, file_path = rest.partition("/")
    base = CODE_REPO_BASES.get(repo)
    if not base:
        return None
    return f"{base}/{file_path}" if file_path else base


def rewrite_code_paths(text: str) -> str:
    for old, new in REPOS_LINK_REWRITES.items():
        text = text.replace(old, new)
    for repo, base in CODE_REPO_BASES.items():
        for prefix in ("../code/", "embodied-platforms/code/", "code/"):
            text = text.replace(f"{prefix}{repo}/", f"{base}/")
    return text


def rewrite_code_citations(text: str) -> str:
    """Turn ```start:end:path``` blocks into linked citations when path maps to GitHub."""

    def repl(match):
        start, end, path = match.group(1), match.group(2), match.group(3)
        gh = github_blob_url(path)
        if not gh:
            return match.group(0)
        anchor = f"#L{start}" if start == end else f"#L{start}-L{end}"
        label = f"{start}:{end}:{path}"
        return f"[`{label}`]({gh}{anchor})"

    return re.sub(
        r"```(\d+):(\d+):((?:\.\./code/|embodied-platforms/code/|code/)[^\n`]+)```",
        repl,
        text,
    )


def rewrite_md_links(text: str) -> str:
    text = rewrite_code_paths(text)
    text = rewrite_code_citations(text)
    for old, new in LINK_REWRITES.items():
        text = text.replace(old, new)

    def repl(match):
        label, url = match.group(1), match.group(2)
        if url.startswith(("http://", "https://", "#", "mailto:")):
            return match.group(0)
        if url.endswith(".md"):
            url = url[:-3] + ".html"
        return f"[{label}]({url})"

    return re.sub(r"\[([^\]]+)\]\(([^)]+)\)", repl, text)


def rewrite_html_code_refs(html: str) -> str:
    """Fix pandoc code blocks that still embed local code paths in class names."""

    def pre_repl(match):
        start, end, path = match.group(1), match.group(2), match.group(3)
        gh = github_blob_url(path)
        if not gh:
            return match.group(0)
        anchor = f"#L{start}" if start == end else f"#L{start}-L{end}"
        url = escape(f"{gh}{anchor}", quote=True)
        label = escape(f"{start}:{end}:{path}")
        return (
            f'<p class="code-citation"><a href="{url}" target="_blank" rel="noopener">'
            f"<code>{label}</code></a></p>"
            f'<pre class="sourceCode"><code class="sourceCode">'
        )

    html = re.sub(
        r'<pre class="sourceCode (\d+):(\d+):((?:embodied-platforms/code/|\.\./code/|code/)[^"]+)">',
        pre_repl,
        html,
    )
    html = re.sub(
        r'<pre class="(\d+):(\d+):((?:embodied-platforms/code/|\.\./code/|code/)[^"]+)">',
        pre_repl,
        html,
    )
    return html


def pandoc_html(markdown_text: str) -> str:
    result = subprocess.run(
        ["pandoc", "-f", "gfm", "-t", "html"],
        input=markdown_text,
        text=True,
        capture_output=True,
        check=True,
    )
    return result.stdout.strip()


def rel_href(from_file: Path, to_file: Path) -> str:
    return os.path.relpath(to_file, start=from_file.parent).replace("\\", "/")


def asset_prefix(from_file: Path) -> str:
    depth = len(from_file.relative_to(ROOT).parts) - 1
    return "../" * depth if depth else "./"


def platform_section_id(md_path: str) -> str | None:
    if md_path in OVERVIEW_MD_FILES:
        return None
    if "/" in md_path:
        return FOLDER_TO_SECTION.get(md_path.split("/")[0])
    return None


def sections_for_page(nav, md_path: str) -> list:
    sections = nav["sections"]
    if md_path in OVERVIEW_MD_FILES:
        return [s for s in sections if s["id"] == "overview"]

    section_id = platform_section_id(md_path)
    if section_id:
        return [s for s in sections if s["id"] == section_id]
    return sections


def page_nav_header(nav, md_path: str) -> tuple[str, str]:
    if md_path in OVERVIEW_MD_FILES:
        return nav["title"], nav.get("subtitle", "")
    section_id = platform_section_id(md_path)
    if section_id:
        section = next((s for s in nav["sections"] if s["id"] == section_id), None)
        if section:
            return section["title"], ""
    return nav["title"], nav.get("subtitle", "")


def build_sidebar(nav, current_html: Path, md_path: str) -> str:
    parts = []

    for section in sections_for_page(nav, md_path):
        parts.append(f'<div class="nav-section"><div class="nav-section-title">{escape(section["title"])}</div>')
        for doc in section["docs"]:
            target = md_path_to_html(nav_doc_md_path(doc["path"]))
            href = rel_href(current_html, target)
            active = " active" if target.resolve() == current_html.resolve() else ""
            desc = doc.get("description") or ""
            parts.append(
                f'<a class="nav-link{active}" href="{escape(href)}">'
                f'<span class="nav-link-title">{escape(doc["title"])}</span>'
                f'<span class="nav-link-desc">{escape(desc)}</span></a>'
            )
        parts.append("</div>")
    return "\n".join(parts)


def add_heading_ids(html: str) -> Tuple[str, str]:
    counter = [0]
    items = []

    def repl(match):
        counter[0] += 1
        tag = match.group(1)
        existing_id = match.group(2)
        inner = match.group(3)
        plain = re.sub(r"<[^>]+>", "", inner).strip()
        if existing_id:
            hid = existing_id
        else:
            slug = re.sub(r"[^\w\u4e00-\u9fff]+", "-", plain.lower()).strip("-") or f"section-{counter[0]}"
            hid = f"{slug}-{counter[0]}"
        level_class = "level-3" if tag == "h3" else ""
        items.append((hid, plain, level_class))
        if existing_id:
            return match.group(0)
        return f'<{tag} id="{hid}">{inner}</{tag}>'

    html = re.sub(
        r'<(h2|h3)(?: id="([^"]*)")?>(.*?)</\1>',
        repl,
        html,
        flags=re.S,
    )
    if not items:
        return html, ""
    toc_items = "".join(
        f'<li><a class="{cls}" href="#{escape(hid)}">{escape(text)}</a></li>'
        for hid, text, cls in items
    )
    toc = f'<aside class="toc-panel" aria-label="目录"><h2>本页目录</h2><ul class="toc-list">{toc_items}</ul></aside>'
    return html, toc


def fix_mermaid_blocks(body: str):
    has_mermaid = False

    def repl(match):
        nonlocal has_mermaid
        has_mermaid = True
        content = html_module.unescape(match.group(1).strip())
        return f'<div class="mermaid">{content}</div>'

    body = re.sub(
        r'<pre class="mermaid"><code>(.*?)</code></pre>',
        repl,
        body,
        flags=re.S,
    )
    return body, has_mermaid


def render_page(nav, md_path: str, md_text: str) -> None:
    html_path = md_path_to_html(md_path)
    html_path.parent.mkdir(parents=True, exist_ok=True)

    body = pandoc_html(rewrite_md_links(md_text))
    body = rewrite_html_code_refs(body)
    body, has_mermaid = fix_mermaid_blocks(body)
    body, toc = add_heading_ids(body)

    prefix = asset_prefix(html_path)
    depth = len(html_path.relative_to(ROOT).parts) - 1
    blog_back = "../" * (depth + 1)
    home_href = "../" * (depth + 2)
    site_paths_href = home_href + "site-paths.js"

    meta = None
    for section in nav["sections"]:
        for doc in section["docs"]:
            if nav_doc_md_path(doc["path"]) == md_path:
                meta = (section, doc)
                break

    nav_title, nav_subtitle = page_nav_header(nav, md_path)

    breadcrumb = ""
    if meta:
        section, doc = meta
        if md_path in OVERVIEW_MD_FILES:
            breadcrumb = (
                f'<div class="breadcrumb">'
                f'<span>{escape(doc["title"])}</span>'
                f"</div>"
            )
        else:
            breadcrumb = (
                f'<div class="breadcrumb">'
                f'<span>{escape(section["title"])}</span>'
                f" <span> / </span> <span>{escape(doc['title'])}</span>"
                f"</div>"
            )

    page_title = doc["title"] if meta else md_path
    if meta and md_path not in OVERVIEW_MD_FILES:
        page_title = f"{doc['title']} · {section['title']}"
    elif meta:
        page_title = f"{doc['title']} · {nav['title']}"

    mermaid_scripts = ""
    if has_mermaid:
        mermaid_scripts = (
            f'\n  <script src="{prefix}vendor/mermaid.min.js"></script>'
            f'\n  <script src="{prefix}mermaid-init.js"></script>'
        )

    page = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{escape(page_title)}</title>
  <link rel="stylesheet" href="{prefix}styles.css" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600;700&display=swap" rel="stylesheet" />
</head>
<body>
  <header class="site-topbar">
    <a class="site-back" id="site-back-blogs" href="{escape(blog_back)}">← 返回博客</a>
  </header>
  <div class="layout">
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <h1>{escape(nav_title)}</h1>
        {f"<p>{escape(nav_subtitle)}</p>" if nav_subtitle else ""}
      </div>
      <div class="search-box">
        <input id="search" type="search" placeholder="搜索文档…" autocomplete="off" />
      </div>
      <nav id="nav-root" aria-label="文档导航">
{build_sidebar(nav, html_path, md_path)}
      </nav>
    </aside>
    <div class="main">
      <header class="topbar">
        <button class="menu-toggle" id="menu-toggle" type="button" aria-label="打开导航">☰</button>
        <strong>{escape(nav_title)}</strong>
      </header>
      <div class="content-wrap">
        <div class="article-panel">
          {breadcrumb}
          <article class="article">{body}</article>
        </div>
        {toc}
      </div>
    </div>
  </div>
  <script src="{escape(site_paths_href)}"></script>
  <script src="{prefix}nav.js"></script>{mermaid_scripts}
</body>
</html>
"""
    html_path.write_text(page, encoding="utf-8")
    print("Wrote", html_path.relative_to(ROOT))


def ensure_assets() -> None:
    nvidia = ROOT.parent / "nvidia"
    for name in ("styles.css", "nav.js", "mermaid-init.js"):
        src = nvidia / name
        if src.is_file() and not (ROOT / name).exists():
            shutil.copy2(src, ROOT / name)
    vendor_src = nvidia / "vendor"
    vendor_dest = ROOT / "vendor"
    if vendor_src.is_dir() and not vendor_dest.exists():
        shutil.copytree(vendor_src, vendor_dest)


def main() -> None:
    parser = argparse.ArgumentParser(description="Build embodied-platforms blog pages")
    parser.add_argument("--sync", action="store_true", help="sync markdown from pages/embodied-platforms")
    parser.add_argument("--no-sync", action="store_true", help="build only, skip sync")
    args = parser.parse_args()

    if args.sync or not args.no_sync:
        sync_content()

    ensure_assets()

    nav = load_nav()
    for section in nav["sections"]:
        for doc in section["docs"]:
            md_rel = nav_doc_md_path(doc["path"])
            md_file = ROOT / md_rel
            if not md_file.is_file():
                raise SystemExit(f"Missing markdown: {md_file}")
            render_page(nav, md_rel, md_file.read_text(encoding="utf-8"))

    index_html = ROOT / "index.html"
    blog_hub = "../"
    index_html.write_text(
        f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="refresh" content="0; url={blog_hub}" />
  <title>具身智能仿真平台调研</title>
  <script>location.replace("{blog_hub}");</script>
</head>
<body>
  <p><a href="{blog_hub}">正在返回博客目录…</a></p>
</body>
</html>
""",
        encoding="utf-8",
    )
    print("Wrote index.html")


if __name__ == "__main__":
    main()
