# OpenAI Build Week — Perbandingan Ide (Path 2)

**Tujuan:** skor objektif tiga kandidat untuk “peluang menang dalam ~5 hari”, lalu **mengunci** arah build.  
**Konteks:** ~26k peserta, deadline ~5 hari, submit wajib demo &lt;3 menit + repo + README + track + `/feedback` Codex Session ID.  
**Catatan jujur:** tidak ada ide yang *mutlak* menang; skor di bawah = **probabilitas relatif** di kondisi waktu + kriteria juri, bukan prediksi juara.

## Dimensi penilaian (skala 1–5)

| Dimensi | Arti |
|---------|------|
| **Fit Codex** | Seberapa natural Codex + GPT-5.6 jadi “mesin” produk (bukan hiasan chat) |
| **Demo &lt;3 min** | Seberapa mudah video 90–180 detik menunjukkan masalah → aksi → hasil yang wow |
| **Feasibility 5 hari** | Bisa MVP end-to-end yang juri bisa pahami/jalankan dalam ~5 hari kerja |
| **Novelty vs clone** | Seberapa beda dari ratusan “AI wrapper” / chatbot generic di track yang sama |
| **Track fit** | Kecocokan ke track resmi + apa yang juri track itu biasanya hargai |
| **Impact juri** | Seberapa kredibel “masalah nyata + audiens nyata + solusi nyambung” |

**Total maks = 30.** Semakin tinggi = semakin cocok sebagai default build minggu ini.

---

## 1) PR Autopsy (Developer Tools)

**Pitch satu kalimat:** Agent yang tidak hanya merangkum PR, tapi **membedah diff, mereproduksi risiko, menjalankan/menyusun verifikasi, dan mengeluarkan temuan + patch yang bisa di-apply.**

| Dimensi | Skor | Alasan singkat |
|---------|------|----------------|
| Fit Codex | **5** | Coding agent = native use-case Codex; juri technical langsung “klik” |
| Demo &lt;3 min | **5** | Alur visual kuat: PR jelek → temuan bug → test/patch → “fixed” |
| Feasibility 5 hari | **4** | 1 alur dalam (1 provider GitHub + report UI) realistis; full CI multi-lang terlalu besar |
| Novelty vs clone | **3** | “AI code review” ramai; **tanpa sudut unik** mudah tenggelam |
| Track fit | **5** | Developer Tools: testing, agentic workflow, security — pas |
| Impact juri | **4** | Developer & open-source maintainer = audiens jelas; pain PR review nyata |
| **Total** | **26** | |

**Kelebihan:** paling “Codex-native”, demo gampang keren, juri technical (termasuk profile technical staff) mudah appreciate.  
**Risiko:** novelty rendah jika cuma “LLM summarize PR”; wajib niche + aksi nyata (repro/test/patch).  
**Rationale ranking:** default terbaik untuk 5 hari *jika* dikunci ke varian non-generic.

---

## 2) Exam Lab Coach (Education)

**Pitch satu kalimat:** Lab ujian adaptif yang memaksa siswa berpikir (scaffold, deteksi miskonsepsi) + dashboard guru — **bukan** “chatbot yang jawab soal”.

| Dimensi | Skor | Alasan singkat |
|---------|------|----------------|
| Fit Codex | **3** | Bisa pakai Codex untuk generate soal/feedback engine, tapi kurang “coding agent showcase” |
| Demo &lt;3 min | **4** | Demo siswa salah → tutor scaffold → miskonsepsi terdeteksi → panel guru |
| Feasibility 5 hari | **4** | 1 mapel + 1 alur latihan + dashboard simpel feasible |
| Novelty vs clone | **3** | AI tutor sangat ramai; beda hanya jika anti-spoiler + misconcept graph kuat |
| Track fit | **5** | Track Education + ada juri VP Education |
| Impact juri | **5** | Impact sosial/edukasi mudah diceritakan kredibel |
| **Total** | **24** | |

**Kelebihan:** impact juri kuat; track kadang kurang “overcrowded oleh generic chat tools” dibanding consumer.  
**Risiko:** kurang memamerkan kekuatan Codex dibanding Dev Tools; mudah terlihat seperti ChatGPT tutor.  
**Rationale ranking:** runner-up solid; cocok jika skillset kuat di edukasi/UX, tapi **bukan** lock untuk objective 1+2 ini.

---

## 3) Meeting → Action OS (Work & Productivity)

**Pitch satu kalimat:** Dari transkrip meeting → keputusan, owner, deadline, **dan aksi nyata** (ticket/draft email/checklist) — bukan cuma summary.

| Dimensi | Skor | Alasan singkat |
|---------|------|----------------|
| Fit Codex | **3** | GPT bagus di ekstraksi; Codex lebih “bonus” untuk generate artifacts/code hooks |
| Demo &lt;3 min | **4** | Transkrip → action board → ticket draft = demo rapi |
| Feasibility 5 hari | **4** | 1 input (paste transcript) + 1 output board + export markdown feasible |
| Novelty vs clone | **2** | “AI meeting notes” sudah jenuh di pasar & hackathon |
| Track fit | **4** | Work & Productivity pas, tapi kompetisi ide mirip tinggi |
| Impact juri | **4** | Masalah nyata di tim, asalkan eksekusi (bukan summary) terbukti di demo |
| **Total** | **21** | |

**Kelebihan:** pain point universal, demo mudah dipahami non-technical.  
**Risiko:** novelty terendah; ribuan tools serupa; lebih sulit “beda dari existing concepts”.  
**Rationale ranking:** layak sebagai backup, **bukan** pilihan utama minggu ini.

---

## Ranking & rekomendasi

| Rank | Ide | Track | Total | Putusan |
|------|-----|-------|-------|---------|
| **#1** | **PR Autopsy (niche variant)** | Developer Tools | **26** | **LOCK — arah build workspace** |
| **#2** | Exam Lab Coach | Education | **24** | Cadangan kuat (impact/education) |
| **#3** | Meeting → Action OS | Work & Productivity | **21** | Cadangan; novelty lemah |

### Mengapa #1 menang di skor (bukan “mutlak juara”)

1. **Fit Codex tertinggi** — hackathon ini mensyaratkan cerita Codex + GPT-5.6; Dev Tools agent paling jujur memamerkan itu.  
2. **Demo beat paling tajam** — diff → temuan → verifikasi → patch dalam &lt;3 menit.  
3. **5 hari feasible** jika scope dikunci ke satu alur dalam.  
4. Novelty **hanya bagus jika** dikunci ke sudut unik (lihat design) — skor 3 di novelty adalah peringatan, bukan alasan pindah track.

### Explicit lock decision

**LOCKED DIRECTION:**  
**“PR Autopsy: Repro-First Gate”** (niche variant of PR Autopsy)  
**Track:** Developer Tools  
**Bukan lock:** Exam Lab Coach, Meeting → Action OS (tetap didokumentasikan di perbandingan ini).

Detail produk terkunci: [`02-pr-autopsy-design.md`](./02-pr-autopsy-design.md).

---

## Consistency note (path 1 + path 2)

| Path dari percakapan | Deliverable | Status |
|----------------------|-------------|--------|
| **2** — banding 3 ide + skor “bisa menang di 5 hari” | Dokumen ini | Selesai |
| **1** — lock PR Autopsy + sudut unik biar tidak generic | Design doc | Lihat file 02 |

Tidak ada klaim “pasti menang $15k”; yang dikunci adalah **arah eksekusi terbaik untuk peluang relatif**.
