// AUDIO-002: Verbs autoplay adapter + SpeechQueue ownership unit tests.
//
// Two layers, both deterministic (no real browser, no real speech, no wall-
// clock sleeps):
//  A) The Verbs adapter: js/core/verbs-engine.js is loaded into a VM context
//     with its import/export syntax stripped and its dependencies injected
//     (the tracked unit-test pattern for browser ESM files in this CommonJS
//     package). The REAL AUDIO-001 planner (js/core/speech-plan.mjs) and the
//     REAL cleanTextForAudio are injected, so the adapter is verified against
//     the actual planning boundary, not a reimplementation. SpeechQueue is a
//     recording stub so the exact queue records handed to the queue can be
//     asserted with hand-written expected arrays.
//  B) The SpeechQueue lifecycle: js/core/tts.js is loaded into its own VM
//     context with a mock window.speechSynthesis and mock
//     SpeechSynthesisUtterance; node:test mock timers drive the 250ms
//     delayed-speak, the 12s watchdog, and the 1500ms no-synthesis fallback
//     deterministically (TS-TEST-004: mock the platform, not the app logic).
//
// Contract refs: AC-11 (deterministic speech steps), AC-12 (lifecycle agrees
// with queue; stale callbacks cannot restart it), LF-AUDIO (autoplay options;
// never mixed text under a single-language voice), FP-FLOW-005 / TS-TEST-005
// (no timing sleeps; independent oracles), TS-MUT (probe-detectable
// assertions).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { planSpeechSequence } from '../../js/core/speech-plan.mjs';

// ─────────────────────────────────────────────────────────────────────────────
// Shared sources and VM loaders
// ─────────────────────────────────────────────────────────────────────────────

const TTS_SOURCE = readFileSync(new URL('../../js/core/tts.js', import.meta.url), 'utf8');
const VERBS_ENGINE_SOURCE = readFileSync(new URL('../../js/core/verbs-engine.js', import.meta.url), 'utf8');

// Each static import in verbs-engine.js ends with `} from '…';` (single- or
// multi-line). Removing from the leading `import` to that terminator keeps
// every other line of the module intact.
function stripStaticImports(source) {
    return source.replace(/^import\b[\s\S]*?from\s+'[^']*';[ \t]*$/gm, '');
}

function stripExports(source) {
    return source.replace(/^export\s+/gm, '');
}

// ── Layer B: the real tts.js SpeechQueue ────────────────────────────────────

const synthWindow = { speechSynthesis: null };
let synthState = null;

function installMockSynthesis() {
    synthState = { utterances: [], current: null, cancelCount: 0 };
    const synth = {
        speaking: false,
        paused: false,
        pending: false,
        onvoiceschanged: null,
        getVoices: () => [],
        speak: (utterance) => {
            synth.speaking = true;
            synthState.utterances.push(utterance);
            synthState.current = utterance;
        },
        pause: () => { synth.paused = true; },
        resume: () => { synth.paused = false; },
        cancel: () => { synth.speaking = false; synthState.cancelCount++; }
    };
    synthWindow.speechSynthesis = synth;
    return synth;
}

installMockSynthesis();

const TTS_SANDBOX = {
    console,
    window: synthWindow,
    // Call-time indirection: with node:test mock timers enabled, these arrows
    // resolve the CURRENT (possibly mocked) global timer functions.
    setTimeout: (...args) => setTimeout(...args),
    clearTimeout: (...args) => clearTimeout(...args),
    SpeechSynthesisUtterance: class MockUtterance {
        constructor(text) { this.text = text; }
    }
};
vm.createContext(TTS_SANDBOX);
vm.runInContext(
    stripExports(stripStaticImports(TTS_SOURCE)) +
    '\n;globalThis.__MOD = { SpeechQueue, cleanTextForAudio };',
    TTS_SANDBOX,
    { filename: 'js/core/tts.js' }
);
const { SpeechQueue, cleanTextForAudio } = TTS_SANDBOX.__MOD;

// ── Layer A: the real verbs-engine controller with stubbed platform deps ──

// Recording fake elements so the A12 control-state assertions are observable.
function fakeElement(extra) {
    const el = { innerHTML: '', textContent: '', value: '', checked: false, classes: [] };
    el.classList = {
        add: (...names) => { el.classes.push(...names); },
        remove: (...names) => {
            for (const name of names) {
                const at = el.classes.indexOf(name);
                if (at !== -1) el.classes.splice(at, 1);
            }
        },
        contains: (name) => el.classes.includes(name),
        toggle: (name, force) => {
            const want = force === undefined ? !el.classes.includes(name) : force;
            if (want && !el.classes.includes(name)) el.classes.push(name);
            if (!want) el.classList.remove(name);
        }
    };
    return Object.assign(el, extra || {});
}

