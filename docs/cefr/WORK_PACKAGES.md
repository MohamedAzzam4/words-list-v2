# CEFR Flashcards and Review Center — Detailed Work Packages

Version 1.0, 2026-08-29. This catalog elaborates every WP in `Refactoring documentation/plans/CEFR_LEVEL_FLASHCARD_STANDARD_AND_REVIEW_CENTER_ROADMAP.md`; it adds `VERIFY-001` for the roadmap's final verification phase.

## How to execute

Read `AGENTS.md` and all active portable contracts first. A WP is a review-sized delivery, not permission to execute later packages. Status here is initial handoff status, not a live automatic tracker. Accepted revisions/reports form the progress ledger.

Common requirements for EVERY package:

- Entry: assigned WP, approved dependency revisions, baseline commit and clean status recorded.
- Before edits: list exact write paths within the scope below, before/after behavior, contract IDs, risk, test map, and existing failures.
- Scope: listed paths are boundaries, not an instruction to edit them all. New files in allowed families need exact names in the pre-edit plan. Read relevant callers freely, excluding secrets/private data. Scope expansion requires approval.
- Exit: every package-specific criterion AND `TS-DONE-*` and `DR-*` satisfied; complete `docs/cefr/reports/<WP-ID>-<attempt>.md`; no open unwaived required criteria. Owner acceptance is separate.
- Common allowed documentation: the current package report and narrowly affected architecture notes under `docs/cefr/`. Only documentation WPs explicitly assigned by the owner may change contracts, roadmap, or this catalog.
- Default forbidden scope: enforcement, hooks, CI, dependency manifests/lockfile, auth/cloud configuration, unrelated code/content, stored-ID changes, other packages. Exceptions must be explicitly assigned.
- Tests: existing anchors in `contracts/TESTING_AND_SUCCESS.md`; new test paths below are proposed deliverables, NOT already-existing passing tests. Evidence must include failed and final runs, test-quality review, and dead-code inventory.
- Medium/high-risk code changes require distinct fault probes per TS-MUT, in disposable copies only. No mutation is required for report-only packages.

## Dependency and initial status register

| WP | Depends on accepted work | Initial status / risk |
|---|---|---|
| BASELINE-001 | Handoff branch | FIRST ASSIGNMENT / low |
| LEVEL-STD-001 | BASELINE-001 | Contract drafted; baseline reconciliation needed / low |
| LEVEL-DATA-001 | LEVEL-STD-001 | Characterization present; validate / medium |
| LEVEL-DATA-002 | LEVEL-DATA-001 | Additive schema implemented; validate / medium |
| LEVEL-DATA-003 | LEVEL-DATA-002 | Validator implemented; validate / medium |
| SHARED-CARD-001 | LEVEL-DATA-003 | Not started / medium |
| SHARED-CARD-002 | SHARED-CARD-001 | Not started / high |
| SHARED-CARD-003 | SHARED-CARD-002 | Not started / high |
| AUDIO-001 | LEVEL-DATA-003, SHARED-CARD-001 | Not started / medium |
| AUDIO-002 | AUDIO-001 | Not started / high |
| AUDIO-003 | AUDIO-002, SHARED-CARD-003 | Not started / high |
| REVIEW-001 | LEVEL-DATA-003 | Not started / medium |
| REVIEW-002 | REVIEW-001 | Not started / medium |
| REVIEW-003 | REVIEW-002, SHARED-CARD-003 | Not started / medium |
| REVIEW-004 | REVIEW-003 | Not started / high |
| REVIEW-005 | REVIEW-004 | Not started / high |
| FAVORITES-001 | REVIEW-005 | Not started / high |
| REFACTOR-001 | FAVORITES-001, AUDIO-003 | Not started; justify remaining extraction / high |
| REFACTOR-002 | REFACTOR-001 | Not started; justify remaining extraction / high |
| REFACTOR-003 | REFACTOR-002 | Not started / medium |
| REFACTOR-004 | REFACTOR-003 | Compatibility audit pending / high |
| DOCS-001 | REFACTOR-004 | Final architecture documentation pending / low |
| DOCS-002 | DOCS-001 | Product contract drafted; final alignment pending / low |
| DOCS-003 | DOCS-002 | Prompt/report templates provided; final validation pending / low |
| DOCS-004 | DOCS-003 | Acceptance matrix provided; final evidence mapping pending / low |
| VERIFY-001 | DOCS-004 | Release verification pending / high |
| CONTENT-DECISION-001 | VERIFY-001, explicit owner source decision | DEFERRED / low |
| CONTENT-B1-001 | CONTENT-DECISION-001, approved B1 material | DEFERRED / high |
| CONTENT-A2-001 | CONTENT-DECISION-001, approved A2 source/generation instruction | DEFERRED / high |

