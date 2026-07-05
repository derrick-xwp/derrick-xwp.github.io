#!/usr/bin/env python3
"""Inject assets-paradigm-data.json into HTML as inline script (file:// safe)."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
html_path = ROOT / "训练环境构建调研.html"
json_path = ROOT / "assets-paradigm-data.json"

html = html_path.read_text(encoding="utf-8")
data = json_path.read_text(encoding="utf-8").strip()

script_block = f'<script type="application/json" id="assets-paradigm-data">\n{data}\n</script>'

json_tag = re.compile(
    r'<script type="application/json" id="assets-paradigm-data">.*?</script>',
    re.S,
)
if json_tag.search(html):
    html = json_tag.sub(script_block, html, count=1)
    html_path.write_text(html, encoding="utf-8")
    print("refreshed embedded JSON")
elif 'id="assets-paradigm-data"' in html:
    print("JSON script already embedded (pattern mismatch)")
else:
    needle = '<script src="assets-paradigm-view.js"></script>'
    if needle not in html:
        raise SystemExit("assets-paradigm-view.js script tag not found")
    html = html.replace(needle, script_block + "\n  " + needle, 1)
    html_path.write_text(html, encoding="utf-8")
    print("embedded JSON script")

mount_old = '<div id="te-assets-paradigm-root" data-paradigm-view="assets" aria-busy="true"></div>'
mount_new = (
    '<div id="te-assets-paradigm-root" data-paradigm-view="assets" aria-busy="true">'
    '<p class="tpv-loading">正在加载技术路线图…</p></div>'
)
if mount_old in html:
    html = html.replace(mount_old, mount_new, 1)
    html_path.write_text(html, encoding="utf-8")
    print("added loading placeholder")
