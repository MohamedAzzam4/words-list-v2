import { test, expect } from '@playwright/test';

// SHARED-CARD-003 — adopt the accepted shared card in ordinary A1/B2 flashcards.
//
// Purpose: prove that ordinary vocabulary flashcards on the level pages render
// through the accepted shared-card presentation (js/core/shared-card.js, the
// SHARED-CARD-002-C1 revision) while every level-owned behavior keeps working:
// unit scope, filters, shuffle, navigation, counter, Known/Still-Learning SRS
// writes to the exact original IDs, favorites and their persistence, session
// completion, German-front/translation-front modes, answer secrecy before
// reveal, first-example rendering with real language/direction metadata, and
// the explicit words/phrases source boundary (LF-CARD / LF-NAV / AC-04..AC-10).
//
// Coverage strategy (fixtures are never faked by editing real vocabulary):
// - REAL A1 data: unit 1 card 1-0 "Hallo!" has a real example and translation.
// - REAL B2 data: unit 1 card 1-0 (mixed translation + mixed example
//   translation), unit 45 card 45-18 "der Roboter, -" (real English-only
//   translation), unit 69 card 69-0 (no example) and card 69-80 (real German
//   sentence example without any translation).
// - SYNTHETIC configs (route-intercepted js/levels/<level>.config.js module):
//   edge cases the real datasets lack — Arabic-only translation, Arabic-only
//   example translation, multiple examples, missing translation, A1 cards
//   without examples. Expected values are authored independently below.
// - The words/phrases source boundary: phrase flashcards keep the legacy card
//   (flip via .flashcard-inner, #fc-de/#fc-en ids) while words flashcards use
//   the shared shell; exactly one card exists in the DOM at any time.
//
// Speech assertions capture utterance TEXT and LANG at the browser adapter
// boundary (deterministic speechSynthesis double), proving the card never
// sends Arabic or mixed display text to any voice and never speaks the hidden
// answer before reveal (LF-CARD / AC-03 / AC-06).

const FIREBASE_STUB_SOURCE = `
const authListeners = [];
const progressByUid = {};
export const initFirebase = () => ({ auth: {}, db: {} });
export const loginWithGoogle = async () => { throw new Error('stub: no google auth'); };
export const logout = async () => {};
export const loadProgress = async (appId, uid) => {
    const p = progressByUid[uid];
    return p ? JSON.parse(JSON.stringify(p)) : null;
};
export const saveProgress = async () => {};
export const listenAuth = (cb) => {
    authListeners.push(cb);
    queueMicrotask(() => cb(null));
    return () => {
        const i = authListeners.indexOf(cb);
        if (i >= 0) authListeners.splice(i, 1);
    };
};
export const updateLeaderboard = async () => {};
export const getLeaderboard = async () => [];
export const batchSaveProgressAndLeaderboard = async () => {};
export const loginWithEmailAndPassword = async () => { throw new Error('stub: no email auth'); };
export const signUpWithEmailAndPassword = async () => { throw new Error('stub: no signup'); };
`;

const A1_KEY = 'german_app_progress_german-a1-app';
const B2_KEY = 'german_app_progress_german-b2-app';
const ARABIC = /[\u0600-\u06FF]/;

function installSpeechCapture(page) {
    return page.addInitScript(() => {
        window.__ttsCalls = [];
        const mockVoices = [
            { lang: 'de-DE', name: 'Mock German Voice', localService: true },
            { lang: 'en-US', name: 'Mock English Voice', localService: true }
        ];
        const mockSpeechSynthesis = {
            speaking: false,
            paused: false,
            pending: false,
            getVoices: () => mockVoices,
            speak: (utterance) => {
                window.__ttsCalls.push({
                    text: utterance.text,
                    lang: utterance.lang,
                    voice: utterance.voice ? utterance.voice.name : null
                });
                mockSpeechSynthesis.speaking = true;
                if (utterance.onend) {
                    setTimeout(() => {
                        mockSpeechSynthesis.speaking = false;
                        utterance.onend(new Event('end'));
                    }, 10);
                }
            },
            cancel: () => { mockSpeechSynthesis.speaking = false; }
        };
        Object.defineProperty(window, 'speechSynthesis', {
            value: mockSpeechSynthesis,
            configurable: true,
            writable: true
        });
        window.SpeechSynthesisUtterance = class {
            constructor(text) {
                this.text = text;
                this.lang = '';
                this.voice = null;
                this.rate = 1;
            }
        };
    });
}

// ---------------------------------------------------------------------------
// Synthetic vocabulary configs (SHARED-CARD-003). Served in place of the real
// js/levels/<level>.config.js module to exercise edge cases the real datasets
// lack. Expected values in the tests below are authored independently from
// these definitions.
// ---------------------------------------------------------------------------

function synthExample({ de, translation, translationLanguage, en = '', ar = '' }) {
    return {
        de,
        translation,
        translationLanguage,
        translations: { en, ar },
        speechText: { de, en, ar }
    };
}

function synthCard({ id, levelId, unitId, de, display, en, ar, type = 'n', deContext = '', examples = [] }) {
    const translationLanguage = en && ar ? 'mixed' : (ar ? 'ar' : (en ? 'en' : (display ? 'en' : null)));
    const first = examples[0];
    return {
        id,
        levelId,
        unitId,
        de,
        deContext,
        en: display,
        type,
        context: first ? first.de : '',
        translation: display,
        translationLanguage,
        translations: { en, ar },
        speechText: { de, en, ar },
        exampleDe: first ? first.de : '',
        exampleTranslation: first ? first.translation : '',
        exampleTranslationLanguage: first ? first.translationLanguage : null,
        examples: examples.map((e) => ({ ...e }))
    };
}

const SYNTHETIC_A1_CARDS = [
    // 1-0 control card: one example with its English translation.
    synthCard({
        id: '1-0', levelId: 'a1', unitId: 1, de: 'das Beispiel', display: 'the example',
        en: 'the example', ar: '',
        examples: [synthExample({ de: 'Das ist ein Beispiel.', translation: 'This is an example.', translationLanguage: 'en', en: 'This is an example.' })]
    }),
    // 1-1: no example at all.
    synthCard({ id: '1-1', levelId: 'a1', unitId: 1, de: 'das Zimmer', display: 'the room', en: 'the room', ar: '' }),
    // 1-2: TWO examples — only the first may reach the flashcard.
    synthCard({
        id: '1-2', levelId: 'a1', unitId: 1, de: 'die Antwort', display: 'the answer',
        en: 'the answer', ar: '',
        examples: [
            synthExample({ de: 'Die Antwort ist richtig.', translation: 'The answer is correct.', translationLanguage: 'en', en: 'The answer is correct.' }),
            synthExample({ de: 'Ich kenne die Antwort nicht.', translation: 'I do not know the answer.', translationLanguage: 'en', en: 'I do not know the answer.' })
        ]
    }),
    // 1-3: example without a translation.
    synthCard({
        id: '1-3', levelId: 'a1', unitId: 1, de: 'die Frage', display: 'the question',
        en: 'the question', ar: '',
        examples: [synthExample({ de: 'Die Frage ist einfach.', translation: '', translationLanguage: null })]
    })
];

const SYNTHETIC_B2_CARDS = [
    // 1-0: Arabic-only translation with an Arabic-only example translation.
    synthCard({
        id: '1-0', levelId: 'b2', unitId: 1, de: 'das Wort', display: 'الكلمة',
        en: '', ar: 'الكلمة',
        examples: [synthExample({ de: 'Das Wort ist neu.', translation: 'الكلمة جديدة', translationLanguage: 'ar', ar: 'الكلمة جديدة' })]
    }),
    // 1-1: mixed translation with TWO examples (first is mixed, second English).
    synthCard({
        id: '1-1', levelId: 'b2', unitId: 1, de: 'der Tisch', display: 'table / الطاولة',
        en: 'table', ar: 'الطاولة',
        examples: [
            synthExample({ de: 'Der Tisch ist groß.', translation: 'The table is big. / الطاولة كبيرة', translationLanguage: 'mixed', en: 'The table is big.', ar: 'الطاولة كبيرة' }),
            synthExample({ de: 'Ich kaufe den Tisch.', translation: 'I buy the table.', translationLanguage: 'en', en: 'I buy the table.' })
        ]
    }),
    // 1-2: English-only translation, no example.
    synthCard({ id: '1-2', levelId: 'b2', unitId: 1, de: 'die Forschung', display: 'research', en: 'research', ar: '' }),
    // 1-3: missing translation entirely, example without translation.
    synthCard({
        id: '1-3', levelId: 'b2', unitId: 1, de: 'das Nichts', display: '',
        en: '', ar: '',
        examples: [synthExample({ de: 'Das Nichts ist leer.', translation: '', translationLanguage: null })]
    })
];

function syntheticConfigSource(levelId, appId, cards) {
    const config = {
        levelId,
        appId,
        levelTitle: `📚 ${levelId.toUpperCase()} Synthetic`,
        sectionLabel: 'Unit',
        sectionLabels: ['Synthetic Unit'],
        typeFilters: [],
        vocabulary: [cards],
        parseRules: { format: 'synthetic' },
        uiOverrides: {}
    };
    return `export const levelConfig = ${JSON.stringify(config)};`;
}

// ---------------------------------------------------------------------------
// Level-page helpers
// ---------------------------------------------------------------------------

async function prepareLevelPage(page, { level = 'a1', syntheticConfig = null } = {}) {
    await page.route('**/js/core/firebase.js*', (route) =>
        route.fulfill({ status: 200, contentType: 'application/javascript', body: FIREBASE_STUB_SOURCE })
    );
    if (syntheticConfig) {
        await page.route(`**/js/levels/${level}.config.js*`, (route) =>
            route.fulfill({ status: 200, contentType: 'application/javascript', body: syntheticConfig })
        );
    }
    // The init-script registration must complete before navigation starts,
    // otherwise the first document can be created without the speech double.
    await installSpeechCapture(page);
    await page.goto(`/level.html?level=${level}`);
    await page.waitForSelector('#glossary-tbody tr');
}

// Enter the flashcards view with the words source and wait for the shared card.
async function openWordsFlashcards(page) {
    await page.locator('button', { hasText: 'Flashcards' }).click();
    await expect(page.locator('.flashcard-container')).toBeVisible();
    await expect(page.locator('#fc-card-mount .verb-flashcard')).toBeVisible({ timeout: 8000 });
}

