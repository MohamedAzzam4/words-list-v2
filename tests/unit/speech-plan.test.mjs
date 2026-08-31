// AUDIO-001-C1: corrected speech-sequence planner unit tests.
//
// Correction scope (owner review findings on AUDIO-001 attempt 01):
// 1. Real normalized metadata: real A1 and B2 cards expose
//    `translationLanguage` and `speechText.{de,en,ar}`; they do NOT expose
//    the synthetic `language` property the first attempt read. The planner
//    must use `card.translationLanguage` for term translations (examples
//    keep using `example.translationLanguage`), and no redundant `language`
//    alias may be required or introduced anywhere.
// 2. Repeat semantics: the existing Verbs autoplay controller
//    (js/core/verbs-engine.js playAllVerbsAudio) iterates selected items in
//    the outer loop and repeats of the current item in the inner loop. For
//    two items and repeatCount 2 the required order is item 1 repeat 0,
//    item 1 repeat 1, item 2 repeat 0, item 2 repeat 1; every item
//    repetition contains that item's term, requested translation, and
//    requested examples before the next repetition or item.
// 3. Stable source indexing: itemIndex is the item's ORIGINAL index in the
//    input array. startIndex selects where playback begins but never
//    re-bases indices; itemId stays unchanged.
//
// Contract refs: FP-DESIGN-010 (speech-sequence planning is a pure
// calculation), TS-TEST-005 (independently specified expected outcomes; do
// not compute the oracle with the same algorithm under test), LF-AUDIO (no
// mixed display text under a single-language voice; missing language text is
// skipped/reported, never silently substituted), AC-03 (English slash
// alternatives, Arabic-only, mixed data use separate language text), AC-11
// (deterministic speech steps with stable item identity).
//
// Every expected `steps` array below is a hand-written literal; the planner
// is never used to derive the oracle. Parser-card expectations transcribe
// the raw source data rows (data content, not planner output). Helpers below
// are limited to fixture construction and deep-equal comparison primitives.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

import { planSpeechSequence, InvalidSpeechPlanOptionError } from '../../js/core/speech-plan.mjs';

// ---------------------------------------------------------------------------
// Real parser loading. The actual A1/B2 parsers run in a VM sandbox (same
// pattern as tests/unit/level-data.test.mjs) so planner tests exercise cards
// produced by the real production parsers, including cards taken from the
// real shipped datasets.
// ---------------------------------------------------------------------------

function loadLevelConfig(relativePath, parserName) {
    const source = readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8')
        .replace(/^export\s+/gm, '');
    const sandbox = {};
    vm.createContext(sandbox);
    vm.runInContext(
        source + `\n;globalThis.__LEVEL = { levelConfig, parser: ${parserName} };`,
        sandbox,
        { filename: relativePath }
    );
    return sandbox.__LEVEL;
}

const a1 = loadLevelConfig('js/levels/a1.config.js', 'parseRawData');
const b2 = loadLevelConfig('js/levels/b2.config.js', 'parseRawB2Data');

// Cards produced by the actual parsers from synthetic raw rows.
const parsedA1Card = a1.parser([
    '7|n|der Tisch|table|Der Tisch ist groß.|The table is big.'
])[6][0];
const parsedB2MixedCard = b2.parser([
    '4||die Verspätung, -en|delay / التأخير|Der Zug hat Verspätung.|The train is delayed. / القطار متأخر.'
])[3][0];
const parsedB2ArabicCard = b2.parser([
    '4||der Roboter|الروبوت|Der Roboter arbeitet.|الروبوت يعمل.'
])[3][0];

// Cards produced by the actual parsers from the real shipped datasets.
// Real A1 dataset row 1: "1|e|Hallo!|Hello!|Hallo, ich bin Anna.|Hello, I am Anna."
const realA1DatasetCard = a1.levelConfig.vocabulary[0][0];
// Real B2 dataset card located by its display translation, the same lookup
// regression fixtures use in tests/unit/level-data.test.mjs (raw rows are
// not unit-sorted, so positional lookup is unsafe).
// Real B2 dataset row 19: "19||die EDV (Sg.)|IT / edv|Ich bin für die EDV in unserer Firma zuständig.|I am responsible for the IT in our company. / أنا مسؤول عن تكنولوجيا المعلومات في شركتنا."
const realB2DatasetCard = b2.levelConfig.vocabulary.flat().find(card => card.translation === 'IT / edv');