function makeControls(options) {
    const cfg = Object.assign({ repeat: '2', mode: 'first', includeEn: true, start: '0' }, options);
    return {
        'auto-repeat-count': fakeElement({ value: cfg.repeat }),
        'auto-example-mode': fakeElement({ value: cfg.mode }),
        'auto-include-en': fakeElement({ checked: cfg.includeEn }),
        'auto-start-verb': fakeElement({ value: cfg.start }),
        'btn-play-all-words': fakeElement(),
        'btn-pause-words': fakeElement(),
        'floating-audio-bar': fakeElement(),
        'fab-current-verb': fakeElement(),
        'fab-pause-icon': fakeElement()
    };
}

let controls = makeControls();
const queueLog = { playAllCalls: [], isPlaying: false };
const speechQueueStub = {
    get isPlaying() { return queueLog.isPlaying; },
    playAll(items, onHighlight, onFinished) {
        queueLog.playAllCalls.push({ items: items.slice(), onHighlight, onFinished });
        queueLog.isPlaying = true;
    },
    stop() { queueLog.isPlaying = false; },
    pause() { queueLog.isPlaying = false; },
    resume() { queueLog.isPlaying = true; },
    speakSingle() {}
};

const documentStub = {
    getElementById: (id) => (Object.prototype.hasOwnProperty.call(controls, id) ? controls[id] : null),
    querySelectorAll: () => []
};

function loadVerbsEngineModule() {
    const sandbox = {
        console,
        window: {},
        document: documentStub,
        // tts.js boundary (SpeechQueue stubbed; cleanTextForAudio is real).
        speak: () => {},
        cleanTextForAudio,
        SpeechQueue: speechQueueStub,
        setSpeakHook: () => {},
        playChime: () => {},
        // firebase.js boundary: stubbed; autoplay paths never call it.
        initFirebase: () => ({ auth: null, db: null }),
        fbLoginWithGoogle: () => Promise.resolve({}),
        fbLogout: () => Promise.resolve(),
        fbLoadProgress: () => Promise.resolve(null),
        fbSaveProgress: () => Promise.resolve(),
        listenAuth: () => () => {},
        updateLeaderboard: () => Promise.resolve(),
        fbLoginWithEmail: () => Promise.resolve({}),
        fbSignUpWithEmail: () => Promise.resolve({}),
        // storage.js boundary.
        getLocalProgress: () => ({}),
        getLocalProgressForUser: () => ({}),
        saveLocalProgress: () => {},
        mergeProgress: (data) => data,
        clearLocalProgress: () => {},
        getDefaultProgressObj: () => ({}),
        mergeVerbRecord: (record) => record,
        // utils.js boundary.
        sanitize: (str) => String(str),
        debounce: () => () => {},
        // service/engine boundaries.
        ActivityService: class { constructor() {} },
        TrophyEngine: class { constructor() {} },
        VERB_TROPHIES: [],
        LeaderboardService: class { constructor() {} },
        getLocalDateString: () => '2026-09-01',
        calculateNextReview: () => 0,
        renderCardAffordances: () => '',
        renderCardFront: () => '',
        renderExampleBlock: () => '',
        renderHintBox: () => '',
        renderSharedCard: () => '',
        VerbChallengeEngine: class { constructor() {} },
        PHASE_ACQUISITION: 'acquisition',
        PHASE_RECOGNITION: 'recognition',
        PHASE_PRODUCTION: 'production',
        PHASE_REVIEW: 'review',
        PHASE_COMPLETE: 'complete',
        // The REAL AUDIO-001 planner: the adapter is tested against the
        // actual planning boundary.
        planSpeechSequence
    };
    vm.createContext(sandbox);
    vm.runInContext(
        stripExports(stripStaticImports(VERBS_ENGINE_SOURCE)) +
        '\n;globalThis.__MOD = {' +
        ' VerbsEngine: (typeof VerbsEngine !== "undefined") ? VerbsEngine : null,' +
        ' mapVerbToSpeechCard: (typeof mapVerbToSpeechCard !== "undefined") ? mapVerbToSpeechCard : null,' +
        ' mapSpeechStepsToQueueItems: (typeof mapSpeechStepsToQueueItems !== "undefined") ? mapSpeechStepsToQueueItems : null' +
        ' };',
        sandbox,
        { filename: 'js/core/verbs-engine.js' }
    );
    return sandbox.__MOD;
}

