# SHARED-CARD-003-C2 — Attempt 01 Delivery Report

## 1. Identity and status

- Status: READY_FOR_REVIEW (all engineering work complete and evidenced; delivery push executed after this docs-only commit — final status reported in the handoff message)
- Assigned goal and task type: make the AC-09 target-size assertion portable across platforms without weakening it. During an owner-side combined Chromium + Mobile Chrome run on Windows, the A1 Shuffle button's Playwright `boundingBox` height was `43.99998474121094` against a correctly-enforced CSS `min-height: 44px`, so the strict comparison `expect(box.height).toBeGreaterThanOrEqual(44)` was platform-flaky (the same test passed in isolation). Task type: **TEST_MODIFICATION** only — the accepted SHARED-CARD-003-C1 production commit must remain byte-identical.
- Owner assignment reference: owner task message "TASK: Execute SHARED-CARD-003-C2 — make the AC-09 target-size assertion portable without weakening it" with base, permitted paths, the owner review result (C1 production CSS correction accepted; do not modify production code), and the fourteen required-work items.
- GitHub task branch: `codex/glm-shared-card-003-c2-01`; base commit: `43fed0d95b506355160c6086f72b2476d3ab195c` (accepted SHARED-CARD-003-C1 revision, delivered on `codex/glm-shared-card-003-c1-01`); corrected-tests commit (final tested code): `2da9b4ba595c15fd6c6cde93be027cc2f7f9d07b`. This commit adds only report/evidence documents and does not move the tested code revision.
- Evidence index: `docs/cefr/evidence/SHARED-CARD-003-C2/01/INDEX.md`
- Final delivered SHA is returned after commit/push in the handoff message, not embedded into its own commit.
- Executor/model and sandbox OS/runtime versions: GLM executor (Super Z), Debian sandbox, Node v24.19.0, npm 11.17.0, Playwright 1.61.1 (lockfile), chromium + chromium-headless-shell v1228, projects `chromium` and `Mobile Chrome` per `playwright.config.js`.
- Start/end time: 2026-08-31 ~01:55–02:20 UTC (sandbox clock); work directory: repository root (`/home/z/my-project/words-list-v2`, paths below are repository-relative).
- Dependency acceptance references: SHARED-CARD-003-C1 accepted (owner review result quoted in the assignment: "The SHARED-CARD-003-C1 production CSS correction is accepted. Do not modify production code."); SHARED-CARD-003 (`e3d3c22b`) and SHARED-CARD-002-C1 (`e55debd4`) accepted previously.

## 2. Required reading and pre-edit plan

- Paths fully read: `AGENTS.md`; `playwright.config.js`; `package.json`; `css/core.css` (the AC-09 block, lines 775–795, read-only); `tests/e2e/cefr-cards.spec.js` complete (1,709 lines at base — helpers `tabWalk` / `snapshotFocusStyles` / `visibleFocusIndicator`, the A1 `SC3-A11Y-TARGETS` loop, the B2 `SC3-B2-A11Y-TOOLBAR` loop); `docs/cefr/reports/SHARED-CARD-003-C1-01.md` (owner-review context and prior fault-probe discipline); `docs/cefr/evidence/SHARED-CARD-003-C1/01/INDEX.md`; `docs/cefr/reports/README.md`; `docs/cefr/templates/WORK_PACKAGE_REPORT.md`; `/home/z/my-project/worklog.md` (prior delivery history). Relevant contract IDs: ACCEPTANCE_MATRIX AC-09 (44×44 CSS px targets), LEVEL_FLASHCARD_STANDARD focus/target clauses — both already satisfied by production code; this package changes only how the test measures.
- Before behavior: both sizing assertions compare the raw `boundingBox` floats, so a sub-pixel layout value such as `43.99998474121094` (Windows combined run) fails despite compliant CSS; approved after behavior: width and height are rounded to two decimal places (`Math.round(value * 100) / 100`) before the unchanged `>= 44` comparison, absorbing at most 0.005 px of measurement noise.
- Explicit non-goals: no change to any production file (CSS/JS/HTML), no threshold below 44, no removal or relaxation of any other assertion, no changes to unrelated tests, contracts, vocabulary, dependencies, or snapshots; the former 37 px defect must remain a decisive failure.
- Exact allowed write paths: `tests/e2e/cefr-cards.spec.js`, this report, and `docs/cefr/evidence/SHARED-CARD-003-C2/01/**`. No other file was written inside the repository.
- Risk: low. The change is confined to two assertion sites plus one pure helper in a single spec file; fault families considered: (a) normalization masking a real undersizing — ruled out arithmetically (0.005 px window vs. the 7 px defect) and by the KILLED mutation probe; (b) accidental edit of production CSS — ruled out by sha256 integrity records; (c) cross-platform semantics drift of `Math.round` — none, ECMAScript-specified half-up rounding on finite numbers.
- Affected callers/UI/state/storage/audio boundaries: none — no production surface touched; the spec file is consumed only by the Playwright runner.
- Baseline tests and known failures: at base `43fed0d`, the two targeted tests pass 4/4 on this Linux sandbox (both projects, one command) and the full spec passes 92/92; the only known failure is the owner-reported Windows flake, which this package removes. No pre-existing skips in this spec.

