import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// SHARED-CARD-001 — Characterization of the published German Verbs card reference.
//
// Purpose: capture the ACTUAL DOM/interaction boundaries of the ordinary Verbs
// flashcard and the Guided Challenge card before any shared-card extraction
// (SHARED-CARD-002), and compare them with the approved LF-CARD / GC-UI
// targets. Pre-existing contract failures are exposed as stable findings
// (SC-01..SC-07), never hidden inside green snapshots.
//
// Check classification (see report section 4):
// - "CHAR" tests pin current behavior (they PASS and fail when behavior
//   changes, so a fix forces a conscious test update).
// - "TARGET" tests assert approved LF/GC behavior that the published
//   implementation already meets.
// - "FINDING" tests pin a currently DEFECTIVE behavior and name its finding
//   ID; "TARGET (finding SC-xx)" tests are test.fail() wrappers asserting the
//   approved target: they run, fail for real, and an unexpected pass is
//   reported by Playwright as a failure — the finding cannot silently heal.
//
// The synthetic deck (tests/fixtures/cefr/verbs-card-reference.json) supplies
// edge cases the real dataset lacks (zero examples, one example, German-only
// example, separable prefix) with exact, independently authored expected
// values. The Guided scheduler and persistence are only DRIVEN, never judged
// here: the deferred BL-03 scheduler mismatch is deliberately out of scope.

const FIXTURE_BODY = readFileSync(
    path.join(__dirname, '..', 'fixtures', 'cefr', 'verbs-card-reference.json'),
    'utf8'
);

const STORAGE_KEY = 'german_app_progress_a1_app_data';

// Network-level stub for js/core/firebase.js (same pattern as the tracked
// verb-guided-challenge.spec.js): registers real listener chains, serves
// deterministic null-auth and progress payloads. Every other module —
// verbs-engine, tts, storage, utils, activity, trophies, leaderboard,
// srs-logic, verb-challenge-engine — is the real browser module.
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

// Deterministic speechSynthesis double installed before any page script runs.
// Captures the utterance TEXT and LANG exactly as the real tts.js adapter
// submits them, so audio assertions prove the adapter contract, not a mock's
// own logic (TS-TEST-004).
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

// Serve the synthetic edge-case deck and the firebase stub for one page.
async function prepareSyntheticPage(page) {
    await page.route('**/content/generated/verbs/top_verbs_2000.json', (route) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: FIXTURE_BODY })
    );
    await page.route('**/js/core/firebase.js*', (route) =>
        route.fulfill({ status: 200, contentType: 'application/javascript', body: FIREBASE_STUB_SOURCE })
    );
    installSpeechCapture(page);
}

// Real published dataset, stubbed auth + captured speech only.
async function prepareRealPage(page) {
    await page.route('**/js/core/firebase.js*', (route) =>
        route.fulfill({ status: 200, contentType: 'application/javascript', body: FIREBASE_STUB_SOURCE })
    );
    installSpeechCapture(page);
}

async function openFlashcardsView(page) {
    await page.goto('/verbs.html');
    await page.locator('button:has-text("Flashcards Mode")').click();
    await expect(page.locator('.verb-flashcard')).toBeVisible();
}

// Full ordinary-card controller state for exact negative assertions.
function readCardState(page) {
    return page.evaluate(() => {
        const e = window.verbsEngine;
        return {
            index: e.currentIndex,
            flipped: e.isFlipped,
            filter: e.flashcardFilter,
            direction: e.cardDirectionMode,
            known: [...(e.userData.knownVerbIds || [])],
            favorites: [...(e.userData.verbFavorites || [])]
        };
    });
}

function readPersistedState(page) {
    return page.evaluate((key) => {
        const raw = localStorage.getItem(key);
        if (!raw) return { known: [], favorites: [] };
        const data = JSON.parse(raw);
        return {
            known: [...(data.knownVerbIds || [])],
            favorites: [...(data.verbFavorites || [])]
        };
    }, STORAGE_KEY);
}

async function flipToBack(page) {
    await page.locator('.verb-flashcard .verb-center-content').click();
    await expect(page.locator('.verb-flashcard')).toHaveClass(/flipped/);
}

async function setDirectionMode(page, value) {
    const directionSelect = page.locator('#view-flashcard .controls-row select').first();
    await directionSelect.selectOption(value);
}

function trackErrors(page) {
    const errors = [];
    page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(String(err)));
    return errors;
}

async function startGuided(page) {
    await page.goto('/verbs.html');
    await page.locator('button:has-text("Guided Challenge")').click();
    await expect(page.locator('#view-guided')).toBeVisible();
    await expect(page.locator('.guided-card')).toBeVisible();
}

// Deterministically wait for the guided card identity to change after a click.
async function waitForGuidedCardChange(page, previousPromptText) {
    await page.waitForFunction((prevText) => {
        const t = document.querySelector('.guided-prompt-main')?.textContent;
        const changed = typeof t === 'string' && t !== prevText;
        const gone = !document.querySelector('.guided-prompt-main');
        return changed || gone;
    }, previousPromptText);
}

// Click through every intro card, recording each intro's prompt and example
// lines. Stops at the first non-intro presentation (a recall card).
async function clickIntrosCollecting(page) {
    const intros = [];
    let guard = 0;
    while (guard++ < 30) {
        const introBtn = page.locator('button:has-text("Got it — Continue")');
        if (!(await introBtn.count())) break;
        const card = {
            prompt: await page.locator('.guided-prompt-main').textContent(),
            exampleDe: null,
            exampleEn: null
        };
        const exDe = page.locator('.guided-prompt-example');
        const exEn = page.locator('.guided-example-en');
        if (await exDe.count()) card.exampleDe = (await exDe.textContent()).replace('💬 ', '').trim();
        if (await exEn.count()) card.exampleEn = (await exEn.textContent()).replace('🔤 ', '').trim();
        intros.push(card);
        await introBtn.click();
        await waitForGuidedCardChange(page, card.prompt);
    }
    return intros;
}

