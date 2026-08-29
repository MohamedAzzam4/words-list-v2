# SHARED-CARD-002 — Attempt 01 Delivery Report

## 1. Identity and status

- Status: READY_FOR_REVIEW
- Assigned goal and task type: Extract the shared flashcard presentation used by both the ordinary Verbs card and the Guided Challenge card WITHOUT sharing grading — FEATURE (primary) + REFACTOR (secondary) + BUGFIX for the seven characterized SC findings; CM gates FEAT/MOD/FIX/REF all applied (behavior before/after documented in §3/§9; superseded tests listed; failing-target reproductions recorded as RED→PASS evidence; same suites run before/after).
- Owner assignment reference: owner task message "TASK: Execute SHARED-CARD-002 — Extract shared card presentation without shared grading" with five owner decisions (secrecy, examples, accessibility, shared structure, deferred work).
- GitHub task branch: `codex/glm-shared-card-002-01`; base commit: `7747d3c897892bc23a08fd9f16b46c5eb8c17272` (accepted SHARED-CARD-001 attempt 02); final tested code commit: `57df256` (implementation + tests; the evidence in `docs/cefr/evidence/SHARED-CARD-002/01/` ran against exactly this tree; the report/evidence commit is docs-only and does not move the tested code revision).
- Evidence index: `docs/cefr/evidence/SHARED-CARD-002/01/INDEX.md`
- Final delivered SHA is returned after commit/push in the handoff message, not embedded into its own commit.
- Executor/model and sandbox OS/runtime versions: Super Z (GLM executor); Debian sandbox, Node v24.19.0, npm 11.17.0, Playwright 1.61.1 (lockfile; chromium build v1228 sandbox cache).
- Start/end time; work directory: 2026-08-29 ~20:40–~22:10 UTC (sandbox clock); `/home/z/my-project/words-list-v2` (repo-relative paths in this report).
- Dependency acceptance references: SHARED-CARD-001 attempt 02 at `7747d3c897892bc23a08fd9f16b46c5eb8c17272` (owner-accepted dependency named in the assignment).

## 2. Required reading and pre-edit plan

