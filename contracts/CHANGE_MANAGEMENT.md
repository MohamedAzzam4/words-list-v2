# General Change-Management Contract

**Contract ID:** CM

**Version:** 1.1

**Status:** ACTIVE

## Purpose

Provide one safe workflow for new features, modifications, bug fixes, refactoring, migrations, and documentation changes. This contract applies even when a feature-specific contract does not yet exist.

## Mandatory task classification

Before editing, record exactly one primary type in the per-package report defined by `contracts/DELIVERY_REPORTING.md`:

- `FEATURE`: Adds user-visible capability that did not exist.
- `MODIFICATION`: Intentionally changes existing behavior.
- `BUGFIX`: Restores already intended behavior.
- `REFACTOR`: Changes internal structure without changing observable behavior.
- `MIGRATION`: Changes persisted data, identifiers, schema, or compatibility behavior.
- `DOCUMENTATION`: Changes instructions or explanation without runtime changes.

If a task mixes types, list secondary types and apply every relevant gate below.

## Common pre-change gate

- **CM-PRE-001:** Record goal, non-goals, task type, affected contracts, and exact success criteria in the package report.
- **CM-PRE-002:** Inspect the working tree and preserve pre-existing changes.
- **CM-PRE-003:** Map affected files, modules, state, persistence, UI, and tests before editing.
- **CM-PRE-004:** Run the smallest relevant baseline tests and record real results.
- **CM-PRE-005:** Identify compatibility risks: stored progress, canonical IDs, authentication, local/cloud merge, refresh/resume, mobile UI, and answer leakage.
- **CM-PRE-006:** Obtain explicit owner approval before changing an ACTIVE contract, public behavior, persisted schema, or dependency set.

## Feature gate

- **CM-FEAT-001:** Define user-visible Given/When/Then acceptance cases before implementation.
- **CM-FEAT-002:** State integration points and explicit non-goals.
- **CM-FEAT-003:** Add tests for the new happy path, important failure path, persistence/resume path when stateful, and regression-prone boundaries.
- **CM-FEAT-004:** Preserve backward compatibility unless an approved contract says otherwise.
- **CM-FEAT-005:** Do not build speculative configuration or adjacent features.

## Modification gate

- **CM-MOD-001:** Document behavior before and approved behavior after.
- **CM-MOD-002:** List exactly which old tests/contract clauses are superseded.
- **CM-MOD-003:** Replace superseded tests with ID-linked tests for the new behavior; unrelated tests remain binding.
- **CM-MOD-004:** Verify existing stored state remains readable and semantically valid.

## Bug-fix gate

- **CM-FIX-001:** Reproduce the defect with a failing automated test or a documented deterministic reproduction.
- **CM-FIX-002:** Identify the root cause, not only the visible symptom.
- **CM-FIX-003:** Make the smallest change that fixes the root cause.
- **CM-FIX-004:** Add a regression test that fails before and passes after the fix.
- **CM-FIX-005:** Verify neighboring paths that share the affected state or helper.

## Refactoring gate

- **CM-REF-001:** Observable behavior, public DOM contracts, storage shape, IDs, timing semantics, and test outcomes remain unchanged.
- **CM-REF-002:** Run and record baseline tests before the first refactor edit.
- **CM-REF-003:** Do not mix a refactor with a feature or behavior change unless the owner explicitly approves the combined scope.
- **CM-REF-004:** Keep intermediate steps testable and prefer small reversible moves.
- **CM-REF-005:** Run the same tests before and after; explain any changed output.
- **CM-REF-006:** A smaller diff and clearer ownership boundary are success measures; line-count reduction alone is not.

## Migration gate

- **CM-MIG-001:** Never overwrite the only copy of user progress.
- **CM-MIG-002:** Schema versions and migrations are monotonic and idempotent.
- **CM-MIG-003:** Preserve canonical IDs and independent Recognition/Production mastery.
- **CM-MIG-004:** Define old input, new output, repeated-run behavior, merge behavior, and rollback/recovery.
- **CM-MIG-005:** Test legacy data, current data, partial data, malformed-safe fallback, refresh, and account isolation.
- **CM-MIG-006:** Migration requires explicit owner approval and full relevant regression testing.

## Documentation gate

- **CM-DOC-001:** Documentation must describe actual code or clearly label future behavior as PROPOSED.
- **CM-DOC-002:** Paths, commands, contract statuses, and cross-references must be verified.
- **CM-DOC-003:** Documentation-only work must not modify runtime files.

## Completion and memory transfer

- **CM-DONE-001:** Satisfy `contracts/TESTING_AND_SUCCESS.md` and the applicable task-type gates.
- **CM-DONE-002:** Record final commands, results, decisions, changed files, and follow-ups in the package report.
- **CM-DONE-003:** Retain prior reports and failed evidence. Commit the report with its deliverable; corrections use a new attempt report.
- **CM-DONE-004:** Only the owner/reviewer records acceptance. An executor reports `READY_FOR_REVIEW`, not self-approved completion.
- **CM-DONE-005:** If mandatory verification is missing or failing, report `INCOMPLETE` or `BLOCKED` and identify each missing criterion.

## Portable-mode authority

These report locations replace the former RAM/ROM completion procedure while enforcement is paused. No snapshot, seal, hook, or machine task file is required. An assigned approved work package authorizes only its stated behavior change; contract, dependency, content, and migration changes beyond it still require owner approval.
