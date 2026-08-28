# CEFR Level Flashcard Standard and Review Center Roadmap

## Status

- Approved product direction; this document alone does not assign implementation work.
- The owner authorized external sandbox preparation on 2026-08-29. Execute only the assigned work package.
- Enforcement-workflow development is paused by owner direction.
- Detailed delivery scopes: `docs/cefr/WORK_PACKAGES.md`.
- Current published baseline and known gaps: `docs/cefr/BASELINE.md`.
- External executor startup and first prompt: `docs/cefr/GLM_HANDOFF.md`.
- Binding acceptance matrix: `docs/cefr/ACCEPTANCE_MATRIX.md`.
- Reporting/testing rules: `contracts/README.md`. Product completion is not claimed by this roadmap.

## Objective

Make the applicable German Verbs learning experience the standard for ordinary vocabulary in A1, B2, and every future CEFR level, while preserving the level/unit structure and the existing Phrases and Conversation experiences.

Add a level-wide Review Center that aggregates due-review words and favorite words across all units in the current level, supports review by unit or across the entire level, and divides large sets into deterministic sessions containing no more than 50 cards.

## Product decisions

### German Verbs is the reference experience

The following applicable behaviors become the ordinary vocabulary standard:

- the same card shell and flip interaction;
- the same placement of the German term and its translation;
- the first German example is always visible on the revealed card back;
- the translation of that first example is always visible with it;
- only the first example is shown on the flashcard, matching German Verbs;
- the remaining examples stay available in the glossary/list experience and autoplay where supported;
- audio and favorite controls;
- pointer, Enter, and Space activation;
- answer-secrecy behavior before reveal;
- responsive, focus-visible, reduced-motion, and touch-target behavior;
- applicable autoplay settings, sequence controls, progress, pause, resume, and stop behavior.

Verb-only elements are not copied to ordinary vocabulary:

- conjugation sections;
- verb-origin sections unless a later vocabulary contract introduces equivalent metadata;
- the verbs deck strip;
- verb-specific challenge navigation and persistence fields.

### Level and unit navigation remains authoritative

- A1, B2, and future levels retain their units.
- The verbs deck strip is not introduced in level pages.
- Existing Phrases and Conversation tabs remain available according to the level configuration.
- The new Review Center is a level-wide destination outside the individual unit tabs.
- Review data never crosses CEFR-level boundaries.

### Review Center behavior

The Review Center has two sources:

1. Due for Review: SRS cards whose review time has arrived.
2. Favorites: all favorite word cards in the current level.

Each source shows:

- total cards across the current level;
- count per unit;
- review-all action;
- review-one-unit action;
- planned session count and session sizes;
- current and remaining session progress.

“Review all” creates a session plan; it never creates one unbounded session.

Session rules:

- shuffle deterministically using a stored seed;
- maximum 50 cards per session;
- balance chunks to avoid a tiny final session;
- 49 cards becomes one session of 49;
- 100 cards becomes two sessions of 50;
- 101 cards becomes three sessions of 34, 34, and 33;
- no missing or duplicate cards;
- refresh restores the same order and position;
- new due cards do not enter a session that has already started;
- completing one session does not automatically force the next session to start.

## Why data normalization comes first

The raw A1 and B2 vocabulary rows contain more information than the current parser exposes to the flashcard engine.

Original observations before the data-foundation fixes (retained to explain sequencing):

- A1 rows contain a German example and an English example translation. The parser keeps the German example but currently drops the English example translation.
- B2 rows contain a German example and a translated example field. The parser currently drops the translated example field.
- The current ordinary flashcard renderer can therefore repeat the vocabulary word and its normal translation where an example sentence and its translation should be displayed.

This means a visual-only migration would make the level card look like the German Verbs card while feeding it incomplete or incorrect example data. The parser and internal card model must preserve the example and its translation before the UI is migrated.

This phase does not rewrite the vocabulary content. It only prevents existing fields from being discarded and gives the UI explicit, language-safe properties.

The handoff includes the additive parser/validator corrections. The UI migration and complete audio adapter integration remain unfinished; see the baseline rather than treating this historical paragraph as current parser behavior.

