// AUDIO-003: CEFR level autoplay adapter unit tests.
//
// The adapter under test is js/core/cefr-audio.mjs — the pure mapping between
// the level glossary context and the AUDIO-001 speech-plan boundary
// (FP-DESIGN-010: speech-sequence planning is a pure calculation; this
// mapping is too). Two layers, both deterministic:
//  A) The pure adapter directly: filter matching and planned-step ->
//     SpeechQueue-record mapping, with hand-written step literals (never
//     planner output) and hand-written expected arrays.
//  B) Integration with the REAL planner (js/core/speech-plan.mjs) and the
//     REAL A1/B2 parsers (loaded in VM sandboxes, the tracked unit-test
//     pattern for browser ESM files in this CommonJS package), so the
//     adapter is verified against the actual planning and data boundaries.
//
// Contract refs: LF-AUDIO (autoplay scope follows the active vocabulary
// filter; language-specific speech text; no mixed display text under a
// single-language voice), AC-03 (Arabic-only and mixed data use separate
// language text), AC-11 (deterministic steps with stable item identity),
// TS-TEST-005 (independently specified expected outcomes; no oracle
// computed with the algorithm under test).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

import { planSpeechSequence } from '../../js/core/speech-plan.mjs';
import {
    matchesVocabularyFilter,
    mapCefrSpeechStepsToQueueItems,
    InvalidCefrAudioInputError
} from '../../js/core/cefr-audio.mjs';

// ---------------------------------------------------------------------------
// Real parser loading (same pattern as tests/unit/level-data.test.mjs).
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

// ---------------------------------------------------------------------------
// Pure adapter: matchesVocabularyFilter (LF-AUDIO queue scope).
// ---------------------------------------------------------------------------

test('AUDIO-003 unit: the vocabulary filter rule mirrors the glossary semantics', () => {
    const card = { id: '1-0', type: 'n' };
    const favorites = new Set(['1-0']);

    // 'all' admits every card regardless of type.
    assert.equal(matchesVocabularyFilter(card, 'all', favorites), true);
    assert.equal(matchesVocabularyFilter({ id: '1-1', type: 'e' }, 'all', favorites), true);

    // 'fav' follows the favorite set only.
    assert.equal(matchesVocabularyFilter(card, 'fav', favorites), true);
    assert.equal(matchesVocabularyFilter({ id: '1-2', type: 'n' }, 'fav', favorites), false);
    assert.equal(matchesVocabularyFilter(card, 'fav', null), false);
    assert.equal(matchesVocabularyFilter(card, 'fav', undefined), false);

    // Type letters compare case-insensitively (glossary semantics).
    assert.equal(matchesVocabularyFilter({ id: '1-3', type: 'v' }, 'v', favorites), true);
    assert.equal(matchesVocabularyFilter({ id: '1-4', type: 'V' }, 'v', favorites), true);
    assert.equal(matchesVocabularyFilter({ id: '1-5', type: 'n' }, 'N', favorites), true);
    assert.equal(matchesVocabularyFilter({ id: '1-6', type: 'n' }, 'v', favorites), false);

    // B2-style 'Vocab' type matches its own filter value.
    assert.equal(matchesVocabularyFilter({ id: '9-0', type: 'Vocab' }, 'Vocab', favorites), true);

    // A card without a type never matches a letter filter; an unknown filter
    // value matches nothing (the glossary renders an empty list for it).
    assert.equal(matchesVocabularyFilter({ id: '1-7', type: undefined }, 'v', favorites), false);
    assert.equal(matchesVocabularyFilter(card, 'zz', favorites), false);
});

test('AUDIO-003 unit: the vocabulary filter never mutates its inputs', () => {
    const card = { id: '1-0', type: 'n' };
    const favorites = new Set(['1-0']);
    matchesVocabularyFilter(card, 'fav', favorites);
    assert.deepEqual(JSON.parse(JSON.stringify(card)), { id: '1-0', type: 'n' });
    assert.deepEqual([...favorites], ['1-0']);
});

// ---------------------------------------------------------------------------
// Pure adapter: mapCefrSpeechStepsToQueueItems.
// Hand-written step literals; the expected records are hand-written too.
// ---------------------------------------------------------------------------

