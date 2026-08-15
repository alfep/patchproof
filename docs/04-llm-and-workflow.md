# Agent LLM: dari mana? + alur kerja lanjut

## Jawaban singkat

| Peran | Siapa | Dipakai untuk |
|-------|--------|----------------|
| **Asisten coding sekarang** | **Grok** (sesi chat ini) | Menulis kode, polish UI, naskah, tes, README |
| **Wajib cerita Build Week** | **Codex + GPT-5.6** (OpenAI) | Di video, README, form; `/feedback` session ID dari **Codex** |
| **Runtime produk (default)** | **Engine offline** di repo ini | Parse diff, temuan, jalankan repro, patch — **tanpa** API key |
| **Runtime produk (opsional)** | **OpenAI API** (`OPENAI_API_KEY`) | Polish teks claim/title saja; **tidak** mengarang temuan baru |

**Jadi: agent LLM runtime-nya bukan “dari Grok”.**  
Grok membantu **membangun**. Produk jalan sendiri; LLM opsional lewat **API key OpenAI milikmu**.

---

## Arsitektur (sederhana)

```
Input (sample / diff / GitHub PR)
        │
        ▼
┌───────────────────────┐
│ Offline repro engine  │  ← selalu jalan (juri & demo)
│ analyze + runner      │
└───────────┬───────────┘
            │
            ▼ (optional, if OPENAI_API_KEY)
┌───────────────────────┐
│ OpenAI chat complete  │  ← polish claim wording
│ model: GPT-5.6*       │
└───────────┬───────────┘
            │
            ▼
   Report UI / CLI markdown
```

\* default env `OPENAI_MODEL=gpt-5.6` (bisa diganti model chat yang tersedia di akunmu).

---

## Cara aktifkan LLM opsional

```bash
# Windows PowerShell (sementara di session)
$env:OPENAI_API_KEY = "sk-..."
$env:OPENAI_MODEL = "gpt-5.6"   # opsional
npm start
```

UI: centang **Optional OpenAI claim polish**.  
Tanpa key: chip `llm: offline` — demo sample **tetap** CRITICAL + `ran-fail`.

---

## Codex vs Grok untuk submit

| Item form | Isi yang benar |
|-----------|----------------|
| Built with Codex? | **Ya** — usahakan mayoritas core di **Codex** (ChatGPT/Codex), ambil `/feedback` ID dari session itu |
| GPT-5.6 | Ceritakan di video + README sebagai triage / reasoning layer |
| Session coding di Grok | Boleh bantu polish; **jangan** andalkan sebagai pengganti Codex session ID resmi |

Praktis: kalau core sudah banyak di Grok, buka **Codex**, re-run/refactor tipis di sana, ambil `/feedback` ID, dan sebut jujur di README bahwa implementasinya di-iterate dengan coding agents (Codex primary untuk form).

---

## Bisakah aku (Grok) terus lanjut?

**Ya.** Alurnya simpel:

1. Kamu chat di sini: “lanjut X”  
2. Aku implement / polish / test di workspace  
3. Kamu cek `npm start` / `npm test`  
4. Ulang sampai siap submit  

### Roadmap sisa (urutan disarankan)

| # | Item | Status |
|---|------|--------|
| 1 | MVP engine + sample + tests | ✅ done |
| 2 | Polish UI | ✅ this pass |
| 3 | Naskah video | ✅ `docs/03-demo-video-script.md` |
| 4 | Optional OpenAI enrich | ✅ `src/llm.js` |
| 5 | Push repo GitHub + license | next (kamu/akun git) |
| 6 | Rekam & upload YouTube | next (kamu di mesin) |
| 7 | Codex `/feedback` ID + form Devpost | next (kamu di ChatGPT/Codex) |
| 8 | (Opsional) lebih banyak heuristic / stack Python | later |

Yang **hanya kamu** yang bisa: login Devpost, klaim credit OpenAI, rekam mic/YouTube, paste session ID.  
Yang **bisa aku terus**: fitur, bugfix, README submit, naskah, review video outline, dsb.

---

## Setelah polish + naskah — “terus gimana?”

Kamu tinggal bilang salah satu:

- **“push ke github”** / bantu commit message  
- **“latihan demo bareng checklist”**  
- **“tambah fitur X”**  
- **“isi draft description Devpost”**  

Aku lanjut dari state repo ini tanpa mulai dari nol.
