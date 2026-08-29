import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// SHARED-CARD-002 unit tests for the pure shared-card presentation module.
// Browser ESM files live in a CommonJS package, so — like the other tracked
// unit tests — the module source is loaded into a VM context with its import
///export syntax stripped and its one pure dependency (sanitize) injected.
// Real browser loading of the module is proven by the E2E specs, which boot
// verbs.html and assert the rendered shared shell.

const MODULE_SOURCE = readFileSync(new URL('../../js/core/shared-card.js', import.meta.url), 'utf8');
const RAW_SOURCE = readFileSync(new URL('../../js/core/shared-card.js', import.meta.url), 'utf8');

function loadModule() {
    const source = MODULE_SOURCE
        .replace(/^import .*$/gm, '')
        .replace(/^export\s+/gm, '');
    const sandbox = {
        sanitize: (str) => {
            if (typeof str !== 'string') return str;
            return str
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }
    };
    vm.createContext(sandbox);
    vm.runInContext(
        source + '\n;globalThis.__MOD = { renderCardAffordances, renderCardFront, renderHintBox, renderExampleBlock, renderSharedCard };',
        sandbox,
        { filename: 'js/core/shared-card.js' }
    );
    return sandbox.__MOD;
}

const MOD = loadModule();

test('SHARED-CARD-002 unit: unrevealed front renders the shell with an empty lazy back face', () => {
    const html = MOD.renderSharedCard({
        mode: 'ordinary',
        flippable: true,
        flipped: false,
        ariaLabel: 'Verb flashcard: activate to flip',
        frontHtml: MOD.renderCardFront({ contentHtml: '<div class="verb-label">Verb (German)</div>' }),
        backHtml: ''
    });

    assert.match(html, /shared-card-block shared-card-ordinary/);
    assert.match(html, /class="verb-flashcard" data-action="flip" tabindex="0" role="button"/);
    // The back FACE exists (3D flip mechanics) but stays EMPTY before reveal.
    assert.ok(html.includes('<div class="verb-card-back"></div>'), 'unrevealed back face must be empty');
    assert.doesNotMatch(html, /flipped/);
});

test('SHARED-CARD-002 unit: lazy revealed back carries the answer content and the flipped state', () => {
    const html = MOD.renderSharedCard({
        mode: 'guided',
        flippable: true,
        flipped: true,
        frontHtml: MOD.renderCardFront({ contentHtml: 'PROMPT' }),
        backHtml: '<div class="guided-answer">ANTWORT</div>'
    });

    assert.match(html, /class="verb-flashcard flipped"/);
    assert.ok(html.includes('<div class="guided-answer">ANTWORT</div>'));
});

test('SHARED-CARD-002 unit: example block renders ONLY the first example with its translation always visible (SC-02)', () => {
    const html = MOD.renderExampleBlock({ de: 'Ich mache die Hausaufgaben.', en: 'I do the homework.' });

    assert.match(html, /back-example-box/);
    assert.match(html, /💬 Ich mache die Hausaufgaben\./);
    // Translation is visible — no hidden class, no chip toggle.
    assert.match(html, /class="ex-en-line">\(I do the homework\.\)</);
    assert.doesNotMatch(html, /ex-en-chip/);
    assert.doesNotMatch(html, /hidden/);
    // The block is built from a single (first) pair by construction — the
    // caller can only pass one example in.
    const single = (html.match(/ex-sentence-span/g) || []).length;
    assert.equal(single, 1);
});

test('SHARED-CARD-002 unit: example block without a translation shows the sentence and no translation line', () => {
    const html = MOD.renderExampleBlock({ de: 'Ich grüble über die Frage.', en: '' });
    assert.match(html, /💬 Ich grüble über die Frage\./);
    assert.doesNotMatch(html, /ex-en-line/);
});

test('SHARED-CARD-002 unit: no-example state renders nothing — no stale or placeholder content', () => {
    assert.equal(MOD.renderExampleBlock({ de: '', en: '' }), '');
    assert.equal(MOD.renderExampleBlock({}), '');
});

