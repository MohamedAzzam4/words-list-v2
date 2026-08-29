# SHARED-CARD-001 — Attempt 02 Evidence Index

Correction attempt 02 for SHARED-CARD-001 (owner verdict on attempt 01:
CHANGES_REQUESTED — test-quality findings SC-TQ-01, SC-TQ-02, SC-TQ-03 plus
expected-failure quality). This attempt corrects the characterization suite
and reruns the corrected tests. Production code, contracts, content,
dependencies, lockfiles, scheduler, and persistence are untouched; the tested
production revision is therefore unchanged from attempt 01.

- Tested production revision: `d8fdfa55476a1fad96fd42ac749b60b0e3a711e7`
  (unchanged by this package — test/fixture/report/evidence files only)
- Corrected suite: `tests/e2e/cefr-card-reference.spec.js` (41 tests:
  32 expected-pass + 9 expected-failure finding demonstrations), carried
  forward from attempt 01 (`c65a82bb692ee6e66e2a3abce81a965130b62dbf`) with
  the SC-TQ-01/02/03 corrections applied
- Fixture: `tests/fixtures/cefr/verbs-card-reference.json` — carried forward
  byte-identical from attempt 01 (no change required)
- Attempt-01 evidence that remains applicable (existing-suite baseline,
  broader Verbs/Guided regression, screenshots, VLM inspections) is NOT copied
  here; it remains published at the immutable attempt-01 commit
  `c65a82bb692ee6e66e2a3abce81a965130b62dbf`
  (report: `docs/cefr/reports/SHARED-CARD-001-01.md`;
  evidence: `docs/cefr/evidence/SHARED-CARD-001/01/`)

## Setup failures and correction events (retained, nothing reconstructed)

1. **Browser executable missing (environment, resolved):** the first run of
   the corrected selection failed at browser launch —
   `browserType.launch: Executable doesn't exist at
   /home/z/.cache/ms-playwright/chromium_headless_shell-1228/...` (the sandbox
   browser cache held only older builds 1200/1234). All 13 results of that
   void run were discarded — a browser-launch failure is never accepted as
   product evidence. Resolution: `npx playwright install chromium` → exit 0
   (Chrome Headless Shell 149.0.7827.55, playwright
   chromium-headless-shell v1228). Raw launch-failure log not retained
   (superseded); outcome recorded here per the no-fabrication rule.
2. **Test-authoring defect (diagnosed, fixed, rerun):** the first post-install
   corrected-selection run failed 2 tests (CHAR-14, CHAR-16) on the selector
   `.verb-card-controls [data-action="next-card"]` — the Next button lives in
   the sibling `.verb-card-nav` container (attempt-01's own CHAR-01 already
   used the correct container; the defect was introduced by the new attempt-02
   code). Fixed to `.verb-card-nav [data-action="next-card"]` in all three
   occurrences; the selection then passed 13/13. The failed intermediate log
   was replaced by the clean rerun; the diagnosis and fix are recorded here.
3. **No other failed attempts.** The full-suite runs passed on their first
   execution after the corrections above.

## Evidence files

