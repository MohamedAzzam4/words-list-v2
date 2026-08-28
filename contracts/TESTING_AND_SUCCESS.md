# Testing and Success Contract

Contract: **TS**, version **2.0**, status **ACTIVE** for portable product development.

This revision replaces v1.3's machine allowlists, command gates, private review orchestration, and RAM/ROM reporting with portable evidence and human/frontier acceptance. The enforcement runtime stays paused. Product safety and the obligation to prove behavior are unchanged.

## Philosophy: test requirements, then integration, then regressions

- **TS-PRE-001:** Every new/changed requirement must have an explicit acceptance case and executable proof where feasible. "Tests for everything" means no requirement silently omitted; it does not mean exhaustive proof of all possible inputs or 100% coverage guarantees.
- **TS-PRE-002:** Map the actual path from UI/config through domain logic, storage/audio adapters, and back to the user. A mocked helper test cannot prove the real caller forwards its arguments or persists the correct record.
- **TS-PRE-003:** Run the smallest relevant pre-edit baseline. Capture a failing regression test for a bug, or a failing acceptance test for a new behavior, before implementing its fix. If only manual reproduction is feasible, state why and capture reproducible evidence; do not invent RED results.
- **TS-PRE-004:** A refactor preserves behavior with characterization tests. An intentional behavior change names the exact superseded rule/assertion. Never bless every observed bug as desired behavior.
- **TS-PRE-005:** Make a risk map covering positive, negative, boundary, lifecycle, compatibility, and regression cases. Mark inapplicable categories with reasons.

## Test quality

- **TS-TEST-001:** Assert exact behavior and important forbidden side effects, not only existence, truthiness, a CSS class, or a pass count. Example: a favorite click leaves card ID, reveal, cursor, and SRS unchanged while updating only that favorite.
- **TS-TEST-002:** No conditional assertions that bypass required behavior, such as "if the button exists, click and assert." Assert required setup first. Do not hide failures with try/catch, optional chaining, early returns, blanket skips, or zero-test filters.
- **TS-TEST-003:** Do not delete/weaken unrelated assertions, regenerate snapshots blindly, increase timeouts, add retries, or add sleeps to manufacture green results. Explain any legitimately changed expectation against the approved contract.
- **TS-TEST-004:** Inject time/RNG and drive actual completion callbacks. Prefer event/state waits to wall-clock sleeps. Mock browser speech, not the application logic being tested. Check utterance text AND language through the real application adapter.
- **TS-TEST-005:** Give new tests a stable contract/WP identifier. Keep expected outcomes independently specified; do not compute the oracle with the same algorithm under test.
- **TS-TEST-006:** Keep unit tests for pure domain calculations, integration tests for real adapters/state boundaries, and E2E tests for user flows. A browser import/startup test supplements VM tests that strip module syntax; those VM tests alone cannot prove exports work.
- **TS-TEST-007:** Seed synthetic legacy/current/malformed state and verify both immediate writes and reload. Never use a real account or erase real progress. Test level and account isolation where touched.
- **TS-TEST-008:** For UI changes verify desktop/mobile, pointer/keyboard/focus, reduced motion, applicable themes, first-example visibility, hidden-answer DOM/accessibility leakage, and absence of new console errors. Inspect screenshots yourself; do not claim visual QA because a screenshot file exists.

## Efficient verification ladder

- **TS-LOOP-001:** Parse changed JavaScript in its correct module mode before launching browsers. Browser ESM files live in a CommonJS package: do NOT remove exports, change package type, or use the paused enforcement checker just to satisfy Node. Commands are in `docs/cefr/GLM_HANDOFF.md`.
- **TS-LOOP-002:** During iteration run one test file, case, line, or literal title tag with `--grep`. Preview selection with `--list`; zero selected tests is missing coverage, not success.
- **TS-LOOP-003:** Once the focused case passes, run affected tests and relevant real caller integration on Chromium.
- **TS-LOOP-004:** Once the implementation stabilizes, run full units and the relevant regression files/projects after the final material edit. A shared core, storage, or cross-feature change requires the entire tracked suite before readiness, unless the owner explicitly approves a documented baseline-failure waiver.
- **TS-LOOP-005:** If a broad run fails, preserve its output, isolate the failure, and iterate only the affected case. Rerun the broad required set once the correction is stable; document why each rerun occurred. Do not launch repeated full suites while debugging one failure.
- **TS-LOOP-006:** One browser suite at a time in a given checkout/server. Track PID/run ID and await its exit. Do not edit its inputs mid-run. Kill only your own stalled processes after collecting diagnostics and recording cancellation.
- **TS-LOOP-007:** Final evidence becomes stale after a source/test/fixture/dependency/config edit. Report-only edits do not stale code evidence. A canceled/infrastructure-failed run is not proof of pass or product failure.
- **TS-LOOP-008:** If output stops progressing, inspect the current test, elapsed time, configured timeout, server/browser health, and process status before deciding it is hung. The 30-second configured timeout is per test, not the entire suite. Never respond to waiting by starting another identical run.

