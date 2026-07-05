#!/usr/bin/env python3
"""Download §4.8 Real2Sim2Real papers to local-papers/."""

import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent / "local-papers"
ROOT.mkdir(exist_ok=True)

PAPERS = [
    ("2510.15352", "GaussGym"),
    ("2411.11839", "RoboGSim"),
    ("2510.20813", "GSWorld"),
    ("2409.10161", "SplatSim"),
    ("2409.20291", "RL-GSBridge"),
    ("2502.08645", "Re3Sim"),
    ("2505.09601", "Real2Render2Real"),
    ("2504.13175", "RoboSplat"),
    ("2505.07096", "X-Sim"),
    ("2507.05198", "EmbodiedDreamer"),
    ("2504.03597", "Real-is-Sim"),
    ("2509.17430", "EmbodiedSplat"),
    ("2403.03949", "RialTo"),
]

MIN_BYTES = 50_000
MAX_RETRIES = 3
TIMEOUT_SEC = 120


def fetch_with_curl(arxiv_id: str, dest: Path) -> bool:
    url = f"https://arxiv.org/pdf/{arxiv_id}.pdf"
    tmp = dest.with_suffix(".pdf.part")
    cmd = [
        "curl.exe",
        "-L",
        "--fail",
        "--retry",
        "2",
        "--retry-delay",
        "3",
        "--connect-timeout",
        "30",
        "--max-time",
        str(TIMEOUT_SEC),
        "-A",
        "Mozilla/5.0 (compatible; HK2026-paper-fetch/1.0)",
        "-o",
        str(tmp),
        url,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        if tmp.exists():
            tmp.unlink(missing_ok=True)
        err = (result.stderr or result.stdout or "").strip()
        print(f"  curl fail ({result.returncode}): {err[:200]}")
        return False
    if not tmp.exists() or tmp.stat().st_size < MIN_BYTES:
        tmp.unlink(missing_ok=True)
        print("  fail: file too small or missing")
        return False
    tmp.replace(dest)
    return True


def main() -> int:
    ok, skip, fail = 0, 0, 0
    for arxiv_id, name in PAPERS:
        dest = ROOT / f"{arxiv_id}_{name}.pdf"
        if dest.exists() and dest.stat().st_size >= MIN_BYTES:
            print(f"skip {name} ({dest.stat().st_size // 1024} KB)")
            skip += 1
            continue
        print(f"fetch {name} ({arxiv_id}) ...")
        success = False
        for attempt in range(1, MAX_RETRIES + 1):
            if attempt > 1:
                print(f"  retry {attempt}/{MAX_RETRIES}")
                time.sleep(2 * attempt)
            if fetch_with_curl(arxiv_id, dest):
                print(f"  ok {dest.stat().st_size // 1024} KB")
                ok += 1
                success = True
                break
        if not success:
            fail += 1
    print(f"\ndone: {ok} downloaded, {skip} skipped, {fail} failed")
    return 1 if fail else 0


if __name__ == "__main__":
    sys.exit(main())
