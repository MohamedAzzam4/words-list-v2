# AUDIO-001-C1 / Attempt 01 — Evidence Index

All evidence below was produced in the external sandbox (`/home/z/my-project/words-list-v2`, Debian, Node v24.19.0, npm 11.17.0). This is a pure unit-level correction package: no Playwright, no browser, no DOM, no network. Every log is the sanitized text output of the exact command listed (sanitization: CR removal, trailing-whitespace scrub, ANSI escape strip; no other content was altered; no credentials or user data appear in any file — every published copy was scanned for credential patterns: zero hits). Tested revisions: correction base `9c925aca406f1b7465959872f5545f7a30e177eb` (delivered AUDIO-001 attempt 01), tests commit `7794504` (RED regression tests; the planner in that commit is still the uncorrected base version), and final tested code `2f51c07` (the corrected planner; all GREEN + probe evidence). Sandbox clock: 2026-08-31 ~21:05–21:30 UTC.

Module sha256 at delivery: `1c2f26ab5f4187a293b15b43bee8d18acf68907da84d4cc6b722a3a42efcd850` (`js/core/speech-plan.mjs`). Tests sha256: `ff35dcf8daf28467a0e51846b28a1d4270077aec45d6c1b24205e846d956ec9c` (`tests/unit/speech-plan.test.mjs`).

## Checkpoint gate evidence (pre-edit)

- `git fetch origin --prune` exit 0; correction base `9c925ac…` verified present; assigned remote branch `codex/glm-audio-001-c1-01` verified absent (0 matching heads); working tree clean (0 dirty entries) on `codex/glm-audio-001-01` at exactly `9c925ac…`.
- Branch `codex/glm-audio-001-c1-01` created exactly from `9c925ac…`; unchanged initial checkpoint pushed non-forced via a transient chmod-600 credential file outside the repository (deleted immediately after the push and verified absent; token never printed, committed, logged, or URL-embedded). Remote SHA verified `9c925aca406f1b7465959872f5545f7a30e177eb`; `git diff 9c925ac… FETCH_HEAD` = 0 bytes.

## RED evidence (tests commit `7794504`; planner still the uncorrected base version)

| File | Command | Outcome |
|---|---|---|
| `01-red-tests-against-uncorrected-base.log` | `node --test tests/unit/speech-plan.test.mjs` (disposable worktree at `7794504`, where `js/core/speech-plan.mjs` is the uncorrected base: term translation still reads `card.language`, loops still repeat-major, indices still re-based) | **17 failed / 23 passed / 40 total, exit 1** — the failing-acceptance-test evidence required by TS-PRE-003 / CM-FIX-004. The 17 failing tests cover all three findings: 11 normalized-metadata tests (A1-shaped `en`, B2 `mixed`, Arabic-only, stale-`language` ignore, actual A1 parser card, actual B2 mixed + Arabic parser cards, real A1 dataset card `1-0`, real B2 dataset card `19-74`, empty-en warning, slash alternatives), 4 repeat-order tests (Verbs two-item order, full block per repetition, stable ids/indices with startIndex+repeats, deterministic item-major ordering), 3 stable-index tests overlapping (startIndex middle, startIndex last, startIndex+repeats). The 23 passing tests are the intentionally unchanged behaviors (zero/one/many, example modes, invalid options, immutability, determinism, out-of-range start, `card.language` not introduced). |

## Final evidence (final tested code `2f51c07`; sha256 `1c2f26ab…`)

| File | Command | Exit | Counts / duration | sha256 |
|---|---|---|---|---|
| `02-syntax-module.log` | `node --check js/core/speech-plan.mjs` | 0 | parses cleanly (no output on success; TS-LOOP-001) | `01ba4719…` |
| `03-syntax-test.log` | `node --check tests/unit/speech-plan.test.mjs` | 0 | parses cleanly (no output on success) | `01ba4719…` |
| `04-green-focused.log` | `node --test tests/unit/speech-plan.test.mjs` | 0 | **40 passed / 0 failed / 0 skipped**, 124.7 ms | `258a4d3d…` |
| `05-affected-level-data.log` | `node --test tests/unit/level-data.test.mjs` | 0 | **13 passed / 0 failed / 0 skipped**, 202.1 ms | `c3d9bc9c…` |
| `06-full-units.log` | `npm run test:units` | 0 | **115 passed / 0 failed / 0 skipped**, 565 ms — 75 pre-existing + 40 corrected planner tests | `bfc372e7…` |
| `07-diff-check.log` | `git diff --check && git diff --cached --check && git status --short` | 0 | clean (no whitespace errors; no uncommitted files) | `25e3cfe5…` |

## Fault-probe evidence (disposable worktree at `2f51c07`, tests unmodified; script `audio001c1-probes.py` ran with baseline first)

| File | Probe | Mutation (production code only, disposable copy of `js/core/speech-plan.mjs`) | Detecting tests + actual failure | Classification | Integrity proof |
|---|---|---|---|---|---|
| `08-fault-probes.log` | 1. language-access | Term-translation call reads `card.language` instead of `card.translationLanguage` | **14 tests fail** (26/40 pass): normalized A1 `en`, B2 `mixed`, Arabic-only, stale-`language` ignore, actual A1 parser card, actual B2 mixed + Arabic parser cards, real A1 dataset card, real B2 dataset card, full-block repetition, stable ids/indices with startIndex, empty-en warning, slash alternatives, deterministic ordering — real normalized A1/B2 cards carry no `language` property, so the mutant drops or corrupts term translations exactly as predicted | **KILLED** | module sha256 `1c2f26ab…` re-verified byte-identical after `git checkout` restore |
| (same file) | 2. sequence-nesting | The item/repeat loop nesting swapped back to whole-list repetition (outer = repeat, inner = item) | **4 tests fail** (36/40 pass): Verbs two-item order; full block per repetition; stable ids/indices with startIndex+repeats; deterministic item-major ordering — all assert `[i1-r0, i1-r1, i2-r0, i2-r1]` | **KILLED** | sha256 re-verified byte-identical after restore |
| (same file) | 3. index-rebase | `itemIndex` re-based to 0 after applying `startIndex` (`const itemIndex = i - normalized.startIndex`) | **3 tests fail** (37/40 pass): startIndex middle retains 1 and 2; startIndex at last item retains 2; stable ids/indices across repeats — all assert original input-array indices | **KILLED** | sha256 re-verified byte-identical after restore |

The worktree's unmutated baseline (40/40 pass, exit 0) was captured before the first probe; every mutant passed `node --check` before tests ran (behavioral mutants, not syntax crashes). The main working tree was never mutated; the worktree was removed after the probes.

## Hygiene

- `git diff --check` and `git diff --cached --check` at the tests commit, the implementation commit, and the docs commit: clean.
- Complete diff vs correction base `9c925ac…`: only `js/core/speech-plan.mjs`, `tests/unit/speech-plan.test.mjs`, `docs/cefr/reports/AUDIO-001-C1-01.md`, and `docs/cefr/evidence/AUDIO-001-C1/01/**` (this directory). No level configuration, browser controller, TTS, HTML/CSS, contract, dependency, content, enforcement, or unrelated test file changed.
- Every log was scanned for credential patterns before publication: zero hits.
- No browser, Playwright, DOM, network, storage, or timer was used by the planner or its tests (pure unit-level package per FP-DESIGN-010).
- Redactions/missing evidence: none. `02-syntax-module.log` and `03-syntax-test.log` are legitimately empty because `node --check` produces no output on success; exit codes are recorded in the table above.
