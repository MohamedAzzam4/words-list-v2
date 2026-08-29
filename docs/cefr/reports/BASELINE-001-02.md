# BASELINE-001 — Attempt 02 Delivery Report (delivery-only correction)

## 1. Identity and status

- Status: READY_FOR_REVIEW (delivery-only correction; no engineering work repeated)
- Assigned goal and task type: correction of the BASELINE-001 attempt-01 PUBLICATION only. Attempt 01 (branch `codex/glm-baseline-001-01`, commit `b05256570e667daf67e80cdcf0f455b2a3e50146`) received verdict **CHANGES_REQUESTED** because the optional `git format-patch` artifact (`docs/cefr/evidence/BASELINE-001/01/BASELINE-001-01.patch`) contains format-inherent trailing whitespace (`-- ` signature lines, trailing blank line at EOF), so the attempt-01 published diff does not pass `git diff --check`. Attempt 02 republishes the evidence set without any patch artifact. **No application tests were rerun, re-executed, or repeated for this attempt; no source, test, contract, content, dependency, lockfile, or workflow file was modified.**
- Owner assignment reference: delivery-correction instruction received after the attempt-01 CHANGES_REQUESTED verdict (branch `codex/glm-baseline-001-02`; report `docs/cefr/reports/BASELINE-001-02.md`; evidence `docs/cefr/evidence/BASELINE-001/02/`; base = tested revision `d2f4c79909c4c89e5efbdbeb5d93ebac2b206986`; republish the three retained original logs; exclude patch artifacts; `git diff --cached --check` must exit 0 before committing; push only the permitted branch without force).
- Branch; base commit; final tested code commit; report commit (fill after creation):
  - Branch: `codex/glm-baseline-001-02` (created directly from the tested revision; only permitted push target)
  - Base commit: `d2f4c79909c4c89e5efbdbeb5d93ebac2b206986` (the tested BASELINE-001 revision, identical to the attempt-01 base)
  - Final tested code commit: `d2f4c79909c4c89e5efbdbeb5d93ebac2b206986` — unchanged from the original execution; this correction changed no code, so per DR-007 the original evidence remains valid for this revision
  - Report commit: the single publication commit at the tip of this branch (this report, the evidence directory, and the index are added together); full SHA returned in the delivery response and verifiable via `git ls-remote` on the permitted branch. No hash is invented before creation.
- Executor/model and sandbox OS/runtime versions: same executor sandbox as the original execution — Debian GNU/Linux 13 (trixie); git 2.47.3; Node v24.19.0; npm 11.17.0 (recorded for identity only — no Node/npm/Python/Playwright runtime was exercised by this correction, because no tests were rerun; original-execution versions: Python 3.12.14, Playwright 1.61.1, Chromium 149.0.7827.55).
- Start/end time; work directory: correction window 2026-08-29T00:25Z–00:35Z (UTC); work directory `/home/z/my-project/words-list-v2` (same clone; branch switched to the new correction branch). Original execution window: 2026-08-28T23:05Z–23:28Z (UTC).
- Dependency acceptance references: none — this correction installs nothing and executes no test stack. Original execution acceptance: `npm ci --ignore-scripts --no-audit --no-fund` from the unchanged lockfile (attempt-01 report section 5, row 8).

## 2. Required reading and pre-edit plan

- Paths fully read, relevant contract IDs, observed conflicts: no new repository reading was required — this correction touches only publication artifacts. All documents required by BASELINE-001 were fully read during the original execution (list in `docs/cefr/reports/BASELINE-001-01.md` section 2, published on the attempt-01 branch): `AGENTS.md`; all nine contracts incl. `contracts/DELIVERY_REPORTING.md` (DR-002, DR-003, DR-004, DR-006, DR-007 directly govern this correction) and `contracts/PORTABLE_AGENT_EXECUTION.md`; `docs/cefr/BASELINE.md`, `WORK_PACKAGES.md`, `ACCEPTANCE_MATRIX.md`, `GLM_HANDOFF.md`; the roadmap; the report template and reports README. For this correction the template, reports README, attempt-01 report, and retained artifacts were re-examined. Observed conflicts: none new.
- Before behavior; approved after behavior; explicit non-goals:
  - Before: attempt 01 published at `b05256570e667daf67e80cdcf0f455b2a3e50146` on `codex/glm-baseline-001-01`, whose published diff fails `git diff --check` solely because of the patch artifact's format-inherent whitespace (flags at `BASELINE-001-01.patch:176,210,212` trailing whitespace, `:214` blank line at EOF).
  - After: this branch (`codex/glm-baseline-001-02`, based directly on `d2f4c79`) adds only `docs/cefr/reports/BASELINE-001-02.md` and `docs/cefr/evidence/BASELINE-001/02/{test-units.log, e2e-focused.log, playwright-list.log, INDEX.md}`; the staged and published diffs pass `git diff --check` with exit 0.
  - Non-goals: no application/test/contract/content/dependency/lockfile/workflow changes; no test reruns of any kind; no modification, force-push, or deletion of attempt 01 (its branch and commits stay exactly as published); no merge, deploy, or work on any other branch; no new findings work beyond restating the correction.