// ---------------------------------------------------------------------------
// Fixture builders. These construct normalized-card-shaped inputs ONLY; they
// mirror the real parser output shape (id, levelId, unitId, de, legacy
// aliases, translationLanguage, translations, speechText, examples) and never
// set a `language` property. They do not encode planner output; every
// expected steps array is a hand-written literal inside the test body.
// ---------------------------------------------------------------------------

function example({ de = 'Ich sehe das Wort.', en = '', ar = '', translationLanguage = null }) {
    return {
        de,
        translation: en && ar ? `${en} / ${ar}` : (en || ar),
        translationLanguage,
        translations: { en, ar },
        speechText: { de, en, ar }
    };
}

function termCard({ id = '1-0', levelId = 'a1', unitId = 1, de = 'das Wort', en = '', ar = '', translationLanguage = null, examples = [] }) {
    return {
        id,
        levelId,
        unitId,
        de,
        en,
        type: 'n',
        context: examples.length > 0 ? examples[0].de : '',
        translation: en && ar ? `${en} / ${ar}` : (en || ar),
        translationLanguage,
        translations: { en, ar },
        speechText: { de, en, ar },
        exampleDe: examples.length > 0 ? examples[0].de : '',
        exampleTranslation: examples.length > 0 ? examples[0].translation : '',
        exampleTranslationLanguage: examples.length > 0 ? examples[0].translationLanguage : null,
        examples
    };
}

// Deep-equality wrapper for readability; node assert.deepEqual is already
// order-independent.
function assertStepsEqual(actual, expected, message) {
    assert.deepEqual(actual, expected, message);
}

// ---------------------------------------------------------------------------
// 1. Zero, one, and many items
// ---------------------------------------------------------------------------

test('AUDIO-001-C1: zero items produces an empty step list with no warnings', () => {
    const result = planSpeechSequence([], {});
    assertStepsEqual(result.steps, []);
    assert.deepEqual(result.warnings, []);
});

test('AUDIO-001-C1: one item without examples and defaults produces one German term step', () => {
    const items = [termCard({ id: '1-0', de: 'das Wort' })];
    const result = planSpeechSequence(items, {});
    assertStepsEqual(result.steps, [
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'das Wort' }
    ]);
    assert.deepEqual(result.warnings, []);
});

test('AUDIO-001-C1: many items with default options produce one term step per item in source order', () => {
    const items = [
        termCard({ id: '1-0', de: 'die Vorstellung, -en' }),
        termCard({ id: '1-1', de: 'der Grafiker' }),
        termCard({ id: '1-2', de: 'das Wort' })
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
// 2. Normalized term translations use card.translationLanguage (C1 finding 1)
// ---------------------------------------------------------------------------

test('AUDIO-001-C1: normalized A1-shaped card with translationLanguage "en" emits term then English term-translation', () => {
    const items = [termCard({ id: '7-0', unitId: 7, de: 'der Tisch', en: 'table', translationLanguage: 'en' })];
    const result = planSpeechSequence(items, { includeTranslation: true });
    assertStepsEqual(result.steps, [
        { itemId: '7-0', itemIndex: 0, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'der Tisch' },
        { itemId: '7-0', itemIndex: 0, repeatIndex: 0, segment: 'term-translation', exampleIndex: null, language: 'en', text: 'table' }
    ]);
    assert.deepEqual(result.warnings, []);
});

test('AUDIO-001-C1: normalized B2 mixed card with translationLanguage "mixed" emits term, en, then ar term-translations', () => {
    const items = [termCard({ id: '4-0', levelId: 'b2', unitId: 4, de: 'die Verspätung, -en', en: 'delay', ar: 'التأخير', translationLanguage: 'mixed' })];
    const result = planSpeechSequence(items, { includeTranslation: true });
    assertStepsEqual(result.steps, [
        { itemId: '4-0', itemIndex: 0, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'die Verspätung, -en' },
        { itemId: '4-0', itemIndex: 0, repeatIndex: 0, segment: 'term-translation', exampleIndex: null, language: 'en', text: 'delay' },
        { itemId: '4-0', itemIndex: 0, repeatIndex: 0, segment: 'term-translation', exampleIndex: null, language: 'ar', text: 'التأخير' }
    ]);
    assert.deepEqual(result.warnings, []);
});

test('AUDIO-001-C1: Arabic-only normalized card with translationLanguage "ar" emits term then Arabic term-translation, never English', () => {
    const items = [termCard({ id: '4-0', levelId: 'b2', unitId: 4, de: 'der Roboter', ar: 'الروبوت', translationLanguage: 'ar' })];
    const result = planSpeechSequence(items, { includeTranslation: true });
    assertStepsEqual(result.steps, [
        { itemId: '4-0', itemIndex: 0, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'der Roboter' },
        { itemId: '4-0', itemIndex: 0, repeatIndex: 0, segment: 'term-translation', exampleIndex: null, language: 'ar', text: 'الروبوت' }
    ]);
    assert.deepEqual(result.warnings, []);
});

test('AUDIO-001-C1: null translationLanguage emits no term-translation step and no warning even when translation text exists', () => {
    const items = [termCard({ id: '1-0', de: 'das Wort', en: 'the word', translationLanguage: null })];
    const result = planSpeechSequence(items, { includeTranslation: true });
    assertStepsEqual(result.steps, [
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'das Wort' }
    ]);
    assert.deepEqual(result.warnings, []);
});

test('AUDIO-001-C1: a stale synthetic card.language property is ignored; term translation follows card.translationLanguage', () => {
    // Negative fixture: a card that still carries the synthetic `language`
    // property from the first attempt. The corrected planner must not read
    // it; term translations follow `translationLanguage` only.
    const staleCard = {
        ...termCard({ id: '1-0', de: 'das Wort', en: 'the word', translationLanguage: 'en' }),
        language: 'ar'
    };
    const result = planSpeechSequence([staleCard], { includeTranslation: true });
    assertStepsEqual(result.steps, [
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'das Wort' },
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'term-translation', exampleIndex: null, language: 'en', text: 'the word' }
    ]);
    assert.deepEqual(result.warnings, []);
});

