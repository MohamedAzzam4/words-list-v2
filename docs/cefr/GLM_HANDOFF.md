# GLM External Sandbox — CEFR Development Handoff

Repository: [MohamedAzzam4/words-list-v2](https://github.com/MohamedAzzam4/words-list-v2).
Start branch: **`codex/cefr-glm-handoff`**. No specific provider API or local-PC access is required. The owner selects GLM 5.3 in their service; this repository does not select or verify the model.

## What to read

Follow the complete reading order in `AGENTS.md`. The roadmap is `Refactoring documentation/plans/CEFR_LEVEL_FLASHCARD_STANDARD_AND_REVIEW_CENTER_ROADMAP.md`; all 29 detailed packages are in `docs/cefr/WORK_PACKAGES.md`. Current gaps are in `docs/cefr/BASELINE.md` and review criteria in `docs/cefr/ACCEPTANCE_MATRIX.md`.

Do not read an old task JSON as authority. Do not install/launch the paused hook system. These instructions work without OpenCode, Antigravity, a sidecar, or the owner's machine.

Delivery now uses GitHub task branches, not sandbox attachments. Read `docs/cefr/GITHUB_DELIVERY.md`. The owner authorizes pushing the assigned deliverable only to its own task branch; no shared-branch push, merge or deployment is authorized. If the baseline session already finished under the older instructions, use the delivery-only follow-up in that document instead of restarting it.

## Sandbox prerequisites and setup

Use an isolated fresh checkout and synthetic local browser state. Record OS, shell, Node, npm, Python and Playwright versions. Node 24 is the preparation runtime; use the lockfile, not an arbitrary new dependency version. A different runtime must pass the same tests and be reported.

Typical Linux setup (if the provider has not already cloned the assigned branch):

```bash
git clone --branch codex/cefr-glm-handoff https://github.com/MohamedAzzam4/words-list-v2.git
cd words-list-v2
git rev-parse HEAD
git status --short
node --version
npm --version
python --version
npm ci --ignore-scripts --no-audit --no-fund
npx playwright --version
npx playwright install --with-deps chromium
```

Installing browser system dependencies may require sandbox-provider permission. Request it or report the exact limitation; do not disable browser tests and claim success. No global dependency upgrades, production credentials, production login or deployment is needed. Use the provider's secure Git credentials for the authorized task-branch push; never print or commit them. `--ignore-scripts` is sufficient for the current dependency set; reassess only under an approved dependency change.

`playwright.config.js` starts `python -m http.server 9012`. Ensure a Python 3 executable named `python` is available to child processes. If only `python3` exists, use the provider's environment setup or request a narrow config adjustment; do not silently modify tests to hide missing tooling. Ensure port 9012 serves THIS checkout: `reuseExistingServer` can otherwise connect to unrelated/stale code. Stop only servers you own.

The app imports browser resources from external CDNs. Report network restrictions that prevent startup; do not bypass them by inventing a successful browser result. Run in offline/synthetic user mode; do not authenticate or test production writes.

## Portable command reference

On Windows use `npm.cmd` / `npx.cmd` if PowerShell selects a broken/restricted `.ps1` shim. These suffixes must not be copied into Linux commands.

Syntax checks (Bash):

```bash
node --check js/core/level-data-validator.mjs
node --input-type=module --check < js/core/flashcards.js
node --input-type=module --check < js/levels/a1.config.js
node --input-type=module --check < js/levels/b2.config.js
```

PowerShell equivalent for a browser ES module:

```powershell
Get-Content -Raw js/core/flashcards.js | node --input-type=module --check
```

Repeat with the actual changed browser module. These checks parse without running the app; they do not verify imports or runtime behavior. Never delete a valid `export` to satisfy CommonJS parsing. The paused `.agent-control` checker is not needed.

Focused and final checks (select according to the assigned WP):

```bash
node --test tests/unit/level-data.test.mjs tests/unit/flashcards.test.mjs
npx playwright test tests/e2e/favorites-filters.spec.js tests/e2e/srs.spec.js --project=chromium --reporter=line
npx playwright test --list
npm run test:units
npm run test:verbs
npm test
git diff --check
git status --short
```

For a newly added WP title marker, first list selection, then execute it. Example AFTER adding tests whose titles contain `CEFR-CARD`:

```bash
npx playwright test tests/e2e/cefr-cards.spec.js --project=chromium --grep "CEFR-CARD" --list
npx playwright test tests/e2e/cefr-cards.spec.js --project=chromium --grep "CEFR-CARD" --reporter=line
```

That file/tag is a planned deliverable, not present in the baseline. Use the actual existing test file/title until it is added. A zero-match result is not acceptance. Prefer a single literal tag to avoid shell/regex confusion. No paused exact-command allowlist prevents focused tests.

The two configured projects are `chromium` and `Mobile Chrome` (emulation). Run the required relevant files on both for UI acceptance. Do not run all commands above repeatedly; follow the syntax → focused → affected → final-regression ladder in `contracts/TESTING_AND_SUCCESS.md`.

Command documentation checked through Context7 on 2026-08-29: [Node input-type and syntax check](https://nodejs.org/docs/latest-v24.x/api/cli.html), [Playwright test CLI](https://playwright.dev/docs/test-cli), [Playwright browser dependencies](https://playwright.dev/docs/browsers). Local command checks also verified the syntax-check examples against the delivered code.

## First ready-to-send prompt

Send this in a fresh external GLM sandbox task with this repository and branch selected:

```text
Work in MohamedAzzam4/words-list-v2 on the codex/cefr-glm-handoff branch.
Your first assigned package is BASELINE-001 only. This is a short reproducibility
and gap audit before application implementation, not permission to rewrite code.

Read fully:
AGENTS.md
contracts/README.md
contracts/PORTABLE_AGENT_EXECUTION.md
contracts/CHANGE_MANAGEMENT.md
contracts/CODE_FINGERPRINT.md
contracts/TESTING_AND_SUCCESS.md
contracts/DEAD_CODE_AND_REFACTORING.md
contracts/DELIVERY_REPORTING.md
contracts/LEVEL_FLASHCARD_STANDARD.md
contracts/GUIDED_CHALLENGE.md
docs/cefr/BASELINE.md
docs/cefr/WORK_PACKAGES.md
docs/cefr/ACCEPTANCE_MATRIX.md
docs/cefr/GLM_HANDOFF.md
docs/cefr/GITHUB_DELIVERY.md
Refactoring documentation/plans/CEFR_LEVEL_FLASHCARD_STANDARD_AND_REVIEW_CENTER_ROADMAP.md

Record the actual HEAD and clean working-tree state. Confirm that commit
4c367f3ab73c102845cdd441a6b793676645771d is an ancestor of this checkout.
Use the locked dependencies and configure only your disposable sandbox environment.
No source, test, contract, dependency manifest, content or workflow changes are
authorized in this package. Do not activate .agent-control or any hooks/sidecars.

Run the full tracked unit suite once. Run the existing favorites-filters and SRS
E2E files on Chromium. List the available full browser tests without running an
unnecessary broad suite. Inspect and confirm/refute each gap in BASELINE.md with
source/test evidence, especially real speech-language forwarding, example rendering,
and the difference between published Verbs code and the newer GC contract.

Write only docs/cefr/reports/BASELINE-001-01.md using the tracked report template,
plus sanitized retained logs and INDEX.md under docs/cefr/evidence/BASELINE-001/01/.
Include all attempted commands, exits/counts,
failures, environment limits, criteria results, and proposed next action.
Do not hide failures, weaken tests, fix unrelated code, or claim owner acceptance.
If a browser cannot run, report BLOCKED or INCOMPLETE with the exact reason.

Commit and push this delivery only to codex/glm-baseline-001-01 in
MohamedAzzam4/words-list-v2. Never force-push or push to the shared handoff branch.
Verify the remote SHA and return full commit-pinned report/evidence URLs.
Do not merge, deploy or start another package. The owner/Codex reviewer will accept the baseline, triage
known gaps, and assign the next implementation package.
```

## Subsequent implementation cycle

After baseline review, the owner can accept the already-implemented data work (or assign its concrete corrections), then assign `SHARED-CARD-001` and later extraction/adoption. Use `docs/cefr/templates/EXECUTOR_PROMPT.md`, fill all fields, and include the accepted base commit. Keep each delivery small enough to review; do not give the entire roadmap to a fast model in one instruction.

Every delivery needs its report and reproducible tests on its own GitHub branch. The owner need only identify the branch (or say the assigned branch is ready); Codex can fetch the delivered commit and read the report/logs directly. The reviewer should inspect high-risk code and tests even if the report is clean. This is deliberate product assurance, not a hidden automatic loop or background monitoring service.

## Deferred decisions

B1 content comes from the owner when ready. A2 generation/import/source remains undecided. Those are the last packages and need separate authorization. No model-generated learning content is published without human review.
