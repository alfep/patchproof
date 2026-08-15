import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseUnifiedDiff, parseGithubPrUrl } from "../src/parse-diff.js";
import { analyzeDiff } from "../src/analyze.js";
import { computeRisk, reportToMarkdown, reportToSarif } from "../src/findings.js";
import { checkPolicy } from "../src/policy.js";
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
    assert.match(report.markdown, /PR Autopsy Report/);
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
});