test('SHARED-CARD-002 unit: adapter-specific actions are placed below the card, verbatim', () => {
    const html = MOD.renderSharedCard({
        mode: 'ordinary',
        frontHtml: MOD.renderCardFront({ contentHtml: 'X' }),
        actionsHtml: '<div class="verb-card-controls"><button data-action="mark-known">✅ Known</button></div>'
    });

    const cardEnd = html.indexOf('</div>\n            <div class="verb-card-controls">');
    assert.ok(cardEnd > 0, 'adapter actions must render after the card, inside the shared block');
    assert.match(html, /data-action="mark-known"/);
    // The renderer adds no actions of its own.
    assert.doesNotMatch(html, /mark-learning|challenge-grade/);
});

test('SHARED-CARD-002 unit: the renderer has no storage/scheduler/persistence/DOM dependency (FP-DESIGN-009)', () => {
    // The shared renderer may own generic presentation only: its source must
    // not reference storage, the challenge scheduler, persistence, TTS or the
    // DOM platform at all.
    const forbidden = [
        /\blocalStorage\b/, /\bsaveLocalProgress\b/, /\bmergeProgress\b/,
        /\bchallengeEngine\b/, /\bVerbChallengeEngine\b/, /\bchallengeGrade\b/,
        /\bfbSaveProgress\b/, /\bfirebase\b/i, /\bspeak\s*\(/,
        /\bspeechSynthesis\b/, /\bdocument\b/, /\bwindow\b/, /\bfetch\s*\(/,
        /\bquerySelector\b/, /\binnerHTML\s*=/
    ];
    for (const pattern of forbidden) {
        assert.doesNotMatch(RAW_SOURCE, pattern, `shared-card.js must not contain ${pattern}`);
    }
});

test('SHARED-CARD-002 unit: safe escaping — example data is sanitized in text and attributes', () => {
    const html = MOD.renderExampleBlock({ de: 'Er sagt "Hallo" <b>', en: "He says 'hi' & more" });

    // Attribute payload is escaped.
    assert.ok(html.includes('data-text="Er sagt &quot;Hallo&quot; &lt;b&gt;"'));
    // Visible text is escaped.
    assert.ok(html.includes('💬 Er sagt &quot;Hallo&quot; &lt;b&gt;'));
    assert.ok(html.includes("(He says &#39;hi&#39; &amp; more)"));
});

test('SHARED-CARD-002 unit: hidden metadata — the favorite button carries no card id and a hidden hint carries no text (SC-01b/d)', () => {
    const affordances = MOD.renderCardAffordances({
        hint: { label: 'Get a hint' },
        speak: { title: 'Speak Verb' },
        favorite: { active: false }
    });
    assert.match(affordances, /data-action="toggle-hint"/);
    assert.match(affordances, /data-action="speak"/);
    assert.match(affordances, /data-action="fav"/);
    assert.doesNotMatch(affordances, /data-verb-id/, 'shared favorite must not embed a card id');
    // Favorite is a real button (keyboard-operable), not a click-only span.
    assert.match(affordances, /<button[^>]*class="fav-icon-btn card-affordance"/);

    const hiddenHint = MOD.renderHintBox({ visible: false, html: '<span>Hint:</span> Verb Infinitive: mac...' });
    assert.match(hiddenHint, /hidden/);
    assert.doesNotMatch(hiddenHint, /mac\.\.\./, 'hidden hint must not contain the hint text');

    const shownHint = MOD.renderHintBox({ visible: true, html: '<span>Hint:</span> to make, to do' });
    assert.ok(shownHint.includes('to make, to do'));
    assert.doesNotMatch(shownHint, /hidden/);
});

test('SHARED-CARD-002 unit: non-flippable presentation card exposes no flip affordance', () => {
    const html = MOD.renderSharedCard({
        mode: 'guided',
        flippable: false,
        frontHtml: MOD.renderCardFront({ contentHtml: 'New Word' })
    });

    assert.doesNotMatch(html, /data-action="flip"/);
    assert.doesNotMatch(html, /tabindex/);
    assert.doesNotMatch(html, /verb-card-back/);
});