const VerbsMod = loadVerbsEngineModule();
const engine = VerbsMod.VerbsEngine;

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures (synthetic verbs mirroring the real dataset fields)
// ─────────────────────────────────────────────────────────────────────────────

function makeVerb(id, index, infinitive, meaning, exampleDe, exampleEn) {
    return {
        id,
        index,
        infinitive,
        meaning,
        exampleDe,
        exampleEn,
        prefixInfo: { isSeparable: false },
        tags: []
    };
}

const V_MACHEN = makeVerb('v_machen', 1, 'machen', 'to make',
    'Ich mache das. | Du machst das.', 'I do it. (Präsens) | You do it. (Präteritum)');
const V_GEHEN = makeVerb('v_gehen', 2, 'gehen', 'to go',
    'Ich gehe. | Wir gehen.', 'I go. | We go.');
const V_SEHEN = makeVerb('v_sehen', 3, 'sehen', 'to see', 'Ich sehe.', 'I see.');

function qItem(verb, text, lang, label) {
    return {
        verbId: verb.id,
        verbInfinitive: verb.infinitive,
        verbIndex: verb.index,
        text,
        lang,
        label
    };
}

// Independent expected blocks, hand-written per repetition.
const MACHEN_REPEAT = (verb, n) => ([
    qItem(verb, 'machen', 'de', `Verb (${n}/2)`),
    qItem(verb, 'to make', 'en', 'Translation'),
    qItem(verb, 'Ich mache das.', 'de', 'Example (DE)'),
    qItem(verb, 'I do it.', 'en', 'Example (EN)')
]);
const GEHEN_REPEAT = (verb, n) => ([
    qItem(verb, 'gehen', 'de', `Verb (${n}/2)`),
    qItem(verb, 'to go', 'en', 'Translation'),
    qItem(verb, 'Ich gehe.', 'de', 'Example (DE)'),
    qItem(verb, 'I go.', 'en', 'Example (EN)')
]);
const SEHEN_REPEAT = (verb, n) => ([
    qItem(verb, 'sehen', 'de', `Verb (${n}/2)`),
    qItem(verb, 'to see', 'en', 'Translation'),
    qItem(verb, 'Ich sehe.', 'de', 'Example (DE)'),
    qItem(verb, 'I see.', 'en', 'Example (EN)')
]);

// The VM executes in its own realm, so queue records created inside it do
// not share prototypes with test-realm objects. A JSON round-trip normalizes
// them for strict structural comparison (the records are plain data).
function plainItems(items) {
    return JSON.parse(JSON.stringify(items));
}

function resetAdapterHarness(options) {
    queueLog.playAllCalls.length = 0;
    queueLog.isPlaying = false;
    controls = makeControls(options);
    engine.queue = [];
}

// ─────────────────────────────────────────────────────────────────────────────
// A) Verbs adapter / planner integration (VM-loaded real controller)
// ─────────────────────────────────────────────────────────────────────────────

test('AUDIO-002 A1: default controls plan term, English translation, and first-example steps per repetition in item-major order', () => {
    resetAdapterHarness({ repeat: '2', mode: 'first', includeEn: true, start: '0' });
    engine.queue = [V_MACHEN, V_GEHEN, V_SEHEN];

    engine.playAllVerbsAudio();

    assert.equal(queueLog.playAllCalls.length, 1);
    assert.deepEqual(plainItems(queueLog.playAllCalls[0].items), [
        ...MACHEN_REPEAT(V_MACHEN, 1),
        ...MACHEN_REPEAT(V_MACHEN, 2),
        ...GEHEN_REPEAT(V_GEHEN, 1),
        ...GEHEN_REPEAT(V_GEHEN, 2),
        ...SEHEN_REPEAT(V_SEHEN, 1),
        ...SEHEN_REPEAT(V_SEHEN, 2)
    ]);
});

