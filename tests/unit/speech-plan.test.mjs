// AUDIO-001: pure deterministic speech-sequence planner unit tests.
// Contract refs: FP-DESIGN-010 (speech-sequence planning is a pure
// calculation), TS-TEST-005 (independently specified expected outcomes;
// do not compute the oracle with the same algorithm under test),
// LF-AUDIO (no mixed display text under a single-language voice; missing
// language text is skipped/reported, never silently substituted), AC-03
// (English slash alternatives, Arabic-only, mixed data use separate
// language text), AC-11 (deterministic speech steps).
//
// Every expected `steps` array below is a hand-written literal; the planner
// is never used to derive the oracle. Helpers below are limited to fixture
// construction and deep-equal comparison primitives — they do not duplicate
// planner logic.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { planSpeechSequence, InvalidSpeechPlanOptionError } from '../../js/core/speech-plan.mjs';

// ---------------------------------------------------------------------------
// Fixture builders. These construct normalized-card-shaped inputs ONLY; they
// do not encode planner output. Each test asserts against a literal expected
// steps array defined inside the test body.
// ---------------------------------------------------------------------------

function termCard({ id = '1-0', de = 'das Wort', en = '', ar = '', language = null, examples = [] }) {
    return {
        id,
        levelId: 'a1',
        unitId: 1,
        de,
        language,
        translations: { en, ar },
        speechText: { de, en, ar },
        examples
    };
}

function example({ de = 'Ich sehe das Wort.', en = '', ar = '', translationLanguage = null }) {
    return {
        de,
        translation: en && ar ? `${en} / ${ar}` : (en || ar),
        translationLanguage,
        translations: { en, ar },
        speechText: { de, en, ar }
    };
}

// Deep-equality that orders keys deterministically (node assert.deepEqual is
// already order-independent; this is just a thin wrapper for readability).
function assertStepsEqual(actual, expected, message) {
    assert.deepEqual(actual, expected, message);
}

// ---------------------------------------------------------------------------
// 1. Zero, one, and many items
// ---------------------------------------------------------------------------

test('AUDIO-001: zero items produces an empty step list with no warnings', () => {
    const items = [];
    const result = planSpeechSequence(items, {});
    assertStepsEqual(result.steps, []);
    assert.deepEqual(result.warnings, []);
});

test('AUDIO-001: one item without examples and defaults produces one German term step', () => {
    const items = [termCard({ id: '1-0', de: 'das Wort', language: null })];
    const result = planSpeechSequence(items, {});
    assertStepsEqual(result.steps, [
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'das Wort' }
    ]);
    assert.deepEqual(result.warnings, []);
});

test('AUDIO-001: many items default options produce one term step per item in source order', () => {
    const items = [
        termCard({ id: '1-0', de: 'die Vorstellung, -en', language: null }),
        termCard({ id: '1-1', de: 'der Grafiker', language: null }),
        termCard({ id: '1-2', de: 'das Wort', language: null })
    ];
    const result = planSpeechSequence(items, {});
    assertStepsEqual(result.steps, [
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'die Vorstellung, -en' },
        { itemId: '1-1', itemIndex: 1, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'der Grafiker' },
        { itemId: '1-2', itemIndex: 2, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'das Wort' }
    ]);
    assert.deepEqual(result.warnings, []);
});

// ---------------------------------------------------------------------------
// 2. Repeat count and ordering
// ---------------------------------------------------------------------------

test('AUDIO-001: repeatCount=2 with two items emits term-1, term-2, term-1, term-2 (outer repeat, inner item)', () => {
    const items = [
        termCard({ id: '1-0', de: 'der Apfel', language: null }),
        termCard({ id: '1-1', de: 'die Birne', language: null })
    ];
    const result = planSpeechSequence(items, { repeatCount: 2 });
    assertStepsEqual(result.steps, [
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'der Apfel' },
        { itemId: '1-1', itemIndex: 1, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'die Birne' },
        { itemId: '1-0', itemIndex: 0, repeatIndex: 1, segment: 'term', exampleIndex: null, language: 'de', text: 'der Apfel' },
        { itemId: '1-1', itemIndex: 1, repeatIndex: 1, segment: 'term', exampleIndex: null, language: 'de', text: 'die Birne' }
    ]);
    assert.deepEqual(result.warnings, []);
});

