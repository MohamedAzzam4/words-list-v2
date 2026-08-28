# Project Agent Instructions

## Current owner decision

The experimental enforcement and universal-review workflow is paused.

- Do not run `.agent-control/cli.mjs` or depend on its task state unless the owner explicitly reactivates that workflow.
- Do not activate OpenCode or Antigravity enforcement adapters.
- Codex is allowed to plan, review, and implement application code when the owner explicitly asks it to begin.
- Other AI executors may implement only when the owner explicitly provides or approves their task.
- Until the owner gives that instruction, do not implement the CEFR flashcard roadmap.

## Repository safety

- Inspect `git status --short` before editing.
- Preserve all pre-existing changes and untracked files.
- Never reset, discard, reformat, or clean unrelated work.
- Keep changes surgical and within the explicit task scope.
- Do not add a framework or dependency without owner approval.
- Preserve stable word and verb IDs.
- Never silently reset, delete, downgrade, or reassign stored progress.
- Preserve Phrases and Conversation behavior unless the task explicitly changes it.
- Do not change German learning content unless the task explicitly concerns content.

## Verification

- Use targeted tests while iterating.
- Run expensive full browser suites only after the implementation stabilizes or when broad regression evidence is required.
- Never claim a test ran if it did not run.
- Report exact commands, pass/fail results, changed files, and remaining risks.

## Active roadmap

The product roadmap is `Refactoring documentation/plans/CEFR_LEVEL_FLASHCARD_STANDARD_AND_REVIEW_CENTER_ROADMAP.md`.

## Portable external execution (owner-approved, 2026-08-29)

This repository can be developed by an external sandbox agent, including GLM. A work package becomes executable only when the owner assigns it; this document is not permission to execute the entire roadmap.

Read these files completely before an assigned package, in this order:

1. `AGENTS.md`
2. `contracts/README.md`
3. `contracts/PORTABLE_AGENT_EXECUTION.md`
4. `contracts/CHANGE_MANAGEMENT.md`
5. `contracts/CODE_FINGERPRINT.md`
6. `contracts/TESTING_AND_SUCCESS.md`
7. `contracts/DEAD_CODE_AND_REFACTORING.md`
8. `contracts/DELIVERY_REPORTING.md`
9. `contracts/LEVEL_FLASHCARD_STANDARD.md`
10. `docs/cefr/BASELINE.md`, `docs/cefr/WORK_PACKAGES.md`, and `docs/cefr/ACCEPTANCE_MATRIX.md`
11. The roadmap above, the assigned package's extra references, and its actual implementation/tests.

- Use `docs/cefr/GLM_HANDOFF.md` for sandbox setup and the first assignment.
- Preserve all product-safety requirements; the paused automation is NOT a requirement to run hooks, a sidecar, or `.agent-control` commands.
- `AI_RAM.md`, `AI_ROM.md`, local runtime state, and old transcripts are not prerequisites in portable mode. Report to `docs/cefr/reports/<WP-ID>-<attempt>.md` using the tracked template instead.
- New or modified behavior requires positive, negative, boundary, and regression coverage as applicable. Inspect tests for false passes and inspect the touched dependency boundary for dead code.
- Include failed attempts, exact commands and exit codes, evidence paths, untested cases, and remaining risks. Never replace missing evidence with a confident summary.
- Do not change rules, acceptance thresholds, snapshots, or dependencies merely to make your own task pass. Propose a contract change for owner review.
- Submit one assigned package for review and stop. The executor cannot grant owner acceptance, merge, deploy, or start the next package without authorization.
- GitHub is the default delivery channel: push the assigned package's commits, report, and sanitized text evidence to its own task branch under `codex/glm-<wp-id>-<attempt>`. Follow `docs/cefr/GITHUB_DELIVERY.md`; never push to shared baseline/integration branches or force-push. A task-specific owner restriction overrides this default.
- Return the remote branch, full delivered commit SHA, and commit-pinned report/evidence links. Sandbox-local paths and unpushed commit hashes are not a completed handoff.
