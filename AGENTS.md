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
