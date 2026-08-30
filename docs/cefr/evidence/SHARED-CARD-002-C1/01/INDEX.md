# SHARED-CARD-002-C1 — Attempt 01 Evidence Index

Repository: `MohamedAzzam4/words-list-v2`. Branch: `codex/glm-shared-card-002-c1-01`.
Tested code revision: `ebc90953c8f721d11faf6fbb91331277064614be` (implementation + test commit; every code-evidence file below ran against exactly this tree, except the RED runs which ran against the unmodified base `3af821907cf034426603959b0107b2f024d4df2a` and the base-isolation rerun which ran in a disposable worktree at that base).
Package base / accepted parent: `3af821907cf034426603959b0107b2f024d4df2a` (SHARED-CARD-002 attempt 01 delivery HEAD).
Environment: Debian sandbox, Node v24.19.0, npm 11.17.0, Playwright 1.61.1 (lockfile; chromium-headless-shell v1228 installed during this session because the sandbox reprovision on 2026-08-30 removed the previously pinned browser cache), Chromium + Mobile Chrome (emulated Pixel 5) projects, `python -m http.server 9012` webServer, synthetic fixture deck (`tests/fixtures/cefr/verbs-card-reference.json`), firebase.js network stub, deterministic speechSynthesis double. No real accounts, no production writes, synthetic speech only. The task's `npm.cmd run test:units` step was executed as `npm run test:units` (Linux sandbox; `npm.cmd` is the Windows launcher for the same script).

All commands ran in the repository root unless noted. Hashes are SHA-256 of the published (sanitized) files. Raw captures retained sandbox-side; published copies differ from raw only by CR removal and trailing-whitespace scrub (counts recorded per file in the packaging output; no content removed). Credential scan applied to every file (github_pat_/ghp_/gho_/x-access-token patterns: zero hits).

## Test-first RED evidence (before any production edit)

| File | Command | Result | Notes |
|---|---|---|---|
| `red-unit.log` | `node --test tests/unit/shared-card.test.mjs` | **14 tests: 10 passed / 4 failed**, exit 1 | All 10 pre-existing unit cases pass at base (no collateral); all 4 new C1 cases fail at their intended target assertions (aria-label absent; inert absent; `data-action="flip"` still rendered with `activatable: false`; `renderExampleBlock` returned `''` for the new language-neutral fields). |
| `red-e2e-full-spec-chromium.log` | `npx playwright test tests/e2e/cefr-card-reference.spec.js --project=chromium` | **44 passed / 5 failed**, exit 1, 1.5m | Complete spec at base with the 5 new C1 tests added: all 44 pre-existing tests pass; all 5 C1 tests fail at their intended target assertions — C1-A11Y-001 at `toHaveAttribute('aria-label', 'Speak Verb')` (received `""`), C1-A11Y-002 ordinary at `expect(faces.back).toBe(true)` (received `false`), C1-A11Y-002 guided at `expect(faces.front).toBe(true)` (received `false`), C1-A11Y-003 at `not.toHaveAttribute('data-action')` (attribute present), C1-DESIGN-001 at `.ex-translation-line` count 1 (received 0). |

## Unit tests

| File | Command | Result | Notes |
|---|---|---|---|
| `test-units.log` | `npm run test:units` | **73 passed / 0 failed**, exit 0 | All tracked unit suites including the 14-case `tests/unit/shared-card.test.mjs` (10 carried forward + 4 new C1 cases). |

## Browser test ladder (post-implementation, tested revision `ebc9095`)

| File | Command | Result | Notes |
|---|---|---|---|
| `c1-targeted-chromium.log` | `npx playwright test tests/e2e/cefr-card-reference.spec.js --project=chromium --grep "C1-"` | **5 passed**, exit 0, 7.2s | All four correction findings proven in Chromium. |
| `c1-targeted-mobile-chrome.log` | same, `--project="Mobile Chrome"` | **5 passed**, exit 0, 5.8s | Same, Mobile Chrome. |
| `full-spec-chromium.log` | `npx playwright test tests/e2e/cefr-card-reference.spec.js --project=chromium` | **49 passed**, exit 0, 1.2m | Complete corrected spec, Chromium. (A first complete run at this revision was **48 passed / 1 failed** — CHAR-22 timed out clicking the hidden front prompt after reveal; diagnosis and supersession below. The intermediate log was overwritten by this final rerun; the diagnosis and correction are documented in the report §5.) |
| `full-spec-mobile-chrome.log` | same, `--project="Mobile Chrome"` | **49 passed**, exit 0, 1.1m | Complete corrected spec, Mobile Chrome. |
| `regression-verbs-guided-chromium.log` | `npx playwright test tests/e2e/verbs.spec.js tests/e2e/verb-guided-challenge.spec.js tests/e2e/verbs-dashboard-trophies.spec.js --project=chromium` | **31 passed**, exit 0, 1.2m | Affected existing Verbs/Guided/dashboard regression — all pre-existing selectors, flows, token guards and double-event protections intact. |
| `full-tracked-suite.log` | `npx playwright test` (both projects, all tracked specs) | **194 passed / 3 failed / 1 skipped**, exit 1, 6.5m | Complete tracked regression exactly once, after stabilization. Failure classification below. |

## Full-suite failure classification (exact failing tests rerun once in isolation)

