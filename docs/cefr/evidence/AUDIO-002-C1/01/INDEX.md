# AUDIO-002-C1 / Attempt 01 — Evidence Index

All evidence below was produced in the external sandbox (`/home/z/my-project/words-list-v2`, Debian, Node v24.19.0, npm 11.17.0, Playwright 1.61.1 lockfile, Python 3.12.14 for the static server on port 9012). Sandbox clock: 2026-09-01 ~03:30–05:30 UTC. Every log is the sanitized text output of the exact command listed (sanitization: CR removal, ANSI escape strip, `[WebServer]` request-log line removal, trailing-whitespace scrub; the combined probe log additionally drops `at …` stack-frame continuation lines from the per-probe raw sections while keeping titles, assertions, and counts verbatim). No credentials or user data appear in any file — every published copy was scanned for GitHub token patterns: zero hits.

Tested revisions: accepted base `1080ac7e057d62c4ca7efa78d20240c7df0f5c75` (AUDIO-002 delivery), RED tests commit `a965592` (production source still the unmodified base at RED capture time), implementation commit `d68898e` (navigation/queue-context cancellation in `js/core/verbs-engine.js` + the U6 VM-harness fix), and final tested code `ca0b479` (tests-only supplement: U6 gains the replacement-session stale-callback phase; production source identical to `d68898e`). The docs commit that publishes this directory adds report/evidence only and does not move the tested code revision. The final delivered SHA is returned in the handoff message, not embedded into its own commit.

Environment setup event (disclosed): the Playwright 1.61 Chromium build (`chromium_headless_shell-1228`) was missing from the sandbox browser cache at session start (the first `words-audio.spec.js:48` baseline attempt failed with `browserType.launch: Executable doesn't exist`, 1 failed, no test logic executed). `npx playwright install chromium` (download only) fixed the environment; every subsequent run used the installed build. No browser test result was fabricated from the failed attempt.

## Checkpoint gate evidence (pre-edit)

- `git fetch origin` exit 0; expected local state verified exactly: branch `codex/glm-audio-002-c1-01` at HEAD `1080ac7e…` (== accepted base, not recreated), clean tree, remote `codex/glm-audio-002-c1-01` absent.
- Authentication verified via `api.github.com` (HTTP 200, token belongs to the repository owner; the PAT value was never printed, logged, committed, or URL-embedded). Exactly one non-forced checkpoint push `HEAD:refs/heads/codex/glm-audio-002-c1-01` → exit 0, new remote branch. Remote checkpoint SHA verified `1080ac7e057d62c4ca7efa78d20240c7df0f5c75` == local HEAD. The transient chmod-600 credential file (outside the repository) was deleted immediately by the publisher script's EXIT trap and verified absent.
- `00-remote-checkpoint-verification.log` re-verifies the published checkpoint state with a fresh capture (the original push output is recorded in the session worklog; the PAT value appears in no artifact).

## Owner-finding baseline (inherited failures, pristine base before any C1 edit)

| File | Command | Outcome |
|---|---|---|
| `00-base-words-audio-inherited-chromium.log` | `npx playwright test tests/e2e/words-audio.spec.js:48 --project=chromium` | **1 failed, exit 1** — `[chromium] › words-audio.spec.js:48:3 › "Play all words highlights rows and respects filters"`, assertion at line 77 `expect(highlightedRows.length).toBe(0)` |
| `00-base-words-audio-inherited-mobile.log` | `npx playwright test tests/e2e/words-audio.spec.js:48 --project="Mobile Chrome"` | **1 failed, exit 1** — same title, same line-77 assertion |

These two failures reproduce identically in the final full-suite run below (same projects, titles, assertion, and counts) and are reported as inherited, out of scope for AUDIO-002-C1 (pre-existing since SHARED-CARD-002/003, owner triage pending). No new failure was introduced.

## RED evidence (production source = the unmodified base)

