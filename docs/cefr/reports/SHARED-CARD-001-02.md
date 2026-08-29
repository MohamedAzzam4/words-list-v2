# SHARED-CARD-001 — Attempt 02 Delivery Report

## 1. Identity and status

- Status: READY_FOR_REVIEW (local publication complete; the remote push outcome is recorded in the agent worklog and the delivery message)
- Correction attempt: 02. Attempt 01 (`c65a82bb692ee6e66e2a3abce81a965130b62dbf`, branch `codex/glm-shared-card-001-01`) received verdict **CHANGES_REQUESTED** on three test-quality findings — **SC-TQ-01** (focus test modality-dependent and outline-only), **SC-TQ-02** (Enter and Space not independently protected), **SC-TQ-03** (ordinary secrecy target incomplete) — plus expected-failure quality. This attempt corrects exactly those findings; it changes no product behavior conclusions and adds no production edits.
- Branch: `codex/glm-shared-card-001-02`, created from the original package base `d8fdfa55476a1fad96fd42ac749b60b0e3a711e7` (verified exact at branch creation; clean tree). Attempt 01 and its remote branch are untouched — no modification, no force-push.
- Scope guards honored: no changes to production code, contracts, content, dependencies, lockfiles, scheduler, or persistence. Changed paths are exactly: `tests/e2e/cefr-card-reference.spec.js` (corrected suite), `docs/cefr/reports/SHARED-CARD-001-02.md`, `docs/cefr/evidence/SHARED-CARD-001/02/**`. The fixture `tests/fixtures/cefr/verbs-card-reference.json` is carried forward from attempt 01 byte-identical.
- Tested production revision: `d8fdfa55476a1fad96fd42ac749b60b0e3a711e7` — unchanged (test/evidence package only; per DR-007 no code revision moved). All attempt-01 product findings (SC-01..SC-08) remain findings of the same unchanged implementation; the corrections below change only how rigorously the tests prove them.

## 2. Required reading and pre-edit plan

- The 14 required documents were read in full for this package at attempt 01 (base `d8fdfa5`); the attempt-01 report records the reading list and the pre-edit plan. For this correction the operative sources were re-consulted directly: `contracts/LEVEL_FLASHCARD_STANDARD.md` (LF-CARD: "pointer, Enter, and Space activation; visible focus indication"; "must not expose German answer text, German answer audio, or equivalent accessible metadata"), `contracts/GUIDED_CHALLENGE.md` (GC-UI-009: "Controls remain keyboard operable, visibly focused"), `contracts/TESTING_AND_SUCCESS.md` and `contracts/DELIVERY_REPORTING.md` (test-quality and delivery rules), plus the implementation surfaces under test (`verbs.html` view/tab-order structure, `css/core.css` focus rules, `js/core/verbs-engine.js` card/hint/controls renderers, `js/core/verbs-engine.js` guided recall renderer) and the owner's attempt-02 instruction (SC-TQ-01/02/03 definitions, expected-failure quality bar, 6-step testing plan, delivery requirements).
- Pre-edit plan for this correction (issued before editing): (1) carry the fixture and the attempt-01 suite forward from `c65a82bb`; (2) replace the four defective test areas (focus visibility, ordinary keyboard activation, guided keyboard activation, ordinary secrecy) with corrected tests per SC-TQ-01/02/03; (3) add setup proofs to every expected-failure test so failures land on intended target assertions; (4) run the corrected selection under Chromium and Mobile Chrome, then the complete spec once per project; (5) do not rerun the full existing Verbs/Guided regression (production unchanged; attempt-01 evidence remains applicable); (6) publish report + sanitized evidence under the attempt-02 paths and push only `codex/glm-shared-card-001-02` without force.
- Classification of every corrected check is unchanged in kind from attempt 01: current-behavior characterizations (CHAR, pass today), approved-target assertions already met (TARGET, pass today), and expected-failure finding demonstrations (`test.fail`, fail today at a named assertion and detect an unexpected pass).

## 3. Changes and rationale

Only `tests/e2e/cefr-card-reference.spec.js` changes (41 tests: 32 expected-pass, 9 expected-failure — was 35: 28/7). Old → new map:

