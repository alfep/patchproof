# Contributing to PatchProof

Thank you for your interest in contributing!

## Development Setup

```bash
git clone https://github.com/patchproof/patchproof.git
cd patchproof
npm install
npm test
```

## Architecture Overview

- `src/autopsy.js`: Main pipeline driver.
- `src/analyze.js`: Offline heuristic analyzer.
- `src/runner.js`: Isolated repro execution runner using Node permission model.
- `src/policy.js`: Policy enforcement engine.
- `src/findings.js`: Finding model, risk scoring, Markdown & SARIF output.
- `src/cli.js`: CLI entry point.

## Rules

1. All new heuristics must operate offline by default without requiring external API keys.
2. Repro executions must run within the sandbox workspace.
3. Tests must pass (`npm test`).