## 3. Changes and rationale

| File | Change/purpose | Contract/WP criterion | Compatibility impact |
|---|---|---|---|
| `tests/e2e/cefr-cards.spec.js` | Added pure helper `roundCssPixels(value)` = `Math.round(value * 100) / 100` (with an explanatory comment); wrapped both the width and height operands in the A1 `SC3-A11Y-TARGETS` loop and the B2 `SC3-B2-A11Y-TOOLBAR` loop with the helper. +20/−4 lines, three edit sites. | AC-09; owner items 1–5 (normalize floating-point error, round to two decimals, apply to width and height consistently, threshold stays 44, the 37 px defect still fails) | None on production; test-only. Assertion messages unchanged; both tests keep their stable IDs and every pre-existing assertion. |

Root cause: browser layout engines emit sub-pixel `boundingBox` floats for CSS-enforced integer sizes; Playwright surfaces them raw, and a strict `>= 44` comparison then depends on platform rasterization noise (the owner measured `43.99998474121094` on Windows while the isolated run measured 44). Why this approach: rounding to two decimal places is the smallest, dependency-free normalization that absorbs exactly that noise class; it cannot lift a genuine defect because the absorption window is 0.005 px while the historical defect was 7 px below the threshold (proven in `normalization-proof.log` and by the KILLED probe). The product threshold remains the literal `44` in both assertions. No old assertion was superseded: every assertion from the accepted C1 revision still exists with the same expected values; only the measurement operand is normalized. Scope deviations: none. The tests-only commit `2da9b4b` was created before the report, per the repo's commit discipline; the checkpoint push attempt at that commit was AUTHENTICATION_BLOCKED (no credential present in the documented channels at that moment — recorded in §5) and is retried at final delivery.

## 4. Acceptance-to-evidence mapping