test('AUDIO-002 A2: repeatCount 3 emits three full repetitions of a verb before anything else', () => {
    resetAdapterHarness({ repeat: '3', mode: 'first', includeEn: true, start: '0' });
    engine.queue = [V_MACHEN, V_SEHEN];

    engine.playAllVerbsAudio();

    assert.equal(queueLog.playAllCalls.length, 1);
    assert.deepEqual(plainItems(queueLog.playAllCalls[0].items), [
        qItem(V_MACHEN, 'machen', 'de', 'Verb (1/3)'),
        qItem(V_MACHEN, 'to make', 'en', 'Translation'),
        qItem(V_MACHEN, 'Ich mache das.', 'de', 'Example (DE)'),
        qItem(V_MACHEN, 'I do it.', 'en', 'Example (EN)'),
        qItem(V_MACHEN, 'machen', 'de', 'Verb (2/3)'),
        qItem(V_MACHEN, 'to make', 'en', 'Translation'),
        qItem(V_MACHEN, 'Ich mache das.', 'de', 'Example (DE)'),
        qItem(V_MACHEN, 'I do it.', 'en', 'Example (EN)'),
        qItem(V_MACHEN, 'machen', 'de', 'Verb (3/3)'),
        qItem(V_MACHEN, 'to make', 'en', 'Translation'),
        qItem(V_MACHEN, 'Ich mache das.', 'de', 'Example (DE)'),
        qItem(V_MACHEN, 'I do it.', 'en', 'Example (EN)'),
        qItem(V_SEHEN, 'sehen', 'de', 'Verb (1/3)'),
        qItem(V_SEHEN, 'to see', 'en', 'Translation'),
        qItem(V_SEHEN, 'Ich sehe.', 'de', 'Example (DE)'),
        qItem(V_SEHEN, 'I see.', 'en', 'Example (EN)'),
        qItem(V_SEHEN, 'sehen', 'de', 'Verb (2/3)'),
        qItem(V_SEHEN, 'to see', 'en', 'Translation'),
        qItem(V_SEHEN, 'Ich sehe.', 'de', 'Example (DE)'),
        qItem(V_SEHEN, 'I see.', 'en', 'Example (EN)'),
        qItem(V_SEHEN, 'sehen', 'de', 'Verb (3/3)'),
        qItem(V_SEHEN, 'to see', 'en', 'Translation'),
        qItem(V_SEHEN, 'Ich sehe.', 'de', 'Example (DE)'),
        qItem(V_SEHEN, 'I see.', 'en', 'Example (EN)')
    ]);
});

test('AUDIO-002 A3: exampleMode none emits only the term and translation steps', () => {
    resetAdapterHarness({ repeat: '1', mode: 'none', includeEn: true, start: '0' });
    engine.queue = [V_MACHEN];

    engine.playAllVerbsAudio();

    assert.deepEqual(plainItems(queueLog.playAllCalls[0].items), [
        qItem(V_MACHEN, 'machen', 'de', 'Verb (1/1)'),
        qItem(V_MACHEN, 'to make', 'en', 'Translation')
    ]);
});

test('AUDIO-002 A4: exampleMode first emits only the first example pair', () => {
    resetAdapterHarness({ repeat: '1', mode: 'first', includeEn: true, start: '0' });
    engine.queue = [V_MACHEN];

    engine.playAllVerbsAudio();

    assert.deepEqual(plainItems(queueLog.playAllCalls[0].items), [
        qItem(V_MACHEN, 'machen', 'de', 'Verb (1/1)'),
        qItem(V_MACHEN, 'to make', 'en', 'Translation'),
        qItem(V_MACHEN, 'Ich mache das.', 'de', 'Example (DE)'),
        qItem(V_MACHEN, 'I do it.', 'en', 'Example (EN)')
    ]);
});

test('AUDIO-002 A5: exampleMode all emits every example pair in source order', () => {
    resetAdapterHarness({ repeat: '1', mode: 'all', includeEn: true, start: '0' });
    engine.queue = [V_MACHEN];

    engine.playAllVerbsAudio();

    assert.deepEqual(plainItems(queueLog.playAllCalls[0].items), [
        qItem(V_MACHEN, 'machen', 'de', 'Verb (1/1)'),
        qItem(V_MACHEN, 'to make', 'en', 'Translation'),
        qItem(V_MACHEN, 'Ich mache das.', 'de', 'Example (DE)'),
        qItem(V_MACHEN, 'I do it.', 'en', 'Example (EN)'),
        qItem(V_MACHEN, 'Du machst das.', 'de', 'Example (DE)'),
        qItem(V_MACHEN, 'You do it.', 'en', 'Example (EN)')
    ]);
});

test('AUDIO-002 A6: include-English unchecked omits every English translation step', () => {
    resetAdapterHarness({ repeat: '1', mode: 'first', includeEn: false, start: '0' });
    engine.queue = [V_MACHEN, V_SEHEN];

    engine.playAllVerbsAudio();

    assert.deepEqual(plainItems(queueLog.playAllCalls[0].items), [
        qItem(V_MACHEN, 'machen', 'de', 'Verb (1/1)'),
        qItem(V_MACHEN, 'Ich mache das.', 'de', 'Example (DE)'),
        qItem(V_SEHEN, 'sehen', 'de', 'Verb (1/1)'),
        qItem(V_SEHEN, 'Ich sehe.', 'de', 'Example (DE)')
    ]);
});

