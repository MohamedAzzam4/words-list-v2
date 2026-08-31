# SHARED-CARD-003-C1 / Attempt 01 — Evidence Index

All evidence below was produced in the external sandbox (`/home/z/my-project/words-list-v2`, Debian, Node v24.19.0, npm 11.17.0, Playwright 1.61.1 from the lockfile, chromium + chromium-headless-shell v1228 + Mobile Chrome emulation). Every log is the sanitized text output of the exact command listed (sanitization: `[WebServer]` HTTP request lines removed, CR removal, trailing-whitespace scrub, ANSI escape strip; no other content was altered; no credentials or user data appear in any file — every published copy was scanned for credential patterns: zero hits). Tested revisions: base `e3d3c22b0a6efa0865fa336006158b9dfa2bdce0` (baseline + RED), final code `222819ca48cd602a28d09fc7f82e205a28be4dde` (all final evidence; the tests commit is `3f82255101cb72589619ab1e75690628e38c28a6`).

## Pre-edit characterization and baselines (base e3d3c22)

| File | Command | Outcome | Revision |
|---|---|---|---|
| `baseline-probe.log` | `node /home/z/my-project/scripts/sc003c1-baseline-probe.mjs` (disposable Playwright probe against a sandbox-local static server; never touches the repo tree) | All seven owner-listed controls measured at **37.0 CSS px height** (widths 94–143 px); all 7/7 reached by real Tab presses within 70 presses (wrap-around cycle ≈ 19 tabs); all matched `:focus-visible` when keyboard-focused; **zero computed-style changes** between unfocused and keyboard-focused states → no visible focus indicator on any of them | e3d3c22 |
| `baseline-omission-chromium.log` | `npx playwright test tests/e2e/cefr-cards.spec.js --project=chromium --grep "SC3-A11Y-FOCUS\|SC3-A11Y-TARGETS"` | **2 passed** / 0 failed, exit 0 — the pre-correction tests pass at base despite the defect (the omission the owner finding describes, now proven) | e3d3c22 |
| `baseline-units.log` | `npm run test:units` | **75 passed** / 0 failed, exit 0 | e3d3c22 |

## RED evidence (base e3d3c22, before the production CSS edit; corrected tests from commit 3f82255 content in the working tree)

| File | Command | Outcome | Intended failing assertions |
|---|---|---|---|
| `red-a11y-chromium.log` | `npx playwright test tests/e2e/cefr-cards.spec.js --project=chromium --grep "SC3-A11Y-FOCUS\|SC3-A11Y-TARGETS\|SC3-B2-A11Y-TOOLBAR"` | **3 failed** / 0 passed, exit 1 | `SC3-A11Y-FOCUS` and `SC3-B2-A11Y-TOOLBAR` failed at `#view-flashcard .controls-row > .btn:first-child must show a keyboard-focus indicator` (Expected true, Received false); `SC3-A11Y-TARGETS` failed at `back-to-list height` (Expected ≥ 44, Received 37) — exactly the two defect halves of the owner finding |

## Final evidence (final code revision 222819c)

| File | Command | Outcome |
|---|---|---|
| `green-a11y-chromium.log` | same grep as RED, `--project=chromium` | **3 passed** / 0 failed, exit 0 — the corrected tests pass after the CSS correction |
| `green-a11y-mobile.log` | same grep, `--project="Mobile Chrome"` | **3 passed** / 0 failed, exit 0 |
| `final-units.log` | `npm run test:units` | **75 passed** / 0 failed, exit 0 (unchanged — no JS touched) |
| `final-cefr-cards-chromium.log` | `npx playwright test tests/e2e/cefr-cards.spec.js --project=chromium` | **46 passed** / 0 failed, exit 0 (1.3m) — 45 pre-existing + 1 new `SC3-B2-A11Y-TOOLBAR` |
| `final-cefr-cards-mobile.log` | `npx playwright test tests/e2e/cefr-cards.spec.js --project="Mobile Chrome"` | **46 passed** / 0 failed, exit 0 (1.1m) |
| `final-affected-regression-chromium.log` | `npx playwright test tests/e2e/srs.spec.js tests/e2e/activity-streak.spec.js tests/e2e/favorites-filters.spec.js tests/e2e/phrases-conversations.spec.js --project=chromium` | **17 passed / 1 skipped**, exit 0 — the single skip is the pre-existing desktop skip of the mobile-only phrases-conversations test (identical at base e3d3c22 and in SHARED-CARD-003 evidence) |
| `final-reference-chromium.log` | `npx playwright test tests/e2e/cefr-card-reference.spec.js --project=chromium` | **49 passed** / 0 failed, exit 0 — German Verbs shared-card reference regression (verbs.html loads css/core.css and reuses the `#view-flashcard` id, so this is the direct verbs-untouched proof) |
| `postfix-probe.log` | `node /home/z/my-project/scripts/sc003c1-postfix-probe.mjs` (disposable Playwright probe) | Level page: all seven controls now **exactly 44.0 CSS px** high with a painted focus outline on keyboard focus (`outlinePainted=true`, `focusVisible=true`, Tab-reached 7/7). Verbs page `#view-flashcard` toolbar: Back to List 117.4×33.0 and Shuffle 127.0×33.0, `sizedTo44=false`, `newOutline=false` — untouched by the scoped rules |

## Fault-probe evidence (disposable worktree at 222819c, tests unmodified)

`sha256` of `css/core.css` (`31d8d773…681697`) and `tests/e2e/cefr-cards.spec.js` (`70f62ddd…35c03b`) recorded before the probes and re-verified byte-identical after every restore (`probe-integrity.txt`); the main working tree was never mutated. The worktree's unmodified baseline (all three corrected tests passing) was captured first: `probe-baseline-worktree.log` (**3 passed**, exit 0).

| File | Probe | Mutation (production CSS only) | Detecting test + exact assertion | Classification |
|---|---|---|---|---|
| `probe1.log` | 1. 44×44 sizing rule disabled | `css/core.css` sizing rule: the `html[data-level] #view-flashcard .controls-row .btn` selector line removed (the rule reverts to covering only `.fc-nav .btn`) | `SC3-A11Y-TARGETS` — `back-to-list height` (Expected ≥ 44, Received 37) AND `SC3-B2-A11Y-TOOLBAR` — `height` (Expected ≥ 44, Received 37); `SC3-A11Y-FOCUS` correctly still passes (focus rule intact) | **KILLED** |
| `probe2.log` | 2. focus-visible rule disabled | `css/core.css` focus rule: the `html[data-level] #view-flashcard .controls-row .btn:focus-visible` selector line removed | `SC3-A11Y-FOCUS` — `#view-flashcard .controls-row > .btn:first-child must show a keyboard-focus indicator` (Expected true, Received false) AND `SC3-B2-A11Y-TOOLBAR` — same assertion; `SC3-A11Y-TARGETS` correctly still passes (sizing rule intact) | **KILLED** |

## Setup note

The sandbox was reprovisioned between packages and the pinned Playwright browser cache was empty at session start: the first baseline attempt failed with `browserType.launch: Executable doesn't exist` (2 infrastructure failures, no test executed). `npx playwright install chromium` (chromium + chromium-headless-shell v1228, per the lockfile) was run once; every command in this index ran after that. The failed first attempt's output was overwritten by the successful rerun of the same command and is therefore not retained as a file — recorded here honestly per DR-013.
