# Project Contracts

Contracts define behavior that contributors must preserve. Tests are the executable proof of those contracts.

## Reading order

1. `../AGENTS.md`
2. `PORTABLE_AGENT_EXECUTION.md`
3. `CHANGE_MANAGEMENT.md`, `CODE_FINGERPRINT.md`, `TESTING_AND_SUCCESS.md`
4. `DEAD_CODE_AND_REFACTORING.md`, `DELIVERY_REPORTING.md`
5. Relevant product contracts, `../docs/cefr/WORK_PACKAGES.md`, and actual tests

The owner paused the experimental hook workflow. Portable product tasks use tracked per-package reports, not local RAM/ROM or machine-sealed task state. Product requirements remain binding. This index does not start any automation.

## Contract index

| Contract | Status | Purpose |
|---|---|---|
| `CHANGE_MANAGEMENT.md` | ACTIVE | Safe workflow for features, modifications, fixes, refactors, migrations, and documentation |
| `CODE_FINGERPRINT.md` | ACTIVE | Shared coding style, architecture boundaries, naming, clean-code, and diff discipline |
| `PORTABLE_AGENT_EXECUTION.md` | ACTIVE | External sandbox authority, package boundaries, setup, and handoff |
| `DEAD_CODE_AND_REFACTORING.md` | ACTIVE | Safe reachability investigation and focused removal rules |
| `DELIVERY_REPORTING.md` | ACTIVE | Required evidence, task reports, and reviewer disposition |
| `AGENT_ENFORCEMENT.md` | PAUSED | Historical opt-in hook system; not required for product work |
| `OWNER_REVIEW_WORKFLOW.md` | PAUSED | Historical automated review orchestration; not active in portable mode |
| `GUIDED_CHALLENGE.md` | APPROVED | Scheduler, persistence, mastery, and guided flashcard UI behavior |
| `LEVEL_FLASHCARD_STANDARD.md` | APPROVED | Ordinary CEFR card presentation, examples, autoplay, level-wide review, favorites, and bounded sessions |
| `TESTING_AND_SUCCESS.md` | ACTIVE | Portable test ladder, regression matrix, test quality, and definition of done |

Every indexed contract is shipped on the handoff branch. The implementation of the paused hook system is deliberately not a dependency of this branch. Do not recreate missing automation files to satisfy historical examples.

## Status meanings

- `ACTIVE`: Current behavior that must be preserved unless the owner explicitly approves a change.
- `PROPOSED`: Design is documented but must not be implemented until the owner changes it to `APPROVED`.
- `APPROVED`: Authorized target behavior. Implementation and matching tests may proceed.
- `SUPERSEDED`: Historical behavior retained only for traceability.
- `PAUSED`: Retained design/history, not an instruction to activate its runtime or gates.

## Conflict rule

If code, tests, history, and a contract disagree, do not guess:

1. Stop implementation.
2. Record the mismatch in the assigned package report under `../docs/cefr/reports/`.
3. Determine whether the task intentionally changes behavior.
4. Obtain owner approval before changing an `ACTIVE` contract or implementing a `PROPOSED` contract.

Tests for unrelated behavior remain binding during an intentional contract change.

Approved product contracts describe targets, not proof that the published code already meets them. See `../docs/cefr/BASELINE.md` for known gaps. Owner-approved package scope may implement the specific target; it may not silently redesign adjacent behavior.
