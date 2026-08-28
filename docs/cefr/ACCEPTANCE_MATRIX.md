# CEFR Acceptance and Regression Matrix

Status: approved acceptance targets; not a claim that rows currently pass. Bind each row to exact tests/logs/revision in a WP report. Proposed test names/files must be implemented before being cited as evidence. See `BASELINE.md` for what actually exists.

| ID / contract | Observable acceptance and adverse case | Owning packages | Required proof |
|---|---|---|---|
| AC-01 / LF-DATA | A1/B2 unit counts, ordered IDs, original words and stored progress are unchanged | LEVEL-DATA-001..003, REFACTOR-004 | Real dataset snapshots, legacy/current storage loading, negative reordered-ID case |
| AC-02 / LF-DATA | German example and its actual translation survive parsing; display aliases agree with normalized fields | LEVEL-DATA-002..003 | Exact values from real/synthetic rows, mismatch rejection, no-example case |
| AC-03 / LF-DATA, LF-AUDIO | English-only slash alternatives are not misclassified; Arabic-only and mixed data use separate language text | LEVEL-DATA-002..003, AUDIO-001..003 | Language maps plus real adapter utterance text/lang, not only a mock wrapper call |
| AC-04 / LF-CARD, GC-UI-001 | One generic card presentation, distinct ordinary/Guided controls, no verb-only sections in level cards | SHARED-CARD-001..003 | Shared ownership/code inspection and browser behavior for all consumers |
| AC-05 / LF-CARD | Revealed back shows first German example AND its translation without another click; does not repeat vocabulary as example | SHARED-CARD-003 | A1/B2 exact visible sentences; second example absent on card; no stale previous example |
| AC-06 / LF-CARD, GC-UI-005 | Unrevealed production card exposes no German answer/example/audio via DOM, title, data attributes, or accessible text | SHARED-CARD-002..003 | Entire card subtree negative assertions before reveal; correct back after reveal |
| AC-07 / LF-CARD, GC-STATE-004 | Pointer, Enter and Space each reveal correctly; duplicate input never double-grades | SHARED-CARD-001..003, REVIEW-004 | Independently exercised inputs, state/cursor/storage before and after duplicates |
| AC-08 / LF-CARD | Audio, favorite and back details cannot flip, grade, or advance | SHARED-CARD-002..003 | Compare complete relevant state and exact expected favorite/audio side effect |
| AC-09 / LF-CARD | Mobile without horizontal overflow; visible keyboard focus, 44x44 primary targets, reduced motion, appropriate themes | SHARED-CARD-001..003, REFACTOR-003 | Automated dimensions/style checks plus inspected matching screenshots |
| AC-10 / LF-NAV | Units remain authoritative; no verbs deck strip; Phrases/Conversation preserved by configuration | SHARED-CARD-003, REVIEW-003 | Real level/tab/unit navigation, phrase/conversation regressions and missing-content states |
| AC-11 / LF-AUDIO | Repeat/examples/include-translation/start-at form exact deterministic speech steps | AUDIO-001..003 | Pure sequence tables plus real controller integration, zero/multiple-example cases |
| AC-12 / LF-AUDIO | Pause/resume/stop, completion, highlight/scroll and floating state agree with queue; stale callbacks cannot restart it | AUDIO-002..003 | Callback-driven lifecycle, delayed and duplicate events, navigation cleanup |
| AC-13 / LR-AGG | Due counts include scheduled due cards only, never new cards or another level | REVIEW-001, REVIEW-003 | Controlled clock at exact boundary, missing/future/invalid SRS, same IDs across levels |
| AC-14 / LR-AGG | Favorite and due sources have independent total/per-unit counts; duplicate storage IDs counted once | REVIEW-001, FAVORITES-001 | Exact candidate sets, overlap, duplicate/stale ID and empty cases |
| AC-15 / LR-SESSION | All/unit actions create complete balanced plans, no missing/duplicate ID and max 50 | REVIEW-002..004, FAVORITES-001 | Sizes 0/1/49/50/51/99/100/101/large; preview and actual session size; property invariants |
| AC-16 / LR-SESSION | Shuffle once with stored seed; membership freezes; next chunk requires explicit action | REVIEW-002..005 | Identical seeded inputs, due/favorite changes during plan, no forced chunk continuation |
| AC-17 / LR-STORAGE | Grading affects original level/unit record only, no secondary mastery system | REVIEW-004..005 | Immediate writes, duplicate-grade no-op, refresh, other-level/unit unchanged |
| AC-18 / LR-SESSION, LR-STORAGE | Same-device resume restores exact order/chunk/cursor/reveal; account/level isolated | REVIEW-005 | Reload at multiple boundaries, corrupt/unknown state recovery without erasing progress |
| AC-19 / LR-AGG, LR-SESSION | Unfavorite updates future counts but active plan is stable until explicit restart/completion | FAVORITES-001 | Star/filter/resume interactions, due status unchanged merely by favoriting |
| AC-20 / FP, DC | Refactors preserve behavior, exports, dynamic actions and storage aliases; removed code is proven unreachable | REFACTOR-001..004 | Before/after regression, caller/selector inventory, no new import/console errors |
| AC-21 / TS, DR | Tests cannot pass without checking required behavior; mutants change implementation, not tests | All code WPs | Assertion review, test selection count, RED evidence, distinct valid fault probes and retained failures |
| AC-22 / PX, DR | Complete honest report, exact tested revision and accessible evidence; no scope drift or self-acceptance | All WPs | Criteria-to-proof table, command ledger, diff review, owner verdict field |
| AC-23 / LF-DATA, LF-NAV | Future levels plug into shared implementation via validated config/content, with approved provenance and frozen IDs | CONTENT-* | Human content approval, shared runtime reuse, new-level and existing-level regression |

## Reviewer procedure

1. Confirm base/candidate commits and assigned scope. Read product requirements independently before accepting the report's narrative.
2. Inspect changed tests before implementation: can they skip the required action or use the implementation as their expected-value oracle? Verify fixture realism and actual caller integration.
3. Review source, public exports, UI paths, persistence and race boundaries. Check dead-code evidence, especially dynamic handlers.
4. Reproduce high-risk adverse cases and sample raw logs; independently rerun the critical targeted tests. Use distinct fault families for test-quality review, not one trivial mutation.
5. For every applicable row record pass, finding, or explicitly owner-approved limitation. Unknown is not pass.
6. Return `CHANGES_REQUESTED` with stable finding IDs or record exact-revision acceptance. Do not equate green tests, a model report, or workflow completion with product correctness.

No process promises detection of every possible defect. The matrix makes omissions visible and reproducible; it does not replace technical judgment.