// The engine shuffles by default; deterministic card order requires OFF.
async function turnShuffleOff(page) {
    const shuffleBtn = page.locator('#shuffle-btn');
    await expect(shuffleBtn).toBeVisible();
    if ((await shuffleBtn.textContent()).includes('ON')) {
        await shuffleBtn.click();
    }
    await expect(shuffleBtn).toHaveText(/OFF/);
}

async function flipToBack(page) {
    await page.locator('#fc-card-mount .verb-flashcard .verb-center-content').click();
    await expect(page.locator('#fc-card-mount .verb-flashcard')).toHaveClass(/flipped/);
}

async function flipBackToFront(page) {
    await page.locator('#fc-card-mount .verb-flashcard.flipped .verb-card-back .verb-center-content').click();
    await expect(page.locator('#fc-card-mount .verb-flashcard')).not.toHaveClass(/flipped/);
}

async function readProgress(page, key) {
    return page.evaluate((k) => JSON.parse(localStorage.getItem(k) || '{}'), key);
}

function trackErrors(page) {
    const errors = [];
    page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(String(err)));
    return errors;
}

// Complete flashcard-view subtree sweep (SC-TQ-03 pattern): every element,
// visible or hidden, every attribute value — the strongest DOM-secrecy proof.
async function sweepFlashcardView(page, needles) {
    return page.evaluate((ns) => {
        const root = document.getElementById('view-flashcard');
        const hits = [];
        const check = (label, value) => {
            if (typeof value !== 'string') return;
            for (const n of ns) {
                if (value.includes(n)) hits.push(`${label} → "${n}"`);
            }
        };
        check('text:<root #view-flashcard>', root.textContent || '');
        for (const el of root.querySelectorAll('*')) {
            const cls = typeof el.className === 'string' && el.className ? `.${el.className.trim().split(/\s+/)[0]}` : '';
            check(`text:<${el.tagName.toLowerCase()}${cls}>`, el.textContent || '');
            for (const attr of el.attributes) {
                check(`attr:<${el.tagName.toLowerCase()}${cls}>[${attr.name}]`, attr.value);
            }
        }
        const unique = [...new Set(hits)];
        return { total: hits.length, uniqueCount: unique.length, unique: unique.slice(0, 25) };
    }, needles);
}

// Keyboard-Tab walk (real key presses only — programmatic focus is never used
// as focus evidence). Records :focus-visible state + indicator styles for the
// wanted selectors and whether the flip surface itself received focus.
async function tabWalk(page, { wantedSelectors = [], stopSelector = null, maxTabs = 70 }) {
    const seen = new Map();
    let flipSurfaceFocused = false;
    for (let i = 0; i < maxTabs; i++) {
        await page.keyboard.press('Tab');
        const info = await page.evaluate(({ wantedSelectors, stopSelector }) => {
            const el = document.activeElement;
            if (!el || el === document.body || !el.matches) return null;
            const snap = (elm) => {
                const s = window.getComputedStyle(elm);
                return {
                    outlineStyle: s.outlineStyle,
                    outlineWidth: s.outlineWidth,
                    outlineColor: s.outlineColor,
                    boxShadow: s.boxShadow,
                    borderStyle: s.borderStyle,
                    borderWidth: s.borderWidth,
                    borderColor: s.borderColor,
                    backgroundColor: s.backgroundColor,
                    backgroundImage: s.backgroundImage
                };
            };
            let matched = null;
            for (const sel of wantedSelectors) {
                if (el.matches(sel)) { matched = sel; break; }
            }
            const card = document.querySelector('#fc-card-mount .verb-flashcard');
            return {
                matched,
                focusVisible: el.matches(':focus-visible'),
                isFlipSurface: !!card && (el === card || !!el.closest('.verb-center-content')),
                isStop: stopSelector ? el.matches(stopSelector) : false,
                styles: matched ? snap(el) : null
            };
        }, { wantedSelectors, stopSelector });
        if (!info) continue;
        if (info.isFlipSurface) flipSurfaceFocused = true;
        if (info.matched && !seen.has(info.matched)) {
            seen.set(info.matched, { focusVisible: info.focusVisible, styles: info.styles });
        }
        if (info.isStop) break;
    }
    return { seen, flipSurfaceFocused };
}

async function tabUntilFocused(page, selector, maxTabs = 40) {
    for (let i = 0; i < maxTabs; i++) {
        const matched = await page.evaluate((sel) => {
            const el = document.activeElement;
            return !!el && el !== document.body && !!el.matches && el.matches(sel);
        }, selector);
        if (matched) return true;
        await page.keyboard.press('Tab');
    }
    return false;
}

async function snapshotFocusStyles(page, selectors) {
    return page.evaluate((sels) => {
        const snap = (el) => {
            const s = window.getComputedStyle(el);
            return {
                outlineStyle: s.outlineStyle,
                outlineWidth: s.outlineWidth,
                outlineColor: s.outlineColor,
                boxShadow: s.boxShadow,
                borderStyle: s.borderStyle,
                borderWidth: s.borderWidth,
                borderColor: s.borderColor,
                backgroundColor: s.backgroundColor,
                backgroundImage: s.backgroundImage
            };
        };
        const out = {};
        for (const sel of sels) {
            const el = document.querySelector(sel);
            out[sel] = el ? { present: true, styles: snap(el) } : { present: false, styles: null };
        }
        return out;
    }, selectors);
}

function visibleFocusIndicator(base, focused) {
    if (focused.outlineStyle !== 'none' && parseFloat(focused.outlineWidth) > 0 &&
        (focused.outlineStyle !== base.outlineStyle ||
            focused.outlineWidth !== base.outlineWidth ||
            focused.outlineColor !== base.outlineColor)) return true;
    if (focused.boxShadow !== 'none' && focused.boxShadow !== base.boxShadow) return true;
    if (focused.borderStyle !== 'none' &&
        (focused.borderStyle !== base.borderStyle ||
            focused.borderWidth !== base.borderWidth ||
            focused.borderColor !== base.borderColor)) return true;
    if (focused.backgroundColor !== base.backgroundColor ||
        focused.backgroundImage !== base.backgroundImage) return true;
    return false;
}

// Counts class mutations on the flip surface: one activation must cause
// exactly one transition (a double-firing handler cannot hide behind a
// net-zero class state).
async function installFlipClassCounter(page) {
    await page.evaluate(() => {
        window.__flipMutations = 0;
        const card = document.querySelector('#fc-card-mount .verb-flashcard');
        const observer = new MutationObserver((mutations) => {
            for (const m of mutations) {
                if (m.attributeName === 'class') window.__flipMutations += 1;
            }
        });
        observer.observe(card, { attributes: true, attributeFilter: ['class'] });
    });
}

// Real accessibility-tree evidence (CDP): which face hosts the named button.
async function axTreeButtonFaces(page, buttonName) {
    const cdp = await page.context().newCDPSession(page);
    const { nodes } = await cdp.send('Accessibility.getFullAXTree');
    const faces = [];
    for (const node of nodes) {
        if (node.ignored || !node.role || node.role.value !== 'button') continue;
        if (!node.name || node.name.value !== buttonName) continue;
        if (!node.backendDOMNodeId) { faces.push('unresolvable'); continue; }
        const { object } = await cdp.send('DOM.resolveNode', { backendNodeId: node.backendDOMNodeId });
        const { result } = await cdp.send('Runtime.callFunctionOn', {
            objectId: object.objectId,
            functionDeclaration: 'function() { return this.closest(".verb-card-front") ? "front" : this.closest(".verb-card-back") ? "back" : "other"; }',
            returnByValue: true
        });
        faces.push(result.value);
    }
    return faces;
}

// All visible accessible names in the accessibility tree (secrecy proof).
async function axTreeNames(page) {
    const cdp = await page.context().newCDPSession(page);
    const { nodes } = await cdp.send('Accessibility.getFullAXTree');
    return nodes
        .filter((n) => !n.ignored && n.name && typeof n.name.value === 'string')
        .map((n) => n.name.value);
}

// ---------------------------------------------------------------------------
// A1 — real dataset
// ---------------------------------------------------------------------------