- Paths fully read: `AGENTS.md`, `contracts/README.md`, `contracts/PORTABLE_AGENT_EXECUTION.md` (PX), `contracts/CHANGE_MANAGEMENT.md` (CM), `contracts/CODE_FINGERPRINT.md` (FP), `contracts/TESTING_AND_SUCCESS.md` (TS), `contracts/DEAD_CODE_AND_REFACTORING.md` (DC), `contracts/DELIVERY_REPORTING.md` (DR), `contracts/LEVEL_FLASHCARD_STANDARD.md` (LF), `contracts/GUIDED_CHALLENGE.md` (GC), `docs/cefr/BASELINE.md`, `docs/cefr/WORK_PACKAGES.md` (SHARED-CARD-002 section), `docs/cefr/ACCEPTANCE_MATRIX.md` (AC-04..09, AC-20/21), `docs/cefr/GITHUB_DELIVERY.md`, `docs/cefr/reports/SHARED-CARD-001-02.md`, `tests/e2e/cefr-card-reference.spec.js` (complete), plus implementation surfaces: `js/core/verbs-engine.js`, `verbs.html`, `css/core.css`, `css/verb-challenge.css`, `js/core/verb-challenge-engine.js` (read-only presentation model), `js/core/utils.js`, `js/core/tts.js` (speak surface), `tests/e2e/verbs.spec.js`, `tests/e2e/verb-guided-challenge.spec.js`, `tests/unit/flashcards.test.mjs` (VM-loader pattern), `tests/fixtures/cefr/verbs-card-reference.json`, real dataset werden row. No contract conflicts found; BL-03 deferral re-confirmed (scheduler file never opened for edit).
- Before behavior (characterized at `7747d3c`): both card faces always in the pre-reveal DOM with the full German answer, examples and conjugations (SC-01a); hidden hint carried the partial answer (SC-01b); the front speak control spoke the German answer in en-to-de (SC-01c); `data-verb-id` embedded the answer stem (SC-01d); all examples on the back with translations behind an EN chip (SC-02); fav/speak/hint under 44×44 (SC-03); no visible keyboard focus (SC-04); no reduced-motion handling (SC-05); flip surface not keyboard reachable/activatable (SC-06); Guided rendered a separate `.guided-card` implementation (SC-07).
- Approved after behavior: one shared pure presentation module renders the identical shell for both modes; answer-bearing back markup exists only after reveal; German-answer audio unavailable pre-reveal in secrecy directions; first example only, translation always visible; 44×44 primary targets; visible keyboard focus; reduced-motion respected; pointer/Enter/Space independent activation with exactly one transition; inner controls never flip/grade/advance; adapters keep grading/scheduling/persistence.
- Explicit non-goals: scheduler/scoring/latency/persistence semantics (BL-03 deferred), broader audio redesign (AUDIO-*), A1/B2 level integration (SHARED-CARD-003), autoplay, glossary redesign, test-infrastructure rewrites (SC-INFRA-01).
- Exact allowed write paths (all inside the permitted scope): `js/core/verbs-engine.js`, `verbs.html`, `css/verb-challenge.css` (inspected; ultimately unchanged — harmonization was not needed), **new** `js/core/shared-card.js`, **new** `css/shared-card.css`, **new** `tests/unit/shared-card.test.mjs`, `tests/e2e/cefr-card-reference.spec.js`, `tests/e2e/verbs.spec.js` + `tests/e2e/verb-guided-challenge.spec.js` (inspected; no edits required — all selectors/tokens/flows preserved), fixture (carried forward unchanged), report + evidence paths.
- Risk: high (cross-feature presentation core + seven finding families). Fault families: answer leakage, example presentation, event isolation, keyboard double-activation, shared-renderer bypass — five distinct probes executed (§7).
- Affected boundaries: rendering only. No storage schema, IDs, content, scheduler inputs/outputs, TTS adapter signatures, or public exports changed (`window.verbsEngine` API preserved; guided actions migrated from inline `onclick` to delegated `data-action` handlers with the same token guards; `toggleFavorite` gained a current-card fallback for id-less shared-card buttons — glossary path byte-identical).
- Baseline tests and known failures: RED run of the nine expected-failure targets (9 expected failures, `red-expected-failures.log`); attempt-01/02 suites otherwise green at base; pre-existing words-audio baseline failure discovered in the final broad run and proven pre-existing at base (§6, §9).

## 3. Changes and rationale

| File | Change/purpose | Contract/WP criterion | Compatibility impact |
|---|---|---|---|
| `js/core/shared-card.js` (new, 110 lines) | Pure shared presentation module: `renderSharedCard` (shell + block + lazy back), `renderCardFront`, `renderCardAffordances` (real buttons, no id on favorite), `renderHintBox` (lazy text), `renderExampleBlock` (first example + always-visible translation). Imports only `sanitize` from `utils.js`. | Owner decisions 1/2/4; FP-DESIGN-009; GC-UI-001; LF-CARD | None — new module, no callers before this change |
| `css/shared-card.css` (new, 74 lines) | Scoped shared-block styles: 44×44 primary targets (`card-affordance` + grade/nav/guided buttons), `:focus-visible` indicator, `prefers-reduced-motion` off-switch, example-block button/translation styles, non-flippable cursor fix | LF-CARD; GC-UI-009; SC-03/04/05 | Scoped under `.shared-card-block`; glossary table styles untouched |
| `js/core/verbs-engine.js` | Ordinary adapter: `renderCard` rebuilt on the shared module with new helpers (`_buildOrdinaryFrontHtml`, `_buildOrdinaryBackHtml`, `_buildOrdinaryActionsHtml`, `_ordinaryHintText`, `_currentFlashcardVerb`); `flipCard` becomes a surgical class toggle + in-place lazy back fill (focus and per-flip mutation counting preserved); `toggleHint` injects text only while visible; front affordance policy hides German audio in en-to-de/ex-en-to-all. Guided adapter: intro = single-face shared card; recall = shared flip shell with lazy answer back + shared example block; transition/complete banners keep `.guided-card` chrome; guided actions migrated to delegated `data-action` (tokens preserved); `bindEvents` gains the eight `challenge-*` branches, the keydown Enter/Space activation (repeat-guarded, button-target-excluded), the fav current-card fallback, and a mode-aware flip branch; `_activateGuidedCardFlip` implements GC-UI-002 | Owner decisions 1–4; SC-01..07; GC-UI-001..009; FP-UI-004/006 | Public exports preserved; scheduler/persistence untouched; `data-verb-id` removed only from shared-card favorite buttons (glossary rows keep theirs) |
| `verbs.html` | Link `css/shared-card.css`; remove the now-orphaned `.ex-en-chip` style block | DC-004 | None (chip markup removed with the SC-02 fix) |
| `tests/unit/shared-card.test.mjs` (new, 10 cases) | Renderer unit coverage: lazy back, revealed back, first-example+translation, no-translation, no-example, adapter actions placement, no-storage/scheduler/DOM source scan, attribute/text escaping, hidden metadata (no id, empty hidden hint), non-flippable shell | TS-PRE-001; TS-TEST-005/006; FP-DESIGN-009 | None |
| `tests/e2e/cefr-card-reference.spec.js` | Nine `test.fail` wrappers removed ONLY after the transition run (§4); superseded CHARS rewritten to the approved targets; new `SC2-SHELL`, `SC2-KEY-ENTER`, `SC2-KEY-SPACE` tests; `startGuided` helper updated to the shared-shell markers | CM-MOD-002/003; AC-21 | Fixture unchanged (byte-identical) |
| `tests/e2e/verbs.spec.js`, `tests/e2e/verb-guided-challenge.spec.js` | Inspected; **no changes required** — all selectors, drive helpers, token guards and public engine APIs preserved (31/31 regression green) | TS-LOOP-004 | None |

