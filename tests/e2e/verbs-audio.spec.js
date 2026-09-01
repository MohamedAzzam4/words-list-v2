import { test, expect } from '@playwright/test';

// AUDIO-002: Verbs autoplay through the real controller with a deterministic
// speechSynthesis double (TS-TEST-004: mock the browser speech platform, not
// the application logic). A separate spec from verbs.spec.js on purpose: the
// harness must be installed via addInitScript BEFORE verbs.html boots, and
// verbs.spec.js stays an untouched regression anchor for the same controls.
//
// Contract refs: AC-11 (repeat/examples/include-translation/start-at form the
// exact deterministic speech steps), AC-12 (lifecycle, highlight, floating
// state agree with the queue; stale callbacks cannot restart or advance it),
// LF-AUDIO (autoplay controls), TS-TEST-005 (event/state waits, no sleeps).

test.describe('AUDIO-002 Verbs Autoplay Adapter (deterministic speech mocks)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.__verbsAudio = { utterances: [], current: null, speakCount: 0, stale: null };
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
          window.__verbsAudio.utterances.push({ text: utterance.text, lang: utterance.lang });
          window.__verbsAudio.current = utterance;
          window.__verbsAudio.speakCount++;
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
      // Simulate natural completion of the current utterance.
      window.__verbsAudio.finishCurrent = () => {
        const utterance = window.__verbsAudio.current;
        if (utterance && utterance.onend) {
          mockSpeechSynthesis.speaking = false;
          utterance.onend(new Event('end'));
        }
      };
    });
    await page.goto('/verbs.html');
    await page.waitForSelector('#view-glossary');
    await page.waitForFunction(
      () => window.verbsEngine && window.verbsEngine.queue && window.verbsEngine.queue.length > 0
    );
  });

  async function waitForUtterance(page, count) {
    await page.waitForFunction(
      (expected) => window.__verbsAudio.speakCount >= expected,
      count
    );
  }

  async function openSettings(page) {
    await page.locator('#btn-toggle-audio-settings').click();
  }

  test('[AUDIO-002] real controller speaks the exact planned sequence with per-step language', async ({ page }) => {
    await openSettings(page);
    await page.locator('#auto-repeat-count').selectOption('2');
    await page.locator('#auto-example-mode').selectOption('first');
    await page.locator('#auto-include-en').check();

    await page.locator('#btn-play-all-words').click();
    await expect(page.locator('#btn-play-all-words')).toHaveText(/Auto Playing/);

    // The first verb's row is highlighted and the floating pill shows it.
    await expect(page.locator('tr[data-id="v_werden"]')).toHaveClass(/highlighted-speech/);
    await expect(page.locator('#fab-current-verb')).toHaveText(/Playing: #1 werden/);
    await expect(page.locator('#floating-audio-bar')).toBeVisible();

    // Drive nine utterances: two full repetitions of verb 1 (term, English
    // translation, German example, English example) plus verb 2's term.
    for (let i = 1; i <= 9; i++) {
      await waitForUtterance(page, i);
      await page.evaluate(() => window.__verbsAudio.finishCurrent());
    }

    const spoken = await page.evaluate(() => window.__verbsAudio.utterances.slice(0, 9));
    expect(spoken).toEqual([
      { text: 'werden', lang: 'de-DE' },
      { text: 'to become, to get, to turn', lang: 'en-US' },
      { text: 'Ich werde Lehrer.', lang: 'de-DE' },
      { text: 'I become a teacher.', lang: 'en-US' },
      { text: 'werden', lang: 'de-DE' },
      { text: 'to become, to get, to turn', lang: 'en-US' },
      { text: 'Ich werde Lehrer.', lang: 'de-DE' },
      { text: 'I become a teacher.', lang: 'en-US' },
      { text: 'haben', lang: 'de-DE' }
    ]);

    // Still playing the second verb now.
    await expect(page.locator('tr[data-id="v_haben"]')).toHaveClass(/highlighted-speech/);
    await page.locator('#btn-stop-words').click();
  });

  test('[AUDIO-002] pause and resume keep the current position without skipping or duplicating an item', async ({ page }) => {
    await openSettings(page);
    await page.locator('#auto-repeat-count').selectOption('1');
    await page.locator('#auto-example-mode').selectOption('first');
    await page.locator('#auto-include-en').check();

    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 1); // 'werden'
    await page.evaluate(() => window.__verbsAudio.finishCurrent());
    await waitForUtterance(page, 2); // 'to become, to get, to turn'

    // Pause while the translation utterance is live.
    await page.locator('#btn-pause-words').click();
    await expect(page.locator('#btn-pause-words')).toHaveText(/Resume/);
    await expect(page.locator('#fab-pause-icon')).toHaveText(/▶️/);
    await expect(page.locator('#floating-audio-bar')).toBeVisible();

    // A late onend for the canceled utterance must be a no-op (browser
    // behavior after cancel()).
    await page.evaluate(() => window.__verbsAudio.finishCurrent());
    const speakCountAfterStale = await page.evaluate(() => window.__verbsAudio.speakCount);

    // Resume: the SAME item plays again exactly once, then the queue moves on.
    await page.locator('#btn-pause-words').click();
    await expect(page.locator('#btn-pause-words')).toHaveText(/Pause/);
    await waitForUtterance(page, 3);
    await page.evaluate(() => window.__verbsAudio.finishCurrent());
    await waitForUtterance(page, 4);
    const spoken = await page.evaluate(() => window.__verbsAudio.utterances.slice(1, 4));
    expect(spoken).toEqual([
      { text: 'to become, to get, to turn', lang: 'en-US' }, // item live when paused
      { text: 'to become, to get, to turn', lang: 'en-US' }, // same item, replayed on resume
      { text: 'Ich werde Lehrer.', lang: 'de-DE' }           // next item after finishing it
    ]);
    const speakCount = await page.evaluate(() => window.__verbsAudio.speakCount);
    expect(speakCount).toBe(speakCountAfterStale + 2);
    await page.locator('#btn-stop-words').click();
  });

  test('[AUDIO-002] stop cancels future speech, clears highlights, hides the floating player, and resets the controls', async ({ page }) => {
    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 1);

    await expect(page.locator('tr[data-id="v_werden"]')).toHaveClass(/highlighted-speech/);
    await expect(page.locator('#floating-audio-bar')).toBeVisible();

    await page.locator('#btn-stop-words').click();

    await expect(page.locator('#btn-play-all-words')).toHaveText(/Auto Play Audio/);
    await expect(page.locator('#floating-audio-bar')).toHaveClass(/hidden/);
    await expect(page.locator('tr.highlighted-speech')).toHaveCount(0);
    await expect(page.locator('#auto-start-verb')).toHaveValue('0');
    const speaking = await page.evaluate(() => window.speechSynthesis.speaking);
    expect(speaking).toBe(false);

    // Nothing else may speak after the stop, proven deterministically by the
    // next restart beginning exactly at the first item with no extra speech.
    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 2);
    const afterRestart = await page.evaluate(() => ({
      count: window.__verbsAudio.speakCount,
      first: window.__verbsAudio.utterances[1]
    }));
    expect(afterRestart.count).toBe(2);
    expect(afterRestart.first).toEqual({ text: 'werden', lang: 'de-DE' });
    await page.locator('#btn-stop-words').click();
  });

  test('[AUDIO-002] completing the queue resets the controls exactly once and speaks every planned step exactly once', async ({ page }) => {
    await openSettings(page);
    await page.locator('#auto-repeat-count').selectOption('1');
    await page.locator('#auto-example-mode').selectOption('none');
    await page.locator('#auto-include-en').uncheck();
    // Start near the end so the whole remaining queue can be driven to drain.
    await page.locator('#auto-start-verb').selectOption('47');

    await page.locator('#btn-play-all-words').click();
    await expect(page.locator('#btn-play-all-words')).toHaveText(/Auto Playing/);

    for (let i = 1; i <= 3; i++) {
      await waitForUtterance(page, i);
      await page.evaluate(() => window.__verbsAudio.finishCurrent());
    }

    // The queue drains synchronously on the last completion: controls reset.
    await expect(page.locator('#btn-play-all-words')).toHaveText(/Auto Play Audio/);
    await expect(page.locator('#floating-audio-bar')).toHaveClass(/hidden/);
    await expect(page.locator('#btn-pause-words')).toHaveClass(/hidden/);

    const spoken = await page.evaluate(() => window.__verbsAudio.utterances);
    expect(spoken).toEqual([
      { text: 'ziehen', lang: 'de-DE' },
      { text: 'laufen', lang: 'de-DE' },
      { text: 'versuchen', lang: 'de-DE' }
    ]);
    const speakCount = await page.evaluate(() => window.__verbsAudio.speakCount);
    expect(speakCount).toBe(3);
  });

  test('[AUDIO-002] row-play starts at that row and syncs the Start-At dropdown', async ({ page }) => {
    await page.locator('button[data-action="play-from-row"]').nth(2).click();
    await waitForUtterance(page, 1);

    const first = await page.evaluate(() => window.__verbsAudio.utterances[0]);
    expect(first).toEqual({ text: 'sein', lang: 'de-DE' });
    await expect(page.locator('tr[data-id="v_sein"]')).toHaveClass(/highlighted-speech/);
    await expect(page.locator('#auto-start-verb')).toHaveValue('2');
    await expect(page.locator('#fab-current-verb')).toHaveText(/Playing: #3 sein/);
    await page.locator('#btn-stop-words').click();
  });

  test('[AUDIO-002] a rapid restart replaces the queue exactly once and stale utterance callbacks cannot disturb it', async ({ page }) => {
    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 1); // old queue's first utterance exists
    await page.evaluate(() => { window.__verbsAudio.stale = window.__verbsAudio.current; });

    // Replace the queue by starting from the third row.
    await page.locator('button[data-action="play-from-row"]').nth(2).click();
    await waitForUtterance(page, 2);
    const replacementFirst = await page.evaluate(() => window.__verbsAudio.utterances[1]);
    expect(replacementFirst).toEqual({ text: 'sein', lang: 'de-DE' });

    // The replaced queue's utterance fires a late onend: it must be a no-op.
    await page.evaluate(() => {
      window.__verbsAudio.stale.onend(new Event('end'));
    });

    // The replacement continues its own sequence untouched.
    await page.evaluate(() => window.__verbsAudio.finishCurrent());
    await waitForUtterance(page, 3);
    const third = await page.evaluate(() => window.__verbsAudio.utterances[2]);
    expect(third).toEqual({ text: 'to be', lang: 'en-US' });
    const speakCount = await page.evaluate(() => window.__verbsAudio.speakCount);
    expect(speakCount).toBe(3);
    await page.locator('#btn-stop-words').click();
  });

  test('[AUDIO-002] individual pronunciation stops the autoplay queue and speaks only that item', async ({ page }) => {
    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 1); // 'werden'

    await page.locator('.verb-infinitive-click').nth(1).click();
    await waitForUtterance(page, 2);

    const single = await page.evaluate(() => window.__verbsAudio.utterances[1]);
    expect(single).toEqual({ text: 'haben', lang: 'de-DE' });
    await expect(page.locator('#btn-play-all-words')).toHaveText(/Auto Play Audio/);
    await expect(page.locator('#floating-audio-bar')).toHaveClass(/hidden/);
    await expect(page.locator('tr.highlighted-speech')).toHaveCount(0);
  });

  test('[AUDIO-002] an empty filtered queue never enters the playing state', async ({ page }) => {
    await page.fill('#verbs-search-input', 'zzzzqqqq');
    // The search handler empties the queue; the stale table markup may remain
    // (renderTable early-returns on an empty queue), so await the queue state.
    await page.waitForFunction(() => window.verbsEngine.queue.length === 0);

    await page.locator('#btn-play-all-words').click();

    await expect(page.locator('#btn-play-all-words')).toHaveText(/Auto Play Audio/);
    const speakCount = await page.evaluate(() => window.__verbsAudio.speakCount);
    expect(speakCount).toBe(0);
  });
});
