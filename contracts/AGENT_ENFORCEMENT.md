# Agent Enforcement Contract

**Contract ID:** AE

**Version:** 2.2

**Status:** PAUSED — historical opt-in workflow, not active for portable product tasks.

The owner paused this runtime. Clauses below document its design if explicitly reactivated; they do not require external sandbox executors to install hooks, locate local state, run `.agent-control`, or deny otherwise authorized product work. Current rules are `PORTABLE_AGENT_EXECUTION.md` and `TESTING_AND_SUCCESS.md`. No OS isolation or automated enforcement is claimed by retaining this document.

## Purpose

Make execution rules observable and enforceable when Gemini works through Antigravity or DeepSeek works through OpenCode. The policy belongs to this repository; adapters translate environment events into one shared core.

## Authority and ownership

- **AE-AUTH-001:** `.agent-control/task.json` is the only machine-readable authority for an executor task.
- **AE-AUTH-002:** `AGENTS.md`, contracts, control code, adapters, CI policy, `AI_ROM.md`, and runtime evidence are owner/reviewer-controlled and cannot be modified by an executor.
- **AE-AUTH-003:** An ACTIVE executor may update `AI_RAM.md` and only the implementation paths explicitly allowed by the task.
- **AE-AUTH-004:** IDLE, missing, malformed, or unsupported task state denies mutation and non-inspection shell tools.
- **AE-AUTH-005:** A requested scope expansion is a blocker. The executor cannot authorize it by editing task or policy files.
- **AE-AUTH-006:** Planner snapshot seals the ACTIVE task and policy outside `task.json`; every mutation gate and completion check rejects a missing or changed seal.
- **AE-AUTH-007:** PAUSED preserves the current task description for review but removes executor mutation, task-command, and automatic-continuation authority. Only repository-safe inspection remains available until the planner explicitly resumes and reseals the task.

## Tool gate

- **AE-GATE-001:** Known inspection tools remain usable without an ACTIVE task, except reads of secrets or private runtime evidence.
- **AE-GATE-002:** Every file mutation path is normalized against the Git root. Paths outside the repository are denied.
- **AE-GATE-003:** Protected paths win over task allowlists.
- **AE-GATE-004:** Multi-file patches are allowed only when every parsed path is allowed; an unparseable patch fails closed.
- **AE-GATE-005:** Shell commands are exact allowlisted values. Chaining, pipes, redirection, substitutions, and multiline commands are denied even when a prefix looks safe.
- **AE-GATE-006:** Unknown tools fail closed unless the task explicitly allows the exact tool or a declared prefix pattern.
- **AE-GATE-007:** A task may gate a broad command on named fresh evidence and cap attempts per material revision. A successful material edit invalidates the prerequisite and re-closes the gate.
- **AE-GATE-008:** After deterministic verification first becomes green, executor authority ends and the core seals the exact material revision for an owner-controlled handoff.
- **AE-GATE-009:** Downstream owner roles, count, timing, prompts, commands, and orchestration are private control-plane details and are not injected into or readable by executor sessions.
- **AE-GATE-010:** During owner-controlled handoff and owner review, application/test mutation, task commands, repository history changes, RAM/ROM writes, and reads of private control state are denied.

## Context and evidence

