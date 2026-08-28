# BASELINE-001 — Attempt 01 — Evidence Index

This index links every published evidence file under `docs/cefr/evidence/BASELINE-001/01/` to its command, actual result, tested commit, and SHA-256 checksum, per the delivery-only follow-up instruction and contract DR-006 (repository-relative artifact links; no secrets or real user data).

## Publication identity

- Tested code commit for every logged check: `d2f4c79909c4c89e5efbdbeb5d93ebac2b206986` (branch `codex/cefr-glm-handoff`; clean working tree; tested tree `70d42d36c6b83fb282fd948e909379e8e0b883ef`). No application, test, contract, content, dependency, lockfile, or workflow file differs from that commit on this branch.
- Report commits: `d152f1f461a266f5df3dddf22724ff940c9aff07` (initial report), `0035d1b30d58a3d404827dd0520c4f415fa82943` (report commit-reference update, per DR-007).
- Publication branch: `codex/glm-baseline-001-01`. The publication commit is the branch tip containing this index; its SHA is returned in the delivery response.
- Run window: 2026-08-28T23:05Z–23:28Z (UTC); work directory `/home/z/my-project/words-list-v2` (fresh clone of the tested commit).
- Full command ledger, environment versions, and per-command interpretations: see report `docs/cefr/reports/BASELINE-001-01.md`, section 5.

## Sanitization statement

Every file below was scanned for credentials, tokens, API keys, passwords, secrets, authorization headers, private/user data, and absolute home-directory paths before publication. No credentials or private data were present in any retained artifact; the published files are byte-identical copies of the retained originals (verified by SHA-256 comparison; no redaction was necessary). The strings `german-a1-app` and `firebase` in `e2e-focused.log` are the application's synthetic/offline-mode test identifiers emitted by the app's own boot console output, not credentials. No browser profiles, `node_modules`, Playwright browser caches, screenshots, traces, videos, or report archives are included.

## Retained command logs (originals)

| File | Command (exact) | Actual result | Tested commit | SHA-256 (published file) |
|---|---|---|---|---|
| `test-units.log` | `npm run test:units` | PASS — exit 0; 59 passed / 0 failed / 0 skipped (Node summary: tests 59, pass 59, fail 0, cancelled 0, skipped 0; duration 377 ms) | `d2f4c79909c4c89e5efbdbeb5d93ebac2b206986` | `838b18cfacaf0cbb37532db30121a3611cbee7909f5821c181b0c3401798ae84` |
| `e2e-focused.log` | `npx playwright test tests/e2e/favorites-filters.spec.js tests/e2e/srs.spec.js --project=chromium --reporter=line` | PASS — exit 0; 2 passed / 0 failed / 0 skipped (3.8 s). Includes webServer request log proving this checkout was served (e.g. `GET /js/levels/a1.config.js`), plus browser console boot lines | `d2f4c79909c4c89e5efbdbeb5d93ebac2b206986` | `23ef78b481413c74cf8654f5e17c2d6fd12e2d700865bdee6536c836fc859e05` |
| `playwright-list.log` | `npx playwright test --list` | PASS — exit 0; inventory only: 100 test/project cases in 8 files (`chromium` + `Mobile Chrome` projects). These tests were NOT executed in BASELINE-001 | `d2f4c79909c4c89e5efbdbeb5d93ebac2b206986` | `927d869b15d88e64752386b20309239f57d50c9844d4e75fb8afaf88cbe31fe7` |

## Retained patch artifact (not a command log)

| File | Origin | Represents | SHA-256 (published file) |
|---|---|---|---|
| `BASELINE-001-01.patch` | `git format-patch` of the two report-only commits (task-local artifact, retained at execution time) | Report commits `d152f1f` and `0035d1b` as a two-patch series; adds only `docs/cefr/reports/BASELINE-001-01.md` (158 insertions) on top of the tested base | `ffcc683aee174578ff0cbc65d7cd0b7f7742343edc75f51eb7e623b0702a9d8b` |

