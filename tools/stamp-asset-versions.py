"""Stamp a content hash onto every shared asset URL in the site's HTML.

Cloudflare Pages serves css and js with its own four hour Cache-Control and
ignores what _headers asks for on those responses, so a returning visitor can
sit on an old stylesheet or script. The pages themselves are set to revalidate
on every request, so the fix is to make the asset URL change whenever the file
does: ?v=<hash of the file>.

Run before deploying. It is idempotent, so running it twice changes nothing.
No dependencies, no build step for the site itself, just a rewrite in place.

    python3 tools/stamp-asset-versions.py          # rewrite
    python3 tools/stamp-asset-versions.py --check   # exit 1 if stale
"""

from __future__ import annotations

import hashlib
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Shared assets referenced across pages. Files under riichi/static are webpack
# output with hashes already in the filename, so they are left alone.
ASSETS = [
    "style.css",
    "theme.js",
    "site.js",
    "maimai.js",
    "maimai-australia.js",
    "maimai-venue-pages.css",
    "wordbridge-graph.js",
    "maimai/collections/styles.css",
    "maimai/collections/app.js",
    "maimai/collections/data.js",
]


def content_hash(path: Path) -> str:
    """Short, stable digest of a file's bytes."""
    return hashlib.sha256(path.read_bytes()).hexdigest()[:8]


def reference_pattern(asset: str) -> re.Pattern[str]:
    """Match href/src pointing at this asset, with or without an existing ?v=."""
    name = re.escape(Path(asset).name)
    return re.compile(
        r'((?:href|src)=")((?:[./]*|/)(?:[\w./-]*/)?' + name + r')(\?v=[^"]*)?(")'
    )


def html_files() -> list[Path]:
    return sorted(
        path
        for path in ROOT.rglob("*.html")
        if ".git" not in path.parts and "riichi" not in path.parts
    )


def main() -> int:
    check_only = "--check" in sys.argv

    hashes: dict[str, str] = {}
    for asset in ASSETS:
        path = ROOT / asset
        if not path.exists():
            print(f"missing asset, skipping: {asset}")
            continue
        hashes[Path(asset).name] = content_hash(path)

    stale: list[str] = []
    rewritten = 0

    for page in html_files():
        original = page.read_text(encoding="utf-8")
        updated = original

        for asset, digest in hashes.items():
            pattern = reference_pattern(asset)

            def replace(match: re.Match[str], digest: str = digest) -> str:
                return f"{match.group(1)}{match.group(2)}?v={digest}{match.group(4)}"

            updated = pattern.sub(replace, updated)

        if updated != original:
            rel = page.relative_to(ROOT)
            stale.append(str(rel))
            if not check_only:
                page.write_text(updated, encoding="utf-8")
                rewritten += 1

    if check_only:
        if stale:
            print("asset versions are stale in:")
            for name in stale:
                print(f"  {name}")
            print("run: python3 tools/stamp-asset-versions.py")
            return 1
        print("asset versions are current")
        return 0

    print(f"stamped {len(hashes)} assets across {rewritten} pages")
    for asset, digest in sorted(hashes.items()):
        print(f"  {asset} -> {digest}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