test('AUDIO-001: repeatCount=3 on one item emits the term three times with ascending repeatIndex', () => {
    const items = [termCard({ id: '1-0', de: 'der Tisch', language: null })];
    const result = planSpeechSequence(items, { repeatCount: 3 });
    assertStepsEqual(result.steps, [
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'der Tisch' },
        { itemId: '1-0', itemIndex: 0, repeatIndex: 1, segment: 'term', exampleIndex: null, language: 'de', text: 'der Tisch' },
        { itemId: '1-0', itemIndex: 0, repeatIndex: 2, segment: 'term', exampleIndex: null, language: 'de', text: 'der Tisch' }
    ]);
    assert.deepEqual(result.warnings, []);
});

// ---------------------------------------------------------------------------
// 3. No/first/all examples
// ---------------------------------------------------------------------------

test('AUDIO-001: exampleMode none omits all example steps', () => {
    const items = [termCard({
        id: '1-0', de: 'das Wort', language: null,
        examples: [
            example({ de: 'Ich sehe das Wort.', en: 'I see the word.', translationLanguage: 'en' }),
            example({ de: 'Das Wort ist neu.', en: 'The word is new.', translationLanguage: 'en' })
        ]
    })];
    const result = planSpeechSequence(items, { exampleMode: 'none' });
    assertStepsEqual(result.steps, [
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'das Wort' }
    ]);
    assert.deepEqual(result.warnings, []);
});

test('AUDIO-001: exampleMode first emits only the first example', () => {
    const items = [termCard({
        id: '1-0', de: 'das Wort', language: null,
        examples: [
            example({ de: 'Ich sehe das Wort.', en: 'I see the word.', translationLanguage: 'en' }),
            example({ de: 'Das Wort ist neu.', en: 'The word is new.', translationLanguage: 'en' })
        ]
    })];
    const result = planSpeechSequence(items, { exampleMode: 'first' });
    assertStepsEqual(result.steps, [
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'das Wort' },
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'example', exampleIndex: 0, language: 'de', text: 'Ich sehe das Wort.' }
    ]);
    assert.deepEqual(result.warnings, []);
});

test('AUDIO-001: exampleMode all emits every example in source order', () => {
    const items = [termCard({
        id: '1-0', de: 'das Wort', language: null,
        examples: [
            example({ de: 'Ich sehe das Wort.', en: 'I see the word.', translationLanguage: 'en' }),
            example({ de: 'Das Wort ist neu.', en: 'The word is new.', translationLanguage: 'en' })
        ]
    })];
    const result = planSpeechSequence(items, { exampleMode: 'all' });
    assertStepsEqual(result.steps, [
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'das Wort' },
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'example', exampleIndex: 0, language: 'de', text: 'Ich sehe das Wort.' },
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'example', exampleIndex: 1, language: 'de', text: 'Das Wort ist neu.' }
    ]);
    assert.deepEqual(result.warnings, []);
});

// ---------------------------------------------------------------------------
// 4. Translation enabled and disabled
// ---------------------------------------------------------------------------

test('AUDIO-001: includeTranslation=false (default) omits translation steps even when text is available', () => {
    const items = [termCard({ id: '1-0', de: 'das Wort', en: 'the word', language: 'en', examples: [] })];
    const result = planSpeechSequence(items, {});
    assertStepsEqual(result.steps, [
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'das Wort' }
    ]);
    assert.deepEqual(result.warnings, []);
});

