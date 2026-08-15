# Checklist submit + draft teks Devpost

## Apakah butuh model AI (9router / OpenAI / dll.)?

| Keperluan | Butuh model? | Keterangan |
|-----------|--------------|------------|
| **Demo juri / `npm start` / Broken PR #12** | **Tidak** | Engine offline sudah cukup |
| **Tes, CLI, risk CRITICAL** | **Tidak** | Tidak perlu 9router |
| **Optional polish teks claim** | Opsional | Bisa lewat OpenAI cloud **atau** 9router lokal |
| **Submit Build Week (cerita Codex + GPT-5.6)** | **Cerita + session Codex** | 9router **bukan** pengganti Codex `/feedback` ID |

### 9router di PC kamu

- Proses: `9router` (node) biasanya **`-p 20128`**
- Model list contoh: `C:\AAAALSYAH\9router_all_models.json`
- Bisa dipakai sebagai **proxy OpenAI-compatible** untuk fitur *opsional* di PR Autopsy

```powershell
# Hanya jika mau coba claim-polish lewat 9router (BUKAN wajib demo)
$env:OPENAI_BASE_URL = "http://127.0.0.1:20128/v1"
$env:OPENAI_API_KEY  = "<API key dari config 9router/omniroute kamu>"
$env:OPENAI_MODEL    = "gh/gpt-5-mini"   # atau model yang muncul di list 9router
npm start
```

Centang **Optional OpenAI claim polish** di UI.  
Kalau 9router error/timeout → uncentang; demo sample **tetap jalan**.

**Penting hackathon:** di video/README tetap sebut **Codex** + **GPT-5.6**. 9router = tooling lokalmu, bukan track requirement.

---

## Draft teks itu ngapain? Harus bikin MD?

**Ngapain:** teks siap **copy-paste** ke form Devpost (judul, deskripsi, built with, dll.) supaya tidak ngetik dari nol deket deadline.

**Harus MD?**  
- **Tidak wajib** format MD di Devpost.  
- File MD di repo **hanya tempat simpan** draf biar rapi (file ini).  
- Yang di-submit = **form Devpost + video + repo**, bukan “upload MD checklist”.

---

## Checklist lengkap (semua item)

### A. Produk (sudah / verifikasi)

- [x] Project jalan: `npm start` / `node src/cli.js --sample`
- [x] Track dipilih: **Developer Tools**
- [x] README ada setup + sample
- [x] Unique angle jelas: **repro-first**, bukan chat review
- [ ] Kamu sendiri sudah coba 1× full demo di browser

### B. Repo untuk juri

- [ ] Buat repo GitHub (public + license MIT **atau** private + share ke email juri)
- [ ] Push kode PR Autopsy
- [ ] README di root repo (sudah ada di workspace)
- [ ] Juri bisa clone & jalankan dalam &lt;10 menit

Email share (jika private):

- `testing@devpost.com`
- `build-week-event@openai.com`

### C. Video (&lt; 3 menit, YouTube public)

- [ ] Rekam pakai naskah: `docs/03-demo-video-script.md`
- [ ] Audio sebut **Codex**
- [ ] Audio sebut **GPT-5.6**
- [ ] Tunjukkan `ran-fail` + patch
- [ ] Upload YouTube → **Public** (atau Unlisted jika rules izinkan; lebih aman Public)
- [ ] Simpan URL video

### D. Codex / OpenAI (resmi lomba)

- [ ] Baca Official Rules + eligible negara/usia
- [ ] Install Devpost plugin di ChatGPT (jika diminta)
- [ ] Klaim free Codex credits (cek deadline Resources tab)
- [ ] Session Codex di mana core dibangun → jalankan **`/feedback`** → simpan **Session ID**
- [ ] Paste Session ID ke form submit

### E. Form Devpost