| File | Command | Result | Classification |
|---|---|---|---|
| `isolated-words-audio-chromium.log` | `npx playwright test tests/e2e/words-audio.spec.js:48 --project=chromium` | **1 failed** | Consistent failure, not a flake. |
| `isolated-words-audio-mobile.log` | same, `--project="Mobile Chrome"` | **1 failed** | Consistent failure on both projects. |
| `isolated-words-audio-BASE.log` | same test, `--project=chromium`, in a disposable worktree at the accepted base `3af8219` | **1 failed** | **PRE-EXISTING baseline failure** — reproduced identically on the unmodified base revision of this package (words page highlight-clear timing; the words page is outside this WP's permitted scope; same failure already declared and proven at `7747d3c` in the SHARED-CARD-002/01 evidence). Declared for owner waiver; never counted as a pass. |
| `isolated-gc07-mobile.log` | `npx playwright test tests/e2e/verb-guided-challenge.spec.js:736 --project="Mobile Chrome"` | **1 passed**, exit 0, 2.3s | GC-07 Mobile Chrome failure passes in isolation → SC-INFRA-01 parallel-load flake class (pre-existing suite flakiness, documented in SHARED-CARD-001/002); not a regression. |

## CHAR-22 supersession (documented correction during the complete-spec run)

The first complete Chromium run failed CHAR-22 at its post-reveal no-op click: the test clicked `.guided-prompt-main` — an element of the **hidden front face** — after reveal, and Playwright reported `<div class="verb-card-back"> intercepts pointer events` because the front face is now `inert` (SC2-C1-A11Y-002: the inactive face must be deterministically isolated — that includes pointer hit-testing). A disposable-worktree rerun of CHAR-22 at the unmodified base `3af8219` passed, confirming the failure is the direct intended consequence of the correction, not a regression. The post-reveal no-op assertion was superseded to click `.guided-answer` on the displayed back face (the only real click surface after reveal); the proof intent — a post-reveal card-body click neither hides the answer nor grades — is unchanged. Ledger entry in report §3.

## Fault probes (implementation mutations in a disposable worktree at `ebc9095`; tests unmodified)

Original-file hashes before/after (both files restored byte-identical after every probe; re-verified with `sha256sum` after each `git checkout --` restore):
`js/core/shared-card.js` = `17a515f8fc8385a4862d0a14ed3173bf780e9cecc3de77e251118d02629cf39a`
`js/core/verbs-engine.js` = `c3b194c7cf5e1a0f955dbe32b5d3dc89d4e3c2bcd56376c74adf0d991eab2986`
(see `probe-hashes-before.txt`.)

| # | Family / exact mutation | Baseline / syntax | Detecting test (command) | Actual failure | Verdict |
|---|---|---|---|---|---|
| 1 | Accessible label removal: favorite button loses `aria-label="Toggle Favorite"` (`shared-card.js`) | passing; mutated syntax OK | `C1-A11Y-001` (`probe1-label-removal.log`) | `toHaveAttribute('aria-label', 'Toggle Favorite')` failed — Expected `"Toggle Favorite"`, Received `""` | **KILLED** |
| 2 | Inactive-face isolation removal: `flipCard` no longer toggles `inert` on either face (`verbs-engine.js`) | passing; mutated syntax OK | `C1-A11Y-002 (ordinary)` (`probe2-isolation-removal.log`) | `expect(faces.front).toBe(true)` failed — received `false` (post-reveal front not inert) | **KILLED** |
| 3 | Stale Guided reveal role/label restoration: `renderChallengeRecall` passes `activatable: true` unconditionally (`verbs-engine.js`) | passing; mutated syntax OK | `C1-A11Y-003` (`probe3-stale-reveal-role.log`) | `not.toHaveAttribute('data-action')` failed — revealed card still advertises the flip action | **KILLED** |
| 4 | Arabic/mixed direction loss: `translationDirection` always returns `'ltr'` (`shared-card.js`) | passing; mutated syntax OK | unit `SHARED-CARD-002-C1 … language-neutral` (`probe4-direction-loss.log`) | Arabic case failed — expected `dir="rtl" lang="ar"`, mutant rendered `dir="ltr" lang="ar"` (13/14, the one failure) | **KILLED** |

Probe selection: four distinct families exactly as assigned (accessible label, inactive-face isolation, stale reveal role, direction metadata); risk medium-high → four probes per TS-MUT-001 and the assignment. Mutations were applied only to production files in the disposable worktree; tests, fixtures, config and runner untouched (TS-MUT-002/007). Integrity: both production files re-verified byte-identical after each restore. No equivalent mutants; no expected results rewritten.

## Missing / not run

- The first complete-spec Chromium run's full log (48/1) was overwritten by the final rerun writing to the same path; its failure, diagnosis and supersession are documented above and in report §5.
- Real-device and Safari testing: not available (Mobile Chrome is emulation).
- Hardware voice playback: not available (synthetic speech double only; AUDIO-* owns real utterance integration).
- Arabic and mixed-direction example rendering is proven at the unit level against the shared renderer (the Verbs adapters pass `translationLang: 'en'` because the Verbs dataset's translations are English; no vocabulary content was invented or translated). The browser E2E proves the integrated English path with its dir/lang metadata and behavior compatibility.
