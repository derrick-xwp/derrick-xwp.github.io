#!/usr/bin/env python3
"""Inject blog-auth assets into all HTML files under pages/blogs/."""

from pathlib import Path

ROOT = Path(__file__).resolve().parent
MARKER = "blog-auth.js"

SNIPPET = """  <link rel="stylesheet" href="{prefix}blog-auth.css">
  <script src="{prefix}blog-auth.config.js"></script>
  <script src="{prefix}blog-crypto.js"></script>
  <script src="{prefix}blog-auth.js"></script>
"""


def prefix_for(rel: Path) -> str:
    depth = len(rel.parts) - 1
    return "../" * depth if depth else ""


def inject_file(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    changed = False
    prefix = prefix_for(path.relative_to(ROOT))
    if MARKER not in text:
        snippet = SNIPPET.format(prefix=prefix)
        if "<head>" in text:
            text = text.replace("<head>", "<head>\n" + snippet, 1)
            changed = True
        elif "<head " in text:
            idx = text.find(">", text.find("<head")) + 1
            text = text[:idx] + "\n" + snippet + text[idx:]
            changed = True
    elif "blog-crypto.js" not in text:
        crypto_line = f'  <script src="{prefix}blog-crypto.js"></script>\n'
        text = text.replace(
            f'  <script src="{prefix}blog-auth.config.js"></script>\n',
            crypto_line + f'  <script src="{prefix}blog-auth.config.js"></script>\n',
            1,
        )
        changed = True
    if changed:
        path.write_text(text, encoding="utf-8")
    return changed


def main() -> None:
    count = 0
    for html in sorted(ROOT.rglob("*.html")):
        if "_plain" in html.parts:
            continue
        if inject_file(html):
            count += 1
            print("patched", html.relative_to(ROOT))
    print("done,", count, "files")


if __name__ == "__main__":
    main()
