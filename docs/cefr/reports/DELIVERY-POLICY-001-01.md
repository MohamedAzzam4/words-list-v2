# DELIVERY-POLICY-001 — GitHub Handoff Update

Date: 2026-08-29. Type: DOCUMENTATION. Status: READY_FOR_REVIEW.

## Assignment and scope

Owner requested branch-based publication so the reviewer can fetch GLM reports and evidence directly, without manual attachments. Base commit: `d2f4c79909c4c89e5efbdbeb5d93ebac2b206986`.

Updated AGENTS, PX/DR contracts, work-package delivery rules, report/prompt templates and the GLM handoff. Added `docs/cefr/GITHUB_DELIVERY.md` with a delivery-only prompt for the already-finished BASELINE-001 session. No application, test, dependency, content, or enforcement changes.

## Acceptance and evidence

- Each assigned WP has an isolated task branch and fixed-commit report/evidence links.
- Retained sanitized text logs are tracked with an INDEX; missing original output is not fabricated.
- Shared-branch writes, force pushes, merges, production data and credential publication are prohibited for executors.
- The current baseline follow-up explicitly permits its own branch push and prohibits rerunning tests or changing the tested code.
- Report self-hash loops are avoided: tested code SHA lives in the report; final delivery SHA is returned after publication.

Checks performed:

- `git ls-remote` confirmed the handoff remote still at the base SHA and no existing `codex/glm-baseline-001-01` branch at inspection; exit 0.
- Required-file/protocol checks returned `missing: []` and `deliveryChecksFailed: []`; exit 0.
- `git diff --check`: exit 0; LF/CRLF warnings only.
- `git diff d2f4c79 --exit-code -- js tests css package.json package-lock.json playwright.config.js '*.html'`: exit 0; runtime/test inputs unchanged.
- The first documentation patch failed context validation before applying any edits; corrected patch applied normally. No source changes resulted.

## Limits and next action

Application tests, mutation probes, UI screenshots and dead-code removal are N/A to this documentation-only change; previous product results are not recharacterized as new runs. Context7 documentation was used to verify GitHub commit-pinned file URLs.

GLM's private sandbox artifacts are not present here. Its existing session must push the authorized delivery branch before independent review can inspect those files. GitHub publication does not itself prove test authenticity or grant product acceptance. Final policy-publication SHA and links are supplied in the owner-facing response after push.
