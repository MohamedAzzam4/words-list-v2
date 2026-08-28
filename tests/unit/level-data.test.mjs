import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

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
