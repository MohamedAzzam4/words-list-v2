# SHARED-CARD-001 — Attempt 01 — Evidence Index

## Publication identity

- Tested code commit (application revision under test): `d8fdfa55476a1fad96fd42ac749b60b0e3a711e7` (branch `codex/cefr-glm-handoff` at execution time; task branch `codex/glm-shared-card-001-01` created directly from it; clean working tree — only the new test file, new fixture, and report/evidence paths were added; **no production file was modified**).
- Test files introduced by this package (both executed at the tested revision): `tests/e2e/cefr-card-reference.spec.js` (35 tests) and `tests/fixtures/cefr/verbs-card-reference.json` (synthetic 8-verb deck).
- Execution window: 2026-08-29T01:03Z–01:21Z (UTC). All runs used the repository's Playwright webServer (`python -m http.server 9012`, port verified free before the first run; `reuseExistingServer: true` could not attach to a stale server).
- Environment: Debian GNU/Linux 13 (trixie); Node v24.19.0; npm 11.17.0; Playwright 1.61.1 (lockfile); Chromium 149.0.7827.55; Mobile Chrome = Pixel 5 device emulation (not a real device). Same sandbox as BASELINE-001 (`--with-deps` system-package step unavailable without root; plain Chromium install + verified headless launch used instead — unchanged restriction from BASELINE-001).
- Report: `docs/cefr/reports/SHARED-CARD-001-01.md`. Full command ledger and interpretation: report section 5.

## Sanitization statement and redactions

Every published file was scanned for tokens, credential-bearing URLs, API keys (including `AIzaSy…`), bearer/authorization headers, passwords, and private keys before staging: **no credential material was present; no content redaction was required.** No real user data is included: all test runs used a fresh browser context per test with synthetic progress; the two tests that exercise the real published dataset assert public learning content only. Screenshots show the synthetic fixture deck. No browser profiles, `node_modules`, environment dumps, or generated HTML report archives are included. Total evidence size ≈ 1.9 MiB (budget: 10 MiB per `GITHUB_DELIVERY.md`).

Whitespace sanitization (documented per `GITHUB_DELIVERY.md` "sanitized copies of retained text logs"; required so the published diff passes `git diff --cached --check`): raw Playwright line-reporter output contains trailing spaces on some failure call-log lines. The PUBLISHED copies of four logs had trailing spaces stripped — `baseline-existing-chromium.log` (4 lines), `new-spec-chromium.log` (20 lines), `new-spec-chromium-attempt2.log` (2 lines), `regression-verbs-guided-chromium.log` (2 lines); 28 lines total, invisible trailing spaces only, no other character altered. All other published logs are byte-identical to the retained originals. The untouched raw captures remain retained in the executor sandbox outside the repository. The SHA-256 values in the table below identify the published (sanitized) files.

## Command log table (test runs and inventories)

