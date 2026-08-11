/**
 * Minimal unified-diff parser for autopsy input.
 * @param {string} diffText
 * @returns {{ files: Array<{ path: string, hunks: Array<{ header: string, lines: string[] }>, added: string[], removed: string[] }> }}
 */
export function parseUnifiedDiff(diffText) {
  if (typeof diffText !== "string") {
    throw new TypeError("diffText must be a string");
  }

  const files = [];
  let current = null;

  const lines = diffText.replace(/\r\n/g, "\n").split("\n");
  for (const line of lines) {
    if (line.startsWith("diff --git ")) {
      current = {
        path: extractPathFromDiffGit(line),
        hunks: [],
        added: [],
        removed: [],
      };
      files.push(current);
      continue;
    }
    if (!current) continue;

    if (line.startsWith("--- ") || line.startsWith("+++ ")) {
      const p = line.slice(4).trim();
      if (p !== "/dev/null") {
        const cleaned = p.replace(/^[ab]\//, "");
        if (cleaned) current.path = cleaned;
      }
      continue;
    }

    if (line.startsWith("@@")) {
      current.hunks.push({ header: line, lines: [] });
      continue;
    }

    const hunk = current.hunks[current.hunks.length - 1];
    if (!hunk) continue;

    hunk.lines.push(line);
    if (line.startsWith("+") && !line.startsWith("+++")) {
      current.added.push(line.slice(1));
    } else if (line.startsWith("-") && !line.startsWith("---")) {
      current.removed.push(line.slice(1));
    }
  }

  return { files };
}

function extractPathFromDiffGit(line) {
  // diff --git a/foo.js b/foo.js
  const m = line.match(/diff --git a\/(.+?) b\/(.+)$/);
  if (m) return m[2];
  return "unknown";
}

/**
 * @param {string} url
 * @returns {{ owner: string, repo: string, number: number } | null}
 */
export function parseGithubPrUrl(url) {
  if (typeof url !== "string") return null;
  const m = url.trim().match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/i,
  );
  if (!m) return null;
  return { owner: m[1], repo: m[2], number: Number(m[3], 10) };
}
