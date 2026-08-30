# SHARED-CARD-003 / Attempt 01 — Evidence Index

All evidence below was produced in the external sandbox (`/home/z/my-project/words-list-v2`, Debian, Node v24.19.0, npm 11.17.0, Playwright 1.61.1 from the lockfile, chromium + Mobile Chrome emulation). Every log is the sanitized text output of the exact command listed (redaction: `[WebServer]` HTTP request lines removed; no other content was altered; no credentials or user data appear in any file). Tested revisions: base `e55debd4d30ff9e6122c4ff93756ca38732c621a` (baseline + RED), Stage A `9b31bd58c5482dc24b71b094e2fffb43728a466e`, final code `9d9eb61717500062929a4f83e311a428e9163666` (all final evidence).

## Pre-edit characterization and baselines (base e55debd)

| File | Command | Outcome | Revision |
|---|---|---|---|
| `data-characterization.log` | `node scripts/sc003-data-scan.mjs` (disposable copy of the two config parsers as .mjs) | A1: 24 units / 711 cards, all `translationLanguage 'en'`, all cards have example + English example translation. B2: 70 units / 3031 cards — 3× en (19-74, 45-18, 47-11), 3028× mixed, 0× ar; 481 no-example cards; 123 example-without-translation (sentence cases only deep in unit 69, e.g. 69-80); B2 `content/generated/b2/` empty (phrases/conversation missing-content states are real B2 behavior) | e55debd |
| `baseline-words-audio-chromium.log` | `npx playwright test tests/e2e/words-audio.spec.js --project=chromium` | **1 failed** — `words-audio.spec.js:48` highlight-clear timing (`expected 0, received 1` at line 77). Mandatory base measurement of the known failure; identical at the final revision (see final logs) | e55debd |
| `baseline-affected-chromium.log` | `npx playwright test tests/e2e/srs.spec.js tests/e2e/activity-streak.spec.js tests/e2e/favorites-filters.spec.js --project=chromium` | **6 passed** / 0 failed | e55debd |
| `baseline-phrases-chromium.log` | `npx playwright test tests/e2e/phrases-conversations.spec.js --project=chromium` | **11 passed / 1 skipped** (pre-existing desktop skip of the mobile-only test) | e55debd |
| `baseline-units.log` | `npm run test:units` | **73 passed** / 0 failed | e55debd |

## RED evidence (base e55debd, before any production edit)

| File | Command | Outcome | Intended failing assertions |
|---|---|---|---|
| `red-unit.log` | `node --test tests/unit/flashcards.test.mjs` | **3 passed / 2 failed**, exit 1 | Both new unit cases failed (`translationDisplayAttrs`, `firstExample` did not exist — ReferenceError) while the 3 pre-existing cases stayed green |
| `red-e2e-chromium.log` | `npx playwright test tests/e2e/cefr-cards.spec.js --project=chromium --timeout=9000` | **4 passed / 41 failed**, exit 1 (6.4m) | All 41 failing tests failed at their intended target assertions — overwhelmingly `expect(locator('#fc-card-mount .verb-flashcard')).toBeVisible()` (the shared card does not exist in the legacy presentation); the 4 passing tests are exactly the protected legacy behaviors (phrases tab, phrase flashcards, conversation tab, B2 missing-content states) |

## Final evidence (final code revision 9d9eb61)

| File | Command | Outcome |
|---|---|---|
| `final-units.log` | `npm run test:units` | **75 passed** / 0 failed, exit 0 (73 pre-existing + 2 new) |
| `final-cefr-cards-chromium.log` | `npx playwright test tests/e2e/cefr-cards.spec.js --project=chromium` | **45 passed** / 0 failed, exit 0 (1.3m) |
| `final-cefr-cards-mobile.log` | `npx playwright test tests/e2e/cefr-cards.spec.js --project="Mobile Chrome"` | **45 passed** / 0 failed, exit 0 (1.1m) |
| `final-reference-chromium.log` | `npx playwright test tests/e2e/cefr-card-reference.spec.js --project=chromium` | **49 passed** / 0 failed, exit 0 — German Verbs shared-card reference regression |
| `final-reference-mobile.log` | `npx playwright test tests/e2e/cefr-card-reference.spec.js --project="Mobile Chrome"` | **49 passed** / 0 failed, exit 0 |
| `final-affected-existing-chromium.log` | `npx playwright test tests/e2e/srs.spec.js tests/e2e/activity-streak.spec.js tests/e2e/favorites-filters.spec.js tests/e2e/phrases-conversations.spec.js tests/e2e/words-audio.spec.js --project=chromium` | **17 passed / 1 failed / 1 skipped**, exit 1 — the only failure is `words-audio.spec.js:48`, byte-identical to the base measurement (same assertion, line 77) → pre-existing, not introduced by this package |
| `final-words-audio-isolated.log` | `npx playwright test tests/e2e/words-audio.spec.js:48 --project=chromium` (single isolation rerun per failure protocol) | **1 failed** — consistent in isolation; classified pre-existing (same failure class already declared at `7747d3c` and `3af8219` in SHARED-CARD-001-02/002-01 evidence) |
| `final-gc-r1-isolated.log` | `npx playwright test "tests/e2e/verb-guided-challenge.spec.js:1036" --project=chromium` (single isolation rerun) | **1 passed** — R1 failed only inside the 8.5m parallel suite and passes isolated → SC-INFRA-01 parallel-suite flake class (same family as the GC-07 Mobile Chrome flake documented in SHARED-CARD-002-C1-01); verbs/guided production files are untouched by this package |
| `final-full-tracked-suite.log` | `npx playwright test` (complete tracked suite, once after stabilization) | **284 passed / 3 failed / 1 skipped**, exit 1 (8.5m). Failures classified: words-audio:48 both projects (pre-existing, identical at base and final) + verb-guided R1 chromium (SC-INFRA-01 flake, passes isolated). The 1 skip is the pre-existing words-audio voice-dependency skip. 284 = 194 previously passing + all 90 new tests passing |