test('AUDIO-002 A7: the Start-At dropdown selection begins the plan at that queue position', () => {
    resetAdapterHarness({ repeat: '1', mode: 'first', includeEn: true, start: '1' });
    engine.queue = [V_MACHEN, V_GEHEN, V_SEHEN];

    engine.playAllVerbsAudio();

    assert.equal(queueLog.playAllCalls.length, 1);
    assert.deepEqual(plainItems(queueLog.playAllCalls[0].items), [
        qItem(V_GEHEN, 'gehen', 'de', 'Verb (1/1)'),
        qItem(V_GEHEN, 'to go', 'en', 'Translation'),
        qItem(V_GEHEN, 'Ich gehe.', 'de', 'Example (DE)'),
        qItem(V_GEHEN, 'I go.', 'en', 'Example (EN)'),
        qItem(V_SEHEN, 'sehen', 'de', 'Verb (1/1)'),
        qItem(V_SEHEN, 'to see', 'en', 'Translation'),
        qItem(V_SEHEN, 'Ich sehe.', 'de', 'Example (DE)'),
        qItem(V_SEHEN, 'I see.', 'en', 'Example (EN)')
    ]);
});

test('AUDIO-002 A8: a row-play startIndex begins at that row and syncs the Start-At dropdown', () => {
    resetAdapterHarness({ repeat: '1', mode: 'first', includeEn: true, start: '0' });
    engine.queue = [V_MACHEN, V_GEHEN, V_SEHEN];

    engine.playAllVerbsAudio(2);

    assert.equal(queueLog.playAllCalls.length, 1);
    assert.deepEqual(plainItems(queueLog.playAllCalls[0].items), [
        qItem(V_SEHEN, 'sehen', 'de', 'Verb (1/1)'),
        qItem(V_SEHEN, 'to see', 'en', 'Translation'),
        qItem(V_SEHEN, 'Ich sehe.', 'de', 'Example (DE)'),
        qItem(V_SEHEN, 'I see.', 'en', 'Example (EN)')
    ]);
    // The Start-At dropdown follows the row that actually started playback
    // (a real DOM select coerces the assignment to the option string).
    assert.equal(String(controls['auto-start-verb'].value), '2');
});

test('AUDIO-002 A9: out-of-range start values clamp to the last verb instead of producing an empty queue', () => {
    resetAdapterHarness({ repeat: '1', mode: 'first', includeEn: true, start: '999' });
    engine.queue = [V_MACHEN, V_GEHEN, V_SEHEN];

    engine.playAllVerbsAudio();

    // The queue must never be left empty by an out-of-range start: playback
    // starts at the LAST verb (controls and utterance queue agree).
    assert.equal(queueLog.playAllCalls.length, 1);
    assert.deepEqual(plainItems(queueLog.playAllCalls[0].items), [
        qItem(V_SEHEN, 'sehen', 'de', 'Verb (1/1)'),
        qItem(V_SEHEN, 'to see', 'en', 'Translation'),
        qItem(V_SEHEN, 'Ich sehe.', 'de', 'Example (DE)'),
        qItem(V_SEHEN, 'I see.', 'en', 'Example (EN)')
    ]);
    assert.equal(String(controls['auto-start-verb'].value), '2');
});

test('AUDIO-002 A10: planned queue items carry the stable verb identity, the planner language, and the text', () => {
    resetAdapterHarness({ repeat: '1', mode: 'first', includeEn: true, start: '0' });
    engine.queue = [V_MACHEN];

    engine.playAllVerbsAudio();

    const items = queueLog.playAllCalls[0].items;
    assert.equal(items.length, 4);
    // German term: planner language 'de'.
    assert.equal(items[0].text, 'machen');
    assert.equal(items[0].lang, 'de');
    assert.equal(items[0].verbId, 'v_machen');
    assert.equal(items[0].verbIndex, 1);
    assert.equal(items[0].verbInfinitive, 'machen');
    // English translation: planner language 'en'.
    assert.equal(items[1].text, 'to make');
    assert.equal(items[1].lang, 'en');
    assert.equal(items[1].verbId, 'v_machen');
    // German example and English example translation keep their languages.
    assert.equal(items[2].text, 'Ich mache das.');
    assert.equal(items[2].lang, 'de');
    assert.equal(items[3].text, 'I do it.');
    assert.equal(items[3].lang, 'en');
});

