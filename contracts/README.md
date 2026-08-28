# Project Contracts

Contracts define behavior that contributors must preserve. Tests are the executable proof of those contracts.

## Reading order

1. `../AGENTS.md`
2. `../AI_RAM.md`
3. The relevant contract below
4. The tests referenced by that contract
5. Only relevant `../AI_ROM.md` entries referenced by RAM or decision ID

## Contract index

| Contract | Status | Purpose |
|---|---|---|
| `CHANGE_MANAGEMENT.md` | ACTIVE | Safe workflow for features, modifications, fixes, refactors, migrations, and documentation |
| `CODE_FINGERPRINT.md` | ACTIVE | Shared coding style, architecture boundaries, naming, clean-code, and diff discipline |
| `AGENT_ENFORCEMENT.md` | ACTIVE | Model-independent task scope, hook adapters, evidence, continuation, and CI gates |
| `GUIDED_CHALLENGE.md` | APPROVED | Scheduler, persistence, mastery, and guided flashcard UI behavior |
| `LEVEL_FLASHCARD_STANDARD.md` | APPROVED | Ordinary CEFR card presentation, examples, autoplay, level-wide review, favorites, and bounded sessions |
| `TESTING_AND_SUCCESS.md` | ACTIVE | Test-change rules, verification matrix, evidence, and definition of done |

## Status meanings

- `ACTIVE`: Current behavior that must be preserved unless the owner explicitly approves a change.
- `PROPOSED`: Design is documented but must not be implemented until the owner changes it to `APPROVED`.
- `APPROVED`: Authorized target behavior. Implementation and matching tests may proceed.
- `SUPERSEDED`: Historical behavior retained only for traceability.

## Conflict rule

If code, tests, history, and a contract disagree, do not guess:

1. Stop implementation.
2. Record the mismatch in `AI_RAM.md`.
3. Determine whether the task intentionally changes behavior.
4. Obtain owner approval before changing an `ACTIVE` contract or implementing a `PROPOSED` contract.

Tests for unrelated behavior remain binding during an intentional contract change.
