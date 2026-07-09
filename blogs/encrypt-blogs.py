#!/usr/bin/env python3
"""
Build-time encryption for blog HTML (public repo + client-side decrypt).

Workflow:
  python encrypt-blogs.py --init          # copy current HTML -> _plain/ (first time)
  edit files under _plain/
  $env:BLOG_PASSWORD="..."; python encrypt-blogs.py

Requires: pip install cryptography
"""

from __future__ import annotations

import argparse
import base64
import getpass
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

try:
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
except ImportError:
    print("Install dependency: pip install cryptography", file=sys.stderr)
    raise

ROOT = Path(__file__).resolve().parent
PLAIN = ROOT / "_plain"
CONFIG_PATH = ROOT / "blog-auth.config.js"
SKIP_DIRS = {"_plain", "vendor", "local-papers", "papers_refs"}
ENC_MARKER = 'data-enc="'
BODY_SCRIPT_RE = re.compile(r"(<body[^>]*>)(.*?)(<script\b)", re.DOTALL | re.IGNORECASE)
BODY_RE = re.compile(r"(<body[^>]*>)(.*?)(</body>)", re.DOTALL | re.IGNORECASE)
BOOTSTRAP_SCRIPT_RE = re.compile(
    r"<script\s+[^>]*\bsrc=[\"'][^\"']*site-paths\.js[\"'][^>]*>\s*</script>",
    re.IGNORECASE,
)
REDIRECT_RE = re.compile(r"location\.replace\s*\(", re.IGNORECASE)


def read_config() -> dict:
    text = CONFIG_PATH.read_text(encoding="utf-8")
    salt_m = re.search(r"kdfSalt:\s*'([^']+)'", text)
    iter_m = re.search(r"kdfIterations:\s*(\d+)", text)
    if not salt_m:
        raise SystemExit("kdfSalt missing in blog-auth.config.js")
    salt_b64 = salt_m.group(1)
    pad = "=" * (-len(salt_b64) % 4)
    salt = base64.b64decode(salt_b64 + pad)
    return {
        "salt": salt,
        "iterations": int(iter_m.group(1)) if iter_m else 250000,
    }


def derive_key(password: str, salt: bytes, iterations: int) -> bytes:
    return hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, iterations, dklen=32
    )


def encrypt_bytes(plaintext: bytes, password: str, salt: bytes, iterations: int) -> dict:
    key = derive_key(password, salt, iterations)
    iv = os.urandom(12)
    ct = AESGCM(key).encrypt(iv, plaintext, None)
    return {
        "v": 1,
        "alg": "AES-GCM",
        "kdf": "PBKDF2",
        "iter": iterations,
        "salt": base64.b64encode(salt).decode("ascii"),
        "iv": base64.b64encode(iv).decode("ascii"),
        "ct": base64.b64encode(ct).decode("ascii"),
    }


def write_enc(path: Path, payload: dict) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


def should_skip_html(path: Path, html: str) -> bool:
    if path.name.endswith(".raw.html"):
        return True
    if ENC_MARKER in html:
        return True
    rel = path.relative_to(ROOT if path.is_relative_to(ROOT) else ROOT)
    if rel.name == "index.html" and REDIRECT_RE.search(html) and "blog-hub-page" not in html:
        return True
    return False


def split_body_inner(html: str) -> tuple[str, str] | None:
    m = BODY_RE.search(html)
    if not m:
        return None
    inner = m.group(2)
    bootstrap_m = BOOTSTRAP_SCRIPT_RE.search(inner)
    if bootstrap_m:
        return inner[: bootstrap_m.start()], inner[bootstrap_m.start() :]
    return inner, ""


def extract_body_inner(html: str) -> str | None:
    split = split_body_inner(html)
    if split is None:
        return None
    inner, _bootstrap = split
    if not inner.strip():
        return None
    return inner


