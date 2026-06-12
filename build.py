#!/usr/bin/env python3
"""Pack original + validation content suites into docs/data/<date>.json.

Keys are neutral (v1/v2) so network requests don't reveal which side is
which; the mapping (v1=original, v2=validation) lives only here and in the
reveal logic of docs/app.js.
"""
import json
from pathlib import Path

ROOT = Path(__file__).parent
DATES = ["20260603", "20260610"]
TYPES = [
    ("blog", "blog", "blog-{d}.txt", "Blog Post"),
    ("clip-suggest", "clip-suggest", "clipSuggest-{d}.txt", "Clip Suggestions"),
    ("devos", "devos", "devotional-{d}.txt", "Devotional"),
    ("discussion-guide", "discussion-guide", "discussionGuide-{d}.txt", "Discussion Guide"),
    ("quotes-and-verses", "quotes-and-verses", "quotesVerses-{d}.txt", "Quotes & Verses"),
    ("social-carousel", "social-carousel", "socialCarousel-{d}.txt", "Social Carousel"),
    ("summaries", "summaries", "summaries-{d}.txt", "Summaries"),
]


def read(base: Path, subdir: str, fname: str) -> str:
    return (base / subdir / fname).read_text(encoding="utf-8").strip()


def main() -> None:
    out_dir = ROOT / "docs" / "data"
    out_dir.mkdir(parents=True, exist_ok=True)
    for d in DATES:
        data = {"date": d, "sections": []}
        for key, subdir, pattern, label in TYPES:
            fname = pattern.format(d=d)
            data["sections"].append({
                "key": key,
                "label": label,
                "v1": read(ROOT / d, subdir, fname),            # original
                "v2": read(ROOT / "validation" / d, subdir, fname),  # validation
            })
        out = out_dir / f"{d}.json"
        out.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
        print(f"wrote {out} ({out.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
