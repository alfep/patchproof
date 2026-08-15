#!/usr/bin/env node
import { runAutopsy } from "./autopsy.js";
import { reportToSarif } from "./findings.js";

function printHelp() {
  console.log(`PatchProof: Local-First Repro-First PR Gate

Usage:
  node src/cli.js --sample
  node src/cli.js --diff path/to/file.diff
  node src/cli.js --github https://github.com/owner/repo/pull/123

Options:
  --sample          Run Broken PR #12 fixture (always works offline)
  --diff <path>     Analyze a unified diff file
  --github <url>    Fetch a public GitHub PR diff
  --json            Print full JSON report
  --sarif           Print SARIF format (for GitHub Security)
  --no-execute      Analyze only; do not run repro scripts
  --no-llm          Skip optional LLM claim enrichment
  -h, --help        Show help
`);
}

function parseArgs(argv) {
  const opts = {
    source: null,
    diffPath: null,
    githubUrl: null,
    json: false,
    sarif: false,
    execute: true,
    useLlm: true,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--sample") opts.source = "sample";
    else if (a === "--json") opts.json = true;
    else if (a === "--sarif") opts.sarif = true;
    else if (a === "--no-execute") opts.execute = false;
    else if (a === "--no-llm") opts.useLlm = false;
    else if (a === "--diff") {
      opts.source = "diff";
      opts.diffPath = argv[++i];
    } else if (a === "--github") {
      opts.source = "github";
      opts.githubUrl = argv[++i];
    } else if (a === "-h" || a === "--help") opts.help = true;
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help || !opts.source) {
    printHelp();
    process.exit(opts.help ? 0 : 1);
  }

  let diffText;
  if (opts.source === "diff") {
    if (!opts.diffPath) {
      console.error("--diff requires a path");
      process.exit(1);
    }
    const fs = await import("node:fs/promises");
    diffText = await fs.readFile(opts.diffPath, "utf8");
  }

  const report = await runAutopsy({
    source: opts.source,
    diffText,
    githubUrl: opts.githubUrl,
    execute: opts.execute,
    useLlm: opts.useLlm,
    onProgress: (step, detail) => {
      if (!opts.json && !opts.sarif) console.error(`[${step}] ${detail || ""}`);
    },
  });

  if (opts.sarif) {
    console.log(JSON.stringify(reportToSarif(report), null, 2));
  } else if (opts.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(report.markdown);
    console.error(`\n${report.risk.summary}`);
  }

  const hasFail = report.findings.some((f) => f.status === "ran-fail");
  const policyBlocked = report.policy && !report.policy.valid;
  process.exit(hasFail || policyBlocked ? 2 : 0);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
