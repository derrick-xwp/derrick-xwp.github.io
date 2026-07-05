#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPLACEMENTS = [
    (
        '<script src="../blog-crypto.js"></script>\n  <script src="../blog-auth.config.js"></script>',
        '<script src="../blog-auth.config.js"></script>\n  <script src="../blog-crypto.js"></script>',
    ),
    (
        '<script src="../../blog-crypto.js"></script>\n  <script src="../../blog-auth.config.js"></script>',
        '<script src="../../blog-auth.config.js"></script>\n  <script src="../../blog-crypto.js"></script>',
    ),
    (
        '<script src="blog-crypto.js"></script>\n  <script src="blog-auth.config.js"></script>',
        '<script src="blog-auth.config.js"></script>\n  <script src="blog-crypto.js"></script>',
    ),
]

count = 0
for path in ROOT.rglob("*.html"):
    if "_plain" in path.parts:
        continue
    text = path.read_text(encoding="utf-8")
    orig = text
    for old, new in REPLACEMENTS:
        text = text.replace(old, new)
    if text != orig:
        path.write_text(text, encoding="utf-8")
        count += 1
print("fixed", count, "files")