| Criterion / AC row / contract ID | Test path + exact name | Result | Log/artifact | Tested revision |
|---|---|---|---|---|
| AC-09 target-size assertion portable (owner items 1–3: normalize, two-decimal rounding, width+height consistently) | `tests/e2e/cefr-cards.spec.js` — `SC3-A11Y-TARGETS: card and toolbar touch targets are at least 44x44 CSS pixels (AC-09)` and `SC3-B2-A11Y-TOOLBAR: B2 toolbar controls are keyboard-focusable with a visible indicator and 44x44 targets (AC-09)` (both use `roundCssPixels` on width and height) | PASS — 4/4 runs green after the change | `corrected-targeted-both-projects.log` | 2da9b4b |
| Owner item 4: threshold not lowered | both assertions still compare `>= 44` (literal unchanged); normalization window ≤ 0.005 px | PASS | `normalization-proof.log` (43.994 still FAILs; window is 0.005 px = 0.011 % of the threshold) | 2da9b4b |
| Owner item 5: former 37 px defect still fails decisively | disposable sizing mutation reproducing the C1 defect state | PASS — probe KILLED at Received 37 (7 px margin) on all 4 runs | `probe1-sizing-mutation.log`, `probe1-focus-control.log` | 2da9b4b (mutated worktree) |
| Owner item 7: corrected targeted tests, Chromium + Mobile Chrome together in one command | `npx playwright test tests/e2e/cefr-cards.spec.js --grep "SC3-A11Y-TARGETS\|SC3-B2-A11Y-TOOLBAR"` (no `--project` filter → both configured projects) | PASS — 4 passed, exit 0 | `corrected-targeted-both-projects.log` | 2da9b4b |
| Owner item 8: complete cefr-cards.spec.js on both configured projects | `npx playwright test tests/e2e/cefr-cards.spec.js` | PASS — 92 passed (46 per project), exit 0 | `final-cefr-cards-both-projects.log` | 2da9b4b |
| Owner item 9: sizing mutation KILLED by the normalized test | see item-5 row | PASS (KILLED) | `probe1-sizing-mutation.log` | 2da9b4b (mutated worktree) |
| Owner item 10: `git diff --check` | `git diff --check` and `git diff --cached --check` at the corrected-tests commit and at this docs commit | PASS — clean | §5 ledger | 2da9b4b / this commit |
| Owner item 6: no production/contract/unrelated-test change | `git status`/`git diff --stat` vs base: only `tests/e2e/cefr-cards.spec.js` (+ docs after this commit); `css/core.css` sha256 `31d8d773…681697` byte-identical to base | PASS | `probe-integrity.txt`, §5 ledger | 2da9b4b |
| Units not regressed (extra safety; not explicitly required) | `npm run test:units` | PASS — 75 passed, exit 0 | `final-units.log` | 2da9b4b |

## 5. Complete command ledger

Every test attempt, including failures, retries, and infrastructure notes. Durations are approximate (sandbox clock). "WT" = disposable Git worktree (`git -c core.symlinks=false worktree add`, `node_modules` plain-copied; the main tree was never mutated and every worktree was removed after use).

