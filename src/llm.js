/**
 * Optional OpenAI enrichment for finding prose (triage story).
 *
 * - Default / judges: offline heuristic engine only (no key required).
 * - With OPENAI_API_KEY: rewrite claim/title wording for clarity (does not invent findings).
 * - Grok (this coding session) is NOT the runtime model — OpenAI API is, if configured.
 */

/**
 * OpenAI-compatible endpoint. Defaults to api.openai.com.
 * For local 9router / OmniRoute: OPENAI_BASE_URL=http://127.0.0.1:20128/v1
 *
 * @returns {{ enabled: boolean, model: string, mode: 'offline'|'openai', baseUrl: string }}
 */
export function getLlmStatus() {
  const key = process.env.OPENAI_API_KEY || "";
  const model = process.env.OPENAI_MODEL || "gpt-5.6";
  const baseUrl = (
    process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
  ).replace(/\/$/, "");
  return {
    enabled: Boolean(key.trim()),
    model,
    baseUrl,
    mode: key.trim() ? "openai" : "offline",
  };
}

/**
 * Enrich findings with clearer human prose via OpenAI when configured.
 * Failures soft-fall back to original findings.
 *
 * @param {import('./findings.js').Finding[]} findings
 * @param {object} ctx
 * @param {string} ctx.diffText
 * @param {string} ctx.title
 * @param {(step: string, detail?: string) => void} [ctx.onProgress]
 * @returns {Promise<{ findings: import('./findings.js').Finding[], llm: object }>}
 */
export async function enrichFindingsWithLlm(findings, ctx) {
  const status = getLlmStatus();
  if (!status.enabled || !findings.length) {
    return {
      findings,
      llm: {
        ...status,
        used: false,
        note: status.enabled
          ? "No findings to enrich"
          : "OPENAI_API_KEY not set — using offline repro-first engine only",
      },
    };
  }

  const onProgress = ctx.onProgress || (() => {});
  onProgress(
    "llm_triage",
    `Enriching claims with ${status.model} (OpenAI API)`,
  );

  try {
    const payload = {
      model: status.model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are the triage layer of PR Autopsy (Repro-First Gate). " +
            "You ONLY rewrite title/claim/evidence for clarity. " +
            "Do not invent new findings. Do not remove verify steps. " +
            "Return JSON: { findings: [{ id, title, claim, evidence }] } matching input ids.",
        },
        {
          role: "user",
          content: JSON.stringify({
            prTitle: ctx.title,
            diffExcerpt: String(ctx.diffText || "").slice(0, 6000),
            findings: findings.map((f) => ({
              id: f.id,
              title: f.title,
              severity: f.severity,
              claim: f.claim,
              evidence: f.evidence,
              file: f.file,
            })),
          }),
        },
      ],
    };

    const res = await fetch(`${status.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      return {
        findings,
        llm: {
          ...status,
          used: false,
          note: `OpenAI API ${res.status}: kept offline wording (${text.slice(0, 180)})`,
        },
      };
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || "{}";
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return {
        findings,
        llm: { ...status, used: false, note: "LLM JSON parse failed — offline wording kept" },
      };
    }

    const byId = new Map(
      (parsed.findings || []).map((f) => [f.id, f]),
    );
    const merged = findings.map((f) => {
      const e = byId.get(f.id);
      if (!e) return f;
      return {
        ...f,
        title: typeof e.title === "string" && e.title.trim() ? e.title.trim() : f.title,
        claim: typeof e.claim === "string" && e.claim.trim() ? e.claim.trim() : f.claim,
        evidence:
          typeof e.evidence === "string" && e.evidence.trim()
            ? e.evidence.trim()
            : f.evidence,
      };
    });

    return {
      findings: merged,
      llm: {
        ...status,
        used: true,
        note: `Claims enriched via OpenAI model ${status.model}`,
      },
    };
  } catch (err) {
    return {
      findings,
      llm: {
        ...status,
        used: false,
        note: `LLM error: ${err.message || err} — offline wording kept`,
      },
    };
  }
}