- Exact allowed write paths and any proposed new files: `docs/cefr/reports/BASELINE-001-02.md` (this file) and `docs/cefr/evidence/BASELINE-001/02/` (three republished logs + `INDEX.md`) only. Task-local originals remain outside the repository at `../baseline-001-artifacts/` (unchanged).
- Risk: low — publication-only git/file operations. Fault families: (a) republished logs drifting from the retained originals (mitigated by SHA-256 comparison against the attempt-01 published hashes and the retained originals); (b) new whitespace defects in authored files (mitigated by the mandatory `git diff --cached --check` gate and a final `git diff --check` against the base); (c) accidentally touching attempt 01 (mitigated by never checking out or pushing that branch; verified by `git ls-remote` showing attempt 01 still at `b0525657`).
- Affected callers/UI/state/storage/audio boundaries: none — no runtime file touched.
- Baseline tests and known failures: unchanged from the original execution (59/59 unit pass; 2/2 focused E2E pass; 100 inventoried-only; known gaps BL-01..BL-08 in the attempt-01 report section 9). Nothing was rerun for this correction, so no result could change.

## 3. Changes and rationale

| File | Change/purpose | Contract/WP criterion | Compatibility impact |
|---|---|---|---|
| `docs/cefr/reports/BASELINE-001-02.md` | New: this delivery-correction report | Correction instruction "report: docs/cefr/reports/BASELINE-001-02.md"; DR-001, DR-002 | None (documentation only) |
| `docs/cefr/evidence/BASELINE-001/02/test-units.log` | Republish retained original unit-suite log (byte-identical) | Correction instruction "republish the three retained original logs"; DR-006 | None (evidence file, not runtime) |
| `docs/cefr/evidence/BASELINE-001/02/e2e-focused.log` | Republish retained original focused-E2E log (byte-identical) | Same | None |
| `docs/cefr/evidence/BASELINE-001/02/playwright-list.log` | Republish retained original test-inventory log (byte-identical) | Same | None |
| `docs/cefr/evidence/BASELINE-001/02/INDEX.md` | New: evidence index with verified SHA-256 hashes, missing-evidence declarations, correction and no-rerun statements | Correction instruction "updated INDEX.md with verified SHA-256 hashes and missing-evidence declarations"; DR-003, DR-004, DR-006 | None |

Root cause of the correction (publication defect, not a product defect): attempt 01 included a verbatim `git format-patch` artifact whose trailer lines (`-- ` and a trailing blank line) are inherent to that format. `git diff --check` therefore flagged the attempt-01 published diff (4 flags, all inside `BASELINE-001-01.patch`). Attempt 01's index defended byte-identity of the artifact; owner review ruled the published diff must pass the check. The correction resolves the conflict by removing patch artifacts from the published evidence set entirely rather than mutating the retained original: the three verbatim command logs are whitespace-clean on their own, so the whole attempt-02 diff passes `git diff --check` with exit 0 while every retained byte of real command output stays unaltered. No test, assertion, snapshot, or application file was superseded by this correction; nothing was rerun.

## 4. Acceptance-to-evidence mapping

