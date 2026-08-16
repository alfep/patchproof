import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseUnifiedDiff, parseGithubPrUrl } from "../src/parse-diff.js";
import { analyzeDiff } from "../src/analyze.js";
import { computeRisk, reportToMarkdown, reportToSarif } from "../src/findings.js";
import { checkPolicy, loadPolicy } from "../src/policy.js";
import { runAutopsy } from "../src/autopsy.js";
import { getLlmStatus } from "../src/llm.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

describe("parseUnifiedDiff", () => {
  it("parses sample PR diff files and added lines", async () => {
    const diffText = await fs.readFile(
      path.join(ROOT, "fixtures/sample-pr-12/pr.diff"),
      "utf8",
    );
    const { files } = parseUnifiedDiff(diffText);
    assert.equal(files.length, 1);
    assert.equal(files[0].path, "discount.js");
    assert.ok(files[0].added.some((l) => l.includes("price * percentOff")));
    assert.ok(files[0].removed.some((l) => l.includes("percentOff / 100")));
  });
});

describe("parseGithubPrUrl", () => {
  it("extracts owner repo number", () => {
    const p = parseGithubPrUrl("https://github.com/openai/codex/pull/42");
    assert.deepEqual(p, { owner: "openai", repo: "codex", number: 42 });
  });
  it("returns null for garbage", () => {
    assert.equal(parseGithubPrUrl("not-a-url"), null);
  });
});

describe("analyzeDiff sample fixture", () => {
  it("emits critical formula finding with suggested patch", async () => {
    const diffText = await fs.readFile(
      path.join(ROOT, "fixtures/sample-pr-12/pr.diff"),
      "utf8",
    );
    const findings = analyzeDiff({ diffText, sourceId: "sample-pr-12" });
    assert.ok(findings.length >= 1);
    const critical = findings.find((f) => f.kind === "discount-formula");
    assert.ok(critical, "expected discount-formula finding");
    assert.equal(critical.severity, "critical");
    assert.ok(critical.suggestedPatch.includes("percentOff / 100"));
    assert.ok(critical.verifyCommand.includes("repro-discount"));
  });
});