- [ ] Project name
- [ ] Tagline / elevator pitch
- [ ] Category: **Developer Tools**
- [ ] Description (pakai draf di bawah)
- [ ] Built with: Codex, GPT-5.6, Node.js, … 
- [ ] Repo URL
- [ ] Demo video URL
- [ ] `/feedback` Session ID
- [ ] Screenshots (opsional tapi bagus: risk CRITICAL + card ran-fail)
- [ ] Submit **sebelum** deadline (21 Jul 2026 5:00 PM PT ≈ 22 Jul 07:00 WIB)

### F. Jangan lupa

- [ ] Jangan klaim “pasti menang”
- [ ] Jangan andalkan 9router agar juri bisa test (mereka tidak punya 9router kamu)
- [ ] Sample path offline harus tetap hijau tanpa key

---

## Draft teks Devpost (copy-paste)

### Project name
```
PR Autopsy: Repro-First Gate
```

### Tagline
```
Don’t ask AI to review a PR — make it prove risk with verification, then ship a patch.
```

### Category
```
Developer Tools
```

### Description (EN — form)

```
## Inspiration
AI code review usually stops at opinions: long comments, no proof. Before merging, developers need evidence — a failing check, a repro, a minimal patch — not vibes.

## What it does
PR Autopsy is a Repro-First Gate for pull requests:

1. Parse a PR diff (sample fixture, pasted unified diff, or public GitHub PR URL)
2. Emit prioritized findings as cards (claim → evidence → verify step)
3. Actually run verify scripts when possible (status: ran-pass / ran-fail / skipped)
4. Attach a suggested patch and a merge risk score
5. Export a markdown autopsy report

The demo path “Broken PR #12” always shows a critical discount-math bug: 20% off of $100 becomes -1900, verified by a real Node repro — then a patch restoring percent/100 math.

## How we built it
- Core pipeline in Node.js (no heavy framework): parse → analyze → run → report
- Offline engine so judges can test without API keys
- Optional OpenAI-compatible claim polish (cloud or local router) that never invents findings
- Simple product UI + CLI for the same report
- Built with Codex accelerating agent loop, fixtures, runner, and UI; GPT-5.6 framed as the triage/reasoning layer for risk claims

## Challenges
Keeping scope to one deep path instead of a generic “AI review chat”, and making verification real (execute scripts) rather than simulated.

## Accomplishments
- End-to-end repro-first demo under 3 minutes
- Verified fail + patch trail on a deterministic sample PR
- Clear separation: offline proof engine vs optional LLM wording

## What we learned
Evidence beats eloquence. Judges and developers trust a ran-fail log more than a polished paragraph.

## What's next
More languages, tighter GitHub App packaging, and richer agent loops that write repros for novel bugs while keeping the offline demo path sacred.
```

### Built with (chips / list)
```
Codex, GPT-5.6, Node.js, JavaScript, GitHub API (optional), OpenAI API (optional)
```

### How Codex + GPT-5.6 were used (short block for form/README)

```
Codex: primary coding agent for scaffolding the autopsy pipeline, sample Broken PR #12,
repro runner, web UI, and tests. Most core functionality was built in a Codex session
(see /feedback Session ID on the submission form).

GPT-5.6: product triage layer for ranking risk and explaining claims in human language;
optional runtime claim polish when an OpenAI-compatible endpoint is configured.
The default judge path uses the offline repro-first engine so demos never depend on keys.
```

### Cara juri menjalankan

```
git clone <repo>
cd <repo>
node src/cli.js --sample
# or
npm start
# open http://localhost:3847 → Broken PR #12 → Run
Requires Node 18+. No API key required for the sample path.
```

---

## Ringkas

1. **9router:** boleh, opsional, lokal — **tidak wajib**, **bukan** ganti Codex.  
2. **Draft MD:** cuma tempat simpan teks form — **bukan** syarat format lomba.  
3. **Checklist:** bagian A–F di atas; yang paling urgent biasanya **B+C+D+E** (repo, video, session ID, submit form).
