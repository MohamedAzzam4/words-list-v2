# SHARED-CARD-002 — Attempt 01 Evidence Index

Repository: `MohamedAzzam4/words-list-v2`. Branch: `codex/glm-shared-card-002-01`.
Tested code revision: `57df256` (implementation + test commit; the code evidence below ran against exactly this tree).
Package base / accepted dependency: `7747d3c897892bc23a08fd9f16b46c5eb8c17272` (SHARED-CARD-001 attempt 02, accepted).
Environment: Debian sandbox, Node v24.19.0, npm 11.17.0, Playwright 1.61.1 (lockfile; chromium build v1228 sandbox cache), Chromium + Mobile Chrome (emulated Pixel 5) projects, `python -m http.server 9012` webServer, synthetic fixture deck (`tests/fixtures/cefr/verbs-card-reference.json`), firebase.js network stub, deterministic speechSynthesis double. No real accounts, no production writes, synthetic speech only.

All commands ran in the repository root unless noted. Hashes are SHA-256 of the published (sanitized) files. Raw captures retained sandbox-side; published copies differ from raw only by CR removal and trailing-whitespace scrub (counts noted; no content removed). Credential scan applied to every file (github_pat_/ghp_/x-access-token patterns: zero hits).

## Test-first transition (expected-failure protocol)

| File | Command | Result | Notes |
|---|---|---|---|
| `red-expected-failures.log` | `npx playwright test tests/e2e/cefr-card-reference.spec.js --project=chromium --grep "SC-0[1-7] TARGET"` | **9 passed** (= 9 expected failures, 0 unexpected), exit 0, 17.0s | RED baseline on the unmodified implementation at `7747d3c`, before any production edit. |
| `unexpected-pass-transition.log` | same command, after implementation, `test.fail` wrappers still in place | **6 failed (all "Expected to fail, but passed") + 3 passed**, exit 1, 25.6s | Transition evidence: SC-01 DOM, SC-03, SC-04, SC-05, SC-06 Enter, SC-06 Space flipped to unexpected passes — targets met. |
| `transition-remaining3.json` | same grep scoped to the 3 remaining cases, JSON reporter | 3 expected failures, exit 0 | Machine-readable proof that SC-01 audio, SC-02, SC-07 still failed — at STALE assertions, not unmet targets: SC-02/SC-07 failed at the old exact-text/`.guided-card` selectors; SC-01 audio failed at its old setup (the front speak control is intentionally gone in en-to-de). Each case's target assertions were verified before unwrapping. |

## Unit tests

| File | Command | Result |
|---|---|---|
| `test-units.log` | `npm run test:units` | **69 passed, 0 failed**, exit 0 (includes the new 10-case `tests/unit/shared-card.test.mjs`) |

## Browser test ladder

| File | Command | Result | Notes |
|---|---|---|---|
| `full-spec-chromium-run1.log` | `npx playwright test tests/e2e/cefr-card-reference.spec.js --project=chromium` | **26 passed / 18 failed**, exit 1, 2.1m | First post-update run; diagnosed: stale `startGuided` helper asserting the retired `.guided-card` shell (broke every guided test at setup), two stale 💬-prefix expectations, one stale flipSurfaceFocused pin, and one genuine 44×44 gap (nav buttons 37px — fixed by adding `.shared-card-block .verb-card-nav .btn` min sizes). |
| `full-spec-chromium-run2.log` | same | **43 passed / 1 failed**, exit 1, 1.2m | Strict-mode violation (`.verb-flashcard` matched the hidden ordinary card during a guided test); locator scoped to `#guided-challenge-root`. |
| `full-spec-chromium.log` | same | **44 passed**, exit 0, 1.2m | Complete corrected spec, Chromium, first attempt after the two documented corrections above. |
| `full-spec-mobile-chrome.log` | same, `--project="Mobile Chrome"` | **44 passed**, exit 0, 1.0m | Complete corrected spec, Mobile Chrome. |
| `regression-verbs-guided-chromium.log` | `npx playwright test tests/e2e/verbs.spec.js tests/e2e/verb-guided-challenge.spec.js tests/e2e/verbs-dashboard-trophies.spec.js --project=chromium` | **31 passed**, exit 0, 1.2m | Affected existing Verbs/Guided/dashboard regression — all pre-existing selectors, tokens and double-click protections intact. |
| `full-tracked-suite.log` | `npx playwright test` (both projects, all tracked specs) | **183 passed / 4 failed / 1 skipped**, exit 1, 6.1m | Complete tracked regression once, after stabilization. Failure classification below. |

## Full-suite failure classification (per the ladder: exact failing tests rerun once in isolation)