Default delivery is top-to-bottom. Independent pure-logic packages can be reordered only through an owner assignment. Already-implemented data packages should be validated and accepted, not rewritten to create activity. If one acceptance-only delivery covers several existing packages, the owner names all IDs and the report maps each separately.

## Foundation

### BASELINE-001 — Publishable product baseline and gap report

- Goal/type: DOCUMENTATION/diagnostic; establish what the sandbox actually received, not what older local screenshots showed.
- Read: `docs/cefr/BASELINE.md`, all tracked source/tests, `package.json`, `playwright.config.js`, product contracts.
- Write: only the package report and task-local logs/artifacts. No source, test, contract, dependency, or workflow edits.
- Work: record HEAD/branch/status; inventory files and test selection; run full units, focused favorites/SRS browser checks, and list broad tests. Inspect the real audio adapter, first-example renderer, and verb contract gaps named in BASELINE. Record network/browser/voice limitations.
- Success: exact baseline and results are reproducible; each known gap is confirmed/refuted with file/line evidence; local-only work is not assumed published; no hidden app edits. Report proposed next package and any prerequisite correction separately.
- Test proof: units; two focused Chromium anchors; `--list` inventory; diff/status. Broad failing behavior need not be fixed here.

### LEVEL-STD-001 — Reconcile the behavior contract

- Goal/type: DOCUMENTATION; agree a testable standard against the actual shipped reference.
- Write: `contracts/LEVEL_FLASHCARD_STANDARD.md`, `contracts/CODE_FINGERPRINT.md`, `docs/cefr/ACCEPTANCE_MATRIX.md`, package report; only within owner-assigned documentation scope.
- Work: map ordinary Verbs, Guided Verbs, A1, B2, and future config-only levels; document shared presentation versus adapter-only actions, example placement, direction/secrecy, autoplay, review/favorites, and compatibility. Record existing implementation mismatches, do not silently downgrade target behavior to match bugs.
- Success: every product requirement maps to a stable LF/LR clause and acceptance row; no conflict about units/tabs or first-example visibility; verb scheduler redesign remains excluded; any unresolved behavior decision is presented for approval.
- Tests: verify paths/IDs and walkthrough descriptions; no claimed runtime fixes.

### LEVEL-DATA-001 — Freeze source identity and content shape

- Write: `tests/unit/level-data.test.mjs`, synthetic fixtures under `tests/fixtures/cefr/`, package report. No real vocabulary edits.
- Work: verify all A1/B2 units, ordered IDs/counts, raw field layouts and example pairs; characterize English alternatives, Arabic and mixed translations; document known duplicates with exact IDs.
- Success: A1 24 units/711 cards and B2 70 units/3031 cards retained unless owner explicitly approves content changes; tests detect reorder/removal/new duplication; no silently dropped example translation. Existing counts/hashes are inspected rather than blindly updated.
- Tests: positive real datasets; synthetic missing/extra fields and multilingual examples; independent assertions on source order and aliases. Probe loss of an example translation, ID reassignment, and unit reassignment in a disposable copy.

### LEVEL-DATA-002 — Validate normalized card and compatibility boundary