test('AUDIO-002 A11: verbs with missing text are skipped by the planner without substituting another language', () => {
    resetAdapterHarness({ repeat: '1', mode: 'first', includeEn: true, start: '0' });
    const vNoExamples = makeVerb('v_empty', 9, 'tun', '', '', '');
    const vNoGerman = makeVerb('v_nogerman', 10, '', 'to y', '', '');
    engine.queue = [vNoExamples, vNoGerman, V_MACHEN];

    engine.playAllVerbsAudio();

    // 'tun' has no translation and no examples: term only.
    // The verb without a German term keeps only its English translation
    // (no empty German step is queued and no other language is substituted).
    assert.deepEqual(plainItems(queueLog.playAllCalls[0].items), [
        qItem(vNoExamples, 'tun', 'de', 'Verb (1/1)'),
        qItem(vNoGerman, 'to y', 'en', 'Translation'),
        qItem(V_MACHEN, 'machen', 'de', 'Verb (1/1)'),
        qItem(V_MACHEN, 'to make', 'en', 'Translation'),
        qItem(V_MACHEN, 'Ich mache das.', 'de', 'Example (DE)'),
        qItem(V_MACHEN, 'I do it.', 'en', 'Example (EN)')
    ]);
    for (const item of queueLog.playAllCalls[0].items) {
        assert.notEqual(item.text, '');
    }
});

test('AUDIO-002 A12: an empty planned sequence leaves the controls unchanged and never starts the queue', () => {
    resetAdapterHarness({ repeat: '1', mode: 'none', includeEn: false, start: '0' });
    const vNothing = makeVerb('v_nothing', 11, '', '', '', '');
    engine.queue = [vNothing];

    engine.playAllVerbsAudio();

    // Nothing is speakable: the queue must not start and the visible controls
    // must not claim a playing state that no utterance queue backs.
    assert.equal(queueLog.playAllCalls.length, 0);
    const playButton = controls['btn-play-all-words'];
    assert.equal(playButton.innerHTML, '');
    assert.equal(playButton.classes.includes('playing'), false);
    assert.equal(controls['btn-pause-words'].classes.includes('hidden'), false);
    assert.equal(controls['floating-audio-bar'].classes.includes('hidden'), false);
});

// ─────────────────────────────────────────────────────────────────────────────
// B) SpeechQueue ownership and lifecycle (real tts.js, mock timers)
// ─────────────────────────────────────────────────────────────────────────────

const QUEUE_ITEMS = [
    { text: 'eins', lang: 'de' },
    { text: 'one', lang: 'en' },
    { text: 'zwei', lang: 'de' }
];

function resetQueueHarness() {
    installMockSynthesis();
    SpeechQueue.stop();
}

test('AUDIO-002 B1: playAll speaks each item once in order, highlights each item, and fires completion exactly once at drain', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    resetQueueHarness();
    const highlights = [];
    let completions = 0;

    SpeechQueue.playAll(QUEUE_ITEMS,
        (idx, item) => highlights.push({ idx, text: item.text }),
        () => { completions++; }
    );

    // The first highlight fires synchronously before the speak delay.
    assert.deepEqual(highlights, [{ idx: 0, text: 'eins' }]);

    t.mock.timers.tick(250);
    assert.equal(synthState.utterances.length, 1);
    assert.equal(synthState.utterances[0].text, 'eins');
    assert.equal(synthState.utterances[0].lang, 'de-DE');
    synthState.current.onend(new Event('end'));

    t.mock.timers.tick(250);
    assert.equal(synthState.utterances[1].text, 'one');
    assert.equal(synthState.utterances[1].lang, 'en-US');
    synthState.current.onend(new Event('end'));

    t.mock.timers.tick(250);
    assert.equal(synthState.utterances[2].text, 'zwei');
    synthState.current.onend(new Event('end'));

    assert.equal(synthState.utterances.length, 3);
    assert.deepEqual(highlights.map((h) => h.idx), [0, 1, 2]);
    assert.equal(completions, 1);
    assert.equal(SpeechQueue.isPlaying, false);
    SpeechQueue.stop();
});

test('AUDIO-002 B2: stop during the delayed-speak window prevents any utterance', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    resetQueueHarness();
    let completions = 0;

    SpeechQueue.playAll(QUEUE_ITEMS, () => {}, () => { completions++; });
    SpeechQueue.stop();

    t.mock.timers.tick(250);
    t.mock.timers.tick(1500);
    assert.equal(synthState.utterances.length, 0);
    assert.equal(completions, 0);
    assert.equal(SpeechQueue.isPlaying, false);
});