test.describe('SHARED-CARD-003 A1 ordinary card — real dataset', () => {

    test('SC3-A1-SHELL: words flashcards render through the shared card shell with level-owned controls and no verbs deck', async ({ page }) => {
        await prepareLevelPage(page, { level: 'a1' });
        await openWordsFlashcards(page);
        await turnShuffleOff(page);

        // Shared shell (the accepted SHARED-CARD-002 presentation): flip
        // surface, front/back faces, topbar affordances and tap hint.
        const card = page.locator('#fc-card-mount .verb-flashcard');
        await expect(card).toHaveAttribute('data-action', 'flip');
        await expect(card).toHaveAttribute('role', 'button');
        await expect(card).toHaveAttribute('tabindex', '0');
        await expect(page.locator('#fc-card-mount .verb-card-front')).toBeVisible();
        await expect(page.locator('#fc-card-mount .verb-card-back')).toHaveCount(1);
        await expect(page.locator('#fc-card-mount .verb-tap-hint')).toBeVisible();
        await expect(page.locator('#fc-card-mount .topbar-right-btns [data-action="speak"]')).toBeVisible();
        await expect(page.locator('#fc-card-mount .topbar-right-btns [data-action="fav"]')).toBeVisible();

        // Level-owned metadata: type badge and the SRS row (new card: five
        // empty dots + "New Card", same dot markup as before).
        await expect(page.locator('#fc-card-mount .type-badge')).toHaveText('e');
        await expect(page.locator('#fc-card-mount #fc-srs-dots .srs-dot')).toHaveCount(5);
        await expect(page.locator('#fc-card-mount #fc-srs-dots .srs-dot.filled')).toHaveCount(0);
        await expect(page.locator('#fc-card-mount #fc-srs-dots')).toContainText('New Card');

        // Level-owned controls stay below the card: grade buttons, navigation,
        // counter, filters and face modes.
        await expect(page.locator('.fc-btn.btn-known')).toBeVisible();
        await expect(page.locator('.fc-btn.btn-learning')).toBeVisible();
        await expect(page.locator('#fc-counter')).toHaveText('1 / 30');
        await expect(page.locator('#filter-all-btn')).toBeVisible();
        await expect(page.locator('#filter-learning-btn')).toBeVisible();
        await expect(page.locator('#filter-favorites-btn')).toBeVisible();
        await expect(page.locator('#face-de-btn')).toBeVisible();
        await expect(page.locator('#face-en-btn')).toBeVisible();

        // Exactly ONE card lives in the DOM: the legacy phrase card markup is
        // not rendered alongside the shared card, and the compatibility id
        // resolves to the shared flip surface.
        await expect(page.locator('.flashcard-inner')).toHaveCount(0);
        await expect(page.locator('#active-flashcard')).toHaveCount(1);
        await expect(page.locator('#fc-card-mount .verb-flashcard#active-flashcard')).toHaveCount(1);

        // LF-NAV / AC-10: no German Verbs deck strip on level pages.
        await expect(page.locator('.verbs-deck-grid')).toHaveCount(0);
        await expect(page.locator('.deck-chip-card')).toHaveCount(0);
    });

    test('SC3-A1-EXAMPLE: revealed back shows the real first German example with its real translation (AC-05)', async ({ page }) => {
        await prepareLevelPage(page, { level: 'a1' });
        await openWordsFlashcards(page);
        await turnShuffleOff(page);

        // Setup proof: card 1-0 is on the front.
        await expect(page.locator('#fc-card-mount #fc-de')).toHaveText('Hallo!');

        await flipToBack(page);

        // The real example — not the vocabulary term repeated as a fake
        // example (the legacy presentation filled this slot with w.de).
        await expect(page.locator('#fc-card-mount .back-example-box .ex-sentence-span')).toHaveText('💬 Hallo, ich bin Anna.');
        await expect(page.locator('#fc-card-mount .back-example-box .ex-sentence-span')).toHaveAttribute('lang', 'de');
        // The example's real translation, permanently visible, with English
        // direction + language metadata.
        const line = page.locator('#fc-card-mount .back-example-box .ex-translation-line');
        await expect(line).toHaveText('(Hello, I am Anna.)');
        await expect(line).toHaveAttribute('dir', 'ltr');
        await expect(line).toHaveAttribute('lang', 'en');
        // The translation stays visible without a second click (no toggle).
        await expect(page.locator('#fc-card-mount .back-example-box .ex-translation-line')).toBeVisible();
        // The answer side shows the display translation.
        await expect(page.locator('#fc-card-mount #fc-en')).toHaveText('Hello!');
    });

    test('SC3-A1-FACES: German-front and translation-front behavior with safe language metadata', async ({ page }) => {
        await prepareLevelPage(page, { level: 'a1' });
        await openWordsFlashcards(page);
        await turnShuffleOff(page);

        // Default German front: the German term (with its language metadata).
        const frontTerm = page.locator('#fc-card-mount #fc-de');
        await expect(frontTerm).toHaveText('Hallo!');
        await expect(frontTerm).toHaveAttribute('lang', 'de');
        await expect(page.locator('#face-de-btn')).toHaveClass(/primary/);

        // Translation front (A1 translations are English — the label is true).
        await page.locator('#face-en-btn').click();
        await expect(frontTerm).toHaveText('Hello!');
        await expect(frontTerm).toHaveAttribute('dir', 'ltr');
        await expect(frontTerm).toHaveAttribute('lang', 'en');
        await expect(page.locator('#face-en-btn')).toHaveClass(/primary/);

        // Flipping a translation-front card reveals the German answer and the
        // example block.
        await flipToBack(page);
        await expect(page.locator('#fc-card-mount #fc-en')).toHaveText('Hallo!');
        await expect(page.locator('#fc-card-mount #fc-en')).toHaveAttribute('lang', 'de');
        await expect(page.locator('#fc-card-mount .back-example-box .ex-sentence-span')).toHaveText('💬 Hallo, ich bin Anna.');

        // Switching back to the German front resets to the question side.
        await page.locator('#face-de-btn').click();
        await expect(page.locator('#fc-card-mount .verb-flashcard')).not.toHaveClass(/flipped/);
        await expect(frontTerm).toHaveText('Hallo!');
    });

    test('SC3-A1-SECRECY-DOM: translation-front card subtree carries no German answer, example, or audio metadata before reveal (AC-06)', async ({ page }) => {
        await prepareLevelPage(page, { level: 'a1' });
        await openWordsFlashcards(page);
        await turnShuffleOff(page);
        await page.locator('#face-en-btn').click();

        // Setup proof: the front shows the English prompt for card 1-0.
        await expect(page.locator('#fc-card-mount #fc-de')).toHaveText('Hello!');

        // The COMPLETE flashcard view subtree — every element, visible or
        // hidden, every attribute value — must be free of the German answer
        // and the German example before reveal.
        const sweep = await sweepFlashcardView(page, ['Hallo, ich bin Anna.', 'Hallo!']);
        expect(sweep.unique, `pre-reveal leaks (${sweep.uniqueCount} unique carriers): ${sweep.unique.join(' | ')}`).toEqual([]);

        // The real accessibility tree exposes no German answer either.
        const names = await axTreeNames(page);
        const leaked = names.filter((n) => n.includes('Hallo, ich bin Anna.') || n === 'Hallo!');
        expect(leaked).toEqual([]);
    });

    test('SC3-A1-SECRECY-AUDIO: front speak never speaks the hidden German answer before reveal', async ({ page }) => {
        await prepareLevelPage(page, { level: 'a1' });
        await openWordsFlashcards(page);
        await turnShuffleOff(page);
        await page.locator('#face-en-btn').click();

        // The translation-front speak affordance pronounces the visible
        // English prompt only — never the hidden German answer.
        await page.locator('#fc-card-mount .verb-card-front [data-action="speak"]').click();
        const calls = await page.evaluate(() => window.__ttsCalls);
        expect(calls).toHaveLength(1);
        expect(calls[0].text).toBe('Hello!');
        expect(calls[0].text).not.toMatch(ARABIC);
        // The card did not flip, grade, or advance for the audio action.
        await expect(page.locator('#fc-card-mount .verb-flashcard')).not.toHaveClass(/flipped/);
        await expect(page.locator('#fc-counter')).toHaveText('1 / 30');
        const progress = await readProgress(page, A1_KEY);
        expect(Object.keys(progress.srsData || {})).toEqual([]);

        // After reveal, the German answer becomes speakable.
        await flipToBack(page);
        await page.locator('#fc-card-mount .verb-card-back [data-action="speak"]').click();
        const backCalls = await page.evaluate(() => window.__ttsCalls);
        expect(backCalls).toHaveLength(2);
        expect(backCalls[1].text).toBe('Hallo!');
    });

    test('SC3-A1-FAV: favorite affordance — descriptive name, truthful aria-pressed, immediate and refreshed persistence, no flip or grade', async ({ page }) => {
        await prepareLevelPage(page, { level: 'a1' });
        await openWordsFlashcards(page);
        await turnShuffleOff(page);

        const fav = page.locator('#fc-card-mount .verb-card-front [data-action="fav"]');
        await expect(fav).toHaveAttribute('aria-label', 'Toggle Favorite');
        await expect(fav).toHaveAttribute('aria-pressed', 'false');

        await fav.click();
        await expect(fav).toHaveAttribute('aria-pressed', 'true');
        // The favorite action must not flip, grade, or advance the card.
        await expect(page.locator('#fc-card-mount .verb-flashcard')).not.toHaveClass(/flipped/);
        await expect(page.locator('#fc-counter')).toHaveText('1 / 30');

        // Immediate persistence: the exact original stable ID.
        let progress = await readProgress(page, A1_KEY);
        expect(progress.favorites).toEqual(['1-0']);
        expect(Object.keys(progress.srsData || {})).toEqual([]);

        // Refreshed persistence: a fresh boot still knows the favorite.
        await page.reload();
        await page.waitForSelector('#glossary-tbody tr');
        await openWordsFlashcards(page);
        await turnShuffleOff(page);
        await expect(page.locator('#fc-card-mount .verb-card-front [data-action="fav"]')).toHaveAttribute('aria-pressed', 'true');
        progress = await readProgress(page, A1_KEY);
        expect(progress.favorites).toEqual(['1-0']);

        // Toggling off removes exactly this card's favorite.
        await page.locator('#fc-card-mount .verb-card-front [data-action="fav"]').click();
        progress = await readProgress(page, A1_KEY);
        expect(progress.favorites).toEqual([]);
    });

    test('SC3-A1-SRS-WRITE: Known and Still Learning write the exact original unit IDs with no wrong-unit writes (AC-17 analog)', async ({ page }) => {
        await prepareLevelPage(page, { level: 'a1' });
        await openWordsFlashcards(page);
        await turnShuffleOff(page);

        // Card 1-0 graded Known.
        await page.locator('.fc-btn.btn-known').click();
        await page.waitForFunction((key) => {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            return data.srsData && Object.keys(data.srsData).length === 1;
        }, A1_KEY);
        let progress = await readProgress(page, A1_KEY);
        expect(Object.keys(progress.srsData)).toEqual(['1-0']);
        expect(progress.srsData['1-0'].level).toBe(1);
        expect(progress.known).toEqual(['1-0']);
        await expect(page.locator('#fc-counter')).toHaveText('2 / 30');

        // Card 1-1 graded Still Learning: errors increment, the card returns
        // to the queue, and no other unit's ID is ever written.
        await page.locator('.fc-btn.btn-learning').click();
        await page.waitForFunction((key) => {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            return data.srsData && Object.keys(data.srsData).length === 2;
        }, A1_KEY);
        progress = await readProgress(page, A1_KEY);
        expect(Object.keys(progress.srsData).sort()).toEqual(['1-0', '1-1']);
        expect(progress.flashcardErrors).toEqual({ '1-1': 1 });
        expect(progress.known).toEqual(['1-0']);
        // No wrong-unit / wrong-level SRS write happened.
        const allKeys = Object.keys(progress.srsData);
        expect(allKeys.every((k) => /^1-\d+$/.test(k))).toBe(true);
        expect(allKeys.some((k) => k.startsWith('2-'))).toBe(false);
        expect(allKeys.some((k) => k.includes('b2'))).toBe(false);
    });

    test('SC3-A1-NAV: filters, shuffle toggle, previous/next navigation and the card counter', async ({ page }) => {
        await prepareLevelPage(page, { level: 'a1' });
        await openWordsFlashcards(page);
        await turnShuffleOff(page);

        // Favorite the first card, then the Favourites filter shows only it.
        await page.locator('#fc-card-mount .verb-card-front [data-action="fav"]').click();
        await page.locator('#filter-favorites-btn').click();
        await expect(page.locator('#fc-counter')).toHaveText('1 / 1');
        await expect(page.locator('#fc-card-mount #fc-de')).toHaveText('Hallo!');

        // All Cards restores the whole unit.
        await page.locator('#filter-all-btn').click();
        await expect(page.locator('#fc-counter')).toHaveText('1 / 30');

        // Still Learning shows new cards capped at 20 in unit order.
        await page.locator('#filter-learning-btn').click();
        await expect(page.locator('#fc-counter')).toHaveText('1 / 20');

        // Next / previous navigation moves the cursor; prev is a no-op at the
        // first card.
        await page.locator('.fc-nav button', { hasText: 'Next' }).click();
        await expect(page.locator('#fc-counter')).toHaveText('2 / 20');
        await page.locator('.fc-nav button', { hasText: 'Prev' }).click();
        await expect(page.locator('#fc-counter')).toHaveText('1 / 20');
        await page.locator('.fc-nav button', { hasText: 'Prev' }).click();
        await expect(page.locator('#fc-counter')).toHaveText('1 / 20');

        // The shuffle toggle rebuilds the queue and announces its state.
        await page.locator('#shuffle-btn').click();
        await expect(page.locator('#shuffle-btn')).toHaveText(/ON/);
        await page.locator('#shuffle-btn').click();
        await expect(page.locator('#shuffle-btn')).toHaveText(/OFF/);
    });

    test('SC3-A1-SESSION: session completion shows the finished state, records the session, and restart works', async ({ page }) => {
        await prepareLevelPage(page, { level: 'a1' });
        await openWordsFlashcards(page);
        await turnShuffleOff(page);

        // One favorite card -> a one-card Favourites session.
        await page.locator('#fc-card-mount .verb-card-front [data-action="fav"]').click();
        await page.locator('#filter-favorites-btn').click();
        await expect(page.locator('#fc-counter')).toHaveText('1 / 1');

        await page.locator('.fc-btn.btn-known').click();

        // Session completion state with the recorded session counter.
        await expect(page.locator('#fc-finished-state')).toBeVisible();
        await expect(page.locator('#fc-finished-state')).toContainText('Session Complete!');
        const progress = await readProgress(page, A1_KEY);
        expect(progress.sessionsCompleted).toBe(1);
        expect(Object.keys(progress.srsData)).toEqual(['1-0']);

        // Start Again restarts the session.
        await page.locator('#fc-finished-state button', { hasText: 'Start Again' }).click();
        await expect(page.locator('#fc-card-mount .verb-flashcard')).toBeVisible();
        await expect(page.locator('#fc-counter')).toHaveText('1 / 1');
    });
});

