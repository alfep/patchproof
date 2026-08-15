# Locked Product Design — PR Autopsy: Repro-First Gate

**Status:** LOCKED (hasil path 1 + path 2)  
**Track / category (Build Week):** **Developer Tools**  
**Workspace decision:** build arah ini saja; Education & Meeting OS hanya di perbandingan.  
**Jujur:** bukan “mutlak menang” — ini strategi diferensiasi + scope MVP 5 hari.

---

## 1. Target user

| Persona | Siapa | Kenapa mereka peduli |
|---------|--------|----------------------|
| **Primary** | Solo / small-team developer & maintainer open source | Review PR sendiri, review lambat, takut merge regresi |
| **Secondary** | Tech lead di tim 2–10 orang | Butuh “second pair of eyes” sebelum merge tanpa full CI mewah |
| **Bukan target MVP** | Enterprise compliance platform, multi-org SaaS security suite | Terlalu besar untuk 5 hari |

**Job-to-be-done:**  
“Sebelum aku merge PR ini, aku mau tahu **apakah perubahan ini bisa merusak sesuatu**, dengan bukti yang bisa aku lihat — bukan opini chat yang bagus.”

---

## 2. Core problem

| Problem | Gejala | Kenapa tools generik gagal |
|---------|--------|----------------------------|
| Review PR **mahal & tidak konsisten** | PR kecil ditunda; PR besar di-skim | Manusia lelah; AI summary tidak memverifikasi |
| “AI code review” hanya **narasi** | Komentar bagus, tapi tidak ada repro | Juri & user sama-sama tidak percaya tanpa bukti |
| Regresi lolos | Test tidak dijalankan / tidak relevan ke diff | ChatGPT di sidebar ≠ gate yang mengeksekusi |

**Masalah yang kita selesaikan (satu kalimat):**  
PR di-merge dengan **risiko yang tidak diverifikasi** karena review AI modern berhenti di *ringkasan*, bukan di *reproduksi + bukti*.

---

## 3. Unique angle (bukan generic “AI reviews my PR”)

### Nama posisi produk
**PR Autopsy: Repro-First Gate**

### Satu kalimat diferensiasi
> **Jangan minta AI “review” PR — minta ia membuktikan risiko: pilih temuan, buat repro minimal / perintah verifikasi, jalankan apa yang bisa dijalankan, lalu keluarkan patch atau “clear to merge” dengan jejak bukti.**

### Apa yang membedakan dari clone umum

| Generic AI PR review | Repro-First Gate (kita) |
|----------------------|-------------------------|
| Ringkas diff + saran style | **Temuan berprioritas risiko** (bug/security/behavior break) |
| Komentar prose di mana-mana | **Kartu temuan**: claim → evidence di diff → repro/verify step → status pass/fail |
| “Sepertinya ada bug” | **Repro-first**: perintah atau mini-test yang *mencoba* membuktikan claim |
| Output = chat | Output = **autopsy report** + optional patch hunk yang bisa di-apply |
| Model = satu shot | **Loop agent**: analyze → propose verify → run (sandbox/local) → revise |

### Sudut “novelty” yang juri bisa dengar dalam 15 detik
“Kami tidak membuat chatbot code review. Kami membuat **gate repro-first**: setiap temuan kritis wajib punya langkah verifikasi; kalau verifikasi jalan dan gagal, itu bukti — bukan opini.”

---

## 4. MVP feature set (end-to-end demo &lt; 3 menit)

**Prinsip:** satu happy path yang utuh &gt; sepuluh fitur setengah jadi.

### In scope (MVP)

1. **Input PR**
   - Paste URL PR GitHub **atau** upload/paste unified diff + konteks file (fallback tanpa auth penuh).
2. **Autopsy run**
   - Parse diff → pilih area berisiko → daftar temuan terurut (severity).
3. **Repro-first cards** (inti diferensiasi)
   - Per temuan: judul, severity, file:line, alasan singkat, **langkah verifikasi** (command / pseudo-test), status: `proposed` | `ran-pass` | `ran-fail` | `skipped` (alasan skip jelas).
