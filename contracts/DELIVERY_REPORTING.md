# Delivery Reporting and Acceptance Contract

Contract: **DR**, version **1.1**, status **ACTIVE**.

- **DR-001:** Each attempt produces `docs/cefr/reports/<WP-ID>-<attempt>.md` using `docs/cefr/templates/WORK_PACKAGE_REPORT.md`. Fill every section; use an explained `N/A`, never silently omit a required section. Do not overwrite a previous delivered attempt.
- **DR-002:** Report all material changes, every test command attempted (including failures, cancellation, empty selections, and retries), environment/setup failures, changed assertions/snapshots, scope deviations, and unresolved findings. This means engineering evidence, not private chain-of-thought or a transcript dump.
- **DR-003:** Every test record contains command, working directory, runtime/tool versions, start/end or duration, tested Git revision/tree identity, exit code, pass/fail/skip counts, and retained log/artifact path. A background launch ID alone is not evidence.
- **DR-004:** Map each WP criterion and applicable contract ID to a test name/path, actual result, and evidence path. Distinguish `PASS`, `FAIL`, `NOT_RUN`, `BLOCKED`, and justified `N/A`. A skipped test cannot prove the criterion.
- **DR-005:** Report before/after behavior, root cause when fixing a defect, compatibility effects, each changed file's purpose, and dead-code results. Include a per-finding disposition: fixed, not reproduced with evidence, deferred for approval, or still open.
- **DR-006:** GitHub is the delivery channel. Commit the report and sanitized copies of retained text logs under `docs/cefr/evidence/<WP-ID>/<attempt>/`, with `INDEX.md` linking every file to its command/outcome and tested revision. Preserve material output, failures and timing; document redactions without exposing their contents. Never publish credentials, real user data, browser profiles or unreviewed traces. Sandbox-local paths and chat attachments are not the default evidence store; use `docs/cefr/GITHUB_DELIVERY.md`.
- **DR-007:** Test code may be committed first, followed by an implementation commit; final tests run against that implementation revision. Report/evidence-only commits do not invalidate code evidence. Any source, test, fixture, dependency, or execution-config change does. Record the tested code SHA inside the report; return the final delivered SHA and commit-pinned URLs after commit/push. Do not repeatedly edit a report to embed the hash of the commit containing itself.
- **DR-008:** Final chat response gives WP ID, status, GitHub task branch, full delivered SHA, commit-pinned report/evidence links, test totals, open findings, and next owner action. Verify the remote branch resolves to that SHA. An unpushed local commit or a sandbox-local directory is not a completed handoff. If publication fails, report delivery `BLOCKED` separately from any passing tests; do not fabricate a URL or repeat tests just to retry a push.

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
- **DR-013:** Reports and evidence for completed attempts are retained. A new delivery attempt uses a new report/evidence directory and branch; do not erase failed attempts or rewrite published history. Missing original output must be labeled unavailable, never reconstructed as if captured. Source/test behavior remains subject to the assigned WP; shipping evidence does not authorize fixes or new test runs.
