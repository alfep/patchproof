# Aplikasi Codex for Open Source — PatchProof
**Form:** https://openai.com/form/codex-for-oss/
**Disiapkan:** 2026-08-16

## Isian Form

| Field | Isi |
|---|---|
| GitHub username | `alfep` |
| Repository URL | `https://github.com/alfep/patchproof` |
| Role | Primary / core maintainer (sole maintainer) |

## Why does this repository qualify? (maks 500 karakter)

### Versi Inggris (pakai ini di form)

> PatchProof is a local-first PR gate built for the AI-spam PR crisis: instead of opinionated AI review, every finding must ship a verify command that actually runs in a Node permission sandbox, producing ran-pass/ran-fail evidence plus a suggested patch. Zero-dependency offline core, SARIF export to GitHub's Security tab, CI-ready GitHub Action. Maintainers drowning in unverified claims are the exact audience; Codex would power PR triage automation, issue review, and release workflows.

(~490 karakter)

### Terjemahan (untuk referensi sendiri)

PatchProof adalah PR gate lokal yang dibuat untuk krisis PR spam AI: alih-alih review AI berbasis opini, setiap temuan wajib menyertakan perintah verifikasi yang benar-benar dijalankan di sandbox permission Node, menghasilkan bukti ran-pass/ran-fail plus patch yang disarankan. Core offline tanpa dependensi, export SARIF ke tab Security GitHub, siap dipakai di CI. Maintainer yang kebanjiran klaim tak terverifikasi adalah audiens persisnya; Codex akan dipakai untuk otomasi triage PR, review issue, dan workflow release.

## Tips pengisian

1. **Jujur soal metrik** — repo baru, stars masih sedikit. Jangan menggelembungkan. Kekuatan kita: *konsep relevan langsung dengan alasan program ini ada* (krisis AI-generated PR) + bukti maintenance aktif (CI hijau, test suite, commit rutin).
2. **Kolom role**: tulis "sole maintainer — I review every PR, triage issues, and cut releases".
3. **Kalau ada kolom API credits**: jelaskan use case spesifik — "Codex-driven PR triage bot that posts repro-first verification results on incoming PRs".
4. **Submit → catat tanggal** di bawah ini, cek email berkala (rolling review).

## Tracking

- [ ] Form disubmit — tanggal: ____
- [ ] Email balasan diterima — tanggal: ____
- [ ] Kalau diterima: catat tanggal habis 6 bulan (biar tidak kena charge $200/bulan)

## Roadmap maintenance (biar layak & tetap layak)

- [ ] Tag v0.1.0 + GitHub Release (setelah CI stabil)
- [ ] Publish ke npm (`npm publish`, hapus `"private": true`) → metrik download
- [ ] Commit rutin mingguan; respon issue < 48 jam
- [ ] Ajak 1-2 contributor / pakai PatchProof di repo sendiri (dogfooding PR)
- [ ] Share ke komunitas OSS (Reddit r/opensource, Hacker News Show HN)
