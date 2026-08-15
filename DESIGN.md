# PatchProof Design

PatchProof is a **repro-first PR gate**: instead of asking an AI (or a human) to
*opine* on a pull request, it forces each serious finding to carry a machine-
checkable proof. The core question is not "does this look wrong?" but "can you
make it fail?"

## The repro-first model

Every finding is a card with a fixed shape:

```
claim → evidence in the diff → verify command → ran-pass / ran-fail → suggested patch
```

- **claim** — what the analyzer believes is wrong (e.g. "discount formula produces negative totals").
- **evidence** — the exact added/removed lines that support the claim.
- **verifyCommand** — a script that exercises the claim. It must be runnable.
- **status** — the outcome of actually running the verify command:
  - `ran-fail` — the repro failed, the claim is confirmed. Full weight.
  - `ran-pass` — the repro passed, the claim was wrong or already fixed. Downweighted.
  - `skipped` — no sandbox runner exists for this heuristic yet; left for a human.
  - `proposed` — execution was disabled (`--no-execute`).
- **suggestedPatch** — a minimal diff that fixes the confirmed problem.

This inverts the burden of proof. Unverified claims — the dominant failure mode
of AI-generated review — are structurally downgraded, while confirmed failures
carry an evidence trail a maintainer can audit in seconds.

## Pipeline

```
parse → policy → analyze → (optional LLM polish) → propose repros → run → patch → report
```

1. **parse** (`src/parse-diff.js`) — unified-diff parser; extracts per-file added/removed lines. Also parses GitHub PR URLs.
2. **policy** (`src/policy.js`) — loads `.patchproof.yml` and rejects diffs that exceed size limits, touch blocked paths, or add blocked commands. Violations fail the gate.
3. **analyze** (`src/analyze.js`) — deterministic offline heuristics that emit findings with claims, evidence, verify commands, and suggested patches. No API key, no network.
4. **LLM polish** (`src/llm.js`) — *optional*. With `OPENAI_API_KEY` set, an OpenAI-compatible endpoint rewrites claim wording for clarity. It can never invent findings, remove verify steps, or change statuses. Without a key the engine is fully offline.
5. **run** (`src/runner.js`) — executes repro scripts under the Node permission model.
6. **patch + report** (`src/findings.js`) — risk scoring, Markdown/JSON/SARIF output.

## Risk scoring

`computeRisk` weights findings by severity (`critical 40 / high 25 / medium 12 / low 5`)
and then by verification status:

| status    | multiplier | rationale                          |
|-----------|-----------|------------------------------------|
| ran-fail  | ×1.5      | confirmed — carries full weight    |
| ran-pass  | ×0.35     | disproven — downgraded hard        |
| skipped   | ×0.8      | unverified — slight discount       |
| proposed  | ×1.0      | not yet run                        |

The capped 0–100 score maps to `LOW < 20 ≤ MEDIUM < 45 ≤ HIGH < 70 ≤ CRITICAL`.

## Sandboxed execution without Docker

Repro scripts run as child Node processes with the built-in permission model:

```
node --permission --allow-fs-read=<worktree> --allow-fs-write=<worktree> repro.mjs
```

(`--experimental-permission` on Node 20, stable `--permission` on Node 22+.)

Each run gets a fresh `mkdtemp` worktree containing only the files under test,
so a repro can neither read the host repo nor write outside its sandbox. An
8-second timeout kills hung repros. This keeps the "actually ran" guarantee
with zero Docker dependency — the whole point for maintainers on constrained CI.

## Policy (`.patchproof.yml`)

A flat YAML file at the repo root:

```yaml
maxDiffLines: 1000
maxFilesChanged: 20
blockedPaths:
  - ".env"
  - "secrets/"
  - "*.pem"
blockedCommands:
  - "rm -rf"
```

- `blockedPaths` — glob patterns; `*` matches within one path segment, a trailing `/` matches a directory prefix. Patterns are anchored, so `*.pem` hits `keys.pem` but never `pem.md`.
- `blockedCommands` — substring match against *added* lines only.
- Violations are reported per-file and fail the gate (CLI exit code `2`).

## Outputs

- **Markdown** — human report with claim/evidence/verify/patch per finding.
- **JSON** — full machine-readable report (used by the web UI).
- **SARIF 2.1.0** — uploads to the GitHub Security tab via `github/codeql-action/upload-sarif`.

## Threat model & limits (MVP)

- The analyzer is heuristic and intentionally narrow: it proves what it can run, and marks the rest `skipped` rather than guessing. Coverage grows by registering new finding kinds in `src/runner.js`.
- The server (`src/server.js`) is a local demo surface: static files are confined to `public/`, URL decoding failures return 400, and path checks use a separator-aware prefix test.
- LLM enrichment is prose-only by contract; findings, statuses, and patches always come from the deterministic core.