- Write: `js/levels/a1.config.js`, `js/levels/b2.config.js`, `js/core/level-data-validator.mjs`, `tests/unit/level-data.test.mjs`, `tests/unit/flashcards.test.mjs`; `js/core/flashcards.js` only for normalized-field consumption already in this package's approved scope.
- Work: preserve `levelId`, numeric `unitId`, original `id`, term/type, display aliases, per-language translations, structured examples, and speech text. Verify actual persisted legacy records still resolve. Inspect consumers; report end-to-end audio/renderer gaps for their assigned packages.
- Success: LF-DATA fields are present and consistent; A1 English and B2 mixed/English-only/Arabic-only values are not confused; no raw row rewrite or ID migration; source parsing remains additive.
- Tests: invalid/missing examples, alias disagreement, empty language maps, exact English-only slash cases, real storage loading. Unit wrapper tests alone must not be reported as full audio parity.

### LEVEL-DATA-003 — Validate reusable content checks

- Write: `js/core/level-data-validator.mjs`, `tests/unit/level-data.test.mjs`, synthetic fixtures; no content import.
- Work: verify validator diagnostics for IDs, counts, levels/units, required terms/translations, example pairing, supported language metadata, aliases, and duplicate words. Exact legacy duplicate-ID pairs may be preserved; stale allowances fail.
- Success: current normalized datasets validate; each invalid fixture produces the expected actionable diagnostic; validator is reusable for a future level with explicit expected identity; no catch-all duplicate exemption; source changes cannot be hidden by regenerating a digest.
- Tests: real datasets and one independent negative per check; distinct probes removing ID, language-alias, and duplicate checks. Missing foreign-language content is an error/report, not permission to invent it.

## Shared card presentation

### SHARED-CARD-001 — Characterize the published Verbs reference

- Write: `tests/e2e/verbs.spec.js`, `tests/e2e/verb-guided-challenge.spec.js`, new `tests/e2e/cefr-card-reference.spec.js`, synthetic fixtures, report. No production edits.
- Work: exercise ordinary and Guided cards before extraction. Capture actual DOM/interaction boundaries and compare with GC/LF targets, identifying pre-existing contract failures instead of hiding them in green snapshots.
- Success: tests cover front/back shell, first example/translation, no-example state, favorite/audio controls, pointer/Enter/Space, non-grading back actions, and hidden-answer leakage. Desktop/mobile screenshots are inspected. Any prerequisite mismatch gets a finding requiring owner triage.
- Tests: use real user actions, exact negative state assertions, console/export startup checks; list selected title tags. Existing green behavior stays protected; newly exposed baseline bugs are explicit blockers or approved exceptions, not incidental fixes.

### SHARED-CARD-002 — Extract shared presentation without shared grading

- Write: `js/core/verbs-engine.js`, `verbs.html`, `css/verb-challenge.css`, new `js/core/shared-card*.js` or `.mjs`, `css/shared-card.css`, affected card tests. Do not change the pure challenge scheduler or persistence semantics.
- Work: extract one small responsibility at a time; give adapters explicit content/actions; keep verb-only sections in the verb adapter; retain exports and delegated event behavior; remove only resulting proven duplicate renderer code.
- Success: ordinary/Guided reference tests stay green, generic rendering does not call storage/scheduler, hidden German text/audio is not inserted before reveal, and back controls cannot grade/advance/flip. Import/cache-query integration works in the real page.
- Tests: renderer unit plus real browser caller integration; both browser projects; complete tracked regression after stabilization. Fault families: answer leakage, double activation, wrong adapter action, missing translation, lost focus/keyboard semantics.

### SHARED-CARD-003 — Adopt shared cards in ordinary levels

- Write: `js/core/flashcards.js`, `js/core/app.js`, `level.html`, `css/core.css`, shared-card modules/styles, new `tests/e2e/cefr-cards.spec.js`, affected existing tests.
- Work: integrate A1 first then B2 in separately reviewable changes under the same assigned scope. Keep unit selection, ordinary SRS actions, favorites, and tab configuration; show only first example and translation on revealed back. Do not copy verbs deck navigation or Guided grading.
- Success: both levels use the same presentation implementation; correct sentences are shown, not repeated vocabulary terms; no-example cards leave no stale content; supported directions are safe; phrase/conversation paths are unchanged. Existing data aliases may remain until callers are migrated and tested.
- Tests: A1/B2 real fixtures and empty/multiple-example synthetic cases; hidden-answer DOM, keyboard, 44x44 targets, reduced motion, themes/mobile, immediate and refreshed favorites/SRS; all shared-card regressions. High-risk probes target example source, secrecy, wrong-level grade, duplicate event, tab interference.