test('AUDIO-002 B3: pause preserves the cursor and queue; a stale onend cannot advance or complete the paused queue', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    resetQueueHarness();
    let completions = 0;

    SpeechQueue.playAll(QUEUE_ITEMS, () => {}, () => { completions++; });
    t.mock.timers.tick(250); // 'eins' is speaking
    const pausedUtterance = synthState.current;

    SpeechQueue.pause();
    assert.equal(SpeechQueue.isPlaying, false);
    assert.equal(SpeechQueue.currentIndex, 0);
    assert.equal(SpeechQueue.queue.length, 3);

    // A browser may still fire onend for the canceled utterance.
    pausedUtterance.onend(new Event('end'));
    assert.equal(SpeechQueue.currentIndex, 0);
    assert.equal(SpeechQueue.queue.length, 3);
    assert.equal(completions, 0);

    // Resume: the same item is re-spoken exactly once (no skip, no duplicate).
    SpeechQueue.resume();
    t.mock.timers.tick(250);
    assert.equal(synthState.utterances.length, 2);
    assert.equal(synthState.utterances[1].text, 'eins');
    synthState.current.onend(new Event('end'));
    t.mock.timers.tick(250);
    assert.equal(synthState.utterances[2].text, 'one');
    SpeechQueue.stop();
});

test('AUDIO-002 B4: resume after a pause during the speak delay re-speaks the current item exactly once', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    resetQueueHarness();
    const highlights = [];

    SpeechQueue.playAll(QUEUE_ITEMS, (idx) => highlights.push(idx), () => {});
    // Pause inside the 250ms window BEFORE the first utterance exists.
    SpeechQueue.pause();

    t.mock.timers.tick(250);
    assert.equal(synthState.utterances.length, 0);
    assert.equal(SpeechQueue.currentIndex, 0);

    SpeechQueue.resume();
    t.mock.timers.tick(250);
    assert.equal(synthState.utterances.length, 1);
    assert.equal(synthState.utterances[0].text, 'eins');
    assert.deepEqual(highlights, [0, 0]);
    SpeechQueue.stop();
});

test('AUDIO-002 B5: canceled and interrupted utterance errors do not advance; a genuine error advances', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    resetQueueHarness();
    let completions = 0;

    SpeechQueue.playAll(QUEUE_ITEMS, () => {}, () => { completions++; });
    t.mock.timers.tick(250);
    const utterance = synthState.current;

    utterance.onerror({ error: 'canceled' });
    assert.equal(SpeechQueue.currentIndex, 0);
    utterance.onerror({ error: 'interrupted' });
    assert.equal(SpeechQueue.currentIndex, 0);
    assert.equal(completions, 0);

    utterance.onerror({ error: 'synthesis-failed' });
    assert.equal(SpeechQueue.currentIndex, 1);
    t.mock.timers.tick(250);
    assert.equal(synthState.utterances[1].text, 'one');
    SpeechQueue.stop();
});

test('AUDIO-002 B6: the watchdog advances a stuck utterance and is cleared by pause', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    resetQueueHarness();
    let completions = 0;

    SpeechQueue.playAll(QUEUE_ITEMS, () => {}, () => { completions++; });
    t.mock.timers.tick(250); // 'eins' is stuck (no onend will fire)

    t.mock.timers.tick(12000);
    assert.equal(SpeechQueue.currentIndex, 1);
    t.mock.timers.tick(250);
    assert.equal(synthState.utterances[1].text, 'one');

    // A paused queue must not let the watchdog advance it.
    SpeechQueue.pause();
    t.mock.timers.tick(12000);
    t.mock.timers.tick(12000);
    assert.equal(SpeechQueue.currentIndex, 1);
    assert.equal(synthState.utterances.length, 2);
    assert.equal(completions, 0);
    SpeechQueue.stop();
});

test('AUDIO-002 B7: the no-synthesis fallback advances items with highlight and completes at drain', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    resetQueueHarness();
    synthWindow.speechSynthesis = undefined;
    const highlights = [];
    let completions = 0;

    SpeechQueue.playAll(QUEUE_ITEMS, (idx) => highlights.push(idx), () => { completions++; });
    assert.deepEqual(highlights, [0]);

    t.mock.timers.tick(1500);
    assert.equal(SpeechQueue.currentIndex, 1);
    assert.deepEqual(highlights, [0, 1]);

    t.mock.timers.tick(1500);
    assert.equal(SpeechQueue.currentIndex, 2);

    t.mock.timers.tick(1500);
    assert.equal(completions, 1);
    assert.equal(SpeechQueue.isPlaying, false);
    installMockSynthesis();
});