Approach rationale: the adapters own content/actions and pass explicit view-models to a pure renderer (no engine/storage objects cross the boundary — proven by the unit source-scan test); the ordinary flip stays a surgical class toggle so keyboard focus and the MutationObserver transition counting required by the keyboard tests survive; the guided reveal keeps its full re-render (token-guarded) with the shared shell rendered already-flipped. Scope deviations: none. Superseded tests (old → new, all re-pinned to approved behavior): CHAR-03 (all-examples+chip → first-example+visible translation), CHAR-04 (chip click → no click needed), CHAR-07/08 (priority box/absence message → unified block/no box), CHAR-09 (leak pin → secrecy target), CHAR-12 (chip toggle → visibility assertion), CHAR-14 (unreachable surface → reachable + fav operable), CHAR-14a/b flipSurfaceFocused pin (false → true), CHAR-15 (sub-44 pin → 44×44 target incl. nav), CHAR-16 (no-indicator pin → indicator target), CHAR-17 (0.6s pin → 0s target), CHAR-20 (3 examples → 1 + translation), CHAR-21/22 (separate shell → shared shell), CHAR-23/24 sweep targets (`.guided-card` → shared shell/root), SC-01 audio (speakable-answer pin → unavailability mechanism + de-to-en positive contrast), SC-02/SC-07 assertion alignment (💬 glyph inside the sentence button; guided root selector).

## 4. Acceptance-to-evidence mapping