const syntheticSteps = [
    { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'das Wort' },
    { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'term-translation', exampleIndex: null, language: 'en', text: 'word' },
    { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'term-translation', exampleIndex: null, language: 'ar', text: 'الكلمة' },
    { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'example', exampleIndex: 0, language: 'de', text: 'Das Wort ist wichtig.' },
    { itemId: '1-0', itemIndex: 0, repeatIndex: 0, segment: 'example-translation', exampleIndex: 0, language: 'ar', text: 'الكلمة مهمة.' },
    { itemId: '1-1', itemIndex: 1, repeatIndex: 1, segment: 'term', exampleIndex: null, language: 'de', text: 'der Tisch' }
];

const syntheticCards = [
    { id: '1-0', de: 'das Wort' },
    { id: '1-1', de: 'der Tisch' }
];

test('AUDIO-003 unit: planned steps map to queue records with word identity, language, and labels', () => {
    const items = mapCefrSpeechStepsToQueueItems(syntheticSteps, syntheticCards, 2);

    assert.deepEqual(JSON.parse(JSON.stringify(items)), [
        { wordId: '1-0', wordDe: 'das Wort', text: 'das Wort', lang: 'de', segment: 'term', label: 'Word (1/2)' },
        { wordId: '1-0', wordDe: 'das Wort', text: 'word', lang: 'en', segment: 'term-translation', label: 'Translation' },
        { wordId: '1-0', wordDe: 'das Wort', text: 'الكلمة', lang: 'ar', segment: 'term-translation', label: 'Translation' },
        { wordId: '1-0', wordDe: 'das Wort', text: 'Das Wort ist wichtig.', lang: 'de', segment: 'example', label: 'Example (DE)' },
        { wordId: '1-0', wordDe: 'das Wort', text: 'الكلمة مهمة.', lang: 'ar', segment: 'example-translation', label: 'Example Translation' },
        { wordId: '1-1', wordDe: 'der Tisch', text: 'der Tisch', lang: 'de', segment: 'term', label: 'Word (2/2)' }
    ]);
});

test('AUDIO-003 unit: mapping never mutates the steps or the cards', () => {
    const stepsSnapshot = JSON.parse(JSON.stringify(syntheticSteps));
    const cardsSnapshot = JSON.parse(JSON.stringify(syntheticCards));
    mapCefrSpeechStepsToQueueItems(syntheticSteps, syntheticCards, 2);
    assert.deepEqual(JSON.parse(JSON.stringify(syntheticSteps)), stepsSnapshot);
    assert.deepEqual(JSON.parse(JSON.stringify(syntheticCards)), cardsSnapshot);
});

test('AUDIO-003 unit: mapping validates its inputs like the planner boundary', () => {
    assert.throws(() => mapCefrSpeechStepsToQueueItems('nope', syntheticCards, 1), InvalidCefrAudioInputError);
    assert.throws(() => mapCefrSpeechStepsToQueueItems(syntheticSteps, 'nope', 1), InvalidCefrAudioInputError);
    // A step pointing past the card list is a caller misalignment.
    const misaligned = [{ itemId: '9-9', itemIndex: 9, repeatIndex: 0, segment: 'term', exampleIndex: null, language: 'de', text: 'x' }];
    assert.throws(() => mapCefrSpeechStepsToQueueItems(misaligned, syntheticCards, 1), InvalidCefrAudioInputError);
    // repeatCount mirrors the planner rule: positive integer, default 1.
    assert.throws(() => mapCefrSpeechStepsToQueueItems(syntheticSteps, syntheticCards, 0), InvalidCefrAudioInputError);
    assert.throws(() => mapCefrSpeechStepsToQueueItems(syntheticSteps, syntheticCards, -1), InvalidCefrAudioInputError);
    assert.throws(() => mapCefrSpeechStepsToQueueItems(syntheticSteps, syntheticCards, 1.5), InvalidCefrAudioInputError);

    const defaulted = mapCefrSpeechStepsToQueueItems(syntheticSteps.slice(0, 1), syntheticCards);
    assert.equal(defaulted[0].label, 'Word (1/1)');
});

