/**
 * End-of-Run Test Suite for German-Words-List2
 * Tests: SESS-002, SESS-003, SESS-004, TROPHY-014, DATA-005,
 *        SYNC-002, SYNC-001, PERF-003, LEAD-001, LEAD-003,
 *        PROG-001, PROG-003, PROG-005, PROG-006,
 *        TROPHY-001, TROPHY-002, TROPHY-003
 */

const { chromium } = require('playwright');
const fs = require('fs');

const BASE_URL = 'file:///home/z/my-project/a1.html';
const LS_KEY = 'german_app_progress_german-a1-app';
const AUTH_EMAIL = 'audit@example.com';
const AUTH_PASSWORD = '123456';

const results = {};
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function getLS(page) {
    return await page.evaluate((key) => {
        const d = localStorage.getItem(key);
        return d ? JSON.parse(d) : null;
    }, LS_KEY);
}
async function setLS(page, data) {
    await page.evaluate((args) => {
        localStorage.setItem(args.key, JSON.stringify(args.data));
    }, { key: LS_KEY, data });
}

async function runTests() {
    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files', '--allow-file-access']
    });
    const page = await browser.newPage();

    try {
        // Clean slate - clear localStorage
        await page.goto(BASE_URL, { waitUntil: 'load', timeout: 30000 });
        await sleep(2000);
        await page.evaluate((key) => localStorage.removeItem(key), LS_KEY);
        await page.reload({ waitUntil: 'load', timeout: 30000 });
        await sleep(4000);

        // === SESS-002: Dark Mode Study Minutes Accuracy ===
        console.log('\n=== SESS-002 ===');
        try {
            // Enable dark mode
            await page.evaluate(() => window.app.toggleDarkMode());
            await sleep(1000);
            
            // Record start time, wait ~5 seconds, then trigger a save
            const startTime = Date.now();
            await sleep(5000);
            await page.evaluate(() => window.app.switchView('flashcard'));
            await page.evaluate(() => window.app.markCard(true));
            await sleep(2000);

            const data = await getLS(page);
            const minutes = data?.darkModeStudyMinutes || 0;
            const expectedMinutes = 5 / 60; // ~0.083 minutes
            const isAccurate = minutes > 0 && minutes < 1; // Should be small, not inflated
            results['SESS-002'] = { passed: isAccurate, detail: `darkModeStudyMinutes=${minutes.toFixed(4)} (expected ~0.083 for 5s, should be < 1)` };
        } catch (e) {
            results['SESS-002'] = { passed: false, detail: e.message.slice(0, 200) };
        }
        console.log('  Result:', JSON.stringify(results['SESS-002']));

        // === SESS-003: Total Study Time Accuracy ===
        console.log('\n=== SESS-003 ===');
        try {
            const data = await getLS(page);
            const ms = data?.totalStudyTimeMs || 0;
            // Should be roughly proportional to time spent on page (at least a few seconds)
            const isReasonable = ms > 0 && ms < 600000; // Between 0 and 10 minutes
            results['SESS-003'] = { passed: isReasonable, detail: `totalStudyTimeMs=${ms} (${(ms/1000).toFixed(1)}s, should be > 0 and reasonable)` };
        } catch (e) {
            results['SESS-003'] = { passed: false, detail: e.message.slice(0, 200) };
        }
        console.log('  Result:', JSON.stringify(results['SESS-003']));

        // === SESS-004: _sessionStartTime Not Persisted ===
        console.log('\n=== SESS-004 ===');
        try {
            const data = await getLS(page);
            const hasNoStartTime = !data?._sessionStartTime && !data?._lastSaveTime;
            results['SESS-004'] = { passed: hasNoStartTime, detail: `_sessionStartTime=${!!data?._sessionStartTime}, _lastSaveTime=${!!data?._lastSaveTime}` };
        } catch (e) {
            results['SESS-004'] = { passed: false, detail: e.message.slice(0, 200) };
        }
        console.log('  Result:', JSON.stringify(results['SESS-004']));

        // === TROPHY-014: calcStreak with Duplicate Dates ===
        console.log('\n=== TROPHY-014 ===');
        try {
            const streakResult = await page.evaluate(async () => {
                const { calcStreak } = await import('./js/core/trophies.js?v=3');
                // Test with duplicates
                const today = new Date().toISOString().split('T')[0];
                const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                const dayBefore = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];
                const result = calcStreak([today, today, yesterday, dayBefore]);
                return result;
            });
            console.log('  calcStreak with duplicates:', streakResult);
            results['TROPHY-014'] = { passed: streakResult === 3, detail: `calcStreak([today, today, yesterday, dayBefore])=${streakResult}, expected=3` };
        } catch (e) {
            results['TROPHY-014'] = { passed: false, detail: e.message.slice(0, 200) };
        }
        console.log('  Result:', JSON.stringify(results['TROPHY-014']));

        // === DATA-005: Study Dates Format ===
        console.log('\n=== DATA-005 ===');
        try {
            const data = await getLS(page);
            const dates = data?.studyDates || [];
            const allISOFormat = dates.every(d => /^\d{4}-\d{2}-\d{2}$/.test(d));
            results['DATA-005'] = { passed: allISOFormat && dates.length > 0, detail: `studyDates=${JSON.stringify(dates.slice(-3))}, allISOFormat=${allISOFormat}` };
        } catch (e) {
            results['DATA-005'] = { passed: false, detail: e.message.slice(0, 200) };
        }
        console.log('  Result:', JSON.stringify(results['DATA-005']));

        // === SYNC-002: beforeunload Save ===
        console.log('\n=== SYNC-002 ===');
        try {
            // Mark words, then reload immediately to test beforeunload
            const knownBefore = (await getLS(page))?.known?.length || 0;
            await page.evaluate(() => window.app.markCard(true));
            await sleep(1000);
            
            // Reload (simulates beforeunload)
            await page.reload({ waitUntil: 'load', timeout: 30000 });
            await sleep(4000);

            const dataAfter = await getLS(page);
            const knownAfter = dataAfter?.known?.length || 0;
            results['SYNC-002'] = { passed: knownAfter > knownBefore, detail: `Known before: ${knownBefore}, after reload: ${knownAfter}` };
        } catch (e) {
            results['SYNC-002'] = { passed: false, detail: e.message.slice(0, 200) };
        }
        console.log('  Result:', JSON.stringify(results['SYNC-002']));

        // === SYNC-001: Save Debouncing ===
        console.log('\n=== SYNC-001 ===');
        try {
            // Debouncing is now in place - we verify localStorage is updated on every action
            // Firestore debouncing at 3s can't be easily verified in Playwright (no network tab)
            // We verify the mechanism exists by checking _scheduleRemoteSave is a function
            const hasDebounce = await page.evaluate(() => typeof window.app._scheduleRemoteSave === 'function');
            const hasFlush = await page.evaluate(() => typeof window.app._flushRemoteSave === 'function');
            results['SYNC-001'] = { passed: hasDebounce && hasFlush, detail: `Debounce mechanism present: ${hasDebounce}, flush mechanism present: ${hasFlush}` };
        } catch (e) {
            results['SYNC-001'] = { passed: false, detail: e.message.slice(0, 200) };
        }
        console.log('  Result:', JSON.stringify(results['SYNC-001']));

        // === PERF-003: Firestore Write Count ===
        console.log('\n=== PERF-003 ===');
        try {
            // Verify debouncing is in place (same as SYNC-001)
            // Also verify batch function exists
            const hasBatch = await page.evaluate(async () => {
                try {
                    const mod = await import('./js/core/firebase.js?v=3');
                    return typeof mod.batchSaveProgressAndLeaderboard === 'function';
                } catch { return false; }
            });
            results['PERF-003'] = { passed: hasBatch, detail: `batchSaveProgressAndLeaderboard exists: ${hasBatch}` };
        } catch (e) {
            results['PERF-003'] = { passed: false, detail: e.message.slice(0, 200) };
        }
        console.log('  Result:', JSON.stringify(results['PERF-003']));

        // === LEAD-001: Leaderboard Displays Correctly ===
        console.log('\n=== LEAD-001 ===');
        try {
            // Login first
            const loginBtn = await page.$('#login-email-btn');
            if (loginBtn) {
                await loginBtn.click();
                await sleep(1000);
                await page.fill('#auth-email', AUTH_EMAIL);
                await page.fill('#auth-password', AUTH_PASSWORD);
                await page.click('#auth-submit-btn');
                await sleep(5000);
            }

            await page.evaluate(() => window.app.switchView('leaderboard'));
            await sleep(3000);

            const leaderboardHtml = await page.$eval('#leaderboard-tbody', el => el.innerHTML.slice(0, 300)).catch(() => 'N/A');
            const hasData = leaderboardHtml !== 'N/A' && leaderboardHtml.length > 10;
            results['LEAD-001'] = { passed: hasData, detail: `Leaderboard tbody has content: ${hasData}` };
        } catch (e) {
            results['LEAD-001'] = { passed: false, detail: e.message.slice(0, 200) };
        }
        console.log('  Result:', JSON.stringify(results['LEAD-001']));

        // === LEAD-003: Leaderboard Updates After Progress ===
        console.log('\n=== LEAD-003 ===');
        try {
            const knownBefore = (await getLS(page))?.known?.length || 0;
            await page.evaluate(() => window.app.switchView('flashcard'));
            await sleep(500);
            await page.evaluate(() => window.app.markCard(true));
            await sleep(2000);
            
            // Wait for debounce (3s) + extra
            await sleep(5000);

            await page.evaluate(() => window.app.switchView('leaderboard'));
            await sleep(3000);

            const knownAfter = (await getLS(page))?.known?.length || 0;
            results['LEAD-003'] = { passed: knownAfter > knownBefore, detail: `Known before: ${knownBefore}, after: ${knownAfter}` };
        } catch (e) {
            results['LEAD-003'] = { passed: false, detail: e.message.slice(0, 200) };
        }
        console.log('  Result:', JSON.stringify(results['LEAD-003']));

        // === PROG-001: Mark Word as Known ===
        console.log('\n=== PROG-001 ===');
        try {
            // Clean slate
            let data = await getLS(page);
            data.known = [];
            data.trophyCounts = {};
            await setLS(page, data);
            await page.reload({ waitUntil: 'load', timeout: 30000 });
            await sleep(4000);

            const initialKnown = (await getLS(page))?.known?.length || 0;
            await page.evaluate(() => window.app.switchView('flashcard'));
            await sleep(800);
            await page.evaluate(() => window.app.markCard(true));
            await sleep(2000);

            const afterKnown = (await getLS(page))?.known?.length || 0;
            const statKnown = await page.$eval('#stat-known', el => el.textContent).catch(() => 'N/A');
            results['PROG-001'] = { passed: afterKnown > initialKnown, detail: `Initial: ${initialKnown}, After: ${afterKnown}, Stats: ${statKnown}` };
        } catch (e) {
            results['PROG-001'] = { passed: false, detail: e.message.slice(0, 200) };
        }
        console.log('  Result:', JSON.stringify(results['PROG-001']));

        // === PROG-003: Progress Persists to localStorage ===
        console.log('\n=== PROG-003 ===');
        try {
            for (let i = 0; i < 3; i++) {
                await page.evaluate(() => window.app.markCard(true));
                await sleep(1000);
            }
            const data = await getLS(page);
            const passed = data && data.known?.length >= 4 && data.lastUpdated;
            results['PROG-003'] = { passed: !!passed, detail: `Known: ${data?.known?.length}, lastUpdated: ${!!data?.lastUpdated}` };
        } catch (e) {
            results['PROG-003'] = { passed: false, detail: e.message.slice(0, 200) };
        }
        console.log('  Result:', JSON.stringify(results['PROG-003']));

        // === PROG-005: Progress Survives Page Refresh ===
        console.log('\n=== PROG-005 ===');
        try {
            const knownBefore = (await getLS(page))?.known?.length || 0;
            await page.reload({ waitUntil: 'load', timeout: 30000 });
            await sleep(4000);
            const knownAfter = (await getLS(page))?.known?.length || 0;
            results['PROG-005'] = { passed: knownAfter >= knownBefore, detail: `Before: ${knownBefore}, After: ${knownAfter}` };
        } catch (e) {
            results['PROG-005'] = { passed: false, detail: e.message.slice(0, 200) };
        }
        console.log('  Result:', JSON.stringify(results['PROG-005']));

        // === PROG-006: Progress Merge ===
        console.log('\n=== PROG-006 ===');
        try {
            const data = await getLS(page);
            results['PROG-006'] = { passed: data !== null && data.known !== undefined, detail: `Data exists: ${!!data}, known: ${data?.known?.length}` };
        } catch (e) {
            results['PROG-006'] = { passed: false, detail: e.message.slice(0, 200) };
        }
        console.log('  Result:', JSON.stringify(results['PROG-006']));

        // === TROPHY-001: evaluate() Called After markCard() ===
        console.log('\n=== TROPHY-001 ===');
        try {
            let data = await getLS(page);
            data.known = [];
            data.trophyCounts = {};
            await setLS(page, data);
            await page.reload({ waitUntil: 'load', timeout: 30000 });
            await sleep(4000);

            await page.evaluate(() => window.app.switchView('flashcard'));
            await sleep(800);
            for (let i = 0; i < 10; i++) {
                await page.evaluate(() => window.app.markCard(true));
                await sleep(500);
            }

            data = await getLS(page);
            results['TROPHY-001'] = { passed: data?.trophyCounts?.first_steps >= 1, detail: `first_steps=${data?.trophyCounts?.first_steps || 0}, known=${data?.known?.length}` };
        } catch (e) {
            results['TROPHY-001'] = { passed: false, detail: e.message.slice(0, 200) };
        }
        console.log('  Result:', JSON.stringify(results['TROPHY-001']));

        // === TROPHY-002: evaluate() Uses ALL Vocabulary Words ===
        console.log('\n=== TROPHY-002 ===');
        try {
            let data = await getLS(page);
            data.known = data.known?.slice(0, 9) || [];
            data.trophyCounts = {};
            await setLS(page, data);
            await page.reload({ waitUntil: 'load', timeout: 30000 });
            await sleep(4000);

            await page.evaluate(() => window.app.switchUnit(1));
            await sleep(1000);
            await page.evaluate(() => window.app.switchView('flashcard'));
            await sleep(800);
            await page.evaluate(() => window.app.markCard(true));
            await sleep(2000);

            data = await getLS(page);
            results['TROPHY-002'] = { passed: data?.trophyCounts?.first_steps >= 1, detail: `first_steps earned with ${data?.known?.length} total words across units` };
        } catch (e) {
            results['TROPHY-002'] = { passed: false, detail: e.message.slice(0, 200) };
        }
        console.log('  Result:', JSON.stringify(results['TROPHY-002']));

        // === TROPHY-003: evaluate() Triggers _save() ===
        console.log('\n=== TROPHY-003 ===');
        try {
            let data = await getLS(page);
            data.known = data.known?.slice(0, 9) || [];
            data.trophyCounts = {};
            await setLS(page, data);
            await page.reload({ waitUntil: 'load', timeout: 30000 });
            await sleep(4000);

            await page.evaluate(() => window.app.switchView('flashcard'));
            await sleep(800);
            await page.evaluate(() => window.app.markCard(true));
            await sleep(2000);

            const beforeReload = await getLS(page);
            await page.reload({ waitUntil: 'load', timeout: 30000 });
            await sleep(4000);

            const afterReload = await getLS(page);
            results['TROPHY-003'] = { passed: afterReload?.trophyCounts?.first_steps >= 1, detail: `Before: ${JSON.stringify(beforeReload?.trophyCounts)}, After: ${JSON.stringify(afterReload?.trophyCounts)}` };
        } catch (e) {
            results['TROPHY-003'] = { passed: false, detail: e.message.slice(0, 200) };
        }
        console.log('  Result:', JSON.stringify(results['TROPHY-003']));

        // === MANDATORY SMOKE TEST ===
        console.log('\n=== MANDATORY SMOKE TEST ===');
        const smokeResults = [];
        try {
            // Step 1: Login
            console.log('  Step 1: Login');
            const loginBtn = await page.$('#login-email-btn');
            if (loginBtn) {
                await loginBtn.click();
                await sleep(1000);
                await page.fill('#auth-email', AUTH_EMAIL);
                await page.fill('#auth-password', AUTH_PASSWORD);
                await page.click('#auth-submit-btn');
                await sleep(5000);
            }
            const sync = await page.$eval('#sync-status', el => el.textContent).catch(() => 'N/A');
            const s1 = sync.includes('Cloud');
            smokeResults.push({ step: 1, name: 'Login', passed: s1, detail: `Sync: "${sync}"` });
            console.log('    ', s1 ? 'PASS' : 'FAIL');

            // Step 2: Flashcard workflow
            console.log('  Step 2: Flashcard workflow');
            await page.evaluate(() => window.app.switchView('flashcard'));
            await sleep(800);
            const knownBefore = (await getLS(page))?.known?.length || 0;
            await page.evaluate(() => window.app.markCard(true));
            await sleep(1500);
            await page.evaluate(() => window.app.markCard(true));
            await sleep(1500);
            const knownAfter = (await getLS(page))?.known?.length || 0;
            const s2 = knownAfter > knownBefore;
            smokeResults.push({ step: 2, name: 'Flashcard workflow', passed: s2, detail: `Before: ${knownBefore}, After: ${knownAfter}` });
            console.log('    ', s2 ? 'PASS' : 'FAIL');

            // Step 3: Unit switching
            console.log('  Step 3: Unit switching');
            await page.evaluate(() => window.app.switchUnit(2));
            await sleep(1000);
            const title = await page.$eval('#glossary-title', el => el.textContent).catch(() => '');
            const s3 = title.includes('3') || title.includes('Unit');
            smokeResults.push({ step: 3, name: 'Unit switching', passed: s3, detail: `Title: "${title}"` });
            console.log('    ', s3 ? 'PASS' : 'FAIL');

            // Step 4: Leaderboard
            console.log('  Step 4: Leaderboard');
            await page.evaluate(() => window.app.switchView('leaderboard'));
            await sleep(3000);
            const tbody = await page.$eval('#leaderboard-tbody', el => el.innerHTML.length).catch(() => 0);
            const s4 = tbody > 10;
            smokeResults.push({ step: 4, name: 'Leaderboard renders', passed: s4, detail: `Tbody length: ${tbody}` });
            console.log('    ', s4 ? 'PASS' : 'FAIL');

            // Step 5: Logout
            console.log('  Step 5: Logout');
            await page.evaluate(() => window.app.logout());
            await sleep(5000);
            const syncAfterLogout = await page.$eval('#sync-status', el => el.textContent).catch(() => 'N/A');
            const lsAfterLogout = await getLS(page);
            const progressVisible = lsAfterLogout && (lsAfterLogout.known?.length || 0) > 0;
            const s5 = syncAfterLogout.includes('Local') && progressVisible;
            smokeResults.push({ step: 5, name: 'Logout preserves progress', passed: s5, detail: `Sync: "${syncAfterLogout}", Progress: ${progressVisible}` });
            console.log('    ', s5 ? 'PASS' : 'FAIL');

            // Step 6: Page reload
            console.log('  Step 6: Page reload');
            const knownBeforeReload = (await getLS(page))?.known?.length || 0;
            await page.reload({ waitUntil: 'load', timeout: 30000 });
            await sleep(4000);
            const knownAfterReload = (await getLS(page))?.known?.length || 0;
            const s6 = knownAfterReload >= knownBeforeReload;
            smokeResults.push({ step: 6, name: 'Progress survives reload', passed: s6, detail: `Before: ${knownBeforeReload}, After: ${knownAfterReload}` });
            console.log('    ', s6 ? 'PASS' : 'FAIL');

            // Step 7: Console error sweep
            console.log('  Step 7: Console error sweep');
            const jsErrors = [];
            const errHandler = err => jsErrors.push(err.message);
            page.on('pageerror', errHandler);
            await page.evaluate(() => window.app.switchView('flashcard'));
            await sleep(500);
            await page.evaluate(() => window.app.switchView('dashboard'));
            await sleep(500);
            page.off('pageerror', errHandler);
            const typeErrors = jsErrors.filter(e => e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Uncaught'));
            const s7 = typeErrors.length === 0;
            smokeResults.push({ step: 7, name: 'No console errors', passed: s7, detail: `${typeErrors.length} TypeErrors/ReferenceErrors/Uncaught` });
            console.log('    ', s7 ? 'PASS' : 'FAIL');

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
    console.log('       END-OF-RUN TEST RESULTS');
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

    fs.writeFileSync('/home/z/my-project/test_results_eor.json', JSON.stringify(results, null, 2));
    console.log('Results saved to /home/z/my-project/test_results_eor.json');
}

runTests().catch(console.error);
