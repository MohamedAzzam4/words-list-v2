# Code Fingerprint and Clean-Code Contract

**Contract ID:** FP

**Version:** 1.0

**Status:** ACTIVE

## Purpose

Make contributions from different AI models read as if they were written by one careful maintainer. The fingerprint governs new and modified lines; it does not authorize mass restyling of untouched legacy code.

## Core signature

Code in this repository is:

- plain vanilla HTML, CSS, and JavaScript;
- explicit rather than clever;
- organized by responsibility;
- conservative with dependencies and abstractions;
- defensive around persisted progress and duplicate UI events;
- deterministic and testable in scheduling/state logic;
- documented with short rationale and invariant comments, not narration.

## JavaScript formatting

- **FP-JS-001:** Use 4 spaces for indentation and never tabs.
- **FP-JS-002:** Use semicolons.
- **FP-JS-003:** Prefer single quotes for JavaScript strings and template literals for interpolation or multi-line HTML.
- **FP-JS-004:** Put opening braces on the same line as declarations and control statements.
- **FP-JS-005:** Use `const` by default and `let` only when reassignment is required. Do not introduce `var`.
- **FP-JS-006:** Use strict equality (`===` / `!==`).
- **FP-JS-007:** Prefer guard clauses to deeply nested branches.
- **FP-JS-008:** Match the surrounding import/export style and keep imports at the top.
- **FP-JS-009:** Do not reformat unrelated neighboring code.

## Naming

- **FP-NAME-001:** Names express domain intent: `challengeSession`, `dueTurn`, `recognitionWin`, not generic `data2`, `temp`, or `resultObj`.
- **FP-NAME-002:** Functions and methods use action verbs; booleans read as predicates such as `is`, `has`, `can`, or `show`.
- **FP-NAME-003:** Constants use `UPPER_SNAKE_CASE`.
- **FP-NAME-004:** Internal controller helpers follow the existing leading-underscore convention where applicable.
- **FP-NAME-005:** Single-letter names are limited to tiny loop indices or locally obvious callbacks.
- **FP-NAME-006:** Reuse established domain terms from contracts and tests; do not invent synonyms for the same state.

## Function and module design

- **FP-DESIGN-001:** One function has one primary responsibility and one abstraction level.
- **FP-DESIGN-002:** Keep pure calculations separate from DOM, storage, Firebase, audio, and timers.
- **FP-DESIGN-003:** `verb-challenge-engine.js` remains a pure deterministic scheduler. It receives state and returns/mutates documented scheduler state only.
- **FP-DESIGN-004:** `verbs-engine.js` owns orchestration, rendering integration, user actions, and persistence coordination.
- **FP-DESIGN-005:** `storage.js` owns defaults, normalization, migration-safe merge, and persistence shapes.
- **FP-DESIGN-006:** Extract shared behavior when two real consumers need the same semantics; do not create abstractions for hypothetical reuse.
- **FP-DESIGN-007:** Avoid hidden mutations. State changes must occur in clearly named mutation paths.
- **FP-DESIGN-008:** Duplicate/stale events are explicit no-ops and never partly mutate state.
- **FP-DESIGN-009:** A shared card renderer may own generic presentation only. Level and verb adapters retain navigation, grading, persistence, and verb-only content. Extract in small characterization-tested steps; this supersedes any reading of FP-DESIGN-004 that requires all card HTML to remain in the verbs controller.
- **FP-DESIGN-010:** Shared review aggregation, seeded session planning, and speech-sequence planning are pure calculations. Controllers own lifecycle and platform side effects; storage adapters own schema and compatibility.

## Control flow and error handling

- **FP-FLOW-001:** Validate preconditions early and return early on invalid or stale input.
- **FP-FLOW-002:** Handle expected failure close to its source and give actionable messages.
- **FP-FLOW-003:** Do not swallow errors silently. If safe fallback is intentional, document why and preserve recoverability.
- **FP-FLOW-004:** Use `async`/`await` consistently in asynchronous application paths.
- **FP-FLOW-005:** Never use timing sleeps to repair state ordering; encode the ordering in state and await real completion signals.

## Rendering and CSS

- **FP-UI-001:** Sanitize data before inserting it into generated HTML.
- **FP-UI-002:** Prefer semantic CSS classes over new repeated inline styles. Do not mass-convert existing inline styles outside task scope.
- **FP-UI-003:** Reuse the established card/component renderer instead of copying large HTML templates.
- **FP-UI-004:** For new interactive rendering, prefer the controller's delegated `data-action` pattern over adding new inline JavaScript handlers.
- **FP-UI-005:** Preserve light/dark theme variables, responsive behavior, keyboard access, visible focus, and touch target size.
- **FP-UI-006:** Never place a hidden answer in visible text, accessible names, front-side DOM content, hints, or audio controls before reveal.

## Comments and documentation

- **FP-COMMENT-001:** Comments explain why, invariants, compatibility, or non-obvious tradeoffs—not what the next line already says.
- **FP-COMMENT-002:** Keep comments concise and update/remove comments made false by the same change.
- **FP-COMMENT-003:** Do not add AI narration, prompt references, confidence statements, review chatter, or signatures to source code.
- **FP-COMMENT-004:** Contract IDs belong in tests or focused invariant comments, not on every implementation line.

## Tests

- **FP-TEST-001:** Test names state behavior and include the relevant stable contract ID for new contract work.
- **FP-TEST-002:** Scheduler tests inject deterministic RNG/time inputs and assert state plus next presentation.
- **FP-TEST-003:** E2E tests use real user-visible controls and lifecycle paths where practical.
- **FP-TEST-004:** Keep setup local and readable; extract helpers only for genuine repeated flows.
- **FP-TEST-005:** No arbitrary waits when a state, event, locator, or persisted value can be awaited directly.

## Diff fingerprint

- **FP-DIFF-001:** Behavior changes, refactors, and formatting cleanups are separate scopes.
- **FP-DIFF-002:** Every changed line traces to the approved goal, its test, or a direct orphan created by the change.
- **FP-DIFF-003:** Do not rename unrelated symbols, reorder unrelated declarations, or rewrite comments for taste.
- **FP-DIFF-004:** Remove only imports, variables, styles, or helpers made unused by the current change.

## Fingerprint review checklist

Before completion, the AI must be able to answer yes:

1. Does the code match the local file's syntax and naming?
2. Are responsibilities in the correct module?
3. Is the state transition explicit, deterministic, and tested?
4. Did the change avoid unrelated cleanup and speculative abstraction?
5. Are persisted progress, duplicate actions, answer secrecy, and resume behavior safe?
6. Would the diff look like one maintainer made a surgical change?
