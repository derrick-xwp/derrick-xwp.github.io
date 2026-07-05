#!/usr/bin/env python3
"""Fetch teaser images and demo videos from paper project pages into papers.json."""

import json
import re
import ssl
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import urljoin, urlparse

ROOT = Path(__file__).resolve().parent
PAPERS_FILE = ROOT / "papers.json"

CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE

YOUTUBE_RE = re.compile(
    r"(?:youtube\.com/embed/|youtube\.com/watch\?v=|youtu\.be/)([A-Za-z0-9_-]{11})"
)
IMG_EXT = (".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg")
SKIP_IMG = (
    "avatar",
    "icon",
    "logo",
    "favicon",
    "badge",
    "button",
    "arrow",
    "social",
    "profile",
    "gravatar",
    "mathjax",
    "placeholder",
)


def fetch(url: str, timeout: int = 12) -> str | None:
    if not url or url.startswith("arxiv.org"):
        return None
    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0 (compatible; HK2026-media-bot/1.0)"},
        )
        with urllib.request.urlopen(req, timeout=timeout, context=CTX) as resp:
            ctype = resp.headers.get("Content-Type", "")
            if "html" not in ctype and "text" not in ctype:
                return None
            return resp.read().decode("utf-8", errors="replace")
    except (urllib.error.URLError, TimeoutError, ValueError):
        return None


def normalize_url(base: str, href: str) -> str | None:
    if not href or href.startswith(("data:", "javascript:", "#", "mailto:")):
        return None
    return urljoin(base, href)


def youtube_id(url: str) -> str | None:
    m = YOUTUBE_RE.search(url)
    return m.group(1) if m else None


def is_good_image(url: str) -> bool:
    low = url.lower()
    if any(s in low for s in SKIP_IMG):
        return False
    path = urlparse(url).path.lower()
    return path.endswith(IMG_EXT) or "/static/" in low or "teaser" in low or "figure" in low


def extract_media(html: str, page_url: str) -> tuple[list[dict], list[dict]]:
    images: list[dict] = []
    videos: list[dict] = []
    seen_img: set[str] = set()
    seen_vid: set[str] = set()

    for m in re.finditer(
        r'<meta[^>]+property=["\']og:image(?::secure_url)?["\'][^>]+content=["\']([^"\']+)["\']',
        html,
        re.I,
    ):
        url = normalize_url(page_url, m.group(1))
        if url and url not in seen_img:
            seen_img.add(url)
            images.append({"url": url, "alt": "项目预览图"})

    for m in re.finditer(
        r'<meta[^>]+property=["\']og:video(?::url)?["\'][^>]+content=["\']([^"\']+)["\']',
        html,
        re.I,
    ):
        url = normalize_url(page_url, m.group(1))
        if not url:
            continue
        yt = youtube_id(url)
        if yt and yt not in seen_vid:
            seen_vid.add(yt)
            videos.append({"type": "youtube", "id": yt, "title": "项目演示"})
        elif url.endswith(".mp4") and url not in seen_vid:
            seen_vid.add(url)
            videos.append({"type": "mp4", "url": url, "title": "项目演示"})

    for m in re.finditer(r'<iframe[^>]+src=["\']([^"\']+)["\']', html, re.I):
        url = normalize_url(page_url, m.group(1))
        if not url:
            continue
        yt = youtube_id(url)
        if yt and yt not in seen_vid:
            seen_vid.add(yt)
            videos.append({"type": "youtube", "id": yt, "title": "项目演示"})

    for m in re.finditer(r'<video[^>]+src=["\']([^"\']+)["\']', html, re.I):
        url = normalize_url(page_url, m.group(1))
        if url and url not in seen_vid:
            seen_vid.add(url)
            videos.append({"type": "mp4", "url": url, "title": "项目演示"})

    for m in re.finditer(r'<source[^>]+src=["\']([^"\']+\.mp4[^"\']*)["\']', html, re.I):
        url = normalize_url(page_url, m.group(1))
        if url and url not in seen_vid:
            seen_vid.add(url)
            videos.append({"type": "mp4", "url": url, "title": "项目演示"})

    for m in re.finditer(
        r'https?://(?:www\.)?(?:youtube\.com/watch\?v=|youtu\.be/)([A-Za-z0-9_-]{11})',
        html,
    ):
        yt = m.group(1)
        if yt not in seen_vid:
            seen_vid.add(yt)
            videos.append({"type": "youtube", "id": yt, "title": "项目演示"})

    for m in re.finditer(r'<img[^>]+src=["\']([^"\']+)["\']', html, re.I):
        url = normalize_url(page_url, m.group(1))
        if not url or url in seen_img or not is_good_image(url):
            continue
        alt_m = re.search(r'alt=["\']([^"\']*)["\']', m.group(0), re.I)
        alt = alt_m.group(1).strip() if alt_m and alt_m.group(1).strip() else "项目配图"
        seen_img.add(url)
        images.append({"url": url, "alt": alt[:120]})

    # de-dupe images by basename
    by_base: dict[str, dict] = {}
    for img in images:
        base = urlparse(img["url"]).path.rsplit("/", 1)[-1].lower()
        if base not in by_base:
            by_base[base] = img
    images = list(by_base.values())[:6]

    return images[:6], videos[:3]


def main():
    papers = json.loads(PAPERS_FILE.read_text(encoding="utf-8"))
    updated = 0

    for key, paper in papers.items():
        project = paper.get("project")
        if not project or "openaccess.thecvf.com" in project or project.startswith(
            "https://arxiv.org"
        ):
            continue

        html = fetch(project)
        if not html:
            print(f"skip (fetch failed): {key}")
            continue

        images, videos = extract_media(html, project)
        if images:
            paper["images"] = images
        if videos:
            paper["videos"] = videos
        if images or videos:
            updated += 1
            print(f"{key}: {len(images)} img, {len(videos)} vid")

    PAPERS_FILE.write_text(
        json.dumps(papers, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Updated {updated} papers")


if __name__ == "__main__":
    main()