## Regression selection matrix

All code packages require final full units plus their affected integration. This matrix adds minimum E2E coverage; it is not a menu from which to omit tests affected by the dependency graph.

| Changed behavior | Existing regression anchors | Additional proof |
|---|---|---|
| Data/parser/IDs | `tests/unit/level-data.test.mjs`, `tests/unit/storage.test.mjs` | Every real A1/B2 card, legacy records, invalid data, language edge cases |
| Card rendering/interaction | `tests/e2e/verbs.spec.js`, `tests/e2e/verb-guided-challenge.spec.js`, `tests/e2e/favorites-filters.spec.js`, `tests/e2e/srs.spec.js` | Explicit A1 AND B2 card tests; hidden-answer/keyboard/mobile cases |
| Level navigation/shared UI | `tests/e2e/phrases-conversations.spec.js`, `tests/e2e/words-audio.spec.js` | Unit switches, tab preservation, first example and translation |
| Audio | `tests/e2e/words-audio.spec.js`, `tests/e2e/phrases-conversations.spec.js`, `tests/e2e/verbs.spec.js` | Pure sequence tests and actual adapter utterance/language, pause/resume/stop/races |
| Review/favorites/session resume | `tests/e2e/srs.spec.js`, `tests/e2e/favorites-filters.spec.js`, `tests/unit/storage.test.mjs` | New aggregation/session/resume cases for both levels, independent units/accounts |
| Shared core/storage/refactor | All tracked unit and E2E files | Startup, export integrity, compatibility, no dead callers, broad regression |
| Documentation only | Link/path/ID checks and diff inspection | No application behavior claims based solely on docs checks |

Chromium and Mobile Chrome are the configured projects; Mobile Chrome is emulation, not a real-device or Safari certification. No current B2 E2E coverage should be assumed merely because A1 passes.

## Test-the-tests: controlled fault injection

- **TS-MUT-001:** For changed domain logic, negative tests must show rejected bad inputs or forbidden state transitions. Additionally, risk-sensitive changes need implementation fault probes in disposable copies: one per changed risk family; medium risk at least three distinct probes, high risk at least five. Assign risk before implementation. Documentation-only or pure style changes need no artificial mutation quota; explain applicability.
- **TS-MUT-002:** A probe changes production behavior only, not tests, expectations, snapshots, fixtures, runner config, or the assertion library. Example: allow 51 cards or remove level filtering in an isolated planner copy; unchanged tests must catch it.
- **TS-MUT-003:** Record target/diff, risk/contract, expected detecting test, unmodified baseline result, mutated syntax check, actual test failure, and source-tree integrity before/after. Independently derive expected failure; do not count a syntax crash as detection.
- **TS-MUT-004:** Classify: `KILLED` = valid behavioral mutant, passing baseline, and the intended test fails for the intended reason; `SURVIVED` = the test does not detect it; `INVALID_MUTATION` = syntax/invalid patch; `BASELINE_INVALID` = original test fails; `INFRASTRUCTURE_FAILURE` = test cannot execute. A nonzero exit alone is not KILLED.
- **TS-MUT-005:** A survivor prompts investigation of coverage or an equivalent mutant, not rewriting the expected result to force failure. Add a real regression test if a gap exists, rerun against unmodified implementation, and retain all attempts. Invalid draft probes may be corrected transparently; do not conceal retries.
- **TS-MUT-006:** Cover distinct failure families, not five copies of one assertion. Examples: wrong-level membership, unseen-as-due, oversize/duplicate chunking, reshuffle on resume, duplicate grading, or wrong-language speech. These are bounded probes, not proof that every defect is detectable.
- **TS-MUT-007:** No new mutation framework is required. Use an isolated disposable Git checkout/copy containing the candidate, record exact patches/commands, and never mutate the owner's original working tree or production data.

## Success and limitations

- **TS-DONE-001:** All assigned criteria have real evidence and the approved behavior agrees with implementation.
- **TS-DONE-002:** Required regression tests pass on the final material revision; exceptions are explicitly owner-approved, not agent-declared.
- **TS-DONE-003:** No unrelated content, IDs, stored progress, dependencies, or tests are changed.
- **TS-DONE-004:** Required UI, persistence, language, and dead-code checks have evidence.
- **TS-DONE-005:** `git diff --check` and final diff/status inspection pass; the report satisfies DR.
- **TS-DONE-006:** Unavailable browser binaries, CDN access, Python, credentials, or hardware voice playback are named limitations. Do not count them as successful tests; synthetic speech tests do not establish real voice availability.
- **TS-DONE-007:** The executor can report `READY_FOR_REVIEW`, not owner acceptance. External sandbox success does not eliminate independent review.
