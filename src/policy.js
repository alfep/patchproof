import fs from "node:fs/promises";
import path from "node:path";
import { parseUnifiedDiff } from "./parse-diff.js";

const DEFAULT_POLICY = {
  maxDiffLines: 1000,
  maxFilesChanged: 20,
  blockedPaths: [".env", "secrets/", "node_modules/", "vendor/", "*.pem", "*.key"],
  blockedCommands: ["rm -rf", "curl", "wget", "eval", "sh -c", "bash -c"],
};

/**
 * Load policy from .patchproof.yml in workspace, or use defaults.
 * @param {string} [workspaceDir]
 * @returns {Promise<typeof DEFAULT_POLICY>}
 */
export async function loadPolicy(workspaceDir) {
  if (!workspaceDir) return DEFAULT_POLICY;
  const policyFile = path.join(workspaceDir, ".patchproof.yml");
  try {
    const raw = await fs.readFile(policyFile, "utf8");
    const parsed = {};
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("maxDiffLines:")) {
        parsed.maxDiffLines = parseInt(trimmed.split(":")[1].trim(), 10);
      } else if (trimmed.startsWith("maxFilesChanged:")) {
        parsed.maxFilesChanged = parseInt(trimmed.split(":")[1].trim(), 10);
      }
    }
    return { ...DEFAULT_POLICY, ...parsed };
  } catch {
    return DEFAULT_POLICY;
  }
}

/**
 * Validate diff against policy.
 * @param {string} diffText
 * @param {typeof DEFAULT_POLICY} [policy]
 * @returns {{ valid: boolean, violations: string[] }}
 */
export function checkPolicy(diffText, policy = DEFAULT_POLICY) {
  const violations = [];
  const lines = diffText.split("\n");
  if (lines.length > policy.maxDiffLines) {
    violations.push(`Diff exceeds maximum lines limit (${lines.length} > ${policy.maxDiffLines})`);
  }

  const { files } = parseUnifiedDiff(diffText);
  if (files.length > policy.maxFilesChanged) {
    violations.push(`Diff changes too many files (${files.length} > ${policy.maxFilesChanged})`);
  }

  for (const file of files) {
    for (const blocked of policy.blockedPaths) {
      const pattern = blocked.replace("*", ".*");
      if (new RegExp(pattern).test(file.path)) {
        violations.push(`File matches blocked path policy: ${file.path}`);
      }
    }
  }

  return { valid: violations.length === 0, violations };
}
