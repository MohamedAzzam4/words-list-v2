import { test, expect } from '@playwright/test';

// AUDIO-003: CEFR level autoplay (A1 + B2) through the real level page and
// controller with a deterministic speechSynthesis double (TS-TEST-004: mock
// the browser speech platform, not the application logic). Same harness
// pattern as tests/e2e/verbs-audio.spec.js: utterances are recorded with
// text + lang + voice, and tests drive completion manually via
// finishCurrent() — no wall-clock sleeps.
//
// Contract refs: LF-AUDIO (autoplay controls; queue scope follows the current
// level/unit/filter; no mixed display text under a single-language voice;
// Arabic is never spoken through an English voice), AC-03 (real adapter
// utterance text/lang, not only a mock wrapper call), AC-11 (deterministic
// steps), AC-12 (lifecycle, highlight and control state agree with the
// queue; stale callbacks cannot advance or restart it), TS-TEST-005.
//
// Real-data note: real A1/B2 cards carry at most ONE structured example per
// card, so example mode "all" is behaviorally equal to "first" on real data;
// the beyond-first ordering is pinned by tests/unit/cefr-audio.test.mjs with
// a synthetic multi-example card. The real B2 dataset contains mixed
// (English+Arabic) and English-only cards but no Arabic-only card, so the
// Arabic-only browser case uses a route-injected synthetic row appended to
// the real B2 config (disclosed synthetic edge case; production data is
// untouched).