def build_shell(html: str, enc_name: str, placeholder: str) -> str:
    split = split_body_inner(html)
    if split is None:
        return html
    _inner, bootstrap = split
    shell_inner = (
        '\n<div id="blog-encrypted-root" class="blog-encrypted-root" '
        f'data-enc="{enc_name}" hidden aria-hidden="true">\n'
        f'  <p class="blog-encrypted-placeholder">{placeholder}</p>\n'
        "</div>\n"
    )
    if bootstrap:
        shell_inner += bootstrap
    m = BODY_RE.search(html)
    if not m:
        return html
    return html[: m.start(2)] + shell_inner + html[m.end(2) :]


def ensure_crypto_snippet(html: str, prefix: str) -> str:
    if "blog-crypto.js" in html:
        return html
    snippet = (
        f'  <script src="{prefix}blog-auth.config.js"></script>\n'
        f'  <script src="{prefix}blog-crypto.js"></script>\n'
        f'  <script src="{prefix}blog-auth.js"></script>\n'
    )
    if "blog-auth.js" in html:
        html = re.sub(
            r'\s*<script src="[^"]*blog-auth\.config\.js"></script>\s*'
            r'<script src="[^"]*blog-auth\.js"></script>\s*',
            "\n" + snippet,
            html,
            count=1,
        )
        return html
    if "<head>" in html:
        return html.replace("<head>", "<head>\n" + snippet, 1)
    return html


def prefix_for(rel: Path) -> str:
    depth = len(rel.parts) - 1
    return "../" * depth if depth else ""


def init_plain() -> None:
    PLAIN.mkdir(parents=True, exist_ok=True)
    count = 0
    for html in sorted(ROOT.rglob("*.html")):
        if any(part in SKIP_DIRS for part in html.parts):
            continue
        rel = html.relative_to(ROOT)
        if rel.parts[0] == "_plain":
            continue
        dest = PLAIN / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        if not dest.exists():
            shutil.copy2(html, dest)
            count += 1
            print("copied", rel)
    subprocess.run(["node", str(ROOT / "extract-hub-series.js")], check=True, cwd=ROOT)
    print("init done,", count, "html files copied")


def encrypt_all(password: str) -> None:
    cfg = read_config()
    salt = cfg["salt"]
    iterations = cfg["iterations"]

    if not PLAIN.exists():
        print("Run with --init first to create _plain/", file=sys.stderr)
        raise SystemExit(1)

    subprocess.run(["node", str(ROOT / "extract-hub-series.js")], check=True, cwd=ROOT)

    count = 0
    for src in sorted(PLAIN.rglob("*.html")):
        rel = src.relative_to(PLAIN)
        if any(part in SKIP_DIRS for part in rel.parts):
            continue
        dest = ROOT / rel
        html = src.read_text(encoding="utf-8")
        if should_skip_html(dest, html):
            continue
        inner = extract_body_inner(html)
        if inner is None:
            continue
        enc_name = dest.stem + ".enc.json"
        payload = encrypt_bytes(inner.encode("utf-8"), password, salt, iterations)
        write_enc(dest.parent / enc_name, payload)
        out_html = build_shell(html, enc_name, "内容已加密，请输入访问密码解锁。")
        out_html = ensure_crypto_snippet(out_html, prefix_for(rel))
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(out_html, encoding="utf-8")
        count += 1
        print("encrypted", rel)

    hub_src = PLAIN / "hub-series.json"
    if hub_src.exists():
        hub_payload = encrypt_bytes(hub_src.read_bytes(), password, salt, iterations)
        write_enc(ROOT / "hub-series.enc.json", hub_payload)
        print("encrypted hub-series.enc.json")

    canary_payload = encrypt_bytes(b"hk2026-blog-unlock", password, salt, iterations)
    write_enc(ROOT / "blog-auth.canary.enc.json", canary_payload)
    print("encrypted blog-auth.canary.enc.json")
    print("done,", count, "pages")


def main() -> None:
    parser = argparse.ArgumentParser(description="Encrypt blog HTML for client-side decryption")
    parser.add_argument("--init", action="store_true", help="Copy current HTML into _plain/")
    args = parser.parse_args()

    if args.init:
        init_plain()
        return

    password = os.environ.get("BLOG_PASSWORD") or getpass.getpass("Blog password: ")
    if not password:
        raise SystemExit("password required")
    encrypt_all(password)


if __name__ == "__main__":
    main()