| Command (exact) | Phase + revision | Exit | Passed/failed/skipped | Artifact | Interpretation |
|---|---|---|---|---|---|
| `git status && git log --oneline -5 && git rev-parse HEAD` | pre-work gate @ 43fed0d | 0 | — | — | base exists locally, tree clean, on `codex/glm-shared-card-003-c1-01` |
| `git cat-file -t 43fed0d9…` ; `git ls-remote origin refs/heads/codex/glm-shared-card-003-c2-01` ; `git ls-remote origin` | pre-work gate | 0 | — | — | base object exists; remote C2 branch absent (13 heads, all pre-existing); no STATE_MISMATCH / BRANCH_CONFLICT |
| `git checkout -b codex/glm-shared-card-003-c2-01 43fed0d9…` | branch creation | 0 | — | — | branch created from exactly the assigned base |
| `sha256sum css/core.css` | integrity baseline @ 43fed0d | 0 | — | — | `31d8d773…681697` — the accepted production CSS fingerprint that must never change |
| `npx playwright test tests/e2e/cefr-cards.spec.js --grep "SC3-A11Y-TARGETS\|SC3-B2-A11Y-TOOLBAR"` | baseline @ 43fed0d (pre-correction, main tree) | 0 | 4 passed / 0 failed | — | strict assertions pass on Linux — the owner-reported failure is Windows-specific sub-pixel noise, confirming the normalization (not product) fix direction |
| 3× `Edit`/`MultiEdit` on `tests/e2e/cefr-cards.spec.js` | correction | — | — | — | helper + two assertion sites; only file modified |
| `git status --short && git diff --stat && git diff --check` | post-edit check | 0 | — | — | only the spec file modified (+20/−4); whitespace clean |
| `npx playwright test … --grep "SC3-A11Y-TARGETS\|SC3-B2-A11Y-TOOLBAR"` | focused @ working tree (= 2da9b4b content) | 0 | 4 passed / 0 failed | — | corrected assertions green pre-commit |
| `git add … && git commit -m "test(cefr): normalize sub-pixel box noise …"` | tests commit | 0 | — | — | `2da9b4ba595c15fd6c6cde93be027cc2f7f9d07b` |
| credential channel checks (`upload/`, env, git config, `~/.git-credentials`, `~/.netrc`) | checkpoint push attempt | — | — | — | **AUTHENTICATION_BLOCKED** — no token present in any documented channel; push deferred to final delivery (single-attempt budget preserved; remote untouched) |
| `npx playwright test tests/e2e/cefr-cards.spec.js` | final full suite @ 2da9b4b | 0 | 92 passed / 0 failed / 0 skipped | — (repeated for capture below) | complete spec green on both projects |
| `node -e "<roundCssPixels proof>"` | normalization proof | 0 | — | `normalization-proof.log` | flake value → 44 (PASS); 37/37.5/38/43.994 → FAIL; window 0.005 px |
| WT @ 43fed0d: `npx playwright test … --grep "SC3-A11Y-TARGETS\|SC3-B2-A11Y-TOOLBAR"` | baseline capture @ base | 0 | 4 passed / 0 failed | `baseline-targeted-both-projects.log` | published baseline log at the exact base revision |
| `npx playwright test … --grep "SC3-A11Y-TARGETS\|SC3-B2-A11Y-TOOLBAR"` | focused capture @ 2da9b4b | 0 | 4 passed / 0 failed | `corrected-targeted-both-projects.log` | both projects together in one command (owner item 7) |
| `npx playwright test tests/e2e/cefr-cards.spec.js` | final capture @ 2da9b4b | 0 | 92 passed / 0 failed | `final-cefr-cards-both-projects.log` | owner item 8 |
| `npm run test:units` (×3: verification, count capture, log capture) | units @ 2da9b4b | 0 | 75 passed / 0 failed / 0 skipped | `final-units.log` | no unit impact (test-only change) |
| WT @ 2da9b4b: mutation `html[data-level] #view-flashcard .controls-row .btn` selector removed from the 44px sizing rule (first exploratory pass, then evidence pass — identical patch) | fault probe | 1 | 0 passed / 4 failed | `probe1-sizing-mutation.log` | **KILLED** — all 4 runs (A1+B2 × both projects) fail at the normalized assertions with Expected >= 44, Received 37 |
| WT @ 2da9b4b (mutated): `npx playwright test … --grep "SC3-A11Y-FOCUS"` | probe control | 0 | 2 passed / 0 failed | `probe1-focus-control.log` | focus rule intact → focus test passes; kill is attributable to the sizing assertions alone |
| WT: `git checkout -- css/core.css` + `sha256sum` | probe restore | 0 | — | `probe-integrity.txt` | CSS restored byte-identical (`31d8d773…`); tests sha256 `5c0c29f8…` never touched inside the worktree |
| `git worktree remove --force` (×2 worktrees) | cleanup | 0 | — | — | main tree pristine; `git status` clean; CSS fingerprint re-verified |
| `git diff --check && git diff --cached --check` | hygiene @ 2da9b4b (and repeated at this docs commit) | 0 | — | — | no whitespace errors |
| sanitizer script over 8 raw logs + credential-pattern scan | evidence publication | 0 | — | 8 files in `docs/cefr/evidence/SHARED-CARD-003-C2/01/` | all logs sanitized; zero credential hits |

No background tasks were left running. No broad rerun was needed: the full suite was run twice (pre-capture verification and evidence capture) with identical results; every rerun is listed above. Evidence freshness: every published log was captured against the exact revision named in its INDEX row, after the last code change (`2da9b4b`); no source file changed after the captures.

## 6. Regression and integration

