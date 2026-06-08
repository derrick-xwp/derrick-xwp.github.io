#!/usr/bin/env bash
# Rebuild all blog static sites from source markdown.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
python3 "$ROOT/nvidia/build_pages.py"
python3 "$ROOT/embodied-platforms/build_pages.py"
echo "Done. Open $ROOT/index.html or serve the site root with any static server."