// ---------------------------------------------------------------------------
// A1 — synthetic edge cases
// ---------------------------------------------------------------------------

test.describe('SHARED-CARD-003 A1 ordinary card — synthetic edge cases', () => {

    async function openSyntheticA1(page) {
        await prepareLevelPage(page, {
            level: 'a1',
            syntheticConfig: syntheticConfigSource('a1', 'german-a1-app', SYNTHETIC_A1_CARDS)
        });
        await openWordsFlashcards(page);
        await turnShuffleOff(page);
    }

    test('SC3-A1-SYNTH-NOEX: no-example card renders no example box and no stale content from the previous card', async ({ page }) => {
        await openSyntheticA1(page);

        // Card 1-0 HAS an example — flip once so a stale example could leak.
        await expect(page.locator('#fc-card-mount #fc-de')).toHaveText('das Beispiel');
        await flipToBack(page);
        await expect(page.locator('#fc-card-mount .back-example-box .ex-sentence-span')).toHaveText('💬 Das ist ein Beispiel.');

        // Advance to the no-example card and flip again.
        await page.locator('.fc-nav button', { hasText: 'Next' }).click();
        await expect(page.locator('#fc-counter')).toHaveText('2 / 4');
        await expect(page.locator('#fc-card-mount #fc-de')).toHaveText('das Zimmer');
        await flipToBack(page);

        // No example box, no sentence, no translation line, and none of the
        // previous card's example content survives the re-render.
        await expect(page.locator('#fc-card-mount .back-example-box')).toHaveCount(0);
        await expect(page.locator('#fc-card-mount .ex-sentence-span')).toHaveCount(0);
        await expect(page.locator('#fc-card-mount .ex-translation-line')).toHaveCount(0);
        await expect(page.locator('#fc-card-mount .verb-card-back')).not.toContainText('Das ist ein Beispiel.');
        await expect(page.locator('#fc-card-mount .verb-card-back')).not.toContainText('This is an example.');
        // The answer still renders for a card without examples.
        await expect(page.locator('#fc-card-mount #fc-en')).toHaveText('the room');
    });

    test('SC3-A1-SYNTH-MULTI: multiple-example card shows exactly the first example', async ({ page }) => {
        await openSyntheticA1(page);

        await page.locator('.fc-nav button', { hasText: 'Next' }).click();
        await page.locator('.fc-nav button', { hasText: 'Next' }).click();
        await expect(page.locator('#fc-card-mount #fc-de')).toHaveText('die Antwort');
        await flipToBack(page);

        await expect(page.locator('#fc-card-mount .back-example-box .ex-sentence-span')).toHaveText('💬 Die Antwort ist richtig.');
        await expect(page.locator('#fc-card-mount .back-example-box .ex-translation-line')).toHaveText('(The answer is correct.)');
        // The second example never reaches the flashcard.
        await expect(page.locator('#fc-card-mount .verb-card-back')).not.toContainText('Ich kenne die Antwort nicht.');
        await expect(page.locator('#fc-card-mount .ex-sentence-span')).toHaveCount(1);
    });

    test('SC3-A1-SYNTH-EX-WO-TR: example without a translation shows the sentence only, never an empty line', async ({ page }) => {
        await openSyntheticA1(page);

        for (let i = 0; i < 3; i++) {
            await page.locator('.fc-nav button', { hasText: 'Next' }).click();
        }
        await expect(page.locator('#fc-card-mount #fc-de')).toHaveText('die Frage');
        await flipToBack(page);

        await expect(page.locator('#fc-card-mount .back-example-box .ex-sentence-span')).toHaveText('💬 Die Frage ist einfach.');
        await expect(page.locator('#fc-card-mount .ex-translation-line')).toHaveCount(0);
        await expect(page.locator('#fc-card-mount .back-example-box')).not.toContainText('()');
    });
});

// ---------------------------------------------------------------------------
// B2 — real dataset
// ---------------------------------------------------------------------------