Note on `git diff --check`: the `.patch` file is a verbatim `git format-patch` artifact and intentionally retains that format's trailing signature lines (`-- `) and trailing blank line, so whitespace checkers flag it. These are properties of the retained evidence itself, not defects introduced by publication; the file must stay byte-identical to the retained original (see SHA-256 above). The original BASELINE-001 `git diff --check` (report section 5, row 17) was run against the clean working tree of the tested commit and passed with exit 0.

## Setup failures and unsuccessful attempts (DR-002)

| Command | Actual outcome | Original raw log retained? |
|---|---|---|
| `npx playwright install --with-deps chromium` | FAILED — exit 1 (install aborted): "Switching to root user… sudo: a password is required"; system-dependency step needs root, which the sandbox does not grant. NOT a product test failure. Testing proceeded via `npx playwright install chromium` (exit 0; Chromium 149.0.7827.55) and a successful headless launch probe (`LAUNCH_OK`), so this failure did not block any assigned check | **No — raw output not retained.** Outcome recorded contemporaneously in the report command ledger (section 5, row 10) and restrictions (section 9, item 4). Declared missing here rather than reconstructed |
| Node launch probe: `require('playwright')` → `chromium.launch()` + `setContent` (inline one-liner) | Succeeded (`LAUNCH_OK`) — retained only as a ledger row; raw one-liner output not captured to a file | **No — raw output not retained** (report section 5, row 12) |

No other unsuccessful attempts, cancellations, retries, or duplicate suite launches occurred during BASELINE-001 (report section 5, "Background task IDs and terminal outcomes: none").

## Commands with no retained raw log (declared missing — not fabricated or reconstructed)

The following commands from the report's command ledger (report section 5) were executed once each with the outcomes recorded there, but their raw terminal outputs were not captured to files at execution time. They are listed here for completeness and honesty; no output for them has been manufactured, and their ledger rows in the report remain the authoritative record:

- Rows 1–6 (checkout verification): `git clone https://github.com/MohamedAzzam4/words-list-v2.git`; `git checkout codex/cefr-glm-handoff`; `git rev-parse HEAD` (→ `d2f4c79909c4c89e5efbdbeb5d93ebac2b206986`, matching the expected commit); `git status` / `git status --short` / `git stash list` (clean; no stashes); `git log --oneline -3`; `git merge-base --is-ancestor 4c367f3ab73c102845cdd441a6b793676645771d HEAD` (exit 0)
- Row 7 (environment capture): `node --version` (v24.19.0); `npm --version` (11.17.0); `python --version` (3.12.14); `uname -a`; `/etc/os-release` (Debian 13 trixie)
- Row 8: `npm ci --ignore-scripts --no-audit --no-fund` (exit 0; "added 3 packages"; lockfile unchanged)
- Row 9: `npx playwright --version` (1.61.1)
- Row 11: `npx playwright install chromium` (exit 0)
- Row 13 (server-isolation pre-check): `ss -tlnp` + `curl --max-time 3 http://localhost:9012/` (no listener; curl code 000 → Playwright started its own server from this checkout)
- Row 17: `git diff --check` (exit 0; no whitespace/conflict-marker errors)
- Row 18: `git status --short` final (clean tree)
- Row 19 (gap audit, read-only): `rg`/Grep over `js/`, `css/`, `level.html`, `index.html`, `tests/`; `sed -n` file views; `wc -l`
- Row 20 (environment probe): `curl -s -o /dev/null -w "%{http_code}" https://cdn.jsdelivr.net/...` (HTTP 200)

Secondary corroboration where raw logs are missing: `e2e-focused.log` embeds the webServer request log and browser console output that independently confirms the port-9012 server served this checkout during the focused E2E run (report criterion "server serves THIS checkout").

## Integrity verification

Recompute the checksums of the published files with:

```bash
sha256sum docs/cefr/evidence/BASELINE-001/01/*.log docs/cefr/evidence/BASELINE-001/01/*.patch
```

and compare against the SHA-256 column above. The report itself is verified by its commit (`d152f1f`, `0035d1b`) on this branch; the only files that differ from the tested base `d2f4c79909c4c89e5efbdbeb5d93ebac2b206986` on this branch are `docs/cefr/reports/BASELINE-001-01.md` and everything under `docs/cefr/evidence/BASELINE-001/01/`.