test.describe('AUDIO-003 CEFR Level Autoplay (deterministic speech mocks)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.__cefrAudio = { utterances: [], current: null, speakCount: 0, stale: null };
      const mockSpeechSynthesis = {
        speaking: false,
        paused: false,
        pending: false,
        onvoiceschanged: null,
        getVoices: () => [
          { lang: 'de-DE', name: 'Mock DE Voice', localService: true },
          { lang: 'en-US', name: 'Mock EN Voice', localService: true }
        ],
        speak: (utterance) => {
          mockSpeechSynthesis.speaking = true;
          window.__cefrAudio.utterances.push({
            text: utterance.text,
            lang: utterance.lang,
            voice: utterance.voice ? utterance.voice.name : null
          });
          window.__cefrAudio.current = utterance;
          window.__cefrAudio.speakCount++;
        },
        pause: () => { mockSpeechSynthesis.paused = true; },
        resume: () => { mockSpeechSynthesis.paused = false; },
        cancel: () => { mockSpeechSynthesis.speaking = false; }
      };
      Object.defineProperty(window, 'speechSynthesis', {
        value: mockSpeechSynthesis,
        configurable: true,
        writable: true
      });
      window.SpeechSynthesisUtterance = class {
        constructor(text) { this.text = text; }
      };
      window.__cefrAudio.finishCurrent = () => {
        const utterance = window.__cefrAudio.current;
        if (utterance && utterance.onend) {
          mockSpeechSynthesis.speaking = false;
          utterance.onend(new Event('end'));
        }
      };
    });
  });

  async function initLevel(page, level) {
    await page.goto('/index.html');
    await page.evaluate((lvl) => {
      localStorage.removeItem(`german_app_progress_german-${lvl}-app`);
    }, level);
    await page.waitForSelector(`.${level}-card`);
    await page.locator(`.${level}-card`).click();
    await page.waitForSelector('.nav-item');
    await page.waitForFunction('window.app !== undefined');
    await page.waitForSelector('#glossary-tbody tr[data-id]');
  }

  async function waitForUtterance(page, count) {
    await page.waitForFunction(
      (expected) => window.__cefrAudio.speakCount >= expected,
      count
    );
  }

  async function openSettings(page) {
    await page.locator('#btn-toggle-audio-settings').click();
  }

  async function configure(page, { repeat, mode, include, start }) {
    await openSettings(page);
    if (repeat !== undefined) await page.locator('#auto-repeat-count').selectOption(String(repeat));
    if (mode !== undefined) await page.locator('#auto-example-mode').selectOption(mode);
    if (include !== undefined) {
      if (include) await page.locator('#auto-include-en').check();
      else await page.locator('#auto-include-en').uncheck();
    }
    if (start !== undefined) await page.locator('#auto-start-word').selectOption(String(start));
  }

  async function expectWordsCancelled(page) {
    await expect(page.locator('#btn-play-all-words')).not.toHaveClass(/playing/);
    await expect(page.locator('#btn-play-all-words')).toHaveText(/Play All/);
    await expect(page.locator('#btn-pause-words')).toHaveClass(/hidden/);
    await expect(page.locator('#words-audio-progress')).toHaveClass(/hidden/);
    await expect(page.locator('#glossary-tbody tr.highlighted-speech')).toHaveCount(0);
    const speaking = await page.evaluate(() => window.speechSynthesis.speaking);
    expect(speaking).toBe(false);
  }

  async function drive(page, upTo) {
    for (let i = 1; i <= upTo; i++) {
      await waitForUtterance(page, i);
      await page.evaluate(() => window.__cefrAudio.finishCurrent());
    }
  }

  // Case 1: exact A1 utterance text and language sequence.
  test('[AUDIO-003] A1 autoplay speaks the exact planned text and language sequence with visible progress', async ({ page }) => {
    await initLevel(page, 'a1');
    await configure(page, { repeat: 2, mode: 'first', include: true });

    await page.locator('#btn-play-all-words').click();
    await expect(page.locator('#btn-play-all-words')).toHaveClass(/playing/);
    await expect(page.locator('tr[data-id="1-0"]')).toHaveClass(/highlighted-speech/);
    // 30 cards x 2 repeats x (term + translation + example + example translation).
    await expect(page.locator('#words-audio-progress')).toHaveText('1 / 240 · Hallo!');
    await expect(page.locator('#btn-pause-words')).not.toHaveClass(/hidden/);

    await drive(page, 9);

    const spoken = await page.evaluate(() => window.__cefrAudio.utterances.slice(0, 9));
    expect(spoken).toEqual([
      { text: 'Hallo!', lang: 'de-DE', voice: 'Mock DE Voice' },
      { text: 'Hello!', lang: 'en-US', voice: 'Mock EN Voice' },
      { text: 'Hallo, ich bin Anna.', lang: 'de-DE', voice: 'Mock DE Voice' },
      { text: 'Hello, I am Anna.', lang: 'en-US', voice: 'Mock EN Voice' },
      { text: 'Hallo!', lang: 'de-DE', voice: 'Mock DE Voice' },
      { text: 'Hello!', lang: 'en-US', voice: 'Mock EN Voice' },
      { text: 'Hallo, ich bin Anna.', lang: 'de-DE', voice: 'Mock DE Voice' },
      { text: 'Hello, I am Anna.', lang: 'en-US', voice: 'Mock EN Voice' },
      { text: 'Guten Morgen!', lang: 'de-DE', voice: 'Mock DE Voice' }
    ]);

    // The second card's row is highlighted now and the progress moved.
    await expect(page.locator('tr[data-id="1-1"]')).toHaveClass(/highlighted-speech/);
    await expect(page.locator('#words-audio-progress')).toHaveText('9 / 240 · Guten Morgen!');
    await page.locator('#btn-stop-words').click();
  });

  // Cases 2 + 4: exact B2 English translation sequence and separate tagged
  // steps for mixed English/Arabic values.
  test('[AUDIO-003] B2 mixed cards speak separately tagged English and Arabic steps', async ({ page }) => {
    await initLevel(page, 'b2');
    await configure(page, { repeat: 1, mode: 'none', include: true });

    await page.locator('#btn-play-all-words').click();
    await drive(page, 6);

    const spoken = await page.evaluate(() => window.__cefrAudio.utterances.slice(0, 6));
    expect(spoken).toEqual([
      { text: 'die Vorstellung', lang: 'de-DE', voice: 'Mock DE Voice' },
      { text: 'presentation,impression,idea', lang: 'en-US', voice: 'Mock EN Voice' },
      { text: 'التصور /', lang: 'ar', voice: null },
      { text: 'das Zitat', lang: 'de-DE', voice: 'Mock DE Voice' },
      { text: 'quote', lang: 'en-US', voice: 'Mock EN Voice' },
      { text: 'الاقتباس', lang: 'ar', voice: null }
    ]);

    // Row highlighting followed the German term of each card.
    await expect(page.locator('tr[data-id="1-1"]')).toHaveClass(/highlighted-speech/);
    await page.locator('#btn-stop-words').click();
  });

  // Case 3: B2 Arabic-only translation is spoken using Arabic, never English.
  // Real B2 data has no Arabic-only card, so this case injects one synthetic
  // row into the real config through network interception (production data
  // is untouched).
  test('[AUDIO-003] a B2 Arabic-only translation speaks Arabic and never an English voice', async ({ page }) => {
    // The real config is fetched from the running web server, so the
    // interception modifies only this page load's network response.
    const realB2Response = await page.request.get('/js/levels/b2.config.js');
    const realB2 = await realB2Response.text();
    const syntheticRow = '"1||das Synthesewort|الكلمة|Das Synthesewort ist wichtig.|الكلمة مهمة."';
    const modified = realB2.replace('\n];', `\n${syntheticRow}\n];`);
    await page.route('**/js/levels/b2.config.js', (route) => {
      route.fulfill({ body: modified, contentType: 'application/javascript' });
    });

    await initLevel(page, 'b2');
    await configure(page, { repeat: 1, mode: 'first', include: true, start: 3 });

    await page.locator('#btn-play-all-words').click();
    await drive(page, 4);

    const spoken = await page.evaluate(() => window.__cefrAudio.utterances);
    expect(spoken).toEqual([
      { text: 'das Synthesewort', lang: 'de-DE', voice: 'Mock DE Voice' },
      { text: 'الكلمة', lang: 'ar', voice: null },
      { text: 'Das Synthesewort ist wichtig.', lang: 'de-DE', voice: 'Mock DE Voice' },
      { text: 'الكلمة مهمة.', lang: 'ar', voice: null }
    ]);
    // No English utterance was ever produced for the Arabic-only card.
    await page.locator('#btn-stop-words').click();
  });

  // Arabic voice selection: when an Arabic voice exists it is used; the
  // utterance still carries the Arabic language tag.
  test('[AUDIO-003] an available Arabic voice is selected for Arabic steps', async ({ page }) => {
    await initLevel(page, 'b2');
    // Re-run voice selection through the real onvoiceschanged mechanism with
    // an Arabic voice now present.
    await page.evaluate(() => {
      window.speechSynthesis.getVoices = () => [
        { lang: 'de-DE', name: 'Mock DE Voice', localService: true },
        { lang: 'en-US', name: 'Mock EN Voice', localService: true },
        { lang: 'ar', name: 'Mock AR Voice', localService: true }
      ];
      window.speechSynthesis.onvoiceschanged();
    });
    await configure(page, { repeat: 1, mode: 'none', include: true });

    await page.locator('#btn-play-all-words').click();
    await drive(page, 3);

    const arabicStep = await page.evaluate(() => window.__cefrAudio.utterances[2]);
    expect(arabicStep).toEqual({ text: 'التصور /', lang: 'ar', voice: 'Mock AR Voice' });
    await page.locator('#btn-stop-words').click();
  });

  // Case 5: repeat ordering.
  test('[AUDIO-003] repeat count orders every repetition of an item before the next item', async ({ page }) => {
    await initLevel(page, 'a1');
    await configure(page, { repeat: 3, mode: 'none', include: false });

    await page.locator('#btn-play-all-words').click();
    await drive(page, 4);

    const spoken = await page.evaluate(() => window.__cefrAudio.utterances.map(u => u.text));
    expect(spoken).toEqual(['Hallo!', 'Hallo!', 'Hallo!', 'Guten Morgen!']);
    await page.locator('#btn-stop-words').click();
  });

  // Case 6: example modes none / first / all on real single-example data.
  test('[AUDIO-003] example modes none, first, and all change the spoken sequence', async ({ page }) => {
    await initLevel(page, 'a1');

    await configure(page, { repeat: 1, mode: 'none', include: false });
    await page.locator('#btn-play-all-words').click();
    await drive(page, 2);
    let spoken = await page.evaluate(() => window.__cefrAudio.utterances.map(u => u.text));
    expect(spoken).toEqual(['Hallo!', 'Guten Morgen!']);
    await page.locator('#btn-stop-words').click();
    await expectWordsCancelled(page);

    await configure(page, { repeat: 1, mode: 'first', include: false });
    await page.locator('#btn-play-all-words').click();
    await drive(page, 2);
    spoken = await page.evaluate(() => window.__cefrAudio.utterances.slice(2, 4).map(u => u.text));
    expect(spoken).toEqual(['Hallo!', 'Hallo, ich bin Anna.']);
    await page.locator('#btn-stop-words').click();
    await expectWordsCancelled(page);

    // Real A1/B2 cards carry one example each, so "all" speaks the same
    // single example as "first" here; the multi-example ordering is pinned
    // in tests/unit/cefr-audio.test.mjs with a synthetic card.
    await configure(page, { repeat: 1, mode: 'all', include: false });
    await page.locator('#btn-play-all-words').click();
    await drive(page, 2);
    spoken = await page.evaluate(() => window.__cefrAudio.utterances.slice(4, 6).map(u => u.text));
    expect(spoken).toEqual(['Hallo!', 'Hallo, ich bin Anna.']);
    await page.locator('#btn-stop-words').click();
  });

  // Case 7: include-translation on and off.
  test('[AUDIO-003] include-translation on and off controls the translation steps', async ({ page }) => {
    await initLevel(page, 'a1');

    await configure(page, { repeat: 1, mode: 'none', include: true });
    await page.locator('#btn-play-all-words').click();
    await drive(page, 2);
    let spoken = await page.evaluate(() => window.__cefrAudio.utterances.map(u => ({ text: u.text, lang: u.lang })));
    expect(spoken).toEqual([
      { text: 'Hallo!', lang: 'de-DE' },
      { text: 'Hello!', lang: 'en-US' }
    ]);
    await page.locator('#btn-stop-words').click();
    await expectWordsCancelled(page);

    await configure(page, { repeat: 1, mode: 'none', include: false });
    await page.locator('#btn-play-all-words').click();
    await drive(page, 2);
    spoken = await page.evaluate(() => window.__cefrAudio.utterances.slice(2, 4).map(u => ({ text: u.text, lang: u.lang })));
    expect(spoken).toEqual([
      { text: 'Hallo!', lang: 'de-DE' },
      { text: 'Guten Morgen!', lang: 'de-DE' }
    ]);
    await page.locator('#btn-stop-words').click();
  });

  // Case 8: start-at beginning / middle / end / out-of-range.
  test('[AUDIO-003] start-at beginning, middle, and end select the exact starting card', async ({ page }) => {
    await initLevel(page, 'a1');
    await configure(page, { repeat: 1, mode: 'none', include: false });

    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 1);
    expect(await page.evaluate(() => window.__cefrAudio.utterances[0].text)).toBe('Hallo!');
    await page.locator('#btn-stop-words').click();

    await configure(page, { start: 2 });
    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 2);
    expect(await page.evaluate(() => window.__cefrAudio.utterances[1].text)).toBe('Guten Tag!');
    await expect(page.locator('tr[data-id="1-2"]')).toHaveClass(/highlighted-speech/);
    await page.locator('#btn-stop-words').click();

    // The last card of A1 unit 1 (index 29) is "sehr".
    await configure(page, { start: 29 });
    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 3);
    expect(await page.evaluate(() => window.__cefrAudio.utterances[2].text)).toBe('sehr');
    await page.locator('#btn-stop-words').click();

    // Out-of-range start values clamp to the last card and keep the control
    // in agreement (synthetic DOM value, disclosed).
    await page.evaluate(() => { document.getElementById('auto-start-word').value = '999'; });
    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 4);
    expect(await page.evaluate(() => window.__cefrAudio.utterances[3].text)).toBe('sehr');
    await expect(page.locator('#auto-start-word')).toHaveValue('29');
    await page.locator('#btn-stop-words').click();
  });

  // Cases 9 + 15: current-unit scoping and unit-navigation cancellation.
  test('[AUDIO-003] unit navigation cancels the old queue and the new unit speaks only its own words', async ({ page }) => {
    await initLevel(page, 'a1');
    await configure(page, { repeat: 1, mode: 'none', include: false });

    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 1);
    await expect(page.locator('#btn-play-all-words')).toHaveClass(/playing/);
    await page.evaluate(() => { window.__cefrAudio.stale = window.__cefrAudio.current; });

    await page.evaluate(() => window.app.switchUnit(1));

    await expectWordsCancelled(page);
    // The new unit context is intact.
    await expect(page.locator('tr[data-id="2-0"]')).toHaveCount(1);

    // The cancelled session's late onend/onerror callbacks are no-ops.
    await page.evaluate(() => {
      window.__cefrAudio.stale.onend(new Event('end'));
      window.__cefrAudio.stale.onerror({ error: 'synthesis-failed' });
    });
    await expectWordsCancelled(page);

    // Restart: the new unit's first word speaks and no old-unit utterance
    // appeared in between.
    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 2);
    const spoken = await page.evaluate(() => ({
      count: window.__cefrAudio.speakCount,
      last: window.__cefrAudio.utterances[1]
    }));
    expect(spoken.count).toBe(2);
    expect(spoken.last).toEqual({ text: 'der Beruf', lang: 'de-DE', voice: 'Mock DE Voice' });
    await expect(page.locator('tr[data-id="2-0"]')).toHaveClass(/highlighted-speech/);
    await page.locator('#btn-stop-words').click();
  });

  // Cases 10 + 11 + 12: active-filter scoping, empty result idle and active.
  test('[AUDIO-003] the active vocabulary filter scopes the queue and cancels on change', async ({ page }) => {
    await initLevel(page, 'a1');
    await configure(page, { repeat: 1, mode: 'none', include: false });

    // Verbs-only filter: unit 1 has the verb rows at indices 17-20.
    await page.locator('#type-filter').selectOption('v');
    await page.waitForFunction(() => document.querySelectorAll('#glossary-tbody tr[data-id]').length === 4);

    await page.locator('#btn-play-all-words').click();
    await drive(page, 2);
    const verbsSpoken = await page.evaluate(() => window.__cefrAudio.utterances.map(u => u.text));
    expect(verbsSpoken).toEqual(['heißen', 'sein']);
    await expect(page.locator('tr[data-id="1-17"]')).toHaveClass(/highlighted-speech/);
    await page.locator('#btn-stop-words').click();

    // Changing the filter while playing cancels the running queue.
    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 3);
    await page.locator('#type-filter').selectOption('all');
    await expectWordsCancelled(page);
    const speakCountAfterFilterChange = await page.evaluate(() => window.__cefrAudio.speakCount);
    expect(speakCountAfterFilterChange).toBe(3);

    // An empty result (favourites filter with no favourites) while idle:
    // pressing Play is a clean no-op.
    await page.locator('#type-filter').selectOption('fav');
    await page.waitForFunction(() => document.querySelectorAll('#glossary-tbody tr[data-id]').length === 0);
    await page.locator('#btn-play-all-words').click();
    await expectWordsCancelled(page);
    const speakCountIdle = await page.evaluate(() => window.__cefrAudio.speakCount);
    expect(speakCountIdle).toBe(3);

    // An empty result while audio is active: the filter change cancels the
    // session at input time and Play stays a clean no-op.
    await page.locator('#type-filter').selectOption('all');
    await page.waitForFunction(() => document.querySelectorAll('#glossary-tbody tr[data-id]').length === 30);
    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 4);
    await page.locator('#type-filter').selectOption('fav');
    await expectWordsCancelled(page);
    await page.locator('#btn-play-all-words').click();
    await expectWordsCancelled(page);
    const speakCountEmptyActive = await page.evaluate(() => window.__cefrAudio.speakCount);
    expect(speakCountEmptyActive).toBe(4);
  });

  // Case 13: pause and resume retain the cursor.
  test('[AUDIO-003] pause and resume retain the current position without skipping or duplicating', async ({ page }) => {
    await initLevel(page, 'a1');
    await configure(page, { repeat: 1, mode: 'first', include: true });

    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 1); // 'Hallo!'
    await page.evaluate(() => window.__cefrAudio.finishCurrent());
    await waitForUtterance(page, 2); // 'Hello!'

    // Pause while the translation utterance is live.
    await page.locator('#btn-pause-words').click();
    await expect(page.locator('#btn-pause-words')).toHaveText(/Resume/);

    // A late onend for the canceled utterance must be a no-op.
    await page.evaluate(() => window.__cefrAudio.finishCurrent());
    const speakCountAfterStale = await page.evaluate(() => window.__cefrAudio.speakCount);

    // Resume: the SAME item plays again exactly once, then the queue moves on.
    await page.locator('#btn-pause-words').click();
    await expect(page.locator('#btn-pause-words')).toHaveText(/Pause/);
    await waitForUtterance(page, 3);
    await page.evaluate(() => window.__cefrAudio.finishCurrent());
    await waitForUtterance(page, 4);
    const spoken = await page.evaluate(() => window.__cefrAudio.utterances.slice(1, 4).map(u => ({ text: u.text, lang: u.lang })));
    expect(spoken).toEqual([
      { text: 'Hello!', lang: 'en-US' },           // item live when paused
      { text: 'Hello!', lang: 'en-US' },           // same item, replayed on resume
      { text: 'Hallo, ich bin Anna.', lang: 'de-DE' } // next item after finishing it
    ]);
    const speakCount = await page.evaluate(() => window.__cefrAudio.speakCount);
    expect(speakCount).toBe(speakCountAfterStale + 2);
    await page.locator('#btn-stop-words').click();
  });

  // Case 14: stop clears future speech, highlights, progress, and controls.
  test('[AUDIO-003] stop clears future speech, highlights, progress, and controls', async ({ page }) => {
    await initLevel(page, 'a1');
    await configure(page, { repeat: 1, mode: 'none', include: false });

    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 1);
    await expect(page.locator('tr[data-id="1-0"]')).toHaveClass(/highlighted-speech/);
    await expect(page.locator('#words-audio-progress')).not.toHaveClass(/hidden/);
    await expect(page.locator('#btn-pause-words')).not.toHaveClass(/hidden/);

    await page.locator('#btn-stop-words').click();
    await expectWordsCancelled(page);
    await expect(page.locator('#words-audio-progress')).toHaveText('');

    // Nothing else may speak after the stop, proven by the restart beginning
    // exactly at the first item with no extra speech.
    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 2);
    const afterRestart = await page.evaluate(() => ({
      count: window.__cefrAudio.speakCount,
      first: window.__cefrAudio.utterances[1]
    }));
    expect(afterRestart.count).toBe(2);
    expect(afterRestart.first).toEqual({ text: 'Hallo!', lang: 'de-DE', voice: 'Mock DE Voice' });
    await page.locator('#btn-stop-words').click();
  });

  // Case 16: vocabulary / phrase / conversation tab changes cancel or safely
  // replace queue ownership.
  test('[AUDIO-003] tab changes cancel or replace queue ownership between words and phrases', async ({ page }) => {
    await initLevel(page, 'a1');
    await configure(page, { repeat: 1, mode: 'none', include: false });

    // Words autoplay running...
    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 1);
    await expect(page.locator('#btn-play-all-words')).toHaveClass(/playing/);

    // ...switching to the Phrases tab cancels it.
    await page.locator('#tab-phrases').click();
    await page.waitForSelector('.phrase-card');
    await expectWordsCancelled(page);

    // Phrases take over the queue (Play All Phrases owns the speaker).
    await page.locator('#btn-play-all-phrases').click();
    await waitForUtterance(page, 2);
    expect(await page.evaluate(() => window.__cefrAudio.utterances[1].text)).toBe("Hallo! Wie geht's?");
    await expect(page.locator('#btn-play-all-phrases')).toHaveClass(/playing/);

    // Switching back to Words cancels the phrase queue.
    await page.locator('#tab-words').click();
    await expect(page.locator('#btn-play-all-phrases')).not.toHaveClass(/playing/);
    const speakingAfterTabBack = await page.evaluate(() => window.speechSynthesis.speaking);
    expect(speakingAfterTabBack).toBe(false);

    // The conversation tab also cancels a running words queue.
    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 3);
    await page.locator('#tab-conversation').click();
    await expectWordsCancelled(page);
  });

  // Case 17: level change prevents cross-level speech.
  test('[AUDIO-003] navigating to another level starts a fresh context with no cross-level speech', async ({ page }) => {
    await initLevel(page, 'a1');
    await configure(page, { repeat: 1, mode: 'none', include: false });

    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 1);
    // Only A1 unit 1 words were ever queued so far.
    expect(await page.evaluate(() => window.__cefrAudio.utterances[0].text)).toBe('Hallo!');

    // Level navigation is a full page load: the queue cannot survive it.
    await page.goto('/level.html?level=b2');
    await page.waitForFunction('window.app !== undefined');
    await page.waitForSelector('#glossary-tbody tr[data-id]');

    const fresh = await page.evaluate(() => ({
      speakCount: window.__cefrAudio.speakCount,
      speaking: window.speechSynthesis.speaking
    }));
    expect(fresh).toEqual({ speakCount: 0, speaking: false });
    await expect(page.locator('#btn-play-all-words')).not.toHaveClass(/playing/);
    await expect(page.locator('#glossary-tbody tr.highlighted-speech')).toHaveCount(0);
    // The new level context is the B2 glossary.
    await expect(page.locator('tr[data-id="1-0"]')).toHaveCount(1);
  });

  // Cases 18 + 19: rapid queue replacement and stale callbacks.
  test('[AUDIO-003] rapid queue replacement owns the speaker and stale callbacks cannot disturb it', async ({ page }) => {
    await initLevel(page, 'a1');
    await configure(page, { repeat: 1, mode: 'none', include: false });

    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 1); // old words queue's first utterance
    await page.evaluate(() => { window.__cefrAudio.stale = window.__cefrAudio.current; });

    // Rapid replacement: the phrase queue takes over the speaker.
    await page.locator('#tab-phrases').click();
    await page.waitForSelector('.phrase-card');
    await page.locator('#btn-play-all-phrases').click();
    await waitForUtterance(page, 2);
    expect(await page.evaluate(() => window.__cefrAudio.utterances[1].text)).toBe("Hallo! Wie geht's?");

    // The replaced words queue's late onend must be a no-op.
    await page.evaluate(() => window.__cefrAudio.stale.onend(new Event('end')));
    const afterStale = await page.evaluate(() => window.__cefrAudio.speakCount);
    expect(afterStale).toBe(2);
    await expect(page.locator('.phrase-card').first()).toHaveClass(/highlighted-speech/);

    // The replacement continues its own sequence untouched.
    await page.evaluate(() => window.__cefrAudio.finishCurrent());
    await waitForUtterance(page, 3);
    expect(await page.evaluate(() => window.__cefrAudio.utterances[2].text)).toBe('Guten Morgen! Wie geht es Ihnen?');
    await page.locator('#btn-stop-words').click();
  });

  // Case 20: a genuine speech error advances the queue.
  test('[AUDIO-003] a genuine speech error advances the queue', async ({ page }) => {
    await initLevel(page, 'a1');
    await configure(page, { repeat: 1, mode: 'none', include: false });

    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 1);

    // A synthesis failure (not an interrupt) advances to the next item.
    await page.evaluate(() => {
      window.__cefrAudio.current.onerror({ error: 'synthesis-failed' });
    });
    await waitForUtterance(page, 2);
    const spoken = await page.evaluate(() => window.__cefrAudio.utterances.map(u => u.text));
    expect(spoken).toEqual(['Hallo!', 'Guten Morgen!']);
    await page.locator('#btn-stop-words').click();
  });

  // Case 22: the first example and its translation stay visible on the
  // flashcard while the autoplay experience can queue the example audio.
  test('[AUDIO-003] the first example and translation remain visible on the flashcard', async ({ page }) => {
    await initLevel(page, 'a1');

    // The shared card shows the first example and its translation after flip.
    await page.locator('button', { hasText: 'Flashcards' }).click();
    await page.waitForSelector('#fc-card-mount .verb-flashcard');
    await page.locator('#fc-card-mount .verb-flashcard').click();
    await expect(page.locator('.back-example-box .ex-sentence-span')).toHaveText(/Hallo, ich bin Anna\./);
    await expect(page.locator('.back-example-box .ex-translation-line')).toHaveText(/\(Hello, I am Anna\.\)/);

    // Back on the glossary, autoplay example mode "first" speaks exactly the
    // example shown on the card (never a duplicate of the vocabulary term).
    await page.locator('button', { hasText: 'Back to List' }).click();
    await configure(page, { repeat: 1, mode: 'first', include: false });
    await page.locator('#btn-play-all-words').click();
    await drive(page, 2);
    const spoken = await page.evaluate(() => window.__cefrAudio.utterances.map(u => u.text));
    expect(spoken).toEqual(['Hallo!', 'Hallo, ich bin Anna.']);
    await page.locator('#btn-stop-words').click();
  });

  // Cases 23 + 24 (phrase/conversation/favorites/SRS/shared-card regressions)
  // are covered by their own tracked suites in the verification ladder and
  // are deliberately not duplicated here.
});

