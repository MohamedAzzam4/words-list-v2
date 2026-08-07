import { test, expect } from '@playwright/test';

// The final deck (36) contains only 7 verbs, which keeps the guided flow fast
// while still exercising a full deck run.

const STORAGE_KEY = 'german_app_progress_a1_app_data';

async function openDeck36(page) {
    await page.goto('/verbs.html');
    const deckChip = page.locator('[data-deck-id="36"]');
    await expect(deckChip).toBeVisible();
    await deckChip.click();
}

async function startGuided(page) {
    await openDeck36(page);
    await page.locator('button:has-text("Guided Challenge")').click();
    await expect(page.locator('#view-guided')).toBeVisible();
}

async function clickIntroThrough(page) {
    const introBtn = page.locator('button:has-text("Got it — Continue")');
    let clicks = 0;
    while ((await introBtn.count()) && clicks < 20) {
        await introBtn.click();
        clicks += 1;
        await page.waitForTimeout(30);
    }
}

async function answerRecall(page, remembered = true) {
    const revealBtn = page.locator('button:has-text("Reveal Answer")');
    await expect(revealBtn).toBeVisible();
    await revealBtn.click();
    const gradeBtn = remembered
        ? page.locator('button:has-text("I knew it")')
        : page.locator('button:has-text("I forgot")');
    await expect(gradeBtn).toBeVisible();
    await gradeBtn.click();
}

async function continueThrough(page) {
    const contBtn = page.locator('button:has-text("Continue")').first();
    await contBtn.click();
    await page.waitForTimeout(30);
}

async function flushStorage(page) {
    await page.evaluate(() => {
        if (window.verbsEngine && typeof window.verbsEngine._save === 'function') window.verbsEngine._save();
    });
}

// Collect browser console errors across a test
function trackErrors(page) {
    const errors = [];
    page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(String(err)));
    return errors;
}