| Criterion / AC row / contract ID | Test path + exact name | Result | Log/artifact | Tested revision |
|---|---|---|---|---|
| Correction: base branch on tested revision | `git checkout -b codex/glm-baseline-001-02 d2f4c79909c4c89e5efbdbeb5d93ebac2b206986` | PASS — branch created at exactly `d2f4c79909c4c89e5efbdbeb5d93ebac2b206986`; clean tree | Section 5 row 1 | d2f4c79 |
| Correction: republish exactly the three retained original logs | `cp` of `test-units.log`, `e2e-focused.log`, `playwright-list.log` from the task-local originals directory; `sha256sum` comparison | PASS — all three byte-identical; SHA-256 equal to the retained originals and to the attempt-01 published values | Section 5 rows 2–4; `02/INDEX.md` | d2f4c79 (evidence provenance) |
| Correction: exclude `BASELINE-001-01.patch` and any generated patch artifact | Directory inventory of `docs/cefr/evidence/BASELINE-001/02/` | PASS — contains only the three logs + `INDEX.md`; no `.patch` file exists anywhere on this branch | Section 5 row 5 | — |
| Correction: updated INDEX.md with verified SHA-256 and missing-evidence declarations | `docs/cefr/evidence/BASELINE-001/02/INDEX.md` | PASS — per-file command/result/tested-commit/SHA-256 table; setup failures included; all no-retained-log commands declared missing, none reconstructed | `02/INDEX.md` | — |
| Correction: state delivery-only nature and no-rerun | This report section 1; `02/INDEX.md` correction statement | PASS — stated explicitly in both | This file; `02/INDEX.md` | — |
| Correction: `git diff --cached --check` exits 0 before committing | Run against the fully staged attempt-02 tree | PASS — exit 0, no output (gate satisfied before the commit was created) | Section 5 row 8 | — |
| Correction: final published diff passes `git diff --check` | `git diff --check d2f4c79909c4c89e5efbdbeb5d93ebac2b206986 <publication-commit>` | PASS — exit 0, no output | Section 5 row 10 | — |
| Correction: only report/evidence paths differ from tested base | `git diff --name-only d2f4c79..HEAD` | PASS — exactly this report + `docs/cefr/evidence/BASELINE-001/02/**` | Section 5 row 11 | — |
| Correction: push only `codex/glm-baseline-001-02`, no force-push, attempt 01 untouched | `git ls-remote` before/after; single `git push origin codex/glm-baseline-001-02` | PASS — remote branch created at the publication commit; attempt 01 still at `b05256570e667daf67e80cdcf0f455b2a3e50146` | Section 5 rows 12–15 | — |
| Original BASELINE-001 acceptance (carry-over, NOT rerun) | See attempt-01 report section 4 (all rows) | UNCHANGED — unit 59/0/0, focused E2E 2/0/0, list 100 in 8 files, gap audit BL-01..BL-08; evidence republished under `02/` | `02/*.log` (originals) | d2f4c79 |
| TS-MUT / AC-21 mutation testing | N/A — delivery-only correction; no code changed and no test executed, so no changed risk family to probe (TS-MUT-001 exempts documentation-only work; explained, not omitted) | N/A | Section 7 | — |
| DC-001 dead-code removal inventory | N/A — no code changed in this correction; unchanged from the original execution's justified N/A | N/A | Section 8 | — |

## 5. Complete command ledger

Commands 1–11 were executed in this correction window (2026-08-29T00:25Z–00:35Z, UTC) in `/home/z/my-project/words-list-v2` unless noted; commands 12–15 are the publication steps performed after this report was finalized, with outcomes independently verifiable on the remote. **No application test command appears in this ledger because none was run** — DR-002 completeness for the original execution is preserved in the attempt-01 report section 5 (published on the attempt-01 branch), and its three retained command logs are republished byte-identical under `docs/cefr/evidence/BASELINE-001/02/`.

