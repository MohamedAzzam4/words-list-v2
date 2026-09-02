# AUDIO-003-C2 — Attempt 01 Evidence Index

All commands ran in the repository root (`/home/z/my-project/words-list-v2`, branch `codex/glm-audio-003-c2-01`) unless noted otherwise. Hashes are SHA-256 of the published (sanitized) files. Sanitization: CR removal, ANSI escape strip, trailing-whitespace scrub; no other content altered (per-file "sanitized=" report in the sanitizer output). Credential scan applied to every file (github_pat_/ghp_/gho_/ghs_/ghr_ patterns): zero hits. Raw captures were retained sandbox-side under `/home/z/my-project/audio003c2-evidence/` and `/home/z/my-project/audio003c2-probes/`; the published copies differ from raw only by the sanitization described above (only 01/02 needed any change).

| File | Content | SHA-256 (first 16) |
|---|---|---|
| `01-red-c2-chromium.log` | RED at base 91e1271 (RED commit 752e9c1, production byte-identical to base): the three C2 tests on chromium — test A FAILED (Start At keeps the stale 15-option mixed scope; the revealed `1-0` never appears), test B FAILED (play button keeps the `playing` class — no cancellation), test C (constraint guard) PASSED by design. 2 failed / 1 passed. | d74ea7918bf0c3d3 |
| `02-red-c2-mobile.log` | Same RED signature on `"Mobile Chrome"`: 2 failed / 1 passed. | 0a155a3f1ba3ebe6 |
| `03-green-focused-chromium.log` | GREEN: the three C2 tests on chromium at the implementation tree (pre-commit, content identical to commit 19b4280): 3/3. | 5fead8867df0c01f |
| `04-ladder01-syntax-imports.log` | Ladder 1: `node --check` (ESM copies) on the 4 touched files + live ESM import of `cefr-audio.mjs` (all exports present) + RED-commit production-identity proof (`git diff 91e1271..752e9c1` touches only the spec file). | 0e2b261c88ecd1dd |
| `05-ladder02-units-focused.log` | Ladder 3: `node --test tests/unit/cefr-audio.test.mjs` — 15/15. | a6f6ce2d0707d619 |
| `06-ladder03-cefr-audio-chromium.log` | Ladder 4: full `tests/e2e/cefr-audio.spec.js` on chromium — 27/27 (24 pre-existing + 3 new C2). | 51f60c8518a08eaf |
| `07-ladder04-c2-mobile.log` | Ladder 5: the C2 correction tests on `"Mobile Chrome"` — 3/3. | 33b9795b98b52b4e |
| `08-ladder05-words-favorites-srs.log` | Ladder 6: `words-audio.spec.js` + `favorites-filters.spec.js` + `srs.spec.js` on chromium — 8/8 (5 + 2 + 1). | fa8bc6451bdfe58f |
| `09-ladder06-units-full.log` | Ladder 7: `npm run test:units` — 159/159. | d0b8a0843f0153fe |
| `10-ladder07-full-chromium.log` | Ladder 8 (final gate, run exactly once): full tracked Playwright suite on chromium — 192 passed + 1 skipped (the pre-existing phrases skip), 0 failed. | 425ab91ebd50878c |
| `11-ladder08-full-mobile.log` | Ladder 8 (final gate, run exactly once): full tracked Playwright suite on `"Mobile Chrome"` — 193/193, 0 failed. | 4d5e0dbbbf197d6a |
| `12-ladder09-c2-at-commit-chromium.log` | Post-commit confirmation at 19b4280: the three C2 tests on chromium — 3/3 (ties the ladder evidence to the exact commit; tree verified clean after the commit). | 977c3acabcfdbf03 |
| `13-ladder10-units-at-commit.log` | Post-commit confirmation at 19b4280: `node --test tests/unit/cefr-audio.test.mjs` — 15/15. | a2ee32b3dee9da9b |
| `14-fault-probes.log` | The 4 production-only fault probes in a disposable worktree at 19b4280 (baseline 3/0 unmutated; every mutant parses; sha256 restore verified after each; KILLED/KILLED/KILLED/KILLED). | 6447a464281275d9 |
| `setup-events.txt` | Disclosed environment events (one-time chromium download after a cache miss; the first RED attempt failed at browser launch — infrastructure, not test logic). | a582d390abac9eb3 |

Notes:

- The ladder logs 03–11 were captured on the implementation working tree immediately before the production commit; `git status --short` was empty after the commit, proving the captured content is byte-identical to commit `19b4280` (additionally re-confirmed by the at-commit runs 12/13).
- `git diff --check` clean at every commit; `git diff --cached --check` clean before every commit.
- Ladder evidence uses the same deterministic speechSynthesis double as the AUDIO-003/C1 suites (TS-TEST-004: the browser speech platform is mocked, never the application logic).