- **AE-CTX-001:** Executors receive a sanitized current task and RAM through their adapter. Owner-controlled workflow identities, orchestration, and commands are removed. Bound owner roles receive only their private assigned context.
- **AE-CTX-002:** Injected context is concise, bounded, and contains no transcript or tool output.
- **AE-CTX-003:** An ACTIVE executor begins in `CONTEXT_LOADING`. Mutation and task commands remain denied until adapter-owned successful-read receipts cover every line of every required contract at its current file hash and match the current sealed task/policy hashes. Receipts prove delivery/read coverage, not semantic understanding.
- **AE-CTX-004:** `PreInvocation` reports exact uncovered contract line ranges. Antigravity and OpenCode PostTool adapters write the same protected receipt format; changed contract, task, or policy bytes invalidate admission and return the executor to `CONTEXT_LOADING`.
- **AE-EVID-001:** Post-tool adapters append metadata about the actual tool call and success state; the executor does not write the evidence store.
- **AE-EVID-002:** Evidence records exclude command output, prompts, file contents, and secrets.
- **AE-EVID-003:** Evidence uses a hash chain so truncation or modification is detectable.
- **AE-EVID-004:** Recorded evidence never replaces deterministic verification. CI reruns repository-owned checks.
- **AE-EVID-005:** Required completion evidence is fresh only when it was recorded after the last successful material mutation for that task. Later executor-memory-only updates do not stale evidence; failed or denied mutations do not count.

## Completion

- **AE-DONE-001:** Completion verification checks task validity, required contracts, required successful evidence, unchanged baseline work, allowed current scope, and unchanged baseline HEAD.
- **AE-DONE-002:** Antigravity `Stop` verifies or requests continuation only when `fullyIdle` is `true`; while background tools remain active it allows the loop to pause without consuming a continuation attempt. OpenCode `session.idle` requests continuation when an ACTIVE task is incomplete.
- **AE-DONE-003:** Automatic continuation is bounded. Repeated identical failures become `BLOCKED`; they never become a successful result.
- **AE-DONE-004:** An IDLE task may stop normally after policy/task self-validation.
- **AE-DONE-005:** The executor cannot stage, commit, push, merge, reset, or rewrite history through the enforced shell policy.
- **AE-DONE-006:** `node .agent-control/cli.mjs pause` is a one-way executor safety command: it may reduce ACTIVE authority to PAUSED but cannot resume, expand, or reseal authority.
- **AE-DONE-007:** Green deterministic evidence yields `IMPLEMENTATION_EVIDENCE_COMPLETE`, never final readiness. Only the private owner-controlled workflow may yield `READY_FOR_OWNER_REVIEW`; no model-written report yields final owner approval.
- **AE-DONE-008:** Any accepted downstream finding stops automatic work for planner triage. It is never returned to the original executor as an automatic correction prompt.
- **AE-DONE-009:** Review/correction cycles and malformed submissions are bounded. Exceeding the configured limit yields `BLOCKED_FOR_CODEX_REVIEW`, never an automatic pass.
- **AE-DONE-010:** Private owner-control details are defined by `contracts/OWNER_REVIEW_WORKFLOW.md`, which is not executor-readable. The shared gate enforces its final read-only owner state without disclosing internal stages.
- **AE-DONE-011:** Planner-accepted sealed findings create a new ACTIVE correction task and a fresh executor conversation. Prior executor and reviewer conversations cannot mutate or continue the correction task.
- **AE-DONE-012:** A bound independent reviewer that becomes fully idle before submitting its assigned report is retired rather than passed into executor continuation. The same role is requeued in a fresh conversation within the configured attempt limit; exhausting that limit yields `BLOCKED_FOR_CODEX_REVIEW`.
- **AE-DONE-013:** Blind review packets are immutable and content-addressed within a material revision. Changed evidence creates a new sealed generation; identical content reuses the same generation, and no prior packet is overwritten.
- **AE-DONE-014:** Code-review and test-audit launch and execution attempt budgets are independent per role. A successful claim clears the current role's stale launch error; one role never consumes another role's recovery budget.
- **AE-DONE-015:** A code-review submission is invalid when it cites a contract ID absent from the sealed packet or omits any candidate diff file from `coverage.diff_files`. Blind diffs contain repository-relative paths only.
- **AE-DONE-016:** Owner-controlled protected changes retain the pre-change candidate baseline and require a separate exact-hash owner seal. The executor cannot create that seal or mutate protected paths; changed protected bytes outside its sealed task scope remain invalid.
- **AE-DONE-017:** Infrastructure retries and started-review attempts use separate per-role budgets. Transport, `agentapi`, reload, or handshake failure cannot consume a model review-attempt budget.
- **AE-DONE-018:** Infrastructure retry delay follows the policy's deterministic backoff schedule. Exhaustion yields `INFRASTRUCTURE_BLOCKED`, not a finding against Gemini and not an automatic pass.
- **AE-DONE-019:** Before every owner-workflow state mutation, the loaded core and the current workflow infrastructure must match the sealed build identity. A stale runtime fails closed before changing state or consuming a budget.
- **AE-DONE-020:** The long-lived Antigravity owner-infrastructure process is only a supervisor. Every poll launches a fresh one-shot Node worker so module caching cannot retain an obsolete workflow implementation after files change.
- **AE-DONE-021:** Test-auditor JSON remains declarative. Mutation exit codes, fingerprints, matched test IDs, observed output, restoration, and status live only in protected CLI state and are bound to the declarative challenge fingerprint during submission.

