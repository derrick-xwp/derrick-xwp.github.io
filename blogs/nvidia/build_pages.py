#!/usr/bin/env python3
"""Generate static HTML pages from docs/*.md for GitHub Pages."""

import html as html_module
import json
import os
import re
import subprocess
from html import escape
from pathlib import Path
from typing import Tuple

ROOT = Path(__file__).resolve().parent
CONTENT = ROOT
NAV_FILE = ROOT / "nav.json"


def load_nav():
    with NAV_FILE.open(encoding="utf-8") as f:
        return json.load(f)


def nav_doc_md_path(path: str) -> str:
    if path.endswith(".html"):
        return path[:-5] + ".md"
    return path


def md_path_to_html(md_path: str) -> Path:
    if md_path.endswith(".md"):
        return CONTENT / md_path.replace(".md", ".html")
    return CONTENT / md_path


def rewrite_md_links(text: str) -> str:
    def repl(match):
        label, url = match.group(1), match.group(2)
        if url.startswith(("http://", "https://", "#", "mailto:")):
            return match.group(0)
        if url.endswith(".md"):
            url = url[:-3] + ".html"
        elif url.endswith("./"):
            url = url.rstrip("/") + ".html" if not url.endswith(".html") else url
        return f"[{label}]({url})"

    return re.sub(r"\[([^\]]+)\]\(([^)]+)\)", repl, text)


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


def build_sidebar(nav, current_html: Path) -> str:
    parts = []
    for section in nav["sections"]:
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
    items = []  # type: list

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

    breadcrumb = ""
    if meta:
        section, doc = meta
        overview = md_path_to_html("总体介绍.md")
        breadcrumb = (
            f'<div class="breadcrumb">'
            f'<a href="{escape(rel_href(html_path, overview))}">{escape(nav["title"])}</a>'
            f" <span> / </span> <span>{escape(section['title'])}</span>"
            f" <span> / </span> <span>{escape(doc['title'])}</span>"
            f"</div>"
        )

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
  <title>{escape(doc['title'] if meta else md_path)} · {escape(nav['title'])}</title>
  <link rel="stylesheet" href="{prefix}styles.css" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600;700&display=swap" rel="stylesheet" />
</head>
<body>
  <header class="site-topbar">
    <div class="site-topbar-nav">
      <a class="site-back" id="site-back-blogs" href="{escape(blog_back)}">← 返回博客</a>
      <span class="site-topbar-sep" aria-hidden="true">·</span>
      <a class="site-back" id="site-back-home" href="{escape(home_href)}">← 返回主页</a>
    </div>
    <span class="site-topbar-label">Blog · 技术调研</span>
  </header>
  <div class="layout">
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <h1>{escape(nav['title'])}</h1>
        <p>{escape(nav.get('subtitle', ''))}</p>
      </div>
      <div class="search-box">
        <input id="search" type="search" placeholder="搜索文档…" autocomplete="off" />
      </div>
      <nav id="nav-root" aria-label="文档导航">
{build_sidebar(nav, html_path)}
      </nav>
    </aside>
    <div class="main">
      <header class="topbar">
        <button class="menu-toggle" id="menu-toggle" type="button" aria-label="打开导航">☰</button>
        <strong>{escape(nav['title'])}</strong>
      </header>
      <div class="content-wrap">
        <div class="article-panel">
          {breadcrumb}
          <article class="article">{body}</article>
          <p class="footer-note">
            源码链接指向
            <a href="https://github.com/isaac-sim/IsaacSim" target="_blank" rel="noopener">Isaac Sim</a>
            与
            <a href="https://github.com/isaac-sim/IsaacLab" target="_blank" rel="noopener">Isaac Lab</a>
            官方 GitHub 仓库。
          </p>
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


def main():
    nav = load_nav()
    for section in nav["sections"]:
        for doc in section["docs"]:
            md_rel = nav_doc_md_path(doc["path"])
            md_file = CONTENT / md_rel
            render_page(nav, md_rel, md_file.read_text(encoding="utf-8"))

    index_html = ROOT / "index.html"
    index_html.write_text(
        """<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="refresh" content="0; url=总体介绍.html" />
  <title>NVIDIA 具身平台调研</title>
  <script>location.replace("总体介绍.html");</script>
</head>
<body>
  <p><a href="总体介绍.html">正在进入 NVIDIA 具身平台调研…</a></p>
</body>
</html>
""",
        encoding="utf-8",
    )
    print("Wrote index.html")


if __name__ == "__main__":
    main()