## Audio

### AUDIO-001 — Pure speech-sequence planner

- Write: new `js/core/speech-plan*.mjs`, `tests/unit/speech-plan.test.mjs`, synthetic fixtures; no browser controller rewrite.
- Work: produce language-tagged steps from normalized terms/examples, repeat count, example mode, include-translation and starting item. Inputs are explicit; output includes stable item identity for highlighting. Document behavior for invalid options, unavailable text, zero items and out-of-range start.
- Success: deterministic ordering, no mixed display text under a single-language voice, no side effects, no mutation of source arrays; missing language text is skipped/reported consistently without substituting another language.
- Tests: table cases for zero/one/many items, repeat/mode combinations, first/all examples, empty translation, English alternatives, Arabic-only/mixed, start boundaries. Independent step arrays; three distinct sequence/language/start-index probes.

### AUDIO-002 — Verbs autoplay adapter compatibility

- Write: `js/core/verbs-engine.js`, `js/core/tts.js`, speech planner, `verbs.html`/verb styles only for existing controls, audio/verb unit and E2E tests.
- Work: adapt existing Verbs autoplay to the planner without redesigning controls; preserve repeat, examples, include-English, start-at, floating player, highlight/scroll, pause/resume/stop and completion. Invalidate stale callback tokens when queue ownership changes.
- Success: visible controls and actual utterance queue agree; pause retains position; stop/navigation cancel future speech and clear highlights; stale callbacks cannot resurrect or advance a replacement queue. No grading/storage changes.
- Tests: deterministic speech mocks driven through real controller; delayed callback, stop-before-start, rapid restart, completion and empty list; desktop/mobile + full shared regression. Five high-risk probes include language, cancellation, cursor, repeats, stale callbacks.

### AUDIO-003 — Level autoplay and end-to-end language correctness

- Write: `js/core/app.js`, `js/core/tts.js`, `js/core/glossary.js`, `js/core/flashcards.js`, `level.html`, `css/core.css`, speech modules, new `tests/e2e/cefr-audio.spec.js`, affected audio/phrase tests.
- Work: honor explicit language through `window.app.speakText` to actual utterance, not just at the flashcard stub; integrate applicable Verbs controls into current unit/filter; stop or explicitly replace queues on unit/tab/level change.
- Success: A1/B2 parity including repeat/examples/include-translation/start-at/progress; no speech from hidden units; first example remains on card while extra examples can be queued; Arabic is never spoken as English, and no silent fallback mislabels another language. Missing hardware voice has truthful UI/fallback behavior and report.
- Tests: assert real utterance text and lang for both levels; filter/start selection, pause/resume, switching, stale callback, speech error, empty result, phrase/conversation regressions. Full broad regression; separate actual-device voice limitation from deterministic queue proof.

## Review Center and favorites

### REVIEW-001 — Pure current-level aggregation

- Write: new `js/core/review-aggregation.mjs`, `tests/unit/review-aggregation.test.mjs`; only read existing storage/SRS logic.
- Work: accept explicit current level vocabulary, progress/favorites and clock; return total and per-unit candidates/counts for due and favorites separately. Use existing due-time semantics; do not create new SRS intervals.
- Success: only scheduled due cards count, no unseen-as-due; deduplicate stored IDs; ignore/report unknown IDs safely; same local ID in A1/B2 cannot cross levels; favorites independent of due. Counts equal candidate membership.
- Tests: no progress, future/due boundary, invalid dates/state, duplicate/stale IDs, same ID in two levels, unit filter, due/favorite overlap; probes for unseen-as-due, removed level guard, duplicate counting.

### REVIEW-002 — Seeded bounded session plans