// ---------------------------------------------------------------------------
// 3. Cards produced by the actual A1/B2 parsers (C1 finding 1)
// ---------------------------------------------------------------------------

test('AUDIO-001-C1: a card produced by the actual A1 parser plans term, en term-translation, example, and en example-translation steps', () => {
    const result = planSpeechSequence([parsedA1Card], { includeTranslation: true });
    assertStepsEqual(result.steps, [
        { itemId: '7-0', itemIndex: 0, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'der Tisch' },
        { itemId: '7-0', itemIndex: 0, repeatIndex: 0, segment: 'term-translation', exampleIndex: null, language: 'en', text: 'table' },
        { itemId: '7-0', itemIndex: 0, repeatIndex: 0, segment: 'example', exampleIndex: 0, language: 'de', text: 'Der Tisch ist groß.' },
        { itemId: '7-0', itemIndex: 0, repeatIndex: 0, segment: 'example-translation', exampleIndex: 0, language: 'en', text: 'The table is big.' }
    ]);
    assert.deepEqual(result.warnings, []);
});

test('AUDIO-001-C1: a mixed card produced by the actual B2 parser plans term, en/ar term-translations, and en/ar example-translations', () => {
    const result = planSpeechSequence([parsedB2MixedCard], { includeTranslation: true });
    assertStepsEqual(result.steps, [
        { itemId: '4-0', itemIndex: 0, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'die Verspätung, -en' },
        { itemId: '4-0', itemIndex: 0, repeatIndex: 0, segment: 'term-translation', exampleIndex: null, language: 'en', text: 'delay' },
        { itemId: '4-0', itemIndex: 0, repeatIndex: 0, segment: 'term-translation', exampleIndex: null, language: 'ar', text: 'التأخير' },
        { itemId: '4-0', itemIndex: 0, repeatIndex: 0, segment: 'example', exampleIndex: 0, language: 'de', text: 'Der Zug hat Verspätung.' },
        { itemId: '4-0', itemIndex: 0, repeatIndex: 0, segment: 'example-translation', exampleIndex: 0, language: 'en', text: 'The train is delayed.' },
        { itemId: '4-0', itemIndex: 0, repeatIndex: 0, segment: 'example-translation', exampleIndex: 0, language: 'ar', text: 'القطار متأخر.' }
    ]);
    assert.deepEqual(result.warnings, []);
});