test('AUDIO-002 B8: pause and stop fully cancel the pending no-synthesis fallback timer', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    resetQueueHarness();
    synthWindow.speechSynthesis = undefined;

    // Pause variant: pausing during the fallback wait must freeze the cursor.
    let completionsPause = 0;
    SpeechQueue.playAll(QUEUE_ITEMS, () => {}, () => { completionsPause++; });
    SpeechQueue.pause();
    t.mock.timers.tick(1500);
    t.mock.timers.tick(1500);
    assert.equal(SpeechQueue.currentIndex, 0);
    assert.equal(SpeechQueue.queue.length, 3);
    assert.equal(completionsPause, 0);

    // Stop variant: stopping must clear the fallback timer entirely.
    let completionsStop = 0;
    SpeechQueue.playAll(QUEUE_ITEMS, () => {}, () => { completionsStop++; });
    SpeechQueue.stop();
    t.mock.timers.tick(1500);
    t.mock.timers.tick(1500);
    assert.equal(SpeechQueue.currentIndex, 0);
    assert.equal(completionsStop, 0);
    installMockSynthesis();
});

test('AUDIO-002 B9: rapid restart speaks the replacement queue first item exactly once', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    resetQueueHarness();
    const highlights = [];

    SpeechQueue.playAll([{ text: 'alt-eins', lang: 'de' }], () => {}, () => {});
    // Replace the queue before the 250ms delayed-speak fires.
    SpeechQueue.playAll(QUEUE_ITEMS, (idx) => highlights.push(idx), () => {});

    t.mock.timers.tick(250);
    assert.equal(synthState.utterances.length, 1);
    assert.equal(synthState.utterances[0].text, 'eins');
    assert.deepEqual(highlights, [0]);
    SpeechQueue.stop();
});

test('AUDIO-002 B10: stale callbacks from a replaced queue cannot advance or complete the replacement', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    resetQueueHarness();

    // Variant 1 — synthesis path: the replaced queue's utterance fires a
    // late onend after the replacement already owns the speaker.
    let completionsA = 0;
    SpeechQueue.playAll(
        [{ text: 'alt-eins', lang: 'de' }, { text: 'alt-zwei', lang: 'de' }],
        () => {}, () => { completionsA++; }
    );
    t.mock.timers.tick(250); // the old queue's first utterance exists now
    const staleUtterance = synthState.current;

    const highlightsB = [];
    let completionsB = 0;
    SpeechQueue.playAll(QUEUE_ITEMS, (idx) => highlightsB.push(idx), () => { completionsB++; });

    staleUtterance.onend(new Event('end'));
    assert.equal(SpeechQueue.currentIndex, 0);
    assert.equal(completionsA, 0);
    assert.equal(completionsB, 0);

    t.mock.timers.tick(250);
    assert.equal(synthState.utterances[1].text, 'eins');
    synthState.current.onend(new Event('end'));
    assert.deepEqual(highlightsB, [0, 1]);
    t.mock.timers.tick(250);
    assert.equal(synthState.utterances[2].text, 'one');

    // Variant 2 — no-synthesis path: the replaced queue's fallback timer must
    // not fire inside the replacement's own playback.
    synthWindow.speechSynthesis = undefined;
    SpeechQueue.stop();
    const highlightsC = [];
    let completionsC = 0;
    SpeechQueue.playAll(
        [{ text: 'alt-eins', lang: 'de' }, { text: 'alt-zwei', lang: 'de' }],
        (idx) => highlightsC.push(idx),
        () => { completionsC++; }
    );
    SpeechQueue.playAll(QUEUE_ITEMS, (idx) => highlightsC.push(idx + 100), () => { completionsC++; });

    t.mock.timers.tick(1500);
    // Exactly ONE advance (the replacement's own fallback timer): the stale
    // timer from the replaced queue must not also advance the cursor.
    assert.equal(SpeechQueue.currentIndex, 1);
    assert.deepEqual(highlightsC, [0, 100, 101]);

    t.mock.timers.tick(1500);
    assert.equal(SpeechQueue.currentIndex, 2);
    t.mock.timers.tick(1500);
    assert.equal(completionsC, 1);
    installMockSynthesis();
});
