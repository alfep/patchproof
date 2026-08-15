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
 * Minimal YAML reader for the flat `.patchproof.yml` shape:
 * scalar `key: value` lines plus `- item` entries under the most recent key.
 * @param {string} raw
 * @returns {Record<string, number | string[]>}
 */
function parseSimpleYaml(raw) {
  const out = {};
  let currentList = null;
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    if (trimmed.startsWith("- ") && currentList) {
      const item = trimmed.slice(2).trim().replace(/^["']|["']$/g, "");
      if (item) out[currentList].push(item);
      continue;
    }
    const m = trimmed.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (!m) continue;
    const [, key, value] = m;
    if (value === "") {
      out[key] = [];
      currentList = key;
    } else {
      const num = Number(value);
      out[key] = Number.isFinite(num) && value.trim() !== "" ? num : value;
      currentList = null;
    }
  }
  return out;
}

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
    const parsed = parseSimpleYaml(raw);
    const merged = { ...DEFAULT_POLICY };
    for (const key of Object.keys(DEFAULT_POLICY)) {
      if (parsed[key] === undefined) continue;
      if (Array.isArray(DEFAULT_POLICY[key])) {
        if (Array.isArray(parsed[key])) merged[key] = parsed[key];
      } else if (typeof parsed[key] === "number") {
        merged[key] = parsed[key];
      }
    }
    return merged;
  } catch {
    return DEFAULT_POLICY;
  }
}

/**
 * Convert a blocklist glob to an anchored regex.
 * `*` matches within one path segment; a trailing `/` matches a directory prefix.
 * @param {string} pattern
 * @returns {RegExp}
 */
function globToRegExp(pattern) {
  const dirPrefix = pattern.endsWith("/");
  const base = dirPrefix ? pattern.slice(0, -1) : pattern;
  const escaped = base
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, "[^/]*");
  return dirPrefix
    ? new RegExp(`^${escaped}(/|$)`)
    : new RegExp(`^${escaped}$`);
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

  const blockedRegexes = (policy.blockedPaths || []).map((p) => ({
    pattern: p,
    re: globToRegExp(p),
  }));
  for (const file of files) {
    for (const { pattern, re } of blockedRegexes) {
      if (re.test(file.path)) {
        violations.push(`File matches blocked path policy (${pattern}): ${file.path}`);
      }
    }
  }

  const blockedCommands = policy.blockedCommands || [];
  if (blockedCommands.length) {
    for (const file of files) {
      for (const line of file.added || []) {
        for (const cmd of blockedCommands) {
          if (line.includes(cmd)) {
            violations.push(
              `Added line in ${file.path} contains blocked command "${cmd}": ${line.trim().slice(0, 120)}`,
            );
          }
        }
      }
    }
  }

  return { valid: violations.length === 0, violations };
}