## Adapter contract

- **AE-ADAPTER-001:** Antigravity configuration lives in the workspace plugin `.agents/plugins/agent-enforcement/` and uses `PreToolUse`, `PostToolUse`, `PreInvocation`, and `Stop`; private owner orchestration is adapter-managed outside executor context.
- **AE-ADAPTER-002:** OpenCode configuration lives under `.opencode/plugins/` and uses `tool.execute.before`, `tool.execute.after`, `experimental.session.compacting`, and `session.idle`; unavailable private owner orchestration fails closed.
- **AE-ADAPTER-003:** Adapter-specific failure messages include the shared denial or missing-evidence reason.
- **AE-ADAPTER-004:** If an environment API changes or is unavailable, the adapter fails closed for mutation and reports the compatibility problem. It does not silently disable enforcement.

## Required tests

- **AE-TEST-001:** IDLE permits inspection and denies mutation.
- **AE-TEST-002:** ACTIVE allows an in-scope edit and denies an out-of-scope edit.
- **AE-TEST-003:** Protected and outside-repository paths are denied even when requested in task scope.
- **AE-TEST-004:** Multi-file patches and exact shell commands fail closed on any unapproved operation.
- **AE-TEST-005:** Successful evidence satisfies an exact requirement; failed or tampered evidence does not.
- **AE-TEST-006:** Baseline files remain accepted only while their content fingerprint is unchanged.
- **AE-TEST-007:** RAM/task context is restored within a fixed size bound.
- **AE-TEST-008:** Repeated incomplete completion attempts stop auto-continuing and remain blocked.
- **AE-TEST-009:** Antigravity `Stop` with `fullyIdle=false` neither verifies nor continues, and a missing `fullyIdle` field fails closed within the bounded continuation limit.
- **AE-TEST-010:** Required evidence recorded before a later successful implementation/test mutation is rejected until the required check succeeds again; RAM-only reporting and unsuccessful mutations do not invalidate fresh evidence.
- **AE-TEST-011:** PAUSED allows inspection, denies scoped mutation and task commands, and stops without automatic continuation.
- **AE-TEST-012:** The pause command preserves task identity and scope while changing only the authority status.
- **AE-TEST-013:** A gated broad suite is denied before fresh targeted evidence, allowed once afterward, denied on repetition, and closed again by a later material mutation.
- **AE-TEST-014:** Browser ES-module syntax is checked without rewriting valid `import` or `export` declarations for CommonJS compatibility.
- **AE-TEST-015:** The legacy in-session critique remains bounded and cannot self-approve the external universal-review path.
- **AE-TEST-016:** Repeated findings may start no more than the configured critique/correction cycles; the next cycle is blocked for planner review and cannot become an automatic pass.
- **AE-TEST-017:** Owner-controlled stages use distinct bound conversations, isolated report authority, and a disposable implementation-only mutation probe before entering read-only `OWNER_REVIEW`.
- **AE-TEST-018:** On Windows, an owner-control-provided `agentapi.cmd`/`.bat` wrapper must be resolved from the private launcher PATH and invoked without placing repository-controlled text in the command shell.
- **AE-TEST-019:** Concurrent hook processes must serialize evidence appends into one valid hash chain, and concurrent private launchers must atomically claim a single owner-controlled handoff.
- **AE-TEST-020:** Planner-authorized evidence recovery must archive the complete corrupt chain and retain only its cryptographically valid prefix.
- **AE-TEST-021:** Executor context and mandatory startup files do not disclose downstream owner-role identities, orchestration, commands, timing, or count.
- **AE-TEST-022:** Executor reads of owner-only prompts, workflow contract, orchestration files, and auditor skill are denied.
- **AE-TEST-023:** Mutation authority rejects tests, specs, snapshots, fixtures, and test configuration even when otherwise task-allowlisted.
- **AE-TEST-024:** A syntax-invalid mutant is classified `INVALID_MUTATION`, never `KILLED`, and cannot modify source repository bytes.
- **AE-TEST-025:** A protected top-level `.agent-control/*.mjs` mutation is allowed only when named exactly by sealed `task.mutation_review`; it runs in the disposable copy and source bytes/hashes remain unchanged.
- **AE-TEST-026:** A clean test audit requires the sealed risk-based minimum of unique implementation mutations, every mandatory category, distinct expected test IDs, and a `KILLED` result for every challenge.
- **AE-TEST-027:** Declarative mutation drafts may be corrected within a bounded validation stage, while actual multi-mutation execution is one-shot for the sealed draft.
- **AE-TEST-028:** Accepted findings seal a narrow correction task, bind it to a fresh executor conversation, and require fresh evidence and reviewer identities for the corrected revision.
- **AE-TEST-029:** An incomplete reviewer `Stop` retires its conversation, never creates a generic executor continuation, requeues a fresh reviewer once, and blocks after the configured attempt limit.
- **AE-TEST-030:** Changed evidence within one material revision creates a distinct immutable packet generation, identical content reuses it, and the prior generation remains byte-identical.
- **AE-TEST-031:** Code Reviewer and Test Auditor have independent bounded execution-attempt budgets.
- **AE-TEST-032:** Code Reviewer and Test Auditor have independent bounded launch-attempt budgets.
- **AE-TEST-033:** Code-review reports reject nonexistent sealed contract IDs and incomplete candidate-diff coverage.
- **AE-TEST-034:** Blind candidate diffs never expose Windows drive letters, absolute workspace paths, or baseline snapshot roots.
- **AE-TEST-035:** A successful reviewer claim clears stale launch errors for the claimed role.
- **AE-TEST-036:** An owner-change seal authorizes only exact protected hashes inside task scope while preserving the original candidate-diff baseline.
- **AE-TEST-037:** Declarative mutation reports bind protected CLI probe evidence and can reach owner review without reviewer-authored result fields.
- **AE-TEST-038:** Infrastructure failures do not consume either role's started-review attempt budget.
- **AE-TEST-039:** Infrastructure backoff is deterministic, bounded, and ends as `INFRASTRUCTURE_BLOCKED`.
- **AE-TEST-040:** A stale loaded workflow fails closed before any review-state mutation.
- **AE-TEST-041:** The Antigravity supervisor launches a fresh one-shot worker on each poll and does not statically import workflow execution code.
- **AE-TEST-042:** Partial contract reads keep the executor in `CONTEXT_LOADING`; complete current-hash line coverage admits execution.
- **AE-TEST-043:** Contract, task, or policy hash changes invalidate context admission.
- **AE-TEST-044:** Antigravity PreInvocation and both adapters' PostTool paths share deterministic context-read receipts.

## Non-goals

- Treating hooks as an operating-system security sandbox
- Trusting model-written success claims
- Globally installing Antigravity, OpenCode, plugins, packages, or credentials
- Allowing an executor to approve its own task, contract, or evidence
- Modifying application, learning, storage, or German-content behavior
