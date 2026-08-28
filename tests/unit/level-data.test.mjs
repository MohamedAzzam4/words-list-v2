import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import {
    createVocabularySnapshot,
    validateLevelConfig,
    validateVocabulary
} from '../../js/core/level-data-validator.mjs';

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

function loadStoredProgress(appId, progress) {
    const source = readFileSync(new URL('../../js/core/storage.js', import.meta.url), 'utf8')
        .replace(/^export\s+/gm, '');
    const values = new Map([[`german_app_progress_${appId}`, JSON.stringify(progress)]]);
    const sandbox = {
        console,
        localStorage: {
            getItem: key => values.get(key) ?? null,
            setItem: (key, value) => values.set(key, value),
            removeItem: key => values.delete(key)
        }
    };
    vm.createContext(sandbox);
    vm.runInContext(
        source + '\n;globalThis.__PROGRESS = getLocalProgress(' + JSON.stringify(appId) + ');',
        sandbox,
        { filename: 'js/core/storage.js' }
    );
    return JSON.parse(JSON.stringify(sandbox.__PROGRESS));
}

const a1 = loadLevelConfig('js/levels/a1.config.js', 'parseRawData');
const b2 = loadLevelConfig('js/levels/b2.config.js', 'parseRawB2Data');

test('LEVEL-DATA-001: A1 retains the German and translated first example', () => {
    const [card] = a1.parser([
        '7|n|der Tisch|table|Der Tisch ist groß.|The table is big.'
    ])[6];

    assert.equal(card.id, '7-0');
    assert.equal(card.levelId, 'a1');
    assert.equal(card.unitId, 7);
    assert.equal(card.context, 'Der Tisch ist groß.');
    assert.equal(card.exampleDe, 'Der Tisch ist groß.');
    assert.equal(card.exampleTranslation, 'The table is big.');
    assert.equal(card.exampleTranslationLanguage, 'en');
    assert.deepEqual(JSON.parse(JSON.stringify(card.translations)), {
        en: 'table',
        ar: ''
    });
    assert.deepEqual(JSON.parse(JSON.stringify(card.speechText)), {
        de: 'der Tisch',
        en: 'table',
        ar: ''
    });
    assert.deepEqual(JSON.parse(JSON.stringify(card.examples)), [{
        de: 'Der Tisch ist groß.',
        translation: 'The table is big.',
        translationLanguage: 'en',
        translations: { en: 'The table is big.', ar: '' },
        speechText: { de: 'Der Tisch ist groß.', en: 'The table is big.', ar: '' }
    }]);
});

test('LEVEL-DATA-002: B2 retains bilingual display text without mislabeling it as English-only', () => {
    const [card] = b2.parser([
        '4||der Tisch|table / الطاولة|Der Tisch ist groß.|The table is big. / الطاولة كبيرة.'
    ])[3];

    assert.equal(card.id, '4-0');
    assert.equal(card.levelId, 'b2');
    assert.equal(card.unitId, 4);
    assert.equal(card.context, 'Der Tisch ist groß.');
    assert.equal(card.exampleDe, 'Der Tisch ist groß.');
    assert.equal(card.exampleTranslation, 'The table is big. / الطاولة كبيرة.');
    assert.equal(card.translationLanguage, 'mixed');
    assert.equal(card.exampleTranslationLanguage, 'mixed');
    assert.deepEqual(JSON.parse(JSON.stringify(card.translations)), {
        en: 'table',
        ar: 'الطاولة'
    });
    assert.deepEqual(JSON.parse(JSON.stringify(card.speechText)), {
        de: 'der Tisch',
        en: 'table',
        ar: 'الطاولة'
    });
    assert.deepEqual(JSON.parse(JSON.stringify(card.examples)), [{
        de: 'Der Tisch ist groß.',
        translation: 'The table is big. / الطاولة كبيرة.',
        translationLanguage: 'mixed',
        translations: { en: 'The table is big.', ar: 'الطاولة كبيرة.' },
        speechText: { de: 'Der Tisch ist groß.', en: 'The table is big.', ar: 'الطاولة كبيرة.' }
    }]);
});