| Criterion / AC row / contract | Test path + exact name | Result | Log/artifact | Tested revision |
|---|---|---|---|---|
| Owner decision 1 — no answer-bearing back content pre-reveal (ordinary) | `SC-01 TARGET (DOM secrecy)`; `CHAR-01` (empty back); `CHAR-09` | PASS | `full-spec-chromium.log`, `full-spec-mobile-chrome.log` | `57df256` |
| Owner decision 1 — no German-answer audio pre-reveal (en-to-de) | `SC-01 TARGET (audio secrecy)`; `CHAR-09` (no front speak, zero ttsCalls) | PASS | same | `57df256` |
| Owner decision 1 — lazy revealed back is the mechanism | unit `unrevealed front…empty lazy back face`, `lazy revealed back…` | PASS | `test-units.log` | `57df256` |
| Owner decision 2 — first example only, translation always visible | `SC-02 TARGET`; `CHAR-03`, `CHAR-04`, `CHAR-07`, `CHAR-09b`, `CHAR-20`; unit example-block cases | PASS | same + `test-units.log` | `57df256` |
| Owner decision 2 — no additional examples on the card | `CHAR-03`/`CHAR-07` (second example absent, `.extra-card-examples` count 0) | PASS | same | `57df256` |
| No stale example on example-less cards | `CHAR-05`, `CHAR-08`; unit no-example case | PASS | same | `57df256` |
| Owner decision 3 — SC-03 44×44 primary targets | `SC-03 TARGET`; `CHAR-15` (incl. grade/nav; Mobile Chrome run of the same spec) | PASS | same | `57df256` |
| Owner decision 3 — SC-04 visible keyboard focus (any technique) | `SC-04 TARGET`; `CHAR-16` (technique-agnostic, Tab-real, `:focus-visible`) | PASS | same | `57df256` |
| Owner decision 3 — SC-05 reduced motion | `SC-05 TARGET`; `CHAR-17` | PASS | same | `57df256` |
| Owner decision 3 — SC-06 pointer/Enter/Space independent, exactly one transition, duplicates never grade/advance | `CHAR-02` (pointer), `SC-06 TARGET (Enter)`, `SC-06 TARGET (Space)`, `CHAR-14a/14b` (control keys), `SC2-KEY-ENTER`, `SC2-KEY-SPACE` (guided card keys) | PASS | same | `57df256` |
| Owner decision 3 — canonical flip surface keyboard reachable | `CHAR-14`, `SC-06 TARGET (Enter/Space)` (tabWalk `flipSurfaceFocused`), `SC2-KEY-*` | PASS | same | `57df256` |
| Owner decision 3 — inner buttons independent, never bubble | `CHAR-10`, `CHAR-11`, `CHAR-12`, `CHAR-25`; `SC2-KEY-*` duplicates; unit actions test; fault probes 3b/4 | PASS | same + probe logs | `57df256` |
| Owner decision 4 — same core shell both modes | `SC2-SHELL`; `CHAR-21`, `CHAR-22`, `CHAR-23`, `SC-07 TARGET` | PASS | same | `57df256` |
| Owner decision 4 — mode-specific actions adapter-controlled | `CHAR-13` (ordinary grade), `CHAR-22` (guided controls outside card), `CHAR-21` (intro controls inside card) | PASS | same | `57df256` |
| Owner decision 4 — shared renderer never calls storage/grading/scheduling | unit `no storage/scheduler/persistence/DOM dependency` (source scan) | PASS | `test-units.log` | `57df256` |
| Owner decision 4 — exports preserved, real browser module loading, no console errors | `CHAR-19` (boot, engine export, clean console); guided spec `no browser console errors during the guided flow` | PASS | `full-spec-chromium.log`, `regression-verbs-guided-chromium.log` | `57df256` |
| No parallel old/new renderers left active | diff review: single rendering path per mode; `renderCard`/`renderGuidedChallenge` are the only card renderers | PASS | commit `57df256` diff | `57df256` |
| Duplicate rendering removed only after no-caller proof | DC inventory §8 | PASS | §8 | `57df256` |
| AC-06 / GC-UI-005 — guided subtree secrecy | `CHAR-24` (production root sweep) | PASS | same | `57df256` |
| AC-08 — back controls never flip/grade/advance | `CHAR-12` | PASS | same | `57df256` |
| AC-09 — mobile overflow / touch / focus / reduced motion | `CHAR-18`, `CHAR-28`, `CHAR-15` (Mobile Chrome), `CHAR-17`, visual review | PASS | same + `visual-06…png` | `57df256` |
| AC-21 — tests cannot pass without checking behavior | five fault-probe families, 5 KILLED + 1 documented equivalent mutant | PASS | `probe*.log` | `57df256` |
| Expected-failure transition protocol (RED → unexpected pass → genuine PASS) | `red-expected-failures.log` → `unexpected-pass-transition.log` + `transition-remaining3.json` → unwrapped final runs | PASS | evidence INDEX §Test-first transition | `7747d3c` → `57df256` |
| Regression: Verbs/Guided existing suites | `regression-verbs-guided-chromium.log` (31/31) | PASS | log | `57df256` |
| Regression: complete tracked suite | `full-tracked-suite.log` (183 pass; 2 pre-existing words-audio failures proven at base + 2 Mobile Chrome guided flakes passing isolated; 1 pre-existing skip) | PASS with declared baseline failures | log + isolation logs | `57df256` / base `7747d3c` |

## 5. Complete command ledger