test.describe('SHARED-CARD-003 B2 ordinary card — real dataset', () => {

    test('SC3-B2-MIXED: unit-1 card back shows the German answer, the first real example and its actual mixed translation (AC-05)', async ({ page }) => {
        await prepareLevelPage(page, { level: 'b2' });
        await openWordsFlashcards(page);
        await turnShuffleOff(page);

        // Setup proof: card 1-0 German front with its stripped context note.
        await expect(page.locator('#fc-card-mount #fc-de')).toHaveText('die Vorstellung, -en');
        await expect(page.locator('#fc-card-mount #fc-de')).toHaveAttribute('lang', 'de');
        await expect(page.locator('#fc-card-mount .fc-card-context')).toContainText('Meine Vorstellung von Heimat');

        await flipToBack(page);

        // The answer is the real display translation — mixed English/Arabic —
        // with automatic direction and NO single-language label.
        const answer = page.locator('#fc-card-mount #fc-en');
        await expect(answer).toContainText('presentation,impression,idea');
        const answerText = await answer.textContent();
        expect(answerText).toMatch(ARABIC);
        await expect(answer).toHaveAttribute('dir', 'auto');
        await expect(answer).not.toHaveAttribute('lang');

        // The real first example and its actual (mixed) translation.
        await expect(page.locator('#fc-card-mount .back-example-box .ex-sentence-span'))
            .toHaveText('💬 Meine Vorstellung von Heimat ist ein Ort, an dem ich geliebt und akzeptiert werde.');
        await expect(page.locator('#fc-card-mount .back-example-box .ex-sentence-span')).toHaveAttribute('lang', 'de');
        const exLine = page.locator('#fc-card-mount .back-example-box .ex-translation-line');
        await expect(exLine).toContainText('My idea of home is a place where I am loved and accepted.');
        const exLineText = await exLine.textContent();
        expect(exLineText).toMatch(ARABIC);
        await expect(exLine).toHaveAttribute('dir', 'auto');
        await expect(exLine).not.toHaveAttribute('lang');
    });

    test('SC3-B2-EN-ONLY: real English-only translation card carries ltr + lang=en and never a false Arabic label', async ({ page }) => {
        await prepareLevelPage(page, { level: 'b2' });
        await openWordsFlashcards(page);
        await turnShuffleOff(page);

        // Unit 45 (index 44), card 45-18 "der Roboter, -" is the earliest real
        // English-only translation card. The queue cursor is advanced through
        // the app's own navigation API (shuffle off keeps unit order).
        await page.evaluate((i) => window.app.switchUnit(i), 44);
        await expect(page.locator('#fc-card-mount .verb-flashcard')).toBeVisible();
        await page.evaluate(() => { for (let i = 0; i < 18; i++) window.app.nextCard(); });
        await expect(page.locator('#fc-counter')).toHaveText('19 / 33');
        await expect(page.locator('#fc-card-mount #fc-de')).toHaveText('der Roboter, -');

        await flipToBack(page);

        // English-only translation: explicit ltr + en metadata.
        const answer = page.locator('#fc-card-mount #fc-en');
        await expect(answer).toHaveText('robot / robot');
        await expect(answer).toHaveAttribute('dir', 'ltr');
        await expect(answer).toHaveAttribute('lang', 'en');
        const answerText = await answer.textContent();
        expect(answerText).not.toMatch(ARABIC);

        // The real example with its real mixed translation (dir=auto).
        await expect(page.locator('#fc-card-mount .back-example-box .ex-sentence-span'))
            .toHaveText('💬 Der Roboter kann Aufgaben ausführen, die für Menschen zu gefährlich sind.');
        const exLine = page.locator('#fc-card-mount .back-example-box .ex-translation-line');
        await expect(exLine).toContainText('The robot can perform tasks that are too dangerous for human');
        await expect(exLine).toHaveAttribute('dir', 'auto');
        await expect(exLine).not.toHaveAttribute('lang');
    });

    test('SC3-B2-NOEX: real no-example card (unit 69) renders the answer with no example block', async ({ page }) => {
        await prepareLevelPage(page, { level: 'b2' });
        await openWordsFlashcards(page);
        await turnShuffleOff(page);

        // Unit 69 (index 68) starts with no-example cards.
        await page.evaluate((i) => window.app.switchUnit(i), 68);
        await expect(page.locator('#fc-card-mount #fc-de')).toHaveText('selbstständiger');

        await flipToBack(page);
        await expect(page.locator('#fc-card-mount #fc-en')).toContainText('independent');
        await expect(page.locator('#fc-card-mount .back-example-box')).toHaveCount(0);
        await expect(page.locator('#fc-card-mount .ex-sentence-span')).toHaveCount(0);
    });

    test('SC3-B2-EX-NO-TR: real sentence example without a translation shows the sentence only', async ({ page }) => {
        await prepareLevelPage(page, { level: 'b2' });
        await openWordsFlashcards(page);
        await turnShuffleOff(page);

        // Card 69-80 "sich verstecken" — a real German sentence example with
        // no translation in the source data. Advanced through the app's own
        // navigation API (shuffle off keeps unit order).
        await page.evaluate((i) => window.app.switchUnit(i), 68);
        await expect(page.locator('#fc-card-mount .verb-flashcard')).toBeVisible();
        await page.evaluate(() => { for (let i = 0; i < 80; i++) window.app.nextCard(); });
        await expect(page.locator('#fc-card-mount #fc-de')).toHaveText('sich verstecken');

        await flipToBack(page);
        await expect(page.locator('#fc-card-mount .back-example-box .ex-sentence-span'))
            .toHaveText('💬 Das Kind versteckt sich vor seiner Mutter.');
        await expect(page.locator('#fc-card-mount .ex-translation-line')).toHaveCount(0);
        // The mixed translation answer still renders.
        await expect(page.locator('#fc-card-mount #fc-en')).toContainText('hide (physical absence)');
    });

    test('SC3-B2-SECRECY: translation-front B2 card hides the German answer and example before reveal (AC-06)', async ({ page }) => {
        await prepareLevelPage(page, { level: 'b2' });
        await openWordsFlashcards(page);
        await turnShuffleOff(page);

        // B2's translation-front control is language-truthful: the mixed EN/AR
        // display text is never labeled "English".
        const faceEn = page.locator('#face-en-btn');
        await expect(faceEn).not.toHaveText(/English/);
        await faceEn.click();

        // Setup proof: the mixed prompt is on the front.
        await expect(page.locator('#fc-card-mount #fc-de')).toContainText('presentation,impression,idea');

        // Complete subtree sweep: no German answer, no German example.
        const sweep = await sweepFlashcardView(page, ['die Vorstellung', 'Meine Vorstellung von Heimat ist ein Ort']);
        expect(sweep.unique, `pre-reveal leaks (${sweep.uniqueCount} unique carriers): ${sweep.unique.join(' | ')}`).toEqual([]);

        // The real accessibility tree exposes no German answer either.
        const names = await axTreeNames(page);
        const leaked = names.filter((n) => n.includes('die Vorstellung') || n.includes('Meine Vorstellung von Heimat'));
        expect(leaked).toEqual([]);

        // After reveal the German answer appears with the example block.
        await flipToBack(page);
        await expect(page.locator('#fc-card-mount #fc-en')).toHaveText('die Vorstellung, -en');
        await expect(page.locator('#fc-card-mount .back-example-box .ex-sentence-span')).toBeVisible();
    });

    test('SC3-B2-ID-PERSISTENCE: grading writes the exact B2 unit ID under the B2 storage key only', async ({ page }) => {
        await prepareLevelPage(page, { level: 'b2' });
        await openWordsFlashcards(page);
        await turnShuffleOff(page);

        // Unit 45 card 45-18 graded Known — the exact original ID, nothing
        // from another unit and nothing in the A1 storage key.
        await page.evaluate((i) => window.app.switchUnit(i), 44);
        await expect(page.locator('#fc-card-mount .verb-flashcard')).toBeVisible();
        await page.evaluate(() => { for (let i = 0; i < 18; i++) window.app.nextCard(); });
        await page.locator('.fc-btn.btn-known').click();
        await page.waitForFunction((key) => {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            return data.srsData && Object.keys(data.srsData).length === 1;
        }, B2_KEY);

        const b2 = await readProgress(page, B2_KEY);
        expect(Object.keys(b2.srsData)).toEqual(['45-18']);
        expect(b2.known).toEqual(['45-18']);
        const a1 = await readProgress(page, A1_KEY);
        expect(a1.srsData || {}).toEqual({});
        expect(a1.known || []).toEqual([]);
    });

    test('SC3-B2-UNIT-SWITCH: B2 unit switching updates the card scope and titles', async ({ page }) => {
        await prepareLevelPage(page, { level: 'b2' });
        await openWordsFlashcards(page);
        await turnShuffleOff(page);

        // Unit 2 (index 1) first card.
        await page.evaluate((i) => window.app.switchUnit(i), 1);
        await expect(page.locator('#fc-card-mount #fc-de')).toContainText('der Grafiker');
        await expect(page.locator('#fc-counter')).toHaveText(/1 \/ \d+/);

        // Unit 1 (index 0) restores unit-1 scope.
        await page.evaluate((i) => window.app.switchUnit(i), 0);
        await expect(page.locator('#fc-card-mount #fc-de')).toHaveText('die Vorstellung, -en');
    });

    test('SC3-B2-A11Y-TOOLBAR: B2 toolbar controls are keyboard-focusable with a visible indicator and 44x44 targets (AC-09)', async ({ page }) => {
        await prepareLevelPage(page, { level: 'b2' });
        await openWordsFlashcards(page);
        await turnShuffleOff(page);

        // The B2 translation-front control keeps its truthful non-English
        // label while meeting the same focus and target requirements.
        await expect(page.locator('#face-en-btn')).toHaveText('🌐 Translation');

        // SHARED-CARD-003-C1: the same seven #view-flashcard toolbar controls
        // on the B2 page — real Tab navigation, :focus-visible match, a
        // painted focus indicator, and 44x44 targets for each.
        const wanted = [
            '#view-flashcard .controls-row > .btn:first-child',
            '#shuffle-btn',
            '#filter-all-btn',
            '#filter-learning-btn',
            '#filter-favorites-btn',
            '#face-de-btn',
            '#face-en-btn'
        ];
        const baseline = await snapshotFocusStyles(page, wanted);
        for (const sel of wanted) {
            expect(baseline[sel].present, `${sel} must exist`).toBe(true);
        }
        const walk = await tabWalk(page, { wantedSelectors: wanted, maxTabs: 70 });
        for (const sel of wanted) {
            expect(walk.seen.has(sel), `Tab navigation must reach ${sel}`).toBe(true);
            const info = walk.seen.get(sel);
            expect(info.focusVisible, `keyboard focus on ${sel} must match :focus-visible`).toBe(true);
            const indicated = visibleFocusIndicator(baseline[sel].styles, info.styles);
            expect(indicated, `${sel} must show a keyboard-focus indicator`).toBe(true);
            const box = await page.locator(sel).boundingBox();
            expect(box, `${sel} must exist for sizing`).toBeTruthy();
            expect(box.width, `${sel} width`).toBeGreaterThanOrEqual(44);
            expect(box.height, `${sel} height`).toBeGreaterThanOrEqual(44);
        }
    });
});

// ---------------------------------------------------------------------------
// B2 — synthetic language edges
// ---------------------------------------------------------------------------

