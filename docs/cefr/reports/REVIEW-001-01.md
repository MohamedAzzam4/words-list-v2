# REVIEW-001 — Attempt 01 Delivery Report

## 1. Identity and status

- Status: READY_FOR_REVIEW
- Assigned goal and task type: Pure Current-Level Review Aggregation — `FEATURE` (new pure module; no existing behavior modified; no migration, no UI, no storage change).
- Owner assignment reference: REVIEW-001 assignment message (this conversation) with required base `9c5067b0122d6cfdff61123950584a63e6d95db2`, required branch `codex/glm-review-001-01`, checkpoint-gate protocol, 17-case RED-first test program, six mutation probes, verification ladder, and GitHub delivery.
- GitHub task branch: `codex/glm-review-001-01`; base commit: `9c5067b0122d6cfdff61123950584a63e6d95db2`; final tested code commit: `c956ce41ebf5c0dabeb3f628f355525cdc4875bc`.
- Evidence index: `docs/cefr/evidence/REVIEW-001/01/INDEX.md`
- Final delivered SHA is returned after commit/push in the handoff message, not embedded into its own commit.
- Executor/model and sandbox OS/runtime versions: GLM (Super Z executor); Debian Linux container; Node v24.19.0; npm 11.17.0; git 2.47.3.
- Start/end time: 2026-09-03 ~00:15–02:30 UTC (checkpoint gate through evidence assembly); work directory: `/home/z/my-project/words-list-v2` (branch `codex/glm-review-001-01`).
- Dependency acceptance references: depends on LEVEL-DATA-003 (normalized vocabulary shape, accepted); consumes the persisted progress shape established by storage.js/srs-logic.js/flashcards.js (read-only reference).

## 2. Required reading and pre-edit plan

