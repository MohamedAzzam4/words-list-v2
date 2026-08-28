# External CEFR Delivery Baseline

Prepared 2026-08-29. Repository: `MohamedAzzam4/words-list-v2`.

## Exact boundary

- Source branch at preparation: `review/guided-challenge`.
- Remote at inspection: `b312a36cc509830f294873e2e8ea3b107a369307` (roadmap already published).
- Local foundation commits included: `ebc11d7` and `f39aff6`.
- Corrected application baseline in this handoff: `4c367f3ab73c102845cdd441a6b793676645771d`.
- Delivery branch: `codex/cefr-glm-handoff`. Later preparation commits add contracts and docs only; record its actual HEAD when starting.
- The owner's original dirty working tree was NOT used wholesale. Uncommitted verb controller/scheduler, verb CSS/tests, package changes, enforcement code/adapters, runtime evidence, RAM/ROM and experimental logs remain local and excluded. Do not assume old screenshots/transcripts describe this branch.

The public branch is a reproducible starting point, not a declaration that German Verbs or the CEFR roadmap is complete. Contracts state approved targets; known gaps below require triage and assigned work.

## What is already implemented

- Additive A1/B2 parsing preserves example and example translation, level/unit identity, display aliases, per-language maps and speech text.
- Validator checks IDs/unit/level identity, aliases, example consistency, languages, counts/snapshots and exact legacy duplicate allowances.
- Legacy progress-load tests and normalized card speech-dispatch tests exist.
- A1 has 24 units / 711 cards; B2 has 70 units / 3031 cards, including intentional extra units 69/70.
- Existing IDs remain position-based (`unit-position`, zero-based position). Do not reorder content or change IDs casually. `tests/unit/level-data.test.mjs` contains current count and content snapshot expectations.

## Explicitly unfinished / known gaps

1. `js/core/flashcards.js` still fills the example UI from the word/meaning rather than the actual normalized example. Shared card adoption is unfinished; do not claim example parity from parser tests.
2. `js/core/app.js` defines `speakText(t)` and calls the speech service without forwarding a language argument. The new flashcard tests prove safe text selection at the wrapper boundary, NOT correct language through the actual browser utterance. AUDIO-003 must cover this integration gap.
3. The published `js/core/verb-challenge-engine.js` and its tests predate some local GC v0.2 Acquisition corrections. For example the tracked test still describes a ready card leaving after a successful Acquisition recall. `contracts/GUIDED_CHALLENGE.md` contains newer approved targets. Do not silently redesign the scheduler in a card-extraction task: record mismatches for owner triage.
4. Shared ordinary-level presentation, autoplay parity, level-wide review/favorites, bounded sessions/resume, and final refactoring are not implemented by the data-foundation fixes.
5. Existing E2E tests concentrate on A1/Verbs; B2 browser parity is not established. New B2 integration cases are mandatory.
6. Current test tooling includes some VM loaders that strip exports. These do not prove real browser imports. Existing browser tests also need quality review; green counts do not certify every assertion.
7. B1/A2 sources and content publication remain deferred; no generation or import is authorized by the handoff.

## Verified during handoff preparation

Against the application tree of `4c367f3` (before documentation-only commits):

- Node v24.15.0, npm 11.12.1, Windows host with Playwright from the lockfile.
- `npm.cmd run test:units`: **59 passed, 0 failed, 0 skipped**.
- Correct-module syntax checks on modified card/config JavaScript and validator: passed.
- Focused Chromium `favorites-filters.spec.js` and `srs.spec.js`: **2 passed**.
- Full E2E suite, Mobile Chrome, actual hardware speech, and GLM's remote environment: **not verified by these checks**.

Counts differ from previous local screenshots because uncommitted experiments and enforcement tests are not shipped. Never use those previous counts as the expected result for this branch. Details and setup failures are recorded in `reports/HANDOFF-PREPARATION-001.md`.

## First external action

Execute `BASELINE-001` using `GLM_HANDOFF.md`. Record actual sandbox results and observed gaps before code changes. The owner/reviewer can then accept existing data WPs or issue narrow corrections, followed by `SHARED-CARD-001`. Do not reimplement already-working parsing merely because the earlier roadmap called it planned.