| Command (exact) | Phase + revision | Duration | Exit | Passed/failed/skipped | Artifact | Interpretation |
|---|---|---|---|---|---|---|
| `npx playwright test tests/e2e/cefr-card-reference.spec.js --project=chromium --grep "SC-0[1-7] TARGET"` | RED, `7747d3c` | 17.0s | 0 | 9 passed (= 9 expected failures, 0 unexpected) | `red-expected-failures.log` | Test-first baseline before any edit |
| `node --input-type=module --check < js/core/{verbs-engine,shared-card}.js` | syntax gate, working tree | <1s | 0 | — | (not retained; trivial) | TS-LOOP-001 module-mode parse |
| `node --test tests/unit/shared-card.test.mjs` | unit, working tree | <1s | 0 | 10/0 | (superseded by full units below) | New renderer unit suite |
| `npx playwright test … --grep "SC-0[1-7] TARGET"` (test.fail still in place, after implementation) | transition, working tree (= `57df256` content) | 25.6s | 1 | 6 unexpected passes + 3 expected failures | `unexpected-pass-transition.log` | Six findings' targets proven met at their intended assertions |
| same grep scoped to remaining 3, JSON reporter | transition detail | ~15s | 0 | 3 expected failures | `transition-remaining3.json` | Proves the remaining three failed at stale assertions, not unmet targets (see INDEX) |
| `npx playwright test tests/e2e/cefr-card-reference.spec.js --project=chromium` | full spec attempt 1 | 2.1m | 1 | 26/18/0 | `full-spec-chromium-run1.log` | Diagnosed: stale `startGuided` helper (`.guided-card`), 2 stale 💬 expectations, stale flipSurfaceFocused pin, genuine nav-button 44px gap (fixed in CSS) |
| same | full spec attempt 2 | 1.2m | 1 | 43/1/0 | `full-spec-chromium-run2.log` | Strict-mode locator violation (hidden ordinary card matched); scoped to guided root |
| same | final | 1.2m | 0 | **44/0/0** | `full-spec-chromium.log` | Complete corrected spec, Chromium |
| `… --project="Mobile Chrome"` | final | 1.0m | 0 | **44/0/0** | `full-spec-mobile-chrome.log` | Complete corrected spec, Mobile Chrome |
| `npx playwright test tests/e2e/verbs.spec.js tests/e2e/verb-guided-challenge.spec.js tests/e2e/verbs-dashboard-trophies.spec.js --project=chromium` | affected regression | 1.2m | 0 | **31/0/0** | `regression-verbs-guided-chromium.log` | Existing Verbs/Guided/dashboard suites unchanged and green |
| `npm run test:units` | units | ~3s | 0 | **69/0/0** | `test-units.log` | All tracked units incl. new suite |
| `npx playwright test` (both projects, all specs) | complete tracked regression, `57df256` tree | 6.1m | 1 | 183/4/1 | `full-tracked-suite.log` | Broad gate; failures classified below |
| `npx playwright test tests/e2e/words-audio.spec.js:48 --project=chromium --project="Mobile Chrome"` | isolation | ~30s | 1 | 0/2/0 | `isolated-words-audio.log` | words-audio test fails consistently in isolation on both projects |
| same, in disposable worktree at base `7747d3c`, chromium | isolation at base | ~20s | 1 | 0/1/0 | `isolated-words-audio-BASE.log` | **Pre-existing baseline failure** — reproduced on the unmodified accepted base; not caused by this WP |
| `npx playwright test tests/e2e/verb-guided-challenge.spec.js:837 tests/e2e/verb-guided-challenge.spec.js:348 --project="Mobile Chrome"` | isolation | 3.5s | 0 | **2/0/0** | `isolated-guided-mobile.log` | Mobile Chrome guided failures pass isolated → SC-INFRA-01 parallel-load flake class |
| probe runs 1–5 (see §7; disposable worktree at `57df256`, tests unmodified) | fault probes | ~15s each | 1 (except 3a: 0) | as recorded | `probe1…probe5 logs` | 5 KILLED + 1 equivalent-mutant SURVIVED (documented) |
| `git diff --check` / `git diff --cached --check` / `git diff --check 7747d3c..HEAD` | gates | <1s | 0 | — | INDEX notes | Clean at every stage |
| `node /home/z/my-project/scripts/sc002-visual-review.mjs` | visual evidence, `57df256` | ~90s | 0 | 6 screenshots | `visual-01…06.png` | Six required states, each inspected via vision model (`vlm-inspection-0*.json`) |

