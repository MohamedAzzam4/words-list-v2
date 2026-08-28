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
