// AUDIO-001: pure deterministic speech-sequence planner.
//
// Contract refs:
// - FP-DESIGN-010: "speech-sequence planning is a pure calculation."
//   This module has no DOM, storage, Firebase, audio, or timer imports and
//   performs no I/O. It reads normalized card data and options and returns a
//   fresh step list + warnings array.
// - LF-AUDIO: never send mixed English/Arabic display text to a single-
//   language voice. Missing language-specific text is skipped and reported;
//   it is never silently substituted from another language.
// - AC-03: English slash alternatives are kept intact; Arabic-only and mixed
//   data use separate language-specific text.
// - AC-11: repeat/examples/include-translation/start-at form exact
//   deterministic speech steps with stable item identity.
//
// Purity/determinism invariants:
// - The function reads its inputs and returns fresh arrays; it never mutates
//   items, cards, examples, arrays, or the options object.
// - No Date.now(), Math.random(), or other non-deterministic sources.
// - Same inputs always produce deep-equal outputs.

const VALID_EXAMPLE_MODES = new Set(['none', 'first', 'all']);

/**
 * Thrown synchronously when an option value is outside the documented valid
 * range. The planner refuses invalid options rather than silently defaulting.
 */
export class InvalidSpeechPlanOptionError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InvalidSpeechPlanOptionError';
    }
}

/**
 * Read a language-specific string safely. Missing speechText objects are
 * treated as all-empty; the planner never falls back to the display
 * translation, which may be mixed.
 */
function speechTextOf(card) {
    const s = card && card.speechText ? card.speechText : null;
    return {
        de: s && typeof s.de === 'string' ? s.de : '',
        en: s && typeof s.en === 'string' ? s.en : '',
        ar: s && typeof s.ar === 'string' ? s.ar : ''
    };
}

function isPositiveInteger(value) {
    return Number.isInteger(value) && value >= 1;
}

function isNonNegativeInteger(value) {
    return Number.isInteger(value) && value >= 0;
}

function validateOptions(options) {
    if (options === undefined || options === null) {
        options = {};
    }
    if (typeof options !== 'object' || Array.isArray(options)) {
        throw new InvalidSpeechPlanOptionError('options must be an object.');
    }

    // repeatCount: undefined -> 1; otherwise must be a positive integer.
    const repeatCount = options.repeatCount === undefined ? 1 : options.repeatCount;
    if (!isPositiveInteger(repeatCount)) {
        throw new InvalidSpeechPlanOptionError(
            `repeatCount must be a positive integer (>= 1); received ${JSON.stringify(options.repeatCount)}.`
        );
    }

    // exampleMode: undefined -> 'first'; otherwise must be a known value.
    const exampleMode = options.exampleMode === undefined ? 'first' : options.exampleMode;
    if (!VALID_EXAMPLE_MODES.has(exampleMode)) {
        throw new InvalidSpeechPlanOptionError(
            `exampleMode must be one of 'none', 'first', 'all'; received ${JSON.stringify(options.exampleMode)}.`
        );
    }

    // includeTranslation: undefined -> false; otherwise must be a boolean.
    const includeTranslation = options.includeTranslation === undefined ? false : options.includeTranslation;
    if (typeof includeTranslation !== 'boolean') {
        throw new InvalidSpeechPlanOptionError(
            `includeTranslation must be a boolean; received ${JSON.stringify(options.includeTranslation)}.`
        );
    }

    // startIndex: undefined -> 0; otherwise must be a non-negative integer.
    const startIndex = options.startIndex === undefined ? 0 : options.startIndex;
    if (!isNonNegativeInteger(startIndex)) {
        throw new InvalidSpeechPlanOptionError(
            `startIndex must be a non-negative integer; received ${JSON.stringify(options.startIndex)}.`
        );
    }

    return { repeatCount, exampleMode, includeTranslation, startIndex };
}

function pushStep(steps, itemId, itemIndex, repeatIndex, segment, exampleIndex, language, text) {
    steps.push({
        itemId,
        itemIndex,
        repeatIndex,
        segment,
        exampleIndex,
        language,
        text
    });
}

function pushSkip(warnings, itemId, segment, language, detail, exampleIndex) {
    warnings.push({
        kind: 'SKIPPED_EMPTY_TEXT',
        itemId,
        segment,
        exampleIndex,
        language,
        detail
    });
}

/**
 * Emit translation step(s) for a German term or example, following the
 * `translationLanguage` metadata exposed by the real normalized cards.
 * `mixed` emits two separate steps (en then ar); each step carries text in
 * exactly one language. Empty text is skipped with a warning and never
 * substituted from another language.
 */
function emitTranslationSteps(steps, warnings, itemId, itemIndex, repeatIndex, segment, exampleIndex, language, speech) {
    if (language === 'en') {
        if (speech.en !== '') {
            pushStep(steps, itemId, itemIndex, repeatIndex, segment, exampleIndex, 'en', speech.en);
        } else {
            pushSkip(warnings, itemId, segment, 'en', `${segment} speechText.en is empty; the English step was omitted without substituting another language.`, exampleIndex);
        }
    } else if (language === 'ar') {
        if (speech.ar !== '') {
            pushStep(steps, itemId, itemIndex, repeatIndex, segment, exampleIndex, 'ar', speech.ar);
        } else {
            pushSkip(warnings, itemId, segment, 'ar', `${segment} speechText.ar is empty; the Arabic step was omitted without substituting another language.`, exampleIndex);
        }
    } else if (language === 'mixed') {
        if (speech.en !== '') {
            pushStep(steps, itemId, itemIndex, repeatIndex, segment, exampleIndex, 'en', speech.en);
        } else {
            pushSkip(warnings, itemId, segment, 'en', `${segment} speechText.en is empty; the English step was omitted without substituting another language.`, exampleIndex);
        }
        if (speech.ar !== '') {
            pushStep(steps, itemId, itemIndex, repeatIndex, segment, exampleIndex, 'ar', speech.ar);
        } else {
            pushSkip(warnings, itemId, segment, 'ar', `${segment} speechText.ar is empty; the Arabic step was omitted without substituting another language.`, exampleIndex);
        }
    }
    // language === null: no translation exists; emit nothing and warn nothing.
}

