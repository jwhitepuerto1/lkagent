#!/usr/bin/env python3
"""
Gate 3 — verify that splitting a spec into phase prompts dropped nothing.

Every entity, component, event, code and deliverable named in the source spec must
appear somewhere across the prompts. Reading them side by side and eyeballing it does
not work past about twenty items; this does.

Used on the IAM to confirm all 34 entities, 20 components, 31 event topics, 23 reason
codes and 20 deliverables survived being split from two prompts into eleven.

    python verify-coverage.py ./prompts

Edit CHECKS for the program at hand.
"""

import glob
import os
import re
import sys

# ---------------------------------------------------------------------------
# Edit this. One entry per category of thing the spec names.
# ---------------------------------------------------------------------------
CHECKS = {
    "entities": """
        source_registry ingestion_batch raw_record person organization
    """,
    "components": """
        Source Governance|Raw Data Ingestion|Identity Resolution|Evidence Ledger
    """,
    "events": """
        candidate.discovered source.record.updated identity.resolved
    """,
    "deliverables": """
        migrations|models|contracts|unit tests|integration tests|documentation
    """,
}

# Things that must NOT appear — later-phase logic leaking into earlier prompts.
FORBIDDEN_IN = {
    # "10-phase1a.md": ["scoring", "agent"],
}


def load(prompt_dir: str) -> dict[str, str]:
    files = sorted(glob.glob(os.path.join(prompt_dir, "*.md")))
    if not files:
        sys.exit(f"No .md files in {prompt_dir}")
    return {os.path.basename(f): open(f, encoding="utf-8").read() for f in files}


def main(prompt_dir: str) -> int:
    docs = load(prompt_dir)
    combined = "\n".join(docs.values())
    combined_lower = combined.lower()
    failed = False

    for label, raw in CHECKS.items():
        # split on "|" if present (multi-word items), else whitespace
        items = [i.strip() for i in (raw.split("|") if "|" in raw else raw.split()) if i.strip()]
        missing = [i for i in items if i.lower() not in combined_lower]
        status = "OK " if not missing else "MISS"
        print(f"[{status}] {label}: {len(items) - len(missing)}/{len(items)}")
        for m in missing:
            print(f"         missing: {m}")
            failed = True

    for fname, forbidden in FORBIDDEN_IN.items():
        if fname not in docs:
            print(f"[WARN] {fname} not found for forbidden-term check")
            continue
        text = docs[fname].lower()
        for term in forbidden:
            # allow it in an explicit exclusion section
            hits = [
                line for line in text.split("\n")
                if term.lower() in line
                and "out of scope" not in line
                and "do not" not in line
            ]
            if hits:
                print(f"[MISS] {fname} mentions '{term}' outside an exclusion:")
                for h in hits[:3]:
                    print(f"         {h.strip()[:90]}")
                failed = True

    print()
    for name, text in docs.items():
        words = len(text.split())
        flag = "  <-- over 1400, consider splitting" if words > 1400 else ""
        print(f"  {name}: {words} words{flag}")

    print()
    print("FAIL — coverage incomplete" if failed else "PASS — nothing dropped")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "./prompts"))