test('AUDIO-001-C1: an Arabic-only card produced by the actual B2 parser plans term, Arabic term-translation, example, and Arabic example-translation', () => {
    const result = planSpeechSequence([parsedB2ArabicCard], { includeTranslation: true });
    assertStepsEqual(result.steps, [
        { itemId: '4-0', itemIndex: 0, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'der Roboter' },
        { itemId: '4-0', itemIndex: 0, repeatIndex: 0, segment: 'term-translation', exampleIndex: null, language: 'ar', text: 'الروبوت' },
        { itemId: '4-0', itemIndex: 0, repeatIndex: 0, segment: 'example', exampleIndex: 0, language: 'de', text: 'Der Roboter arbeitet.' },
        { itemId: '4-0', itemIndex: 0, repeatIndex: 0, segment: 'example-translation', exampleIndex: 0, language: 'ar', text: 'الروبوت يعمل.' }
    ]);
    assert.deepEqual(result.warnings, []);
});

test('AUDIO-001-C1: a real A1 dataset card plans term, en term-translation, example, and en example-translation steps', () => {
    const result = planSpeechSequence([realA1DatasetCard], { includeTranslation: true });
    assertStepsEqual(result.steps, [
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'Hallo!' },
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'term-translation', exampleIndex: null, language: 'en', text: 'Hello!' },
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'example', exampleIndex: 0, language: 'de', text: 'Hallo, ich bin Anna.' },
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'example-translation', exampleIndex: 0, language: 'en', text: 'Hello, I am Anna.' }
    ]);
    assert.deepEqual(result.warnings, []);
});

test('AUDIO-001-C1: a real B2 dataset card keeps slash alternatives in one en step and splits its mixed example into en and ar steps', () => {
    const result = planSpeechSequence([realB2DatasetCard], { includeTranslation: true });
    assertStepsEqual(result.steps, [
        { itemId: '19-74', itemIndex: 0, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'die EDV (Sg.)' },
        { itemId: '19-74', itemIndex: 0, repeatIndex: 0, segment: 'term-translation', exampleIndex: null, language: 'en', text: 'IT / edv' },
        { itemId: '19-74', itemIndex: 0, repeatIndex: 0, segment: 'example', exampleIndex: 0, language: 'de', text: 'Ich bin für die EDV in unserer Firma zuständig.' },
        { itemId: '19-74', itemIndex: 0, repeatIndex: 0, segment: 'example-translation', exampleIndex: 0, language: 'en', text: 'I am responsible for the IT in our company.' },
        { itemId: '19-74', itemIndex: 0, repeatIndex: 0, segment: 'example-translation', exampleIndex: 0, language: 'ar', text: 'أنا مسؤول عن تكنولوجيا المعلومات في شركتنا.' }
    ]);
    assert.deepEqual(result.warnings, []);
});

// ---------------------------------------------------------------------------
// 4. card.language is neither required nor introduced (C1 finding 1)
// ---------------------------------------------------------------------------

test('AUDIO-001-C1: card.language is neither required nor introduced on normalized cards', () => {
    // Every real parser-produced card must lack the synthetic property...
    const parserCards = [parsedA1Card, parsedB2MixedCard, parsedB2ArabicCard, realA1DatasetCard, realB2DatasetCard];
    for (const card of parserCards) {
        assert.equal(
            Object.prototype.hasOwnProperty.call(card, 'language'),
            false,
            `parser card ${card.id} must not expose a synthetic language property`
        );
    }

    // ...and planning must not introduce it or otherwise mutate the cards.
    const items = [termCard({ id: '1-0', de: 'das Wort', en: 'the word', translationLanguage: 'en' })];
    const snapshot = JSON.parse(JSON.stringify(items));
    const result = planSpeechSequence(items, { includeTranslation: true, repeatCount: 2 });
    assert.notEqual(result.steps.length, 0, 'sanity: the planner produced steps');
    assert.deepEqual(items, snapshot, 'planning must not add a language property or otherwise mutate cards');
    for (const card of items) {
        assert.equal(Object.prototype.hasOwnProperty.call(card, 'language'), false);
    }
});

// ---------------------------------------------------------------------------
// 5. Repeat semantics: item-major, repeat-minor (C1 finding 2, Verbs order)
// ---------------------------------------------------------------------------

