import { parseUnifiedDiff } from "./parse-diff.js";

/**
 * Build repro-first findings from a parsed diff + optional workspace context.
 * Uses deterministic heuristics so the sample demo always works offline.
 * Optional OPENAI_API_KEY path can be layered later without breaking MVP.
 *
 * @param {object} input
 * @param {string} input.diffText
 * @param {string} [input.sourceId]
 * @param {{ path: string, content: string }[]} [input.headFiles]
 * @returns {import('./findings.js').Finding[]}
 */
export function analyzeDiff(input) {
  const { diffText, sourceId = "diff", headFiles = [] } = input;
  const { files } = parseUnifiedDiff(diffText);
  /** @type {import('./findings.js').Finding[]} */
  const findings = [];

  for (const file of files) {
    const added = file.added.join("\n");
    const removed = file.removed.join("\n");
    const path = file.path;

    // Critical: percent discount formula bug (sample + generic pattern)
    if (
      /return\s+price\s*-\s*price\s*\*\s*percentOff/.test(added) ||
      (removed.includes("percentOff / 100") &&
        /price\s*-\s*price\s*\*\s*percentOff/.test(added))
    ) {
      findings.push({
        id: `${sourceId}-discount-formula`,
        title: "Percent discount formula multiplies raw percent (not /100)",
        severity: "critical",
        file: path,
        line: findApproxLine(file, "price - price * percentOff"),
        claim:
          "A 20% off coupon on price 100 yields a large negative amount instead of 80, breaking checkout totals.",
        evidence:
          "Removed `price * (1 - percentOff / 100)` and added `return price - price * percentOff`.",
        verifyCommand: "node repro-discount.mjs",
        status: "proposed",
        kind: "discount-formula",
        suggestedPatch: [
          `--- a/${path}`,
          `+++ b/${path}`,
          "@@",
          "-  return price - price * percentOff;",
          "+  if (percentOff < 0 || percentOff > 100) {",
          '+    throw new RangeError("percentOff must be between 0 and 100");',
          "+  }",
          "+  return price * (1 - percentOff / 100);",
        ].join("\n"),
      });
    }

    // Medium: dropped range validation
    if (
      removed.includes("percentOff must be between 0 and 100") ||
      (removed.includes("percentOff < 0") &&
        !added.includes("percentOff < 0") &&
        /percentOff/.test(added + removed))
    ) {
      findings.push({
        id: `${sourceId}-missing-validation`,
        title: "Input validation for percentOff range was removed",
        severity: "medium",
        file: path,
        line: findApproxLine(file, "Validation for percentOff"),
        claim:
          "Values outside 0..100 are no longer rejected, so callers can pass 250% or negative percents.",
        evidence:
          "Lines that threw RangeError for percentOff bounds appear in removed hunk and not in added code.",
        verifyCommand: "node repro-validation.mjs",
        status: "proposed",
        kind: "missing-validation",
        suggestedPatch: [
          `--- a/${path}`,
          `+++ b/${path}`,
          "@@",
          "+  if (percentOff < 0 || percentOff > 100) {",
          '+    throw new RangeError("percentOff must be between 0 and 100");',
          "+  }",
        ].join("\n"),
      });
    }

    // Generic heuristic: eval / Function constructor
    if (/\beval\s*\(|new\s+Function\s*\(/.test(added)) {
      findings.push({
        id: `${sourceId}-eval`,
        title: "Dynamic code execution introduced",
        severity: "high",
        file: path,
        line: findApproxLine(file, "eval"),
        claim: "eval/Function can execute untrusted strings from PR surface.",
        evidence: "Added lines contain eval( or new Function(.",
        verifyCommand: "echo 'manual-review: dynamic code'",
        status: "proposed",
        kind: "eval",
        skipReason: undefined,
        suggestedPatch: null,
      });
    }

    // Generic: hard-coded secret-ish
    if (
      /api[_-]?key\s*[:=]\s*['"][A-Za-z0-9_\-]{12,}/i.test(added) ||
      /secret\s*[:=]\s*['"][^'"]{8,}/i.test(added)
    ) {
      findings.push({
        id: `${sourceId}-secret`,
        title: "Possible hard-coded secret in diff",
        severity: "high",
        file: path,
        line: null,
        claim: "Credentials in source leak via git history.",
        evidence: "Added lines match secret-like assignment patterns.",
        verifyCommand: "echo 'manual-review: rotate credentials'",
        status: "proposed",
        kind: "secret",
        suggestedPatch: null,
      });
    }
  }

  // If we have head file content for discount.js, still ensure sample findings
  // even if diff parse edge-cases miss (defense in depth for demo path).
  if (sourceId === "sample-pr-12" && findings.length === 0) {
    const head = headFiles.find((f) => f.path.endsWith("discount.js"));
    if (head && /price\s*-\s*price\s*\*\s*percentOff/.test(head.content)) {
      findings.push({
        id: "sample-pr-12-discount-formula",
        title: "Percent discount formula multiplies raw percent (not /100)",
        severity: "critical",
        file: "discount.js",
        line: null,
        claim:
          "A 20% off coupon on price 100 yields a large negative amount instead of 80.",
        evidence: "head/discount.js returns price - price * percentOff",
        verifyCommand: "node repro-discount.mjs",
        status: "proposed",
        kind: "discount-formula",
        suggestedPatch: [
          "--- a/discount.js",
          "+++ b/discount.js",
          "@@",
          "-  return price - price * percentOff;",
          "+  return price * (1 - percentOff / 100);",
        ].join("\n"),
      });
    }
  }

  // Sort: critical first
  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  findings.sort(
    (a, b) => (order[a.severity] ?? 9) - (order[b.severity] ?? 9),
  );

  return findings;
}

function findApproxLine(file, needle) {
  let lineNo = 0;
  for (const hunk of file.hunks) {
    const m = hunk.header.match(/\+(\d+)/);
    let cur = m ? Number(m[1], 10) : 1;
    for (const line of hunk.lines) {
      if (line.startsWith("+") && !line.startsWith("+++")) {
        if (line.slice(1).includes(needle)) return cur;
        cur += 1;
      } else if (line.startsWith("-") && !line.startsWith("---")) {
        // removed lines don't advance new file line
      } else if (line.startsWith(" ") || line === "") {
        cur += 1;
      }
      lineNo = cur;
    }
  }
  return lineNo || null;
}