## Delivery strategy

Each task below has one primary responsibility and should be implemented and reviewed independently. Broad refactoring must not be mixed into feature tasks. The detailed work-package catalog supplies the execution order, scopes, evidence, and package-level criteria; it does not replace these product decisions.

## Phase 0 — Product baseline

### BASELINE-001 — Establish a clean product-development boundary

- Preserve all current uncommitted application and workflow work.
- Record the current branch, modified files, and relevant test state.
- Keep enforcement source archived but inactive.
- Start product implementation from an owner-approved baseline.
- Do not reset, discard, or silently incorporate unrelated changes.

Success criteria:

- the exact pre-existing working tree is documented;
- no enforcement adapter runs automatically;
- the product task has an explicit file scope;
- no unrelated changes are included in product commits.

## Phase 1 — Behavior contract

### LEVEL-STD-001 — Define the ordinary level learning standard

Create a binding feature contract covering:

- German Verbs parity and exclusions;
- first-example visibility and translation placement;
- card directions and answer secrecy;
- autoplay behavior;
- unit navigation;
- Phrases and Conversation preservation;
- level-wide due and favorite review;
- session planning and resume;
- storage compatibility;
- accessibility and responsive behavior;
- reviewer rejection conditions.

Success criteria:

- every behavior has a stable contract ID;
- a parity matrix covers German Verbs, A1, B2, and future levels;
- the shared-rendering ownership change is reflected in the code-fingerprint rules;
- superseded behavior is identified before tests are changed.

## Phase 2 — Vocabulary data foundation

### LEVEL-DATA-001 — Characterize existing content and IDs

- Record A1 and B2 unit counts.
- Record word counts per unit.
- Snapshot existing persisted word IDs.
- Test the raw row formats.
- Identify missing, discarded, and multilingual fields.
- Document B2 English/Arabic display and TTS requirements.

Success criteria:

- tests detect removed, duplicated, reordered, or changed IDs;
- content counts are frozen before parser changes;
- no vocabulary content is edited.

### LEVEL-DATA-002 — Introduce a normalized vocabulary card model

The internal model must support:

- level and unit identity;
- stable existing ID;
- German term;
- word type;
- translations identified by language;
- German examples;
- example translations identified by language;
- language-safe TTS text;
- optional metadata;
- temporary legacy aliases needed for compatibility.

Success criteria:

- existing IDs and stored progress remain valid;
- the A1 English example translation survives parsing;
- the B2 translated example survives parsing;
- the first German example and its translation are available to the card renderer;
- Arabic text is never sent to an English speech voice;
- old stored records still load.

### LEVEL-DATA-003 — Add deterministic content validation

Validate:

- duplicate or changed IDs;
- missing German terms;
- missing translations;
- missing or mismatched examples;
- invalid unit references;
- unsupported language metadata;
- duplicate words within a unit;
- accidental content-count changes.

The same validator will later gate B1 and A2 content.

## Phase 3 — Shared flashcard presentation

### SHARED-CARD-001 — Characterize German Verbs behavior

Add behavior tests before extraction for:

- front and back structure;
- term and translation placement;
- first-example visibility;
- example-translation visibility;
- audio and favorite controls;
- pointer and keyboard activation;
- answer secrecy;
- non-grading back interactions;
- mobile, focus, and reduced-motion behavior.

No production behavior changes belong in this task.

### SHARED-CARD-002 — Extract generic card presentation

The shared layer owns:

- generic front/back structure;
- labels and translated meaning;
- first example and its translation;
- audio and favorite controls;
- accessibility and flip behavior.

Adapters continue to own:

- verb-only details;
- Guided Challenge grading actions;
- ordinary-level SRS actions;
- navigation and persistence coordination.

Success criteria:

- German Verbs keeps its existing behavior;
- no persistence or scheduling logic moves into the renderer;
- English-to-German mode contains no German answer text or German audio before reveal;
- back controls cannot accidentally flip, grade, or advance a card.

### SHARED-CARD-003 — Adopt the shared card in A1 and B2

