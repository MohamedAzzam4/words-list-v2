# Assigned Work Package Prompt Template

The owner fills all bracketed fields before sending. This is a template, not a ready assignment.

```text
Work only on [WP-ID] in MohamedAzzam4/words-list-v2.
Base branch/commit: [branch and exact SHA]. Create/use [task branch].
Goal: [one concrete outcome]. Dependency acceptance: [report/revision references].

Read AGENTS.md, contracts/README.md, contracts/PORTABLE_AGENT_EXECUTION.md,
contracts/CHANGE_MANAGEMENT.md, contracts/CODE_FINGERPRINT.md,
contracts/TESTING_AND_SUCCESS.md, contracts/DEAD_CODE_AND_REFACTORING.md,
contracts/DELIVERY_REPORTING.md, contracts/LEVEL_FLASHCARD_STANDARD.md,
docs/cefr/BASELINE.md, docs/cefr/WORK_PACKAGES.md,
docs/cefr/ACCEPTANCE_MATRIX.md, and
Refactoring documentation/plans/CEFR_LEVEL_FLASHCARD_STANDARD_AND_REVIEW_CENTER_ROADMAP.md.
Also read [specific additional product contract and source/test paths].

Approved before/after behavior: [description].
Allowed write paths: [exact files and narrowly approved new-file families].
Forbidden scope: [explicit exclusions, including enforcement/content/IDs/dependencies].
Success criteria: [every criterion and AC/contract IDs, not a vague "works"].
Targeted tests: [existing exact files/names plus required new cases].
Final regression set: [commands/projects appropriate to risk].
Storage/migration risks and required compatibility proof: [details or justified N/A].

Before editing, record scope, baseline, test map and risk in
docs/cefr/reports/[WP-ID]-[attempt].md using the tracked report template.
Use correct-mode syntax checks, focused tests, affected integration, then final
regression after the last material edit. Do not use repeated full suites as a
debugger. Wait for a running test; do not launch duplicates.
Inspect actual caller integration, test assertions, and dead code under TS/DC.
Log all test attempts, failures, skipped coverage, fault probes, limits and risks.
Do not reactivate .agent-control, hooks, sidecars, or local-only workflows.
Do not weaken tests, fabricate evidence, self-approve, merge, or deploy.
If required context/authority/environment is missing, report it explicitly.

Delivery: [commit/patch policy, permitted task-branch push if any].
Final response: WP ID and status, tested revision, report path, commands/results,
remaining findings and next owner action. Stop after this assigned package.
```