- Write: new `js/core/review-session-plan.mjs`, `tests/unit/review-session-plan.test.mjs`.
- Work: deduplicate valid candidates, use injected/stored seed, shuffle once, create balanced chunks with max 50. Keep source/scope and stable ordered IDs; no hidden RNG or clock use.
- Success: empty input produces no empty session; 49/50 -> one session; 51 -> 26+25; 100 -> 50+50; 101 -> 34+34+33; every ID exactly once; same seed/input gives same plan; inputs remain untouched.
- Tests: sizes 0,1,49,50,51,99,100,101 and large synthetic sets; multi-seed invariants without flaky claims that all seeds differ; duplicate input and invalid bound handling. Distinct maximum-size, omission/duplication and determinism probes.

### REVIEW-003 — Counts and session-selection UI

- Write: `level.html`, `js/core/app.js`, new `js/core/review-center*.js`, `css/core.css`, new `tests/e2e/cefr-review-center.spec.js`.
- Work: add a level-wide entry outside unit tabs, Due and Favorites sources, total and per-unit counts, review-all/unit actions, and preview of session sizes before start. Integrate pure aggregation/planning, not a second set of calculations in the UI.
- Success: seeded synthetic progress yields exact totals/unit counts in A1 and B2; empty states are useful and cannot start invalid sessions; navigation/tabs remain intact; mobile/keyboard controls are usable. This WP may stop at plan selection, clearly not claiming completed grading/resume.
- Tests: count/source/scope selection, large-plan preview, zero source, keyboard/focus/mobile, unit navigation regression; medium-risk probes on source selection, unit scope and displayed totals.

### REVIEW-004 — Bounded sessions through shared cards

- Write: `js/core/app.js`, `js/core/flashcards.js`, review controller/session modules, existing storage adapter only as needed for correct original-record writes, review/SRS/favorites tests.
- Work: render one selected chunk; show source unit and card/chunk progress; grade original level/unit records; stop at chunk completion and offer an explicit next-chunk action. Prevent duplicate/stale grade callbacks and no accidental unrelated-unit writes.
- Success: maximum 50 actual reviewed cards per chunk, no unbounded 100-card screen, no second mastery store, exact per-card persistence, frozen membership during activity, explicit exit/next behavior. Existing unit flashcards still work.
- Tests: actual DOM actions and immediate storage assertions in both levels; wrong-unit IDs, duplicate clicks, next chunk/exit, due changes mid-run, level switch. Five high-risk probes cover boundaries, writes, duplicate grading, source unit, auto-advance.

### REVIEW-005 — Exact device-local resume

- Write: review session/controller modules, `js/core/storage.js`, `js/core/app.js`, new `tests/unit/review-session-state.test.mjs`, `tests/e2e/cefr-review-resume.spec.js`.
- Work: version local queue state with level/account/source/scope/seed/order/chunks/cursor/reveal/timestamps. Existing synchronized SRS/favorites remain authoritative. Design invalid-state and missing-ID handling before implementation; no silent loss of progress or invisible reshuffle.
- Success: same-device refresh restores exact queue/chunk/cursor/reveal, never repeats a committed grade, and newly due cards wait for a later plan. Different level/account cannot see another queue; malformed/unsupported state offers safe explicit recovery, preserving underlying progress. Another device builds its own plan.
- Tests: reload before/after reveal, between chunks, after grade, logout/account/level switch, storage write failure, corrupt/legacy queue, missing ID; merging SRS does not silently replace active queue. All storage/broad regressions; at least five distinct persistence fault probes.

### FAVORITES-001 — Complete favorite sessions

- Write: review aggregation/controller/session modules, level UI, favorite/storage adapters only within original-record behavior, review/favorite tests.
- Work: all-unit and per-unit favorites use the same seeded max-50 planner; reflect future count changes after star toggles while keeping active membership stable until completion or explicit restart. Due and favorites remain separate sources.
- Success: favorites do not become due merely from selection; no duplicate card, cross-level write, hidden source switch, or lost favorite on filter changes. Same card may appear in both source summaries but only once in a plan.
- Tests: 0/1/51/101 favorites, due overlap, unfavorite during active plan, resume, per-unit selection, wrong-level ID, all legacy filters; high-risk fault set covers membership, source, storage, resume, chunking.

## Refactoring, documentation, and final validation

