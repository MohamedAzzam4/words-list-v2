# Guided Challenge Contract

**Contract ID:** GC

**Version:** 0.2

**Status:** APPROVED — implementation authorized by the project owner on 2026-08-12.

## Purpose

Define deterministic same-session learning, safe persistence, independent mastery tracks, and a Guided Challenge card experience consistent with the ordinary verb flashcard.

## Scope

- Guided learning sessions for a 50-verb deck
- Acquisition, Recognition, and Production phases
- Daily Review behavior that shares the challenge engine
- Refresh/resume and local/cloud persistence
- Guided flashcard presentation and controls

## Explicitly superseded Acquisition behavior

The following current behavior is superseded:

- One successful Acquisition recall must no longer immediately set a card to `ready`.
- The existing test named `a ready acquisition word leaves the pool and the next unseen word enters` must be replaced, not merely deleted or weakened.

## Terms

- **Presentation:** A completed intro, scored recall, or explicitly non-scored spacer that advances the engine turn.
- **Intervening presentation:** A presentation completed after one appearance of a card and before its next due appearance.
- **Ready:** Acquisition is complete for this card. It may leave the active pool and proceed toward Recognition.
- **Fluent recall:** A correct scored recall with a valid positive finite prompt-to-reveal latency of at most 4000 ms.
- **Confirmation recall:** One additional scored Acquisition recall required after a correct but non-fluent recall step 2.
- **Terminal:** A state that cannot be scored or committed again.

## Acquisition contract

- **GC-ACQ-001 — Pool bound:** The active Acquisition learning pool contains at most 8 cards.
- **GC-ACQ-002 — Introduction is not recall:** Completing an intro records exposure but never counts as a successful recall.
- **GC-ACQ-003 — Recall step 1 spacing:** The first scored recall becomes due only after at least 2 intervening completed presentations.
- **GC-ACQ-004 — First success is non-terminal:** Pressing `I knew it` on recall step 1 schedules recall step 2 and does not set the card to `ready`, regardless of recall latency.
- **GC-ACQ-005 — Recall step 2 spacing:** Recall step 2 becomes due only after at least 6 intervening completed presentations.
- **GC-ACQ-006 — Graduation:** A card becomes `ready` after a fluent correct recall step 2, or after the later correct confirmation required by a non-fluent recall step 2.
- **GC-ACQ-007 — Forgot recovery:** Pressing `I forgot` at recall step 1, recall step 2, or confirmation resets successful progress to zero and reschedules recall step 1 after at least 2 intervening completed presentations.
- **GC-ACQ-008 — No early scoring:** A card presented only as a spacer before its due turn is non-scored and cannot advance or reset mastery.
- **GC-ACQ-009 — Rolling replacement:** Only a `ready` card leaves the active pool; the next unseen deck card then enters.
- **GC-ACQ-010 — Phase gate:** Recognition begins only after every deck card is `ready`.
- **GC-ACQ-011 — Progress meaning:** Acquisition progress counts ready cards, not exposures or intermediate successes.
- **GC-ACQ-012 — Timer boundary:** Acquisition latency is measured monotonically from first display of the scored recall prompt until the first answer reveal. Time spent reading the revealed answer or choosing a grade is excluded.
- **GC-ACQ-013 — Step-1 latency is diagnostic:** Recall step 1 records valid latency but never uses speed to graduate, fail, or add confirmation.
- **GC-ACQ-014 — Fluent threshold:** Recall step 2 is fluent only when latency is a valid positive finite number less than or equal to 4000 ms. Exactly 4000 ms is fluent.
- **GC-ACQ-015 — Slow step-2 confirmation:** A correct recall step 2 above 4000 ms is successful but non-terminal and schedules confirmation after at least 8 intervening completed presentations.
- **GC-ACQ-016 — Confirmation completion:** A correct confirmation sets the card to `ready` regardless of latency, preventing an endless loop for consistently slow but correct learners.
- **GC-ACQ-017 — Invalid latency:** Missing, zero, negative, non-finite, or non-numeric latency never counts as fluent; at recall step 2 it follows the confirmation path rather than being treated as Forgot.

The intervals are measured in engine turns, not wall-clock seconds. Changing `2`, `6`, `8`, or the 4000 ms threshold is a contract change requiring owner approval and corresponding test updates.

## Recognition and Production invariants