test('LEVEL-DATA-002A: slash-separated English alternatives stay English-only', () => {
    const [card] = b2.parser([
        '4||der Roboter|robot / robot|Der Roboter arbeitet.|The robot works / A robot works.'
    ])[3];

    assert.equal(card.translationLanguage, 'en');
    assert.equal(card.exampleTranslationLanguage, 'en');
    assert.deepEqual(JSON.parse(JSON.stringify(card.translations)), {
        en: 'robot / robot',
        ar: ''
    });
    assert.deepEqual(JSON.parse(JSON.stringify(card.examples[0].translations)), {
        en: 'The robot works / A robot works.',
        ar: ''
    });
});

test('LEVEL-DATA-002B: Arabic-only translations expose only Arabic speech text', () => {
    const [card] = b2.parser([
        '4||الروبوت|الروبوت|Der Roboter arbeitet.|الروبوت يعمل.'
    ])[3];

    assert.equal(card.translationLanguage, 'ar');
    assert.equal(card.exampleTranslationLanguage, 'ar');
    assert.equal(card.speechText.en, '');
    assert.equal(card.speechText.ar, 'الروبوت');
    assert.equal(card.examples[0].speechText.en, '');
    assert.equal(card.examples[0].speechText.ar, 'الروبوت يعمل.');
});

test('LEVEL-DATA-003: cards without examples expose empty collections without changing legacy fields', () => {
    const [a1Card] = a1.parser(['1|a|schnell|fast|||'])[0];
    const [b2Card] = b2.parser(['1||schnell|fast|||'])[0];

    for (const card of [a1Card, b2Card]) {
        assert.equal(card.context, '');
        assert.equal(card.exampleDe, '');
        assert.equal(card.exampleTranslation, '');
        assert.deepEqual(JSON.parse(JSON.stringify(card.examples)), []);
    }
});

test('LEVEL-DATA-004: real A1 and B2 configs retain units, IDs, and example fields', () => {
    const a1Cards = a1.levelConfig.vocabulary.flat();
    const b2Cards = b2.levelConfig.vocabulary.flat();

    assert.equal(a1.levelConfig.vocabulary.length, 24);
    assert.ok(a1Cards.length > 0);
    assert.ok(b2Cards.length > 0);

    for (const card of a1Cards) {
        assert.match(card.id, /^\d+-\d+$/);
        assert.equal(card.levelId, 'a1');
        assert.ok(Number.isInteger(card.unitId));
        assert.equal(card.translation, card.en);
        assert.equal(card.speechText.de, card.de);
        assert.equal(card.speechText.en, card.translations.en);
        assert.equal(card.speechText.ar, card.translations.ar);
        assert.equal(card.exampleDe, card.context);
        assert.equal(card.examples.length, card.exampleDe ? 1 : 0);
        assert.equal(card.examples[0]?.de || '', card.exampleDe);
        assert.equal(card.examples[0]?.translation || '', card.exampleTranslation);
    }

    for (const card of b2Cards) {
        assert.match(card.id, /^\d+-\d+$/);
        assert.equal(card.levelId, 'b2');
        assert.ok(Number.isInteger(card.unitId));
        assert.equal(card.translation, card.en);
        assert.equal(card.speechText.de, card.de);
        assert.equal(card.speechText.en, card.translations.en);
        assert.equal(card.speechText.ar, card.translations.ar);
        assert.equal(card.exampleDe, card.context);
        assert.equal(card.examples.length, card.exampleDe ? 1 : 0);
        assert.equal(card.examples[0]?.de || '', card.exampleDe);
        assert.equal(card.examples[0]?.translation || '', card.exampleTranslation);
    }

    for (const display of ['IT / edv', 'robot / robot', 'the explorer / Explorer']) {
        const card = b2Cards.find(candidate => candidate.translation === display);
        assert.ok(card, `missing real B2 regression fixture: ${display}`);
        assert.equal(card.translationLanguage, 'en');
        assert.equal(card.translations.en, display);
        assert.equal(card.translations.ar, '');
    }
});