No background/duplicate runs were launched (PX-008): each browser command above is a single sequential execution; the two full-spec correction iterations and the four isolation reruns are the documented, diagnosed retries. Zero-selection checks: every `--grep` used was previewed or verified non-zero (RED 9, transition 9/6/3, probes 1–2 tests each).

## 6. Regression and integration

- Ordinary Verbs: 5/5 `verbs.spec.js` + full 44-test reference spec green on both projects; card/grade/nav/favorite/audio flows preserved (CHAR-01..20, `regression-verbs-guided-chromium.log`).
- Guided Verbs: 21/21 guided spec tests green under Chromium, incl. GC-06/07/08/09/11 double-event protections, T3 migration, R1/R2/R3 review flows — the token guard and detached-DOM semantics are behaviorally identical under the delegated `data-action` handlers; SC-INFRA-01 mobile parallel flakes pass isolated.
- Phrases / Conversation / level navigation / favorites-filters / SRS / activity / words-audio (remaining specs): ran once in the complete tracked suite — 183 passed; the single words-audio failure is proven pre-existing at the accepted base (declared, awaiting owner waiver); 1 pre-existing skip (words-audio voice dependency), unchanged.
- Legacy storage / refresh / isolation: untouched (no schema, key or write-path change); `toggleFavorite` fallback only affects id-less shared-card buttons; T3/legacy-alias and refresh-resume guided tests green.
- Audio adapter text AND language: `CHAR-12` (back speak: `machen`/`de-DE`), `CHAR-25` (guided Listen: served infinitive/`de-DE`), `SC-01 audio TARGET` (de-to-en prompt speech preserved), `CHAR-14a/b` (control-key speech); autoplay paths untouched (`verbs.spec.js` autoplay tests green).
- Browser/module startup and console errors: `CHAR-19` boot + export + clean console; guided console-error test green; shared module loads as a real browser ESM import (all card rendering flows through it — proven by the SC2-SHELL/SC-07 shell assertions and probe 5's kill).
- Desktop/mobile/themes/keyboard/reduced-motion/screenshots: all covered — both projects, `:focus-visible` proof, 0s reduced-motion transition, six inspected screenshots (visual-01..06).
- Untested/blocked: real-device/Safari (emulation only), hardware voice output (synthetic double; AUDIO-* owns real utterance integration), A1/B2 card integration (SHARED-CARD-003 scope).

## 7. Test-quality and fault-probe evidence

| Probe | Risk/contract | Production target + exact mutation | Detecting test | Baseline / syntax result | Actual failure | Classification | Integrity proof |
|---|---|---|---|---|---|---|---|
| 1 | Secrecy / LF-CARD, AC-06 | `verbs-engine.js` `renderCard`: `backHtml: this._buildOrdinaryBackHtml(verb)` unconditionally | `SC-01 TARGET (DOM secrecy)` | baseline passing; mutated syntax OK | sweep failed: "pre-reveal leaks (26 unique carriers)" | **KILLED** | file hash identical before/after restore |
| 2 | Example presentation / LF-CARD, SC-02 | `shared-card.js` `renderExampleBlock`: translation line removed | `SC-02 TARGET` | passing; syntax OK | `.ex-en-line` not found (toBeVisible failed) | **KILLED** | hash restored identical |
| 3a | Event isolation (guard clause) / FP-DESIGN-008 | `verbs-engine.js` flip branch: `!e.target.closest('button')` guard removed | `CHAR-10` | passing; syntax OK | test still PASSED — nearest-`[data-action]` routing already isolates every current inner control; the guard is defense-in-depth only | **SURVIVED — equivalent mutant (documented; guard retained)** | hash restored identical |
| 3b | Event isolation (real mechanism) / AC-08 | `verbs-engine.js` favorite branch additionally calls `this.flipCard()` | `CHAR-10` + `CHAR-11` | passing; syntax OK | `expect(state.flipped).toBe(false)` received `true` | **KILLED** | hash restored identical |
| 4 | Keyboard double-activation / LF-CARD, SC-06 | `verbs-engine.js` keydown handler calls `flipCard()` twice per keypress | `SC-06 TARGET (Enter)` | passing; syntax OK | `toHaveClass(/flipped/)` failed — net-zero double toggle detected (mutation count also violated) | **KILLED** | hash restored identical |
| 5 | Shared-renderer bypass / GC-UI-001, AC-04 | `verbs-engine.js` `renderChallengeRecall` returns legacy `.guided-card` markup | `SC-07 TARGET` + `SC2-SHELL` | passing; syntax OK | both failed — no `.verb-flashcard` in guided root | **KILLED** | hash restored identical |

Probe selection: five distinct families exactly as assigned (leakage, example divergence, event isolation, keyboard double-activation, adapter bypass); high-risk change → five probes per TS-MUT-001. Mutations were applied only to production files in a disposable worktree at `57df256`; tests, fixtures, config and runner untouched (TS-MUT-002/007). Integrity: `js/core/verbs-engine.js` = `9c7385a6…b27cc1f` and `js/core/shared-card.js` = `3e90c4c1…a1d65dd` recorded before the probes and re-verified byte-identical after each restore (`probe-hashes-before.txt` + per-probe logs). Invalid attempts: probe 3a initially survived; investigated per TS-MUT-005 — equivalent mutant (the delegation routing IS the isolation for current markup), re-probed against the real mechanism (3b) which was killed; no expected results were rewritten to force outcomes. No conditional assertions, weak mocks, ignored errors or snapshot changes were introduced; the one fixture-keyed branch in `CHAR-24` is driven by fixture data (independent oracle), not implementation state.

## 8. Dead-code and dependency inventory

| Candidate symbol/path | Searches + dynamic caller checks | Classification | Disposition | Regression proof |
|---|---|---|---|---|
| `.ex-en-chip` styles (`verbs.html` inline block) + chip delegation guard clause | `rg` across `verbs.html css js tests`: chip markup existed only in the old `renderCard` back; after the SC-02 fix no production emitter remains (tests assert its ABSENCE) | PROVEN_ORPHAN (created by this change) | Removed (styles + obsolete guard sub-clauses) | full spec green; `CHAR-03`/`CHAR-06` assert absence |
| `.back-example-priority-box`, `.extra-card-examples`, card-scope `.ex-row-toggle-btn` | `rg` across production + CSS: no remaining emitters or style rules (old markup was inline-styled; glossary keeps its own `.ex-row-toggle-btn` for TABLE rows) | PROVEN_ORPHAN (created by this change) | Removed with the unified example block | `CHAR-07` asserts absence; glossary row-toggle still exercised by `verbs.spec.js` |
| `hasEn` local + old front/back template closures in `renderCard` | replaced by explicit helpers; no dangling references (syntax gate + full suite) | PROVEN_ORPHAN (created by this change) | Removed | 44/44 both projects |
| Empty decorative `.guided-spacer-note` div in `renderChallengeIntro` (was `display:none`, empty) | `rg` in specs/CSS/JS: no selector or test referenced the empty instance; the class itself remains live for real notes | PROVEN_ORPHAN (created by this change) | Removed (class retained) | guided spec + CHAR-27 green |
| `js/core/shared-card.js` exports | all five imported and exercised by the adapters | DYNAMICALLY_USED | Kept | SC2-SHELL, unit suite |
| Remaining inline `onclick` in `verbs-engine.js` | `rg`: email-auth modal + glossary table rows only — pre-existing, outside this WP's scope (modal/table not card rendering; glossary keeps its own handlers per FP-DIFF-003) | DUPLICATE_BUT_LIVE (pre-existing) | Untouched, reported | glossary/audio tests green |
| `.fav-icon-btn` 28×28 base style | still used by glossary table icons (outside `.shared-card-block`) | DYNAMICALLY_USED | Kept (shared-block scope overrides to 44×44 min) | `CHAR-15` + table visual unchanged |

Search boundary: `rg` over `verbs.html`, `css/`, `js/`, `tests/` for every removed/renamed symbol and selector, plus dynamic `window.verbsEngine`/`data-action`/inline-handler inventory in `bindEvents` and static HTML. No new dependency, lockfile or config change; no IDs, content or storage shapes touched (`git diff --name-only 7747d3c..57df256` = the six permitted files).

## 9. Findings, limitations, and handoff

| Finding ID | Severity/impact | Reproduction and evidence | Disposition | Owner decision needed |
|---|---|---|---|---|
| SC-01 (a–d) answer secrecy, ordinary card | high | `red-expected-failures.log` (31→) vs `full-spec-*.log` sweep now empty | **fixed** (lazy back, lazy hint, id-less favorite, no pre-reveal German audio in secrecy directions) | none |
| SC-02 example presentation | medium | `SC-02 TARGET` + rewritten CHARS now green | **fixed** (first example only, translation always visible; extra examples remain in glossary/autoplay) | none |
| SC-03 44×44 targets | medium | `SC-03 TARGET`, `CHAR-15` (incl. newly covered grade/nav buttons) | **fixed** | none |
| SC-04 focus visibility | medium | `SC-04 TARGET`, `CHAR-16`, `visual-05` | **fixed** (scoped `:focus-visible` outline) | none |
| SC-05 reduced motion | medium | `SC-05 TARGET`, `CHAR-17` | **fixed** (0s transitions under the media query) | none |
| SC-06 keyboard activation | high | `SC-06 TARGET (Enter/Space)`, `SC2-KEY-*`, `CHAR-14*` | **fixed** (tabindex+role flip surface; repeat-guarded keydown; exactly one transition per activation) | none |
| SC-07 shared shell | high | `SC-07 TARGET`, `SC2-SHELL`, `CHAR-21/22` | **fixed** (guided recall + intro render through the shared module; banners stay guided chrome per GC-UI-008) | none |
| BL-03 scheduler mismatch | — | untouched by design (`verb-challenge-engine.js` never edited; forbidden-listed) | **deferred** (unchanged) | separate owner triage (pre-existing) |
| SC-INFRA-01 suite flakiness | low | 2 Mobile Chrome guided tests failed in the 6.1m parallel suite, passed isolated (`isolated-guided-mobile.log`) | **open (pre-existing)** — not authorization to rewrite test infrastructure | optional owner triage |
| OBS-01 transient trophy toast overlap on mobile | low | `visual-06` + VLM transcript; identical behavior observed in SHARED-CARD-001 | **open (pre-existing)** — trophies/toast out of this WP's scope | optional cleanup package |
| New: words-audio baseline failure | medium (evidence hygiene) | `isolated-words-audio.log` + `isolated-words-audio-BASE.log`: fails identically at accepted base `7747d3c` in isolation (words-page highlight-clear timing) | **open (pre-existing, proven)** — words page outside permitted scope; never counted as a pass | **owner waiver or fix assignment** |

- Remaining product risks: Mobile Chrome is emulation (no real-device/Safari certification); synthetic speech only (real utterance language integration belongs to AUDIO-003); keyboard focus after a full guided re-render falls back to `body` (pre-existing guided behavior, consciously preserved; ordinary flip preserves focus).
- Environment restrictions: sandbox credential handling per GITHUB_DELIVERY.md (secure credential helper; token never printed/committed); no sudo (browser deps from the pinned cache).
- Final diff/status: implementation commit `57df256` touches exactly `js/core/verbs-engine.js`, `js/core/shared-card.js` (new), `css/shared-card.css` (new), `verbs.html`, `tests/unit/shared-card.test.mjs` (new), `tests/e2e/cefr-card-reference.spec.js`; no ID/content/storage/dependency/config change (`git diff --check 7747d3c..HEAD` clean; staged gate clean).
- GitHub delivery: branch `codex/glm-shared-card-002-01` (this report + evidence are a docs-only commit on top of `57df256`); remote SHA verification returned in the final handoff message.
- Next proposed WP: SHARED-CARD-003 (adopt shared cards in ordinary levels) — not started; requires assignment.

## 10. Owner/reviewer disposition — not executor approval

- Reviewer and reviewed exact revision: pending review of `57df256` (code) + this delivery branch tip (docs).
- Verdict: pending
- Criteria/findings accepted or declined; explicit waivers and reason: for the reviewer — (1) the pre-existing words-audio baseline failure needs an explicit waiver or a separate fix assignment; (2) the equivalent-mutant result for probe 3a is documented rather than "fixed" (the guard is retained as defense-in-depth); (3) BL-03, SC-INFRA-01 and OBS-01 remain deferred/open as characterized. This report does not approve itself; the executor claims READY_FOR_REVIEW only.