- **GC-PHASE-001:** Recognition prompts German to English.
- **GC-PHASE-002:** Production prompts English to German.
- **GC-PHASE-003:** Recognition and Production state, wins, SRS data, and timestamps remain independent.
- **GC-PHASE-004:** Acquisition progress never creates official mastery.
- **GC-PHASE-005:** Official mastery is committed only after the corresponding whole phase wins.
- **GC-PHASE-006:** A forgotten challenge card cannot pass without completing its required recovery recalls.
- **GC-PHASE-007:** A terminal card cannot be scored twice.

This proposal changes Acquisition graduation only. Recognition, Production, and Daily Review scheduling must not be redesigned incidentally.

## Persistence and lifecycle invariants

- **GC-STATE-001:** Refresh restores phase, turn, pool membership, cursor, card learning step, due turn, failure state, and stable phase order.
- **GC-STATE-002:** Learning sessions and Daily Review sessions use isolated storage slots.
- **GC-STATE-003:** Completing or restarting one session type cannot overwrite the other.
- **GC-STATE-004:** Duplicate reveal, intro, continue, or grade events cause at most one mutation.
- **GC-STATE-005:** Local/cloud merging cannot erase a Recognition win with Production data or erase a Production win with Recognition data.
- **GC-STATE-006:** Schema versions never decrease.
- **GC-STATE-007:** Canonical `v_*` IDs remain stable through save, merge, migration, refresh, and authentication changes.

## Guided flashcard UI contract

- **GC-UI-001 — Shared presentation:** Guided Challenge uses the ordinary verb flashcard shell and shared front/back content renderer rather than a second visual implementation.
- **GC-UI-002 — Reveal by flip:** Tapping/clicking the card reveals the answer using the ordinary flip interaction.
- **GC-UI-003 — Scheduler-owned navigation:** Guided mode does not expose Previous, Next, Shuffle, Review Scope, or direction controls.
- **GC-UI-004 — Scheduler-owned grading:** Ordinary `Known` and `Still Learning` mutations are replaced by Guided `I knew it` and `I forgot` actions.
- **GC-UI-005 — Safe front:** Production fronts contain no German infinitive, German hint, German example, conjugation, origin detail, or German audio control.
- **GC-UI-006 — Recognition audio:** German audio may be available on a Recognition front because the German verb is already the prompt.
- **GC-UI-007 — Safe back:** Favorites, German audio, examples and translations, conjugations, origins, tags, and verb details may appear after reveal.
- **GC-UI-008 — Phase chrome:** Phase badge, progress, restart/exit behavior, milestones, and completion screens remain Guided Challenge controls outside the shared card.
- **GC-UI-009 — Mobile/accessibility:** Controls remain keyboard operable, visibly focused, usable at mobile widths, and at least 44 by 44 CSS pixels for primary touch targets.

## Required executable acceptance tests

- **GC-TEST-001:** A perfect 50-card Acquisition with fluent recall step 2 responses requires exactly 50 intros and 100 successful scored recalls before transition.
- **GC-TEST-002:** A step-1 success leaves the card active and schedules step 2 regardless of latency.
- **GC-TEST-003:** A card cannot appear as a scored recall before its due turn.
- **GC-TEST-004:** Forgot resets consecutive success and requires two new separated successes.
- **GC-TEST-005:** Pool size never exceeds 8 for the complete 50-card lesson.
- **GC-TEST-006:** Refresh during either learning step restores the exact next presentation and card state.
- **GC-TEST-007:** Double clicks cause exactly one turn/state/scoring mutation.
- **GC-TEST-008:** Recognition, Production, and Daily Review regression tests remain passing.
- **GC-TEST-009:** Guided and ordinary modes render the same card shell/back content while keeping different action controls.
- **GC-TEST-010:** Production front DOM and accessible text contain no German-answer leakage before reveal.
- **GC-TEST-011:** The fluent boundary is deterministic: 4000 ms graduates at recall step 2; 4001 ms and invalid latency do not.
- **GC-TEST-012:** A correct slow recall step 2 schedules confirmation only after at least 8 intervening presentations.
- **GC-TEST-013:** Correct confirmation graduates regardless of speed; Forgot from any Acquisition scored step resets the whole sequence.
- **GC-TEST-014:** Timer capture freezes at first reveal and survives rerender without including post-reveal reading/grading time.

## Non-goals

- Changing long-term SRS interval calculation
- Changing Daily Review restart policy
- Changing content or verb IDs
- Adding typed-answer grading
- Introducing a framework or new dependency
- Refactoring unrelated views
