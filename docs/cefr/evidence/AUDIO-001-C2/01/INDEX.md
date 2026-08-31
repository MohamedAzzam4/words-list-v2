# AUDIO-001-C2 / Attempt 01 — Evidence Index

All work for this package was executed in the external sandbox (`/home/z/my-project/words-list-v2`, Debian, Node v24.19.0, npm 11.17.0, git 2.47.3). This is a **delivery-hygiene correction only**: exactly one redundant trailing blank line was removed from each of six AUDIO-001-C1 evidence logs so that `git diff --check 9c925ac…HEAD` exits 0. **No application tests were rerun for this correction** — the AUDIO-001-C1 production code and tests are approved and were not modified, rerun, or touched in any way; both files are byte-identical to the correction base `d5e129f177ba2124fbeb80e96cd0455a0a026802` (fingerprints below). No source, test, contract, dependency, or content file changed anywhere in this package.

The correction was applied by the guarded script `/home/z/my-project/scripts/audio001c2-fix-eof.py` (outside the repository): each file had to end with exactly `\n\n` (content-final newline + one extra blank line) and was rewritten to end with exactly `\n`; any other ending would abort the whole run before writing. No substantive log byte was altered: `git diff --ignore-blank-lines d5e129f…9dc3ee6… -- <the six .log files>` is empty, and `git diff --numstat` shows `0 insertions / 1 deletion` per file (the blank EOF line).

## sha256 ledger — the six corrected AUDIO-001-C1 evidence logs

Full before/after fingerprints (before = the delivered AUDIO-001-C1 revision `d5e129f…`; after = the AUDIO-001-C2 correction commit `9dc3ee6…`). The four truncated cells in `docs/cefr/evidence/AUDIO-001-C1/01/INDEX.md` were updated to the "after" values (04/05/06/07 rows); files 01 and 08 never had hash cells in that INDEX and are fully recorded here.

| File | Bytes before → after | sha256 before (at `d5e129f…`) | sha256 after (at `9dc3ee6…`) | C1 INDEX cell updated |
|---|---|---|---|---|
| `01-red-tests-against-uncorrected-base.log` | 47264 → 47263 | `775faf3969b559835611b36eaeaa6155abb14901c995e1bc7282a83b2ca810d2` | `5e7618f3f5488a5c94d4794d4364dddf009ee1b90b6e737e60b52c20f1100a2d` | none existed (RED table has no hash column) |
| `04-green-focused.log` | 4629 → 4628 | `258a4d3d1365b9f5dddb9d47b45c6b739683da4de8b62ea5f3da5117d06130f8` | `83f9bf7038d0dde84d53022bf51e31894c8c40e818521c254609d191688b40d4` | `258a4d3d…` → `83f9bf70…` |
| `05-affected-level-data.log` | 1400 → 1399 | `c3d9bc9cc4745c920799c18d9b917eeac2a5d7ff1613283fdd05382e76fa1d82` | `0245aa82129b460fffc7c9eb802e25bd2f890dbc8256c6fc877aa8d4c5434d3f` | `c3d9bc9c…` → `0245aa82…` |
| `06-full-units.log` | 11949 → 11948 | `bfc372e7a85a85c14793f072a48fe1fc9164acdbbe9a39e3baaa563af51d5fb3` | `e238778c42cf916cd5f7429856d1fc08ebdbf06850b944dff089eeafdf30fca6` | `bfc372e7…` → `e238778c…` |
| `07-diff-check.log` | 18 → 17 | `25e3cfe533cb8698b74db9ee5ff44f1669baddd35cf3736a3633f3d9e349371b` | `d061c588942607905424ebcd8be920a0f87a5409c3518b7304d16cbb3816ec7a` | `25e3cfe5…` → `d061c588…` |
| `08-fault-probes.log` | 4345 → 4344 | `f1865f7efaeb483142e76ea967c85afcdb27d8a8cbc955ad174e4ae930eaf237` | `966a869485281631c185cd01e00771f2486a998d32affe97ca7a0e9d1b53e1c6` | none existed (probe table has no hash column) |

Integrity anchors, unchanged by this correction (verified before any edit and re-identical at every commit): `js/core/speech-plan.mjs` sha256 `1c2f26ab5f4187a293b15b43bee8d18acf68907da84d4cc6b722a3a42efcd850`; `tests/unit/speech-plan.test.mjs` sha256 `ff35dcf8daf28467a0e51846b28a1d4270077aec45d6c1b24205e846d956ec9c`.

## Evidence files in this directory

| File | Command / content | Exit | Outcome |
|---|---|---|---|
| `01-diff-check.log` | captured runs: [1] `git diff --check 9c925ac…d5e129f…` (defect reproduction), [2] the three mandated checks at the correction commit `9dc3ee6…` (`git diff --check 9c925ac…HEAD`, `git diff --check d5e129f…HEAD`, `git status --short`), [3] whitespace-only proofs (`--ignore-blank-lines` over the six logs = empty; `--numstat` = `0/1` per log, `5/4` for INDEX.md), [4] the disclosed self-reference constraint for the final docs commit | 2 / 0 / 0 / 0 | reproduction shows exactly the six reported `new blank line at EOF` findings; all mandated checks clean at the correction commit; final-HEAD rerun reported in the handoff message |

## Hygiene and scope

- `git diff --check 9c925aca406f1b7465959872f5545f7a30e177eb..HEAD` and `git diff --check d5e129f177ba2124fbeb80e96cd0455a0a026802..HEAD` both exit 0 at the correction commit and were re-run at the final HEAD (exits reported in the handoff message and the worklog, per the disclosed self-reference constraint in `01-diff-check.log` [4]); `git status --short` empty at both commits.
- Complete change set vs `d5e129f…`: 7 modified files (the six logs above + `docs/cefr/evidence/AUDIO-001-C1/01/INDEX.md` — four recomputed hash cells + one provenance note) plus 3 new files (`docs/cefr/reports/AUDIO-001-C2-01.md`, this INDEX, `01-diff-check.log`). Nothing under `js/`, `css/`, `tests/`, `contracts/`, `content/`, `scripts/`, `docs/` (other than `docs/cefr/`), `*.html`, `package.json`, `package-lock.json`, `playwright.config.js`, `AGENTS.md`, or any other path changed.
- No application tests were rerun (evidence-whitespace correction only; nothing executable changed). No browser, Playwright, DOM, network, storage, or timer was used.
- Both new text files were scanned for credential patterns before publication: zero hits; both end with exactly one final newline.