// Drive the whole Acquisition phase (interspersed intro cards, scored recalls
// and non-scored spacers), collecting every intro card as it appears. Stops
// at the phase-transition banner. The scheduler is driven as published; its
// policy is NOT under test here (BL-03 is deferred).
async function driveAcquisitionCollectingIntros(page) {
    const intros = [];
    let guard = 0;
    while (guard++ < 200) {
        const introBtn = page.locator('button:has-text("Got it — Continue")');
        if (await introBtn.count()) {
            const card = {
                prompt: await page.locator('.guided-prompt-main').textContent(),
                exampleDe: null,
                exampleEn: null
            };
            const exDe = page.locator('.guided-prompt-example');
            const exEn = page.locator('.guided-example-en');
            if (await exDe.count()) card.exampleDe = (await exDe.textContent()).replace('💬 ', '').trim();
            if (await exEn.count()) card.exampleEn = (await exEn.textContent()).replace('🔤 ', '').trim();
            intros.push(card);
            await introBtn.click();
            await waitForGuidedCardChange(page, card.prompt);
            continue;
        }
        const revealBtn = page.locator('button:has-text("Reveal Answer")');
        if (await revealBtn.count()) {
            await revealBtn.click();
            const knewBtn = page.locator('button:has-text("I knew it")');
            if (await knewBtn.count()) {
                await knewBtn.click();
            } else {
                // Non-scored spacer: its terminal action is Continue
                await page.locator('button:has-text("Continue")').first().click();
            }
            continue;
        }
        // Transition banner (or completion): Acquisition is over
        break;
    }
    return intros;
}

// Advance (through any interleaved intro/transition presentations) until a
// recall card with a Reveal Answer button is on screen.
async function driveUntilRevealCard(page) {
    let guard = 0;
    while (guard++ < 40) {
        const revealBtn = page.locator('button:has-text("Reveal Answer")');
        if (await revealBtn.count()) return;
        const introBtn = page.locator('button:has-text("Got it — Continue")');
        if (await introBtn.count()) {
            const prev = await page.locator('.guided-prompt-main').textContent();
            await introBtn.click();
            await waitForGuidedCardChange(page, prev);
            continue;
        }
        const contBtn = page.locator('button:has-text("Continue")').first();
        if (await contBtn.count()) {
            await contBtn.click();
            continue;
        }
        break;
    }
    await expect(page.locator('button:has-text("Reveal Answer")')).toBeVisible();
}

// Drive the guided flow forward one actionable step (intro / reveal+grade /
// continue / continue-to-production) like the tracked spec does. Returns
// 'done' when the target predicate holds.
async function driveGuidedStep(page, { stopAt }) {
    let guard = 0;
    while (guard++ < 600) {
        if (await stopAt()) return 'done';
        const introBtn = page.locator('button:has-text("Got it — Continue")');
        const revealBtn = page.locator('button:has-text("Reveal Answer")');
        const contBtn = page.locator('button:has-text("Continue")').first();
        const prodBtn = page.locator('button:has-text("Continue to Production")');
        if (await introBtn.count()) {
            const prev = await page.locator('.guided-prompt-main').textContent();
            await introBtn.click();
            await waitForGuidedCardChange(page, prev);
        } else if (await revealBtn.count()) {
            await revealBtn.click();
            await page.locator('button:has-text("I knew it")').click();
        } else if (await prodBtn.count()) {
            await prodBtn.click();
        } else if (await contBtn.count()) {
            await contBtn.click();
            await expect(page.locator('.guided-prompt-main, .guided-milestone-title, .guided-complete-title').first()).toBeVisible();
        } else {
            break;
        }
    }
    return 'loop-exhausted';
}

async function driveToProduction(page) {
    const result = await driveGuidedStep(page, {
        stopAt: async () => {
            const label = page.locator('.guided-label');
            return (await label.count()) > 0 && (await label.textContent()) === 'Meaning (English)';
        }
    });
    expect(result).toBe('done');
    await expect(page.locator('.guided-label')).toHaveText('Meaning (English)');
}

function readGuidedState(page) {
    return page.evaluate(() => {
        const e = window.verbsEngine;
        const p = e.challengePresentation;
        return {
            verbId: p ? p.verbId : null,
            kind: p ? p.kind : null,
            revealed: e.challengeRevealed,
            phase: e.challengeSession ? e.challengeSession.phase : null
        };
    });
}