test.describe('SHARED-CARD-003 B2 ordinary card — synthetic language edges', () => {

    async function openSyntheticB2(page) {
        await prepareLevelPage(page, {
            level: 'b2',
            syntheticConfig: syntheticConfigSource('b2', 'german-b2-app', SYNTHETIC_B2_CARDS)
        });
        await openWordsFlashcards(page);
        await turnShuffleOff(page);
    }

    test('SC3-B2-SYNTH-AR: Arabic-only translation renders rtl + lang=ar and is never labeled English', async ({ page }) => {
        await openSyntheticB2(page);

        // German front for the Arabic-only card.
        await expect(page.locator('#fc-card-mount #fc-de')).toHaveText('das Wort');

        await flipToBack(page);

        // The Arabic answer: RTL direction + Arabic language metadata, and
        // no English label anywhere on it.
        const answer = page.locator('#fc-card-mount #fc-en');
        await expect(answer).toHaveText('الكلمة');
        await expect(answer).toHaveAttribute('dir', 'rtl');
        await expect(answer).toHaveAttribute('lang', 'ar');
        expect(await answer.getAttribute('lang')).not.toBe('en');

        // The Arabic-only example translation is RTL + ar as well.
        const exLine = page.locator('#fc-card-mount .back-example-box .ex-translation-line');
        await expect(exLine).toHaveText('(الكلمة جديدة)');
        await expect(exLine).toHaveAttribute('dir', 'rtl');
        await expect(exLine).toHaveAttribute('lang', 'ar');

        // Translation-front mode shows the Arabic prompt with the same
        // truthful metadata.
        await page.locator('#face-en-btn').click();
        const frontTerm = page.locator('#fc-card-mount #fc-de');
        await expect(frontTerm).toHaveText('الكلمة');
        await expect(frontTerm).toHaveAttribute('dir', 'rtl');
        await expect(frontTerm).toHaveAttribute('lang', 'ar');
    });

    test('SC3-B2-SYNTH-MIXED: mixed translation and multiple examples — dir=auto, no lang, first example only', async ({ page }) => {
        await openSyntheticB2(page);

        await page.locator('.fc-nav button', { hasText: 'Next' }).click();
        await expect(page.locator('#fc-card-mount #fc-de')).toHaveText('der Tisch');

        await flipToBack(page);

        // Mixed answer: automatic direction, no single-language label.
        const answer = page.locator('#fc-card-mount #fc-en');
        await expect(answer).toHaveText('table / الطاولة');
        await expect(answer).toHaveAttribute('dir', 'auto');
        await expect(answer).not.toHaveAttribute('lang');

        // Exactly the first example (mixed translation); the second example
        // never reaches the card.
        await expect(page.locator('#fc-card-mount .back-example-box .ex-sentence-span')).toHaveText('💬 Der Tisch ist groß.');
        const exLine = page.locator('#fc-card-mount .back-example-box .ex-translation-line');
        await expect(exLine).toContainText('The table is big.');
        expect(await exLine.textContent()).toMatch(ARABIC);
        await expect(exLine).toHaveAttribute('dir', 'auto');
        await expect(exLine).not.toHaveAttribute('lang');
        await expect(page.locator('#fc-card-mount .verb-card-back')).not.toContainText('Ich kaufe den Tisch.');
    });

    test('SC3-B2-SYNTH-NOEX-EN: English-only no-example card renders safely', async ({ page }) => {
        await openSyntheticB2(page);

        for (let i = 0; i < 2; i++) {
            await page.locator('.fc-nav button', { hasText: 'Next' }).click();
        }
        await expect(page.locator('#fc-card-mount #fc-de')).toHaveText('die Forschung');

        await flipToBack(page);
        await expect(page.locator('#fc-card-mount #fc-en')).toHaveText('research');
        await expect(page.locator('#fc-card-mount #fc-en')).toHaveAttribute('lang', 'en');
        await expect(page.locator('#fc-card-mount .back-example-box')).toHaveCount(0);
    });

    test('SC3-B2-SYNTH-MISSING-TR: missing translation renders a truthful placeholder and never a false language', async ({ page }) => {
        await openSyntheticB2(page);

        for (let i = 0; i < 3; i++) {
            await page.locator('.fc-nav button', { hasText: 'Next' }).click();
        }
        await expect(page.locator('#fc-card-mount #fc-de')).toHaveText('das Nichts');

        // Translation-front for a card with no translation: the front shows a
        // truthful muted placeholder — never the German answer (secrecy).
        await page.locator('#face-en-btn').click();
        await expect(page.locator('#fc-card-mount #fc-de')).toHaveText('—');
        const sweep = await sweepFlashcardView(page, ['das Nichts', 'Das Nichts ist leer.']);
        expect(sweep.unique, `missing-translation front leak: ${sweep.unique.join(' | ')}`).toEqual([]);

        // Revealing a translation-front card shows the German answer with the
        // example sentence (no translation line exists for this example).
        await flipToBack(page);
        await expect(page.locator('#fc-card-mount #fc-en')).toHaveText('das Nichts');
        await expect(page.locator('#fc-card-mount #fc-en')).toHaveAttribute('lang', 'de');
        await expect(page.locator('#fc-card-mount .back-example-box .ex-sentence-span')).toHaveText('💬 Das Nichts ist leer.');
        await expect(page.locator('#fc-card-mount .ex-translation-line')).toHaveCount(0);

        // German-front: the missing translation renders the truthful muted
        // placeholder on the answer side — with no language label at all.
        await page.locator('#face-de-btn').click();
        await flipToBack(page);
        await expect(page.locator('#fc-card-mount #fc-en')).toHaveText('—');
        await expect(page.locator('#fc-card-mount #fc-en')).not.toHaveAttribute('lang');
        await expect(page.locator('#fc-card-mount .back-example-box .ex-sentence-span')).toHaveText('💬 Das Nichts ist leer.');
    });

    test('SC3-B2-SYNTH-VOICE: Arabic and mixed display text are never spoken through any voice', async ({ page }) => {
        await openSyntheticB2(page);

        // Card 1-0 (Arabic-only translation): the German prompt is speakable…
        await page.locator('#fc-card-mount .verb-card-front [data-action="speak"]').click();
        let calls = await page.evaluate(() => window.__ttsCalls);
        expect(calls).toHaveLength(1);
        expect(calls[0].text).toBe('das Wort');

        // …but the Arabic answer is never spoken after reveal (no English
        // text exists — there is no safe utterance, so nothing is spoken).
        await flipToBack(page);
        await page.locator('#fc-card-mount .verb-card-back [data-action="speak"]').click();
        calls = await page.evaluate(() => window.__ttsCalls);
        expect(calls).toHaveLength(1);

        // Card 1-1 (mixed translation): the back speak uses the English part
        // only — never the mixed display text.
        await flipBackToFront(page);
        await page.locator('.fc-nav button', { hasText: 'Next' }).click();
        await expect(page.locator('#fc-card-mount #fc-de')).toHaveText('der Tisch');
        await flipToBack(page);
        await page.locator('#fc-card-mount .verb-card-back [data-action="speak"]').click();
        calls = await page.evaluate(() => window.__ttsCalls);
        expect(calls).toHaveLength(2);
        expect(calls[1].text).toBe('table');
        expect(calls[1].text).not.toMatch(ARABIC);

        // The example sentence speaks German through the real adapter.
        await page.locator('#fc-card-mount .back-example-box .ex-sentence-span').click();
        calls = await page.evaluate(() => window.__ttsCalls);
        expect(calls).toHaveLength(3);
        expect(calls[2].text).toBe('Der Tisch ist groß.');
        expect(calls[2].lang).toBe('de-DE');

        // No captured utterance ever contained Arabic display text.
        for (const call of calls) {
            expect(call.text, `utterance must not contain Arabic display text: ${call.text}`).not.toMatch(ARABIC);
        }
    });
});

// ---------------------------------------------------------------------------
// Interaction and accessibility (A1 real dataset)
// ---------------------------------------------------------------------------

