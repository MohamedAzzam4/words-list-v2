# Owner Review Workflow Contract

**Contract ID:** OR

**Version:** 1.2

**Status:** PAUSED — historical owner-controlled automation.

This design is retained for traceability, not activated by publication. The portable handoff uses human/frontier review of Git revisions and evidence under `DELIVERY_REPORTING.md`; it does not automatically open conversations. Historical confidentiality instructions below are design requirements, not access control provided by a public Git repository.

This file defines private post-executor orchestration. Executor sessions must not read it or receive its identities, count, timing, prompts, commands, or skill paths.

## Sequence

1. Seal a blind packet for the exact task, baseline, packet digest, and material revision. Exclude executor RAM, transcripts, conclusions, and prior verdicts.
2. Launch `CODE_REVIEWER` in a fresh bound conversation. It reads the packet/diff, writes only its assigned JSON report, and submits through its one-use lease.
3. After a clean code report, launch `TEST_AUDITOR` in a different fresh bound conversation. Explicitly load `.agents/skills/universal-test-auditor/SKILL.md`; it cannot read RAM or the code report.
4. The test auditor declares the sealed risk-based minimum of implementation-only behavioral mutations. The CLI validates category, plan, mutation, and test-ID uniqueness before executing every challenge in a separate disposable copy. Observed fields remain only in protected runtime state and are bound to the unchanged declarative challenge at submission.
5. Any finding enters `REVIEW_FINDINGS` and awaits planner triage. Accepted finding IDs become a newly sealed correction task. The sidecar launches a fresh executor conversation; it never resumes the original executor.
6. Two valid clean reports enter `OWNER_REVIEW`. This state permits inspection only; all mutation and task commands remain denied until the planner seals IDLE approval or a new correction task and snapshot.

## Mutation proof

- Every exact target must be bound by one entry in `task.mutation_review.probes` and must not be a test, spec, snapshot, fixture, or test configuration.
- A protected enforcement source is eligible only when it is an exact top-level `.agent-control/*.mjs` target and the current task/policy seal verifies. This exception never grants an executor edit permission and never writes the source target.
- The unmodified targeted baseline must pass.
- The mutated implementation must pass the sealed syntax/static command.
- The sealed expected test ID must appear in failing test output.
- Only then is status `KILLED`.
- Separate non-success statuses are `SURVIVED`, `BASELINE_INVALID`, `INVALID_MUTATION`, and `INFRASTRUCTURE_FAILURE`.
- CLI-owned exit codes, fingerprints, matched test ID, observed output, status, and restoration fields cannot be authored by a reviewer.
- Source fingerprints before and after the disposable probe must match exactly.
- Risk minimums are `LOW=2`, `MEDIUM=3`, and `HIGH=5`. Every sealed category and probe plan must be represented once, and expected test IDs must be distinct.
- Declarative validation may be corrected within the bounded validation-attempt limit. Once execution starts, the sealed mutation set cannot be rerun or edited.

## Owner decision

`OWNER_REVIEW` is not completion. The human owner/frontier planner checks reports, diff, contracts, and CI. Accepted findings are referenced by immutable IDs in `task.correction`; `seal-correction` verifies their source task, revision, packet digest, and scope before snapshotting the new authority. The correction executor and all reviewers for its later revision use fresh conversation identities. Approval is recorded in ROM before task authority is reset to IDLE.

Each external role owns separate launch and execution retry counters. Code-review coverage must cite only contract IDs present in the sealed packet and must list every repository-relative file in the candidate diff. Absolute host paths are forbidden in blind packets and reports.

Infrastructure recovery is separate from review quality. Each role has a bounded infrastructure counter and deterministic retry backoff for Sidecar reload, workflow handshake, transport, or `agentapi` failures; only a successfully bound conversation consumes its review-attempt budget. Exhaustion enters `INFRASTRUCTURE_BLOCKED`.

Every state transition compares the freshly loaded workflow build with the current sealed workflow hash. The persistent Sidecar supervisor starts a new one-shot worker per poll; an obsolete worker cannot advance state. Executors independently remain in `CONTEXT_LOADING` until protected receipts cover all required contract lines at current contract/task/policy hashes.

For owner-controlled enforcement work, the planner snapshots before implementation and seals the exact resulting protected-file hashes separately afterward. This owner-change seal does not replace the candidate baseline and is never an executor command.