| File | Command (cwd: repository root) | Result | SHA-256 |
|------|--------------------------------|--------|---------|
| `inventory-list-corrected-selection.log` | `npx playwright test tests/e2e/cefr-card-reference.spec.js --project=chromium --grep "SC-01\|CHAR-09\|CHAR-14\|CHAR-16\|SC-04\|SC-06\|CHAR-26" --list` | 13 tests listed, exit 0 | `7ed90fe46c795ba6ec4a5f82169cbaa292f08bee4e65ffb17ecf1ea0328761a2` |
| `corrected-selection-chromium.log` | `npx playwright test tests/e2e/cefr-card-reference.spec.js --project=chromium --grep "SC-01\|CHAR-09\|CHAR-14\|CHAR-16\|SC-04\|SC-06\|CHAR-26" --reporter=line` | 13 passed (8 real passes + 5 expected failures) in 11.3s, exit 0 | `9cea7e249ce9585e186f847fe9c11a325e8ea4a7150cb5e213bd5de95d790bd5` |
| `corrected-selection-mobile-chrome.log` | same command with `--project="Mobile Chrome"` | 13 passed (8 real passes + 5 expected failures) in 9.9s, exit 0 | `9b9e1330c02667abf2b24600b48af7974bfb9968d7351f454fd053ea35c8f125` |
| `expected-failure-selection-chromium.log` | `PLAYWRIGHT_JSON_OUTPUT_NAME=expected-failure-selection-chromium.json npx playwright test tests/e2e/cefr-card-reference.spec.js --project=chromium --grep "SC-0[1-7] TARGET" --reporter=line,json` | 9 passed (= 9 expected failures, 0 unexpected) in 16.9s, exit 0 | `cc41c5b87846f3e09d139f457514f67c60832a1e44b0df5b8c9352357017c7a4` |
| `expected-failure-selection-chromium.json` | (machine-readable result of the run above) | 9 tests, all status `expected`, 0 unexpected | `48af8a6491434cbc4127d269c794a66d8a079b91ecf7ef161ef96f336a6d6666` |
| `expected-failure-verification.txt` | verification script over the JSON above (script retained sandbox-side) | 9/9 VERIFIED at intended target assertions, exit 0 | `6a64b09b432684af1e084fd1fb9aa10874dbd19292e24a3ad896ba99f46907ea` |
| `full-spec-list-chromium.log` | `npx playwright test tests/e2e/cefr-card-reference.spec.js --project=chromium --list` | 41 tests listed, exit 0 | `8056c57ca7555933001c23b50e602b5170c6e84e2e6ad1dd8e131791984f4f84` |
| `full-spec-chromium.log` | `npx playwright test tests/e2e/cefr-card-reference.spec.js --project=chromium --reporter=line` | 41 passed (32 real passes + 9 expected failures) in 1.0m, exit 0 | `72f1994e9f1a8433cd783559146279cef15030a847737a7be3e4f6cbf1912d09` |
| `full-spec-mobile-chrome.log` | same command with `--project="Mobile Chrome"` | 41 passed (32 real passes + 9 expected failures) in 1.1m, exit 0 | `c6e24d1fefb1013049836e0633d1f7fcaa9d6eb69c8886a94a4fd3219e448c44` |

Notes on reading the results: Playwright counts a `test.fail` case that fails
as expected among "passed"; the per-case truth (status `expected`, failed at
the intended assertion) is machine-readably recorded in
`expected-failure-selection-chromium.json` and summarized in
`expected-failure-verification.txt`. The line logs are verbatim captures
including the local web-server request lines.

## Commands without retained raw logs (declared honestly)

- `npx playwright install chromium` — exit 0 (resolution of setup failure 1;
  output was a download progress bar, not retained).
- `node --input-type=module --check < tests/e2e/cefr-card-reference.spec.js`
  — exit 0 (syntax gate before the first run).
- `git diff --check` / `git diff --cached --check` / `git diff --check
  d8fdfa55476a1fad96fd42ac749b60b0e3a711e7..HEAD` — clean (exit 0, empty
  output); recorded in the report ledger rather than as empty log files.
- The void browser-launch run and the two-test-failed intermediate run
  described under "Setup failures and correction events" — superseded logs
  not retained; outcomes and diagnoses recorded above.

## Integrity

- Every file above is a byte-identical copy of the retained sandbox-side
  original (`/home/z/my-project/shared-card-001-artifacts/attempt02/`);
  SHA-256 values were computed from the published copies.
- Credential/private-data scan: no tokens, keys, or personal data appear in
  any published file (all files are test-runner output for a public web app).
- No screenshots, browser profiles, node_modules, or archives are included;
  attempt-01 visual evidence is referenced by its immutable commit instead of
  being copied.