describe("runAutopsy sample path (real entry)", () => {
  it("runs end-to-end: verified fail + risk HIGH/CRITICAL + markdown", async () => {
    const report = await runAutopsy({
      source: "sample",
      execute: true,
      useLlm: false, // offline path must not depend on API keys
    });

    assert.equal(report.source, "sample");
    assert.match(report.title, /Broken PR #12/);
    assert.ok(report.findings.length >= 1);
    assert.equal(report.llm.used, false);
    assert.equal(report.engine.core, "offline-repro-first");

    const formula = report.findings.find((f) => f.kind === "discount-formula");
    assert.ok(formula);
    assert.equal(formula.status, "ran-fail");
    assert.ok(formula.runOutput);
    assert.match(formula.runOutput, /FAIL|expected|negative/i);
    assert.ok(formula.suggestedPatch);

    const validation = report.findings.find((f) => f.kind === "missing-validation");
    if (validation) {
      assert.equal(validation.status, "ran-fail");
    }

    assert.ok(["HIGH", "CRITICAL"].includes(report.risk.label));
    assert.ok(report.risk.score >= 45);
    assert.match(report.risk.summary, /verified fail/i);
    assert.ok(report.policy, "report should carry policy result");
    assert.equal(report.policy.valid, true);
    assert.match(report.markdown, /PatchProof Report/);
    assert.match(report.markdown, /Suggested patch/);
  });
});

describe("getLlmStatus", () => {
  it("reports offline when no OPENAI_API_KEY", () => {
    const prev = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    const s = getLlmStatus();
    assert.equal(s.enabled, false);
    assert.equal(s.mode, "offline");
    if (prev !== undefined) process.env.OPENAI_API_KEY = prev;
  });
});

describe("computeRisk + reportToMarkdown", () => {
  it("scores verified fails higher", () => {
    const base = {
      id: "x",
      title: "t",
      severity: "critical",
      file: "f.js",
      line: 1,
      claim: "c",
      evidence: "e",
      verifyCommand: "echo",
      suggestedPatch: "p",
    };
    const a = computeRisk([{ ...base, status: "proposed" }]);
    const b = computeRisk([{ ...base, status: "ran-fail" }]);
    assert.ok(b.score >= a.score);
    const md = reportToMarkdown({
      sourceLabel: "test",
      title: "T",
      risk: b,
      findings: [{ ...base, status: "ran-fail", runOutput: "FAIL" }],
    });
    assert.match(md, /ran-fail/);
  });
});

describe("reportToMarkdown policy section", () => {
  const baseFinding = {
    id: "x",
    title: "t",
    severity: "medium",
    file: "f.js",
    line: 1,
    claim: "c",
    evidence: "e",
    verifyCommand: "echo ok",
    suggestedPatch: null,
    status: "skipped",
  };

  it("shows policy pass when valid", () => {
    const md = reportToMarkdown({
      sourceLabel: "test",
      title: "T",
      risk: computeRisk([baseFinding]),
      findings: [baseFinding],
      policy: { valid: true, violations: [] },
    });
    assert.match(md, /\*\*Policy:\*\* pass/);
  });

  it("lists violations when policy fails", () => {
    const md = reportToMarkdown({
      sourceLabel: "test",
      title: "T",
      risk: computeRisk([baseFinding]),
      findings: [baseFinding],
      policy: {
        valid: false,
        violations: [
          "File matches blocked path policy (.env): .env",
          "Diff exceeds maximum lines limit (1500 > 1000)",
        ],
      },
    });
    assert.match(md, /\*\*Policy:\*\* FAIL — 2/);
    assert.match(md, /blocked path policy/);
    assert.match(md, /maximum lines limit/);
  });

  it("omits policy section when report has no policy", () => {
    const md = reportToMarkdown({
      sourceLabel: "test",
      title: "T",
      risk: computeRisk([baseFinding]),
      findings: [baseFinding],
    });
    assert.doesNotMatch(md, /\*\*Policy:\*\*/);
  });
});

describe("reportToSarif", () => {
  it("generates valid SARIF structure", () => {
    const report = {
      findings: [
        {
          id: "f1",
          kind: "discount-formula",
          title: "Formula error",
          severity: "critical",
          claim: "Claim text",
          evidence: "Evidence text",
          file: "discount.js",
          line: 10,
          status: "ran-fail",
        },
      ],
    };
    const sarif = reportToSarif(report);
    assert.equal(sarif.version, "2.1.0");
    assert.equal(sarif.runs[0].tool.driver.name, "PatchProof");
    assert.equal(sarif.runs[0].results.length, 1);
    assert.equal(sarif.runs[0].results[0].level, "error");
  });
});

describe("checkPolicy", () => {
  it("flags blocked paths in diff", () => {
    const diff = "diff --git a/.env b/.env\n+SECRET=123";
    const res = checkPolicy(diff, {
      maxDiffLines: 1000,
      maxFilesChanged: 20,
      blockedPaths: [".env"],
      blockedCommands: [],
    });
    assert.equal(res.valid, false);
    assert.ok(res.violations.some((v) => v.includes(".env")));
  });

  it("passes clean diff", () => {
    const diff = "diff --git a/app.js b/app.js\n+console.log('hi');";
    const res = checkPolicy(diff, {
      maxDiffLines: 1000,
      maxFilesChanged: 20,
      blockedPaths: [".env"],
      blockedCommands: [],
    });
    assert.equal(res.valid, true);
  });

  it("matches glob patterns anchored (*.pem hits keys.pem, not pem.md)", () => {
    const policy = {
      maxDiffLines: 1000,
      maxFilesChanged: 20,
      blockedPaths: ["*.pem", "secrets/"],
      blockedCommands: [],
    };
    const hit = checkPolicy("diff --git a/keys.pem b/keys.pem\n+x", policy);
    assert.equal(hit.valid, false);
    const miss = checkPolicy("diff --git a/pem.md b/pem.md\n+x", policy);
    assert.equal(miss.valid, true);
    const dirHit = checkPolicy("diff --git a/secrets/prod.json b/secrets/prod.json\n+x", policy);
    assert.equal(dirHit.valid, false);
  });

  it("flags blocked commands in added lines", () => {
    const diff = [
      "diff --git a/deploy.sh b/deploy.sh",
      "--- a/deploy.sh",
      "+++ b/deploy.sh",
      "@@ -1,1 +1,2 @@",
      " echo deploy",
      "+rm -rf /",
    ].join("\n");
    const res = checkPolicy(diff, {
      maxDiffLines: 1000,
      maxFilesChanged: 20,
      blockedPaths: [],
      blockedCommands: ["rm -rf"],
    });
    assert.equal(res.valid, false);
    assert.ok(res.violations.some((v) => v.includes("rm -rf")));
  });
});

describe("loadPolicy", () => {
  it("parses .patchproof.yml lists and scalars", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "patchproof-policy-"));
    await fs.writeFile(
      path.join(dir, ".patchproof.yml"),
      [
        "maxDiffLines: 50",
        "maxFilesChanged: 3",
        "blockedPaths:",
        '  - ".env"',
        '  - "*.pem"',
        "blockedCommands:",
        '  - "rm -rf"',
        "",
      ].join("\n"),
      "utf8",
    );
    const policy = await loadPolicy(dir);
    assert.equal(policy.maxDiffLines, 50);
    assert.equal(policy.maxFilesChanged, 3);
    assert.deepEqual(policy.blockedPaths, [".env", "*.pem"]);
    assert.deepEqual(policy.blockedCommands, ["rm -rf"]);
    await fs.rm(dir, { recursive: true, force: true });
  });
});