| File | Command | Outcome |
|---|---|---|
| `01-red-unit.log` | `node --test tests/unit/verbs-audio.test.mjs` (tests at `a965592`) | **22 passed / 7 failed / 29 total, exit 1** — the failing set is the revised A12 plus U1–U5 (intended assertion failures: navigation/early-return never calls stop — `stopCalls 0 !== 1`), while U6 failed on a harness TypeError (`engineReal.loadDeck is not a function` — the test loaded the VM module wrapper instead of its `.VerbsEngine`; disclosed and fixed). The 22 passing tests are the untouched AUDIO-002 characterization set. |
| `01-red-unit-u6supplement.log` | `node --test tests/unit/verbs-audio.test.mjs` (disposable worktree at `a965592`, production = base, fixed test file copied in) | **22 passed / 7 failed / 29 total, exit 1** — U6 now fails on the intended assertion (`SpeechQueue.isPlaying` still `true` after `loadDeck(2)`: `true !== false`); the other six failures identical to the original RED run. This is the valid RED proof for U6. |
| `01-red-e2e-chromium.log` | `npx playwright test tests/e2e/verbs-audio.spec.js --project=chromium` | **9 passed / 7 failed / 16 total, exit 1** — the 7 new `[AUDIO-002-C1]` navigation/queue-ownership tests fail on the owner's reproduced symptom (the Play button stays `"🔊 Auto Playing..."`, class `playing`, floating player visible, `speechSynthesis.speaking` still `true` after deck change / search change / view change). The 8 existing `[AUDIO-002]` tests plus the new stale-callback integration test pass at base (characterization: the AUDIO-002 generation mechanism already protects replacements; the missing behavior was the navigation cancellation itself). |

## Final evidence (final tested code `ca0b479` unless noted)

| File | Command | Exit | Counts / duration | sha256 |
|---|---|---|---|---|
| `02a-syntax-production.log` | `node --input-type=module --check < js/core/verbs-engine.js`; `node --check js/core/speech-plan.mjs`; `node --input-type=module --check < js/core/tts.js` | 0 | parses cleanly ×3 (TS-LOOP-001; planner and tts.js unchanged — verified byte-identical vs base) | `7ea03ea5…` |
| `02b-syntax-tests.log` | `node --check tests/unit/verbs-audio.test.mjs`; `node --input-type=module --check < tests/e2e/verbs-audio.spec.js` | 0 | parses cleanly ×2 | `0287abcc…` |
| `04a-green-focused-unit-first-attempt.log` | `node --test tests/unit/verbs-audio.test.mjs` (at `d68898e`, before the U6 harness fix) | 1 | 28 passed / 1 failed — U6 failed on the harness TypeError above; disclosed iteration, superseded by the supplement | `3d7b4495…` |
| `04-green-focused-unit.log` | `node --test tests/unit/verbs-audio.test.mjs` | 0 | **29 passed / 0 failed / 0 skipped** (A1–A11 + revised A12, B1–B11, U1–U6) | `e75494f2…` |
| `05-green-focused-e2e-chromium.log` | `npx playwright test tests/e2e/verbs-audio.spec.js --project=chromium` | 0 | **16 passed** (23.4s) — 8 AUDIO-002 + 8 AUDIO-002-C1 | `04104061…` |
| `06-green-focused-e2e-mobile.log` | `npx playwright test tests/e2e/verbs-audio.spec.js --project="Mobile Chrome"` | 0 | **16 passed** (25.5s) — the same lifecycle cases on Mobile Chrome (requirement E) | `b96bb500…` |
| `07a-verbs-guided-first-run-flake.log` | `npx playwright test tests/e2e/verbs.spec.js tests/e2e/verb-guided-challenge.spec.js` (at `d68898e`) | 1 | 53 passed / 1 failed (2.3m) — the only failure is the documented SC-INFRA-01 load flake: `verb-guided-challenge.spec.js:1036` R1 on Mobile Chrome (`toBeVisible` timeout) | `ccafa65a…` |
| `07b-flake-isolation-rerun.log` | `npx playwright test "tests/e2e/verb-guided-challenge.spec.js:1036" --project="Mobile Chrome"` (at `d68898e`) | 0 | **1/1 pass in isolation** (3.3s) — TS-LOOP-005 failure protocol | `79aeb98f…` |
| `07-verbs-guided-final.log` | `npx playwright test tests/e2e/verbs.spec.js tests/e2e/verb-guided-challenge.spec.js` | 0 | **54 passed / 0 failed** (2.2m) — clean final run at `ca0b479`; the flake did not reproduce | `7c888d38…` |
| `08-full-units.log` | `npm run test:units` | 0 | **144 passed / 0 failed / 0 skipped** — 138 pre-existing (AUDIO-002 delivery) + 6 new C1 tests | `346ae465…` |
| `09-full-e2e-both-projects.log` | `npx playwright test` (both projects, whole tracked suite) | 1 | **319 passed / 2 failed / 1 skipped** (9.0m) — the only failures are the pre-existing `words-audio.spec.js:48` on both projects, byte-identical in title/assertion/counts to the pristine-base baseline above | `1c54b5ce…` |
| `09a-full-e2e-implementation-revision.log` | `npx playwright test` (at `d68898e`, before the tests-only supplement) | 1 | **319 passed / 2 failed / 1 skipped** (9.1m) — identical outcome; retained per DR-002 (every full-suite attempt) | `bc73228e…` |
| `10-diff-check.log` | `git diff --check`; `git diff --cached --check`; `git status --short`; scope diff `1080ac7..HEAD` | 0 | no whitespace errors; only the three authorized code/test files differ from the accepted base; the docs commit that follows adds report/evidence only (the self-reference constraint disclosed in AUDIO-001-C2 applies: the final-HEAD rerun is reported in the handoff/worklog) | (captured fresh at the docs commit) |