test.describe('AUDIO-003 no-synthesis fallback (truthful behavior without speechSynthesis)', () => {
  test.beforeEach(async ({ page }) => {
    // The outer harness installed the mock; this override removes the
    // platform entirely before app boot so the fallback path is exercised.
    await page.addInitScript(() => {
      Object.defineProperty(window, 'speechSynthesis', {
        value: undefined,
        configurable: true,
        writable: true
      });
    });
  });

  test('[AUDIO-003] autoplay advances and completes truthfully without speechSynthesis', async ({ page }) => {
    await page.goto('/index.html');
    await page.evaluate(() => {
      localStorage.removeItem('german_app_progress_german-a1-app');
    });
    await page.waitForSelector('.a1-card');
    await page.locator('.a1-card').click();
    await page.waitForFunction('window.app !== undefined');
    await page.waitForSelector('#glossary-tbody tr[data-id]');

    await page.locator('#btn-toggle-audio-settings').click();
    await page.locator('#auto-repeat-count').selectOption('1');
    await page.locator('#auto-example-mode').selectOption('none');
    await page.locator('#auto-include-en').uncheck();
    await page.locator('#auto-start-word').selectOption('29');

    await page.locator('#btn-play-all-words').click();
    await expect(page.locator('#btn-play-all-words')).toHaveClass(/playing/);
    // The last row is highlighted synchronously even without synthesis.
    await expect(page.locator('tr[data-id="1-29"]')).toHaveClass(/highlighted-speech/);

    // The tracked fallback advances after 1500ms and the queue completes,
    // resetting the controls without inventing any speech.
    await expect(page.locator('#btn-play-all-words')).not.toHaveClass(/playing/, { timeout: 5000 });
    await expect(page.locator('#glossary-tbody tr.highlighted-speech')).toHaveCount(0);
  });
});
