# SHARED-CARD-003-C2 / Attempt 01 — Evidence Index

All evidence below was produced in the external sandbox (`/home/z/my-project/words-list-v2`, Debian, Node v24.19.0, npm 11.17.0, Playwright 1.61.1 from the lockfile, chromium + chromium-headless-shell v1228, projects `chromium` and `Mobile Chrome` from `playwright.config.js`). Every log is the sanitized text output of the exact command listed (sanitization: `[WebServer]` HTTP request lines removed, CR removal, trailing-whitespace scrub, ANSI escape strip, and — in `probe1-sizing-mutation.log` only — the disposable worktree prefix `/home/z/my-project/c2-probe-wt/` rewritten to repository-relative form in the four stack-frame lines; no other content was altered; no credentials or user data appear in any file — every published copy was scanned for credential patterns: zero hits). Tested revisions: base `43fed0d95b506355160c6086f72b2476d3ab195c` (baseline, accepted SHARED-CARD-003-C1 revision) and corrected-tests revision `2da9b4ba595c15fd6c6cde93be027cc2f7f9d07b` (all corrected/final/probe evidence). This is a **test-only** correction: `css/core.css` sha256 `31d8d77374b4a09b9c8eea67868a138352aed89fcbc755bdc8717f04cb681697` is byte-identical to the accepted production commit at every step (proven in `probe-integrity.txt` and by `git status` after every command).

## Baseline (base 43fed0d, pre-correction strict assertions)

| File | Command | Outcome |
|---|---|---|
| `baseline-targeted-both-projects.log` | `npx playwright test tests/e2e/cefr-cards.spec.js --grep "SC3-A11Y-TARGETS\|SC3-B2-A11Y-TOOLBAR"` (both configured projects in one command, disposable worktree at the base revision) | **4 passed** / 0 failed, exit 0 — the strict assertions pass on this Linux sandbox; the owner-reported failure is specific to the Windows combined run's sub-pixel `boundingBox` value, which is why the fix normalizes measurement noise instead of touching the product |

## Normalization semantics (no weakening proof)

| File | Command | Outcome |
|---|---|---|
| `normalization-proof.log` | disposable `node -e` arithmetic proof of `roundCssPixels(v) = Math.round(v * 100) / 100` | The owner-reported flake value `43.99998474121094` normalizes to **44** (passes ≥ 44); the former C1 defect heights **37 / 37.5 / 38 stay below 44 and fail**; even `43.994` still fails. Maximum leniency introduced is **0.005 px (0.011 % of the threshold)** — far below any real sizing defect |

## Final evidence (corrected-tests revision 2da9b4b)

| File | Command | Outcome |
|---|---|---|
| `corrected-targeted-both-projects.log` | `npx playwright test tests/e2e/cefr-cards.spec.js --grep "SC3-A11Y-TARGETS\|SC3-B2-A11Y-TOOLBAR"` (both projects together in one command, as required) | **4 passed** / 0 failed, exit 0 — A1 `SC3-A11Y-TARGETS` and B2 `SC3-B2-A11Y-TOOLBAR` on `chromium` + `Mobile Chrome` |
| `final-cefr-cards-both-projects.log` | `npx playwright test tests/e2e/cefr-cards.spec.js` (complete spec, both configured projects) | **92 passed** / 0 failed, exit 0 (2.4m) — 46 tests per project, identical to the accepted C1 delivery counts |
| `final-units.log` | `npm run test:units` | **75 passed** / 0 failed, exit 0 (extra safety; no unit touched) |

## Fault-probe evidence (disposable worktree at 2da9b4b, tests unmodified)

`sha256` of `css/core.css` (`31d8d773…681697`) and `tests/e2e/cefr-cards.spec.js` (`5c0c29f8…25d2b`) were recorded before the probe and re-verified byte-identical after the restore (`probe-integrity.txt`); the main working tree was never mutated, and the worktree was removed afterwards.

| File | Probe | Mutation (production CSS only, disposable copy) | Detecting test + exact assertion | Classification |
|---|---|---|---|---|
| `probe1-sizing-mutation.log` | Sizing rule disabled | `css/core.css` 44px sizing rule: the `html[data-level] #view-flashcard .controls-row .btn` selector line removed (the rule reverts to covering only `.fc-nav .btn`, reproducing the exact former C1 defect state) | All **4** runs (A1 + B2 titles × `chromium` + `Mobile Chrome`) failed at the **normalized** assertions `roundCssPixels(box.height)` (spec lines 1027 / 1477): `#view-flashcard .controls-row > .btn:first-child height` and `back-to-list height` — **Expected: >= 44, Received: 37** (exit 1). The normalized value of the former defect is exactly 37: the rounding lifts nothing | **KILLED** |
| `probe1-focus-control.log` | Control run under the same mutation | same mutated worktree, focus rule intact | `SC3-A11Y-FOCUS` **2 passed** (both projects), exit 0 — the kill is attributable specifically to the sizing assertions, not to collateral breakage | control |
| `probe-integrity.txt` | Integrity record | — | `css/core.css` sha256 identical before and after the probe; `tests/e2e/cefr-cards.spec.js` never touched inside the worktree | restored |

## Hygiene

- `git diff --check` and `git diff --cached --check` at the corrected-tests commit: clean (no whitespace errors).
- Working tree after all runs: only `tests/e2e/cefr-cards.spec.js` modified relative to base (20 insertions, 4 deletions); `git status` clean at every commit point.
- Every log was scanned for credential patterns before publication: zero hits.