## Fault-probe evidence (disposable worktree at `ca0b479`, tests unmodified; script `/home/z/my-project/scripts/audio002c1-probes.py`)

Combined log: `11-fault-probes.log` — sha256 `5f1af3c0…`. Every mutant parses (syntax check exit 0), runs against the focused unit file and the focused new-test E2E set (`--grep AUDIO-002-C1`, chromium), and the production file is restored with sha256 verification after every probe. Two probe-round disclosures: (1) the first round's E2E detector runs in the worktree failed with `MODULE_NOT_FOUND` for `@playwright/test` (the disposable worktree had no `node_modules`) — those exit codes were infrastructure failures, not detections, and were reclassified; the fixed round symlinks the main checkout's installed dependencies into the worktree and verifies port 9012 is free so the worktree's own server serves the mutated files; (2) the first round showed U6 surviving the P5 mutant (a stale onend on a fully-stopped empty queue is absorbed by the drain-path re-stop), which prompted the U6 replacement-session strengthening at `ca0b479` per TS-MUT-005 — the strengthened test was rerun green against the unmodified implementation before the probes were repeated.

| Probe | Mutation (production only) | Intended detectors | Actual failing tests | Classification |
|---|---|---|---|---|
| P1 deck-change-cancellation-removed | `js/core/verbs-engine.js`: `loadDeck()` drops its `this.stopAudioQueue()` call | U1/U5/U6 + deck-change E2E tests | Unit: U1, U5, U6. E2E: `[AUDIO-002-C1] selecting another deck…`, `[AUDIO-002-C1] a paused autoplay session…` | **KILLED** |
| P2 search-context-cancellation-removed | `js/core/verbs-engine.js`: the search input handler drops its `this.stopAudioQueue()` call | the search-context E2E tests | E2E: `[AUDIO-002-C1] a search that empties the queue…`, `[AUDIO-002-C1] a search that changes the result set…` | **KILLED** |
| P3 empty-queue-early-return-without-cleanup | `js/core/verbs-engine.js`: the empty-controller-queue early return reverts to a bare `return` | U3 + the empty-queue E2E test | Unit: U3. E2E: `[AUDIO-002-C1] starting playback with an empty controller queue…` | **KILLED** |
| P4 empty-plan-early-return-without-cleanup | `js/core/verbs-engine.js`: the empty-plan early return reverts to a bare `return` | U4 + revised A12 + the empty-plan E2E test | Unit: U4, revised A12. E2E: `[AUDIO-002-C1] a start attempt producing an empty planned sequence…` | **KILLED** |
| P5 stale-callback-alters-replacement | `js/core/tts.js`: the utterance `onend` loses BOTH ownership guards (generation check + utterance identity; removing either layer alone is an equivalent mutant — the AUDIO-002 TS-MUT-005 lesson) | U6 (strengthened) + the stale-callback E2E test; pre-existing B3/B10 as collateral | Unit: U6 (new, intended), B3, B10 (pre-existing family), B11 (documented cross-test mock-timer collateral — passes in isolation, same pattern AUDIO-002 disclosed). E2E: `[AUDIO-002-C1] a stale callback from the replaced queue…` | **KILLED** |

Production-file integrity: `js/core/verbs-engine.js` sha256 `6ae7bfef…` and `js/core/tts.js` sha256 `8ca70a9e…` re-verified identical after every probe; the main working tree was never mutated.