- A1 / B2 / ordinary Verbs / Guided Verbs: A1 + B2 fully exercised — the complete `cefr-cards.spec.js` (92 tests, both projects) covers A1/B2 ordinary cards, synthetic language edges, unit switching, flip behavior, focus/target/reduced-motion accessibility, and the phrases/conversation/SRS regression tests inside the spec. Verbs pages are untouched by this change (no production file modified; `css/core.css` byte-identical — the German Verbs reference spec of the C1 package already proved verbs unaffected by these rules, and nothing it tested has changed). Guided Verbs: not applicable — no shared surface touched.
- Phrases / Conversation / navigation / favorites / SRS: all green inside the 92-test run (`SC3-REG-*` suite), exit 0.
- Legacy storage / refresh / level and account isolation: covered by the unchanged in-spec storage-routing and isolation tests, green; no storage code path exists in a spec-file edit.
- Actual audio adapter text AND language: not applicable — no production or audio change; the spec's TTS-related tests passed unchanged within the 92.
- Browser/module startup and console errors: web server reused (`reuseExistingServer: true`, port 9012); no console-error failures in any log; no browser install needed this session (browser cache intact, unlike the C1 session).
- Desktop/mobile/themes/keyboard/reduced-motion/screenshots inspected: desktop (chromium) and mobile (Mobile Chrome) both green; keyboard-focus behavior re-verified inside `SC3-A11Y-FOCUS` / `SC3-B2-A11Y-TOOLBAR` (real Tab walks unchanged); reduced-motion covered by `SC3-A11Y-REDUCED-MOTION` (green in the 92). Themes/screenshots: not applicable — no visual change exists to inspect.
- Untested or blocked items: a literal Windows combined run could not be executed in this Linux sandbox; portability is instead proven arithmetically (the exact owner-reported value `43.99998474121094` normalizes to 44) and structurally (the normalization is platform-independent ECMAScript math). The owner may still rerun the combined Windows command as acceptance.

## 7. Test-quality and fault-probe evidence

| Probe | Risk/contract | Production target + exact patch artifact | Detecting test | Baseline / syntax result | Actual failure | Classification | Integrity proof |
|---|---|---|---|---|---|---|---|
| Sizing rule disabled (owner item 9; the single mandated probe) | AC-09 / a normalized assertion might no longer detect an undersized control | disposable worktree copy of `css/core.css`: the `html[data-level] #view-flashcard .controls-row .btn` selector line removed from the 44px rule (rule reverts to covering only `.fc-nav .btn` — the exact former C1 defect state, controls return to 37 px) | `SC3-A11Y-TARGETS` (`back-to-list height`) and `SC3-B2-A11Y-TOOLBAR` (`#view-flashcard .controls-row > .btn:first-child height`), both at the `roundCssPixels(box.height)` assertion (spec lines 1027 / 1477) | worktree unmutated baseline not rerun this package (the same tree passes 4/4 as `corrected-targeted-both-projects.log`); mutation applied once per pass, verified by `git diff --stat` (1 file, +1/−2) | **4/4 runs failed, exit 1 — Expected: >= 44, Received: 37** on both projects; the focus control run passes 2/2 under the same mutation | **KILLED** | `probe-integrity.txt`: `css/core.css` sha256 `31d8d773…681697` identical before/after; `tests/e2e/cefr-cards.spec.js` sha256 `5c0c29f8…25d2b` never modified in the worktree; main tree clean throughout |

Probe selection/count: the owner mandated exactly one sizing mutation; no second probe applies because the change is test-only (there is no new production behavior to mutate — the production tree is byte-identical to the accepted C1 revision, whose focus and sizing rules were already proven KILLED-by-mutation in the C1 package). The probe was executed twice (exploratory pass, then evidence-capture pass with the identical patch); both passes produced identical results and both are recorded in §5. No conditional assertions, weak mocks, ignored errors, or snapshot changes exist in this package: the helper is a pure function applied unconditionally to both operands, and no `try/catch` swallows anything. The C1-window probe logs (focus-rule mutation) remain valid for the unchanged production CSS and are not rerun here.