// ---------------------------------------------------------------------------
// Real planner + real parser integration through the adapter.
// ---------------------------------------------------------------------------

// Cards produced by the actual parsers from synthetic raw rows.
const parsedA1Card = a1.parser([
    '7|n|der Tisch|table|Der Tisch ist groß.|The table is big.'
])[6][0];
const parsedB2MixedCard = b2.parser([
    '4||die Verspätung, -en|delay / التأخير|Der Zug hat Verspätung.|The train is delayed. / القطار متأخر.'
])[3][0];
const parsedB2ArabicOnlyCard = b2.parser([
    '4||der Roboter|الروبوت|Der Roboter arbeitet.|الروبوت يعمل.'
])[3][0];

test('AUDIO-003 unit: real A1 card plans and maps to the exact four-step record sequence', () => {
    const plan = planSpeechSequence([parsedA1Card], {
        repeatCount: 1,
        exampleMode: 'first',
        includeTranslation: true,
        startIndex: 0
    });
    assert.deepEqual(plan.warnings, []);
    const items = mapCefrSpeechStepsToQueueItems(plan.steps, [parsedA1Card], 1);

    assert.deepEqual(JSON.parse(JSON.stringify(items)), [
        { wordId: '7-0', wordDe: 'der Tisch', text: 'der Tisch', lang: 'de', segment: 'term', label: 'Word (1/1)' },
        { wordId: '7-0', wordDe: 'der Tisch', text: 'table', lang: 'en', segment: 'term-translation', label: 'Translation' },
        { wordId: '7-0', wordDe: 'der Tisch', text: 'Der Tisch ist groß.', lang: 'de', segment: 'example', label: 'Example (DE)' },
        { wordId: '7-0', wordDe: 'der Tisch', text: 'The table is big.', lang: 'en', segment: 'example-translation', label: 'Example Translation' }
    ]);
});

test('AUDIO-003 unit: a real B2 mixed card maps to separately tagged English and Arabic records', () => {
    const plan = planSpeechSequence([parsedB2MixedCard], {
        repeatCount: 1,
        exampleMode: 'first',
        includeTranslation: true,
        startIndex: 0
    });
    assert.deepEqual(plan.warnings, []);
    const items = mapCefrSpeechStepsToQueueItems(plan.steps, [parsedB2MixedCard], 1);

    // Mixed display text never becomes one record: English and Arabic are
    // separate steps, each tagged with exactly one language (LF-AUDIO/AC-03).
    assert.deepEqual(items.map(item => item.lang), ['de', 'en', 'ar', 'de', 'en', 'ar']);
    assert.deepEqual(items.map(item => item.text), [
        'die Verspätung, -en',
        'delay',
        'التأخير',
        'Der Zug hat Verspätung.',
        'The train is delayed.',
        'القطار متأخر.'
    ]);
    // Every record keeps the stable word identity the highlight needs.
    for (const item of items) {
        assert.equal(item.wordId, '4-0');
        assert.equal(item.wordDe, 'die Verspätung, -en');
    }
});

test('AUDIO-003 unit: an Arabic-only B2 card never substitutes English and maps the Arabic steps', () => {
    const plan = planSpeechSequence([parsedB2ArabicOnlyCard], {
        repeatCount: 1,
        exampleMode: 'first',
        includeTranslation: true,
        startIndex: 0
    });
    assert.deepEqual(plan.warnings, []);
    const items = mapCefrSpeechStepsToQueueItems(plan.steps, [parsedB2ArabicOnlyCard], 1);

    assert.deepEqual(JSON.parse(JSON.stringify(items)), [
        { wordId: '4-0', wordDe: 'der Roboter', text: 'der Roboter', lang: 'de', segment: 'term', label: 'Word (1/1)' },
        { wordId: '4-0', wordDe: 'der Roboter', text: 'الروبوت', lang: 'ar', segment: 'term-translation', label: 'Translation' },
        { wordId: '4-0', wordDe: 'der Roboter', text: 'Der Roboter arbeitet.', lang: 'de', segment: 'example', label: 'Example (DE)' },
        { wordId: '4-0', wordDe: 'der Roboter', text: 'الروبوت يعمل.', lang: 'ar', segment: 'example-translation', label: 'Example Translation' }
    ]);
    // No English record exists for the Arabic-only translation.
    assert.equal(items.some(item => item.lang === 'en'), false);
});