- Replace the legacy ordinary word-card presentation.
- Always show the first example and its translation on the revealed back.
- Preserve unit scope, SRS actions, favorites, and progress.
- Preserve Phrases and Conversation behavior.
- Add only direction modes supported safely by normalized data.

## Phase 4 — Shared autoplay

### AUDIO-001 — Extract a pure speech-sequence planner

Build deterministic speech steps from:

- German term;
- language-specific translation;
- German examples;
- example translations;
- repeat count;
- example mode;
- include-translation option;
- selected starting item.

Test the sequence without real audio or wall-clock waits.

### AUDIO-002 — Preserve German Verbs autoplay

Retain:

- repeat selection;
- example selection;
- include-English behavior;
- start-at-item behavior;
- pause, resume, and stop;
- active-row highlighting and scrolling;
- floating player state.

### AUDIO-003 — Add autoplay parity to level vocabulary

- Apply applicable controls to the selected unit and active filter.
- Use the first example on cards while allowing the configured example sequence in autoplay.
- Stop or explicitly replace the queue when switching units.
- Never speak hidden units unexpectedly.
- Never speak multilingual display text with the wrong voice.

## Phase 5 — Level-wide Review Center

### REVIEW-001 — Implement pure aggregation

For the current level only, calculate:

- total due cards;
- due cards by unit;
- total favorite cards;
- favorite cards by unit.

Rules:

- new/unseen cards are not “due review” cards;
- duplicates in storage do not duplicate cards;
- A1 and B2 are never mixed.

### REVIEW-002 — Implement deterministic session planning

Inputs:

- candidate card IDs;
- source: due or favorites;
- scope: all units or one unit;
- maximum size 50;
- stored shuffle seed.

Outputs:

- stable shuffled order;
- balanced chunks;
- session sizes;
- current-session identity.

### REVIEW-003 — Add the Review Center UI

- Add a level-wide destination outside unit tabs.
- Show totals and unit breakdowns.
- Support Review All and per-unit review.
- Show planned session sizes before starting.
- Show current-card, session, and remaining-session progress.
- Provide separate Due and Favorites sections.

### REVIEW-004 — Connect sessions to shared flashcards

- Reuse the shared card experience.
- Show the source unit during cross-unit sessions.
- Apply grading to the original level/unit SRS record.
- Do not create separate Review Center mastery data.

### REVIEW-005 — Persist exact local session resume

Persist:

- source and scope;
- shuffle seed;
- ordered IDs;
- chunk boundaries;
- current chunk;
- cursor;
- reveal state;
- timestamps.

Recommended first release policy:

- SRS and favorites remain cloud-synchronized;
- the active review queue is device-local;
- refresh on the same device resumes exactly;
- another device builds a new queue from synchronized SRS/favorite data.

## Phase 6 — Favorite sessions

### FAVORITES-001 — Complete universal favorite review

- Review all favorites or one unit.
- Use the same deterministic, maximum-50 planner.
- Do not treat favorites as automatically SRS-due.
- Update future counts when a card is unfavorited.
- Keep the active session stable until completion or explicit restart.

## Phase 7 — Focused refactoring

Refactoring follows green feature behavior and characterization tests. It must not become a big-bang rewrite.

### REFACTOR-001 — Decompose level orchestration

Extract focused responsibilities from `app.js`:

- level data adapter;
- Review Center controller;
- review-session state;
- audio orchestration;
- navigation integration.

### REFACTOR-002 — Decompose German Verbs orchestration

After shared behavior is stable, isolate:

- generic card presentation;
- speech planning;
- verb-specific details;
- Guided Challenge control;
- ordinary verbs glossary/flashcards.

### REFACTOR-003 — Consolidate repeated styles surgically

- Use semantic CSS classes for new shared elements.
- Do not mass-convert unrelated inline styles.

### REFACTOR-004 — Protect persisted IDs

- Preserve legacy A1/B2 IDs unless an explicit migration map exists.
- Block vocabulary reordering through snapshots.
- Give future levels deterministic IDs from their first release.

## Phase 8 — Documentation and reviewer rules

### DOCS-001 — Update architecture documentation