test('LEVEL-DATA-005: real A1 and B2 configs pass the normalized vocabulary validator', () => {
    assert.deepEqual(validateLevelConfig(a1.levelConfig), { ok: true, errors: [] });
    assert.deepEqual(validateLevelConfig(b2.levelConfig), { ok: true, errors: [] });
});

test('LEVEL-DATA-006: content-sensitive snapshots detect unit counts and accidental reordering', () => {
    const snapshots = [
        {
            snapshot: createVocabularySnapshot(a1.levelConfig.vocabulary),
            unitCount: 24,
            totalCards: 711,
            unitCounts: [30, 43, 31, 32, 24, 28, 29, 30, 50, 37, 27, 21, 25, 33, 23, 29, 19, 35, 26, 25, 17, 39, 31, 27],
            digest: '961e6c2e9f46a51cfa3608678a4468472d7286c2df30705992b4317bcda3ef53'
        },
        {
            snapshot: createVocabularySnapshot(b2.levelConfig.vocabulary),
            unitCount: 70,
            totalCards: 3031,
            unitCounts: [3, 37, 51, 31, 60, 42, 2, 3, 19, 42, 19, 68, 27, 7, 42, 19, 59, 18, 91, 41, 2, 1, 56, 107, 67, 41, 8, 13, 53, 57, 66, 89, 55, 2, 10, 51, 19, 47, 46, 23, 1, 1, 38, 56, 33, 122, 37, 7, 1, 34, 40, 23, 86, 36, 10, 23, 49, 7, 15, 62, 51, 1, 26, 58, 22, 69, 21, 4, 464, 140],
            digest: 'e72072f266754bb0a765aef85cd43faba865916ae8efe8d0175f45673e303311'
        }
    ];

    for (const { snapshot, unitCount, totalCards, unitCounts, digest } of snapshots) {
        assert.equal(snapshot.unitCount, unitCount);
        assert.equal(snapshot.totalCards, totalCards);
        assert.deepEqual(JSON.parse(JSON.stringify(snapshot.unitCounts)), unitCounts);
        assert.equal(
            crypto.createHash('sha256').update(JSON.stringify(snapshot)).digest('hex'),
            digest
        );
    }
});

test('LEVEL-DATA-007: validator rejects duplicate IDs, unit mismatches, and broken examples', () => {
    const result = validateVocabulary([[
        {
            id: 'duplicate',
            unitId: 2,
            de: '',
            en: '',
            type: 'n',
            translationLanguage: 'xx',
            exampleDe: 'Beispiel',
            exampleTranslation: 'Example',
            exampleTranslationLanguage: 'xx',
            examples: [{ de: 'Andere Zeile', translation: 'Example', translationLanguage: 'xx' }]
        },
        {
            id: 'duplicate',
            unitId: 1,
            de: 'Wort',
            en: 'word',
            type: 'n',
            translationLanguage: 'en',
            exampleDe: '',
            exampleTranslation: '',
            exampleTranslationLanguage: null,
            examples: [{ de: 'Orphan example', translation: '', translationLanguage: null }]
        }
    ]]);

    assert.equal(result.ok, false);
    for (const code of [
        'CARD_ID_FORMAT',
        'CARD_ID_POSITION_MISMATCH',
        'CARD_ID_DUPLICATE',
        'CARD_UNIT_MISMATCH',
        'CARD_GERMAN_REQUIRED',
        'CARD_TRANSLATION_REQUIRED',
        'CARD_LANGUAGE',
        'EXAMPLE_LANGUAGE',
        'EXAMPLE_ALIAS_MISMATCH',
        'EXAMPLE_ORPHAN'
    ]) {
        assert.ok(result.errors.some(error => error.code === code), `missing ${code}`);
    }
});

