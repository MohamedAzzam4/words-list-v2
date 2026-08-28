import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createVocabularySnapshot, validateVocabulary } from '../../js/core/level-data-validator.mjs';

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

test('LEVEL-DATA-001: A1 retains the German and translated first example', () => {
    const [card] = a1.parser([
        '7|n|der Tisch|table|Der Tisch ist groß.|The table is big.'
    ])[6];

    assert.equal(card.id, '7-0');
    assert.equal(card.unitId, 7);
    assert.equal(card.context, 'Der Tisch ist groß.');
    assert.equal(card.exampleDe, 'Der Tisch ist groß.');
    assert.equal(card.exampleTranslation, 'The table is big.');
    assert.equal(card.exampleTranslationLanguage, 'en');
    assert.deepEqual(JSON.parse(JSON.stringify(card.examples)), [{
        de: 'Der Tisch ist groß.',
        translation: 'The table is big.',
        translationLanguage: 'en'
    }]);
});

test('LEVEL-DATA-002: B2 retains bilingual display text without mislabeling it as English-only', () => {
    const [card] = b2.parser([
        '4||der Tisch|table / الطاولة|Der Tisch ist groß.|The table is big. / الطاولة كبيرة.'
    ])[3];

    assert.equal(card.id, '4-0');
    assert.equal(card.unitId, 4);
    assert.equal(card.context, 'Der Tisch ist groß.');
    assert.equal(card.exampleDe, 'Der Tisch ist groß.');
    assert.equal(card.exampleTranslation, 'The table is big. / الطاولة كبيرة.');
    assert.equal(card.translationLanguage, 'mixed');
    assert.equal(card.exampleTranslationLanguage, 'mixed');
    assert.deepEqual(JSON.parse(JSON.stringify(card.examples)), [{
        de: 'Der Tisch ist groß.',
        translation: 'The table is big. / الطاولة كبيرة.',
        translationLanguage: 'mixed'
    }]);
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
        assert.ok(Number.isInteger(card.unitId));
        assert.equal(card.exampleDe, card.context);
        assert.equal(card.examples.length, card.exampleDe ? 1 : 0);
        assert.equal(card.examples[0]?.de || '', card.exampleDe);
        assert.equal(card.examples[0]?.translation || '', card.exampleTranslation);
    }

    for (const card of b2Cards) {
        assert.match(card.id, /^\d+-\d+$/);
        assert.ok(Number.isInteger(card.unitId));
        assert.equal(card.exampleDe, card.context);
        assert.equal(card.examples.length, card.exampleDe ? 1 : 0);
        assert.equal(card.examples[0]?.de || '', card.exampleDe);
        assert.equal(card.examples[0]?.translation || '', card.exampleTranslation);
    }
});

test('LEVEL-DATA-005: real A1 and B2 configs pass the normalized vocabulary validator', () => {
    assert.deepEqual(validateVocabulary(a1.levelConfig.vocabulary), { ok: true, errors: [] });
    assert.deepEqual(validateVocabulary(b2.levelConfig.vocabulary), { ok: true, errors: [] });
});

test('LEVEL-DATA-006: content-sensitive snapshots detect unit counts and accidental reordering', () => {
    const snapshots = [
        {
            snapshot: createVocabularySnapshot(a1.levelConfig.vocabulary),
            unitCount: 24,
            totalCards: 711,
            unitCounts: [30, 43, 31, 32, 24, 28, 29, 30, 50, 37, 27, 21, 25, 33, 23, 29, 19, 35, 26, 25, 17, 39, 31, 27],
            digest: 'ee91a08ed3c545739904a56de2e9fe0dec16c425987c601d393aa9ff556a1738'
        },
        {
            snapshot: createVocabularySnapshot(b2.levelConfig.vocabulary),
            unitCount: 70,
            totalCards: 3031,
            unitCounts: [3, 37, 51, 31, 60, 42, 2, 3, 19, 42, 19, 68, 27, 7, 42, 19, 59, 18, 91, 41, 2, 1, 56, 107, 67, 41, 8, 13, 53, 57, 66, 89, 55, 2, 10, 51, 19, 47, 46, 23, 1, 1, 38, 56, 33, 122, 37, 7, 1, 34, 40, 23, 86, 36, 10, 23, 49, 7, 15, 62, 51, 1, 26, 58, 22, 69, 21, 4, 464, 140],
            digest: 'bdc57c13ee10bde3ce3b35401937f32c02eeb1a47e02115cf482208e144d35cf'
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