4. **Minimal execution**
   - Jalankan setidaknya **satu** kelas verifikasi di environment demo (contoh: `node`/`python` script yang di-generate untuk kasus sample, atau test yang sudah ada di sample repo).
5. **Patch suggestion**
   - Minimal **satu** temuan bisa menghasilkan suggested patch (diff) yang masuk akal.
6. **Report UI**
   - Satu halaman web sederhana: progress → daftar kartu → ringkasan “merge risk score” + CTA copy report markdown.
7. **Sample fixture**
   - Repo/sample PR **sengaja buggy** agar demo selalu reproducible offline/online.

### Explicit non-goals / out of scope (MVP)

- Full multi-language enterprise SAST/DAST platform  
- Integrasi GitHub App production-ready + OAuth multi-org  
- Auto-merge bot, required status checks di semua repo user  
- IDE extension (VS Code/JetBrains)  
- Mobile app  
- Real-time collab multi-reviewer  
- Support semua bahasa di dunia (cukup **1 stack sample**, mis. JS/TS atau Python)  
- Klaim “menggantikan senior engineer”  
- Klaim **pasti menang** hackathon  

---

## 5. Experience yang “product”, bukan PoC

| Momen | Yang user rasakan |
|-------|-------------------|
| Mulai | Satu field: URL PR / pilih sample “Broken PR #12” |
| Saat jalan | Progress jujur: parsing → analysis → proposing repros → running → patching |
| Hasil | Kartu temuan dengan **bukti**, bukan wall of text |
| Akhir | “1 critical verified fail · 1 patch ready · risk: HIGH” + export markdown |

Ini menjawab kriteria juri **Design**: coherent product experience, not just a technical script dump.

---

## 6. Codex + GPT-5.6 — build story & product capability

### A) Di dalam produk (capability yang didemo)

| Peran | Model/agent | Dipakai untuk |
|-------|-------------|----------------|
| **Reasoning / triage** | **GPT-5.6** | Memahami intent PR, ranking severity, menulis penjelasan temuan yang jelas untuk manusia |
| **Coding agent loop** | **Codex** (agent coding) | Menulis langkah repro, mini-test/script verifikasi, suggested patch, memperbaiki script jika run gagal karena setup |

**Cerita juri (satu baris):**  
GPT-5.6 memutuskan *apa yang berbahaya*; Codex *membuktikan dan memperbaiki* lewat kode yang dijalankan.

### B) Di workflow pembangun (hackathon acceleration)

| Fase build | Codex + GPT-5.6 mempercepat |
|------------|-----------------------------|
| Scaffold | Generate struktur app, sample buggy PR, parser diff |
| Core agent | Iterasi prompt/tool loop autopsy, error handling |
| Demo fixtures | Bikin PR sengaja rusak + test harness yang stabil di video |
| README / submit | Setup steps, architecture one-pager, naskah demo |

**Yang harus ditonjolkan di submission:**  
di mana Codex memotong waktu (mis. “parser + fixture + agent loop dibangun di session Codex”), keputusan desain (repro-first vs comment spam), dan session **`/feedback` ID** mayoritas core functionality.

---

## 7. Demo video narrative outline (&lt; 3 menit)

**Target total: ~2:00–2:30** (aman di bawah 3:00).  
**Audio wajib:** sebut **Codex** dan **GPT-5.6** secara eksplisit.