test('AUDIO-001-C1: two items with repeatCount 2 emit item 1 both repeats then item 2 both repeats (Verbs autoplay order)', () => {
    const items = [
        termCard({ id: '1-0', de: 'der Apfel' }),
        termCard({ id: '1-1', de: 'die Birne' })
    ];
    const result = planSpeechSequence(items, { repeatCount: 2 });
    assertStepsEqual(result.steps, [
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'der Apfel' },
        { itemId: '1-0', itemIndex: 0, repeatIndex: 1, segment: 'term', exampleIndex: null, language: 'de', text: 'der Apfel' },
        { itemId: '1-1', itemIndex: 1, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'die Birne' },
        { itemId: '1-1', itemIndex: 1, repeatIndex: 1, segment: 'term', exampleIndex: null, language: 'de', text: 'die Birne' }
    ]);
    assert.deepEqual(result.warnings, []);
});

test('AUDIO-001-C1: each item repetition contains its term, requested translation, and requested examples before the next repetition or item', () => {
    const items = [
        termCard({
            id: '1-0', de: 'das Wort', en: 'the word', translationLanguage: 'en',
            examples: [example({ de: 'Ich sehe das Wort.', en: 'I see the word.', translationLanguage: 'en' })]
        }),
        termCard({
            id: '1-1', de: 'der Tisch', en: 'the table', translationLanguage: 'en',
            examples: [example({ de: 'Der Tisch ist groß.', en: 'The table is big.', translationLanguage: 'en' })]
        })
    ];
    const result = planSpeechSequence(items, { repeatCount: 2, includeTranslation: true });
    assertStepsEqual(result.steps, [
        // Item 1, repetition 0: term, term-translation, example, example-translation.
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'das Wort' },
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'term-translation', exampleIndex: null, language: 'en', text: 'the word' },
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'example', exampleIndex: 0, language: 'de', text: 'Ich sehe das Wort.' },
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'example-translation', exampleIndex: 0, language: 'en', text: 'I see the word.' },
        // Item 1, repetition 1: the same complete block.
        { itemId: '1-0', itemIndex: 0, repeatIndex: 1, segment: 'term', exampleIndex: null, language: 'de', text: 'das Wort' },
        { itemId: '1-0', itemIndex: 0, repeatIndex: 1, segment: 'term-translation', exampleIndex: null, language: 'en', text: 'the word' },
        { itemId: '1-0', itemIndex: 0, repeatIndex: 1, segment: 'example', exampleIndex: 0, language: 'de', text: 'Ich sehe das Wort.' },
        { itemId: '1-0', itemIndex: 0, repeatIndex: 1, segment: 'example-translation', exampleIndex: 0, language: 'en', text: 'I see the word.' },
        // Item 2, repetition 0.
        { itemId: '1-1', itemIndex: 1, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'der Tisch' },
        { itemId: '1-1', itemIndex: 1, repeatIndex: 0, segment: 'term-translation', exampleIndex: null, language: 'en', text: 'the table' },
        { itemId: '1-1', itemIndex: 1, repeatIndex: 0, segment: 'example', exampleIndex: 0, language: 'de', text: 'Der Tisch ist groß.' },
        { itemId: '1-1', itemIndex: 1, repeatIndex: 0, segment: 'example-translation', exampleIndex: 0, language: 'en', text: 'The table is big.' },
        // Item 2, repetition 1.
        { itemId: '1-1', itemIndex: 1, repeatIndex: 1, segment: 'term', exampleIndex: null, language: 'de', text: 'der Tisch' },
        { itemId: '1-1', itemIndex: 1, repeatIndex: 1, segment: 'term-translation', exampleIndex: null, language: 'en', text: 'the table' },
        { itemId: '1-1', itemIndex: 1, repeatIndex: 1, segment: 'example', exampleIndex: 0, language: 'de', text: 'Der Tisch ist groß.' },
        { itemId: '1-1', itemIndex: 1, repeatIndex: 1, segment: 'example-translation', exampleIndex: 0, language: 'en', text: 'The table is big.' }
    ]);
    assert.deepEqual(result.warnings, []);
});

test('AUDIO-001-C1: repeatCount 3 on one item emits the term three times with ascending repeatIndex', () => {
    const items = [termCard({ id: '1-0', de: 'der Tisch' })];
    const result = planSpeechSequence(items, { repeatCount: 3 });
    assertStepsEqual(result.steps, [
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'der Tisch' },
        { itemId: '1-0', itemIndex: 0, repeatIndex: 1, segment: 'term', exampleIndex: null, language: 'de', text: 'der Tisch' },
        { itemId: '1-0', itemIndex: 0, repeatIndex: 2, segment: 'term', exampleIndex: null, language: 'de', text: 'der Tisch' }
    ]);
    assert.deepEqual(result.warnings, []);
});