test.describe('SHARED-CARD-001 ordinary card reference — synthetic edge-case deck', () => {

    test('CHAR-01: ordinary card shell, front/back faces and below-card controls', async ({ page }) => {
        await prepareSyntheticPage(page);
        await openFlashcardsView(page);

        const card = page.locator('.verb-flashcard');
        await expect(card).toHaveAttribute('data-action', 'flip');
        await expect(card).not.toHaveClass(/flipped/);

        // Front face: German term placement per LF-CARD (de-to-en default)
        await expect(page.locator('.verb-card-front .verb-label')).toHaveText('Verb (German)');
        await expect(page.locator('.verb-card-front .verb-infinitive')).toHaveText('machen');
        await expect(page.locator('.verb-card-front .verb-tag-badge').first()).toHaveText('ref-base');

        // Front affordances: hint, speak, favorite (inactive star)
        await expect(page.locator('.verb-card-front [data-action="toggle-hint"]')).toBeVisible();
        await expect(page.locator('.verb-card-front [data-action="speak"]')).toBeVisible();
        await expect(page.locator('.verb-card-front [data-action="fav"]')).toHaveText('☆');
        await expect(page.locator('.verb-card-front [data-action="fav"]')).not.toHaveClass(/active/);

        // Back face exists in the DOM from the start (3D flip, not conditional render)
        await expect(page.locator('.verb-card-back')).toHaveCount(1);

        // Grade + navigation controls live OUTSIDE the flip card
        await expect(page.locator('.verb-card-controls .btn-learning')).toHaveText('❌ Still Learning');
        await expect(page.locator('.verb-card-controls .btn-known')).toHaveText('✅ Known');
        await expect(page.locator('.verb-card-nav [data-action="prev-card"]')).toBeDisabled();
        await expect(page.locator('.verb-card-nav [data-action="next-card"]')).toBeEnabled();
        await expect(page.locator('.verb-counter-text')).toHaveText('1 / 8');
    });

    test('CHAR-02: pointer click flips front to back and back to front', async ({ page }) => {
        await prepareSyntheticPage(page);
        await openFlashcardsView(page);

        await page.locator('.verb-flashcard .verb-center-content').click();
        await expect(page.locator('.verb-flashcard')).toHaveClass(/flipped/);
        // Back content boundaries (default de-to-en direction)
        await expect(page.locator('.verb-card-back .back-field').first()).toContainText('Infinitive:');
        await expect(page.locator('.verb-card-back')).toContainText('machen');
        await expect(page.locator('.verb-card-back')).toContainText('to make, to do');
        await expect(page.locator('.verb-card-back')).toContainText('Partizip II');
        await expect(page.locator('.verb-card-back')).toContainText('gemacht');

        // Flip-back: the flipped card disables pointer events on the FRONT
        // (.verb-flashcard.flipped .verb-card-front { pointer-events: none }),
        // so the back face is the click surface for flipping back.
        await page.locator('.verb-card-back .back-main-row').click();
        await expect(page.locator('.verb-flashcard')).not.toHaveClass(/flipped/);
        const state = await readCardState(page);
        expect(state.index).toBe(0);
        expect(state.flipped).toBe(false);
    });

    test('CHAR-03 (finding SC-02): default back shows ALL German examples and hides translations behind the EN chip', async ({ page }) => {
        await prepareSyntheticPage(page);
        await openFlashcardsView(page);
        await flipToBack(page);

        // Current behavior: every German example is inline, not only the first
        const sentences = page.locator('.back-example-box .ex-sentence-span');
        await expect(sentences).toHaveCount(3);
        await expect(sentences.nth(0)).toHaveText('Ich mache die Hausaufgaben.');
        await expect(sentences.nth(1)).toHaveText('Er macht das Fenster auf.');
        await expect(sentences.nth(2)).toHaveText('Wir haben Kuchen gemacht.');

        // Current behavior: the translations are rendered but NOT visible until
        // the extra EN chip click — LF-CARD wants them always visible (SC-02).
        const enLine = page.locator('.back-example-box .ex-en-line');
        await expect(enLine).toHaveClass(/hidden/);
        await expect(enLine).not.toBeVisible();
        await expect(page.locator('.back-example-box .ex-en-chip')).toBeVisible();

        await page.locator('.back-example-box .ex-en-chip').click();
        await expect(enLine).toBeVisible();
        await expect(enLine).toHaveText('(I do the homework. | He opens the window. | We made cake.)');

        // The chip click must not have flipped, graded, or advanced the card
        const state = await readCardState(page);
        expect(state.index).toBe(0);
        expect(state.flipped).toBe(true);
        expect(state.known).toEqual([]);
    });

    test('CHAR-04: single-example verb shows exactly that example and translation', async ({ page }) => {
        await prepareSyntheticPage(page);
        await openFlashcardsView(page);

        await page.locator('[data-action="next-card"]').click();
        await expect(page.locator('.verb-card-front .verb-infinitive')).toHaveText('sagen');
        await expect(page.locator('.verb-counter-text')).toHaveText('2 / 8');

        await flipToBack(page);
        const sentences = page.locator('.back-example-box .ex-sentence-span');
        await expect(sentences).toHaveCount(1);
        await expect(sentences.nth(0)).toHaveText('Sie sagt die Wahrheit.');

        await page.locator('.back-example-box .ex-en-chip').click();
        await expect(page.locator('.back-example-box .ex-en-line')).toHaveText('(She tells the truth.)');
    });

    test('CHAR-05: zero-example verb renders no example box, chip, or stale content (safe no-example state)', async ({ page }) => {
        await prepareSyntheticPage(page);
        await openFlashcardsView(page);

        // Advance to the third card (koppeln has no examples)
        await page.locator('[data-action="next-card"]').click();
        await page.locator('[data-action="next-card"]').click();
        await expect(page.locator('.verb-card-front .verb-infinitive')).toHaveText('koppeln');

        await flipToBack(page);
        await expect(page.locator('.verb-card-back .back-example-box')).toHaveCount(0);
        await expect(page.locator('.verb-card-back .ex-sentence-span')).toHaveCount(0);
        await expect(page.locator('.verb-card-back .ex-en-chip')).toHaveCount(0);
        // No stale text from the previous card's example may survive
        await expect(page.locator('.verb-card-back')).not.toContainText('Hausaufgaben');
        await expect(page.locator('.verb-card-back')).not.toContainText('Wahrheit');
        // The rest of the back still renders safely
        await expect(page.locator('.verb-card-back')).toContainText('koppeln');
        await expect(page.locator('.verb-card-back')).toContainText('to link, to couple');
        await expect(page.locator('.verb-card-back')).toContainText('gekoppelt');
    });

    test('CHAR-06: German-only example verb shows the example but no EN chip', async ({ page }) => {
        await prepareSyntheticPage(page);
        await openFlashcardsView(page);

        for (let i = 0; i < 3; i += 1) {
            await page.locator('[data-action="next-card"]').click();
        }
        await expect(page.locator('.verb-card-front .verb-infinitive')).toHaveText('grübeln');
        await flipToBack(page);

        const sentences = page.locator('.back-example-box .ex-sentence-span');
        await expect(sentences).toHaveCount(1);
        await expect(sentences.nth(0)).toHaveText('Ich grüble über die Frage.');
        await expect(page.locator('.ex-en-chip')).toHaveCount(0);
        await expect(page.locator('.back-example-box .ex-en-line')).toHaveCount(0);
    });

    test('CHAR-07: example-direction backs lead with the first example and its full translation', async ({ page }) => {
        await prepareSyntheticPage(page);
        await openFlashcardsView(page);
        await setDirectionMode(page, 'ex-de-to-all');

        // Front becomes the German example itself
        await expect(page.locator('.verb-card-front .verb-label')).toHaveText('German Example 💬');
        await expect(page.locator('.verb-card-front .verb-infinitive')).toHaveText('Ich mache die Hausaufgaben.');

        await flipToBack(page);
        await expect(page.locator('.back-example-priority-box')).toBeVisible();
        await expect(page.locator('.back-example-priority-box .ex-sentence-span').first())
            .toHaveText('Ich mache die Hausaufgaben.');
        await expect(page.locator('.back-example-priority-box')).toContainText('I do the homework.');
        // Additional examples stay collapsed behind the toggle
        await expect(page.locator('.extra-card-examples')).toHaveClass(/hidden/);
    });

    test('CHAR-08: zero-example verb in example direction states the absence explicitly', async ({ page }) => {
        await prepareSyntheticPage(page);
        await openFlashcardsView(page);
        await setDirectionMode(page, 'ex-de-to-all');

        for (let i = 0; i < 2; i += 1) {
            await page.locator('[data-action="next-card"]').click();
        }
        await expect(page.locator('.verb-card-front .verb-infinitive')).toHaveText('koppeln');
        await flipToBack(page);
        await expect(page.locator('.back-example-priority-box'))
            .toContainText('No example sentence available for this verb.');
        await expect(page.locator('.verb-card-back .ex-sentence-span')).toHaveCount(0);
    });

    test('CHAR-09 (finding SC-01): en-to-de front hides the German answer visually but keeps it in the DOM and speaks it', async ({ page }) => {
        await prepareSyntheticPage(page);
        await openFlashcardsView(page);
        await setDirectionMode(page, 'en-to-de');

        // Front boundary: English meaning only, no visible German answer
        await expect(page.locator('.verb-card-front .verb-label')).toHaveText('Meaning (English)');
        await expect(page.locator('.verb-card-front .verb-infinitive')).toHaveText('to make, to do');
        await expect(page.locator('.verb-card-front')).not.toContainText('machen');

        // Current behavior (SC-01a): the full German answer (and examples,
        // conjugations, participle) already sit in the pre-reveal DOM on the
        // rotated back face. LF-CARD / AC-06 forbid exactly this.
        const backText = await page.locator('.verb-card-back').textContent();
        expect(backText).toContain('machen');
        expect(backText).toContain('gemacht');

        // Current behavior (SC-01b): the hidden hint box carries a partial
        // German answer in the DOM ("Verb Infinitive: mac...")
        const hintText = await page.locator('.verb-hint-box').textContent();
        expect(hintText).toContain('mac...');

        // Current behavior (SC-01c): the FRONT speak button speaks the hidden
        // German infinitive through the German voice before reveal.
        await page.locator('.verb-card-front [data-action="speak"]').click();
        const calls = await page.evaluate(() => window.__ttsCalls);
        expect(calls).toHaveLength(1);
        expect(calls[0].text).toBe('machen');
        expect(calls[0].lang).toBe('de-DE');
        // And it did not flip or advance the card
        const state = await readCardState(page);
        expect(state.flipped).toBe(false);
        expect(state.index).toBe(0);
    });

    test('CHAR-10: front favorite toggles the star, persists, and does not flip, grade, or advance', async ({ page }) => {
        await prepareSyntheticPage(page);
        await openFlashcardsView(page);

        const frontFav = page.locator('.verb-card-front [data-action="fav"]');
        await frontFav.click();
        await expect(frontFav).toHaveText('⭐');
        await expect(frontFav).toHaveClass(/active/);

        // Current behavior: one favorite click stores the canonical id AND the
        // lowercase-infinitive legacy alias (see toggleFavorite).
        const state = await readCardState(page);
        expect(state.favorites).toEqual(['v_ref_machen', 'machen']);
        expect(state.flipped).toBe(false);
        expect(state.index).toBe(0);
        expect(state.known).toEqual([]);

        const persisted = await readPersistedState(page);
        expect(persisted.favorites).toEqual(['v_ref_machen', 'machen']);
        expect(persisted.known).toEqual([]);

        // Toggling off removes exactly the favorite, nothing else
        await frontFav.click();
        await expect(frontFav).toHaveText('☆');
        expect((await readCardState(page)).favorites).toEqual([]);
        expect((await readPersistedState(page)).favorites).toEqual([]);
    });

    test('CHAR-11: back favorite keeps the card revealed and changes only the favorite', async ({ page }) => {
        await prepareSyntheticPage(page);
        await openFlashcardsView(page);
        await flipToBack(page);

        const backFav = page.locator('.verb-card-back [data-action="fav"]');
        await backFav.click();
        await expect(backFav).toHaveText('⭐');

        const state = await readCardState(page);
        expect(state.flipped).toBe(true);
        expect(state.index).toBe(0);
        expect(state.known).toEqual([]);
        // Canonical id plus the lowercase-infinitive alias (current behavior)
        expect(state.favorites).toEqual(['v_ref_machen', 'machen']);
        // No speech side effect from a favorite click
        const calls = await page.evaluate(() => window.__ttsCalls);
        expect(calls).toHaveLength(0);
    });

    test('CHAR-12 (TARGET, AC-08): revealed-back controls never flip, grade, or advance the card', async ({ page }) => {
        await prepareSyntheticPage(page);
        await openFlashcardsView(page);
        await flipToBack(page);

        // Back speak control: real adapter utterance, no state side effects
        await page.locator('.verb-card-back [data-action="speak"]').click();
        let calls = await page.evaluate(() => window.__ttsCalls);
        expect(calls).toHaveLength(1);
        expect(calls[0].text).toBe('machen');
        expect(calls[0].lang).toBe('de-DE');

        // Example sentence click speaks exactly that sentence
        await page.locator('.back-example-box .ex-sentence-span').first().click();
        calls = await page.evaluate(() => window.__ttsCalls);
        expect(calls).toHaveLength(2);
        expect(calls[1].text).toBe('Ich mache die Hausaufgaben.');
        expect(calls[1].lang).toBe('de-DE');

        // Accordions expand content without moving the card
        await page.locator('[data-action="toggle-orig"]').click();
        await expect(page.locator('.origins-block')).toBeVisible();
        await page.locator('[data-action="toggle-conj"]').click();
        await expect(page.locator('.conjugation-tables-block')).toBeVisible();
        await expect(page.locator('.verb-card-back')).toContainText('werde machen');

        // EN chip toggle (also covered in CHAR-03) leaves state intact
        await page.locator('.back-example-box .ex-en-chip').click();
        await expect(page.locator('.back-example-box .ex-en-line')).toBeVisible();

        const state = await readCardState(page);
        expect(state.flipped).toBe(true);
        expect(state.index).toBe(0);
        expect(state.known).toEqual([]);
        expect(state.favorites).toEqual([]);
        await expect(page.locator('.verb-counter-text')).toHaveText('1 / 8');
        const persisted = await readPersistedState(page);
        expect(persisted.known).toEqual([]);
        expect(persisted.favorites).toEqual([]);
    });

    test('CHAR-13: grade controls are the only card actions that grade and advance (by design)', async ({ page }) => {
        await prepareSyntheticPage(page);
        await openFlashcardsView(page);
        await flipToBack(page);

        // "Still Learning" on card 1: no mastery recorded, card advances and re-hides
        await page.locator('.verb-card-controls .btn-learning').click();
        let state = await readCardState(page);
        expect(state.known).toEqual([]);
        expect(state.index).toBe(1);
        expect(state.flipped).toBe(false);
        await expect(page.locator('.verb-card-front .verb-infinitive')).toHaveText('sagen');

        // "Known" on card 2: mastery recorded, card advances
        await flipToBack(page);
        await page.locator('.verb-card-controls .btn-known').click();
        state = await readCardState(page);
        expect(state.known).toEqual(['v_ref_sagen']);
        expect(state.index).toBe(2);
        const persisted = await readPersistedState(page);
        expect(persisted.known).toEqual(['v_ref_sagen']);
    });

    test('CHAR-14 (finding SC-06): the flip card has no keyboard activation — Enter and Space do nothing', async ({ page }) => {
        await prepareSyntheticPage(page);
        await openFlashcardsView(page);

        // Current behavior: the flip surface is a plain div — no tabindex, no
        // role, not focusable, and no key handler anywhere in the controller.
        const cardFacts = await page.evaluate(() => {
            const card = document.querySelector('.verb-flashcard');
            card.focus();
            return {
                tabindex: card.getAttribute('tabindex'),
                role: card.getAttribute('role'),
                isactive: document.activeElement === card,
                keyHandlerOnBody: !!window.verbsEngine
            };
        });
        expect(cardFacts.tabindex).toBe(null);
        expect(cardFacts.role).toBe(null);
        expect(cardFacts.isactive).toBe(false);

        await page.keyboard.press('Enter');
        await expect(page.locator('.verb-flashcard')).not.toHaveClass(/flipped/);
        await page.keyboard.press(' ');
        await expect(page.locator('.verb-flashcard')).not.toHaveClass(/flipped/);
        await page.keyboard.press('Space');
        await expect(page.locator('.verb-flashcard')).not.toHaveClass(/flipped/);
        expect((await readCardState(page)).index).toBe(0);
    });

    test('CHAR-15 (finding SC-03): primary card targets measure below the 44x44 minimum', async ({ page }) => {
        await prepareSyntheticPage(page);
        await openFlashcardsView(page);

        const favBox = await page.locator('.verb-card-front [data-action="fav"]').boundingBox();
        const speakBox = await page.locator('.verb-card-front [data-action="speak"]').boundingBox();
        const hintBox = await page.locator('.verb-card-front [data-action="toggle-hint"]').boundingBox();
        const gradeBox = await page.locator('.verb-card-controls .btn-known').boundingBox();

        // Current behavior pinned exactly: favorite 28x28, speak ~27x27, hint
        // ~28 high — all under LF-CARD's 44x44; grade buttons are compliant.
        expect(favBox.width).toBe(28);
        expect(favBox.height).toBe(28);
        expect(speakBox.height).toBeLessThan(44);
        expect(hintBox.height).toBeLessThan(44);
        expect(gradeBox.height).toBeGreaterThanOrEqual(44);
        expect(gradeBox.width).toBeGreaterThanOrEqual(44);
    });

    test('CHAR-16 (finding SC-04): focused card controls show no visible focus outline', async ({ page }) => {
        await prepareSyntheticPage(page);
        await openFlashcardsView(page);
        await flipToBack(page);

        const outlines = await page.evaluate(() => {
            const selectors = [
                '.verb-card-front [data-action="toggle-hint"]',
                '.verb-card-front [data-action="speak"]',
                '.verb-card-back [data-action="speak"]',
                '.verb-card-controls .btn-known',
                '[data-action="toggle-conj"]',
                '[data-action="next-card"]'
            ];
            return selectors.map((sel) => {
                const el = document.querySelector(sel);
                el.focus();
                const style = window.getComputedStyle(el);
                return {
                    selector: sel,
                    focused: document.activeElement === el,
                    outlineStyle: style.outlineStyle,
                    outlineWidth: style.outlineWidth
                };
            });
        });

        for (const info of outlines) {
            expect(info.focused, `focus check failed for ${info.selector}`).toBe(true);
            // Current behavior: the global `button { outline: none }` reset has
            // no :focus-visible replacement for card controls, so the computed
            // outline-style stays 'none' — the width Chrome reports ('3px', its
            // computed 'medium') is never rendered without a style (SC-04).
            expect(info.outlineStyle, `outline-style for ${info.selector}`).toBe('none');
        }
    });

    test('CHAR-17 (finding SC-05): reduced-motion preference does not reduce the flip transition', async ({ page }) => {
        await prepareSyntheticPage(page);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await openFlashcardsView(page);

        const motionFacts = await page.evaluate(() => {
            const card = document.querySelector('.verb-flashcard');
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

        // Current behavior: full 0.6s flip animation regardless of the OS
        // reduced-motion setting; no prefers-reduced-motion rule exists (SC-05).
        expect(motionFacts.transitionProperty).toContain('transform');
        expect(motionFacts.transitionDuration).toBe('0.6s');
        expect(motionFacts.reducedMotionRules).toBe(0);

        await page.locator('.verb-flashcard .verb-center-content').click();
        await expect(page.locator('.verb-flashcard')).toHaveClass(/flipped/);
    });

    test('CHAR-18 (TARGET, AC-09): no horizontal overflow at the current viewport with a content-heavy back', async ({ page }) => {
        await prepareSyntheticPage(page);
        await openFlashcardsView(page);

        const frontOverflow = await page.evaluate(() => ({
            doc: document.documentElement.scrollWidth - window.innerWidth,
            area: (() => {
                const el = document.getElementById('content-area');
                return el.scrollWidth - el.clientWidth;
            })()
        }));
        expect(frontOverflow.doc).toBeLessThanOrEqual(1);
        expect(frontOverflow.area).toBeLessThanOrEqual(1);

        // Worst case: revealed back with every accordion open
        await flipToBack(page);
        await page.locator('[data-action="toggle-orig"]').click();
        await page.locator('[data-action="toggle-conj"]').click();

        const backOverflow = await page.evaluate(() => ({
            doc: document.documentElement.scrollWidth - window.innerWidth,
            area: (() => {
                const el = document.getElementById('content-area');
                return el.scrollWidth - el.clientWidth;
            })()
        }));
        expect(backOverflow.doc).toBeLessThanOrEqual(1);
        expect(backOverflow.area).toBeLessThanOrEqual(1);
    });

    test('CHAR-19 (TARGET): real modules boot with a clean console and a live engine export', async ({ page }) => {
        await prepareSyntheticPage(page);
        const errors = trackErrors(page);
        await openFlashcardsView(page);

        await page.waitForFunction(() => window.verbsEngine && window.verbsEngine.dataset !== null);
        const boot = await page.evaluate(() => ({
            totalVerbs: window.verbsEngine.dataset.totalVerbs,
            deckVerbs: window.verbsEngine.dataset.decks[0].verbs.length,
            exported: typeof window.verbsEngine.renderCard === 'function'
        }));
        expect(boot.totalVerbs).toBe(8);
        expect(boot.deckVerbs).toBe(8);
        expect(boot.exported).toBe(true);
        expect(errors).toEqual([]);
    });
});

test.describe('SHARED-CARD-001 ordinary card reference — real published dataset', () => {

    test('CHAR-20: real deck 1 renders the reference shell and first example set on the back', async ({ page }) => {
        await prepareRealPage(page);
        await openFlashcardsView(page);

        await expect(page.locator('.verb-card-front .verb-infinitive')).toHaveText('werden');
        await expect(page.locator('.verb-counter-text')).toHaveText('1 / 50');

        await flipToBack(page);
        await expect(page.locator('.verb-card-back')).toContainText('to become, to get, to turn');
        const sentences = page.locator('.back-example-box .ex-sentence-span');
        await expect(sentences).toHaveCount(3);
        await expect(sentences.nth(0)).toHaveText('Ich werde Lehrer.');
        await expect(page.locator('.back-example-box .ex-en-chip')).toBeVisible();
    });
});

test.describe('SHARED-CARD-001 guided card reference — synthetic deck', () => {

    test('CHAR-21 (finding SC-07): guided card is a separate shell, not the ordinary flashcard', async ({ page }) => {
        await prepareSyntheticPage(page);
        await startGuided(page);

        // Current behavior: the Guided Challenge renders its own .guided-card
        // implementation inside the guided root; GC-UI-001 targets the shared
        // ordinary shell (SC-07). The ordinary card may still exist in the
        // HIDDEN #view-flashcard container — it must not be visible or present
        // inside the guided root.
        await expect(page.locator('.guided-card')).toHaveCount(1);
        await expect(page.locator('#guided-challenge-root .verb-flashcard')).toHaveCount(0);
        await expect(page.locator('.verb-flashcard')).not.toBeVisible();
        await expect(page.locator('.guided-label')).toHaveText('New Word');

        // Intro card content boundaries: infinitive, meaning, first example pair
        await expect(page.locator('.guided-prompt-main')).toHaveText('machen');
        await expect(page.locator('.guided-prompt-sub')).toHaveText('to make, to do');
        await expect(page.locator('.guided-prompt-example')).toHaveText('💬 Ich mache die Hausaufgaben.');
        await expect(page.locator('.guided-example-en')).toHaveText('🔤 I do the homework.');

        // Guided controls are real buttons. Current behavior nuance: the INTRO
        // card carries its controls INSIDE .guided-card, while recall controls
        // render OUTSIDE the card (see renderChallengeRecall) — one more way
        // the guided shell diverges from the ordinary card layout (SC-07).
        const introBtn = page.locator('button:has-text("Got it — Continue")');
        await expect(introBtn).toBeVisible();
        const insideCard = await introBtn.evaluate((el) => !!el.closest('.guided-card'));
        expect(insideCard).toBe(true);
        await expect(page.locator('button:has-text("🔊 Listen")')).toBeVisible();
    });

    test('CHAR-22 (finding SC-07): guided reveal is a button action, and card-body clicks do nothing', async ({ page }) => {
        await prepareSyntheticPage(page);
        await startGuided(page);

        // Drive past every intro; the next presentation is an acquisition recall
        await clickIntrosCollecting(page);
        await expect(page.locator('button:has-text("Reveal Answer")')).toBeVisible();
        await expect(page.locator('.guided-label')).toHaveText('Verb (German)');

        // Current behavior: clicking the card body does NOT reveal (SC-07 —
        // GC-UI-002 targets the ordinary tap-to-flip interaction).
        await page.locator('.guided-prompt-main').click();
        await expect(page.locator('.guided-answer')).toHaveCount(0);
        const state = await readGuidedState(page);
        expect(state.revealed).toBe(false);

        // Contrast with the intro card: RECALL controls render OUTSIDE the card
        const revealOutside = await page.locator('button:has-text("Reveal Answer")')
            .evaluate((el) => !el.closest('.guided-card'));
        expect(revealOutside).toBe(true);

        // The dedicated button is the only reveal path
        await page.locator('button:has-text("Reveal Answer")').click();
        await expect(page.locator('.guided-answer')).toBeVisible();
        expect((await readGuidedState(page)).revealed).toBe(true);

        // Clicking the card body after reveal neither hides the answer nor grades
        await page.locator('.guided-prompt-main').click();
        await expect(page.locator('.guided-answer')).toBeVisible();
        const afterState = await readGuidedState(page);
        expect(afterState.revealed).toBe(true);
        expect(afterState.verbId).toBe(state.verbId);
    });

    test('CHAR-23 (TARGET, GC-UI-005 analog): German-front recall keeps the English answer out of the DOM until reveal', async ({ page }) => {
        await prepareSyntheticPage(page);
        await startGuided(page);
        await clickIntrosCollecting(page);

        const served = await page.evaluate(() => {
            const e = window.verbsEngine;
            const v = e._challengeVerb(e.challengePresentation.verbId);
            return { infinitive: v.infinitive, meaning: v.meaning };
        });

        await expect(page.locator('.guided-label')).toHaveText('Verb (German)');
        await expect(page.locator('.guided-prompt-main')).toHaveText(served.infinitive);

        // The answer is not in the card subtree before reveal
        await expect(page.locator('.guided-card')).not.toContainText(served.meaning);
        await expect(page.locator('.guided-answer')).toHaveCount(0);
        // German audio control is absent from the pre-reveal front
        await expect(page.locator('button:has-text("🔊 Listen")')).toHaveCount(0);

        await page.locator('button:has-text("Reveal Answer")').click();
        await expect(page.locator('.guided-answer-main')).toContainText(served.meaning);
        await expect(page.locator('button:has-text("🔊 Listen")')).toBeVisible();
    });

    test('CHAR-24 (TARGET, AC-06): production front leaks no German answer anywhere in the guided subtree', async ({ page }) => {
        await prepareSyntheticPage(page);
        await startGuided(page);
        // Stop at a production card whose verb HAS a German example, so the
        // pre-reveal sweep can prove both the infinitive and the example stay
        // out of the DOM (the zero-example verb would weaken the needle).
        const result = await driveGuidedStep(page, {
            stopAt: async () => {
                const info = await page.evaluate(() => {
                    const e = window.verbsEngine;
                    const p = e.challengePresentation;
                    if (!p || !p.verbId || e.challengeRevealed) return null;
                    const label = document.querySelector('.guided-label');
                    if (!label || label.textContent !== 'Meaning (English)') return null;
                    const v = e._challengeVerb(p.verbId);
                    return v && v.exampleDe && v.exampleDe.trim() ? v.id : null;
                });
                return info !== null;
            }
        });
        expect(result).toBe('done');
        await expect(page.locator('.guided-label')).toHaveText('Meaning (English)');

        const served = await page.evaluate(() => {
            const e = window.verbsEngine;
            const v = e._challengeVerb(e.challengePresentation.verbId);
            return { infinitive: v.infinitive, meaning: v.meaning, exampleDe: v.exampleDe.split(' | ')[0] };
        });

        await expect(page.locator('.guided-prompt-main')).toHaveText(served.meaning);

        // Entire-subtree negative sweep: no German infinitive, no German
        // example, no German audio control before reveal (GC-UI-005). Empty
        // needles are excluded so includes() cannot match trivially.
        const sweep = await page.evaluate((needle) => {
            const needles = [needle.infinitive, needle.exampleDe].filter((n) => typeof n === 'string' && n.length > 0);
            const root = document.getElementById('guided-challenge-root');
            const hits = [];
            for (const el of root.querySelectorAll('*')) {
                for (const n of needles) {
                    if ((el.textContent || '').includes(n)) hits.push(`text:${el.tagName}:${n}`);
                }
                for (const attr of el.attributes) {
                    for (const n of needles) {
                        if ((attr.value || '').includes(n)) hits.push(`attr:${el.tagName}:${attr.name}:${n}`);
                    }
                }
            }
            for (const n of needles) {
                if ((root.textContent || '').includes(n)) hits.push(`root-text:${n}`);
            }
            return hits;
        }, { infinitive: served.infinitive, exampleDe: served.exampleDe });
        expect(sweep).toEqual([]);

        await expect(page.locator('button:has-text("🔊 Listen")')).toHaveCount(0);

        // After reveal the German answer and example appear, and Listen unlocks
        await page.locator('button:has-text("Reveal Answer")').click();
        await expect(page.locator('.guided-answer-main')).toHaveText(served.infinitive);
        await expect(page.locator('.guided-example-en')).toHaveText(`💬 ${served.exampleDe}`);
        await expect(page.locator('button:has-text("🔊 Listen")')).toBeVisible();
    });

    test('CHAR-25 (TARGET, AC-08 analog): guided Listen speaks the served verb without grading or advancing', async ({ page }) => {
        await prepareSyntheticPage(page);
        await startGuided(page);
        await clickIntrosCollecting(page);
        await page.locator('button:has-text("Reveal Answer")').click();
        await expect(page.locator('button:has-text("🔊 Listen")')).toBeVisible();

        const before = await readGuidedState(page);
        await page.locator('button:has-text("🔊 Listen")').click();

        const calls = await page.evaluate(() => window.__ttsCalls);
        expect(calls).toHaveLength(1);
        const served = await page.evaluate(() => {
            const e = window.verbsEngine;
            return e._challengeVerb(e.challengePresentation.verbId).infinitive;
        });
        expect(calls[0].text).toBe(served);
        expect(calls[0].lang).toBe('de-DE');

        const after = await readGuidedState(page);
        expect(after.verbId).toBe(before.verbId);
        expect(after.revealed).toBe(true);
        expect(after.phase).toBe(before.phase);
    });

    test('CHAR-26: guided controls are keyboard-operable — Enter and Space each activate the reveal button', async ({ page }) => {
        await prepareSyntheticPage(page);
        await startGuided(page);
        await clickIntrosCollecting(page);

        // Enter activation on the focused reveal button
        const revealBtn = page.locator('button:has-text("Reveal Answer")');
        await revealBtn.focus();
        await expect(revealBtn).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(page.locator('.guided-answer')).toBeVisible();

        // Grade to move on, then Space activation on the NEXT recall card —
        // the scheduler may interleave intro cards, so drive until a reveal
        // button is on screen again.
        await page.locator('button:has-text("I knew it")').click();
        await driveUntilRevealCard(page);
        const nextReveal = page.locator('button:has-text("Reveal Answer")');
        await nextReveal.focus();
        await expect(nextReveal).toBeFocused();
        await page.keyboard.press(' ');
        await expect(page.locator('.guided-answer')).toBeVisible();
    });

    test('CHAR-27: guided intro example boundaries — every fixture verb is introduced with correct example presence', async ({ page }) => {
        await prepareSyntheticPage(page);
        await startGuided(page);

        // The published scheduler interleaves scored recalls (and non-scored
        // spacers) with the intro cards, so the drive handles every action
        // kind while collecting each intro as it appears.
        const intros = await driveAcquisitionCollectingIntros(page);
        expect(intros.length).toBe(8);

        const byPrompt = Object.fromEntries(intros.map((i) => [i.prompt, i]));

        // Multi-example verb: exactly the FIRST example pair on the intro card
        expect(byPrompt.machen.exampleDe).toBe('Ich mache die Hausaufgaben.');
        expect(byPrompt.machen.exampleEn).toBe('I do the homework.');

        // Single-example verb
        expect(byPrompt.sagen.exampleDe).toBe('Sie sagt die Wahrheit.');
        expect(byPrompt.sagen.exampleEn).toBe('She tells the truth.');

        // Zero-example verb: no example lines at all, no stale content
        expect(byPrompt.koppeln.exampleDe).toBe(null);
        expect(byPrompt.koppeln.exampleEn).toBe(null);

        // German-only example verb: German line present, English line absent
        expect(byPrompt.grübeln.exampleDe).toBe('Ich grüble über die Frage.');
        expect(byPrompt.grübeln.exampleEn).toBe(null);

        // Separable-prefix verb still renders its first example
        expect(byPrompt.aufwachen.exampleDe).toBe('Ich wache um sieben auf.');
        expect(byPrompt.aufwachen.exampleEn).toBe('I wake up at seven.');
    });

    test('CHAR-28 (TARGET, AC-09): guided view has no horizontal overflow at the current viewport', async ({ page }) => {
        await prepareSyntheticPage(page);
        await startGuided(page);
        await clickIntrosCollecting(page);
        await page.locator('button:has-text("Reveal Answer")').click();
        await page.locator('button:has-text("I knew it")').click();

        const overflow = await page.evaluate(() => ({
            doc: document.documentElement.scrollWidth - window.innerWidth,
            area: (() => {
                const el = document.getElementById('content-area');
                return el.scrollWidth - el.clientWidth;
            })()
        }));
        expect(overflow.doc).toBeLessThanOrEqual(1);
        expect(overflow.area).toBeLessThanOrEqual(1);
    });
});

test.describe('SHARED-CARD-001 reference vs approved LF/GC targets — expected failures (product findings)', () => {

    // Each test below asserts the APPROVED target and is declared test.fail():
    // it runs, fails against the published implementation, and thereby
    // demonstrates the named finding. If the target is ever met, Playwright
    // reports the unexpected pass as a failure, so the finding cannot
    // silently disappear without a conscious test update.

    test.fail('SC-01 TARGET: en-to-de card keeps the German answer out of the pre-reveal DOM and audio', async ({ page }) => {
        await prepareSyntheticPage(page);
        await openFlashcardsView(page);
        await setDirectionMode(page, 'en-to-de');

        await expect(page.locator('.verb-card-back')).not.toContainText('machen');
        await page.locator('.verb-card-front [data-action="speak"]').click();
        const calls = await page.evaluate(() => window.__ttsCalls);
        expect(calls.every((c) => !c.text.includes('machen'))).toBe(true);
    });

    test.fail('SC-02 TARGET: revealed back shows only the first example with its translation always visible', async ({ page }) => {
        await prepareSyntheticPage(page);
        await openFlashcardsView(page);
        await flipToBack(page);

        await expect(page.locator('.back-example-box .ex-sentence-span')).toHaveCount(1);
        await expect(page.locator('.back-example-box .ex-sentence-span').first()).toHaveText('Ich mache die Hausaufgaben.');
        await expect(page.locator('.back-example-box .ex-en-line')).toBeVisible();
        await expect(page.locator('.back-example-box .ex-en-line')).toContainText('I do the homework.');
    });

    test.fail('SC-03 TARGET: primary card touch targets are at least 44x44 CSS pixels', async ({ page }) => {
        await prepareSyntheticPage(page);
        await openFlashcardsView(page);

        const favBox = await page.locator('.verb-card-front [data-action="fav"]').boundingBox();
        const speakBox = await page.locator('.verb-card-front [data-action="speak"]').boundingBox();
        expect(favBox.height).toBeGreaterThanOrEqual(44);
        expect(favBox.width).toBeGreaterThanOrEqual(44);
        expect(speakBox.height).toBeGreaterThanOrEqual(44);
        expect(speakBox.width).toBeGreaterThanOrEqual(44);
    });

    test.fail('SC-04 TARGET: keyboard focus on card controls is visibly indicated', async ({ page }) => {
        await prepareSyntheticPage(page);
        await openFlashcardsView(page);

        const focusInfo = await page.evaluate(() => {
            const el = document.querySelector('.verb-card-front [data-action="speak"]');
            el.focus();
            const style = window.getComputedStyle(el);
            return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
        });
        // An outline is only rendered when outline-style is not 'none'; a
        // bare width without a style never paints (Chrome reports '3px', its
        // computed 'medium', even under `outline: none`).
        expect(focusInfo.outlineStyle).not.toBe('none');
    });

    test.fail('SC-05 TARGET: reduced-motion preference disables the flip animation', async ({ page }) => {
        await prepareSyntheticPage(page);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await openFlashcardsView(page);

        const duration = await page.evaluate(() => {
            const card = document.querySelector('.verb-flashcard');
            return window.getComputedStyle(card).transitionDuration;
        });
        expect(duration).toBe('0s');
    });

    test.fail('SC-06 TARGET: Enter and Space each flip the ordinary card (keyboard activation)', async ({ page }) => {
        await prepareSyntheticPage(page);
        await openFlashcardsView(page);

        await page.locator('.verb-flashcard').focus();
        await expect(page.locator('.verb-flashcard')).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(page.locator('.verb-flashcard')).toHaveClass(/flipped/);
        await page.keyboard.press('Enter');
        await expect(page.locator('.verb-flashcard')).not.toHaveClass(/flipped/);
        await page.keyboard.press(' ');
        await expect(page.locator('.verb-flashcard')).toHaveClass(/flipped/);
    });

    test.fail('SC-07 TARGET: guided card uses the ordinary card shell with tap-to-flip reveal (GC-UI-001/002)', async ({ page }) => {
        await prepareSyntheticPage(page);
        await startGuided(page);
        await clickIntrosCollecting(page);

        await expect(page.locator('#guided-challenge-root .verb-flashcard')).toHaveCount(1);
        await page.locator('.guided-prompt-main').click();
        await expect(page.locator('#guided-challenge-root .verb-flashcard')).toHaveClass(/flipped/);
        await expect(page.locator('.guided-answer')).toBeVisible();
    });
});
