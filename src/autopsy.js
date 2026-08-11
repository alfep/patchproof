import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { analyzeDiff } from "./analyze.js";
import { computeRisk, reportToMarkdown } from "./findings.js";
import { enrichFindingsWithLlm, getLlmStatus } from "./llm.js";
import { getSampleFixturePaths, runVerifications } from "./runner.js";
import { parseGithubPrUrl } from "./parse-diff.js";

/**
 * @typedef {'sample'|'diff'|'github'} AutopsySource
 */

/**
 * Run full autopsy pipeline with progress events.
 * @param {object} options
 * @param {AutopsySource} options.source
 * @param {string} [options.diffText]
 * @param {string} [options.githubUrl]
 * @param {boolean} [options.execute]
 * @param {(step: string, detail?: string) => void} [options.onProgress]
 */
export async function runAutopsy(options) {
  const onProgress = options.onProgress || (() => {});
  const execute = options.execute !== false;

  onProgress("parsing", "Loading input");

  let diffText = options.diffText || "";
  let title = "Custom diff";
  let sourceLabel = "pasted-diff";
  let sourceId = "diff";
  /** @type {{ path: string, content: string }[]} */
  let headFiles = [];
  let workspaceDir = await fs.mkdtemp(path.join(os.tmpdir(), "pr-autopsy-ws-"));

  if (options.source === "sample") {
    const fix = getSampleFixturePaths();
    diffText = await fs.readFile(fix.diff, "utf8");
    const meta = JSON.parse(await fs.readFile(fix.meta, "utf8"));
    title = meta.title;
    sourceLabel = `sample:${meta.id}`;
    sourceId = meta.id;
    const headDiscount = await fs.readFile(
      path.join(fix.headDir, "discount.js"),
      "utf8",
    );
    headFiles = [{ path: "discount.js", content: headDiscount }];
    await fs.writeFile(path.join(workspaceDir, "discount.js"), headDiscount);
    onProgress("parsing", "Loaded Broken PR #12 fixture");
  } else if (options.source === "github") {
    const parsed = parseGithubPrUrl(options.githubUrl || "");
    if (!parsed) {
      throw new Error(
        "Invalid GitHub PR URL. Expected https://github.com/owner/repo/pull/123",
      );
    }
    onProgress("parsing", `Fetching ${parsed.owner}/${parsed.repo}#${parsed.number}`);
    const api = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/pulls/${parsed.number}`;
    const res = await fetch(api, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "pr-autopsy-repro-first-gate",
        ...(process.env.GITHUB_TOKEN
          ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
          : {}),
      },
    });
    if (!res.ok) {
      throw new Error(
        `GitHub API ${res.status}: cannot load PR. Use a public PR or set GITHUB_TOKEN, or paste a diff / use sample.`,
      );
    }
    const pr = await res.json();
    title = pr.title || `PR #${parsed.number}`;
    sourceLabel = `github:${parsed.owner}/${parsed.repo}#${parsed.number}`;
    sourceId = `gh-${parsed.owner}-${parsed.repo}-${parsed.number}`;

    const diffRes = await fetch(pr.diff_url || `${api}.diff`, {
      headers: {
        Accept: "application/vnd.github.v3.diff",
        "User-Agent": "pr-autopsy-repro-first-gate",
        ...(process.env.GITHUB_TOKEN
          ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
          : {}),
      },
    });
    if (!diffRes.ok) {
      throw new Error(`Failed to fetch PR diff (${diffRes.status})`);
    }
    diffText = await diffRes.text();
  } else {
    if (!diffText.trim()) {
      throw new Error("diffText is required when source is 'diff'");
    }
    sourceLabel = "pasted-diff";
  }

  onProgress("analysis", "Triage risk regions in diff (offline engine)");
  let findings = analyzeDiff({ diffText, sourceId, headFiles });

  // Optional OpenAI prose enrichment — never invents findings; sample stays offline-safe.
  const useLlm = options.useLlm !== false;
  let llmMeta = { ...getLlmStatus(), used: false, note: "skipped" };
  if (useLlm) {
    const enriched = await enrichFindingsWithLlm(findings, {
      diffText,
      title,
      onProgress,
    });
    findings = enriched.findings;
    llmMeta = enriched.llm;
  } else {
    llmMeta = {
      ...getLlmStatus(),
      used: false,
      note: "LLM enrichment disabled for this run",
    };
  }

  onProgress("proposing_repros", `${findings.length} finding(s) with verify steps`);
  onProgress("running", execute ? "Executing repro scripts" : "Skip execution");
  findings = await runVerifications(findings, { workspaceDir, execute });

  onProgress("patching", "Attaching suggested patches");
  const risk = computeRisk(findings);
  const report = {
    id: `${sourceId}-${Date.now()}`,
    source: options.source,
    sourceLabel,
    title,
    findings,
    risk,
    llm: llmMeta,
    engine: {
      core: "offline-repro-first",
      optionalTriage: llmMeta.mode,
    },
    stages: [
      "parsing",
      "analysis",
      "llm_triage",
      "proposing_repros",
      "running",
      "patching",
      "done",
    ],
    generatedAt: new Date().toISOString(),
  };
  report.markdown = reportToMarkdown(report);
  onProgress("done", risk.summary);
  return report;
}