### REFACTOR-001 — Level orchestration boundaries and dead code

- Write: `js/core/app.js`, `js/core/flashcards.js`, `js/core/glossary.js`, review/audio/shared-card modules, affected tests; no learning-rule changes.
- Work: inventory current responsibilities first; extract only remaining mixed concerns into existing shared boundaries; inspect dynamic handlers/callers before removing old paths. If earlier work already provides the boundary, document proof instead of inventing another layer.
- Success: smaller responsibility boundaries with unchanged public behavior, no duplicated source of truth, no dangling imports/selectors; explicit dead-code inventory including uncertain/live candidates; full regression unchanged.
- Tests: baseline and final same suites; real public event dispatch, storage/export/startup, both levels/tabs. Any behavior correction must be a separate approved scope.

### REFACTOR-002 — Verbs orchestration boundaries

- Write: `js/core/verbs-engine.js`, shared card/audio modules and verb-specific new modules, affected verb tests; pure challenge scheduler stays behaviorally unchanged.
- Work: separate generic presentation/audio from verb details, Guided control, and ordinary glossary/card orchestration. Audit `window` exports, HTML handlers and dynamic actions before removal.
- Success: same navigation, grading, timing, persistence, and details; no duplicate shared renderer/queue remains where semantics are identical; legacy compatibility hooks preserved unless proven orphaned.
- Tests: full units and broad E2E including Guided/ordinary modes, refresh/review lifecycle, mobile; five applicable interaction/lifecycle probes if logic was moved or changed.

### REFACTOR-003 — Surgical shared style consolidation

- Write: `css/core.css`, `css/verb-challenge.css`, shared-card styles, only markup touched by extracted classes, visual interaction tests.
- Work: identify actual repeated semantics; consolidate without global restyling; inventory selectors in generated and static markup, media queries, themes, and dynamic classes.
- Success: removed selectors are proven unused or replaced, desktop/mobile themes remain visually equivalent, no specificity/overflow/focus/reduced-motion regression. Do not bulk convert inline styles.
- Tests: inspect before/after screenshots at matching sizes/states, keyboard/focus/touch and reduced motion, real card/tab regressions. No artificial mutation quota for CSS-only work; state why.

### REFACTOR-004 — Persisted identity and compatibility audit

- Write: identity/storage/level-data tests and documentation; source fixes only with separately approved finding scope.
- Work: compare legacy ID/order snapshots, app namespaces, SRS/favorite keys, account/level boundaries, and new session keys. Verify future-level registration requirements without adding real B1/A2 content.
- Success: old data still resolves to same words, no reset/downgrade/reassignment; migrations if proposed are explicit, idempotent, monotonic, recoverable, and owner-approved. Unnecessary migrations are not introduced.
- Tests: legacy/current/malformed merge inputs, repeated initialization, same unit-local ID in two levels, reload/account isolation and snapshot negatives; high-risk audit of the compatibility paths with isolated probes.

### DOCS-001 — Document the actual final architecture

- Write: `docs/cefr/ARCHITECTURE.md` (new), relevant architecture references and package report.
- Work: document module ownership, normalized schema/aliases, adapter entrypoints, review aggregation and queue flow, audio ownership, storage/account boundaries, and config-only level integration.
- Success: every described module/API/path exists at the accepted revision; distinguish implemented, deferred, and proposed behavior; document extension points and known limitations without a transcript dump.
- Tests: inspect source-to-doc mappings, relative paths, examples and no stale references.

### DOCS-002 — Final binding-contract alignment

- Write: `contracts/LEVEL_FLASHCARD_STANDARD.md`, `contracts/CODE_FINGERPRINT.md`, `contracts/README.md`, acceptance matrix, report; owner-assigned documentation scope only.
- Work: compare approved target, accepted code and actual tests. Add precise clarification only with approval; never soften a requirement to pass release review. Keep stable IDs and version substantive changes.
- Success: all product requirements have final stable clauses and no contradiction; source safety rules, tab preservation and future-content deferral are explicit; no enforcement reactivation.
- Tests: contract-to-test mapping and referenced-path validation; missing implementation is a finding, not a doc-only fix.