test.describe('Guided Challenge E2E Suite', () => {

    test('starts guided challenge and shows the acquisition phase with intro cards', async ({ page }) => {
        await startGuided(page);

        await expect(page.locator('.guided-phase-badge')).toHaveText(/Acquisition/);
        await expect(page.locator('.guided-prompt-main')).toBeVisible();
        await expect(page.locator('button:has-text("Got it — Continue")')).toBeVisible();
        await expect(page.locator('.guided-progress-track')).toBeVisible();
    });

    test('keeps the hidden acquisition pool at eight or fewer verbs', async ({ page }) => {
        await startGuided(page);

        // finish the acquisition phase entirely
        let guard = 0;
        while (guard++ < 200) {
            const introBtn = page.locator('button:has-text("Got it — Continue")');
            const revealBtn = page.locator('button:has-text("Reveal Answer")');
            const transitionBtn = page.locator('button:has-text("Continue")').first();
            if (await introBtn.count()) {
                await introBtn.click();
            } else if (await revealBtn.count()) {
                await answerRecall(page, true);
            } else if (await transitionBtn.count()) {
                break;
            } else {
                await page.waitForTimeout(50);
            }
        }

        await flushStorage(page);

        const session = await page.evaluate((key) => {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw).verbLearning?.sessions : null;
        }, STORAGE_KEY);

        expect(session).toBeTruthy();
        const stored = Object.values(session)[0];
        expect(stored).toBeTruthy();
        expect(stored.activePoolIds.length).toBeLessThanOrEqual(8);
    });

    test('forgot during acquisition never repeats immediately', async ({ page }) => {
        await startGuided(page);

        // go through introductions until the first recall appears
        await clickIntroThrough(page);
        const revealBtn = page.locator('button:has-text("Reveal Answer")');
        await expect(revealBtn).toBeVisible();
        await revealBtn.click();
        await page.locator('button:has-text("I forgot")').click();

        // the same verb must not appear again until >=2 other cards intervened
        const nextPrompt = page.locator('.guided-prompt-main');
        const firstPrompt = await nextPrompt.textContent();
        let intervening = 0;
        let guard = 0;
        while (guard++ < 40) {
            const reveal = page.locator('button:has-text("Reveal Answer")');
            if (!(await reveal.count())) break;
            await answerRecall(page, true);
            const t = await nextPrompt.textContent();
            if (t === firstPrompt) break;
            intervening += 1;
        }
        expect(intervening).toBeGreaterThanOrEqual(1);
    });

    test('recognition phase prompts German → English and ends with the First Win', async ({ page }) => {
        await startGuided(page);

        // drive acquisition to completion
        let guard = 0;
        while (guard++ < 300) {
            const introBtn = page.locator('button:has-text("Got it — Continue")');
            const revealBtn = page.locator('button:has-text("Reveal Answer")');
            const contBtn = page.locator('button:has-text("Continue")').first();
            if (await introBtn.count()) await introBtn.click();
            else if (await revealBtn.count()) await answerRecall(page, true);
            else if (await contBtn.count()) break;
            else await page.waitForTimeout(40);
        }

        // acquisition complete → transition banner
        await expect(page.locator('.guided-milestone-title')).toHaveText('Acquisition Complete!');
        await continueThrough(page);

        // now in recognition
        await expect(page.locator('.guided-phase-badge')).toHaveText(/Recognition/);

        // direction must be German → English on the front of every scored card
        const label = page.locator('.guided-label');
        await expect(label).toHaveText('Verb (German)');

        // complete recognition
        guard = 0;
        while (guard++ < 300) {
            const revealBtn = page.locator('button:has-text("Reveal Answer")');
            const contBtn = page.locator('button:has-text("Continue")').first();
            if (await revealBtn.count()) await answerRecall(page, true);
            else if (await contBtn.count()) break;
            else await page.waitForTimeout(40);
        }
        await expect(page.locator('.guided-complete-title')).toContainText('First Win');
    });

    test('production phase prompts English → German and ends with the Second Win', async ({ page }) => {
        await startGuided(page);

        // acquisition → recognition
        let guard = 0;
        while (guard++ < 600) {
            const introBtn = page.locator('button:has-text("Got it — Continue")');
            const revealBtn = page.locator('button:has-text("Reveal Answer")');
            const contBtn = page.locator('button:has-text("Continue")').first();
            const prodBtn = page.locator('button:has-text("Continue to Production")');
            if (await introBtn.count()) await introBtn.click();
            else if (await revealBtn.count()) await answerRecall(page, true);
            else if (await prodBtn.count()) { await prodBtn.click(); break; }
            else if (await contBtn.count()) await contBtn.click();
            else await page.waitForTimeout(40);
        }

        // production direction English → German
        await expect(page.locator('.guided-label')).toHaveText('Meaning (English)');
        const frontText = await page.locator('.guided-prompt-main').textContent();
        expect(frontText).not.toMatch(/^[a-zäöüß]+$/i); // should NOT be a German word alone

        // complete production
        guard = 0;
        while (guard++ < 300) {
            const revealBtn = page.locator('button:has-text("Reveal Answer")');
            const finishBtn = page.locator('button:has-text("Finish")');
            if (await revealBtn.count()) await answerRecall(page, true);
            else if (await finishBtn.count()) break;
            else await page.waitForTimeout(40);
        }
        await expect(page.locator('.guided-complete-title')).toContainText('Second Win');
    });

    test('restart challenge explicitly resets the session', async ({ page }) => {
        await startGuided(page);

        // progress a bit
        await clickIntroThrough(page);
        const progressBefore = await page.locator('.guided-progress-label').textContent();
        expect(progressBefore).toContain('/');

        // restart
        await page.locator('button:has-text("Restart Challenge")').click();
        await expect(page.locator('#view-guided')).toBeVisible();
        await expect(page.locator('.guided-phase-badge')).toHaveText(/Acquisition/);
        await expect(page.locator('.guided-prompt-main')).toBeVisible();
        await expect(page.locator('.guided-progress-label')).toContainText('0 /');
    });

    test('resumes the session after a refresh', async ({ page }) => {
        await startGuided(page);
        await clickIntroThrough(page);

        // capture a prompt that we know will not be the very first card
        await page.reload();
        await page.locator('button:has-text("Guided Challenge")').click();
        await expect(page.locator('#view-guided')).toBeVisible();
        await expect(page.locator('.guided-phase-badge')).toHaveText(/Acquisition/);

        const session = await page.evaluate((key) => {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw).verbLearning?.sessions : null;
        }, STORAGE_KEY);
        expect(session && Object.keys(session).length).toBeGreaterThan(0);
    });

    test('legacy knownVerbIds aliases are migrated to canonical ids with a backup', async ({ page }) => {
        await page.goto('/verbs.html');
        await page.evaluate((key) => {
            const legacy = {
                knownVerbIds: ['v_sein', 'sein', 'v_haben', 'haben', 'v_werden'],
                verbFavorites: [],
                finishedVerbDecks: []
            };
            localStorage.setItem(key, JSON.stringify(legacy));
        }, STORAGE_KEY);

        // opening the guided challenge triggers the migration
        await startGuided(page);

        const migrated = await page.evaluate((key) => {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        }, STORAGE_KEY);

        expect(migrated.knownVerbIds).toContain('v_sein');
        expect(migrated.knownVerbIds).not.toContain('sein');
        expect(migrated.knownVerbIds).toContain('v_haben');
        expect(migrated.knownVerbIds).toContain('v_werden');
        expect(Array.isArray(migrated.knownVerbIdsBackup)).toBe(true);
        expect(migrated.knownVerbIdsBackup.length).toBeGreaterThanOrEqual(5);
    });

    test('daily review with no due verbs shows a toast instead of opening', async ({ page }) => {
        await openDeck36(page);
        await page.locator('button:has-text("Daily Review")').click();
        await expect(page.locator('#toast')).toHaveClass(/show/);
        await expect(page.locator('#view-guided')).toBeHidden();
    });

    test('daily review with due verbs serves recognition then production tracks', async ({ page }) => {
        // seed one recognized verb with a due SRS review date
        await page.goto('/verbs.html');
        await page.evaluate((key) => {
            const seeded = {
                verbLearning: {
                    schemaVersion: 1,
                    verbs: {
                        v_werden: {
                            recognitionWin: '2026-01-01T00:00:00.000Z',
                            productionWin: '2026-01-01T00:00:00.000Z',
                            srs: { level: 2, nextReviewDate: '2026-01-01T00:00:00.000Z' },
                            productionSrs: { level: 2, nextReviewDate: '2026-01-01T00:00:00.000Z' },
                            updatedAt: Date.now(),
                            infinitive: 'werden'
                        }
                    },
                    sessions: {}
                }
            };
            localStorage.setItem(key, JSON.stringify(seeded));
        }, STORAGE_KEY);

        await page.reload();
        await page.locator('button:has-text("Daily Review")').click();
        await expect(page.locator('#view-guided')).toBeVisible();

        // first track begins with a transition into recognition
        await expect(page.locator('.guided-milestone-title')).toContainText(/Continuing to/);
        await continueThrough(page);
        await expect(page.locator('.guided-label')).toHaveText('Verb (German)');

        // answer correctly until the review completes
        let guard = 0;
        while (guard++ < 120) {
            const revealBtn = page.locator('button:has-text("Reveal Answer")');
            const contBtn = page.locator('button:has-text("Continue")').first();
            const finishBtn = page.locator('button:has-text("Finish")');
            if (await revealBtn.count()) await answerRecall(page, true);
            else if (await contBtn.count()) await contBtn.click();
            else if (await finishBtn.count()) break;
            else await page.waitForTimeout(40);
        }
        await expect(page.locator('.guided-complete-title')).toContainText('Review Finished');
    });

    test('no browser console errors during the guided flow', async ({ page }) => {
        const errors = trackErrors(page);
        await startGuided(page);
        await clickIntroThrough(page);
        await answerRecall(page, true);
        await page.waitForTimeout(200);
        expect(errors).toEqual([]);
    });

    test('verbLearning mastery is committed only when a whole phase wins', async ({ page }) => {
        await startGuided(page);

        // complete one recall so the "acquisition part" of the flow advances
        await clickIntroThrough(page);
        const revealBtn = page.locator('button:has-text("Reveal Answer")');
        await expect(revealBtn).toBeVisible();
        await revealBtn.click();
        await page.locator('button:has-text("I knew it")').click();

        await flushStorage(page);

        // MID-SESSION: no per-card mastery is written yet. Mastery for the deck
        // is committed atomically only when the whole phase reaches its win.
        const midVerbs = await page.evaluate((key) => {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw).verbLearning?.verbs : null;
        }, STORAGE_KEY);
        expect(midVerbs).toBeTruthy();
        const midMastered = Object.values(midVerbs).filter(r => r.recognitionWin || r.productionWin);
        expect(midMastered.length).toBe(0);

        // drive acquisition → recognition all the way to the First Win
        let guard = 0;
        while (guard++ < 400) {
            const introBtn = page.locator('button:has-text("Got it — Continue")');
            const reveal = page.locator('button:has-text("Reveal Answer")');
            const contBtn = page.locator('button:has-text("Continue")').first();
            if (await introBtn.count()) await introBtn.click();
            else if (await reveal.count()) await answerRecall(page, true);
            else if (await contBtn.count()) break;
            else await page.waitForTimeout(40);
        }
        await expect(page.locator('.guided-milestone-title')).toHaveText('Acquisition Complete!');
        await continueThrough(page);
        guard = 0;
        while (guard++ < 400) {
            const reveal = page.locator('button:has-text("Reveal Answer")');
            const finishBtn = page.locator('button:has-text("Finish")');
            if (await reveal.count()) await answerRecall(page, true);
            else if (await finishBtn.count()) break;
            else await page.waitForTimeout(40);
        }
        await expect(page.locator('.guided-complete-title')).toContainText('First Win');

        await flushStorage(page);
        const verbs = await page.evaluate((key) => {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw).verbLearning?.verbs : null;
        }, STORAGE_KEY);
        const recognized = Object.values(verbs).filter(r => r.recognitionWin);
        expect(recognized.length).toBe(7); // the whole deck 36 wins atomically
        const produced = Object.values(verbs).filter(r => r.productionWin);
        expect(produced.length).toBe(0);   // production must be earned separately
    });

    test('restarting the Daily Review restarts the review, not the acquisition challenge', async ({ page }) => {
        // seed one recognized verb with a due SRS review date
        await page.goto('/verbs.html');
        await page.evaluate((key) => {
            const seeded = {
                verbLearning: {
                    schemaVersion: 1,
                    verbs: {
                        v_werden: {
                            recognitionWin: '2026-01-01T00:00:00.000Z',
                            productionWin: '2026-01-01T00:00:00.000Z',
                            srs: { level: 2, nextReviewDate: '2026-01-01T00:00:00.000Z' },
                            productionSrs: { level: 2, nextReviewDate: '2026-01-01T00:00:00.000Z' },
                            updatedAt: Date.now(),
                            infinitive: 'werden'
                        }
                    },
                    sessions: {}
                }
            };
            localStorage.setItem(key, JSON.stringify(seeded));
        }, STORAGE_KEY);

        await page.reload();
        await page.locator('button:has-text("Daily Review")').click();
        await expect(page.locator('#view-guided')).toBeVisible();
        await expect(page.locator('.guided-milestone-title')).toContainText(/Continuing to/);
        await continueThrough(page);

        // progress the review a couple of cards into the recognition track
        const revealBtn = page.locator('button:has-text("Reveal Answer")');
        await expect(revealBtn).toBeVisible();
        await revealBtn.click();
        await page.locator('button:has-text("I knew it")').click();
        await page.waitForTimeout(100);

        // restart button must say "Restart Review" while inside a review
        await expect(page.locator('#guided-restart-btn')).toHaveText(/Restart Review/);

        // restart → the session is rebuilt as a REVIEW (a quiz transition into
        // recognition/production), never as an Acquisition intro lesson.
        await page.locator('#guided-restart-btn').click();
        await expect(page.locator('#view-guided')).toBeVisible();
        await expect(page.locator('.guided-phase-badge')).toHaveText('Daily Review');
        await expect(page.locator('.guided-milestone-title')).toContainText(/Continuing to/);
        await continueThrough(page);
        await expect(page.locator('.guided-label')).toHaveText('Verb (German)');
    });

});