test('AUDIO-001: includeTranslation=true with English translation emits term then English translation', () => {
    const items = [termCard({ id: '1-0', de: 'das Wort', en: 'the word', language: 'en' })];
    const result = planSpeechSequence(items, { includeTranslation: true });
    assertStepsEqual(result.steps, [
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'das Wort' },
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'term-translation', exampleIndex: null, language: 'en', text: 'the word' }
    ]);
    assert.deepEqual(result.warnings, []);
});

// ---------------------------------------------------------------------------
// 5. Empty translation
// ---------------------------------------------------------------------------

test('AUDIO-001: empty English translation is skipped with a SKIPPED_EMPTY_TEXT warning, no substitution', () => {
    const items = [termCard({ id: '1-0', de: 'das Wort', en: '', language: 'en' })];
    const result = planSpeechSequence(items, { includeTranslation: true });
    assertStepsEqual(result.steps, [
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'das Wort' }
    ]);
    assert.equal(result.warnings.length, 1);
    assert.deepEqual(result.warnings[0], {
        kind: 'SKIPPED_EMPTY_TEXT',
        itemId: '1-0',
        segment: 'term-translation',
        exampleIndex: null,
        language: 'en',
        detail: 'term-translation speechText.en is empty; the English step was omitted without substituting another language.'
    });
});

// ---------------------------------------------------------------------------
// 6. English alternatives (slash)
// ---------------------------------------------------------------------------

test('AUDIO-001: English slash alternatives are kept intact in one English step and never split or reclassified', () => {
    const items = [termCard({ id: '1-0', de: 'die Vorstellung, -en', en: 'the presentation / the introduction', language: 'en' })];
    const result = planSpeechSequence(items, { includeTranslation: true });
    assertStepsEqual(result.steps, [
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'die Vorstellung, -en' },
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'term-translation', exampleIndex: null, language: 'en', text: 'the presentation / the introduction' }
    ]);
    assert.deepEqual(result.warnings, []);
});

// ---------------------------------------------------------------------------
// 7. Arabic-only and mixed-language values
// ---------------------------------------------------------------------------

test('AUDIO-001: Arabic-only translation emits an Arabic-language translation step, never English', () => {
    const items = [termCard({ id: '1-0', de: 'das Wort', ar: 'الكلمة', language: 'ar' })];
    const result = planSpeechSequence(items, { includeTranslation: true });
    assertStepsEqual(result.steps, [
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'das Wort' },
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'term-translation', exampleIndex: null, language: 'ar', text: 'الكلمة' }
    ]);
    assert.deepEqual(result.warnings, []);
});

test('AUDIO-001: mixed translation language emits two separate steps (en then ar), never one merged step', () => {
    const items = [termCard({ id: '1-0', de: 'das Wort', en: 'the word', ar: 'الكلمة', language: 'mixed' })];
    const result = planSpeechSequence(items, { includeTranslation: true });
    assertStepsEqual(result.steps, [
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'das Wort' },
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'term-translation', exampleIndex: null, language: 'en', text: 'the word' },
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'term-translation', exampleIndex: null, language: 'ar', text: 'الكلمة' }
    ]);
    assert.deepEqual(result.warnings, []);
});

test('AUDIO-001: mixed-language example translation emits example, en-translation, ar-translation as separate steps', () => {
    const items = [termCard({
        id: '1-0', de: 'das Wort', language: null,
        examples: [
            example({ de: 'Das Wort ist neu.', en: 'The word is new.', ar: 'الكلمة جديدة.', translationLanguage: 'mixed' })
        ]
    })];
    const result = planSpeechSequence(items, { exampleMode: 'first', includeTranslation: true });
    assertStepsEqual(result.steps, [
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'das Wort' },
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'example', exampleIndex: 0, language: 'de', text: 'Das Wort ist neu.' },
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'example-translation', exampleIndex: 0, language: 'en', text: 'The word is new.' },
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'example-translation', exampleIndex: 0, language: 'ar', text: 'الكلمة جديدة.' }
    ]);
    assert.deepEqual(result.warnings, []);
});

