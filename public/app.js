const tabs = document.querySelectorAll(".tab");
const modes = {
  sample: document.getElementById("mode-sample"),
  diff: document.getElementById("mode-diff"),
  github: document.getElementById("mode-github"),
};
const runBtn = document.getElementById("runBtn");
const btnLabel = runBtn.querySelector(".btn-label");
const btnSpinner = runBtn.querySelector(".btn-spinner");
const errorEl = document.getElementById("error");
const emptyEl = document.getElementById("empty");
const runningEl = document.getElementById("running");
const progressEl = document.getElementById("progress");
const progressFill = document.getElementById("progressFill");
const reportEl = document.getElementById("report");
const findingsEl = document.getElementById("findings");
const copyBtn = document.getElementById("copyMd");
const rerunBtn = document.getElementById("rerun");
const copyStatus = document.getElementById("copyStatus");
const engineChip = document.getElementById("engineChip");
const llmChip = document.getElementById("llmChip");

let mode = "sample";
let lastMarkdown = "";

const STAGE_PCT = {
  queued: 8,
  parsing: 22,
  analysis: 40,
  llm_triage: 52,
  proposing_repros: 65,
  running: 82,
  patching: 92,
  done: 100,
};

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    mode = tab.dataset.mode;
    tabs.forEach((t) => {
      const on = t === tab;
      t.classList.toggle("active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    Object.entries(modes).forEach(([key, el]) => {
      el.classList.toggle("hidden", key !== mode);
    });
  });
});

async function refreshHealth() {
  try {
    const res = await fetch("/api/health");
    const data = await res.json();
    engineChip.textContent = "engine: offline repro-first";
    if (data.llm?.enabled) {
      llmChip.textContent = `llm: ${data.llm.model} ready`;
      llmChip.classList.add("hot");
      llmChip.classList.remove("muted");
    } else {
      llmChip.textContent = "llm: offline (no OPENAI_API_KEY)";
      llmChip.classList.add("muted");
      llmChip.classList.remove("hot");
    }
  } catch {
    llmChip.textContent = "llm: server offline?";
    llmChip.classList.add("muted");
  }
}

refreshHealth();

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.classList.toggle("hidden", !msg);
}

function setStage(stage) {
  emptyEl.classList.toggle("hidden", stage !== "empty");
  runningEl.classList.toggle("hidden", stage !== "running");
  reportEl.classList.toggle("hidden", stage !== "report");
}

function setBusy(busy) {
  runBtn.disabled = busy;
  btnSpinner.classList.toggle("hidden", !busy);
  btnLabel.textContent = busy ? "Running…" : "Run repro-first autopsy";
}

function renderProgress(items) {
  progressEl.innerHTML = "";
  let pct = 12;
  for (const item of items) {
    const li = document.createElement("li");
    li.innerHTML = `<span class="dot"></span><span><strong>${escapeHtml(item.step)}</strong> — ${escapeHtml(item.detail || "")}</span>`;
    progressEl.appendChild(li);
    if (STAGE_PCT[item.step] != null) pct = STAGE_PCT[item.step];
  }
  progressFill.style.width = `${pct}%`;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderReport(report) {
  document.getElementById("sourceLabel").textContent = report.sourceLabel;
  document.getElementById("reportTitle").textContent = report.title;
  const badge = document.getElementById("riskBadge");
  badge.textContent = `${report.risk.label} · ${report.risk.score}`;
  badge.className = `risk ${report.risk.label}`;
  document.getElementById("riskSummary").textContent = report.risk.summary;

  const llmNote = document.getElementById("llmNote");
  if (report.llm) {
    llmNote.textContent = `LLM: ${report.llm.mode}${report.llm.used ? " · enriched" : ""} — ${report.llm.note || ""}`;
  } else {
    llmNote.textContent = "";
  }

  const fails = report.findings.filter((f) => f.status === "ran-fail").length;
  const passes = report.findings.filter((f) => f.status === "ran-pass").length;
  const patches = report.findings.filter((f) => f.suggestedPatch).length;
  const statRow = document.getElementById("statRow");
  statRow.innerHTML = `
    <span class="stat">${report.findings.length} findings</span>
    <span class="stat hot">${fails} verified fail</span>
    <span class="stat ok">${passes} verified pass</span>
    <span class="stat">${patches} patch ready</span>
  `;

  lastMarkdown = report.markdown || "";
  findingsEl.innerHTML = "";

  for (const f of report.findings) {
    const card = document.createElement("article");
    card.className = "card";
    const loc = f.line != null ? `${f.file}:${f.line}` : f.file;
    card.innerHTML = `
      <div class="card-head">
        <h3>${escapeHtml(f.title)}</h3>
        <div class="badges">
          <span class="badge ${escapeHtml(f.severity)}">${escapeHtml(f.severity)}</span>
          <span class="badge ${escapeHtml(f.status)}">${escapeHtml(f.status)}</span>
        </div>
      </div>
      <div class="card-body">
        <div><strong>Location</strong> · <code>${escapeHtml(loc)}</code></div>
        <div><strong>Claim</strong> · ${escapeHtml(f.claim)}</div>
        <div><strong>Evidence</strong> · ${escapeHtml(f.evidence)}</div>
        <div><strong>Verify</strong> · <code>${escapeHtml(f.verifyCommand)}</code></div>
        ${f.skipReason ? `<div><strong>Skip</strong> · ${escapeHtml(f.skipReason)}</div>` : ""}
        ${
          f.runOutput
            ? `<div><strong>Run output</strong><pre>${escapeHtml(f.runOutput.trim().slice(0, 2500))}</pre></div>`
            : ""
        }
        ${
          f.suggestedPatch
            ? `<div><strong>Suggested patch</strong><pre>${escapeHtml(f.suggestedPatch)}</pre></div>`
            : ""
        }
      </div>
    `;
    findingsEl.appendChild(card);
  }
  setStage("report");
}

async function runAutopsyUi() {
  showError("");
  copyStatus.textContent = "";
  setStage("running");
  progressFill.style.width = "8%";
  renderProgress([{ step: "queued", detail: "Sending autopsy request" }]);
  setBusy(true);

  const body = {
    source: mode,
    execute: document.getElementById("execute").checked,
    useLlm: document.getElementById("useLlm").checked,
  };
  if (mode === "diff") body.diffText = document.getElementById("diffText").value;
  if (mode === "github") body.githubUrl = document.getElementById("githubUrl").value;

  try {
    const res = await fetch("/api/autopsy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.progress) renderProgress(data.progress);
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    progressFill.style.width = "100%";
    renderReport(data.report);
  } catch (err) {
    setStage("empty");
    showError(err.message || String(err));
  } finally {
    setBusy(false);
  }
}

runBtn.addEventListener("click", runAutopsyUi);
rerunBtn.addEventListener("click", runAutopsyUi);

copyBtn.addEventListener("click", async () => {
  if (!lastMarkdown) return;
  try {
    await navigator.clipboard.writeText(lastMarkdown);
    copyStatus.textContent = "Copied.";
  } catch {
    copyStatus.textContent = "Copy failed — use CLI markdown instead.";
  }
});

// Demo-friendly: Ctrl/Cmd+Enter runs sample autopsy from anywhere
document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
    e.preventDefault();
    if (!runBtn.disabled) runAutopsyUi();
  }
});
