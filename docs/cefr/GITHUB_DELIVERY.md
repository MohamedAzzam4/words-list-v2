# GitHub-Based Agent Delivery

Owner-approved 2026-08-29. Applies to assigned portable WPs unless an explicit task instruction restricts publication. This replaces attachment-based handoff; it does not reactivate enforcement or automatic review agents.

## What gets published

Repository: `MohamedAzzam4/words-list-v2`.

- Task branch: `codex/glm-<lowercase-wp-id>-<attempt>`, e.g. `codex/glm-baseline-001-01`.
- Assigned source/tests, if the WP permits implementation changes.
- Report: `docs/cefr/reports/<WP-ID>-<attempt>.md`.
- Evidence: `docs/cefr/evidence/<WP-ID>/<attempt>/INDEX.md` and sanitized text logs.
- Final reply: task status, exact remote branch, full delivered commit SHA, and commit-pinned report and evidence-index URLs.

Each INDEX records the tested base/code SHA, environment, and a table of command, actual exit/counts, captured time/duration, linked log file, file SHA-256, redactions and missing evidence. Hashes identify the published files, not proof that a model executed a test truthfully. Review still inspects code and reproduces critical cases.

Keep one text log per actual run where available. Include failed setup and test attempts, not only successes. Retain meaningful output and result summaries. Do not fabricate lost logs or rerun a test and label it as the original execution. Clearly label reconstructed summaries as summaries, not raw captures.

## Safety and repository size

Inspect every file before staging. Remove tokens, credential-bearing URLs, headers, cookies, real user data and private environment values from the published copies. Preserve failures and record that redaction occurred; never reproduce the removed secret in the redaction note.

Do not commit `.env`, browser profiles, full environment dumps, `node_modules`, copied repositories, screenshots containing private data, unreviewed network traces, or generated HTML reports wholesale. Default text-evidence budget: 10 MiB per attempt. If more is essential, stop and request approved artifact storage rather than silently truncating proof or adding large binary archives. Small relevant sanitized screenshots may be included when visual evidence is required; identify them in INDEX.

Use secure provider credentials or a credential helper. Never embed a token in a remote URL, shell command, report, or chat. GitHub publication requires authorized write access; lack of it is a delivery blocker, not a reason to hide evidence or broaden token permissions automatically.

## Publication procedure

1. Confirm the tested code/base commit and final diff. Do not merge unrelated newer code merely to publish evidence.
2. Create the assigned task branch from the candidate/report commit. Inspect an existing remote branch before updating it. If it belongs to another attempt or has diverged, stop; do not force-push or reset it. An identical remote SHA is already delivered.
3. Stage exact assigned files plus the report/evidence directory. Inspect the staged diff, filenames and sizes; run `git diff --cached --check`.
4. Commit normally, then push that single task branch only. Never push to `main`, `master`, `review/guided-challenge`, `codex/cefr-glm-handoff`, or another shared integration branch as an executor.
5. Verify the remote branch SHA equals the final local delivery commit, and that the report/index files exist in that commit. For example, compare `git rev-parse HEAD` with `git ls-remote origin refs/heads/<assigned-task-branch>`.
6. Return URLs in these forms, replacing placeholders with actual values:
   - `https://github.com/MohamedAzzam4/words-list-v2/blob/<full-delivered-sha>/docs/cefr/reports/<WP-ID>-<attempt>.md`
   - `https://github.com/MohamedAzzam4/words-list-v2/blob/<full-delivered-sha>/docs/cefr/evidence/<WP-ID>/<attempt>/INDEX.md`
7. Stop. A pull request is optional and only opened if assigned; a branch is sufficient for review. Do not merge or deploy.

The report stores its tested code SHA. The final response stores the delivery commit SHA: do not edit the report repeatedly to make it contain the hash of its own commit. Report/evidence-only commits leave prior code-test evidence valid. Retry publication after authentication/network recovery without rerunning application tests; report failed publication attempts separately.

If tests passed but publication failed, report `test result: PASS; delivery: BLOCKED`. Do not claim a completed handoff until the reviewer can fetch the files. A private repository requires reviewer access; possession of a URL does not grant it.

GitHub's commit-pinned URL behavior was checked through Context7: [permanent file links](https://docs.github.com/en/repositories/working-with-files/using-files/getting-permanent-links-to-files). Full SHAs identify the reviewed snapshot even if the branch advances.

## Current BASELINE-001 session: delivery-only follow-up

Use this for the already-finished GLM session. Do NOT restart its baseline tests or replace its tested source with the latest handoff branch.

```text
Delivery-only follow-up for your completed BASELINE-001.

I authorize publishing the existing report and evidence to GitHub. This explicitly
supersedes the earlier no-push instruction for this delivery only.

Repository: MohamedAzzam4/words-list-v2
Only permitted remote branch: codex/glm-baseline-001-01
Tested base: d2f4c79909c4c89e5efbdbeb5d93ebac2b206986

Continue from your existing report branch/commits. Keep the tested application
unchanged. Do not merge/rebase the latest handoff branch, modify source/tests,
rerun tests, reactivate enforcement, or start another work package.

Publish:
1. docs/cefr/reports/BASELINE-001-01.md
2. Sanitized retained setup/unit/focused-E2E/inventory/diff-check logs under
   docs/cefr/evidence/BASELINE-001/01/
3. INDEX.md in that evidence directory, linking every available log to its
   command, real outcome, tested revision and file SHA-256. Identify redactions
   and any missing original logs honestly; do not recreate them as raw output.

Do not publish credentials, credential-bearing URLs, cookies, browser profiles,
private user data, node_modules, or large generated report archives.
Use the sandbox's secure Git credential mechanism, never a token in chat or URLs.

Inspect the complete diff against the tested base. Only the assigned report and
evidence paths may differ. Commit these delivery files and push ONLY the permitted
branch. Do not force-push. If the remote branch already exists, verify ownership
and ancestry; stop on divergence instead of replacing it.

Verify that GitHub's branch SHA equals your final delivery commit. Return only:
- Delivery status
- Remote branch and full delivered commit SHA
- Commit-pinned GitHub report link
- Commit-pinned GitHub evidence INDEX.md link
- Missing evidence or publication blockers, if any

No pull request, merge, deployment, or further implementation is authorized.
Do not repeatedly edit the report to embed its own new commit hash; put the final
delivery SHA in your reply after the push succeeds.
```

## Reviewer retrieval

When the owner asks for review, Codex can fetch the named task branch and inspect its exact delivered SHA, report, logs and diff directly. The owner need not copy files between chats. Reviewer access is read-only unless a separate change request authorizes edits. No background polling or automatic acceptance is implied.