// ---------------------------------------------------------------------------
// 8. Starting index: first, middle, last, out of range
// ---------------------------------------------------------------------------

test('AUDIO-001: startIndex 0 plays the full sequence', () => {
    const items = [
        termCard({ id: '1-0', de: 'der Apfel', language: null }),
        termCard({ id: '1-1', de: 'die Birne', language: null }),
        termCard({ id: '1-2', de: 'die Traube', language: null })
    ];
    const result = planSpeechSequence(items, { startIndex: 0 });
    assertStepsEqual(result.steps, [
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'der Apfel' },
        { itemId: '1-1', itemIndex: 1, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'die Birne' },
        { itemId: '1-2', itemIndex: 2, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'die Traube' }
    ]);
    assert.deepEqual(result.warnings, []);
});

test('AUDIO-001: startIndex in the middle plays from that item to the end with itemIndex re-based at 0', () => {
    const items = [
        termCard({ id: '1-0', de: 'der Apfel', language: null }),
        termCard({ id: '1-1', de: 'die Birne', language: null }),
        termCard({ id: '1-2', de: 'die Traube', language: null })
    ];
    const result = planSpeechSequence(items, { startIndex: 1 });
    assertStepsEqual(result.steps, [
        { itemId: '1-1', itemIndex: 0, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'die Birne' },
        { itemId: '1-2', itemIndex: 1, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'die Traube' }
    ]);
    assert.deepEqual(result.warnings, []);
});

test('AUDIO-001: startIndex at the last item plays exactly that item', () => {
    const items = [
        termCard({ id: '1-0', de: 'der Apfel', language: null }),
        termCard({ id: '1-1', de: 'die Birne', language: null }),
        termCard({ id: '1-2', de: 'die Traube', language: null })
    ];
    const result = planSpeechSequence(items, { startIndex: 2 });
    assertStepsEqual(result.steps, [
        { itemId: '1-2', itemIndex: 0, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'die Traube' }
    ]);
    assert.deepEqual(result.warnings, []);
});

test('AUDIO-001: startIndex out of range produces an empty step list with an OUT_OF_RANGE_START_INDEX warning', () => {
    const items = [
        termCard({ id: '1-0', de: 'der Apfel', language: null }),
        termCard({ id: '1-1', de: 'die Birne', language: null }),
        termCard({ id: '1-2', de: 'die Traube', language: null })
    ];
    const result = planSpeechSequence(items, { startIndex: 5 });
    assertStepsEqual(result.steps, []);
    assert.equal(result.warnings.length, 1);
    assert.deepEqual(result.warnings[0], {
        kind: 'OUT_OF_RANGE_START_INDEX',
        itemId: null,
        segment: null,
        exampleIndex: null,
        language: null,
        detail: 'startIndex 5 is out of range for 3 items; the play list is empty.'
    });
});

// ---------------------------------------------------------------------------
// 9. Invalid options
// ---------------------------------------------------------------------------

test('AUDIO-001: invalid exampleMode throws InvalidSpeechPlanOptionError', () => {
    const items = [termCard({ id: '1-0', de: 'das Wort' })];
    assert.throws(
        () => planSpeechSequence(items, { exampleMode: 'xyz' }),
        (err) => err instanceof InvalidSpeechPlanOptionError && /exampleMode/.test(err.message)
    );
});

test('AUDIO-001: repeatCount 0 throws InvalidSpeechPlanOptionError', () => {
    const items = [termCard({ id: '1-0', de: 'das Wort' })];
    assert.throws(
        () => planSpeechSequence(items, { repeatCount: 0 }),
        (err) => err instanceof InvalidSpeechPlanOptionError && /repeatCount/.test(err.message)
    );
});

test('AUDIO-001: negative repeatCount throws InvalidSpeechPlanOptionError', () => {
    const items = [termCard({ id: '1-0', de: 'das Wort' })];
    assert.throws(
        () => planSpeechSequence(items, { repeatCount: -1 }),
        (err) => err instanceof InvalidSpeechPlanOptionError && /repeatCount/.test(err.message)
    );
});

