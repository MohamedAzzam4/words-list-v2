# CEFR Level Flashcard and Review Standard

**Contract ID:** LF/LR

**Version:** 1.0

**Status:** APPROVED

## Purpose

Define the shared ordinary-vocabulary experience for A1, B2, and future CEFR levels. German Verbs is the visual and interaction reference, but verb-only details and navigation remain outside this contract.

## Scope

- Applies to ordinary word cards and level-wide word review.
- Applies independently inside each CEFR level.
- Does not replace the Guided Challenge scheduler contract.
- Does not change Phrases or Conversation behavior unless a separate task explicitly says so.

## LF-DATA — normalized card data

Every ordinary vocabulary card must expose:

- a stable ID;
- its lowercase CEFR `levelId` and numeric `unitId` identity;
- German term and display translation;
- `translations.en` and `translations.ar` language-specific text;
- display-translation language metadata (`en`, `ar`, or `mixed`);
- zero or more structured examples;
- for the flashcard, the first German example and its translation when available;
- `speechText.de`, `speechText.en`, and `speechText.ar` copied from their matching language fields.

The legacy `en`, `translation`, and `context` fields remain temporary aliases for existing consumers. Validation must reject disagreement between an alias and its normalized source.

Exact duplicate German terms already present in approved source content may be preserved only through an explicit stable-ID-pair allowance. New duplicates and stale allowances must fail validation.

Existing A1/B2 IDs and stored progress must remain valid. Parsers must not silently discard example translations that exist in source data.

## LF-CARD — shared card experience

The ordinary card must use the applicable German Verbs card behavior:

- same primary card shell and flip interaction;
- same placement of German term and translation;
- same audio and favorite affordances;
- pointer, Enter, and Space activation;
- visible focus indication;
- minimum 44×44px primary touch targets;
- reduced-motion support;
- no horizontal overflow on supported mobile widths.

When the answer is hidden, an English-to-German card must not expose German answer text, German answer audio, or equivalent accessible metadata.

After reveal:

- the first German example is always visible when present;
- its translation is always visible with it when present;
- only the first example is shown on the flashcard;
- additional examples may remain available in the glossary or autoplay experience.

Interactive controls on the revealed back (audio, favorite, example actions, and future metadata controls) must not flip, grade, or advance the card accidentally.

## LF-AUDIO — autoplay

Autoplay must use explicit language fields and support the applicable German Verbs controls:

- repeat count;
- example selection mode;
- include-translation option;
- selected starting item;
- pause, resume, and stop;
- active-item indication.

Speech must never send mixed English/Arabic display text to a single-language voice. If language-specific speech text is unavailable, the UI must not pretend that the mixed display value is English-only.

## LF-NAV — level navigation

- Units remain the primary level structure.
- The verbs deck strip is not added to level pages.
- Existing Phrases and Conversation tabs remain available according to configuration.
- The Review Center is a level-wide destination outside the individual unit tabs.

## LR-AGG — Review Center sources

The current level has two independent review sources:

1. **Due for Review:** cards whose SRS review time has arrived. New/unseen cards are not due review cards.
2. **Favorites:** all favorite word cards in the current level.

Each source must provide total and per-unit counts, all-unit review, and per-unit review. A card must not be duplicated within one source.

## LR-SESSION — bounded deterministic sessions

- Review-all means “create a plan across all units,” not “show every card in one session.”
- Candidate cards are shuffled deterministically from a stored seed.
- Every session contains at most 50 cards.
- Chunks should be balanced so their sizes differ by no more than one where possible.
- The candidate membership and order are frozen once a session starts.
- Refresh must preserve the exact order, chunk, cursor, and reveal state.
- Newly due cards wait for a future plan.
- Completing one chunk must not automatically force the next chunk to start.

## LR-STORAGE — persistence and compatibility

- Grading updates the original level/unit SRS record.
- Review Center does not create a second mastery system.
- Existing favorites, SRS records, and IDs remain readable.
- The active queue may be device-local in the first release; synchronized SRS/favorites remain authoritative.
- Any schema change must be monotonic, idempotent, and reversible.

## Required acceptance cases

1. A1 and B2 cards display the correct first German example and translation after reveal.
2. Cards without examples render safely without empty or stale example content.
3. Review totals and unit counts match the current level data.
4. All-unit and per-unit due review work independently.
5. All-unit and per-unit favorite review work independently.
6. Plans for 49, 50, 51, 100, and 101 candidates obey the maximum and balance rules.
7. A plan contains every candidate exactly once.
8. Refresh resumes an active plan without reshuffling.
9. Phrases and Conversation remain unchanged.
10. German Verbs behavior remains passing.
11. Mobile, keyboard, focus, reduced-motion, answer-secrecy, and wrong-voice checks pass.

## Reviewer rejection conditions

Reject the change if it changes IDs without migration, resets progress/favorites, discards examples, mixes levels, treats new cards as due, exceeds 50 cards, reshuffles on refresh, duplicates or omits cards, regresses Phrases/Conversation or German Verbs, leaks hidden German answers, or speaks multilingual text through the wrong voice.
