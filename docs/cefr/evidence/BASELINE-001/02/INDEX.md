# BASELINE-001 — Attempt 02 — Evidence Index (delivery-only correction)

This index links every published evidence file under `docs/cefr/evidence/BASELINE-001/02/` to its command, actual result, tested commit, and SHA-256 checksum, per contract DR-006 (repository-relative artifact links; no secrets or real user data).

## Correction statement

- **This is a delivery-only correction of the BASELINE-001 publication. No application tests were rerun, re-executed, or repeated for this attempt.** Every log below is the original retained evidence produced by the single BASELINE-001 execution run at tested commit `d2f4c79909c4c89e5efbdbeb5d93ebac2b206986` (run window 2026-08-28T23:05Z–23:28Z, all UTC), republished unchanged (byte-identical, SHA-256 verified against the retained originals).
- Attempt 01 delivery: branch `codex/glm-baseline-001-01`, commit `b05256570e667daf67e80cdcf0f455b2a3e50146`. Verdict on attempt 01: **CHANGES_REQUESTED** — the optional `git format-patch` artifact (`BASELINE-001-01.patch`) contained format-inherent trailing whitespace (`-- ` signature lines, trailing blank line at EOF), so the attempt-01 published diff did not pass `git diff --check`.
- Correction applied: attempt 02 publishes **only the three retained original command logs** plus this index and the correction report `docs/cefr/reports/BASELINE-001-02.md`. **No patch artifact or other generated patch file is included in this attempt.** Attempt 01 (branch, commits, files) is left untouched and unpublished-to-nothing — it is not modified, force-pushed, or deleted.
- Attempt 01's task-local originals remain retained outside the repository (executor sandbox, `../baseline-001-artifacts/`); the attempt-01 patch artifact itself remains retrievable from the untouched attempt-01 branch for reviewers who want it, but it is intentionally not republished here.

## Publication identity

- Tested code commit for every logged check: `d2f4c79909c4c89e5efbdbeb5d93ebac2b206986` (branch `codex/cefr-glm-handoff`; clean working tree at execution time; tested tree `70d42d36c6b83fb282fd948e909379e8e0b883ef`). No application, test, contract, content, dependency, lockfile, or workflow file differs from that commit on this branch.
- Original execution report commits (attempt 01 branch): `d152f1f461a266f5df3dddf22724ff940c9aff07` (initial report), `0035d1b30d58a3d404827dd0520c4f415fa82943` (report commit-reference update, per DR-007).
- This correction branch: `codex/glm-baseline-001-02`, based directly on the tested revision `d2f4c79909c4c89e5efbdbeb5d93ebac2b206986`. The publication commit is the branch tip containing this index; its SHA is returned in the delivery response.
- Full command ledger of the ORIGINAL execution (all setup, test, and inspection commands with exits/counts): report `docs/cefr/reports/BASELINE-001-02.md`, section 5, carrying over `docs/cefr/reports/BASELINE-001-01.md` section 5 (published on the attempt-01 branch).

## Sanitization statement

Every file below was scanned for credentials, tokens, API keys, passwords, secrets, authorization headers, private/user data, and absolute home-directory paths before publication. No credentials or private data were present in any retained artifact; the published files are byte-identical copies of the retained originals (verified by SHA-256 comparison; no redaction was necessary). The strings `german-a1-app` and `firebase` in `e2e-focused.log` are the application's synthetic/offline-mode test identifiers emitted by the app's own boot console output, not credentials. No browser profiles, `node_modules`, Playwright browser caches, screenshots, traces, videos, report archives, or patch artifacts are included.

## Published command logs (originals, not rerun)

| File | Command (exact, original execution) | Actual result (original execution) | Tested commit | SHA-256 (published file) |
|---|---|---|---|---|
| `test-units.log` | `npm run test:units` | PASS — exit 0; 59 passed / 0 failed / 0 skipped (Node summary: tests 59, pass 59, fail 0, cancelled 0, skipped 0; duration 377 ms) | `d2f4c79909c4c89e5efbdbeb5d93ebac2b206986` | `838b18cfacaf0cbb37532db30121a3611cbee7909f5821c181b0c3401798ae84` |
| `e2e-focused.log` | `npx playwright test tests/e2e/favorites-filters.spec.js tests/e2e/srs.spec.js --project=chromium --reporter=line` | PASS — exit 0; 2 passed / 0 failed / 0 skipped (3.8 s). Includes webServer request log proving the tested checkout was served (e.g. `GET /js/levels/a1.config.js`), plus browser console boot lines | `d2f4c79909c4c89e5efbdbeb5d93ebac2b206986` | `23ef78b481413c74cf8654f5e17c2d6fd12e2d700865bdee6536c836fc859e05` |
| `playwright-list.log` | `npx playwright test --list` | PASS — exit 0; inventory only: 100 test/project cases in 8 files (`chromium` + `Mobile Chrome` projects). These tests were NOT executed in BASELINE-001 | `d2f4c79909c4c89e5efbdbeb5d93ebac2b206986` | `927d869b15d88e64752386b20309239f57d50c9844d4e75fb8afaf88cbe31fe7` |