test('AUDIO-001: non-boolean includeTranslation throws InvalidSpeechPlanOptionError', () => {
    const items = [termCard({ id: '1-0', de: 'das Wort' })];
    assert.throws(
        () => planSpeechSequence(items, { includeTranslation: 'yes' }),
        (err) => err instanceof InvalidSpeechPlanOptionError && /includeTranslation/.test(err.message)
    );
});

test('AUDIO-001: negative startIndex throws InvalidSpeechPlanOptionError', () => {
    const items = [termCard({ id: '1-0', de: 'das Wort' })];
    assert.throws(
        () => planSpeechSequence(items, { startIndex: -1 }),
        (err) => err instanceof InvalidSpeechPlanOptionError && /startIndex/.test(err.message)
    );
});

test('AUDIO-001: non-integer startIndex throws InvalidSpeechPlanOptionError', () => {
    const items = [termCard({ id: '1-0', de: 'das Wort' })];
    assert.throws(
        () => planSpeechSequence(items, { startIndex: 1.5 }),
        (err) => err instanceof InvalidSpeechPlanOptionError && /startIndex/.test(err.message)
    );
});

test('AUDIO-001: items not an array throws InvalidSpeechPlanOptionError', () => {
    assert.throws(
        () => planSpeechSequence('not-an-array', {}),
        (err) => err instanceof InvalidSpeechPlanOptionError && /items/.test(err.message)
    );
});

// ---------------------------------------------------------------------------
// 10. Stable item identities
// ---------------------------------------------------------------------------

test('AUDIO-001: every step carries the source card id and correctly-ordered itemIndex/repeatIndex/exampleIndex', () => {
    const items = [
        termCard({
            id: '1-0', de: 'das Wort', language: 'mixed', en: 'the word', ar: 'الكلمة',
            examples: [
                example({ de: 'Ich sehe das Wort.', en: 'I see the word.', ar: 'الكلمة جديدة.', translationLanguage: 'mixed' }),
                example({ de: 'Das Wort ist neu.', en: 'The word is new.', ar: 'الكلمة جديدة.', translationLanguage: 'en' })
            ]
        })
    ];
    const result = planSpeechSequence(items, { repeatCount: 2, exampleMode: 'all', includeTranslation: true });
    assertStepsEqual(result.steps, [
        // Repeat 0
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'das Wort' },
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'term-translation', exampleIndex: null, language: 'en', text: 'the word' },
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'term-translation', exampleIndex: null, language: 'ar', text: 'الكلمة' },
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'example', exampleIndex: 0, language: 'de', text: 'Ich sehe das Wort.' },
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'example-translation', exampleIndex: 0, language: 'en', text: 'I see the word.' },
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'example-translation', exampleIndex: 0, language: 'ar', text: 'الكلمة جديدة.' },
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'example', exampleIndex: 1, language: 'de', text: 'Das Wort ist neu.' },
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'example-translation', exampleIndex: 1, language: 'en', text: 'The word is new.' },
        // Repeat 1
        { itemId: '1-0', itemIndex: 0, repeatIndex: 1, segment: 'term', exampleIndex: null, language: 'de', text: 'das Wort' },
        { itemId: '1-0', itemIndex: 0, repeatIndex: 1, segment: 'term-translation', exampleIndex: null, language: 'en', text: 'the word' },
        { itemId: '1-0', itemIndex: 0, repeatIndex: 1, segment: 'term-translation', exampleIndex: null, language: 'ar', text: 'الكلمة' },
        { itemId: '1-0', itemIndex: 0, repeatIndex: 1, segment: 'example', exampleIndex: 0, language: 'de', text: 'Ich sehe das Wort.' },
        { itemId: '1-0', itemIndex: 0, repeatIndex: 1, segment: 'example-translation', exampleIndex: 0, language: 'en', text: 'I see the word.' },
        { itemId: '1-0', itemIndex: 0, repeatIndex: 1, segment: 'example-translation', exampleIndex: 0, language: 'ar', text: 'الكلمة جديدة.' },
        { itemId: '1-0', itemIndex: 0, repeatIndex: 1, segment: 'example', exampleIndex: 1, language: 'de', text: 'Das Wort ist neu.' },
        { itemId: '1-0', itemIndex: 0, repeatIndex: 1, segment: 'example-translation', exampleIndex: 1, language: 'en', text: 'The word is new.' }
    ]);
    assert.deepEqual(result.warnings, []);
});

