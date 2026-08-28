# Delivery Reporting and Acceptance Contract

Contract: **DR**, version **1.0**, status **ACTIVE**.

- **DR-001:** Each attempt produces `docs/cefr/reports/<WP-ID>-<attempt>.md` using `docs/cefr/templates/WORK_PACKAGE_REPORT.md`. Fill every section; use an explained `N/A`, never silently omit a required section. Do not overwrite a previous delivered attempt.
- **DR-002:** Report all material changes, every test command attempted (including failures, cancellation, empty selections, and retries), environment/setup failures, changed assertions/snapshots, scope deviations, and unresolved findings. This means engineering evidence, not private chain-of-thought or a transcript dump.
- **DR-003:** Every test record contains command, working directory, runtime/tool versions, start/end or duration, tested Git revision/tree identity, exit code, pass/fail/skip counts, and retained log/artifact path. A background launch ID alone is not evidence.
- **DR-004:** Map each WP criterion and applicable contract ID to a test name/path, actual result, and evidence path. Distinguish `PASS`, `FAIL`, `NOT_RUN`, `BLOCKED`, and justified `N/A`. A skipped test cannot prove the criterion.
- **DR-005:** Report before/after behavior, root cause when fixing a defect, compatibility effects, each changed file's purpose, and dead-code results. Include a per-finding disposition: fixed, not reproduced with evidence, deferred for approval, or still open.
- **DR-006:** Keep raw text logs and necessary screenshots/traces as task artifacts. Use repository-relative report links or accessible artifact URLs; verify the recipient can retrieve them. If artifact hosting is unavailable, include relevant output in a report appendix and clearly identify omitted artifacts. Never publish secrets or real user data.
- **DR-007:** Test code may be committed first, followed by an implementation commit; final tests run against that implementation revision. A subsequent report-only commit does not invalidate code evidence. Any source, test, fixture, dependency, or execution-config change does. Identify both tested code commit and report commit; do not invent a commit hash before creating it.
- **DR-008:** Final chat response gives WP ID, status, branch/commit or patch, report path, test totals, open findings, and next owner action. A chat summary does not replace the report.

## Status and review

| Status | Meaning |
|---|---|
| `IN_PROGRESS` | Scoped work is still happening |
| `BLOCKED` | A named prerequisite/environment/authority issue prevents continuation |
| `INCOMPLETE` | Work stops with unmet criteria or missing evidence |
| `READY_FOR_REVIEW` | Executor has supplied all required proof; no owner acceptance implied |
| `CHANGES_REQUESTED` | Reviewer found actionable gaps at the submitted revision |
| `ACCEPTED` | Owner or explicitly delegated reviewer accepted the exact revision |

- **DR-009:** Reviewer examines the diff, product contracts, changed tests, caller integration, report/log consistency, and regression impact. Review cannot rely solely on pass counts or model confidence. Independently rerun critical cases; inspect risks without accepting the executor's explanations as fact.
- **DR-010:** Reject readiness for missing reports/criteria/evidence, false success claims, unsafe IDs/storage, forbidden scope changes, weakened tests, unexplained snapshots, untested important integration, unresolved applicable findings, or new regressions. Baseline failures need reproduction and explicit owner waiver to proceed; they never become passes.
- **DR-011:** Corrections reference finding IDs, remain bounded, add regression proof, and generate a new report. No automatic infinite fix/review loop. Acceptance of one WP does not accept the roadmap.
- **DR-012:** Preserve a concise acceptance ledger in the package report or follow-up review file: reviewer, exact revision, accepted/declined criteria, rationale, remaining owner decisions. The executor leaves this section unapproved.