| Waktu | Beat | Visual | Narasi (inti) |
|-------|------|--------|----------------|
| 0:00–0:15 | Hook masalah | PR open, “LGTM?” comment tipis | “Review PR masih tebak-tebakan. AI review biasanya cuma ringkas.” |
| 0:15–0:35 | Intro produk | Landing Repro-First Gate | “PR Autopsy memaksa setiap temuan punya langkah verifikasi — repro-first, bukan opini.” |
| 0:35–0:50 | Setup | Klik sample Broken PR #12 (atau paste URL) | “Kami bangun ini dengan **Codex** + **GPT-5.6**.” |
| 0:50–1:20 | Run | Progress steps di UI | “GPT-5.6 mem-triage risiko di diff; Codex menulis repro dan patch.” |
| 1:20–1:55 | Bukti | Kartu critical: ran-fail + log singkat | “Ini bukan ‘sepertinya bug’ — verifikasi dijalankan dan gagal.” |
| 1:55–2:15 | Patch | Tampilkan suggested diff | “Codex mengusulkan patch minimal.” |
| 2:15–2:30 | Close | Risk score + export / “clear story” | “Developer Tools: gate yang membuktikan risiko sebelum merge. Built with Codex & GPT-5.6.” |

**Jangan** di video: tur arsitektur 10 menit, setup Docker panjang, atau fitur out-of-scope.

---

## 8. Build Week submit checklist

Gunakan saat mendekati deadline (Selasa 21 Jul 2026 5:00 PM PT ≈ 22 Jul 2026 07:00 WIB).

### Produk & repo
- [ ] Working project (MVP end-to-end di atas)  
- [ ] Category/track: **Developer Tools**  
- [ ] Public repo (+ license) **atau** private shared ke `testing@devpost.com` dan `build-week-event@openai.com`  
- [ ] **README**: setup, sample data/fixture, cara run juri tanpa tebak-tebakan  
- [ ] Highlight di README: di mana Codex mempercepat workflow, keputusan kunci, pemakaian GPT-5.6 + Codex  

### Submission form & media
- [ ] Project description (apa + bagaimana bekerja + unique angle repro-first)  
- [ ] Demo video YouTube **publik &lt; 3 menit**, audio cover Codex **DAN** GPT-5.6  
- [ ] **`/feedback` Codex Session ID** (session di mana mayoritas core functionality dibangun) dimasukkan ke form  
- [ ] (Jika nanti jadi plugin/CLI package) instalasi, platform support, cara test tanpa rebuild dari nol — opsional untuk MVP web+sample  

### Eligibility / admin (di luar scope implementasi goal ini, tapi wajib user)
- [ ] Official Rules dibaca; eligible usia & negara  
- [ ] Devpost plugin / akun OpenAI; Codex free credits (deadline credits terpisah — cek Resources tab)  
- [ ] Submit sebelum hard deadline  

### Bukan bagian goal planning ini
- Implementasi app, rekam YouTube final, claim credits, klik submit Devpost — **non-goals** dokumen ini.

---

## 9. Success criteria untuk “nanti build” (bukan goal sekarang)

MVP dianggap demo-ready jika:

1. Sample Broken PR selalu menghasilkan ≥1 temuan **dengan** langkah verifikasi.  
2. Minimal satu verifikasi berstatus `ran-fail` atau `ran-pass` di environment demo.  
3. Minimal satu suggested patch ditampilkan.  
4. Video &lt;3 menit bisa direkam tanpa editing heroik.  
5. README memungkinkan orang lain menjalankan sample path dalam &lt;10 menit.

---

## 10. Ringkasan keputusan

| Item | Isi |
|------|-----|
| **Lock** | PR Autopsy: **Repro-First Gate** |
| **Track** | Developer Tools |
| **User** | Dev/maintainer small team |
| **Problem** | Merge tanpa bukti risiko |
| **Unik** | Temuan wajib repro/verify + eksekusi + patch — bukan summary PR |
| **MVP** | Input PR/diff → autopsy cards → run verify → patch → report UI + sample fixture |
| **Non-goals** | Enterprise platform, multi-IDE, auto-merge prod, semua bahasa |
| **Cerita model** | GPT-5.6 triage; Codex repro/patch/agent loop + build acceleration |
| **Submit** | Repo/README, video &lt;3m, Developer Tools, `/feedback` session ID |

Dokumen perbandingan & ranking: [`01-idea-comparison.md`](./01-idea-comparison.md).