| File | Command (exact) | Actual result | Captured / duration | SHA-256 |
|---|---|---|---|---|
| `inventory-list-chromium.log` | `npx playwright test tests/e2e/cefr-card-reference.spec.js --project=chromium --list` | exit 0 — 35 tests listed (inventory only, not executed; final file state) | 01:21Z, <2 s | `279452bc0bc7dc9ce765636f953523cfa43d73bd0f970d4e58b24ac52b57062f` |
| `inventory-list-mobile-chrome.log` | `npx playwright test tests/e2e/cefr-card-reference.spec.js --project="Mobile Chrome" --list` | exit 0 — 35 tests listed (inventory only) | 01:21Z, <2 s | `5b3832055b02dd0ef2dcaec8275d1b42871f342141f93199f5e05c3ae879b99e` |
| `inventory-list-existing.log` | `npx playwright test tests/e2e/verbs.spec.js tests/e2e/verb-guided-challenge.spec.js --project=chromium --list` | exit 0 — 27 existing tests listed (inventory only) | 01:21Z, <2 s | `d3e48b36e43a2dbf64737fb760d47bdfc600da1a1d318d6fcf3841d2b1510412` |
| `baseline-existing-chromium.log` | `npx playwright test tests/e2e/verbs.spec.js tests/e2e/verb-guided-challenge.spec.js --project=chromium --reporter=line` | exit 1 — **25 passed / 2 failed** (`daily review with due verbs serves recognition then production tracks`; `T3: canonical-ID migration through real loading lifecycle`) — both `page.goto('/verbs.html')` 30 s `load`-event timeouts under serial suite load | 01:01Z, 2.1 m | `762ce9994843d7c09af6a33caffcdd0c7942f3e6b0e87acbac615d9438e70d61` |
| `baseline-failure-diagnostic-rerun.log` | same command with `--grep "daily review with due verbs serves recognition then production tracks\|T3: canonical-ID migration through real loading lifecycle"` | exit 0 — **2 passed (4.0 s) in isolation** → baseline failures classified as environment-flaky `page.goto` timeouts (CDN-sensitive load event), pre-existing at this revision; not caused by this package's additive-only change | 01:03Z, 4 s | `1b5e7f69d11c1d65fe2741bad9b30c0610e88c626d79af37970c748c3401f5bf` |
| `new-spec-chromium.log` | `npx playwright test tests/e2e/cefr-card-reference.spec.js --project=chromium --reporter=line` (attempt 1) | exit 1 — 25 passed / 10 failed. Diagnosed: 3 test-authoring defects (unscoped `.ex-sentence-span` selector matched the hidden glossary table; favorite expectation missed the published canonical-id + infinitive-alias pair; intro-controls-inside-card expectation inverted) + 1 Chrome computed-style nuance (outline-width 'medium'→'3px' under `outline: none`); all corrected transparently in the test file | 01:05Z, 2.2 m | `7a45f1dabd3f868e3f0396ae837076c784f8a9688e85e21bb04785f36e53e684` |
| `new-spec-chromium-attempt2.log` | same command (attempt 2, after evidence-based fixes) | exit 1 — 34 passed / 1 failed (CHAR-21: intro controls ARE inside `.guided-card` — expectation inverted and fixed; contrast assertion added to CHAR-22) | 01:12Z, 1.2 m | `5e43a9e25df3b909e57348cae5a67a27ebcefbfbdf2e82dc97d02a80492033d1` |
| `new-spec-chromium-final.log` | same command (final) | exit 0 — **35 passed** (28 genuinely passing + 7 expectedly failing `test.fail` finding demonstrations; verified per-result: 28×status passed, 7×status failed-as-expected, 0 unexpected) | 01:13Z, 1.1 m | `ab2682ab8bb587e9a2a222e392b12272d7913049e3cbb0642a4ad4b75f0099e9` |
| `new-spec-mobile-chrome.log` | `npx playwright test tests/e2e/cefr-card-reference.spec.js --project="Mobile Chrome" --reporter=line` | exit 0 — **35 passed** (same 28 + 7 expected-failure composition; includes Pixel 5 horizontal-overflow assertions) | 01:16Z, 1.0 m | `aa7c0ea76470b144656575935bd8a6df15999cc9984c18e3078f21bdafacb712` |
| `regression-verbs-guided-chromium.log` | `npx playwright test tests/e2e/verbs.spec.js tests/e2e/verb-guided-challenge.spec.js --project=chromium --reporter=line` (ladder step 6, once) | exit 1 — **26 passed / 1 failed** (`R2: Resume Daily Review after refresh restores the exact production-phase state` — `#view-guided` hidden at an expect after refresh; a DIFFERENT test than the baseline run's failures) | 01:17Z, 1.0 m | `610982211ff310481b9d3c3276abcfd509ee07583233393d25fbb0d196c3a246` |
| `regression-failure-diagnostic-rerun.log` | same command with `--grep "R2: Resume Daily Review after refresh restores the exact production-phase state"` | exit 0 — **1 passed (3.2 s) in isolation** → same environment-flake class as the baseline failures; pre-existing, unrelated to this package | 01:17Z, 3 s | `c32a696ddf577ae87ca7e7b102d2cb8b5b2140230866003ed1013750dd110c1f` |

Additional runs without a retained log (declared, not reconstructed):

- `npx playwright test tests/e2e/cefr-card-reference.spec.js --project=chromium --reporter=json` (01:15Z, ~1.1 m, exit 0) — status-verification run proving the 7 `test.fail` tests have per-result status `failed` (expected) and none `unexpectedly passed`; counts extracted inline (28 passed + 7 expectedly failed = 35 expected / 0 unexpected). Raw JSON output was analyzed in the pipeline and not retained.
- `git diff --check` (final) — exit 0 (report section 5). `git diff --cached --check` — exit 0 before the publication commit.
- Screenshot capture: `node /home/z/my-project/scripts/capture-shared-card-001-screens.js` with `python3 -m http.server 9012` (01:19Z, ~20 s) — exit 0, `CAPTURE_OK`; output = the 8 screenshots below. Capture script kept outside the repository.

## Screenshots (visual evidence, inspected per TS-TEST-008)

Captured at the tested revision with the synthetic fixture deck (no private data). Each was visually inspected by the executor with a vision model; the inspection transcripts are published under `vlm-inspections/` and summarized in report section 6.

| File | State captured | SHA-256 |
|---|---|---|
| `screenshots/desktop-ordinary-front.png` | Ordinary card front, de-to-en default (label "Verb (German)", infinitive "machen", tags, hint/speak/favorite controls, grade + nav buttons below) | `e979ce473a0604eb2cc93a41fddc469e1d33f682b397bb82b88087d3794fa439` |
| `screenshots/desktop-ordinary-back-accordions.png` | Revealed back with origins + conjugation accordions open; all three German examples inline; EN translations behind the chip (SC-02) | `00b1cbc5dd53cc8964b1c94efb40e704271237cb5eabfcdfae5d9c0674921519` |
| `screenshots/desktop-ordinary-entode-front.png` | en-to-de front: English meaning only, no visible German answer | `2af41be507013e706c1301fd3afc65e0716d82350091536bf0ed45a999540e6a` |
| `screenshots/desktop-guided-recall-front.png` | Guided recall front: Acquisition badge, "Verb (German)" + "machen", Reveal Answer button, no answer content | `2ec6616403a29515c76c7965af604d5c001699f4972e62b97c6ca269cfd8ecb0` |
| `screenshots/desktop-guided-recall-revealed.png` | Guided recall after reveal: answer + example, Listen / I knew it / I forgot controls | `bd29bafb95fa56527f0cea2793af9bde62123c530166eacaa86ba9f4c53ef7d0` |
| `screenshots/mobile-ordinary-front.png` | Ordinary front at Pixel 5 width | `5414822af4553c28d83a22762c10b2f6f1599993852558d669dbe87f8ccf3844` |
| `screenshots/mobile-ordinary-back.png` | Revealed back at Pixel 5 width — no horizontal overflow, single-column stacking | `82feef1655bf4693b7f3e59ff6002c05ce6ee6ba147da0ef74ae1768b514b83d` |
| `screenshots/mobile-guided-recall-front.png` | Guided recall front at Pixel 5 width — no overflow, all controls visible | `c264fcce86d179937535f3daf5d0e9a69fa077d114c6b3e20287db0f1fb5b315` |

## Executor visual-inspection transcripts (vlm-inspections/)

| File | Screenshot inspected | SHA-256 |
|---|---|---|
| `vlm-inspections/vlm-back.json` | `desktop-ordinary-back-accordions.png` | `5bdee667bcc7237e5b20ed037a5b103cf944c5a4fdefd9457ee21874c4cb9298` |
| `vlm-inspections/vlm-e1.json` | `desktop-ordinary-entode-front.png` | `22c2b4baf2b44eb8896a757df7435dd673ec26ac3d2c94b847ee35352d29e064` |
| `vlm-inspections/vlm-g1.json` | `desktop-guided-recall-front.png` | `f3ed66d435ea2399cc2076fcfb85e58e4f4ed19a7d8b85e17c09d1d7738046c6` |
| `vlm-inspections/vlm-g2.json` | `desktop-guided-recall-revealed.png` | `0d8778f39ac3cbc268d49d31bcfedc2d8a6b7a12e94c1507dddadf4b64388a52` |
| `vlm-inspections/vlm-m1.json` | `mobile-ordinary-back.png` | `c08da57e798dcc9b940f236751f0a18426ae1bc98b248868429edd7dad002a95` |
| `vlm-inspections/vlm-m2.json` | `mobile-guided-recall-front.png` | `88c5cd82427f6b6dc26e8eba74cf1cb8236e764cce9595063156ccd42664f8d5` |

## Missing evidence (declared honestly — not fabricated or reconstructed)

- The `--list` inventory outputs shown to stdout during test development (three listings, 01:0xZ) were not captured to files at that time; the published inventory logs above were captured at 01:21Z from the final test-file state (same 35 titles; only test bodies changed after the development listings).
- The JSON status-verification run's raw output was not retained (counts recorded in the table above).
- No logs exist for the document-reading, source-inspection, and fixture-authoring steps (read-only work); the inspected files and line references are recorded in the report.

## Integrity verification

Recompute and compare:

```bash
sha256sum docs/cefr/evidence/SHARED-CARD-001/01/*.log docs/cefr/evidence/SHARED-CARD-001/01/screenshots/*.png docs/cefr/evidence/SHARED-CARD-001/01/vlm-inspections/*.json
```

The only paths that differ from the tested base `d8fdfa55476a1fad96fd42ac749b60b0e3a711e7` on this branch are `tests/e2e/cefr-card-reference.spec.js`, `tests/fixtures/cefr/verbs-card-reference.json`, `docs/cefr/reports/SHARED-CARD-001-01.md`, and everything under `docs/cefr/evidence/SHARED-CARD-001/01/`.