| # | Command (exact) | Phase + revision | Start/end or duration | Exit | Passed/failed/skipped | Artifact | Interpretation |
|---|---|---|---|---|---|---|---|
| 1 | `git checkout -b codex/glm-baseline-001-02 d2f4c79909c4c89e5efbdbeb5d93ebac2b206986` | correction setup / d2f4c79 | instant | 0 | — | — | Correction branch created exactly at the tested revision; clean tree |
| 2 | `git ls-remote origin refs/heads/codex/glm-baseline-001-02` | pre-push conflict check | ~1 s | 0 | — | — | Empty result — permitted remote branch absent; no conflicting remote work |
| 3 | `git ls-remote origin refs/heads/codex/glm-baseline-001-01` | attempt-01 integrity check | ~1 s | 0 | — | — | Still `b05256570e667daf67e80cdcf0f455b2a3e50146` — attempt 01 untouched (also re-verified after push, row 15) |
| 4 | `cp ../baseline-001-artifacts/{test-units.log, e2e-focused.log, playwright-list.log} docs/cefr/evidence/BASELINE-001/02/` | evidence republication | instant | 0 | — | `02/*.log` | Three retained original logs copied; no patch artifact copied |
| 5 | `sha256sum test-units.log e2e-focused.log playwright-list.log` (in `02/` and against retained originals) | integrity verification | instant | 0 | — | `02/INDEX.md` table | Hashes identical to retained originals: `838b18cf…`, `23ef78b4…`, `927d869b…` (full values in `02/INDEX.md`) — byte-identical republication |
| 6 | `rg -n ' +$' <three logs>`; `rg -c $'\r' <three logs>` | whitespace pre-scan | instant | 0 (no matches) | — | — | No trailing whitespace, no CR characters in any republished log |
| 7 | `git add docs/cefr/reports/BASELINE-001-02.md docs/cefr/evidence/BASELINE-001/02/` | staging | instant | 0 | — | — | Full attempt-02 tree staged |
| 8 | `git diff --cached --check` | **mandatory pre-commit gate** | instant | **0** | — | — | No whitespace/conflict-marker errors in the staged diff — gate satisfied exactly as required |
| 9 | `git commit -m "docs(cefr): add BASELINE-001 attempt 02 delivery correction report and evidence"` | publication | instant | 0 | — | — | Single publication commit at branch tip; full SHA in delivery response |
| 10 | `git diff --check d2f4c79909c4c89e5efbdbeb5d93ebac2b206986 HEAD` | final published-diff check | instant | 0 | — | — | The attempt-02 published diff passes the check that attempt 01 failed (correction objective met) |
| 11 | `git diff --name-only d2f4c79909c4c89e5efbdbeb5d93ebac2b206986 HEAD` | scope verification | instant | 0 | — | — | Only `docs/cefr/reports/BASELINE-001-02.md` + `docs/cefr/evidence/BASELINE-001/02/**` differ from the tested base |
| 12 | `git push origin codex/glm-baseline-001-02` (no force flags; single attempt) | publication | ~5 s | 0 | — | — | New remote branch created; no force-push; no other ref touched |
| 13 | `git ls-remote origin refs/heads/codex/glm-baseline-001-02` | remote SHA verification | ~1 s | 0 | — | — | Remote SHA equals the local publication commit SHA (exact value in delivery response) |
| 14 | `git fetch origin codex/glm-baseline-001-02` + `git diff --stat FETCH_HEAD HEAD` | remote content verification | ~2 s | 0 | — | — | Empty diff — remote content identical to local HEAD |
| 15 | `git ls-remote origin refs/heads/codex/glm-baseline-001-01` | post-push attempt-01 integrity | ~1 s | 0 | — | — | Attempt 01 still at `b05256570e667daf67e80cdcf0f455b2a3e50146` — not modified, not force-pushed, not deleted |

Background task IDs and terminal outcomes: none — every command ran in the foreground and was awaited. Reason for broad reruns: none — no test was rerun by design; the only "repeated" items are file copies of retained originals (byte-identity proven by row 5). Zero-selection checks: none. Evidence freshness: the logs are the original retained outputs from the single 2026-08-28 execution; freshness for this correction means byte-identity, proven by SHA-256 against the retained originals.

## 6. Regression and integration

- No runtime behavior was exercised in this correction (no tests rerun), so no regression or integration result could change. The authoritative record remains the attempt-01 report section 6 (published on the attempt-01 branch), summarized: A1 favorites/SRS E2E passed; B2 unit identity passed with no B2 E2E existing (BL-05); audio language forwarding confirmed broken at the wrapper (BL-02); no browser console errors during the two passing E2E tests; speech evidence synthetic-only.
- This correction's own integration surface is git-level only: branch base, staged-whitespace gate, push target, and remote-SHA verification — all recorded with actual results in section 5.
- For each inapplicable item: every runtime area (A1/B2/Verbs/Guided/Phrases/storage/audio/mobile/themes) is inapplicable to a delivery-only correction because no runtime was invoked; listed as not rerun, not as passing.

## 7. Test-quality and fault-probe evidence

| Probe | Risk/contract | Production target + exact patch artifact | Detecting test | Baseline / syntax result | Actual failure | Classification | Integrity proof |
|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — | — |

No mutation/fault probes were performed: **justified N/A**. This correction changed no production code and executed no tests, so there is no changed risk family to probe (TS-MUT-001 exempts documentation-only work). The original execution's justified N/A and test-quality observations (BL-06 VM-loader limitation, missing utterance-language assertion) are unchanged and remain recorded in the attempt-01 report section 7.

## 8. Dead-code and dependency inventory

| Candidate symbol/path | Searches + dynamic caller checks | Classification | Disposition | Regression proof |
|---|---|---|---|---|
| — | — | — | — | — |

**Justified N/A for removal inventory**: no code changed in this correction (and none in the original package), so there are no changed symbols or callers to inventory (DC-001 scope). No dependency was installed or modified for this correction; the lockfile is untouched relative to the tested base.

## 9. Findings, limitations, and handoff

| Finding ID | Severity/impact | Reproduction and evidence | Disposition | Owner decision needed |
|---|---|---|---|---|
| COR-01 | Publication defect (attempt 01) — published diff failed `git diff --check` due to the format-patch artifact's inherent trailing whitespace | Attempt 01 flags: `docs/cefr/evidence/BASELINE-001/01/BASELINE-001-01.patch:176,210,212` trailing whitespace, `:214` blank line at EOF (all four inside the patch artifact; authored files were clean) | **Corrected in this attempt** — no patch artifact republished; staged check (section 5 row 8) and final published-diff check (row 10) both exit 0; retained original logs republished byte-identical so no evidence was weakened | None — correction delivered for review |
| BL-01..BL-08 | Unchanged from the original execution | See attempt-01 report section 9 (published on the attempt-01 branch at `b05256570e667daf67e80cdcf0f455b2a3e50146`); all file:line references remain valid because the tested revision is identical | Unchanged — open/deferred/verified exactly as recorded | Unchanged — owner triage items (BL-03 scheduler decision; AUDIO-003 scope for BL-02; B2 E2E scheduling for BL-05) |

- Remaining product risks, environment restrictions and untested requirements: unchanged from the attempt-01 report section 9 (full E2E suite not run — 100 cases inventoried only; Mobile Chrome not run; synthetic speech only; `--with-deps` root limitation; offline/synthetic mode). **Missing original raw logs (declared, not reconstructed):** the `git diff --check`, `npm ci`, version-capture, port-9012 pre-check, launch-probe, setup-failure (`--with-deps` exit 1), gap-audit, and CDN-probe outputs exist only as ledger rows in the attempt-01 report section 5; the full declaration is repeated in `docs/cefr/evidence/BASELINE-001/02/INDEX.md`.
- Final diff/status and no unintended ID/content/storage/dependency changes: `git diff --name-only d2f4c79909c4c89e5efbdbeb5d93ebac2b206986 HEAD` lists exactly `docs/cefr/reports/BASELINE-001-02.md` and the four files under `docs/cefr/evidence/BASELINE-001/02/`; `git diff --check` against the base exits 0; no source, test, contract, content, dependency, lockfile, or workflow file was touched; no IDs, stored progress, or content changed.
- Branch/commit/patch retrieval: correction branch `codex/glm-baseline-001-02` based directly on `d2f4c79909c4c89e5efbdbeb5d93ebac2b206986`; single publication commit (tip) whose full SHA is returned in the delivery response; no patch artifact is published in this attempt by design. Attempt 01 remains published and untouched at `b05256570e667daf67e80cdcf0f455b2a3e50146` on `codex/glm-baseline-001-01`. Task-local originals: `/home/z/my-project/baseline-001-artifacts/` (unchanged).
- Next proposed WP (do not start without assignment): unchanged from the attempt-01 report — owner accepts LEVEL-DATA-001..003 (BL-08 support), then assigns SHARED-CARD-001; owner triage on BL-03 before Guided-card work; AUDIO-003 to fix and prove the `app.js` language-forwarding gap (BL-02); mandatory B2 E2E cases in SHARED-CARD-003/AUDIO-003 (BL-05).

## 10. Owner/reviewer disposition — not executor approval

- Reviewer and reviewed exact revision: pending — this correction publication is the branch tip of `codex/glm-baseline-001-02` (SHA in delivery response); evidence provenance revision `d2f4c79909c4c89e5efbdbeb5d93ebac2b206986`.
- Verdict: pending / CHANGES_REQUESTED / ACCEPTED
- Criteria/findings accepted or declined; explicit waivers and reason: *(left for reviewer)*