// ---------------------------------------------------------------------------
// 11. Input immutability
// ---------------------------------------------------------------------------

test('AUDIO-001: planSpeechSequence never mutates items, cards, examples, or options', () => {
    const items = [
        termCard({
            id: '1-0', de: 'das Wort', language: 'mixed', en: 'the word', ar: 'الكلمة',
            examples: [example({ de: 'Ich sehe das Wort.', en: 'I see the word.', ar: 'الكلمة جديدة.', translationLanguage: 'mixed' })]
        })
    ];
    const options = { repeatCount: 2, exampleMode: 'all', includeTranslation: true, startIndex: 0 };
    const itemsSnapshot = JSON.parse(JSON.stringify(items));
    const optionsSnapshot = JSON.parse(JSON.stringify(options));
    const result = planSpeechSequence(items, options);
    assert.notEqual(result.steps.length, 0, 'sanity: the planner produced steps');
    // Source arrays/objects must be byte-identical to their pre-call state.
    assert.deepEqual(items, itemsSnapshot, 'items array and contents are unchanged');
    assert.deepEqual(options, optionsSnapshot, 'options object is unchanged');
    // The planner must not retain references to source objects inside steps.
    for (const step of result.steps) {
        assert.equal(typeof step.text, 'string');
        assert.equal(typeof step.itemId, 'string');
        assert.equal(Array.isArray(step), false);
    }
});

// ---------------------------------------------------------------------------
// 12. Repeated-call determinism
// ---------------------------------------------------------------------------

test('AUDIO-001: two calls with the same inputs produce deep-equal results (fresh arrays each call)', () => {
    const items = [
        termCard({ id: '1-0', de: 'das Wort', language: 'mixed', en: 'the word', ar: 'الكلمة', examples: [] }),
        termCard({ id: '1-1', de: 'der Tisch', language: 'en', en: 'the table', examples: [] })
    ];
    const options = { repeatCount: 2, exampleMode: 'none', includeTranslation: true, startIndex: 0 };
    const a = planSpeechSequence(items, options);
    const b = planSpeechSequence(items, options);
    assert.notEqual(a, b, 'each call returns a fresh result object');
    assert.notEqual(a.steps, b.steps, 'each call returns a fresh steps array');
    assert.deepEqual(a, b, 'the two results are deep-equal');
});

test('AUDIO-001: deterministic ordering holds for many items with repeats and translations', () => {
    const items = [];
    for (let i = 0; i < 5; i++) {
        items.push(termCard({ id: `1-${i}`, de: `der Begriff ${i}`, language: 'en', en: `the term ${i}` }));
    }
    const result = planSpeechSequence(items, { repeatCount: 2, includeTranslation: true });
    // Expect: for each repeat, for each item: term-de, term-translation-en.
    assert.equal(result.steps.length, 5 * 2 * 2);
    assert.equal(result.steps[0].text, 'der Begriff 0');
    assert.equal(result.steps[1].text, 'the term 0');
    assert.equal(result.steps[2].text, 'der Begriff 1');
    assert.equal(result.steps[18].text, 'der Begriff 4');
    assert.equal(result.steps[19].text, 'the term 4');
    assert.equal(result.steps[0].repeatIndex, 0);
    assert.equal(result.steps[19].repeatIndex, 1);
    assert.equal(result.steps[19].itemIndex, 4);
});
