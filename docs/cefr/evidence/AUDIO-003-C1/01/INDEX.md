# AUDIO-003-C1 — Evidence Index (Attempt 01)

Branch `codex/glm-audio-003-c1-01`. Correction base `be5eb38cb589067ec395b45463f152354982002d`. RED tests commit `70f2254a231a437bfd587e74058cde94fbd3e925` (production byte-identical to base). Implementation commit `3e1234ba68d13c353986fd9b977815b58d308cbe`. Report: `docs/cefr/reports/AUDIO-003-C1-01.md`.

All logs are sanitized (CR/ANSI/trailing-whitespace scrub; zero credential-pattern hits — see the sanitizer run recorded in the session worklog). Every log was captured by running the exact listed command once and waiting for the process; no parallel launches.

## RED evidence (at the RED commit, production = base)

| File | Command | Result |
|---|---|---|
| red-01-cefr-chromium.log | `npx playwright test tests/e2e/cefr-audio.spec.js --project=chromium -g "AUDIO-003-C1"` | 5 failed (the defect tests: favorites removal cancellation, stale-vs-replacement, favorites restoration, Hide Mixed identity, context matrix), 1 passed (the non-Favorites constraint guard — passes on base by design) |
| red-02-favorites-chromium.log | `npx playwright test tests/e2e/favorites-filters.spec.js --project=chromium -g "Un-favoriting under the Favorites filter rerenders"` | 1 failed (no rerender on base) |
| red-03-unit.log | `node --test tests/unit/cefr-audio.test.mjs` | file-level failure: `does not provide an export named 'resolveStartWordIndex'` |

## Verification ladder evidence (at implementation commit 3e1234b)

| File | Ladder step | Command | Result |
|---|---|---|---|
| ladder01-syntax-imports.log | 1 | module-mode `node --check` on both edited sources + 3 spec/test files; live ESM import of cefr-audio.mjs | all OK |
| ladder02-units-focused.log | 2 | `node --test tests/unit/cefr-audio.test.mjs` | 15/15 |
| ladder03-units-full.log | 3 | `npm run test:units` | 159/159 |
| ladder04-c1-chromium.log | 4 | new C1 tests, chromium | 6/6 |
| ladder05-c1-mobile.log | 5 | new C1 tests, Mobile Chrome | 6/6 |
| ladder06-cefr-audio-chromium.log | 6 | full cefr-audio.spec.js, chromium | 24/24 |
| ladder07-words-audio.log | 7 | words-audio.spec.js, chromium | 5/5 |
| ladder08-favorites-srs.log | 8 | favorites-filters.spec.js + srs.spec.js, chromium | 3/3 |
| ladder09-phrases.log | 9 | phrases-conversations.spec.js, chromium | 11 passed, 1 pre-existing skip |
| ladder10-verbs-audio.log | 10 | verbs-audio.spec.js, chromium | 16/16 |
| ladder11-full-chromium.log | 11 | `npx playwright test --project=chromium` | 189 passed, 1 skipped, 0 failed (a first in-session run had 1 transient `verb-guided-challenge.spec.js:382` failure of the known F-A003-2 flake family — passes isolated, in the immediate rerun, and here; disclosed as F-A003C1-1) |
| ladder12-full-mobile.log | 11 | `npx playwright test --project="Mobile Chrome"` | 190/190 |
| ladder13-diffcheck-status.log | 12–13 | `git diff --check`; `git status --short` | clean; only assigned files |

## Fault-probe evidence

| File | Content |
|---|---|
| fault-probes.log | Six production-only mutations in a disposable git worktree pinned at 3e1234b (owner tree never mutated; restore sha256-verified after each; worktree removed). Unmutated baseline: detector set 8/8. All six mutants parse and are behavioral. Classification: 6/6 KILLED by the intended tests (per-probe hunks, commands, failing titles, and integrity hashes inside). |
