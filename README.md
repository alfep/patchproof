# PatchProof — Local-First PR Gate for OSS Maintainers

> Don't ask AI to "review" a PR — make it **prove** risk with verification, then attach a patch trail.

Generic AI code review stops at opinions. **PatchProof** forces each serious finding into a **repro-first card**: claim → evidence in the diff → verify command → `ran-pass` / `ran-fail` → suggested patch.

Runs locally in an isolated sandbox using Node's permission model. Zero Docker required.

## Quick start

```bash
# Node 18+ (Node 22+ recommended for permission sandbox)
node src/cli.js --sample
```

Or launch the UI:

```bash
npm start
# open http://localhost:3847
# click "Broken PR #12" -> Run repro-first autopsy
```

Expected sample outcome:

- **>=1 critical finding** on discount formula (`price - price * percentOff`)
- Verification **actually runs in isolated sandbox** and ends **`ran-fail`**
- **Suggested patch** restoring `price * (1 - percentOff / 100)` (+ validation)
- Output formats: Markdown, JSON, SARIF (for GitHub Security tab)

## Features

- **Local-First & Offline Engine:** Deterministic analyzer + Node permission sandbox. Works with zero API keys.
- **SARIF Export:** Native integration with GitHub Security tab (`--sarif`).
- **Policy Enforcement:** `.patchproof.yml` enforces file count, diff size, and path blocklists.
- **Node Permission Sandbox:** Repro scripts execute with `--permission --allow-fs-read` confined strictly to the temporary worktree.
- **Optional LLM Polish:** Add `OPENAI_API_KEY` to enrich prose explanations (never invents findings).

## CLI

```bash
node src/cli.js --sample              # Broken PR #12 (offline)
node src/cli.js --diff path/to.pr.diff
node src/cli.js --github https://github.com/owner/repo/pull/123
node src/cli.js --sample --json       # JSON report
node src/cli.js --sample --sarif      # SARIF format (GitHub Security tab)
node src/cli.js --sample --no-execute # analyze only
```

Exit codes: `0` ok, `2` if any finding `ran-fail`, `1` error.

## GitHub Action Integration

Add `.github/workflows/patchproof-check.yml`:

```yaml
name: PatchProof Check
on: [pull_request]
jobs:
  patchproof:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - name: Run PatchProof
        run: |
          git diff origin/${{ github.base_ref }}...HEAD > pr.diff
          node src/cli.js --diff pr.diff --sarif > patchproof-results.sarif || true
      - uses: github/codeql-action/upload-sarif@v3
        with: { sarif_file: patchproof-results.sarif }
```

## Policy Configuration (`.patchproof.yml`)

```yaml
maxDiffLines: 1000
maxFilesChanged: 20
blockedPaths:
  - ".env"
  - "secrets/"
  - "*.pem"
```

## API

`POST /api/autopsy`

```json
{
  "source": "sample",
  "execute": true
}
```

Optional env: `GITHUB_TOKEN`, `PORT` (default `3847`).

## Tests

```bash
npm test
```

Tests drive the **real** `runAutopsy({ source: "sample" })` path and assert verified fail + patch + risk.

## License

MIT