**SC-TQ-01 — focus visibility (modality-dependent, outline-only → keyboard-Tab, technique-agnostic):**
- New helpers: `snapshotFocusStyles` (indicator-relevant computed styles: outline style/width/color, box-shadow, border style/width/color, background color/image), `visibleFocusIndicator` (technique-agnostic predicate: a rendered outline, a painted box-shadow, a painted border change, or a background change — no single CSS technique demanded), `tabWalk` (real keyboard Tab navigation; never `element.focus()`).
- `CHAR-16` (rewritten): baseline capture BEFORE any keyboard navigation, then a full Tab walk over the unrevealed-front controls and (after the pointer-only flip) the revealed-back controls. For every control: asserts it was reached by Tab, asserts it matches `:focus-visible` (the browser's own keyboard-modality classification — programmatic focus would not match and is never used as proof), and pins the current behavior that the keyboard-focused styles are IDENTICAL to the unfocused baseline (SC-04: the `button { outline: none }` reset in `css/core.css` has no `:focus-visible` replacement and no other technique paints an indicator).
- `SC-04 TARGET` (rewritten, still `test.fail`): same Tab navigation and `:focus-visible` proof, then the intended target assertion — every keyboard-focused control must show an indicator via at least one of outline / box-shadow / border / background. It fails today precisely because no technique does; a fix through ANY technique makes it pass (and Playwright then flags the unexpected pass, so the finding cannot silently heal).

**SC-TQ-02 — Enter and Space independently protected:**
- `CHAR-14` (rewritten): a full bounded Tab traversal proves the flip surface (`.verb-flashcard` / `.verb-center-content`) is NEVER keyboard-focusable — the SC-06 core — while every focusable card control IS reached (setup proof for all keyboard tests), and pins that the favorite affordances are click-only spans (keyboard-unreachable).
- `CHAR-14a` / `CHAR-14b` (new, replacing the combined old CHAR-14 key presses): separate Enter and Space tests, each from a fresh page, each reaching the front speak control by Tab navigation, each proving the key runs ONLY that control's documented function with **exactly zero reveal transitions** (a MutationObserver counts every flip-surface class mutation, so a double-firing handler cannot hide behind a net-zero state), no grading, no advancement — and each adds a **duplicate-key assertion** (second press: still zero transitions/grading/advancement; only the control's own function repeats).
- `SC-06 TARGET (Enter)` / `SC-06 TARGET (Space)` (new, replacing the single combined target): separate `test.fail` tests, fresh page each, keyboard navigation toward the card (never programmatic focus). Intended target assertion: the flip surface must become reachable and focused by Tab navigation (LF-CARD's "Enter/Space activation" presupposes a keyboard-reachable card) — this fails consistently today because the surface has no tabindex. The remaining approved target (documented, unreachable while the finding holds): one keypress = exactly one reveal transition (mutation count 1); duplicate keypress = at most the documented flip toggle (mutation count 2), never grading (`known` empty), never advancement (`index` 0). An unexpected pass is reported if the finding is ever fixed.
- `CHAR-26a` / `CHAR-26b` (new, replacing the combined old CHAR-26): separate guided Enter and Space tests, fresh page/card state each, reaching the Reveal Answer control by Tab (the old version used `revealBtn.focus()`). Each proves exactly one reveal transition (answer visible once, same verb, same phase) and adds the duplicate-key assertion: after the reveal re-render removes the reveal button, a duplicate keypress produces no second transition, no grading, no advancement (verbId/phase/revealed unchanged). Pointer activation remains in its own independent test (CHAR-02 ordinary flip, CHAR-22 guided reveal) — untouched.

**SC-TQ-03 — ordinary secrecy target completed:**
- New helper `sweepOrdinaryCardSubtree`: inspects EVERY element of the complete ordinary-card subtree (`#view-flashcard`, the whole flashcard view region containing both card faces, the hint box, and the below-card controls) — visible AND hidden text content, plus EVERY attribute value (title, aria-label, accessible naming, data-*, onclick, and the rest) — for the German infinitive, the German example, and the partial-answer hint; deduplicates and caps carriers for readable failure output.
- `SC-01 TARGET (DOM secrecy)` (new, replacing the old two-line target): setup proof that the en-to-de front shows the English prompt, then the intended target assertion — the complete pre-reveal subtree sweep must find ZERO leaks. It fails today with 31 unique carriers enumerated in the error (see section 9).
- `SC-01 TARGET (audio secrecy)` (new): separate verification that pre-reveal audio cannot speak the answer — setup proof that the front speak control is visible and audio actually runs, then the intended assertion that no captured utterance contains the German answer. Fails today (the front speak button speaks the answer pre-reveal).
- `CHAR-09b` (new, passing TARGET): the positive post-reveal counterpart — after reveal, the back shows the German answer and the first German example (proves the reveal path itself works and separates setup from the secrecy target failures).
- `CHAR-09` (extended): pins the newly characterized attribute leak — `data-verb-id="v_ref_machen"` on the pre-reveal front favorite affordance (SC-01d).

**Expected-failure quality (all nine `test.fail` cases):**
- Every expected-failure test now opens with setup proofs that pass today (element existence/visibility, correct front prompt, audio-ran proof, Tab-entered-the-card-region proof), so a setup, navigation, selector, or browser-launch failure can no longer masquerade as a product finding — the failure lands on the intended target assertion.
- Machine-readable result retained: the expected-failure selection (`--grep "SC-0[1-7] TARGET"`) was run with the JSON reporter; `expected-failure-selection-chromium.json` records per-case status, and `expected-failure-verification.txt` (generated by a verification script that FAILS on mismatch) documents for each case the intended assertion and the actual error line — **9/9 VERIFIED at their intended target assertions, 0 unexpected results**.
- No skips, no conditional assertions, no arbitrary sleeps were introduced; assertions are exact positive/negative checks throughout.

## 4. Acceptance-to-evidence mapping

| Required behavior (owner instruction) | Corrected test(s) | Evidence |
|---|---|---|
| SC-TQ-01: keyboard Tab navigation reaches the control; `:focus-visible` match; unfocused vs keyboard-focused computed styles compared; indicator accepted via outline/box-shadow/border/background; current behavior preserved; target fails consistently | CHAR-16 (characterization), SC-04 TARGET (expected failure) | `corrected-selection-chromium.log`, `corrected-selection-mobile-chrome.log`, `expected-failure-verification.txt` |
| SC-TQ-02: separate Enter and Space target tests; fresh page/card state; keyboard navigation; exactly one reveal transition; duplicate-key assertion (no second transition/grading/advancement); pointer activation independent | SC-06 TARGET (Enter), SC-06 TARGET (Space), CHAR-14/14a/14b (current behavior), CHAR-26a/26b (guided, passing targets), CHAR-02/CHAR-22 (pointer, unchanged) | same logs as above |
| SC-TQ-03: complete ordinary-card subtree sweep pre-reveal in en-to-de (visible/hidden text, title/aria-label/accessible naming/data-*) for infinitive, example, partial-answer hint, answer-audio metadata; zero leakage asserted; positive post-reveal assertion; separate pre-reveal audio verification | SC-01 TARGET (DOM secrecy), SC-01 TARGET (audio secrecy), CHAR-09b, CHAR-09 (characterization incl. SC-01d) | same logs; leak inventory in section 9 |
| Expected-failure quality: reach the intended assertion; setup/navigation/selector/launch failures never accepted; machine-readable result retained with exact failed assertions; no skips/conditionals | all nine test.fail cases + verification script | `expected-failure-selection-chromium.json`, `expected-failure-verification.txt` |
| Full corrected spec once per project after stability | 41-test suite, Chromium + Mobile Chrome | `full-spec-chromium.log`, `full-spec-mobile-chrome.log` |

## 5. Complete command ledger

All commands run in the repository root against the corrected suite on branch `codex/glm-shared-card-001-02`. Retained logs live in `docs/cefr/evidence/SHARED-CARD-001/02/` with SHA-256 values in its INDEX.md.

| # | Command | Result |
|---|---|---|
| 1 | `node --input-type=module --check < tests/e2e/cefr-card-reference.spec.js` | exit 0 (syntax gate; no log retained) |
| 2 | `npx playwright test tests/e2e/cefr-card-reference.spec.js --project=chromium --list` | 41 tests, exit 0 (`full-spec-list-chromium.log`) |
| 3 | `npx playwright test ... --grep "SC-01\|CHAR-09\|CHAR-14\|CHAR-16\|SC-04\|SC-06\|CHAR-26" --list` | 13 tests, exit 0 (`inventory-list-corrected-selection.log`) |
| 4 | first corrected-selection run (chromium) | **browser-launch failure** — executable `chromium_headless_shell-1228` missing from the sandbox cache; all 13 results void, no product evidence (see INDEX setup note) |
| 5 | `npx playwright install chromium` | exit 0 (Chrome Headless Shell 149.0.7827.55 / v1228 installed) |
| 6 | corrected-selection rerun (chromium) | 11 passed / 2 failed — diagnosed test-authoring defect: `.verb-card-controls [data-action="next-card"]` (the Next button lives in `.verb-card-nav`); fixed in 3 occurrences; intermediate log superseded |
| 7 | corrected-selection run (chromium, after fix) | **13 passed** (8 real + 5 expected failures) in 11.3s, exit 0 (`corrected-selection-chromium.log`) |
| 8 | corrected-selection run (Mobile Chrome) | **13 passed** (8 real + 5 expected failures) in 9.9s, exit 0 (`corrected-selection-mobile-chrome.log`) |
| 9 | expected-failure selection (chromium, `--grep "SC-0[1-7] TARGET"`, JSON+line) | **9 passed** (= 9 expected failures, 0 unexpected) in 16.9s, exit 0 (`expected-failure-selection-chromium.log` + `.json`) |
| 10 | expected-failure verification script over the JSON | **9/9 VERIFIED** at intended target assertions, exit 0 (`expected-failure-verification.txt`) |
| 11 | full corrected spec (chromium) | **41 passed** (32 real + 9 expected failures) in 1.0m, exit 0 (`full-spec-chromium.log`) |
| 12 | full corrected spec (Mobile Chrome) | **41 passed** (32 real + 9 expected failures) in 1.1m, exit 0 (`full-spec-mobile-chrome.log`) |
| 13 | `git diff --check` | clean, exit 0 (empty output) |
| 14 | `git diff --cached --check` (against the fully staged attempt-02 tree, before commit) | clean, exit 0 (empty output) |
| 15 | `git diff --check d8fdfa55476a1fad96fd42ac749b60b0e3a711e7..HEAD` (after commit) | clean, exit 0 (empty output) |

Failed-attempt accounting per the delivery rules: exactly two failed command attempts (rows 4 and 6), each stopped after diagnosis (missing browser executable; wrong container selector) and resolved by a targeted fix — no blind retries.

Per the owner's instruction, the full existing Verbs/Guided regression was NOT rerun: production code is unchanged from attempt 01, and attempt-01's existing-suite baseline and broader regression evidence (at commit `c65a82bb`, `docs/cefr/evidence/SHARED-CARD-001/01/`) remains applicable. Attempt-01 screenshots and VLM inspections are likewise referenced by that immutable commit rather than copied.

## 6. Regression and integration

- No production file changed (verified: `git diff --name-only d8fdfa5..HEAD` is exactly the spec, the fixture, this report, and the evidence directory). Nothing can regress at runtime; the only integration surface is the test suite itself.
- The corrected suite passes in full on both configured projects (41/41 Chromium, 41/41 Mobile Chrome, first attempt after the two documented corrections). The other three tracked E2E specs are untouched by this change and their attempt-01 evidence stands.
- The fixture is byte-identical to attempt 01's, so every fixture-dependent expectation carries over unchanged.

## 7. Test-quality and fault-probe evidence

- **Modality proof:** every focus/keyboard test reaches its control through real `page.keyboard.press('Tab')` navigation and asserts `:focus-visible` matching — programmatic `element.focus()` is never used as proof of keyboard focus visibility (SC-TQ-01). The characterization additionally compares keyboard-focused computed styles against a pre-navigation unfocused baseline across all four indicator techniques.
- **Exactly-one/zero transition counting:** a MutationObserver on the flip surface's class attribute counts every flip transition, so "exactly one reveal transition" and "zero transitions" are measured facts, not end-state inferences; duplicate-key assertions prove no accidental second transition, grading, or advancement (SC-TQ-02).
- **Complete secrecy sweep:** the pre-reveal ordinary-card subtree is inspected element-by-element and attribute-by-attribute for all four needle categories (infinitive, example, partial hint, answer-audio metadata via attributes), with a separate behavioral audio check and a positive post-reveal assertion (SC-TQ-03).
- **Expected-failure integrity:** the verification script (sandbox-side, output published) programmatically checks that all nine `test.fail` cases carry Playwright status `expected` AND an error message containing the intended-assertion marker — 9/9 VERIFIED, 0 unexpected. This also guards retroactively against the browser-launch failure class: had any case failed at launch (as the void run in ledger row 4 did), the mismatch would have failed verification and blocked publication.
- **Fault-probe value demonstrated in this very attempt:** the new setup-proof discipline converted what attempt 01 would have counted as 13 "expected failures" (the void browser-launch run) into a detected environment blocker, and the full-traversal walk immediately caught a real selector defect (ledger row 6) instead of letting it masquerade as a product finding.
- No skipped tests, no conditional assertions, no arbitrary sleeps, no implementation-derived expected values in the corrected tests; every selected test ran (counts in the ledger; per-test status in the JSON evidence).

## 8. Dead-code and dependency inventory

N/A for this attempt, unchanged in kind from attempt 01: this is a test-quality correction with no production change, so no production code was removed and no dependency was added or upgraded. The suite continues to import only `@playwright/test` and Node built-ins. (The Playwright browser build v1228 installed during setup is the sandbox cache for the already-pinned Playwright version — no lockfile or dependency change.) The new helpers (`tabWalk`, `tabUntilFocused`, `snapshotFocusStyles`, `visibleFocusIndicator`, `installFlipClassCounter`, `sweepOrdinaryCardSubtree`) are all exercised by the published tests; none is dead code.

## 9. Findings, limitations, and handoff

Product findings are UNCHANGED in substance (the implementation is the same revision); the corrections make the proof complete. One leak sub-item is newly characterized by the completed sweep:

- **SC-01 (answer secrecy, ordinary card) — now with a complete leak inventory.** The corrected pre-reveal sweep enumerates 31 unique carriers, confirming and extending the attempt-01 characterization: (a) the rotated back face already carries the German infinitive, meaning, participle, conjugations and every example in the pre-reveal DOM (SC-01a); (b) the hidden hint box carries the partial answer "Verb Infinitive: mac..." (SC-01b); (c) the front speak control speaks the German answer pre-reveal (SC-01c); (d) **newly pinned** — the favorite affordances carry the answer stem in `data-verb-id="v_ref_machen"` on both faces (SC-01d), and the back-face example spans embed the full German example sentence in their `onclick` attributes — "equivalent accessible metadata" under LF-CARD/AC-06.
- **SC-02..SC-08 unchanged** (example-display divergence; 44×44 targets; focus visibility — now proven keyboard-real and technique-agnostic; reduced motion; keyboard activation — now proven per-key with duplicate-key protection; guided shell divergence; positive AC-08 compliance; SC-INFRA-01 suite flake note and OBS-01 from attempt 01 stand). The BL-03 scheduler-mismatch separation is preserved: the Guided scheduler and persistence were only driven, never judged or modified.
- Observation retained from the corrected walk (no new ID, characterization only): the favorite affordances are click-only spans, so they are not keyboard-operable at all — adjacent to SC-06, relevant to the shared-card extraction.
- Limitations: evidence covers Chromium and Mobile Chrome as configured (same as attempt 01); the expected-failure machine-readable artifact is from the Chromium run (Mobile Chrome results are in its line log: identical outcomes); attempt-01's SC-INFRA-01 goto-timeout flake was not encountered in any attempt-02 run.
- Handoff: with SC-TQ-01/02/03 resolved, the corrected 41-test suite is the characterization baseline for SHARED-CARD-002 (shared-card extraction). The five owner decisions requested in the attempt-01 report stand unchanged.

## 10. Owner/reviewer disposition — not executor approval

This report presents corrections and evidence for review; it does not approve itself. Suggested review path: (1) confirm the three SC-TQ findings are resolved by inspecting the corrected tests (section 3 map); (2) confirm expected-failure integrity via `expected-failure-verification.txt` (9/9 at intended assertions); (3) confirm the leak inventory in section 9 against the sweep error message recorded in the JSON evidence; (4) confirm scope (diff vs `d8fdfa5` touches only the permitted test/report/evidence paths). Attempt 01 remains published and untouched at `c65a82bb`.