// ---------------------------------------------------------------------------
// 6. Stable source indexing: original indices, no re-basing (C1 finding 3)
// ---------------------------------------------------------------------------

test('AUDIO-001-C1: startIndex 0 plays the full sequence with original indices', () => {
    const items = [
        termCard({ id: '1-0', de: 'der Apfel' }),
        termCard({ id: '1-1', de: 'die Birne' }),
        termCard({ id: '1-2', de: 'die Traube' })
    ];
    const result = planSpeechSequence(items, { startIndex: 0 });
    assertStepsEqual(result.steps, [
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'der Apfel' },
        { itemId: '1-1', itemIndex: 1, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'die Birne' },
        { itemId: '1-2', itemIndex: 2, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'die Traube' }
    ]);
    assert.deepEqual(result.warnings, []);
});

test('AUDIO-001-C1: startIndex in the middle retains the original item indices 1 and 2 without re-basing', () => {
    const items = [
        termCard({ id: '1-0', de: 'der Apfel' }),
        termCard({ id: '1-1', de: 'die Birne' }),
        termCard({ id: '1-2', de: 'die Traube' })
    ];
    const result = planSpeechSequence(items, { startIndex: 1 });
    assertStepsEqual(result.steps, [
        { itemId: '1-1', itemIndex: 1, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'die Birne' },
        { itemId: '1-2', itemIndex: 2, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'die Traube' }
    ]);
    assert.deepEqual(result.warnings, []);
});

test('AUDIO-001-C1: startIndex at the last item plays exactly that item with its original index', () => {
    const items = [
        termCard({ id: '1-0', de: 'der Apfel' }),
        termCard({ id: '1-1', de: 'die Birne' }),
        termCard({ id: '1-2', de: 'die Traube' })
    ];
    const result = planSpeechSequence(items, { startIndex: 2 });
    assertStepsEqual(result.steps, [
        { itemId: '1-2', itemIndex: 2, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'die Traube' }
    ]);
    assert.deepEqual(result.warnings, []);
});