Document:

- shared card ownership;
- normalized vocabulary schema;
- Review Center data flow;
- audio ownership;
- persistence boundaries;
- how a new CEFR level plugs into the platform.

### DOCS-002 — Add the binding level-learning contract

Include feature parity, unit behavior, examples, autoplay, review aggregation, chunking, favorites, resume, data safety, accessibility, and non-goals.

### DOCS-003 — Add a small-model task template

Every task must state:

- task ID and exact goal;
- behavior before and after;
- allowed and forbidden files;
- relevant contract IDs;
- targeted tests;
- full-suite escalation rule;
- success criteria;
- storage/migration risk;
- handoff information.

### DOCS-004 — Add a reviewer acceptance matrix

Reject an implementation if:

- IDs change without migration;
- examples or translated examples are discarded;
- the first example or its translation is hidden on the revealed card;
- progress or favorites are reset;
- review mixes CEFR levels;
- unseen cards are counted as due;
- a session exceeds 50 cards;
- refresh reshuffles or restarts the session;
- cards are duplicated or omitted;
- Phrases or Conversation regress;
- German Verbs regresses;
- German answers leak before reveal;
- text is spoken using the wrong language voice;
- accessibility requirements are missed;
- unrelated broad refactoring is included.

## Phase 9 — Verification ladder

`contracts/TESTING_AND_SUCCESS.md` is the current portable verification authority. `VERIFY-001` in the detailed catalog is the release-wide verification package. The ladder applies during every implementation package, not only at the end of the roadmap.

Avoid rerunning expensive browser suites after every edit.

1. Syntax check changed JavaScript.
2. Run targeted parser/planner/renderer/audio unit tests.
3. Run tagged browser tests for the changed behavior.
4. Run affected A1 Chromium flows.
5. Run affected B2 Chromium flows.
6. Run the full unit suite once after implementation stabilizes.
7. Run the relevant full browser suite once after the final material edit.
8. Run the broad regression once before independent review.
9. Perform independent code and test-quality review.
10. Obtain owner/Codex acceptance.

Required cases include:

- correct first example and translated-example rendering;
- answer secrecy;
- pointer, Enter, and Space activation;
- safe back interactions;
- autoplay start/pause/resume/stop;
- due and favorite aggregation;
- 49, 50, 51, 100, and 101-card plans;
- no missing or duplicate cards;
- exact refresh/resume;
- per-unit sessions;
- Phrases and Conversation regression;
- mobile layout, 44×44 targets, focus-visible, reduced motion, and no overflow;
- storage compatibility;
- German Verbs regression.

## Phase 10 — B1 and A2 content, last

No new B1 or A2 content is published until the shared platform and content validator are complete.

### CONTENT-DECISION-001 — Choose the source

For each level, decide whether content is:

- owner-provided;
- AI-generated draft;
- imported from an approved licensed source;
- produced through a hybrid process.

### CONTENT-B1-001 — Validate and import B1

- assign deterministic IDs;
- validate translations and examples;
- detect duplicates within B1 and against other levels;
- freeze unit assignment before user progress exists;
- require owner approval before release.

### CONTENT-A2-001 — Generate or import A2

If AI-generated:

- treat the result as a draft;
- validate CEFR appropriateness;
- validate grammar, articles, plurals, examples, and translations;
- detect cross-level duplicates;
- record provenance and licensing/source information;
- require human approval before publication.

## Overall definition of success

- A1 and B2 ordinary cards use the applicable German Verbs experience.
- The first example and its translation are always visible on the revealed card back.
- Other examples remain available outside the card according to the reference experience.
- Autoplay reaches safe feature parity.
- Units remain the level structure.
- Phrases and Conversation remain functional.
- Due and favorite cards can be reviewed across the level or per unit.
- Every generated session is deterministic and contains at most 50 cards.
- Refresh resumes the exact active session.
- Existing IDs, SRS progress, favorites, and synchronized data remain safe.
- Future CEFR levels use the same platform through configuration and validated content.
- Documentation gives implementers precise behavior and gives reviewers objective acceptance and rejection rules.
