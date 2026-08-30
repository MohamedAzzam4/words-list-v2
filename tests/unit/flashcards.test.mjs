import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function createEngine(word) {
    const calls = [];
    const source = readFileSync(new URL('../../js/core/flashcards.js', import.meta.url), 'utf8')
        .replace(/^import .*$/gm, '')
        .replace(/^export\s+/gm, '');
    const sandbox = {
        window: {
            app: {
                speakText: (text, language) => calls.push({ text, language })
            }
        },
        calculateNextReview: () => ({}),
        getLocalDateString: () => '2026-08-28'
    };
    vm.createContext(sandbox);
    vm.runInContext(
        source + '\n;globalThis.__ENGINE = FlashcardEngine;',
        sandbox,
        { filename: 'js/core/flashcards.js' }
    );
    const engine = new sandbox.__ENGINE([word], new Set(), new Set(), {}, {});
    engine.face = 'en';
    engine.flipped = false;
    return { calls, engine };
}

test('LEVEL-DATA-012: normalized mixed translations speak only the English field', () => {
    const { calls, engine } = createEngine({
        id: '1-0',
        de: 'der Tisch',
        en: 'table / الطاولة',
        translations: { en: 'table', ar: 'الطاولة' },
        speechText: { de: 'der Tisch', en: 'table', ar: 'الطاولة' }
    });

    engine.speak();

    assert.deepEqual(calls, [{ text: 'table', language: 'en' }]);
});

test('LEVEL-DATA-013: normalized Arabic-only translations are never sent to an English voice', () => {
    const { calls, engine } = createEngine({
        id: '1-0',
        de: 'das Wort',
        en: 'الكلمة',
        translations: { en: '', ar: 'الكلمة' },
        speechText: { de: 'das Wort', en: '', ar: 'الكلمة' }
    });

    engine.speak();

    assert.deepEqual(calls, []);
});

test('LEVEL-DATA-014: legacy cards without normalized speech fields keep English playback', () => {
    const { calls, engine } = createEngine({ id: 'legacy', de: 'Hallo', en: 'hello' });

    engine.speak();

    assert.deepEqual(calls, [{ text: 'hello', language: 'en' }]);
});

// SHARED-CARD-003 — pure view-model helpers for the ordinary level card.
// The engine renders the shared card from these values, so their language
// metadata is unit-pinned (LF-CARD / SC2-C1-DESIGN-001 analog for levels).
function loadHelpers() {
    const source = readFileSync(new URL('../../js/core/flashcards.js', import.meta.url), 'utf8')
        .replace(/^import .*$/gm, '')
        .replace(/^export\s+/gm, '');
    const sandbox = {
        window: { app: { speakText: () => {} } },
        calculateNextReview: () => ({}),
        getLocalDateString: () => '2026-08-30'
    };
    vm.createContext(sandbox);
    vm.runInContext(
        source + '\n;globalThis.__HELPERS = { firstExample, translationDisplayAttrs };',
        sandbox,
        { filename: 'js/core/flashcards.js' }
    );
    return sandbox.__HELPERS;
}

test('SHARED-CARD-003 unit: translationDisplayAttrs derives direction and language metadata (SC3/LF-CARD)', () => {
    const { translationDisplayAttrs } = loadHelpers();
    // Copy into a host object first: values created inside the VM sandbox
    // carry the sandbox's Object prototype.
    const attrs = (language) => {
        const result = translationDisplayAttrs(language);
        return { dir: result.dir, lang: result.lang };
    };

    assert.deepEqual(attrs('en'), { dir: 'ltr', lang: 'en' });
    assert.deepEqual(attrs('ar'), { dir: 'rtl', lang: 'ar' });
    // Mixed display text is never labeled with a single language; automatic
    // direction keeps either script readable (SC2-C1-DESIGN-001 analog).
    assert.deepEqual(attrs('mixed'), { dir: 'auto', lang: null });
    assert.deepEqual(attrs(null), { dir: 'auto', lang: null });
    assert.deepEqual(attrs(undefined), { dir: 'auto', lang: null });
    assert.deepEqual(attrs(''), { dir: 'auto', lang: null });
});

test('SHARED-CARD-003 unit: firstExample returns exactly the first structured example or null', () => {
    const { firstExample } = loadHelpers();

    const twoExamples = {
        id: '1-2',
        examples: [
            { de: 'Erstes Beispiel.', translation: 'First example.', translationLanguage: 'en' },
            { de: 'Zweites Beispiel.', translation: 'Second example.', translationLanguage: 'en' }
        ]
    };
    assert.equal(firstExample(twoExamples), twoExamples.examples[0]);

    const noExamples = { id: '1-1', examples: [] };
    assert.equal(firstExample(noExamples), null);

    // Legacy/unnormalized cards carry no examples array at all.
    assert.equal(firstExample({ id: 'legacy', de: 'Hallo' }), null);
    assert.equal(firstExample(null), null);
});