## 8. Dead-code and dependency inventory

| Candidate symbol/path | Searches + dynamic caller checks | Classification | Disposition | Regression proof |
|---|---|---|---|---|
| `roundCssPixels` (new helper, `tests/e2e/cefr-cards.spec.js`) | `rg -n "roundCssPixels" tests/e2e/cefr-cards.spec.js` → definition + exactly 4 call sites (width/height × A1 loop / B2 loop); executed on every run of both tests | DYNAMICALLY_USED (live: invoked by the two AC-09 tests in all 4 green runs) | kept — the single new symbol this package introduces | `corrected-targeted-both-projects.log`, `final-cefr-cards-both-projects.log` |

No production symbol, dependency, or path was added, removed, or left orphaned: the production tree is byte-identical to base (sha256-proven), and `package.json`/lockfile are untouched. The scan boundary is this package's diff (one spec file); no claim is made about the wider repository.

## 9. Findings, limitations, and handoff

| Finding ID | Severity/impact | Reproduction and evidence | Disposition | Owner decision needed |
|---|---|---|---|---|
| SC3C2-F1: strict float comparison platform-flaky (owner finding) | medium (test reliability only; product compliant) | owner's Windows combined run measured `43.99998474121094`; arithmetic proof that it rounds to 44 while 37 stays 37 | fixed — two-decimal normalization, threshold unchanged | none |
| SC3C2-F2: Linux sandbox cannot reproduce Windows sub-pixel values | low (evidence limitation) | baseline run passes 4/4 on Linux; portability proven by `normalization-proof.log` + platform-independent ECMAScript rounding | documented; owner may rerun the combined Windows command as acceptance | optional confirmation |
| SC3C2-F3: checkpoint push AUTHENTICATION_BLOCKED at the tests commit | low (delivery logistics) | credential channel checks (§5) found no token; single-attempt budget preserved; remote untouched | deferred to final delivery (retried after this commit) | if still blocked, re-send the PAT via a documented channel (paste in chat or token file in `upload/`) |

- Remaining product risks: none introduced — production tree byte-identical to the accepted C1 revision. Environment restrictions: no Windows platform available (SC3C2-F2). Untested requirements: none beyond SC3C2-F2's optional Windows confirmation.
- Final diff/status vs base: `tests/e2e/cefr-cards.spec.js` (+20/−4, commit `2da9b4b`) plus this report and `docs/cefr/evidence/SHARED-CARD-003-C2/01/**` (this commit). No unintended ID, content, storage, dependency, contract, vocabulary, or snapshot changes: `git status` clean at both commits; `css/core.css` sha256 `31d8d773…681697` identical to base.
- GitHub delivery branch and report/evidence paths: branch `codex/glm-shared-card-003-c2-01`; report `docs/cefr/reports/SHARED-CARD-003-C2-01.md`; evidence `docs/cefr/evidence/SHARED-CARD-003-C2/01/` (8 sanitized artifacts + `INDEX.md`). Remote-SHA verification is returned in the final handoff message.
- Next proposed WP: none proposed — owner assigns. AUDIO-001 / REVIEW-001 and any later packages were not started.

## 10. Owner/reviewer disposition — not executor approval

- Reviewer and reviewed exact revision: owner review of `codex/glm-shared-card-003-c2-01` at tested code `2da9b4ba595c15fd6c6cde93be027cc2f7f9d07b` (+ this docs commit).
- Verdict: pending.
- Criteria/findings accepted or declined; explicit waivers and reason: awaiting owner review. Suggested acceptance checks: (a) rerun the combined Windows command from the owner finding — the A1 Shuffle height `43.99998474121094` now normalizes to 44 and passes; (b) confirm the KILLED probe evidence in `probe1-sizing-mutation.log` satisfies item 9; (c) confirm `css/core.css` byte-identity against the accepted C1 revision.