test.describe('SHARED-CARD-003 interaction and accessibility (A1)', () => {

    test('SC3-INT-POINTER: pointer click flips front to back and back to front (AC-07)', async ({ page }) => {
        await prepareLevelPage(page, { level: 'a1' });
        await openWordsFlashcards(page);
        await turnShuffleOff(page);

        await flipToBack(page);
        await expect(page.locator('#fc-card-mount .verb-card-back')).not.toBeEmpty();
        await expect(page.locator('#fc-card-mount .verb-card-front')).toHaveAttribute('inert', '');

        await flipBackToFront(page);
        await expect(page.locator('#fc-card-mount .verb-card-back')).toBeEmpty();
        await expect(page.locator('#fc-card-mount #fc-de')).toHaveText('Hallo!');
    });

    test('SC3-INT-ENTER: the card is keyboard-reachable and Enter flips it exactly once', async ({ page }) => {
        await prepareLevelPage(page, { level: 'a1' });
        await openWordsFlashcards(page);
        await turnShuffleOff(page);

        const reached = await tabUntilFocused(page, '#fc-card-mount .verb-flashcard');
        expect(reached, 'Tab navigation must reach the shared card flip surface').toBe(true);

        await installFlipClassCounter(page);
        await page.keyboard.press('Enter');
        await expect(page.locator('#fc-card-mount .verb-flashcard')).toHaveClass(/flipped/);
        const mutations = await page.evaluate(() => window.__flipMutations);
        expect(mutations, 'one Enter keypress must cause exactly one flip transition').toBe(1);

        // A second, separate Enter press is a new intent: exactly one more
        // transition (flip back).
        await page.keyboard.press('Enter');
        await expect(page.locator('#fc-card-mount .verb-flashcard')).not.toHaveClass(/flipped/);
        expect(await page.evaluate(() => window.__flipMutations)).toBe(2);
    });

    test('SC3-INT-SPACE: Space flips the card exactly once and never scrolls the page', async ({ page }) => {
        await prepareLevelPage(page, { level: 'a1' });
        await openWordsFlashcards(page);
        await turnShuffleOff(page);

        const reached = await tabUntilFocused(page, '#fc-card-mount .verb-flashcard');
        expect(reached, 'Tab navigation must reach the shared card flip surface').toBe(true);

        await installFlipClassCounter(page);
        await page.keyboard.press(' ');
        await expect(page.locator('#fc-card-mount .verb-flashcard')).toHaveClass(/flipped/);
        expect(await page.evaluate(() => window.__flipMutations)).toBe(1);
    });

    test('SC3-INT-CONTROLS: Enter on a focused card control runs only that control — zero flip transitions', async ({ page }) => {
        await prepareLevelPage(page, { level: 'a1' });
        await openWordsFlashcards(page);
        await turnShuffleOff(page);

        // Keyboard-focus the front speak affordance and press Enter: the
        // native button activation speaks; the card must not flip.
        const speakSel = '#fc-card-mount .verb-card-front [data-action="speak"]';
        const reached = await tabUntilFocused(page, speakSel);
        expect(reached, 'Tab must reach the front speak control').toBe(true);

        await installFlipClassCounter(page);
        await page.keyboard.press('Enter');
        const calls = await page.evaluate(() => window.__ttsCalls);
        expect(calls).toHaveLength(1);
        expect(calls[0].text).toBe('Hallo!');
        expect(await page.evaluate(() => window.__flipMutations)).toBe(0);
        await expect(page.locator('#fc-card-mount .verb-flashcard')).not.toHaveClass(/flipped/);
    });

    test('SC3-INT-GRADE-DOUBLE: keyboard Enter on Known grades exactly once — no duplicate write or double advance', async ({ page }) => {
        await prepareLevelPage(page, { level: 'a1' });
        await openWordsFlashcards(page);
        await turnShuffleOff(page);

        const reached = await tabUntilFocused(page, '.fc-btn.btn-known');
        expect(reached, 'Tab must reach the Known control').toBe(true);

        // One Enter press on a real button fires keydown + native click; the
        // card activation guard must keep this to a single grade.
        await page.keyboard.press('Enter');
        await page.waitForFunction((key) => {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            return data.srsData && Object.keys(data.srsData).length === 1;
        }, A1_KEY);

        const progress = await readProgress(page, A1_KEY);
        expect(Object.keys(progress.srsData)).toEqual(['1-0']);
        expect(progress.known).toEqual(['1-0']);
        await expect(page.locator('#fc-counter')).toHaveText('2 / 30');
    });

    test('SC3-INT-BACK-CONTROLS: revealed-back controls never flip, grade, or advance the card (AC-08)', async ({ page }) => {
        await prepareLevelPage(page, { level: 'a1' });
        await openWordsFlashcards(page);
        await turnShuffleOff(page);
        await flipToBack(page);

        // Back speak: one utterance, no state change.
        await page.locator('#fc-card-mount .verb-card-back [data-action="speak"]').click();
        let calls = await page.evaluate(() => window.__ttsCalls);
        expect(calls).toHaveLength(1);
        expect(calls[0].text).toBe('Hello!');
        await expect(page.locator('#fc-card-mount .verb-flashcard')).toHaveClass(/flipped/);
        await expect(page.locator('#fc-counter')).toHaveText('1 / 30');

        // Back favorite: state change limited to the favorite; the answer
        // stays revealed.
        const backFav = page.locator('#fc-card-mount .verb-card-back [data-action="fav"]');
        await backFav.click();
        await expect(page.locator('#fc-card-mount .verb-flashcard')).toHaveClass(/flipped/);
        await expect(page.locator('#fc-card-mount .verb-card-back [data-action="fav"]')).toHaveAttribute('aria-pressed', 'true');
        let progress = await readProgress(page, A1_KEY);
        expect(progress.favorites).toEqual(['1-0']);
        expect(Object.keys(progress.srsData || {})).toEqual([]);
        await expect(page.locator('#fc-counter')).toHaveText('1 / 30');

        // Example-sentence speech: German utterance, no flip/grade/advance.
        await page.locator('#fc-card-mount .back-example-box .ex-sentence-span').click();
        calls = await page.evaluate(() => window.__ttsCalls);
        expect(calls).toHaveLength(2);
        expect(calls[1].text).toBe('Hallo, ich bin Anna.');
        expect(calls[1].lang).toBe('de-DE');
        await expect(page.locator('#fc-card-mount .verb-flashcard')).toHaveClass(/flipped/);
        await expect(page.locator('#fc-counter')).toHaveText('1 / 30');
        progress = await readProgress(page, A1_KEY);
        expect(Object.keys(progress.srsData || {})).toEqual([]);
        expect(progress.favorites).toEqual(['1-0']);
    });

    test('SC3-A11Y-INERT: only the displayed face is focusable and exposed — inert faces, AX-tree exclusion, flip-back restore (AC-09/SC2-C1 analog)', async ({ page }) => {
        await prepareLevelPage(page, { level: 'a1' });
        await openWordsFlashcards(page);
        await turnShuffleOff(page);

        // BEFORE REVEAL: front active, empty back inert.
        let faces = await page.evaluate(() => ({
            front: document.querySelector('#fc-card-mount .verb-flashcard .verb-card-front').inert,
            back: document.querySelector('#fc-card-mount .verb-flashcard .verb-card-back').inert
        }));
        expect(faces.front).toBe(false);
        expect(faces.back).toBe(true);

        const frontSpeakSel = '#fc-card-mount .verb-card-front [data-action="speak"]';
        const preWalk = await tabWalk(page, { wantedSelectors: [frontSpeakSel], stopSelector: frontSpeakSel, maxTabs: 70 });
        expect(preWalk.seen.has(frontSpeakSel), 'pre-reveal Tab must reach the front speak control').toBe(true);

        // AFTER REVEAL: hidden front inert, displayed back active.
        await flipToBack(page);
        faces = await page.evaluate(() => ({
            front: document.querySelector('#fc-card-mount .verb-flashcard .verb-card-front').inert,
            back: document.querySelector('#fc-card-mount .verb-flashcard .verb-card-back').inert
        }));
        expect(faces.front).toBe(true);
        expect(faces.back).toBe(false);

        // Chrome's real accessibility tree contains exactly one "Speak word"
        // button — on the displayed back face.
        const axFaces = await axTreeButtonFaces(page, 'Speak word');
        expect(axFaces).toEqual(['back']);

        // A full keyboard traversal reaches back controls but never a front
        // control.
        const walk = await tabWalk(page, {
            wantedSelectors: [
                '#fc-card-mount .verb-card-back [data-action="speak"]',
                frontSpeakSel,
                '#fc-card-mount .verb-card-front [data-action="fav"]'
            ],
            maxTabs: 70
        });
        expect(walk.seen.has('#fc-card-mount .verb-card-back [data-action="speak"]'), 'Tab must reach the back speak control').toBe(true);
        expect(walk.seen.has(frontSpeakSel), 'Tab must never focus the hidden front speak control').toBe(false);
        expect(walk.seen.has('#fc-card-mount .verb-card-front [data-action="fav"]'), 'Tab must never focus the hidden front favorite control').toBe(false);

        // FLIP BACK: front accessibility restored, answer side emptied.
        await flipBackToFront(page);
        faces = await page.evaluate(() => ({
            front: document.querySelector('#fc-card-mount .verb-flashcard .verb-card-front').inert,
            back: document.querySelector('#fc-card-mount .verb-flashcard .verb-card-back').inert
        }));
        expect(faces.front).toBe(false);
        expect(faces.back).toBe(true);
        await expect(page.locator('#fc-card-mount .verb-card-back')).toBeEmpty();
        const restoreWalk = await tabWalk(page, { wantedSelectors: [frontSpeakSel], stopSelector: frontSpeakSel, maxTabs: 70 });
        expect(restoreWalk.seen.has(frontSpeakSel), 'flip-back must restore front-face keyboard accessibility').toBe(true);
    });

    test('SC3-A11Y-NAMES: icon-only card controls expose descriptive accessible names and truthful aria-pressed', async ({ page }) => {
        await prepareLevelPage(page, { level: 'a1' });
        await openWordsFlashcards(page);
        await turnShuffleOff(page);

        const frontSpeak = page.locator('#fc-card-mount .verb-card-front [data-action="speak"]');
        await expect(frontSpeak).toHaveAttribute('aria-label', 'Speak word');
        const frontFav = page.locator('#fc-card-mount .verb-card-front [data-action="fav"]');
        await expect(frontFav).toHaveAttribute('aria-label', 'Toggle Favorite');

        // Role lookups resolve the controls by their descriptive names — the
        // bare emoji glyphs are not the announced names.
        await expect(page.getByRole('button', { name: 'Speak word' })).toHaveCount(1);
        await expect(page.getByRole('button', { name: 'Toggle Favorite' })).toHaveCount(1);
        await expect(page.getByRole('button', { name: '🔊', exact: true })).toHaveCount(0);
        await expect(page.getByRole('button', { name: '☆', exact: true })).toHaveCount(0);

        // aria-pressed carries the favorite state while the name stays stable.
        await expect(frontFav).toHaveAttribute('aria-pressed', 'false');
        await frontFav.click();
        await expect(page.locator('#fc-card-mount .verb-card-front [data-action="fav"]')).toHaveAttribute('aria-pressed', 'true');
        await expect(page.getByRole('button', { name: 'Toggle Favorite' })).toHaveCount(1);
        await expect(page.getByRole('button', { name: '⭐', exact: true })).toHaveCount(0);
    });

    test('SC3-A11Y-FOCUS: keyboard-focused card and toolbar controls match :focus-visible and paint a visible indicator (AC-09)', async ({ page }) => {
        await prepareLevelPage(page, { level: 'a1' });
        await openWordsFlashcards(page);
        await turnShuffleOff(page);

        // SHARED-CARD-003-C1: every VISIBLE level-owned control in
        // #view-flashcard is covered — the card affordances plus the grade
        // and navigation buttons below the card, and the two .controls-row
        // toolbars above it (Back to List, Shuffle, the All Cards / Still
        // Learning / Favourites filters, and the German / English front-face
        // switches). The owner finding: the toolbar buttons were reachable
        // by Tab and matched :focus-visible but painted no indicator at all.
        const wanted = [
            '#fc-card-mount .verb-card-front [data-action="speak"]',
            '#fc-card-mount .verb-card-front [data-action="fav"]',
            '.fc-btn.btn-learning',
            '.fc-btn.btn-known',
            '.fc-nav button:last-of-type',
            '#view-flashcard .controls-row > .btn:first-child',
            '#shuffle-btn',
            '#filter-all-btn',
            '#filter-learning-btn',
            '#filter-favorites-btn',
            '#face-de-btn',
            '#face-en-btn'
        ];
        const baseline = await snapshotFocusStyles(page, wanted);
        for (const sel of wanted) {
            expect(baseline[sel].present, `${sel} must exist`).toBe(true);
        }
        const walk = await tabWalk(page, { wantedSelectors: wanted, maxTabs: 70 });
        for (const sel of wanted) {
            expect(walk.seen.has(sel), `Tab navigation must reach ${sel}`).toBe(true);
            const info = walk.seen.get(sel);
            expect(info.focusVisible, `keyboard focus on ${sel} must match :focus-visible`).toBe(true);
            const indicated = visibleFocusIndicator(baseline[sel].styles, info.styles);
            expect(indicated, `${sel} must show a keyboard-focus indicator`).toBe(true);
        }
    });

    test('SC3-A11Y-TARGETS: card and toolbar touch targets are at least 44x44 CSS pixels (AC-09)', async ({ page }) => {
        await prepareLevelPage(page, { level: 'a1' });
        await openWordsFlashcards(page);
        await turnShuffleOff(page);

        // SHARED-CARD-003-C1: the visible toolbar controls are measured too
        // (at the base revision every one of them was 37 CSS px tall).
        const targets = [
            ['speak', '#fc-card-mount .verb-card-front [data-action="speak"]'],
            ['favorite', '#fc-card-mount .verb-card-front [data-action="fav"]'],
            ['known', '.fc-btn.btn-known'],
            ['learning', '.fc-btn.btn-learning'],
            ['next', '.fc-nav button:last-of-type'],
            ['back-to-list', '#view-flashcard .controls-row > .btn:first-child'],
            ['shuffle', '#shuffle-btn'],
            ['all-cards filter', '#filter-all-btn'],
            ['still-learning filter', '#filter-learning-btn'],
            ['favourites filter', '#filter-favorites-btn'],
            ['german face', '#face-de-btn'],
            ['english face', '#face-en-btn']
        ];
        for (const [label, sel] of targets) {
            const box = await page.locator(sel).boundingBox();
            expect(box, `${label} button must exist`).toBeTruthy();
            expect(box.width, `${label} width`).toBeGreaterThanOrEqual(44);
            expect(box.height, `${label} height`).toBeGreaterThanOrEqual(44);
        }
    });

    test('SC3-A11Y-REDUCED-MOTION: reduced-motion preference disables the flip transition but not the flip', async ({ page }) => {
        await prepareLevelPage(page, { level: 'a1' });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await openWordsFlashcards(page);

        const motionFacts = await page.evaluate(() => {
            const card = document.querySelector('#fc-card-mount .verb-flashcard');
            const style = window.getComputedStyle(card);
            let reducedMotionRules = 0;
            for (const sheet of document.styleSheets) {
                let rules;
                try {
                    rules = sheet.cssRules;
                } catch (e) {
                    continue;
                }
                for (const rule of rules) {
                    if (rule.media && rule.media.mediaText.includes('prefers-reduced-motion')) {
                        reducedMotionRules += 1;
                    }
                }
            }
            return {
                transitionProperty: style.transitionProperty,
                transitionDuration: style.transitionDuration,
                reducedMotionRules
            };
        });
        expect(motionFacts.transitionProperty).toContain('transform');
        expect(motionFacts.transitionDuration).toBe('0s');
        expect(motionFacts.reducedMotionRules).toBeGreaterThanOrEqual(1);

        // The flip still works, just without animation.
        await page.locator('#fc-card-mount .verb-flashcard .verb-center-content').click();
        await expect(page.locator('#fc-card-mount .verb-flashcard')).toHaveClass(/flipped/);
    });

    test('SC3-THEME: light and dark themes both render the card and keep the flip behavior', async ({ page }) => {
        await prepareLevelPage(page, { level: 'a1' });
        await openWordsFlashcards(page);
        await turnShuffleOff(page);

        const frontFace = page.locator('#fc-card-mount .verb-card-front');
        const lightBg = await frontFace.evaluate((el) => window.getComputedStyle(el).backgroundColor);
        expect(await page.evaluate(() => document.documentElement.getAttribute('data-theme'))).toBe('light');

        await page.locator('#theme-btn').click();
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
        const darkBg = await frontFace.evaluate((el) => window.getComputedStyle(el).backgroundColor);
        expect(darkBg).not.toBe(lightBg);

        // The card still renders and flips in the dark theme.
        await expect(page.locator('#fc-card-mount #fc-de')).toHaveText('Hallo!');
        await flipToBack(page);
        await expect(page.locator('#fc-card-mount #fc-en')).toHaveText('Hello!');
        const progress = await readProgress(page, A1_KEY);
        expect(progress.darkMode).toBe(true);
    });

    test('SC3-OVERFLOW: no horizontal overflow on the front or the revealed mixed-content back (AC-09)', async ({ page }) => {
        await prepareLevelPage(page, { level: 'b2' });
        await openWordsFlashcards(page);
        await turnShuffleOff(page);

        const measure = () => page.evaluate(() => ({
            doc: document.documentElement.scrollWidth - window.innerWidth,
            area: (() => {
                const el = document.getElementById('content-area');
                return el.scrollWidth - el.clientWidth;
            })()
        }));
        const front = await measure();
        expect(front.doc).toBeLessThanOrEqual(1);
        expect(front.area).toBeLessThanOrEqual(1);

        // Worst case: revealed back with the long mixed EN/AR example block.
        await flipToBack(page);
        const back = await measure();
        expect(back.doc).toBeLessThanOrEqual(1);
        expect(back.area).toBeLessThanOrEqual(1);
    });

    test('SC3-CONSOLE: both level pages boot the shared card with a clean console', async ({ page }) => {
        const errors = trackErrors(page);
        await prepareLevelPage(page, { level: 'a1' });
        await openWordsFlashcards(page);
        await turnShuffleOff(page);
        await expect(page.locator('#fc-card-mount #fc-de')).toHaveText('Hallo!');

        await prepareLevelPage(page, { level: 'b2' });
        await openWordsFlashcards(page);
        await expect(page.locator('#fc-card-mount #fc-de')).toBeVisible();
        expect(errors).toEqual([]);
    });
});

