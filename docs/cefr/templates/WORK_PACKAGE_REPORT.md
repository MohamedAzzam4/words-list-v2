# <WP-ID> — Attempt <number> Delivery Report

## 1. Identity and status

- Status: IN_PROGRESS / BLOCKED / INCOMPLETE / READY_FOR_REVIEW
- Assigned goal and task type:
- Owner assignment reference:
- Branch; base commit; final tested code commit; report commit (fill after creation):
- Executor/model and sandbox OS/runtime versions:
- Start/end time; work directory (repository-relative in shared reports):
- Dependency acceptance references:

## 2. Required reading and pre-edit plan

- Paths fully read, relevant contract IDs, observed conflicts:
- Before behavior; approved after behavior; explicit non-goals:
- Exact allowed write paths and any proposed new files:
- Risk: low/medium/high with reason and fault families:
- Affected callers/UI/state/storage/audio boundaries:
- Baseline tests and known failures:

## 3. Changes and rationale

| File | Change/purpose | Contract/WP criterion | Compatibility impact |
|---|---|---|---|
| Fill every changed file | | | |

Root cause for bug fixes; why this approach; explicit scope deviations/approval; tests or old assertions intentionally superseded and why. No private reasoning transcript required.

## 4. Acceptance-to-evidence mapping

| Criterion / AC row / contract ID | Test path + exact name | Result | Log/artifact | Tested revision |
|---|---|---|---|---|
| Every assigned criterion | | PASS / FAIL / NOT_RUN / BLOCKED / N/A + reason | | |

## 5. Complete command ledger

Include EVERY test attempt, failures/cancellations/retries and setup errors, not only successful final runs.

| Command (exact) | Phase + revision | Start/end or duration | Exit | Passed/failed/skipped | Artifact | Interpretation |
|---|---|---|---|---|---|---|
| | baseline / RED / focused / final / setup | | | | | |

Background task IDs and terminal outcomes; reason for each broad rerun; zero-selection checks; how final evidence freshness was verified. Artifact links must be accessible to the reviewer.

## 6. Regression and integration

- A1 / B2 / ordinary Verbs / Guided Verbs:
- Phrases / Conversation / navigation / favorites / SRS:
- Legacy storage / refresh / level and account isolation:
- Actual audio adapter text AND language:
- Browser/module startup and console errors:
- Desktop/mobile/themes/keyboard/reduced-motion/screenshots inspected:
- For each inapplicable item give a reason; list all untested or blocked items.

## 7. Test-quality and fault-probe evidence

| Probe | Risk/contract | Production target + exact patch artifact | Detecting test | Baseline / syntax result | Actual failure | Classification | Integrity proof |
|---|---|---|---|---|---|---|---|
| | | | | | | KILLED / SURVIVED / INVALID_MUTATION / BASELINE_INVALID / INFRASTRUCTURE_FAILURE | |

Explain probe selection/count and untouched source/test hashes. Record every invalid attempt. Explain conditional assertions, weak mocks, ignored errors, and snapshot changes found or ruled out. If no mutation applies, justify scope instead of inventing a probe.

## 8. Dead-code and dependency inventory

| Candidate symbol/path | Searches + dynamic caller checks | Classification | Disposition | Regression proof |
|---|---|---|---|---|
| | | PROVEN_ORPHAN / DYNAMICALLY_USED / DUPLICATE_BUT_LIVE / UNCERTAIN | | |

If none found, record the exact search boundary and approach. Do not claim the whole repository is dead-code-free from a scoped scan.

## 9. Findings, limitations, and handoff

| Finding ID | Severity/impact | Reproduction and evidence | Disposition | Owner decision needed |
|---|---|---|---|---|
| | | | fixed / not reproduced with proof / deferred / open | |

- Remaining product risks, environment restrictions and untested requirements:
- Final diff/status and no unintended ID/content/storage/dependency changes:
- Branch/commit/patch retrieval:
- Next proposed WP (do not start without assignment):

## 10. Owner/reviewer disposition — not executor approval

- Reviewer and reviewed exact revision:
- Verdict: pending / CHANGES_REQUESTED / ACCEPTED
- Criteria/findings accepted or declined; explicit waivers and reason:

Leave pending for the reviewer. The final chat response links this report and summarizes its real status.