Intentionally excluded (correction): `BASELINE-001-01.patch` and any other generated patch artifact. The attempt-01 patch's trailing-whitespace lines (`-- ` signature, blank line at EOF) are inherent to `git format-patch` output and caused the attempt-01 published diff to fail `git diff --check`; rather than alter the artifact (which would break byte-identity with the retained original) or relax the check, the artifact is removed from the published evidence set.

## Setup failures and unsuccessful attempts (original execution, DR-002)

| Command (original execution) | Actual outcome | Original raw log retained? |
|---|---|---|
| `npx playwright install --with-deps chromium` | FAILED — exit 1 (install aborted): "Switching to root user… sudo: a password is required"; system-dependency step needs root, which the sandbox does not grant. NOT a product test failure. Testing proceeded via `npx playwright install chromium` (exit 0; Chromium 149.0.7827.55) and a successful headless launch probe (`LAUNCH_OK`), so this failure did not block any assigned check | **No — raw output not retained.** Outcome recorded contemporaneously in the original command ledger (report section 5, row 10) and restrictions (section 9, item 4). Declared missing here rather than reconstructed |
| Node launch probe: `require('playwright')` → `chromium.launch()` + `setContent` (inline one-liner) | Succeeded (`LAUNCH_OK`) — retained only as a ledger row; raw one-liner output not captured to a file | **No — raw output not retained** (report section 5, row 12) |

No other unsuccessful attempts, cancellations, retries, or duplicate suite launches occurred during the original BASELINE-001 execution (report section 5, "Background task IDs and terminal outcomes: none"). This correction attempt added no new test executions and therefore adds no new outcomes.

## Commands with no retained raw log (declared missing — not fabricated or reconstructed)

The following commands from the original command ledger (report section 5) were executed once each with the outcomes recorded there, but their raw terminal outputs were not captured to files at execution time. They are listed here for completeness and honesty; no output for them has been manufactured, and the ledger rows in the report remain the authoritative record:

- Rows 1–6 (checkout verification): `git clone https://github.com/MohamedAzzam4/words-list-v2.git`; `git checkout codex/cefr-glm-handoff`; `git rev-parse HEAD` (→ `d2f4c79909c4c89e5efbdbeb5d93ebac2b206986`, matching the expected commit); `git status` / `git status --short` / `git stash list` (clean; no stashes); `git log --oneline -3`; `git merge-base --is-ancestor 4c367f3ab73c102845cdd441a6b793676645771d HEAD` (exit 0)
- Row 7 (environment capture): `node --version` (v24.19.0); `npm --version` (11.17.0); `python --version` (3.12.14); `uname -a`; `/etc/os-release` (Debian 13 trixie)
- Row 8: `npm ci --ignore-scripts --no-audit --no-fund` (exit 0; "added 3 packages"; lockfile unchanged)
- Row 9: `npx playwright --version` (1.61.1)
- Row 11: `npx playwright install chromium` (exit 0)
- Row 13 (server-isolation pre-check): `ss -tlnp` + `curl --max-time 3 http://localhost:9012/` (no listener; curl code 000 → Playwright started its own server from the tested checkout)
- Row 17: `git diff --check` (exit 0; no whitespace/conflict-marker errors — run against the clean working tree of the tested commit during the original execution)
- Row 18: `git status --short` final (clean tree)
- Row 19 (gap audit, read-only): `rg`/Grep over `js/`, `css/`, `level.html`, `index.html`, `tests/`; `sed -n` file views; `wc -l`
- Row 20 (environment probe): `curl -s -o /dev/null -w "%{http_code}" https://cdn.jsdelivr.net/...` (HTTP 200)

Secondary corroboration where raw logs are missing: `e2e-focused.log` embeds the webServer request log and browser console output that independently confirms the port-9012 server served the tested checkout during the focused E2E run.

## Integrity verification

Recompute the checksums of the published files with:

```bash
sha256sum docs/cefr/evidence/BASELINE-001/02/*.log
```

and compare against the SHA-256 column above. Whitespace compliance of this publication: `git diff --cached --check` was run against the fully staged attempt-02 tree before committing and exited 0; `git diff --check d2f4c79909c4c89e5efbdbeb5d93ebac2b206986 <publication-commit>` also exits 0. The only paths that differ from the tested base on this branch are `docs/cefr/reports/BASELINE-001-02.md` and everything under `docs/cefr/evidence/BASELINE-001/02/`.
