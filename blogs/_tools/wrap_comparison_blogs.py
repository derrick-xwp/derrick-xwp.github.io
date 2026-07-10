#!/usr/bin/env python3
"""Wrap raw comparison blog HTML with site chrome and write to _plain/comparison/."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PLAIN = ROOT / "_plain" / "comparison"
SRC = Path(__file__).resolve().parent / "sources"

BLOG_HEAD = """  <link rel="stylesheet" href="../blog-auth.css">
  <script src="../blog-auth.config.js"></script>
  <script src="../blog-crypto.js"></script>
  <script src="../blog-auth.js"></script>
"""

TOPBAR_CSS = """
    .sage-site-topbar {
      position: sticky; top: 0; z-index: 200;
      background: rgba(11,15,20,.95); backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border); padding: .65rem 2rem;
    }
    .sage-site-topbar-inner {
      max-width: 1200px; margin: 0 auto;
      display: flex; flex-wrap: wrap; align-items: center; gap: .75rem;
    }
    .sage-site-back { color: var(--muted); text-decoration: none; font-size: .85rem; font-weight: 500; }
    .sage-site-back:hover { color: var(--accent); }
    .sage-site-sep { color: var(--border); }
    .sage-site-label { margin-left: auto; font-size: .8rem; color: var(--muted); }
    @media (max-width: 640px) {
      .sage-site-topbar { padding: .65rem 1rem; }
      .sage-site-label { width: 100%; margin-left: 0; }
    }
"""

TOPBAR_PHYSX_CSS = TOPBAR_CSS.replace("rgba(11,15,20,.95)", "rgba(9,10,16,.95)")

SITE_PATHS = """
<script src="../../site-paths.js"></script>
<script>
(function () {
  function fixHref(id, fallback) {
    var el = document.getElementById(id);
    if (!el) return;
    if (window.SITE_PATHS) {
      if (id === 'site-back-blogs' && window.SITE_PATHS.blogs) el.href = window.SITE_PATHS.blogs;
      if (id === 'site-back-home' && window.SITE_PATHS.home) el.href = window.SITE_PATHS.home;
    } else {
      el.href = fallback;
    }
  }
  fixHref('site-back-blogs', '../');
  fixHref('site-back-home', '../../');
})();
</script>
"""

LINK_FIXES_COMMON = {
    "../sage/docs/interactive_workflow.html": "../sage/flow-guide.html",
    "../EmbodiedGen/docs/interactive_workflow.html": "../embodiedgen/flow-guide.html",
    "../PhysX-Anything/img/teaser.png": "https://physx-anything.github.io/static/images/teaser.png",
    "../PhysX-Anything/README.md": "https://github.com/ziangcao/PhysX-Anything",
}


def wrap_page(html: str, label: str, topbar_css: str, extra_fixes: dict | None = None) -> str:
    fixes = dict(LINK_FIXES_COMMON)
    if extra_fixes:
        fixes.update(extra_fixes)
    html = html.replace("<head>", "<head>\n" + BLOG_HEAD, 1)
    html = html.replace(
        "    * { box-sizing: border-box;",
        topbar_css + "\n    * { box-sizing: border-box;",
        1,
    )
    topbar = f"""<header class="sage-site-topbar">
  <div class="sage-site-topbar-inner">
    <a class="sage-site-back" id="site-back-blogs" href="../">← 返回博客</a>
    <span class="sage-site-sep" aria-hidden="true">·</span>
    <a class="sage-site-back" id="site-back-home" href="../../">← 返回主页</a>
    <span class="sage-site-label">{label}</span>
  </div>
</header>

"""
    html = html.replace("<body>", "<body>\n" + topbar, 1)
    for old, new in fixes.items():
        html = html.replace(old, new)
    html = re.sub(
        r"(\.nav-sticky\s*\{[^}]*position:\s*sticky;\s*)top:\s*0;",
        r"\1top: 2.75rem;",
        html,
        count=1,
    )
    html = html.replace("</body>", SITE_PATHS + "\n</body>")
    return html


def main() -> None:
    PLAIN.mkdir(parents=True, exist_ok=True)
    pages = [
        (
            "physics_properties_comparison.raw.html",
            "physics_properties_comparison.html",
            "SAGE · EmbodiedGen · PhysX 物理属性对比",
            TOPBAR_CSS,
            None,
        ),
        (
            "physx_introduction.raw.html",
            "physx_introduction.html",
            "PhysX-Anything 介绍",
            TOPBAR_PHYSX_CSS,
            None,
        ),
    ]
    for src_name, dest_name, label, css, extra in pages:
        src = SRC / src_name
        if not src.exists():
            raise SystemExit(f"Missing source: {src}")
        out = wrap_page(src.read_text(encoding="utf-8"), label, css, extra)
        (PLAIN / dest_name).write_text(out, encoding="utf-8")
        print("wrote", PLAIN / dest_name)


if __name__ == "__main__":
    main()
