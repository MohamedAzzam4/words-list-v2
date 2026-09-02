// AUDIO-003: CEFR level autoplay adapter — the pure mapping between the
// ordinary-level glossary context and the AUDIO-001 speech-plan boundary.
//
// Contract refs:
// - FP-DESIGN-010: "speech-sequence planning is a pure calculation." This
//   module has no DOM, storage, Firebase, audio, or timer imports and
//   performs no I/O. Ordering (repeats, examples, translations, start
//   index) lives ONLY in planSpeechSequence(); no ordering logic is
//   duplicated here or in app.js.
// - LF-AUDIO: autoplay queue scope follows the current level's active
//   vocabulary filter. The filter rule is shared with the glossary render
//   (js/core/glossary.js imports this matcher), so the table and the audio
//   scope can never disagree.
// - AC-03 / AC-11: queue records carry per-step language text (mixed
//   English/Arabic values arrive as separately tagged planner steps) and
//   stable word identity for row highlighting.
//
// Purity invariants: the functions read their inputs and return fresh
// arrays/booleans; they never mutate cards, steps, filters, or sets.

/**
 * Thrown synchronously when an adapter input is outside the documented
 * valid shape. Mirrors the planner's refusal to silently default on
 * structurally invalid input.
 */
export class InvalidCefrAudioInputError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InvalidCefrAudioInputError';
    }
}

function isPositiveInteger(value) {
    return Number.isInteger(value) && value >= 1;
}

/**
 * The single vocabulary-filter rule for ordinary level cards. It mirrors
 * the glossary filter semantics exactly: 'all' admits every card, 'fav'
 * follows the favorite set, and any other value compares the card's type
 * case-insensitively (an unknown filter value matches nothing, like the
 * glossary's empty filtered table).
 *
 * `favoritesIds` may be a Set, any has(id) collection, or null/undefined
 * (treated as no favorites). The inputs are never mutated.
 */
export function matchesVocabularyFilter(card, typeFilter, favoritesIds) {
    if (typeFilter === 'all' || typeFilter === undefined || typeFilter === null) {
        return true;
    }
    if (typeFilter === 'fav') {
        return favoritesIds ? favoritesIds.has(card.id) : false;
    }
    const cardType = typeof card.type === 'string' ? card.type.toLowerCase() : '';
    return cardType === String(typeFilter).toLowerCase();
}

/**
 * Map planned speech steps onto SpeechQueue queue records for ordinary
 * level vocabulary.
 *
 * Inputs:
 * - `steps`: the `steps` array returned by planSpeechSequence() for the
 *   SAME ordered `cards` array (each step's `itemIndex` indexes into it).
 * - `cards`: the ordered normalized cards that were planned.
 * - `repeatCount`: optional positive integer (default 1) used only for the
 *   repeat-position label, mirroring the planner's repeat rule.
 *
 * Output: fresh queue records `{ wordId, wordDe, text, lang, segment,
 * label }`. `wordId`/`wordDe` come from the card at `step.itemIndex` (the
 * stable row identity the highlight callback resolves); `text`/`lang` come
 * from the step (exactly one language per record — mixed display values
 * never reach a single record).
 */
export function mapCefrSpeechStepsToQueueItems(steps, cards, repeatCount) {
    if (!Array.isArray(steps)) {
        throw new InvalidCefrAudioInputError('steps must be an array of planned speech steps.');
    }
    if (!Array.isArray(cards)) {
        throw new InvalidCefrAudioInputError('cards must be an array of normalized cards.');
    }
    const repeats = repeatCount === undefined ? 1 : repeatCount;
    if (!isPositiveInteger(repeats)) {
        throw new InvalidCefrAudioInputError(
            `repeatCount must be a positive integer (>= 1); received ${JSON.stringify(repeatCount)}.`
        );
    }

    return steps.map((step) => {
        const card = cards[step.itemIndex];
        if (!card) {
            throw new InvalidCefrAudioInputError(
                `step.itemIndex ${step.itemIndex} has no card in the planned list; steps and cards are misaligned.`
            );
        }
        const label = step.segment === 'term' ? `Word (${step.repeatIndex + 1}/${repeats})`
            : step.segment === 'term-translation' ? 'Translation'
            : step.segment === 'example' ? 'Example (DE)'
            : 'Example Translation';
        return {
            wordId: card.id,
            wordDe: card.de,
            text: step.text,
            lang: step.language,
            segment: step.segment,
            label
        };
    });
}
