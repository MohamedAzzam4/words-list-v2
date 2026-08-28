# External Handoff Preparation — 2026-08-29

Status: documentation and publication preparation; not acceptance of the CEFR product implementation.

## Scope and identity

- Assignment: prepare contracts, detailed work packages, success criteria, testing/dead-code philosophy and reports for external GLM execution; publish to GitHub.
- Original remote roadmap revision: `b312a36cc509830f294873e2e8ea3b107a369307`.
- Local source HEAD: `f39aff6`, including preceding data-parser commit `ebc11d7`.
- Separate clean handoff checkout; branch `codex/cefr-glm-handoff`.
- Application correction commit: `4c367f3ab73c102845cdd441a6b793676645771d`. Only the previously completed normalized-data fixes, validator, card speech-dispatch guard, tests, and LF-DATA contract update were copied from local work.
- Subsequent documentation edits do not change runtime source. A narrow `.gitignore` exception makes `docs/cefr/` publishable, including future reports, while unrelated local docs stay ignored. Original dirty working tree and its unrelated application/enforcement work remain untouched.

## Documents delivered

- Updated roadmap with actual status and links; 29 detailed WPs with dependency/status/risk, allowed paths, work steps and success/test criteria.
- Active PX, CM, FP, TS, DC, DR and LF/LR contracts; existing GC targets published with known baseline mismatch explicitly documented.
- AE/OR historical workflow documents published as PAUSED; no enforcement runtime/adapters activated or required.
- Acceptance matrix, portable sandbox setup and first GLM prompt, reusable prompt/report templates, baseline and reports directory.
- The formerly incomplete contract index now ships every indexed document.

## Preparation command record

Commands were run from the relevant repository root; no machine-absolute paths or private user data are needed to reproduce product checks. Raw preparation tool logs remain in the originating task; the key actual outputs are preserved below. This is a retrospective preparation report, not invented RED evidence for earlier work.

| Command/action | Actual outcome | Interpretation |
|---|---|---|
| Git status/log/remotes and tracked-file/diff inspection | Successful read-only inspection | Isolated completed fixes from unrelated local edits |
| `git ls-remote origin refs/heads/review/guided-challenge` in restricted environment | Network connection failed; individual exit not retained in the combined read-only command | Environment, not missing GitHub branch |
| Same remote check with network permission | Exit 0, remote SHA `b312a36cc509830f294873e2e8ea3b107a369307` | Roadmap already published |
| Fresh local clone, task branch creation and repository remote setup | Exit 0 | Clean delivery boundary |
| `node --version` | `v24.15.0` | Preparation runtime |
| `npm --version` via PowerShell shim | Failed: missing user npm CLI module | Host shim issue; not a package test |
| `npm.cmd --version` | `11.12.1`, exit 0 | Working npm invocation |
| `python --version`; `py -3 --version` in restricted environment | Unavailable on PATH / executable access denied | Browser-server setup limitation |
| `npm.cmd ci --ignore-scripts --no-audit --no-fund` restricted | Exit 1, EPERM accessing npm cache | Permission issue |
| Same install with permission | Exit 0, 3 packages installed | Locked dependencies available; lockfile unchanged |
| `node --test tests/unit/flashcards.test.mjs tests/unit/level-data.test.mjs tests/unit/storage.test.mjs tests/unit/verb-challenge-engine.test.mjs` | Exit 0; 59 passed, 0 failed/skipped; ~0.31 s test duration | Delivered application-tree baseline |
| `npm.cmd run test:units` | Exit 0; 59 passed, 0 failed/skipped; ~0.20 s test duration | Full tracked unit set; same source tree as correction commit |
| `Get-Content -Raw js/core/flashcards.js` piped to `node --input-type=module --check` | Exit 0 | Browser-module syntax, no source rewriting |
| Same module check for `js/levels/a1.config.js` and `js/levels/b2.config.js` | Both exit 0 | Config-module syntax |
| `node --check js/core/level-data-validator.mjs` | Exit 0 | Validator syntax |
| `node node_modules/playwright/cli.js test tests/e2e/favorites-filters.spec.js tests/e2e/srs.spec.js --project=chromium --reporter=line` restricted | Exit 1, configured Python server could not launch | No browser acceptance result from failed run |
| Same focused browser command with Python on child-process PATH and execution permission | Exit 0; 2 passed in 8.5 s | Clean-checkout SRS/favorites regression; no duplicate suite active |
| `git diff --check` before application commit | Exit 0 (line-ending warnings only) | No whitespace errors |
| Selective application commit | `4c367f3` | 7 intended files; no unrelated local changes |

Actual final unit summary:

```text
tests 59
suites 0
pass 59
fail 0
cancelled 0
skipped 0
todo 0
```

Actual focused browser summary: `2 passed (8.5s)`.

## Findings and limits

- The real level speech wrapper ignores its language argument; wrapper-stub tests do not establish full voice correctness. Assigned to the audio integration scope, not silently fixed during documentation work.
- Example UI migration is unfinished; data preservation is not UI parity.
- Unpublished local Verbs corrections are excluded. Published GC implementation/contract gaps need triage at BASELINE-001.
- Full E2E, Mobile Chrome, all audio hardware and the provider's Linux sandbox were not run here. The handoff is not a release certificate.
- Existing tests need quality review, including dynamic UI paths and negative assertions; the docs explicitly require it.
- No product dead-code removal or mutation testing was performed during this documentation task. Future implementation WPs require scoped inventories and applicable distinct implementation fault probes.
- Documentation checks and publication identifiers are recorded in the final preparation verification section below when executed.

## Final preparation verification

- Package parity check: 28 original roadmap WP headings; all 28 have detailed entries, plus `VERIFY-001` = 29. Dependency register has 29 rows; no missing/duplicate IDs.
- The first ad-hoc parity checker incorrectly excluded digits inside B1/A2 IDs and exited 1. Correcting that diagnostic regex (not the documents) produced the accurate 29-entry pass. No package was silently dropped.
- Required-document existence check: all required handoff/contract/template files exist.
- `node node_modules/playwright/cli.js test --list`: exit 0; **100 test/project cases in 8 files**. This is inventory only, not 100 passing tests.
- The repository previously ignored all `docs/`; the publication exception is deliberately limited to `docs/cefr/`. No unrelated ignored documents or runtime state are included.
- The first staged diff check found trailing empty lines in two imported contracts. They were removed without changing their rules; the final staged diff check must pass before publication.
- Final `git diff --cached --check`: exit 0 after that whitespace correction.
- Staged publication audit: all 10 indexed contracts, all 15 first-prompt document paths and all 8 handoff/template/report files are tracked; zero missing paths and zero unexpected staged files.
- `git diff 4c367f3 --exit-code -- js tests css package.json package-lock.json playwright.config.js '*.html'`: exit 0; runtime and test inputs unchanged since the verified correction baseline.
- GitHub branch-name check: no existing `codex/cefr-glm-handoff` remote branch at preparation. Publication identifiers are returned in the delivery response after the push succeeds; do not infer successful publication from this report alone.

## Acceptance

Owner/product acceptance: pending per package. A successful push or documentation review cannot approve unfinished product requirements.
