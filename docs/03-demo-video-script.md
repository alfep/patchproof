# Naskah Demo Video — PR Autopsy: Repro-First Gate

**Durasi target:** 2:00–2:30 (maks 2:59)  
**Track:** Developer Tools  
**Bahasa:** Inggris (juri global) — versi ID di bawah sebagai cadangan  
**Wajib sebut di audio:** **Codex** dan **GPT-5.6**

---

## Setup sebelum rekam

1. `npm start` → http://localhost:3847  
2. Zoom browser ~110%, dark UI, tutup notifikasi  
3. Tab sudah di **Broken PR #12**  
4. Opsional: terminal di samping dengan `node src/cli.js --sample` (backup visual)  
5. Latihan 1× full run agar timing natural  

---

## Beat sheet (EN — pakai ini untuk YouTube)

| Time | Visual | Script (speak) |
|------|--------|----------------|
| **0:00–0:12** | Landing page, pitch text | “Most AI code review stops at opinions. Before I merge a PR, I want **proof** — not a polite summary.” |
| **0:12–0:28** | Hover pipeline Parse→…→Patch; show sample card | “This is **PR Autopsy: Repro-First Gate**. Every serious finding must carry a verify step we can actually run.” |
| **0:28–0:42** | Click **Run repro-first autopsy** | “We built this for OpenAI Build Week with **Codex** accelerating the agent loop, fixtures, and UI — and **GPT-5.6** as the triage story for ranking risk and explaining claims.” |
| **0:42–1:05** | Progress list animates | “Watch the gate: parse the diff, triage, propose repros, **execute**, then attach a patch.” |
| **1:05–1:35** | Risk **CRITICAL**, expand first card, show run output `-1900` | “Broken PR #12 looks like a harmless discount fix. Verification runs: twenty percent off of 100 becomes **negative 1900**. That’s a `ran-fail` — evidence, not vibes.” |
| **1:35–1:55** | Suggested patch block | “Codex-style coding loop proposes a minimal patch: restore percent divided by 100 and put validation back.” |
| **1:55–2:15** | Stat chips + Copy markdown | “Two verified fails, two patches ready, risk CRITICAL. Export a markdown autopsy for the PR thread.” |
| **2:15–2:30** | Logo / pipeline again | “Developer Tools track: a merge gate that **proves** risk. Built with **Codex** and **GPT-5.6**. Thanks.” |

**Total ~2:30.** Jika kepanjangan, potong beat CLI; prioritaskan UI + `ran-fail` + patch.

---

## Versi singkat Indonesia (latihan / voice-over cadangan)

| Waktu | Ucapkan |
|-------|---------|
| 0:00 | “AI review biasanya cuma opini. Aku mau bukti sebelum merge.” |
| 0:15 | “PR Autopsy: Repro-First Gate — setiap temuan wajib punya langkah verifikasi.” |
| 0:30 | “Dibangun pakai **Codex**, dengan cerita triage **GPT-5.6**.” |
| 0:45 | “Jalankan Broken PR #12…” |
| 1:10 | “Hasil verify: total jadi minus 1900 — status ran-fail.” |
| 1:40 | “Ada suggested patch. Risk CRITICAL.” |
| 2:10 | “Bukan chatbot review — gate yang membuktikan risiko. Terima kasih.” |

---

## Checklist audio (wajib hackathon)

- [ ] Kata **Codex** terdengar jelas (≥1×, ideal 2×)  
- [ ] Kata **GPT-5.6** terdengar jelas (≥1×)  
- [ ] Menjelaskan **repro-first** (bukan cuma “AI review”)  
- [ ] Menunjukkan project **benar-benar jalan**  
- [ ] Video YouTube **public**, &lt; 3 menit  

---

## Judul & deskripsi YouTube (draft)

**Title:**  
`PR Autopsy: Repro-First Gate — Prove PR Risk Before You Merge | OpenAI Build Week`

**Description:**
```
PR Autopsy forces every serious finding through a verify step you can run —
then attaches a patch trail. Built for OpenAI Build Week (Developer Tools).

• Offline demo: Broken PR #12
• ran-fail evidence + suggested patch
• Built with Codex; GPT-5.6 triage story

Repo: <your-github-url>
```

---

## Catatan jujur untuk submit

- Engine demo default = **offline repro-first** (juri tanpa API key tetap bisa test).  
- **Codex** = coding agent tempat mayoritas core dibangun → ambil `/feedback` session ID dari situ.  
- **GPT-5.6** = model triage/cerita produk (+ optional `OPENAI_API_KEY` untuk polish claim di runtime).  
- **Grok** = asisten coding di sesi ini; **bukan** runtime LLM produk & **bukan** pengganti Codex untuk form Build Week.