// ---------------------------------------------------------------------------
// Regression — phrases, conversation, and the words/phrases source boundary
// ---------------------------------------------------------------------------

test.describe('SHARED-CARD-003 regression — phrases, conversation, source boundary', () => {

    test('SC3-REG-PHRASES-TAB: the Phrases tab still renders phrase cards (LF-NAV / AC-10)', async ({ page }) => {
        await prepareLevelPage(page, { level: 'a1' });
        await page.locator('button[role="tab"]', { hasText: 'Phrases' }).click();
        await page.waitForSelector('.phrase-card');
        const cards = page.locator('.phrase-card');
        await expect(cards.first()).toBeVisible();
        expect(await cards.count()).toBeGreaterThan(0);
        await expect(page.locator('#phrases-tab-counter')).toBeVisible();
    });

    test('SC3-REG-PHRASE-FLASHCARDS: phrase flashcards keep the legacy card behavior, grading and phrase counters', async ({ page }) => {
        await prepareLevelPage(page, { level: 'a1' });
        await page.locator('button[role="tab"]', { hasText: 'Phrases' }).click();
        await page.waitForSelector('.phrase-card');

        await page.locator('button', { hasText: 'Flashcards' }).click();
        await page.waitForSelector('.flashcard-container');

        // The phrase card keeps its legacy markup — NOT the shared card.
        await expect(page.locator('.flashcard-inner')).toHaveCount(1);
        await expect(page.locator('#fc-card-mount .verb-flashcard')).toHaveCount(0);
        await expect(page.locator('#fc-de')).toHaveCount(1);
        await expect(page.locator('#fc-en')).toHaveCount(1);

        // Flip through the legacy surface and reveal the meaning.
        await page.locator('.flashcard-inner').click();
        await expect(page.locator('#active-flashcard')).toHaveClass(/flipped/);
        await expect(page.locator('#fc-en')).toBeVisible();

        // Grading a phrase writes into the PHRASES storage fields.
        await page.locator('.fc-btn.btn-known').click();
        await page.waitForFunction((key) => {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            return data.knownPhrases && data.knownPhrases.length === 1;
        }, A1_KEY);
        const progress = await readProgress(page, A1_KEY);
        expect(progress.knownPhrases[0]).toMatch(/^P-a1-0-/);
        expect(progress.known || []).toEqual([]);
    });

    test('SC3-REG-CONVERSATION: the Conversation tab still renders scenes', async ({ page }) => {
        await prepareLevelPage(page, { level: 'a1' });
        await page.locator('button[role="tab"]', { hasText: 'Conversation' }).click();
        await page.waitForSelector('.conversation-container');
        await expect(page.locator('.convo-scene').first()).toBeVisible();
        expect(await page.locator('.convo-line').count()).toBeGreaterThan(0);
    });

    test('SC3-REG-B2-MISSING: B2 phrases and conversation tabs show their configured empty states', async ({ page }) => {
        await prepareLevelPage(page, { level: 'b2' });

        await page.locator('button[role="tab"]', { hasText: 'Phrases' }).click();
        await expect(page.locator('#panel-phrases')).toContainText('No phrases available for this unit yet.');

        await page.locator('button[role="tab"]', { hasText: 'Conversation' }).click();
        await expect(page.locator('#panel-conversation')).toContainText('No conversation available for this unit yet.');
    });

    test('SC3-REG-SOURCE-BOUNDARY: a unit switch from phrase flashcards re-routes word grades to word storage (AC-17/AC-10)', async ({ page }) => {
        await prepareLevelPage(page, { level: 'a1' });
        await page.locator('button[role="tab"]', { hasText: 'Phrases' }).click();
        await page.waitForSelector('.phrase-card');
        await page.locator('button', { hasText: 'Flashcards' }).click();
        await page.waitForSelector('.flashcard-inner');

        // Switching unit while in the phrase-flashcard view loads WORDS: the
        // explicit source boundary must route the next grade to the word
        // fields — never into knownPhrases (the legacy desync corrupted data).
        await page.evaluate((i) => window.app.switchUnit(i), 1);
        await expect(page.locator('#fc-card-mount .verb-flashcard')).toBeVisible({ timeout: 8000 });
        await expect(page.locator('.flashcard-inner')).toHaveCount(0);

        await page.locator('.fc-btn.btn-known').click();
        await page.waitForFunction((key) => {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            return data.known && data.known.length === 1;
        }, A1_KEY);

        const progress = await readProgress(page, A1_KEY);
        expect(progress.known[0]).toMatch(/^2-\d+$/);
        expect(progress.knownPhrases || []).toEqual([]);
        expect(progress.favoritePhrases || []).toEqual([]);
        expect(Object.keys(progress.phraseErrors || {})).toEqual([]);
    });

    test('SC3-REG-MODE-SWAP: words and phrases flashcard modes swap their card DOM with no duplicate ids', async ({ page }) => {
        await prepareLevelPage(page, { level: 'a1' });

        // Words mode: shared card, no legacy card.
        await openWordsFlashcards(page);
        await expect(page.locator('#fc-card-mount .verb-flashcard')).toHaveCount(1);
        await expect(page.locator('.flashcard-inner')).toHaveCount(0);
        expect(await page.evaluate(() => document.querySelectorAll('#fc-de').length)).toBe(1);
        expect(await page.evaluate(() => document.querySelectorAll('#active-flashcard').length)).toBe(1);

        // To phrases mode: legacy card restored, no shared card.
        await page.locator('#view-flashcard button', { hasText: 'Back to List' }).click();
        await page.locator('button[role="tab"]', { hasText: 'Phrases' }).click();
        await page.waitForSelector('.phrase-card');
        await page.locator('button', { hasText: 'Flashcards' }).click();
        await page.waitForSelector('.flashcard-inner');
        await expect(page.locator('.flashcard-inner')).toHaveCount(1);
        await expect(page.locator('#fc-card-mount .verb-flashcard')).toHaveCount(0);
        expect(await page.evaluate(() => document.querySelectorAll('#fc-de').length)).toBe(1);
        await page.locator('.flashcard-inner').click();
        await expect(page.locator('#fc-en')).toBeVisible();

        // Back to words mode: shared card again, still exactly one of each id.
        await page.locator('#view-flashcard button', { hasText: 'Back to List' }).click();
        await page.locator('button[role="tab"]', { hasText: 'Words' }).click();
        await page.waitForSelector('#glossary-tbody tr');
        await openWordsFlashcards(page);
        await expect(page.locator('#fc-card-mount .verb-flashcard')).toHaveCount(1);
        await expect(page.locator('.flashcard-inner')).toHaveCount(0);
        expect(await page.evaluate(() => document.querySelectorAll('#fc-de').length)).toBe(1);
        // Pre-reveal there is no answer element at all (lazy back); after the
        // flip exactly one #fc-en exists — never a duplicate from the phrase
        // card.
        expect(await page.evaluate(() => document.querySelectorAll('#fc-en').length)).toBe(0);
        await flipToBack(page);
        expect(await page.evaluate(() => document.querySelectorAll('#fc-en').length)).toBe(1);
        expect(await page.evaluate(() => document.querySelectorAll('#active-flashcard').length)).toBe(1);
    });

    test('SC3-REG-A1-UNIT-SWITCH: A1 unit switching updates the card scope and grades the exact unit-2 ID', async ({ page }) => {
        await prepareLevelPage(page, { level: 'a1' });
        await openWordsFlashcards(page);
        await turnShuffleOff(page);

        await page.evaluate((i) => window.app.switchUnit(i), 1);
        await expect(page.locator('#fc-card-mount #fc-de')).toHaveText('der Beruf, -e');
        await expect(page.locator('#fc-counter')).toHaveText('1 / 43');

        await page.locator('.fc-btn.btn-known').click();
        await page.waitForFunction((key) => {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            return data.srsData && Object.keys(data.srsData).length === 1;
        }, A1_KEY);
        const progress = await readProgress(page, A1_KEY);
        expect(Object.keys(progress.srsData)).toEqual(['2-0']);
        expect(progress.known).toEqual(['2-0']);
    });
});
