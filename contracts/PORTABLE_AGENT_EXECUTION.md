# Portable Agent Execution Contract

Contract: **PX**, version **1.1**, status **ACTIVE**. Applies to every assigned product work package, regardless of model or sandbox provider.

## Authority and scope

- **PX-001:** The owner assigns a WP ID from `docs/cefr/WORK_PACKAGES.md`. A roadmap is not blanket permission to implement every package. Report the base commit, working branch, approved scope, dependencies, and exact write paths before editing.
- **PX-002:** Read the required documents fully; list paths and relevant contract IDs in the report. Reading is not proof of understanding: demonstrate compliance with the acceptance-to-test map. Missing or contradictory requirements are reported before the affected work proceeds.
- **PX-003:** `AGENTS.md` and these active contracts govern portable tasks. Paused AE/OR automation, local RAM/ROM, old task JSON, and transcripts are not authority. Do not reactivate or redesign enforcement as part of product work.
- **PX-004:** No new framework, dependency upgrade, content generation, schema migration, public behavior redesign beyond the WP, CI bypass, secrets access, production-data write, or deployment without explicit owner authorization.
- **PX-005:** Preserve unrelated work. Use a clean clone and a task branch. The owner authorizes normal GitHub delivery for assigned portable WPs: commit and push only the package's changes/report/evidence on its assigned `codex/glm-<wp-id>-<attempt>` branch, unless the assignment explicitly restricts pushing. Never force-push, reset another person's branch, or clean unknown files. Shared baseline/integration branches are not push targets; owner acceptance and merge are separate actions.
- **PX-006:** Scope includes implementation, tests, necessary documentation, and the package report. Existing production paths are listed per WP. Proposed new modules/tests must be named in the pre-edit plan and remain inside the listed path families. A path outside those families needs approval, not an opportunistic cleanup.

## Working cycle

1. Inspect baseline and required contracts; record environment and scope.
2. Translate every acceptance clause into a positive case plus relevant negative/boundary/regression cases.
3. Run the smallest baseline and reproduce the target defect or missing behavior.
4. Implement incrementally; test syntax, focused cases, then affected integration.
5. Inspect tests for false positives and changed dependencies for dead code.
6. When stable, run the applicable final regression set on the final material revision.
7. Inspect the diff, complete the tracked delivery report and evidence index, push the assigned task branch, verify its remote commit, return commit-pinned links, and stop.
8. The owner/frontier reviewer accepts or returns specific findings. Only assigned corrections start another cycle.

- **PX-007:** After two attempts on the same deterministic failure without a new supported diagnosis, stop speculative edits, summarize evidence, and request direction. Test failure alone does not authorize broader rewrites.
- **PX-008:** Track background test run IDs. A running process is neither pass nor fail. Wait for that process; do not launch duplicates or edit the files it is testing. Record cancellation and stale evidence honestly.
- **PX-009:** Prefer Linux-compatible paths and portable commands. Inspect the sandbox rather than assuming it matches the owner's Windows PC. Use the locked dependencies; tools used here do not require GLM-specific APIs.
- **PX-010:** No token, account, private endpoint, or real user record belongs in a report. Use synthetic progress/accounts and isolated browser storage. Do not call production Firebase write endpoints to test features.

## Meaning of compliance

These documents define review and acceptance obligations, not a technical sandbox. They cannot force a model to read, be truthful, or produce correct code. Test output, independently reproducible behavior, diff review, and owner-controlled merge are the checks. No automatic reviewer spawning, protected evidence ledger, or CI gate is claimed unless separately implemented and verified.

See `DELIVERY_REPORTING.md` for status meanings and reviewer rejection rules. A model must not label work accepted because its own report or tests say so.
