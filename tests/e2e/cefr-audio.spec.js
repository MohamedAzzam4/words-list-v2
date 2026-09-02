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
    // Idempotent: only open the drawer when it is currently hidden, so
    // repeated configure() calls inside one test never toggle it closed.
    const isHidden = await page.locator('#audio-settings-drawer')
      .evaluate(el => el.classList.contains('hidden'));
    if (isHidden) {
      await page.locator('#btn-toggle-audio-settings').click();
    }
  }

  // AUDIO-003-C1: `start` is the STABLE word id of the Start-At option
  // (option values are card ids, no longer numeric indexes — one identity
  // space shared with playback).
  async function configure(page, { repeat, mode, include, start }) {
    await openSettings(page);
    if (repeat !== undefined) await page.locator('#auto-repeat-count').selectOption(String(repeat));
    if (mode !== undefined) await page.locator('#auto-example-mode').selectOption(mode);
    if (include !== undefined) {
      if (include) await page.locator('#auto-include-en').check();
      else await page.locator('#auto-include-en').uncheck();
    }
    if (start !== undefined) await page.locator('#auto-start-word').selectOption(start);
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

  // Drive N utterances of a REPLACEMENT session: utterance counts are
  // global in the mock, so the new session's utterances start after `base`
  // (the count captured before the restart).
  async function driveFrom(page, base, count) {
    for (let i = 1; i <= count; i++) {
      await waitForUtterance(page, base + i);
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

    await drive(page, 8);
    await waitForUtterance(page, 9);

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

    // The second card's row is highlighted and the progress shows the step
    // being spoken (step 9 is the second card's German term).
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
    await drive(page, 5);
    await waitForUtterance(page, 6);

    const spoken = await page.evaluate(() => window.__cefrAudio.utterances.slice(0, 6));
    expect(spoken).toEqual([
      { text: 'die Vorstellung', lang: 'de-DE', voice: 'Mock DE Voice' },
      { text: 'presentation,impression,idea', lang: 'en-US', voice: 'Mock EN Voice' },
      { text: 'التصور /', lang: 'ar', voice: null },
      { text: 'das Zitat', lang: 'de-DE', voice: 'Mock DE Voice' },
      { text: 'quote', lang: 'en-US', voice: 'Mock EN Voice' },
      { text: 'الاقتباس', lang: 'ar', voice: null }
    ]);

    // Row highlighting shows the card of the step being spoken (step 6 is
    // the second card's Arabic translation).
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
    await configure(page, { repeat: 1, mode: 'first', include: true, start: '1-3' });

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
    // Instant click: on Mobile Chrome a simulated click can take longer
    // than the 250ms inter-utterance delay, which would let the queue speak
    // one more item before the stop lands (same reasoning as the phrases
    // suite's stop-during-delay test).
    await page.evaluate(() => document.getElementById('btn-stop-words').click());
    await expectWordsCancelled(page);

    await configure(page, { repeat: 1, mode: 'first', include: false });
    await page.locator('#btn-play-all-words').click();
    await driveFrom(page, 2, 2);
    spoken = await page.evaluate(() => window.__cefrAudio.utterances.slice(2, 4).map(u => u.text));
    expect(spoken).toEqual(['Hallo!', 'Hallo, ich bin Anna.']);
    await page.evaluate(() => document.getElementById('btn-stop-words').click());
    await expectWordsCancelled(page);

    // Real A1/B2 cards carry one example each, so "all" speaks the same
    // single example as "first" here; the multi-example ordering is pinned
    // in tests/unit/cefr-audio.test.mjs with a synthetic card.
    await configure(page, { repeat: 1, mode: 'all', include: false });
    await page.locator('#btn-play-all-words').click();
    await driveFrom(page, 4, 2);
    spoken = await page.evaluate(() => window.__cefrAudio.utterances.slice(4, 6).map(u => u.text));
    expect(spoken).toEqual(['Hallo!', 'Hallo, ich bin Anna.']);
    await page.evaluate(() => document.getElementById('btn-stop-words').click());
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
    // Instant click (see the example-modes test for the Mobile Chrome
    // click-latency rationale).
    await page.evaluate(() => document.getElementById('btn-stop-words').click());
    await expectWordsCancelled(page);

    await configure(page, { repeat: 1, mode: 'none', include: false });
    await page.locator('#btn-play-all-words').click();
    await driveFrom(page, 2, 2);
    spoken = await page.evaluate(() => window.__cefrAudio.utterances.slice(2, 4).map(u => ({ text: u.text, lang: u.lang })));
    expect(spoken).toEqual([
      { text: 'Hallo!', lang: 'de-DE' },
      { text: 'Guten Morgen!', lang: 'de-DE' }
    ]);
    await page.evaluate(() => document.getElementById('btn-stop-words').click());
  });

  // Case 8: start-at beginning / middle / end / out-of-range.
  test('[AUDIO-003] start-at beginning, middle, and end select the exact starting card', async ({ page }) => {
    await initLevel(page, 'a1');
    await configure(page, { repeat: 1, mode: 'none', include: false });

    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 1);
    expect(await page.evaluate(() => window.__cefrAudio.utterances[0].text)).toBe('Hallo!');
    await page.evaluate(() => document.getElementById('btn-stop-words').click());

    // AUDIO-003-C1: Start-At options carry the STABLE word id as their
    // value; the middle/end selections address the exact card by id.
    await configure(page, { start: '1-2' });
    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 2);
    expect(await page.evaluate(() => window.__cefrAudio.utterances[1].text)).toBe('Guten Tag!');
    await expect(page.locator('tr[data-id="1-2"]')).toHaveClass(/highlighted-speech/);
    await page.evaluate(() => document.getElementById('btn-stop-words').click());

    // The last card of A1 unit 1 (index 29) is "sehr".
    await configure(page, { start: '1-29' });
    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 3);
    expect(await page.evaluate(() => window.__cefrAudio.utterances[2].text)).toBe('sehr');
    await page.evaluate(() => document.getElementById('btn-stop-words').click());

    // AUDIO-003-C1 supersedes the former numeric clamp rule: an id that is
    // no longer in scope (this synthetic value matches no card) resolves
    // deterministically to the FIRST card of the current scope, and the
    // control is set to that resolved card so the option shown and the
    // first utterance always reference the same card.
    await page.evaluate(() => {
      const select = document.getElementById('auto-start-word');
      const synthetic = document.createElement('option');
      synthetic.value = '999';
      select.appendChild(synthetic);
      select.value = '999';
    });
    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 4);
    expect(await page.evaluate(() => window.__cefrAudio.utterances[3].text)).toBe('Hallo!');
    await expect(page.locator('#auto-start-word')).toHaveValue('1-0');
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

    // Verbs-only filter: unit 1 has the verb rows at indices 16-19.
    await page.locator('#type-filter').selectOption('v');
    await page.waitForFunction(() => document.querySelectorAll('#glossary-tbody tr[data-id]').length === 4);

    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 1);
    // Step 1 ("heißen", card 1-16) is highlighted while it is spoken.
    await expect(page.locator('tr[data-id="1-16"]')).toHaveClass(/highlighted-speech/);
    await page.evaluate(() => window.__cefrAudio.finishCurrent());
    await waitForUtterance(page, 2);
    // After the queue advances, the highlight moved to the next verb's row.
    await expect(page.locator('tr[data-id="1-17"]')).toHaveClass(/highlighted-speech/);
    await page.evaluate(() => window.__cefrAudio.finishCurrent());
    const verbsSpoken = await page.evaluate(() => window.__cefrAudio.utterances.map(u => u.text));
    expect(verbsSpoken).toEqual(['heißen', 'sein']);
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

    // The replaced words queue's late onend must be a no-op. The check is
    // atomic with the callback: a guard-less stale onend advances the
    // phrase queue's cursor synchronously (highlighting the SECOND phrase
    // card immediately), which is exactly what must never happen.
    const staleResult = await page.evaluate(() => {
      window.__cefrAudio.stale.onend(new Event('end'));
      const cards = document.querySelectorAll('.phrase-card');
      return {
        speakCount: window.__cefrAudio.speakCount,
        firstHighlighted: cards[0].classList.contains('highlighted-speech'),
        secondHighlighted: cards.length > 1 ? cards[1].classList.contains('highlighted-speech') : null
      };
    });
    expect(staleResult.speakCount).toBe(2);
    expect(staleResult.firstHighlighted).toBe(true);
    expect(staleResult.secondHighlighted).toBe(false);
    await expect(page.locator('.phrase-card').first()).toHaveClass(/highlighted-speech/);

    // The replacement continues its own sequence untouched.
    await page.evaluate(() => window.__cefrAudio.finishCurrent());
    await waitForUtterance(page, 3);
    expect(await page.evaluate(() => window.__cefrAudio.utterances[2].text)).toBe('Guten Morgen! Wie geht es Ihnen?');
    await page.locator('#btn-stop-phrases').click();
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

    // The shared card shows the first example and its translation after
    // flip. Shuffle is turned off first so the queue order is deterministic
    // (the first card is the unit's first word).
    await page.locator('button', { hasText: 'Flashcards' }).click();
    await page.waitForSelector('#fc-card-mount .verb-flashcard');
    await page.locator('#shuffle-btn').click();
    await expect(page.locator('#shuffle-btn')).toHaveText(/Shuffle: OFF/);
    await page.locator('#fc-card-mount .verb-flashcard').click();
    await expect(page.locator('.back-example-box .ex-sentence-span')).toHaveText(/Hallo, ich bin Anna\./);
    await expect(page.locator('.back-example-box .ex-translation-line')).toHaveText(/\(Hello, I am Anna\.\)/);

    // Back on the glossary, autoplay example mode "first" speaks exactly the
    // example shown on the card (never a duplicate of the vocabulary term).
    await page.locator('#view-flashcard button', { hasText: 'Back to List' }).click();
    await configure(page, { repeat: 1, mode: 'first', include: false });
    await page.locator('#btn-play-all-words').click();
    await drive(page, 2);
    const spoken = await page.evaluate(() => window.__cefrAudio.utterances.map(u => u.text));
    expect(spoken).toEqual(['Hallo!', 'Hallo, ich bin Anna.']);
    await page.locator('#btn-stop-words').click();
  });

  // ── AUDIO-003-C1 correction cases ──
  // Owner findings at be5eb38: (1) an active Favorites filter becomes stale
  // when a favorite is removed while autoplay is playing; (2) Start At and
  // playback use different index spaces once rows are hidden.

  async function startOptionValues(page) {
    return page.evaluate(() => Array.from(document.getElementById('auto-start-word').options).map(o => o.value));
  }

  // Required test A — active Favorites membership removal (Finding 1).
  test('[AUDIO-003-C1] removing the playing favorite under the Favorites filter cancels autoplay and empties the scope', async ({ page }) => {
    await initLevel(page, 'a1');
    await configure(page, { repeat: 1, mode: 'none', include: false });

    // Favorite card 1-0 through the glossary star, then activate the
    // Favorites filter: exactly that card is visible (row count and its
    // row identity are checked below while it speaks).
    await page.locator('tr[data-id="1-0"] span[title="Toggle Favorite"]').click();
    await page.locator('#type-filter').selectOption('fav');
    await page.waitForFunction(() => document.querySelectorAll('#glossary-tbody tr[data-id]').length === 1);

    // Start autoplay: card 1-0 is speaking.
    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 1);
    await expect(page.locator('#btn-play-all-words')).toHaveClass(/playing/);
    await expect(page.locator('tr[data-id="1-0"]')).toHaveClass(/highlighted-speech/);
    await page.evaluate(() => { window.__cefrAudio.stale = window.__cefrAudio.current; });
    const speakCountAtRemoval = await page.evaluate(() => window.__cefrAudio.speakCount);

    // Remove the favorite while it is playing: cancellation is immediate.
    await page.locator('tr[data-id="1-0"] span[title="Toggle Favorite"]').click();
    await expectWordsCancelled(page);

    // No future utterance may appear for the cancelled session.
    const speakCountAfter = await page.evaluate(() => window.__cefrAudio.speakCount);
    expect(speakCountAfter).toBe(speakCountAtRemoval);

    // The glossary rerendered from the updated favorite set: zero rows.
    await page.waitForFunction(() => document.querySelectorAll('#glossary-tbody tr[data-id]').length === 0);
    // Start At is rebuilt from the same (now empty) scope: zero options.
    expect(await startOptionValues(page)).toEqual([]);

    // Stale callbacks cannot advance or restore the cancelled queue.
    await page.evaluate(() => {
      window.__cefrAudio.stale.onend(new Event('end'));
      window.__cefrAudio.stale.onerror({ error: 'synthesis-failed' });
    });
    await expectWordsCancelled(page);
    const speakCountAfterStale = await page.evaluate(() => window.__cefrAudio.speakCount);
    expect(speakCountAfterStale).toBe(speakCountAtRemoval);
    expect(await startOptionValues(page)).toEqual([]);
  });

  // Stale callbacks cannot disturb the REPLACEMENT queue after a favorites
  // cancellation either (the replacement scope keeps its own ownership).
  test('[AUDIO-003-C1] a stale callback cannot disturb the replacement queue after favorites cancellation', async ({ page }) => {
    await initLevel(page, 'a1');
    await configure(page, { repeat: 1, mode: 'none', include: false });

    await page.locator('tr[data-id="1-0"] span[title="Toggle Favorite"]').click();
    await page.locator('tr[data-id="1-1"] span[title="Toggle Favorite"]').click();
    await page.locator('#type-filter').selectOption('fav');
    await page.waitForFunction(() => document.querySelectorAll('#glossary-tbody tr[data-id]').length === 2);

    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 1);
    await expect(page.locator('tr[data-id="1-0"]')).toHaveClass(/highlighted-speech/);
    await page.evaluate(() => { window.__cefrAudio.stale = window.__cefrAudio.current; });
    const speakCountAtRemoval = await page.evaluate(() => window.__cefrAudio.speakCount);

    // Remove the playing favorite: the scope shrinks to card 1-1 and the
    // queue, table, and Start At all cancel/rebuild together.
    await page.locator('tr[data-id="1-0"] span[title="Toggle Favorite"]').click();
    await expectWordsCancelled(page);
    await page.waitForFunction(() => document.querySelectorAll('#glossary-tbody tr[data-id]').length === 1);
    expect(await startOptionValues(page)).toEqual(['1-1']);
    const speakCountAfter = await page.evaluate(() => window.__cefrAudio.speakCount);
    expect(speakCountAfter).toBe(speakCountAtRemoval);

    // Restart autoplay on the replacement scope: card 1-1 speaks.
    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 2);
    expect(await page.evaluate(() => window.__cefrAudio.utterances[1].text)).toBe('Guten Morgen!');
    await expect(page.locator('tr[data-id="1-1"]')).toHaveClass(/highlighted-speech/);
    await expect(page.locator('#btn-play-all-words')).toHaveClass(/playing/);

    // The cancelled session's late onend/onerror must not advance, reset,
    // or otherwise disturb the replacement queue.
    const staleResult = await page.evaluate(() => {
      window.__cefrAudio.stale.onend(new Event('end'));
      window.__cefrAudio.stale.onerror({ error: 'synthesis-failed' });
      const highlighted = document.querySelector('#glossary-tbody tr.highlighted-speech');
      return {
        speakCount: window.__cefrAudio.speakCount,
        playing: document.getElementById('btn-play-all-words').classList.contains('playing'),
        highlighted: highlighted ? highlighted.dataset.id : null
      };
    });
    expect(staleResult).toEqual({ speakCount: 2, playing: true, highlighted: '1-1' });
    await page.locator('#btn-stop-words').click();
  });

  // Constraint side of Finding 1: toggling a favorite while another filter is
  // active must NOT unnecessarily change queue membership. This is a
  // regression guard for the correction (it also passes on the unmodified
  // base; the fix must keep it passing).
  test('[AUDIO-003-C1] toggling a favorite under a non-Favorites filter leaves the running queue untouched', async ({ page }) => {
    await initLevel(page, 'a1');
    await configure(page, { repeat: 1, mode: 'none', include: false });

    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 1); // 'Hallo!'
    await page.evaluate(() => window.__cefrAudio.finishCurrent());
    await waitForUtterance(page, 2); // 'Guten Morgen!' — card 1-1 speaking

    // Toggling a favorite under the 'all' filter does not alter the queue
    // scope: the session keeps playing without interruption.
    await page.locator('tr[data-id="1-5"] span[title="Toggle Favorite"]').click();
    await expect(page.locator('#btn-play-all-words')).toHaveClass(/playing/);
    await expect(page.locator('tr[data-id="1-1"]')).toHaveClass(/highlighted-speech/);

    // The queue keeps advancing on its own scope.
    await page.evaluate(() => window.__cefrAudio.finishCurrent());
    await waitForUtterance(page, 3);
    expect(await page.evaluate(() => window.__cefrAudio.utterances[2].text)).toBe('Guten Tag!');
    // The star now shows favorited and the row itself is unchanged.
    await expect(page.locator('tr[data-id="1-5"] span[title="Toggle Favorite"]')).toHaveCSS('filter', 'grayscale(0)');
    await page.locator('#btn-stop-words').click();
  });

  // Required test B — Favorites membership restoration (empty -> non-empty).
  test('[AUDIO-003-C1] adding a favorite from the flashcard restores the empty Favorites scope and Start At agrees with playback', async ({ page }) => {
    await initLevel(page, 'a1');

    // Empty Favorites filter: zero rows, zero Start At options.
    await page.locator('#type-filter').selectOption('fav');
    await page.waitForFunction(() => document.querySelectorAll('#glossary-tbody tr[data-id]').length === 0);
    expect(await startOptionValues(page)).toEqual([]);

    // Add a favorite through an authorized UI path: the shared-card favorite
    // button (shuffle off first so the card queue order is deterministic).
    await page.locator('button', { hasText: 'Flashcards' }).click();
    await page.waitForSelector('#fc-card-mount .verb-flashcard');
    await page.locator('#shuffle-btn').click();
    await expect(page.locator('#shuffle-btn')).toHaveText(/Shuffle: OFF/);
    await page.locator('#fc-card-mount [data-action="fav"]').click();

    // Back on the glossary the Favorites-filter result includes exactly the
    // new favorite, and Start At was rebuilt from that same scope.
    await page.locator('#view-flashcard button', { hasText: 'Back to List' }).click();
    await page.waitForFunction(() => document.querySelectorAll('#glossary-tbody tr[data-id]').length === 1);
    await expect(page.locator('tr[data-id="1-0"]')).toHaveCount(1);
    expect(await startOptionValues(page)).toEqual(['1-0']);

    // Autoplay from that selection speaks exactly the selected card: the
    // option id, first utterance, highlighted row, and progress identity
    // all reference the same card.
    await configure(page, { repeat: 1, mode: 'none', include: false });
    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 1);
    expect(await page.evaluate(() => window.__cefrAudio.utterances[0].text)).toBe('Hallo!');
    await expect(page.locator('tr[data-id="1-0"]')).toHaveClass(/highlighted-speech/);
    await expect(page.locator('#words-audio-progress')).toHaveText('1 / 1 · Hallo!');
    await page.locator('#btn-stop-words').click();
  });

  // Required test C — Hide Mixed and Start At use one identity space
  // (Finding 2).
  test('[AUDIO-003-C1] Hide Mixed rebuilds Start At from the speakable scope and the selected card is the card spoken', async ({ page }) => {
    await initLevel(page, 'a1');
    await configure(page, { repeat: 1, mode: 'none', include: false });

    // Deterministic mixed visibility: the render draws exactly one
    // Math.random per row, so an alternating override hides the German
    // column of every EVEN-index card (1-0, 1-2, ...) and leaves every
    // ODD-index card speakable (15 of 30).
    await page.evaluate(() => {
      window.__mixedRandomCalls = 0;
      Math.random = () => (window.__mixedRandomCalls++ % 2 === 0 ? 0.99 : 0.01);
    });
    await page.locator('button', { hasText: 'Hide Mixed' }).click();

    // Start At is rebuilt from the exact speakable-card collection playback
    // uses: the 15 odd-index card ids, in unit order.
    const expectedIds = ['1-1', '1-3', '1-5', '1-7', '1-9', '1-11', '1-13', '1-15', '1-17', '1-19', '1-21', '1-23', '1-25', '1-27', '1-29'];
    expect(await startOptionValues(page)).toEqual(expectedIds);
    const lastOption = await page.evaluate(() => {
      const options = document.getElementById('auto-start-word').options;
      const last = options[options.length - 1];
      return { value: last.value, label: last.textContent.trim() };
    });
    expect(lastOption).toEqual({ value: '1-29', label: '15. sehr' });

    // The final visible/speakable option identifies the exact first card
    // spoken: same option id, same utterance, same highlighted row, same
    // progress identity.
    await configure(page, { start: '1-29' });
    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 1);
    expect(await page.evaluate(() => window.__cefrAudio.utterances[0].text)).toBe('sehr');
    await expect(page.locator('tr[data-id="1-29"]')).toHaveClass(/highlighted-speech/);
    await expect(page.locator('#words-audio-progress')).toHaveText('1 / 1 · sehr');
    await page.evaluate(() => document.getElementById('btn-stop-words').click());

    // A middle selection speaks its own card first, then the next speakable
    // cards in unit order — no hidden (even-index) German row is ever
    // spoken and the unit order stays intact.
    await configure(page, { start: '1-15' });
    await page.locator('#btn-play-all-words').click();
    await drive(page, 3);
    const spoken = await page.evaluate(() => window.__cefrAudio.utterances.slice(1).map(u => u.text));
    expect(spoken).toEqual(['Entschuldigung!', 'sein', 'gehen']);
    await page.locator('#btn-stop-words').click();
  });

  // Required test D — context rebuild matrix: Start At and the actual queue
  // stay on one identical scope across Hide German, Reveal All, a type
  // filter change, a unit change, and empty-to-non-empty restoration.
  test('[AUDIO-003-C1] context changes keep Start At and the actual queue on the same scope', async ({ page }) => {
    await initLevel(page, 'a1');
    await configure(page, { repeat: 1, mode: 'none', include: false });

    // Baseline: the full unit 1 scope, and the queue starts at its first
    // card.
    expect(await startOptionValues(page)).toEqual(Array.from({ length: 30 }, (_, i) => `1-${i}`));
    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 1);
    expect(await page.evaluate(() => window.__cefrAudio.utterances[0].text)).toBe('Hallo!');
    await expect(page.locator('tr[data-id="1-0"]')).toHaveClass(/highlighted-speech/);
    await page.evaluate(() => document.getElementById('btn-stop-words').click());

    // Hide German empties the speakable scope: zero Start At options and
    // pressing Play is a clean no-op.
    await page.locator('button', { hasText: 'Hide German' }).click();
    expect(await startOptionValues(page)).toEqual([]);
    await page.locator('#btn-play-all-words').click();
    await expectWordsCancelled(page);

    // Reveal All restores the same full scope, Start At included.
    await page.locator('button', { hasText: 'Reveal All' }).click();
    expect(await startOptionValues(page)).toEqual(Array.from({ length: 30 }, (_, i) => `1-${i}`));
    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 2);
    expect(await page.evaluate(() => window.__cefrAudio.utterances[1].text)).toBe('Hallo!');
    await expect(page.locator('tr[data-id="1-0"]')).toHaveClass(/highlighted-speech/);
    await page.evaluate(() => document.getElementById('btn-stop-words').click());

    // A type-filter change scopes the table and Start At to the verbs.
    await page.locator('#type-filter').selectOption('v');
    await page.waitForFunction(() => document.querySelectorAll('#glossary-tbody tr[data-id]').length === 4);
    expect(await startOptionValues(page)).toEqual(['1-16', '1-17', '1-18', '1-19']);
    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 3);
    expect(await page.evaluate(() => window.__cefrAudio.utterances[2].text)).toBe('heißen');
    await expect(page.locator('tr[data-id="1-16"]')).toHaveClass(/highlighted-speech/);
    await page.evaluate(() => document.getElementById('btn-stop-words').click());

    // A unit change rebuilds Start At from the new unit's scope.
    await page.locator('#type-filter').selectOption('all');
    await page.waitForFunction(() => document.querySelectorAll('#glossary-tbody tr[data-id]').length === 30);
    await page.evaluate(() => window.app.switchUnit(1));
    await page.waitForSelector('tr[data-id="2-0"]');
    const unit2Ids = await startOptionValues(page);
    expect(unit2Ids.length).toBe(43);
    expect(unit2Ids[0]).toBe('2-0');
    expect(unit2Ids[42]).toBe('2-42');
    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 4);
    expect(await page.evaluate(() => window.__cefrAudio.utterances[3].text)).toBe('der Beruf');
    await expect(page.locator('tr[data-id="2-0"]')).toHaveClass(/highlighted-speech/);
    await page.evaluate(() => document.getElementById('btn-stop-words').click());

    // Empty-to-non-empty restoration through the same control path: the
    // favourites filter empties the scope; returning to 'all' restores it.
    await page.locator('#type-filter').selectOption('fav');
    await page.waitForFunction(() => document.querySelectorAll('#glossary-tbody tr[data-id]').length === 0);
    expect(await startOptionValues(page)).toEqual([]);
    await page.locator('#type-filter').selectOption('all');
    await page.waitForFunction(() => document.querySelectorAll('#glossary-tbody tr[data-id]').length === 43);
    const restoredIds = await startOptionValues(page);
    expect(restoredIds.length).toBe(43);
    expect(restoredIds[0]).toBe('2-0');
    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 5);
    expect(await page.evaluate(() => window.__cefrAudio.utterances[4].text)).toBe('der Beruf');
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
    // AUDIO-003-C1: stable word id of the last card (former numeric '29').
    await page.locator('#auto-start-word').selectOption('1-29');

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
