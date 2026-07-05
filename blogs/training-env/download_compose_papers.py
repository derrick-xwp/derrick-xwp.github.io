#!/usr/bin/env python3
"""Download §4.4 compositional reconstruction papers only."""

from download_local_papers import COMPOSE_PAPERS, fetch

if __name__ == "__main__":
    print("=== §4.4 compositional reconstruction ===")
    for arxiv_id, name in COMPOSE_PAPERS:
        fetch(arxiv_id, name)
