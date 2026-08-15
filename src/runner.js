import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

/**
 * @param {import('./findings.js').Finding[]} findings
 * @param {object} ctx
 * @param {string} [ctx.workspaceDir] - directory with head files for execution
 * @param {boolean} [ctx.execute] - if false, mark runnable ones proposed only
 * @returns {Promise<import('./findings.js').Finding[]>}
 */
export async function runVerifications(findings, ctx = {}) {
  const execute = ctx.execute !== false;
  const workspaceDir =
    ctx.workspaceDir ||
    (await fs.mkdtemp(path.join(os.tmpdir(), "pr-autopsy-")));

  const out = [];
  for (const finding of findings) {
    const next = { ...finding };
    if (!execute) {
      out.push(next);
      continue;
    }

    if (finding.kind === "discount-formula") {
      Object.assign(next, await runDiscountRepro(workspaceDir));
    } else if (finding.kind === "missing-validation") {
      Object.assign(next, await runValidationRepro(workspaceDir));
    } else if (
      finding.verifyCommand.startsWith("echo ") ||
      finding.kind === "eval" ||
      finding.kind === "secret"
    ) {
      next.status = "skipped";
      next.skipReason =
        finding.skipReason ||
        "No automated sandbox for this heuristic in MVP; left for human verify.";
      next.runOutput = "";
      next.exitCode = null;
    } else {
      next.status = "skipped";
      next.skipReason = "No runner registered for this finding kind.";
    }
    out.push(next);
  }
  return out;
}

async function ensureDiscountModule(workspaceDir) {
  const candidate = path.join(workspaceDir, "discount.js");
  try {
    await fs.access(candidate);
    return candidate;
  } catch {
    // fall back to sample head
    const sampleHead = path.join(
      ROOT,
      "fixtures",
      "sample-pr-12",
      "head",
      "discount.js",
    );
    await fs.copyFile(sampleHead, candidate);
    return candidate;
  }
}

async function runDiscountRepro(workspaceDir) {
  await ensureDiscountModule(workspaceDir);
  const reproPath = path.join(workspaceDir, "repro-discount.mjs");
  const repro = `
import { discountedPrice } from './discount.js';

const price = 100;
const percentOff = 20;
const got = discountedPrice(price, percentOff);
const expected = 80;

console.log(JSON.stringify({ price, percentOff, got, expected }, null, 2));

if (typeof got !== 'number' || Number.isNaN(got)) {
  console.error('FAIL: non-numeric result');
  process.exit(1);
}
if (got < 0) {
  console.error('FAIL: negative total — formula almost certainly wrong');
  process.exit(1);
}
if (Math.abs(got - expected) > 0.001) {
  console.error('FAIL: expected', expected, 'got', got);
  process.exit(1);
}
console.log('PASS');
process.exit(0);
`.trimStart();
  await fs.writeFile(reproPath, repro, "utf8");

  const result = await spawnCapture(
    process.execPath,
    ["repro-discount.mjs"],
    { cwd: workspaceDir, timeoutMs: 8000 },
  );

  return {
    status: result.exitCode === 0 ? "ran-pass" : "ran-fail",
    exitCode: result.exitCode,
    runOutput: result.output,
    verifyCommand: "node repro-discount.mjs",
  };
}

async function runValidationRepro(workspaceDir) {
  await ensureDiscountModule(workspaceDir);
  const reproPath = path.join(workspaceDir, "repro-validation.mjs");
  const repro = `
import { discountedPrice } from './discount.js';

let threw = false;
try {
  discountedPrice(100, 250);
} catch (e) {
  threw = true;
  console.log('threw:', e && e.name, e && e.message);
}

if (!threw) {
  console.error('FAIL: percentOff=250 should be rejected');
  process.exit(1);
}
console.log('PASS: validation rejected out-of-range percent');
process.exit(0);
`.trimStart();
  await fs.writeFile(reproPath, repro, "utf8");

  const result = await spawnCapture(
    process.execPath,
    ["repro-validation.mjs"],
    { cwd: workspaceDir, timeoutMs: 8000 },
  );

  return {
    status: result.exitCode === 0 ? "ran-pass" : "ran-fail",
    exitCode: result.exitCode,
    runOutput: result.output,
    verifyCommand: "node repro-validation.mjs",
  };
}

/**
 * @param {string} cmd
 * @param {string[]} args
 * @param {{ cwd: string, timeoutMs?: number }} opts
 */
function spawnCapture(cmd, args, opts) {
  return new Promise((resolve) => {
    // Add Node permission flags for isolated execution without Docker.
    // The permission model is `--experimental-permission` on Node 20 and the
    // stable `--permission` flag from Node 22 onward.
    const major = Number(process.versions.node.split(".")[0]);
    const permFlag = major >= 22 ? "--permission" : "--experimental-permission";
    const permissionArgs = [
      permFlag,
      `--allow-fs-read=${opts.cwd}`,
      `--allow-fs-write=${opts.cwd}`,
      ...args,
    ];
    const child = spawn(cmd, permissionArgs, {
      cwd: opts.cwd,
      env: { FORCE_COLOR: "0" },
      windowsHide: true,
    });
    let output = "";
    const onData = (buf) => {
      output += buf.toString("utf8");
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);

    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      resolve({ exitCode: 124, output: output + "\n[timeout]" });
    }, opts.timeoutMs ?? 8000);

    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({ exitCode: 1, output: String(err) });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ exitCode: code ?? 1, output });
    });
  });
}

export function getSampleFixturePaths() {
  const base = path.join(ROOT, "fixtures", "sample-pr-12");
  return {
    root: base,
    diff: path.join(base, "pr.diff"),
    meta: path.join(base, "meta.json"),
    headDir: path.join(base, "head"),
    baseDir: path.join(base, "base"),
  };
}