### DOCS-003 — Validate small-model execution templates

- Write: `docs/cefr/GLM_HANDOFF.md`, `docs/cefr/templates/EXECUTOR_PROMPT.md`, `docs/cefr/templates/WORK_PACKAGE_REPORT.md`, relevant setup notes/report.
- Work: instantiate a sample next-task prompt with explicit WP, base commit, scope, contract paths, targeted and final checks, compatibility risks, and output report. Exercise setup on a fresh checkout without relying on host-specific files.
- Success: no unresolved placeholders in the ready-to-send first prompt, no local drive paths/tool-state prerequisites, no claim that prompts enforce themselves; blocked-environment reporting is unambiguous.
- Tests: commands/path checks and clean-clone smoke, preserve exact failure records. No new provider integration or cloud deployment.

### DOCS-004 — Bind the reviewer acceptance matrix to evidence

- Write: `docs/cefr/ACCEPTANCE_MATRIX.md`, report/review ledger references.
- Work: connect each acceptance row to implemented tests and accepted revision artifacts, including adverse cases and mutation families; identify coverage gaps honestly.
- Success: reviewer can accept/reject each requirement without trusting prose summaries; links resolve; no untested feature called complete; critical regression and dead-code review are included.
- Tests: independently sample named evidence; reject unavailable logs, zero selected tests, and unsupported verdicts.

### VERIFY-001 — Release-wide regression and independent review packet

- Write: report and evidence only. A test/source fix requires a separately assigned correction scope.
- Work: use final accepted candidate; run full tracked units/E2E on both configured projects; inspect A1/B2/Verbs parity, real caller language flow, progress compatibility, and dead-code inventory. Gather a neutral diff/criteria/log packet for owner/frontier review.
- Success: all applicable acceptance rows have fresh evidence, unresolved failures/limitations explicitly dispositioned by owner, no hidden scope drift; reviewers can reproduce critical cases. Report `READY_FOR_REVIEW` only with complete required proof, never self-approved release.
- Tests: entire tracked suite, focused critical-case reruns if needed, reviewed screenshots, storage/session/account checks; actual audio hardware testing reported separately. No B1/A2 generation or deployment.

## Deferred content: last and separately authorized

### CONTENT-DECISION-001 — Decide provenance and level content source

- Write: `docs/cefr/CONTENT_SOURCE_DECISIONS.md` (new) and report.
- Work: obtain the owner's B1 material and explicit A2 choice: supplied, approved licensed import, AI draft, or hybrid. Record rights/provenance, language targets, unit grouping, ID policy and human review responsibility.
- Success: owner-approved source per level and import acceptance checklist; no assumption that A2 must be generated and no publication of unreviewed content.
- Tests: completeness of decision/rights records; no runtime tests required for decision-only work.

### CONTENT-B1-001 — Validate/import supplied B1 without platform forks

- Write: approved B1 config/content paths, minimal level registration/navigation, data fixtures/tests; exact files named after source decision.
- Work: map approved units/IDs, normalize translations/examples, run the shared validator, report duplicates within B1 and overlap with other levels without deleting valid learning repetition automatically.
- Success: approved content/provenance preserved, deterministic frozen IDs, no separate B1 renderer/player/review engine, human linguistic approval before publication.
- Tests: dataset counts/order, bad-row negatives, same-level isolation, representative B1 UI/audio/review/resume, plus A1/B2/Verbs regressions. High-risk content/identity probes in disposable copies.

### CONTENT-A2-001 — Approved A2 import or human-reviewed draft

- Write: approved A2 config/content paths and minimal registration; final scope only after source decision.
- Work: if generation is authorized, produce a clearly marked draft with source provenance and linguistic checks (CEFR appropriateness, grammar, articles/plurals, examples, translations); otherwise faithfully import supplied material. Reuse the shared platform and validator.
- Success: human approval of content before publication, fixed unit/ID mapping, duplicates reviewed, no unexplained licensing claims, no copied level engine.
- Tests: same data and platform acceptance as B1, explicit invalid/missing/example/language cases, cross-level storage safety; all existing levels stay green. Unapproved generated text never ships automatically.