| File | Command | Result | Classification |
|---|---|---|---|
| `isolated-words-audio.log` | `npx playwright test tests/e2e/words-audio.spec.js:48 --project=chromium --project="Mobile Chrome"` | **2 failed** (both projects) | Consistent failure — NOT a flake. |
| `isolated-words-audio-BASE.log` | same test, `--project=chromium`, in a disposable worktree at the accepted base `7747d3c` | **1 failed** | **PRE-EXISTING baseline failure** — reproduced identically on the unmodified base revision (words page highlight-clear timing; the words page is outside this WP's permitted scope). Declared for owner waiver; never counted as a pass. |
| `isolated-guided-mobile.log` | `npx playwright test tests/e2e/verb-guided-challenge.spec.js:837 tests/e2e/verb-guided-challenge.spec.js:348 --project="Mobile Chrome"` | **2 passed**, exit 0, 3.5s | The two Mobile Chrome guided failures (GC-09, legacy-aliases) pass in isolation → SC-INFRA-01 parallel-load flake class (pre-existing suite flakiness, documented in SHARED-CARD-001), not a regression. |

## Fault probes (implementation mutations in a disposable worktree at `57df256`; tests unmodified)

Original-file hashes before/after (both files restored byte-identical after every probe):
`js/core/verbs-engine.js` = `9c7385a65c56f8084e2e997c5706208b3e877538cd955c6bf9b5b3ba0b27cc1f`
`js/core/shared-card.js` = `3e90c4c1503ddc006d6a29e6b386b1e02cae05ebf7cecadf1999d9145a1d65dd`
(re-recorded after each probe's `git checkout --` restore; see probe logs and `probe-hashes-before.txt`.)

| # | Family / exact mutation | Baseline | Detecting test (command) | Actual failure | Verdict |
|---|---|---|---|---|---|
| 1 | Secrecy: `renderCard` passes `backHtml: this._buildOrdinaryBackHtml(verb)` unconditionally (answer markup restored to the pre-reveal DOM) | passing | `SC-01 TARGET (DOM secrecy)` (`probe1-secrecy.log`) | sweep assertion failed: "pre-reveal leaks (26 unique carriers)" | **KILLED** |
| 2 | Examples: `renderExampleBlock` drops the `${en ? …}` translation line | passing | `SC-02 TARGET` (`probe2-examples.log`) | `.ex-en-line` toBeVisible failed — element not found | **KILLED** |
| 3a | Event isolation: removed the `!e.target.closest('button')` guard from the flip branch | passing | `CHAR-10` (`probe3-isolation.log`) | test PASSED — mutation is behaviorally equivalent for current markup (nearest-`[data-action]` routing already isolates inner controls; the guard is defense-in-depth for future non-action buttons) | **SURVIVED (equivalent mutant — documented, guard retained)** |
| 3b | Event isolation (real mechanism): the favorite branch additionally calls `this.flipCard()` (inner control gains a flip side effect) | passing | `CHAR-10` + `CHAR-11` (`probe3b-isolation.log`) | `expect(state.flipped).toBe(false)` received `true`; star text assertion also failed | **KILLED** |
| 4 | Keyboard: the keydown handler calls `flipCard()` twice per keypress | passing | `SC-06 TARGET (Enter)` (`probe4-keyboard.log`) | `toHaveClass(/flipped/)` failed — double toggle left the card unflipped (transition count also violated) | **KILLED** |
| 5 | Shared-renderer bypass: `renderChallengeRecall` returns legacy `.guided-card` markup instead of `renderSharedCard` | passing | `SC-07 TARGET` + `SC2-SHELL` (`probe5-bypass.log`) | both failed — no `.verb-flashcard` in the guided root | **KILLED** |

## Visual review (six inspected screenshots; VLM transcripts retained)

| File | State | Inspection verdict |
|---|---|---|
| `visual-01-ordinary-unrevealed-en-to-de-front.png` | ordinary unrevealed en-to-de front | English prompt only; NO German answer visible; no speak control in this direction (audio secrecy by design); no layout defects (`vlm-inspection-01.json`) |
| `visual-02-ordinary-revealed-back.png` | ordinary revealed back | answer fields present; exactly ONE example with its translation directly visible, no toggle chip; accordions readable; no overflow (`vlm-inspection-02.json`) |
| `visual-03-guided-unrevealed-production-front.png` | Guided unrevealed production front | Production badge + English prompt; NO German anywhere pre-reveal; Reveal control below the card (`vlm-inspection-03.json`) |
| `visual-04-guided-revealed-back.png` | Guided revealed back | shared shell (sparkles topbar, framed example box); German answer + example + visible translation; adapter grade/listen buttons below; no defects (`vlm-inspection-04.json`) |
| `visual-05-keyboard-focus-visible-state.png` | keyboard focus on the front speak control | visible focus ring on the speaker button, clearly distinguishable from unfocused controls (`vlm-inspection-05.json`) |
| `visual-06-mobile-shared-card-revealed.png` | mobile revealed shared card | fits width, example + translation fully readable, grade/nav buttons comfortably tappable; the transient "Achievement Unlocked" trophy toast overlaps the lower area — pre-existing OBS-01 behavior (unchanged, out of scope) (`vlm-inspection-06.json`) |

## Missing / not run

- Real-device and Safari testing: not available (Mobile Chrome is emulation).
- Hardware voice playback: not available (synthetic speech double only; AUDIO-* owns real utterance integration).
- No full Verbs/Guided regression was rerun under Mobile Chrome beyond the complete tracked suite above; no screenshots of the Guided intro state were captured beyond the six required states (intro visuals are covered by CHAR-21 DOM assertions).
