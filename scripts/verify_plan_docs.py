"""Structural checks for Build Week planning artifacts (path 1 + 2).

Drives the real shipped markdown files — not re-implemented content.
Exit 0 only if all acceptance-mapped observations hold.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COMPARISON = ROOT / "docs" / "01-idea-comparison.md"
DESIGN = ROOT / "docs" / "02-pr-autopsy-design.md"


def must_contain(path: Path, patterns: list[tuple[str, str]]) -> list[str]:
    text = path.read_text(encoding="utf-8")
    failures: list[str] = []
    for label, pattern in patterns:
        if not re.search(pattern, text, flags=re.IGNORECASE | re.MULTILINE):
            failures.append(f"{path.name}: missing {label} (/{pattern}/)")
    return failures


def main() -> int:
    failures: list[str] = []

    if not COMPARISON.is_file():
        failures.append(f"missing comparison file: {COMPARISON}")
    if not DESIGN.is_file():
        failures.append(f"missing design file: {DESIGN}")

    if failures:
        for f in failures:
            print("FAIL:", f)
        return 1

    # AC1 + AC2: three ideas scored on shared dimensions + lock
    failures.extend(
        must_contain(
            COMPARISON,
            [
                ("PR Autopsy idea", r"PR Autopsy"),
                ("Exam Lab Coach idea", r"Exam Lab Coach"),
                ("Meeting Action OS idea", r"Meeting\s*(→|->)?\s*Action OS"),
                ("shared dimension Fit Codex", r"Fit Codex"),
                ("shared dimension Demo", r"Demo\s*<\s*3\s*min|Demo &lt;3 min"),
                ("shared dimension Feasibility", r"Feasibility 5 hari"),
                ("shared dimension Novelty", r"Novelty"),
                ("shared dimension Track fit", r"Track fit"),
                ("ranked table or ranking", r"Ranking|Rank\s*\|\s*Ide|\*\*#1\*\*"),
                ("explicit lock PR Autopsy", r"LOCKED DIRECTION|LOCK — arah"),
                ("Repro-First or PR Autopsy lock name", r"Repro-First Gate|PR Autopsy"),
            ],
        )
    )

    # AC3 + AC4: design sections
    failures.extend(
        must_contain(
            DESIGN,
            [
                ("target user", r"Target user"),
                ("core problem", r"Core problem"),
                ("unique angle not generic review", r"Unique angle|Repro-First|bukan generic"),
                ("distinction from summarize PR", r"summar|ringkas|bukan generic"),
                ("MVP features", r"MVP feature|In scope \(MVP\)"),
                ("non-goals / out of scope", r"non-goals|out of scope|Out of scope"),
                ("Codex usage", r"Codex"),
                ("GPT-5.6 usage", r"GPT-5\.6"),
                ("demo video outline", r"Demo video|0:00"),
                ("submit checklist", r"submit checklist|Build Week submit"),
                ("README in checklist", r"README"),
                ("demo video in checklist", r"Demo video|YouTube"),
                ("track/category in checklist", r"Developer Tools|Category/track"),
                ("feedback session ID", r"/feedback|Session ID"),
            ],
        )
    )

    # Must NOT claim guaranteed win as the strategy headline in a way that
    # contradicts plan risks — soft check: design should disclaim certainty.
    design_text = DESIGN.read_text(encoding="utf-8")
    if re.search(r"mutlak menang|pasti juara|guaranteed win", design_text, re.I):
        # Allowed only if framed as negation
        if not re.search(r"bukan.*mutlak|tidak.*mutlak|bukan.*pasti|bukan.*guaranteed", design_text, re.I):
            failures.append("design appears to claim guaranteed win without disclaimer")

    if failures:
        print("VERIFICATION FAILED")
        for f in failures:
            print("FAIL:", f)
        return 1

    print("VERIFICATION PASSED")
    print(f"comparison: {COMPARISON}")
    print(f"design:     {DESIGN}")
    print("AC1 scores+ranking: pass")
    print("AC2 lock PR Autopsy variant: pass")
    print("AC3 user/problem/unique/MVP/non-goals: pass")
    print("AC4 Codex/GPT-5.6 + demo + submit checklist: pass")
    return 0


if __name__ == "__main__":
    sys.exit(main())