function emitItemSteps(steps, warnings, card, itemIndex, repeatIndex, options) {
    const itemId = typeof card.id === 'string' ? card.id : (card.id === undefined ? '' : String(card.id));
    const speech = speechTextOf(card);

    // German term pronunciation.
    if (speech.de !== '') {
        pushStep(steps, itemId, itemIndex, repeatIndex, 'term', null, 'de', speech.de);
    } else {
        pushSkip(warnings, itemId, 'term', 'de', 'term speechText.de is empty; the German term step was omitted without substituting another language.', null);
    }

    // Term translation (only when requested). Real A1/B2 cards carry
    // `translationLanguage` ('en' | 'ar' | 'mixed' | null); the planner never
    // reads a synthetic `language` property.
    if (options.includeTranslation) {
        emitTranslationSteps(steps, warnings, itemId, itemIndex, repeatIndex, 'term-translation', null, card.translationLanguage, speech);
    }

    // Examples.
    const examples = Array.isArray(card.examples) ? card.examples : [];
    for (let i = 0; i < examples.length; i++) {
        if (options.exampleMode === 'none') break;
        if (options.exampleMode === 'first' && i > 0) break;

        const ex = examples[i];
        const exSpeech = speechTextOf(ex);
        if (exSpeech.de !== '') {
            pushStep(steps, itemId, itemIndex, repeatIndex, 'example', i, 'de', exSpeech.de);
        } else {
            pushSkip(warnings, itemId, 'example', 'de', `example[${i}] speechText.de is empty; the German example step was omitted without substituting another language.`, i);
        }
        if (options.includeTranslation) {
            emitTranslationSteps(steps, warnings, itemId, itemIndex, repeatIndex, 'example-translation', i, ex.translationLanguage, exSpeech);
        }
    }
}

/**
 * Plan a deterministic speech sequence from normalized CEFR cards.
 *
 * Inputs:
 * - `items`: array of normalized cards (may be empty). Each card exposes
 *   `id`, `translationLanguage` in {'en','ar','mixed',null},
 *   `speechText.{de,en,ar}`, and `examples[]` whose entries expose
 *   `translationLanguage` and `speechText.{de,en,ar}` — exactly the shape
 *   produced by the real A1/B2 parsers. No synthetic `language` property is
 *   read or required.
 * - `options`: optional fields with documented defaults:
 *   - `repeatCount` (positive integer, default 1)
 *   - `exampleMode` ('none' | 'first' | 'all', default 'first')
 *   - `includeTranslation` (boolean, default false)
 *   - `startIndex` (non-negative integer, default 0)
 *
 * Output: `{ steps: SpeechStep[], warnings: Warning[] }`. Each step carries
 * text in exactly one language. Missing language-specific text is skipped and
 * reported in `warnings`; it is never substituted from another language.
 * `itemIndex` always reports the item's ORIGINAL index in the input array;
 * `startIndex` selects where playback begins but never re-bases indices, and
 * `itemId` is stable across repeats.
 *
 * Ordering follows the existing Verbs autoplay controller
 * (`verbs-engine.js` playAllVerbsAudio): the outer loop walks the selected
 * items and the inner loop emits every repetition of the current item (term,
 * requested translation, requested examples) before the next repetition or
 * item.
 *
 * Throws `InvalidSpeechPlanOptionError` synchronously for invalid option
 * values or a non-array `items`. A `startIndex >= items.length` is NOT an
 * error: it returns an empty step list with an `OUT_OF_RANGE_START_INDEX`
 * warning.
 */
export function planSpeechSequence(items, options) {
    if (!Array.isArray(items)) {
        throw new InvalidSpeechPlanOptionError('items must be an array of normalized cards.');
    }
    const normalized = validateOptions(options);

    // An empty input list is a normal no-op: no steps, no warning. A
    // startIndex past the end of a non-empty list is genuinely out of range
    // and is reported so the caller can surface it consistently.
    if (items.length === 0) {
        return { steps: [], warnings: [] };
    }
    if (normalized.startIndex >= items.length) {
        return {
            steps: [],
            warnings: [{
                kind: 'OUT_OF_RANGE_START_INDEX',
                itemId: null,
                segment: null,
                exampleIndex: null,
                language: null,
                detail: `startIndex ${normalized.startIndex} is out of range for ${items.length} item${items.length === 1 ? '' : 's'}; the play list is empty.`
            }]
        };
    }

    const steps = [];
    const warnings = [];

    // Verbs autoplay order: items in the outer loop, repeats of the current
    // item in the inner loop. itemIndex is the item's original index in the
    // input array; startIndex selects the first item but never re-bases the
    // reported indices (verbs-engine.js keeps verb.index the same way).
    for (let itemIndex = normalized.startIndex; itemIndex < items.length; itemIndex++) {
        for (let repeatIndex = 0; repeatIndex < normalized.repeatCount; repeatIndex++) {
            emitItemSteps(steps, warnings, items[itemIndex], itemIndex, repeatIndex, normalized);
        }
    }

    return { steps, warnings };
}