- Paths fully read: `AGENTS.md`; `contracts/README.md` context via AGENTS.md ordering; `contracts/PORTABLE_AGENT_EXECUTION.md` (PX), `contracts/CHANGE_MANAGEMENT.md` (CM), `contracts/CODE_FINGERPRINT.md` (FP), `contracts/TESTING_AND_SUCCESS.md` (TS), `contracts/DEAD_CODE_AND_REFACTORING.md` (DC), `contracts/DELIVERY_REPORTING.md` (DR), `contracts/LEVEL_FLASHCARD_STANDARD.md` (LF/LR); `docs/cefr/WORK_PACKAGES.md` (REVIEW-001 entry), `docs/cefr/ACCEPTANCE_MATRIX.md` (AC-13, AC-14, AC-21, AC-22), `docs/cefr/GITHUB_DELIVERY.md`; `js/core/storage.js` (full), `js/core/srs-logic.js` (full), `js/core/flashcards.js` (SRS/favorites-relevant sections and full scan), `tests/unit/level-data.test.mjs` (normalized shape and VM harness), `tests/unit/storage.test.mjs` and `tests/unit/flashcards.test.mjs` (relevant scans), `js/levels/a1.config.js` + `js/levels/b2.config.js` (ID scheme: `unitIndex-cardIndex`, same local-ID space in both levels; per-level `appId` progress stores), `js/core/level-data-validator.mjs` (`validateVocabulary` contract: array-of-units, `unitId === unitIndex+1`, empty units allowed), `js/core/app.js` (progress sanitize/legacy-SRS migration: date-only `'2099-01-01'` records; favorites array; srsData map). Date-parse behavior characterized in-sandbox before design lock (V8 rollovers for `2026-02-30`/hour 24; timezone-less datetimes are environment-dependent).
- Observed conflicts: none. One refinement of the in-session pre-edit report: `progress.srsData`/`progress.favorites` that are absent (`undefined`) or `null` are treated as empty **without** a diagnostic (legitimate no-data JSON values); only wrong-typed containers produce `SRS_STATE_MALFORMED`/`FAVORITES_STATE_MALFORMED`.
- Before behavior: no review aggregation exists; the Review Center sources (LR-AGG) are unimplemented. Approved after behavior: `aggregateCurrentLevelReview()` computes independent Due and Favorites candidate sets with totals, per-unit lists/counts, and safe diagnostics from explicit inputs. Explicit non-goals: no UI, no session planning (REVIEW-002), no integration (REVIEW-003), no SRS scheduling change, no storage/schema change, no Playwright runs (new pure unintegrated module; assignment explicitly authorizes omitting Playwright unless an existing runtime file is modified — none was).
- Exact allowed write paths: `js/core/review-aggregation.mjs` (new), `tests/unit/review-aggregation.test.mjs` (new), `docs/cefr/reports/REVIEW-001-01.md`, `docs/cefr/evidence/REVIEW-001/01/**`. No other path touched (verified in section 6 and evidence 07).
- Risk: low-to-medium. Pure calculation, no persistence/UI coupling; risk families: unseen-as-due, cross-level leakage, duplicate counting, boundary off-by-one, source coupling, unknown-ID admission — each covered by a dedicated test and a mutation probe.
- Affected callers/UI/state/storage/audio boundaries: none existing. The module has no runtime callers yet (REVIEW-003 is the assigned integrator); storage/SRS/flashcards code is read-only reference, not modified.
- Baseline tests and known failures: full unit suite at base is green (177/177 including this package's 18 new tests at the final revision; 159/159 pre-existing before it). No inherited failures. The initial unauthenticated checkpoint push failed once (AUTHENTICATION_BLOCKED signature, exit 128) and was resolved by the owner-supplied PAT in the resume message.

## 3. Changes and rationale

| File | Change/purpose | Contract/WP criterion | Compatibility impact |
|---|---|---|---|
| `js/core/review-aggregation.mjs` (new, +310) | Pure `aggregateCurrentLevelReview({ levelId, vocabulary, progress, now, unitId })` returning independent `due`/`favorites` results (total, source-ordered candidate descriptors, per-unit lists/counts, safe diagnostics) with existing due semantics (levels 1–5, inclusive boundary), strict production date formats with explicit calendar validation, level/unit isolation, dedupe, immutability, and TypeError top-level validation | REVIEW-001; LR-AGG; AC-13; AC-14; FP-DESIGN-010 (shared review aggregation is a pure calculation) | None: additive module, no existing file changed, no storage/ID/schema change |
| `tests/unit/review-aggregation.test.mjs` (new, +474) | 18 RED-first cases: the 17 assigned cases plus one supplemental case for the defensive vocabulary diagnostics (malformed card, unit mismatch, duplicate card ID) | REVIEW-001; AC-13; AC-14; AC-21; FP-TEST-001 | None: new test file only |
| `docs/cefr/reports/REVIEW-001-01.md` (this report) | Delivery report | DR-001..008 | None |
| `docs/cefr/evidence/REVIEW-001/01/**` (8 files + INDEX.md) | Sanitized evidence logs with SHA-256 ledger | DR-006; GITHUB_DELIVERY | None |

Design rationale: due semantics reuse the existing production rule (`flashcards.js` `_buildQueue`: record exists, level 1–5, `nextReviewDate` ≤ clock — inclusive), with dates accepted only in the two formats production writes (Z-suffixed UTC ISO from `calculateNextReview`/`toISOString()`; legacy date-only `YYYY-MM-DD` = UTC midnight from the legacy SRS migration). Calendar components are validated explicitly so rollovers (`2026-02-30`, hour 24) and environment-dependent timezone-less datetimes are rejected as malformed instead of silently shifting. Epoch comparison is equivalent to the production string comparison for both formats and deterministic across timezones. ID resolution happens only against the requested level's vocabulary, which is the module-level cross-level defense (both levels use the same local-ID scheme, but progress stores are per-level `appId`s; aggregation additionally refuses foreign cards and unknown/stale stored IDs). Candidate order follows vocabulary source order in both sources, independent of stored order. Scope deviations: none. Superseded tests/assertions: none (pure addition).

## 4. Acceptance-to-evidence mapping

| Criterion / AC row / contract ID | Test path + exact name | Result | Log/artifact | Tested revision |
|---|---|---|---|---|
| No progress → empty results | `tests/unit/review-aggregation.test.mjs` — "REVIEW-001 case 1 (LR-AGG): no progress yields empty due and favorites with all-unit zero counts" | PASS | evidence 04 | `c956ce4` |
| Unseen cards never due (AC-13) | "REVIEW-001 case 2 (AC-13): unseen cards without any SRS record are never due" | PASS | evidence 04 | `c956ce4` |
| Level 0 never due, no diagnostic (AC-13) | "REVIEW-001 case 3 (AC-13): a well-formed level-0 record is not due and reports no diagnostic" | PASS | evidence 04 | `c956ce4` |
| Levels 1–5 exact inclusive boundary (AC-13) | "REVIEW-001 case 4 (AC-13): levels 1-5 are due when nextReviewDate is exactly equal to the injected clock" (includes legacy date-only midnight boundary) | PASS | evidence 04 | `c956ce4` |
| Future cards not due (AC-13) | "REVIEW-001 case 5 (AC-13): future nextReviewDate cards are not due and report no diagnostic" | PASS | evidence 04 | `c956ce4` |
| Mastered level 6 not due (AC-13) | "REVIEW-001 case 6 (AC-13): mastered level-6 records are not due even with a past date" | PASS | evidence 04 | `c956ce4` |
| Invalid/missing dates ignored + reported (AC-13) | "REVIEW-001 case 7 (AC-13): invalid or missing nextReviewDate values are ignored and reported" | PASS | evidence 04 | `c956ce4` |
| Malformed SRS state safe (AC-13) | "REVIEW-001 case 8 (AC-13): malformed SRS state is ignored and reported without crashing" (incl. wholesale `SRS_STATE_MALFORMED`) | PASS | evidence 04 | `c956ce4` |
| Duplicate favorite IDs count once (AC-14) | "REVIEW-001 case 9 (AC-14): duplicate stored favorite IDs count once and are reported" (incl. wholesale `FAVORITES_STATE_MALFORMED`) | PASS | evidence 04 | `c956ce4` |
| Unknown/stale IDs ignored + reported (AC-14) | "REVIEW-001 case 10 (AC-14): unknown and stale IDs are ignored and reported in both sources" (incl. malformed entries) | PASS | evidence 04 | `c956ce4` |
| Same local ID in two levels cannot cross (AC-13) | "REVIEW-001 case 11 (AC-13): the same local ID in two different levels cannot cross into the result" (a1 view, b2 view, contaminated-vocabulary view) | PASS | evidence 04 | `c956ce4` |
| Optional unit filtering (AC-14) | "REVIEW-001 case 12 (AC-14): optional unit filtering contains only the requested unit" | PASS | evidence 04 | `c956ce4` |
| Due/favorites overlap without coupling (AC-14) | "REVIEW-001 case 13 (AC-14): due and favorites overlap without coupling the sources" | PASS | evidence 04 | `c956ce4` |
| Empty vocabulary (LR-AGG) | "REVIEW-001 case 14 (LR-AGG): empty vocabulary yields empty results without diagnostics for structure" (incl. reserved empty units) | PASS | evidence 04 | `c956ce4` |
| Deterministic source ordering (AC-14) | "REVIEW-001 case 15 (AC-14): candidate order follows vocabulary source order, not stored order" (incl. repeated-call deep equality and descriptor freshness) | PASS | evidence 04 | `c956ce4` |
| Input immutability (AC-14/TS-TEST-001) | "REVIEW-001 case 16 (AC-14): inputs are never mutated" | PASS | evidence 04 | `c956ce4` |
| Invalid top-level args + clock validation (AC-21) | "REVIEW-001 case 17 (LR-AGG): invalid top-level arguments and clock values throw TypeError" (20 invalid variants; `unitId` null/undefined accepted) | PASS | evidence 04 | `c956ce4` |
| Defensive vocabulary diagnostics (LR-AGG) | "REVIEW-001 case 18 (LR-AGG): malformed, unit-mismatched, and duplicate vocabulary cards are ignored and reported" | PASS | evidence 04 | `c956ce4` |
| RED proof (AC-21, TS-PRE-003) | Module-absent import failure at the tests-only commits | PASS (required failure proven) | evidence 01, 02 | `6dc04b6`, `37a9664` |
| Full unit regression (TS-LOOP-004) | `npm run test:units` | PASS 177/177 | evidence 05 | `c956ce4` |
| Mutation probes (TS-MUT, AC-21) | 6/6 KILLED with intended detectors | PASS | evidence 06 | `c956ce4` |
| `git diff --check` + scope/status (TS-DONE-005) | diff check clean; scope exactly 2 added files; status clean | PASS | evidence 07 | `c956ce4` |
| Playwright (TS-LOOP-004 browser level) | N/A — new pure unintegrated module; no existing runtime file modified; the assignment explicitly limits Playwright to packages that modify an existing runtime file | N/A (documented decision) | evidence 08 | n/a |

## 5. Complete command ledger

| Command (exact) | Phase + revision | Start/end or duration | Exit | Passed/failed/skipped | Artifact | Interpretation |
|---|---|---|---|---|---|---|
| `git fetch origin` | checkpoint revalidation @ `9c5067b` | <1 s | 0 | n/a | worklog | Remote state current |
| `git ls-remote origin refs/heads/codex/glm-review-001-01` | checkpoint | <1 s | 0 | n/a | worklog | Branch absent (before and after each attempt) |
| `git branch codex/glm-review-001-01 9c5067b… && git switch codex/glm-review-001-01` | checkpoint @ `9c5067b` | <1 s | 0 | n/a | worklog | Branch created exactly from required base |
| `GIT_TERMINAL_PROMPT=0 git push origin HEAD:refs/heads/codex/glm-review-001-01` | initial checkpoint (no credential) | <1 s | 128 | n/a | worklog, evidence 08 | AUTHENTICATION_BLOCKED signature; one attempt only; remote verified unchanged; stopped before editing |
| `bash /home/z/my-project/scripts/review001-checkpoint.sh` (PAT staged transiently; auth 200) | checkpoint resume @ `9c5067b` | ~4 s | 0 | n/a | worklog, evidence 08 | Non-forced checkpoint push OK; remote SHA == base; only assigned branch changed (24→25 refs); credential deleted + verified |
| `node --check tests/unit/review-aggregation.test.mjs` | RED authoring @ `6dc04b6` | <1 s | 0 | n/a | worklog | Test file syntactically valid |
| `node --test tests/unit/review-aggregation.test.mjs` | RED @ `6dc04b6` (17 cases) | ~0.1 s | 1 | 0 pass / 1 fail (file-level `ERR_MODULE_NOT_FOUND`) | evidence 01 | Required failure proven: module absent |
| `node --test tests/unit/review-aggregation.test.mjs` | RED re-proof @ `37a9664` (18 cases, amended) | ~0.1 s | 1 | 0 pass / 1 fail (`ERR_MODULE_NOT_FOUND`) | evidence 02 | RED still valid after the pre-implementation test amendment |
| `node --check js/core/review-aggregation.mjs`; `node --check tests/unit/review-aggregation.test.mjs`; live ESM `import()` | ladder 1 @ `c956ce4` | <1 s | 0 | n/a | evidence 03 | Syntax + live import OK; single function export |
| `node --test tests/unit/review-aggregation.test.mjs` | ladder 2 (GREEN) @ `c956ce4` | 85.6 ms | 0 | 18 / 18 / 0 | evidence 04 | All assigned cases green |
| `npm run test:units` | ladder 3 @ `c956ce4` | 764 ms | 0 | 177 / 0 / 0 | evidence 05 | Full unit suite green (159 pre-existing + 18 new) |
| `python3 /home/z/my-project/scripts/review001-probes.py` | ladder 4 (mutation probes) @ `c956ce4` (disposable worktree) | seconds | 0 | 6/6 KILLED | evidence 06 | Baseline 18/18; every intended detector fired; restores hash-verified |
| `git diff --check`; `git status --porcelain`; `git diff --stat 9c5067b..HEAD`; `git diff --name-status 9c5067b..HEAD` | ladder 5–6 @ `c956ce4` | <1 s | 0 | n/a | evidence 07 | Diff check clean; scope exactly 2 added files; status clean |
| `git diff --cached --check` (before each commit) | commits | <1 s | 0 | n/a | worklog | No whitespace/conflict-marker issues in staged content |

Background tasks: none (all runs were foreground; no parallel test launches; no canceled runs). Rerun reason: none — every final-state run passed on its first execution at the final material revision; the only repeated command is the RED proof after the pre-implementation test amendment (disclosed in section 2 / evidence 08). Zero-selection checks: not applicable (no `--grep` filtering used; full files run).

## 6. Regression and integration

- A1 / B2 / ordinary Verbs / Guided Verbs: no runtime file touched; unit suite 177/177 covers the existing pure-logic surface; Playwright N/A for this package (new pure unintegrated module; assignment authorizes omission).
- Phrases / Conversation / navigation / favorites / SRS: unchanged by construction (additive module; `git diff --name-status` shows only the two new files). Existing SRS/favorites semantics were consumed read-only as the specification for due evaluation.
- Legacy storage / refresh / level and account isolation: storage.js/srs-logic.js/flashcards.js untouched; the module accepts progress explicitly, so no storage interaction exists. Legacy date-only SRS records (`'2099-01-01'`) are explicitly supported and tested (case 5, case 6, case 4 date-only boundary).
- Actual audio adapter text AND language: N/A (no audio involvement).
- Browser/module startup and console errors: no browser run (N/A per assignment); live ESM import check passed with zero errors (evidence 03); the module performs no DOM/storage/network access (verified by search: no `window.`, `document.`, `localStorage`, `Date.now`, `Math.random` references).
- Desktop/mobile/themes/keyboard/reduced-motion/screenshots: N/A (no UI change; nothing rendered).
- Legacy/compatibility: IDs, stored progress, favorites, and SRS records are only read (never written) by the new module, and only via explicit input — no reset, downgrade, reassignment, or migration.

## 7. Test-quality and fault-probe evidence

| Probe | Risk/contract | Production target + exact patch artifact | Detecting test | Baseline / syntax result | Actual failure | Classification | Integrity proof |
|---|---|---|---|---|---|---|---|
| P1-unseen-as-due | AC-13 unseen must never be due | `collectDueCardIds`: additionally marks every participating card without a stored record as due (5-line insertion) | case 2 (intended; cases 1,3,4,5,6,7,8,9,10,11,12,13,15,18 also fail) | 18/18 baseline; mutated `node --check` OK | case 2 fails (due total 9 ≠ 0) | KILLED | module rewritten to pristine; sha256 match True; worktree `git status` empty |
| P2-level-guard-removed | AC-13 only requested level participates | foreign-level guard condition made never-true | case 11 (only failing test) | 18/18; syntax OK | case 11 fails (foreign card participates; diagnostics wrong) | KILLED | same as above |
| P3-duplicate-favorites-counted | AC-14 duplicates count once | favorites candidates built from raw stored occurrences instead of deduplicated membership | case 9 (intended; cases 15, 18 collateral) | 18/18; syntax OK | case 9 fails (total 3 ≠ 2) | KILLED | same as above |
| P4-boundary-exclusive | AC-13 inclusive exact boundary | `nextTime <= now` → `nextTime < now` | case 4 (only failing test) | 18/18; syntax OK | case 4 fails (boundary card no longer due) | KILLED | same as above |
| P5-favorites-coupled-to-due | AC-14 sources independent | favorites candidates additionally filtered by `dueCardIds` | case 13 (intended; cases 2,9,10,12,15,18 collateral) | 18/18; syntax OK | case 13 fails (unseen favorite dropped) | KILLED | same as above |
| P6-unknown-ids-admitted | AC-14 unknown/stale IDs ignored | unknown favorite IDs synthesized as phantom candidates | case 10 (intended; cases 9, 14 collateral) | 18/18; syntax OK | case 10 fails (phantom candidate counted) | KILLED | same as above |

Probe selection/count: the assignment names six fault families; all six were implemented as distinct behavioral mutations of production code only (tests untouched — the probe script verifies the module's pristine hash before and after every probe and the worktree status is empty). No SURVIVED, INVALID_MUTATION, BASELINE_INVALID, or INFRASTRUCTURE_FAILURE outcomes; no retries were needed. Untouched hashes: pristine module sha256 recorded in the probe log; every restore verified byte-identical. Conditional assertions, weak mocks, ignored errors, snapshot changes: none found (all assertions are exact literals; no mocks, no try/catch suppression, no snapshots; the module's only hidden-input risk — date parsing — is pinned by explicit literal expectations). RED evidence: two module-absent captures (evidence 01, 02); granular attribution is provided by the probes (RED for a new module is the import failure, following the AUDIO-001 precedent for new-module packages).

## 8. Dead-code and dependency inventory

| Candidate symbol/path | Searches + dynamic caller checks | Classification | Disposition | Regression proof |
|---|---|---|---|---|
| `js/core/review-aggregation.mjs` export `aggregateCurrentLevelReview` | `rg -l "review-aggregation"` over `js/ tests/ *.html docs/cefr contracts/` → only the module, its test, and the WORK_PACKAGES spec; `rg -l "aggregateCurrentLevelReview"` → module + test only; no `window.*` export, no HTML inline handler, no `data-action`, no dynamic import anywhere | Not dead code: `STAGED_FOR_ASSIGNED_INTEGRATION` — REVIEW-003 (`docs/cefr/WORK_PACKAGES.md`) is the assigned consumer ("Integrate pure aggregation/planning, not a second set of calculations in the UI") | Keep; integration is explicitly out of this package's scope | n/a (new module; full unit suite green) |

No dependencies added or changed (`package.json` untouched). No existing symbol became orphaned (no existing file modified). The scan boundary is the tracked source/test/HTML/docs tree, excluding `node_modules` and `.git`.

## 9. Findings, limitations, and handoff

| Finding ID | Severity/impact | Reproduction and evidence | Disposition | Owner decision needed |
|---|---|---|---|---|
| F-R001-1 | Informational | `progress.srsData`/`progress.favorites` that are `undefined` or `null` are treated as empty without a diagnostic; wrong-typed containers produce `SRS_STATE_MALFORMED`/`FAVORITES_STATE_MALFORMED` (refinement of the in-session pre-edit wording) | Implemented + tested (cases 8, 9) | None |
| F-R001-2 | Informational | Diagnostics are computed at level scope (independent of the unit filter) so data faults remain visible under scoping; out-of-scope level cards are neither candidates nor diagnostics | Implemented + tested (case 12) | None |
| F-R001-3 | Low | A scoped `unitId` outside the vocabulary range yields an empty result that echoes the scope key (documented behavior, not an error) | Implemented + documented | None |
| F-R001-4 | Low | The module requires the canonical array-of-units vocabulary shape (`validateVocabulary` contract); a flat card array is a TypeError. REVIEW-003 must pass `levelConfig.vocabulary` directly | Documented | None |

- Remaining product risks and untested requirements: none within this package's scope. Browser-level behavior does not exist yet by design (no UI). The module's real-data integration (A1 711 / B2 3031 cards, real stored progress) belongs to REVIEW-003 and is not claimed here.
- Final diff/status: exactly `js/core/review-aggregation.mjs` (+310) and `tests/unit/review-aggregation.test.mjs` (+474) added; 784 insertions, 0 deletions; no unintended ID/content/storage/dependency change; working tree clean at every commit (`git diff --check` and `git diff --cached --check` clean).
- GitHub delivery: branch `codex/glm-review-001-01`, report and evidence committed after the tested code revision (report/evidence-only commit does not invalidate code evidence per DR-007); final delivered SHA and commit-pinned URLs returned in the handoff message; remote-SHA equality, byte-identical targeted fetch, and branch isolation verified there.
- Next proposed WP: REVIEW-002 (Seeded bounded session plans) — not started; requires owner assignment.

## 10. Owner/reviewer disposition — not executor approval

- Reviewer and reviewed exact revision: pending (reviewer to record).
- Verdict: pending.
- Criteria/findings accepted or declined; explicit waivers and reason: pending.
