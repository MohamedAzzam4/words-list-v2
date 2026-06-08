/**
 * Comprehensive E2E Test Runner for German-Words-List2
 * Uses file:// URLs and window.app methods directly
 */

const { chromium } = require('playwright');
const fs = require('fs');

const BASE_URL = 'file:///home/z/my-project/a1.html';
const LS_KEY = 'german_app_progress_german-a1-app';
const AUTH_EMAIL = 'audit@example.com';
const AUTH_PASSWORD = '123456';

const results = {};
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getLSData(page) {
    return await page.evaluate((key) => {
        const d = localStorage.getItem(key);
        return d ? JSON.parse(d) : null;
    }, LS_KEY);
}

async function setLSData(page, data) {
    await page.evaluate((args) => {
        localStorage.setItem(args.key, JSON.stringify(args.data));
    }, { key: LS_KEY, data });
}

async function runTests() {
    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files', '--allow-file-access']
    });
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();

    try {
        // =====================================================
        // TEST: QUIZ-001 — Quiz Score Reset On Unit Switch
        // =====================================================
        console.log('\n=== QUIZ-001 ===');
        try {
            await page.goto(BASE_URL, { waitUntil: 'load', timeout: 30000 });
            await sleep(4000);

            // Go to quiz view and answer one question
            await page.evaluate(() => window.app.switchView('article-quiz'));
            await sleep(1000);

            const quizBtns = await page.$$('.quiz-btn');
            if (quizBtns.length >= 1) {
                await quizBtns[0].click();
                await sleep(2000);
            }

            const scoreBefore = await page.$eval('#quiz-score', el => el.textContent).catch(() => 'N/A');
            
            // Switch unit
            await page.evaluate(() => window.app.switchUnit(1));
            await sleep(1500);

            const scoreAfter = await page.$eval('#quiz-score', el => el.textContent).catch(() => 'N/A');
            const isReset = scoreAfter.includes('0 / 0');
            results['QUIZ-001'] = { passed: isReset, detail: `Before: "${scoreBefore}", After: "${scoreAfter}"` };
        } catch (e) {
            results['QUIZ-001'] = { passed: false, detail: e.message.slice(0, 200) };
        }
        console.log('  Result:', JSON.stringify(results['QUIZ-001']));

        // =====================================================
        // TEST: SESS-001 — Session Counter Reset On New Day
        // =====================================================
        console.log('\n=== SESS-001 ===');
        try {
            // Set lastSessionDate to yesterday
            const data = await getLSData(page);
            if (data) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                data.lastSessionDate = yesterday.toISOString().split('T')[0];
                data.sessionKnown = 25;
                data.sessionFlashcardErrors = 10;
                data.sessionWordsReviewed = 50;
                await setLSData(page, data);
            }

            await page.reload({ waitUntil: 'load', timeout: 30000 });
            await sleep(4000);

            const afterReset = await getLSData(page);
            const today = new Date().toISOString().split('T')[0];
            const countersReset = afterReset.sessionKnown === 0 &&
                                  afterReset.sessionFlashcardErrors === 0 &&
                                  afterReset.sessionWordsReviewed === 0;
            const dateUpdated = afterReset.lastSessionDate === today;
            results['SESS-001'] = { passed: countersReset && dateUpdated, detail: `sessionKnown=${afterReset.sessionKnown}, sessionFlashcardErrors=${afterReset.sessionFlashcardErrors}, sessionWordsReviewed=${afterReset.sessionWordsReviewed}, lastSessionDate=${afterReset.lastSessionDate}` };
        } catch (e) {
            results['SESS-001'] = { passed: false, detail: e.message.slice(0, 200) };
        }
        console.log('  Result:', JSON.stringify(results['SESS-001']));

        // =====================================================
        // TEST: PROG-001 — Mark Word as Known
        // =====================================================
        console.log('\n=== PROG-001 ===');
        try {
            // Reset
            let data = await getLSData(page);
            data.known = [];
            data.trophyCounts = {};
            await setLSData(page, data);

            await page.reload({ waitUntil: 'load', timeout: 30000 });
            await sleep(4000);

            const initialKnown = (await getLSData(page))?.known?.length || 0;

            // Switch to flashcard and mark one
            await page.evaluate(() => window.app.switchView('flashcard'));
            await sleep(800);
            await page.evaluate(() => window.app.markCard(true));
            await sleep(2000);

            const afterMark = (await getLSData(page))?.known?.length || 0;
            const statKnown = await page.$eval('#stat-known', el => el.textContent).catch(() => 'N/A');
            
            results['PROG-001'] = { passed: afterMark > initialKnown, detail: `Initial: ${initialKnown}, After: ${afterMark}, Stats: ${statKnown}` };
        } catch (e) {
            results['PROG-001'] = { passed: false, detail: e.message.slice(0, 200) };
        }
        console.log('  Result:', JSON.stringify(results['PROG-001']));

        // =====================================================
        // TEST: PROG-003 — Progress Persists to localStorage
        // =====================================================
        console.log('\n=== PROG-003 ===');
        try {
            // Mark 3 more
            for (let i = 0; i < 3; i++) {
                await page.evaluate(() => window.app.markCard(true));
                await sleep(1500);
            }

            const lsData = await getLSData(page);
            const passed = lsData && lsData.known?.length >= 4 && lsData.lastUpdated;
            results['PROG-003'] = { passed: !!passed, detail: `Known: ${lsData?.known?.length}, lastUpdated: ${!!lsData?.lastUpdated}` };
        } catch (e) {
            results['PROG-003'] = { passed: false, detail: e.message.slice(0, 200) };
        }
        console.log('  Result:', JSON.stringify(results['PROG-003']));

        // =====================================================
        // TEST: PROG-005 — Progress Survives Page Refresh
        // =====================================================
        console.log('\n=== PROG-005 ===');
        try {
            const knownBefore = (await getLSData(page))?.known?.length || 0;
            await page.reload({ waitUntil: 'load', timeout: 30000 });
            await sleep(4000);

            const knownAfter = (await getLSData(page))?.known?.length || 0;
            const statKnown = await page.$eval('#stat-known', el => el.textContent).catch(() => 'N/A');
            
            results['PROG-005'] = { passed: knownAfter >= knownBefore, detail: `Before: ${knownBefore}, After: ${knownAfter}, Stats: ${statKnown}` };
        } catch (e) {
            results['PROG-005'] = { passed: false, detail: e.message.slice(0, 200) };
        }
        console.log('  Result:', JSON.stringify(results['PROG-005']));

        // =====================================================
        // TEST: AUTH-005 — Logout Flow (preserves localStorage)
        // =====================================================
        console.log('\n=== AUTH-005 ===');
        try {
            // Login
            const loginBtn = await page.$('#login-email-btn');
            if (loginBtn) {
                await loginBtn.click();
                await sleep(1000);
                await page.fill('#auth-email', AUTH_EMAIL);
                await page.fill('#auth-password', AUTH_PASSWORD);
                await page.click('#auth-submit-btn');
                await sleep(5000);
            }

            const syncBefore = await page.$eval('#sync-status', el => el.textContent).catch(() => 'N/A');
            const knownBeforeLogout = (await getLSData(page))?.known?.length || 0;
            console.log('  Before logout - sync:', syncBefore, 'known:', knownBeforeLogout);

            // Logout
            await page.evaluate(() => window.app.logout());
            await sleep(5000);

            const syncAfter = await page.$eval('#sync-status', el => el.textContent).catch(() => 'N/A');
            const lsAfterLogout = await getLSData(page);
            const knownAfterLogout = lsAfterLogout?.known?.length ?? -1;

            console.log('  After logout - sync:', syncAfter, 'known:', knownAfterLogout);

            const preserved = knownAfterLogout >= 0; // localStorage not cleared
            const localMode = syncAfter.includes('Local');
            results['AUTH-005'] = { passed: preserved && localMode, detail: `Preserved: ${preserved}, LocalMode: ${localMode}, known before: ${knownBeforeLogout}, known after: ${knownAfterLogout}` };
        } catch (e) {
            results['AUTH-005'] = { passed: false, detail: e.message.slice(0, 300) };
        }
        console.log('  Result:', JSON.stringify(results['AUTH-005']));

        // =====================================================
        // TEST: AUTH-006 — Re-Login After Logout
        // =====================================================
        console.log('\n=== AUTH-006 ===');
        try {
            const loginBtn = await page.$('#login-email-btn');
            if (loginBtn) {
                await loginBtn.click();
                await sleep(1000);
                await page.fill('#auth-email', AUTH_EMAIL);
                await page.fill('#auth-password', AUTH_PASSWORD);
                await page.click('#auth-submit-btn');
                await sleep(5000);
            }

            const syncAfter = await page.$eval('#sync-status', el => el.textContent).catch(() => 'N/A');
            const dataAfter = await getLSData(page);
            console.log('  After re-login - sync:', syncAfter, 'known:', dataAfter?.known?.length);

            const cloudSync = syncAfter.includes('Cloud');
            const hasData = dataAfter !== null;
            results['AUTH-006'] = { passed: cloudSync && hasData, detail: `Cloud: ${cloudSync}, hasData: ${hasData}, known: ${dataAfter?.known?.length}` };
        } catch (e) {
            results['AUTH-006'] = { passed: false, detail: e.message.slice(0, 300) };
        }
        console.log('  Result:', JSON.stringify(results['AUTH-006']));

        // =====================================================
        // TEST: PROG-006 — Progress Merge
        // =====================================================
        console.log('\n=== PROG-006 ===');
        try {
            const data = await getLSData(page);
            const sync = await page.$eval('#sync-status', el => el.textContent).catch(() => 'N/A');
            console.log('  Sync:', sync, 'known:', data?.known?.length, 'trophies:', Object.keys(data?.trophyCounts || {}).length);

            results['PROG-006'] = { passed: data !== null && data.known !== undefined, detail: `Data exists: ${!!data}, known: ${data?.known?.length}` };
        } catch (e) {
            results['PROG-006'] = { passed: false, detail: e.message.slice(0, 200) };
        }
        console.log('  Result:', JSON.stringify(results['PROG-006']));

        // =====================================================
        // TEST: TROPHY-001 — evaluate() Called After markCard()
        // =====================================================
        console.log('\n=== TROPHY-001 ===');
        try {
            // Reset: clear known and trophies, then mark 9 cards, check no trophy, mark 1 more, check trophy
            let data = await getLSData(page);
            data.known = [];
            data.trophyCounts = {};
            await setLSData(page, data);

            await page.reload({ waitUntil: 'load', timeout: 30000 });
            await sleep(4000);

            await page.evaluate(() => window.app.switchView('flashcard'));
            await sleep(800);

            // Mark 9 cards
            for (let i = 0; i < 9; i++) {
                await page.evaluate(() => window.app.markCard(true));
                await sleep(500);
            }

            let after9 = await getLSData(page);
            console.log('  After 9 marks - known:', after9.known?.length, 'trophies:', JSON.stringify(after9.trophyCounts));

            // Mark the 10th card
            await page.evaluate(() => window.app.markCard(true));
            await sleep(2000);

            let after10 = await getLSData(page);
            console.log('  After 10 marks - known:', after10.known?.length, 'trophies:', JSON.stringify(after10.trophyCounts));

            const earned = after10.trophyCounts?.first_steps >= 1;
            results['TROPHY-001'] = { passed: earned, detail: `first_steps=${after10.trophyCounts?.first_steps || 0}, known=${after10.known?.length}` };
        } catch (e) {
            results['TROPHY-001'] = { passed: false, detail: e.message.slice(0, 400) };
        }
        console.log('  Result:', JSON.stringify(results['TROPHY-001']));

        // =====================================================
        // TEST: TROPHY-002 — evaluate() Uses ALL Vocabulary Words
        // =====================================================
        console.log('\n=== TROPHY-002 ===');
        try {
            // Keep 9 known, reset trophies, switch to Unit 2, mark 1 more
            let data = await getLSData(page);
            data.known = data.known?.slice(0, 9) || [];
            data.trophyCounts = {};
            await setLSData(page, data);

            await page.reload({ waitUntil: 'load', timeout: 30000 });
            await sleep(4000);

            // Switch to Unit 2
            await page.evaluate(() => window.app.switchUnit(1));
            await sleep(1000);

            // Go to flashcards in Unit 2
            await page.evaluate(() => window.app.switchView('flashcard'));
            await sleep(800);

            // Mark one more (10th overall, but in Unit 2)
            await page.evaluate(() => window.app.markCard(true));
            await sleep(2000);

            let afterData = await getLSData(page);
            console.log('  Known:', afterData.known?.length, 'Trophies:', JSON.stringify(afterData.trophyCounts));

            const earned = afterData.trophyCounts?.first_steps >= 1;
            results['TROPHY-002'] = { passed: earned, detail: `first_steps earned with ${afterData.known?.length} total words (cross-unit): ${earned}` };
        } catch (e) {
            results['TROPHY-002'] = { passed: false, detail: e.message.slice(0, 400) };
        }
        console.log('  Result:', JSON.stringify(results['TROPHY-002']));

        // =====================================================
        // TEST: TROPHY-003 — evaluate() Triggers _save()
        // =====================================================
        console.log('\n=== TROPHY-003 ===');
        try {
            // Set 9 known, no trophies
            let data = await getLSData(page);
            data.known = data.known?.slice(0, 9) || [];
            data.trophyCounts = {};
            await setLSData(page, data);

            await page.reload({ waitUntil: 'load', timeout: 30000 });
            await sleep(4000);

            await page.evaluate(() => window.app.switchView('flashcard'));
            await sleep(800);

            // Mark 10th word to trigger trophy
            await page.evaluate(() => window.app.markCard(true));
            await sleep(2000);

            const beforeReload = await getLSData(page);
            console.log('  Trophies before reload:', JSON.stringify(beforeReload.trophyCounts));

            // Reload
            await page.reload({ waitUntil: 'load', timeout: 30000 });
            await sleep(4000);

            const afterReload = await getLSData(page);
            console.log('  Trophies after reload:', JSON.stringify(afterReload.trophyCounts));

            const persists = afterReload.trophyCounts?.first_steps >= 1;
            results['TROPHY-003'] = { passed: persists, detail: `Before: ${JSON.stringify(beforeReload.trophyCounts)}, After: ${JSON.stringify(afterReload.trophyCounts)}` };
        } catch (e) {
            results['TROPHY-003'] = { passed: false, detail: e.message.slice(0, 400) };
        }
        console.log('  Result:', JSON.stringify(results['TROPHY-003']));

        // =====================================================
        // MANDATORY SMOKE TEST (7 steps)
        // =====================================================
        console.log('\n=== MANDATORY SMOKE TEST ===');
        const smokeResults = [];

        try {
            // Step 1: Page loads without JS errors
            console.log('  Step 1: No JS errors');
            const jsErrors = [];
            const errorHandler = err => jsErrors.push(err.message);
            page.on('pageerror', errorHandler);
            await page.goto(BASE_URL, { waitUntil: 'load', timeout: 30000 });
            await sleep(4000);
            page.off('pageerror', errorHandler);
            smokeResults.push({ step: 1, name: 'No JS errors', passed: jsErrors.length === 0, detail: `${jsErrors.length} errors` });
            console.log('    ', jsErrors.length === 0 ? 'PASS' : 'FAIL');

            // Step 2: All 4 main views render
            console.log('  Step 2: Views render');
            const views = ['glossary', 'flashcard', 'dashboard', 'trophies'];
            const viewResults = [];
            for (const v of views) {
                await page.evaluate((view) => window.app.switchView(view), v);
                await sleep(500);
                const el = await page.$(`#view-${v}`);
                const visible = el ? !(await el.getAttribute('class') || '').includes('hidden') : false;
                viewResults.push({ view: v, visible });
            }
            const step2 = viewResults.every(r => r.visible);
            smokeResults.push({ step: 2, name: 'Views render', passed: step2, detail: JSON.stringify(viewResults) });
            console.log('    ', step2 ? 'PASS' : 'FAIL');

            // Step 3: Unit switching
            console.log('  Step 3: Unit switching');
            await page.evaluate(() => window.app.switchUnit(1));
            await sleep(1000);
            const title = await page.$eval('#glossary-title', el => el.textContent).catch(() => '');
            const step3 = title.includes('2') || title.includes('Modul');
            smokeResults.push({ step: 3, name: 'Unit switching', passed: step3, detail: `Title: "${title}"` });
            console.log('    ', step3 ? 'PASS' : 'FAIL');

            await page.evaluate(() => window.app.switchUnit(0));
            await sleep(500);

            // Step 4: Flashcard mark known
            console.log('  Step 4: Flashcard mark known');
            await page.evaluate(() => window.app.switchView('flashcard'));
            await sleep(500);
            const knownBefore = (await getLSData(page))?.known?.length || 0;
            await page.evaluate(() => window.app.markCard(true));
            await sleep(1500);
            const knownAfter = (await getLSData(page))?.known?.length || 0;
            const step4 = knownAfter > knownBefore;
            smokeResults.push({ step: 4, name: 'Flashcard mark known', passed: step4, detail: `Before: ${knownBefore}, After: ${knownAfter}` });
            console.log('    ', step4 ? 'PASS' : 'FAIL');

            // Step 5: localStorage writes
            console.log('  Step 5: localStorage writes');
            const lsData = await getLSData(page);
            const step5 = lsData && !!lsData.lastUpdated;
            smokeResults.push({ step: 5, name: 'localStorage writes', passed: step5, detail: `lastUpdated: ${!!lsData?.lastUpdated}` });
            console.log('    ', step5 ? 'PASS' : 'FAIL');

            // Step 6: Auth UI
            console.log('  Step 6: Auth UI');
            const loginBtn = await page.$('#login-btn');
            const userInfo = await page.$('#user-info');
            const syncEl = await page.$('#sync-status');
            const step6 = !!(loginBtn || userInfo) && !!syncEl;
            smokeResults.push({ step: 6, name: 'Auth UI', passed: step6, detail: `Login: ${!!loginBtn}, UserInfo: ${!!userInfo}` });
            console.log('    ', step6 ? 'PASS' : 'FAIL');

            // Step 7: Dark mode toggle
            console.log('  Step 7: Dark mode toggle');
            const themeBefore = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
            const themeBtn = await page.$('#theme-btn');
            if (themeBtn) await themeBtn.click();
            await sleep(800);
            const themeAfter = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
            const step7 = themeBefore !== themeAfter;
            smokeResults.push({ step: 7, name: 'Dark mode toggle', passed: step7, detail: `"${themeBefore}" -> "${themeAfter}"` });
            console.log('    ', step7 ? 'PASS' : 'FAIL');

            results['SMOKE'] = { passed: smokeResults.every(r => r.passed), steps: smokeResults };
        } catch (e) {
            results['SMOKE'] = { passed: false, detail: e.message.slice(0, 200), steps: smokeResults };
        }

    } catch (e) {
        console.error('Fatal:', e);
    } finally {
        await browser.close();
    }

    // Print summary
    console.log('\n\n========================================');
    console.log('       FINAL TEST RESULTS');
    console.log('========================================');
    let totalPass = 0, totalFail = 0;
    for (const [id, result] of Object.entries(results)) {
        const status = result.passed ? 'PASS' : 'FAIL';
        if (result.passed) totalPass++; else totalFail++;
        if (id === 'SMOKE') {
            console.log(`\n${id}: ${status}`);
            if (result.steps) {
                for (const s of result.steps) {
                    console.log(`  Step ${s.step} [${s.passed ? 'PASS' : 'FAIL'}]: ${s.name} — ${s.detail}`);
                }
            }
        } else {
            console.log(`${id}: ${status} — ${result.detail}`);
        }
    }
    console.log(`\nTotal: ${totalPass} passed, ${totalFail} failed`);

    fs.writeFileSync('/home/z/my-project/test_results.json', JSON.stringify(results, null, 2));
    console.log('Saved to /home/z/my-project/test_results.json');
}

runTests().catch(console.error);