test('AUDIO-001-C1: startIndex out of range produces an empty step list with an OUT_OF_RANGE_START_INDEX warning', () => {
    const items = [
        termCard({ id: '1-0', de: 'der Apfel' }),
        termCard({ id: '1-1', de: 'die Birne' }),
        termCard({ id: '1-2', de: 'die Traube' })
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

test('AUDIO-001-C1: item ids and original indices stay stable across repeats after a startIndex', () => {
    const items = [
        termCard({ id: '1-0', de: 'der Apfel', en: 'the apple', translationLanguage: 'en' }),
        termCard({ id: '1-1', de: 'die Birne', en: 'the pear', translationLanguage: 'en' }),
        termCard({ id: '1-2', de: 'die Traube', en: 'the grape', translationLanguage: 'en' })
    ];
    const result = planSpeechSequence(items, { startIndex: 1, repeatCount: 2, includeTranslation: true });
    assertStepsEqual(result.steps, [
        // Item at original index 1, both repetitions.
        { itemId: '1-1', itemIndex: 1, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'die Birne' },
        { itemId: '1-1', itemIndex: 1, repeatIndex: 0, segment: 'term-translation', exampleIndex: null, language: 'en', text: 'the pear' },
        { itemId: '1-1', itemIndex: 1, repeatIndex: 1, segment: 'term', exampleIndex: null, language: 'de', text: 'die Birne' },
        { itemId: '1-1', itemIndex: 1, repeatIndex: 1, segment: 'term-translation', exampleIndex: null, language: 'en', text: 'the pear' },
        // Item at original index 2, both repetitions.
        { itemId: '1-2', itemIndex: 2, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'die Traube' },
        { itemId: '1-2', itemIndex: 2, repeatIndex: 0, segment: 'term-translation', exampleIndex: null, language: 'en', text: 'the grape' },
        { itemId: '1-2', itemIndex: 2, repeatIndex: 1, segment: 'term', exampleIndex: null, language: 'de', text: 'die Traube' },
        { itemId: '1-2', itemIndex: 2, repeatIndex: 1, segment: 'term-translation', exampleIndex: null, language: 'en', text: 'the grape' }
    ]);
    assert.deepEqual(result.warnings, []);
});

// ---------------------------------------------------------------------------
// 7. No/first/all examples
// ---------------------------------------------------------------------------

test('AUDIO-001-C1: exampleMode none omits all example steps', () => {
    const items = [termCard({
        id: '1-0', de: 'das Wort',
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

test('AUDIO-001-C1: exampleMode first emits only the first example', () => {
    const items = [termCard({
        id: '1-0', de: 'das Wort',
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

test('AUDIO-001-C1: exampleMode all emits every example in source order', () => {
    const items = [termCard({
        id: '1-0', de: 'das Wort',
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
// 8. Translation enabled/disabled, empty text, alternatives, mixed examples
// ---------------------------------------------------------------------------

test('AUDIO-001-C1: includeTranslation=false (default) omits term-translation steps even when text is available', () => {
    const items = [termCard({ id: '1-0', de: 'das Wort', en: 'the word', translationLanguage: 'en' })];
    const result = planSpeechSequence(items, {});
    assertStepsEqual(result.steps, [
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'das Wort' }
    ]);
    assert.deepEqual(result.warnings, []);
});

test('AUDIO-001-C1: empty English term-translation is skipped with a SKIPPED_EMPTY_TEXT warning, no substitution', () => {
    const items = [termCard({ id: '1-0', de: 'das Wort', en: '', translationLanguage: 'en' })];
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

test('AUDIO-001-C1: empty German term text is skipped with a SKIPPED_EMPTY_TEXT warning', () => {
    const items = [termCard({ id: '1-0', de: '', translationLanguage: null })];
    const result = planSpeechSequence(items, {});
    assertStepsEqual(result.steps, []);
    assert.equal(result.warnings.length, 1);
    assert.deepEqual(result.warnings[0], {
        kind: 'SKIPPED_EMPTY_TEXT',
        itemId: '1-0',
        segment: 'term',
        exampleIndex: null,
        language: 'de',
        detail: 'term speechText.de is empty; the German term step was omitted without substituting another language.'
    });
});

test('AUDIO-001-C1: English slash alternatives are kept intact in one English step and never split or reclassified', () => {
    const items = [termCard({ id: '1-0', de: 'die Vorstellung, -en', en: 'the presentation / the introduction', translationLanguage: 'en' })];
    const result = planSpeechSequence(items, { includeTranslation: true });
    assertStepsEqual(result.steps, [
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'die Vorstellung, -en' },
        { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'term-translation', exampleIndex: null, language: 'en', text: 'the presentation / the introduction' }
    ]);
    assert.deepEqual(result.warnings, []);
});

test('AUDIO-001-C1: mixed-language example translation emits example, en-translation, ar-translation as separate steps', () => {
    const items = [termCard({
        id: '1-0', de: 'das Wort', translationLanguage: null,
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
// 9. Invalid options
// ---------------------------------------------------------------------------

test('AUDIO-001-C1: invalid exampleMode throws InvalidSpeechPlanOptionError', () => {
    const items = [termCard({ id: '1-0', de: 'das Wort' })];
    assert.throws(
        () => planSpeechSequence(items, { exampleMode: 'xyz' }),
        (err) => err instanceof InvalidSpeechPlanOptionError && /exampleMode/.test(err.message)
    );
});

test('AUDIO-001-C1: repeatCount 0 throws InvalidSpeechPlanOptionError', () => {
    const items = [termCard({ id: '1-0', de: 'das Wort' })];
    assert.throws(
        () => planSpeechSequence(items, { repeatCount: 0 }),
        (err) => err instanceof InvalidSpeechPlanOptionError && /repeatCount/.test(err.message)
    );
});

test('AUDIO-001-C1: negative repeatCount throws InvalidSpeechPlanOptionError', () => {
    const items = [termCard({ id: '1-0', de: 'das Wort' })];
    assert.throws(
        () => planSpeechSequence(items, { repeatCount: -1 }),
        (err) => err instanceof InvalidSpeechPlanOptionError && /repeatCount/.test(err.message)
    );
});

test('AUDIO-001-C1: non-boolean includeTranslation throws InvalidSpeechPlanOptionError', () => {
    const items = [termCard({ id: '1-0', de: 'das Wort' })];
    assert.throws(
        () => planSpeechSequence(items, { includeTranslation: 'yes' }),
        (err) => err instanceof InvalidSpeechPlanOptionError && /includeTranslation/.test(err.message)
    );
});

test('AUDIO-001-C1: negative startIndex throws InvalidSpeechPlanOptionError', () => {
    const items = [termCard({ id: '1-0', de: 'das Wort' })];
    assert.throws(
        () => planSpeechSequence(items, { startIndex: -1 }),
        (err) => err instanceof InvalidSpeechPlanOptionError && /startIndex/.test(err.message)
    );
});

test('AUDIO-001-C1: non-integer startIndex throws InvalidSpeechPlanOptionError', () => {
    const items = [termCard({ id: '1-0', de: 'das Wort' })];
    assert.throws(
        () => planSpeechSequence(items, { startIndex: 1.5 }),
        (err) => err instanceof InvalidSpeechPlanOptionError && /startIndex/.test(err.message)
    );
});

test('AUDIO-001-C1: items not an array throws InvalidSpeechPlanOptionError', () => {
    assert.throws(
        () => planSpeechSequence('not-an-array', {}),
        (err) => err instanceof InvalidSpeechPlanOptionError && /items/.test(err.message)
    );
});

// ---------------------------------------------------------------------------
// 10. Input immutability and determinism
// ---------------------------------------------------------------------------

test('AUDIO-001-C1: planSpeechSequence never mutates items, cards, examples, or options', () => {
    const items = [
        termCard({
            id: '1-0', de: 'das Wort', en: 'the word', ar: 'الكلمة', translationLanguage: 'mixed',
            examples: [example({ de: 'Ich sehe das Wort.', en: 'I see the word.', ar: 'الكلمة جديدة.', translationLanguage: 'mixed' })]
        })
    ];
    const options = { repeatCount: 2, exampleMode: 'all', includeTranslation: true, startIndex: 0 };
    const itemsSnapshot = JSON.parse(JSON.stringify(items));
    const optionsSnapshot = JSON.parse(JSON.stringify(options));
    const result = planSpeechSequence(items, options);
    assert.notEqual(result.steps.length, 0, 'sanity: the planner produced steps');
    // Source arrays/objects must be deep-equal to their pre-call state.
    assert.deepEqual(items, itemsSnapshot, 'items array and contents are unchanged');
    assert.deepEqual(options, optionsSnapshot, 'options object is unchanged');
    // Steps must not retain references to source objects.
    for (const step of result.steps) {
        assert.equal(typeof step.text, 'string');
        assert.equal(typeof step.itemId, 'string');
        assert.equal(Array.isArray(step), false);
    }
});

test('AUDIO-001-C1: two calls with the same inputs produce deep-equal results (fresh arrays each call)', () => {
    const items = [
        termCard({ id: '1-0', de: 'das Wort', en: 'the word', ar: 'الكلمة', translationLanguage: 'mixed' }),
        termCard({ id: '1-1', de: 'der Tisch', en: 'the table', translationLanguage: 'en' })
    ];
    const options = { repeatCount: 2, exampleMode: 'none', includeTranslation: true, startIndex: 0 };
    const a = planSpeechSequence(items, options);
    const b = planSpeechSequence(items, options);
    assert.notEqual(a, b, 'each call returns a fresh result object');
    assert.notEqual(a.steps, b.steps, 'each call returns a fresh steps array');
    assert.deepEqual(a, b, 'the two results are deep-equal');
});

test('AUDIO-001-C1: deterministic item-major ordering holds for many items with repeats and translations', () => {
    const items = [];
    for (let i = 0; i < 5; i++) {
        items.push(termCard({ id: `1-${i}`, de: `der Begriff ${i}`, en: `the term ${i}`, translationLanguage: 'en' }));
    }
    const result = planSpeechSequence(items, { repeatCount: 2, includeTranslation: true });
    // Expected: per item, both repetitions (term-de, term-translation-en)
    // before the next item: 5 items x 2 repeats x 2 steps = 20 steps.
    assert.equal(result.steps.length, 5 * 2 * 2);
    assert.equal(result.steps[0].text, 'der Begriff 0');
    assert.equal(result.steps[1].text, 'the term 0');
    assert.equal(result.steps[2].text, 'der Begriff 0');
    assert.equal(result.steps[3].text, 'the term 0');
    assert.equal(result.steps[4].text, 'der Begriff 1');
    assert.equal(result.steps[18].text, 'der Begriff 4');
    assert.equal(result.steps[19].text, 'the term 4');
    assert.equal(result.steps[0].repeatIndex, 0);
    assert.equal(result.steps[2].repeatIndex, 1);
    assert.equal(result.steps[2].itemIndex, 0);
    assert.equal(result.steps[19].repeatIndex, 1);
    assert.equal(result.steps[19].itemIndex, 4);
});
