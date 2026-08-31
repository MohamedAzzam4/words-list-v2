# AUDIO-001 / Attempt 01 — Evidence Index

All evidence below was produced in the external sandbox (`/home/z/my-project/words-list-v2`, Debian, Node v24.19.0, npm 11.17.0). This is a pure unit-level package: no Playwright, no browser, no DOM, no network. Every log is the sanitized text output of the exact command listed (sanitization: CR removal, trailing-whitespace scrub, ANSI escape strip; no other content was altered; no credentials or user data appear in any file — every published copy was scanned for credential patterns: zero hits). Tested revisions: base `8e8d3f3e9335da0cc805b668d13751141acedc27` (the accepted SHARED-CARD-003-C2 revision), tests commit `9495e77` (RED), and final tested code `4bdd9d9` (implementation; all GREEN + probe evidence).

Module sha256 at delivery: `4e3cda6c0556c9c53809fb2856cceeaf8ba31ea21bcaee9d01ff747a876f7575` (`js/core/speech-plan.mjs`). Tests sha256: `9e455f20fe61e23bbfc4ccb882344984ba8ddf384e2c7e338abc0309cf529097` (`tests/unit/speech-plan.test.mjs`).

## RED evidence (tests commit 9495e77, before the implementation existed)

| File | Command | Outcome |
|---|---|---|
| `01-red-tests-before-module.log` | `node --test tests/unit/speech-plan.test.mjs` (disposable worktree at the tests commit `9495e77`, where `js/core/speech-plan.mjs` does not yet exist) | **all tests fail to load** — the import of `../../js/core/speech-plan.mjs` resolves to a non-existent module; exit 1. The failing-acceptance-test evidence required by TS-PRE-003 for a new behavior. |

## Final evidence (final tested code `4bdd9d9`)

| File | Command | Outcome |
|---|---|---|
| `02-syntax-module.log` | `node --check js/core/speech-plan.mjs` | exit 0 — the new pure ESM module parses cleanly (TS-LOOP-001). `node --check` produces no output on success. |
| `03-syntax-test.log` | `node --check tests/unit/speech-plan.test.mjs` | exit 0 — the test module parses cleanly. `node --check` produces no output on success. |
| `04-green-focused.log` | `node --test tests/unit/speech-plan.test.mjs` | **30 passed** / 0 failed, exit 0 — all 24 design cases (30 subtest entries) pass against the implementation. |
| `05-affected-level-data.log` | `node --test tests/unit/level-data.test.mjs` | **13 passed** / 0 failed, exit 0 — the existing normalized-data regression suite is unaffected (the planner only reads the normalized shape; it does not modify validation). |
| `06-full-units.log` | `npm run test:units` | **105 passed** / 0 failed / 0 skipped, exit 0 — 75 pre-existing + 30 new = 105; no unit regression. |
| `07-diff-check.log` | `git diff --check && git diff --cached --check && git status --short` | exit 0 — clean (no whitespace errors; only the two new files + the report/evidence directory differ from base). |

## Fault-probe evidence (disposable worktree at `4bdd9d9`, tests unmodified)

| File | Probe | Mutation (production code only, disposable copy of `js/core/speech-plan.mjs`) | Detecting tests + actual failure | Classification | Integrity proof |
|---|---|---|---|---|---|
| `08-fault-probes.log` | 1. Language probe | For `language === 'mixed'`, the two-step en/ar emission is replaced by one merged step: `pushStep(... 'en', speech.en + ' / ' + speech.ar)` — mixed text is sent under a single `language: 'en'` tag | 3 tests fail: *mixed translation language emits two separate steps (en then ar), never one merged step*; *mixed-language example translation emits example, en-translation, ar-translation as separate steps*; *every step carries the source card id and correctly-ordered itemIndex/repeatIndex/exampleIndex* — all assert separate language-specific steps | **KILLED** | `js/core/speech-plan.mjs` sha256 `4e3cda6c…` re-verified byte-identical after `git checkout` restore |
| (same file) | 2. Sequence probe | The repeat/item loop nesting is swapped: outer = item, inner = repeat, producing `[item1-r0, item1-r1, item2-r0, item2-r1]` instead of `[item1-r0, item2-r0, item1-r1, item2-r1]` | 2 tests fail: *repeatCount=2 with two items emits term-1, term-2, term-1, term-2 (outer repeat, inner item)*; *deterministic ordering holds for many items with repeats and translations* — both assert the outer-repeat/inner-item order and the ascending repeatIndex sequence | **KILLED** | sha256 re-verified byte-identical after restore |
| (same file) | 3. Start-index probe | Off-by-one: `items.slice(normalized.startIndex - 1)` instead of `items.slice(normalized.startIndex)` — the play list starts one item too early (and for `startIndex=0`, `slice(-1)` returns only the last item) | 6 tests fail: *many items default options*; *repeatCount=2 with two items*; *startIndex 0*; *startIndex in the middle*; *startIndex at the last item*; *deterministic ordering* — all assert the exact post-startIndex slice | **KILLED** | sha256 re-verified byte-identical after restore |

The worktree's unmutated baseline (30/30 pass, exit 0) was captured before the first probe. The main working tree was never mutated; the worktree was removed after the probes.

## Hygiene

- `git diff --check` and `git diff --cached --check` at the implementation commit and at the docs commit: clean.
- Working tree after all runs: only `js/core/speech-plan.mjs`, `tests/unit/speech-plan.test.mjs`, and the report/evidence directory differ from the base commit `8e8d3f3`.
- Every log was scanned for credential patterns before publication: zero hits.
- No browser, Playwright, DOM, network, storage, or timer was used by the planner or its tests (pure unit-level package per FP-DESIGN-010).