test('LEVEL-DATA-008: validator rejects duplicate words and inconsistent normalized aliases', () => {
    const card = (id, overrides = {}) => ({
        id,
        levelId: 'a1',
        unitId: 1,
        de: 'Haus',
        en: 'house',
        type: 'n',
        context: '',
        translation: 'incorrect legacy alias',
        translationLanguage: 'en',
        translations: { en: 'house', ar: '' },
        speechText: { de: 'Haus', en: 'house', ar: '' },
        exampleDe: '',
        exampleTranslation: '',
        exampleTranslationLanguage: null,
        examples: [],
        ...overrides
    });
    const result = validateVocabulary([[card('1-0'), card('1-1')]], { levelId: 'a1' });

    assert.equal(result.ok, false);
    assert.ok(result.errors.some(error => error.code === 'CARD_GERMAN_DUPLICATE'));
    assert.ok(result.errors.some(error => error.code === 'CARD_TRANSLATION_ALIAS_MISMATCH'));
    assert.ok(result.errors.some(error => error.code === 'TRANSLATION_DISPLAY_MISMATCH'));
});

test('LEVEL-DATA-009: duplicate-word allowances are exact and become stale when the data changes', () => {
    const card = (id, de) => ({
        id,
        levelId: 'b2',
        unitId: 1,
        de,
        en: 'word',
        type: 'n',
        context: '',
        translation: 'word',
        translationLanguage: 'en',
        translations: { en: 'word', ar: '' },
        speechText: { de, en: 'word', ar: '' },
        exampleDe: '',
        exampleTranslation: '',
        exampleTranslationLanguage: null,
        examples: []
    });
    const vocabulary = [[card('1-0', 'Wort'), card('1-1', 'Wort')]];

    assert.deepEqual(validateVocabulary(vocabulary, {
        levelId: 'b2',
        allowedDuplicateWordIdPairs: [['1-0', '1-1']]
    }), { ok: true, errors: [] });

    const stale = validateVocabulary([[card('1-0', 'Wort')]], {
        levelId: 'b2',
        allowedDuplicateWordIdPairs: [['1-0', '1-1']]
    });
    assert.ok(stale.errors.some(error => error.code === 'DUPLICATE_ALLOWANCE_STALE'));
});

test('LEVEL-DATA-010: legacy level progress loads with stable IDs still present in normalized data', () => {
    const cases = [
        { config: a1.levelConfig, known: '1-0', favorite: '24-26' },
        { config: b2.levelConfig, known: '1-0', favorite: '70-139' }
    ];

    for (const { config, known, favorite } of cases) {
        const legacy = {
            known: [known],
            favorites: [favorite],
            flashcardErrors: { [favorite]: 2 },
            srsData: { [known]: { level: 3, nextReviewDate: '2030-01-01T00:00:00.000Z' } }
        };
        const loaded = loadStoredProgress(config.appId, legacy);
        const currentIds = new Set(config.vocabulary.flat().map(card => card.id));

        assert.deepEqual(loaded.known, [known]);
        assert.deepEqual(loaded.favorites, [favorite]);
        assert.equal(loaded.flashcardErrors[favorite], 2);
        assert.equal(loaded.srsData[known].level, 3);
        assert.equal(currentIds.has(known), true);
        assert.equal(currentIds.has(favorite), true);
    }
});

test('LEVEL-DATA-011: a level config cannot omit its level identity', () => {
    const result = validateLevelConfig({ vocabulary: [] });

    assert.equal(result.ok, false);
    assert.ok(result.errors.some(error => error.code === 'LEVEL_ID_REQUIRED'));
});