test('AUDIO-003 unit: repeat ordering emits every repetition of an item before the next item', () => {
    const plan = planSpeechSequence([parsedA1Card], {
        repeatCount: 2,
        exampleMode: 'none',
        includeTranslation: false,
        startIndex: 0
    });
    const items = mapCefrSpeechStepsToQueueItems(plan.steps, [parsedA1Card], 2);

    assert.deepEqual(items.map(item => item.text), ['der Tisch', 'der Tisch']);
    assert.deepEqual(items.map(item => item.label), ['Word (1/2)', 'Word (2/2)']);
});

test('AUDIO-003 unit: example mode all queues every structured example in order (synthetic multi-example card)', () => {
    // Real A1/B2 data carries at most one example per card, so the
    // beyond-first ordering is pinned here with a synthetic card in the real
    // normalized shape (documented in the AUDIO-003 report).
    const multiExampleCard = {
        id: '1-0',
        levelId: 'a1',
        unitId: 1,
        de: 'das Wort',
        en: 'word',
        type: 'n',
        context: 'Das Wort ist wichtig.',
        translation: 'word',
        translationLanguage: 'en',
        translations: { en: 'word', ar: '' },
        speechText: { de: 'das Wort', en: 'word', ar: '' },
        exampleDe: 'Das Wort ist wichtig.',
        exampleTranslation: 'The word is important.',
        exampleTranslationLanguage: 'en',
        examples: [
            { de: 'Das Wort ist wichtig.', translation: 'The word is important.', translationLanguage: 'en', translations: { en: 'The word is important.', ar: '' }, speechText: { de: 'Das Wort ist wichtig.', en: 'The word is important.', ar: '' } },
            { de: 'Das Wort steht im Buch.', translation: 'The word is in the book.', translationLanguage: 'en', translations: { en: 'The word is in the book.', ar: '' }, speechText: { de: 'Das Wort steht im Buch.', en: 'The word is in the book.', ar: '' } }
        ]
    };

    const allPlan = planSpeechSequence([multiExampleCard], { repeatCount: 1, exampleMode: 'all', includeTranslation: true });
    const allItems = mapCefrSpeechStepsToQueueItems(allPlan.steps, [multiExampleCard], 1);
    assert.deepEqual(allItems.map(item => item.text), [
        'das Wort',
        'word',
        'Das Wort ist wichtig.',
        'The word is important.',
        'Das Wort steht im Buch.',
        'The word is in the book.'
    ]);

    const firstPlan = planSpeechSequence([multiExampleCard], { repeatCount: 1, exampleMode: 'first', includeTranslation: true });
    const firstItems = mapCefrSpeechStepsToQueueItems(firstPlan.steps, [multiExampleCard], 1);
    assert.deepEqual(firstItems.map(item => item.text), [
        'das Wort',
        'word',
        'Das Wort ist wichtig.',
        'The word is important.'
    ]);
});

test('AUDIO-003 unit: cards with no speakable text plan to an empty record list without inventing speech', () => {
    const muteCard = {
        id: '1-0',
        levelId: 'a1',
        unitId: 1,
        de: '',
        en: '',
        type: 'n',
        context: '',
        translation: '',
        translationLanguage: null,
        translations: { en: '', ar: '' },
        speechText: { de: '', en: '', ar: '' },
        exampleDe: '',
        exampleTranslation: '',
        exampleTranslationLanguage: null,
        examples: []
    };
    const plan = planSpeechSequence([muteCard], { repeatCount: 1, exampleMode: 'first', includeTranslation: true });
    assert.equal(plan.steps.length, 0);
    assert.ok(plan.warnings.length > 0);

    const items = mapCefrSpeechStepsToQueueItems(plan.steps, [muteCard], 1);
    assert.deepEqual(items, []);
});