## Fault-probe evidence (disposable worktree at 9d9eb61, tests unmodified)

`sha256` of `js/core/flashcards.js` (`b2a9de3b…3add`) and `js/core/nav-service.js` (`ce448a83…1cf7e`) recorded before the probes and re-verified byte-identical after every restore; the main working tree was never mutated.

| File | Probe | Mutation (production code only) | Detecting test + exact assertion | Classification |
|---|---|---|---|---|
| `probe1.log` | 1. Example-source substitution | `flashcards.js` `_buildWordsBackHtml`: `sourceText: example.de` → `sourceText: w.de` (vocabulary term instead of the real example) | E2E `SC3-A1-EXAMPLE` — `toHaveText('💬 Hallo, ich bin Anna.')` failed | **KILLED** |
| `probe2.log` | 2. Pre-reveal secrecy removal | `flashcards.js` `_renderWordsCard`: `backHtml: this.flipped ? … : ''` → always built | E2E `SC3-A1-SECRECY-DOM` — subtree sweep found 19 leak carriers (`Hallo!`, `Hallo, ich bin Anna.` incl. `attr:[data-text]`) | **KILLED** |
| `probe3.log` | 3. Wrong-unit persistence | `flashcards.js` `mark()`: srsData write under `'9-99'` instead of `w.id` | E2E `SC3-A1-SRS-WRITE` — exact-ID `toEqual(['1-0'])` failed | **KILLED** |
| `probe4.log` | 4a. Click-flip guard removal | `flashcards.js` mount click `flip` branch: `if (!e.target.closest('button'))` guard removed | `SC3-A1-SECRECY-AUDIO` still passed | **SURVIVED — equivalent mutant** (control clicks already resolve to the control's own `data-action` via `closest`, so the guard is redundant defense-in-depth; retained per TS-MUT-005, no coverage gap) |
| `probe4b.log` | 4b. Duplicate-event guard removal (revised, load-bearing guard) | `flashcards.js` keydown handler: `if (target.closest('button, a, select, input, textarea')) return;` removed | E2E `SC3-INT-CONTROLS` — `expect(calls).toHaveLength(1)` / `__flipMutations === 0` failed (one Enter on a focused control caused the card flip instead of — or in duplicate with — the control action) | **KILLED** |
| `probe5.log` | 5. Phrase/word source isolation removal | `nav-service.js` `switchUnit`: the `state.flashcardSource = 'words'` sync removed (legacy desync restored) | E2E `SC3-REG-SOURCE-BOUNDARY` — `waitForFunction` for `data.known.length === 1` timed out (the word grade was routed into `knownPhrases`) | **KILLED** |
| `probe6-unit.log`, `probe6-e2e.log` | 6. Direction/language mutation (Arabic or mixed treated as English) | `flashcards.js` `translationDisplayAttrs`: always `{ dir: 'ltr', lang: 'en' }` | unit `SHARED-CARD-003 unit: translationDisplayAttrs…` (ar→rtl case) AND E2E `SC3-B2-SYNTH-AR` — `toHaveAttribute('dir', 'rtl')` failed | **KILLED** |

## Intermediate iteration evidence (working tree during stabilization; not final-revision proof)

The targeted iteration runs that diagnosed and fixed the three implementation/test issues before the Stage A commit (missing `#fc-de` compatibility id; the un-awaited `addInitScript` race in `prepareLevelPage`; the `#fc-en` pre-reveal count expectation and unit-2 word count in two tests) were run with `--grep` against the working tree and are summarized in the report's command ledger. Their outputs were overwritten by later runs of the same commands; the final logs above are the retained proof.
