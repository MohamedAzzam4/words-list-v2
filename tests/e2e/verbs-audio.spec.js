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

  // ── AUDIO-002-C1: navigation and queue-context ownership cancellation ──
  // Owner review finding: autoplay was not cancelled when the visible
  // navigation or queue context changed (deck switch, view navigation, search
  // change) and the playAllVerbsAudio() early returns could leave a previous
  // SpeechQueue session alive. These tests are RED on the accepted base
  // 1080ac7 and drive the real controller through the real page.

  async function expectAutoplayCancelled(page) {
    await expect(page.locator('#btn-play-all-words')).toHaveText(/Auto Play Audio/);
    await expect(page.locator('#btn-play-all-words')).not.toHaveClass(/playing/);
    await expect(page.locator('#btn-pause-words')).toHaveClass(/hidden/);
    await expect(page.locator('#floating-audio-bar')).toHaveClass(/hidden/);
    await expect(page.locator('tr.highlighted-speech')).toHaveCount(0);
    const speaking = await page.evaluate(() => window.speechSynthesis.speaking);
    expect(speaking).toBe(false);
  }

  test('[AUDIO-002-C1] selecting another deck cancels the running autoplay and leaves the new deck intact', async ({ page }) => {
    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 1);
    await expect(page.locator('#btn-play-all-words')).toHaveText(/Auto Playing/);
    await expect(page.locator('tr[data-id="v_werden"]')).toHaveClass(/highlighted-speech/);
    await expect(page.locator('#floating-audio-bar')).toBeVisible();
    await page.evaluate(() => { window.__verbsAudio.stale = window.__verbsAudio.current; });

    // Navigation: select deck 2 in the deck tracker (owner repro 1).
    await page.locator('.deck-chip-card[data-deck-id="2"]').click();

    await expectAutoplayCancelled(page);
    // The newly selected deck context is intact.
    await expect(page.locator('#verbs-deck-title')).toHaveText('Deck 2 (Verbs 51–100)');
    await expect(page.locator('tr[data-id="v_tragen"]')).toHaveCount(1);
    const newDeck = await page.evaluate(() => ({
      deckId: window.verbsEngine.currentDeckId,
      queueLength: window.verbsEngine.queue.length
    }));
    expect(newDeck).toEqual({ deckId: 2, queueLength: 50 });

    // The cancelled session's late onend/onerror callbacks are no-ops.
    await page.evaluate(() => {
      window.__verbsAudio.stale.onend(new Event('end'));
      window.__verbsAudio.stale.onerror({ error: 'synthesis-failed' });
    });
    await expectAutoplayCancelled(page);

    // Restart on the new deck begins exactly at the new deck's first verb,
    // proving no orphaned old-queue utterance was spoken in between.
    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 2);
    const spoken = await page.evaluate(() => ({
      count: window.__verbsAudio.speakCount,
      last: window.__verbsAudio.utterances[1]
    }));
    expect(spoken.count).toBe(2);
    expect(spoken.last).toEqual({ text: 'tragen', lang: 'de-DE' });
    await page.locator('#btn-stop-words').click();
  });

  test('[AUDIO-002-C1] a paused autoplay session is cancelled, not resumed, when the deck changes', async ({ page }) => {
    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 1);
    await page.locator('#btn-pause-words').click();
    await expect(page.locator('#btn-pause-words')).toHaveText(/Resume/);

    await page.locator('.deck-chip-card[data-deck-id="2"]').click();

    await expectAutoplayCancelled(page);
    // The Pause control is restored to its resting label, not left as Resume.
    await expect(page.locator('#btn-pause-words')).toHaveText(/Pause/);
    await expect(page.locator('#verbs-deck-title')).toHaveText('Deck 2 (Verbs 51–100)');

    // Play on the new deck speaks the new deck's first verb: the paused old
    // session is gone rather than resumed (its next item would be English).
    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 2);
    const spoken = await page.evaluate(() => ({
      count: window.__verbsAudio.speakCount,
      last: window.__verbsAudio.utterances[1]
    }));
    expect(spoken.count).toBe(2);
    expect(spoken.last).toEqual({ text: 'tragen', lang: 'de-DE' });
    await page.locator('#btn-stop-words').click();
  });

  test('[AUDIO-002-C1] a search that empties the queue cancels autoplay at input time and Play stays a clean no-op', async ({ page }) => {
    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 1);
    await page.evaluate(() => { window.__verbsAudio.stale = window.__verbsAudio.current; });

    // Navigation: a search producing an empty verb queue (owner repro 2).
    await page.fill('#verbs-search-input', 'zzzzqqqq');
    await page.waitForFunction(() => window.verbsEngine.queue.length === 0);

    // Cancellation happened when the context changed, not on a later reload.
    await expectAutoplayCancelled(page);

    // Pressing Play while the controller queue is empty is a clean no-op.
    await page.locator('#btn-play-all-words').click();
    await expectAutoplayCancelled(page);
    const speakCountAfterPlay = await page.evaluate(() => window.__verbsAudio.speakCount);
    expect(speakCountAfterPlay).toBe(1);

    // The cancelled session's late onend cannot resurrect anything.
    await page.evaluate(() => window.__verbsAudio.stale.onend(new Event('end')));
    await expectAutoplayCancelled(page);
  });

  test('[AUDIO-002-C1] a search that changes the result set cancels the old queue; only current verbs can speak', async ({ page }) => {
    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 1);
    await page.evaluate(() => { window.__verbsAudio.stale = window.__verbsAudio.current; });

    // Navigation: a search with a different non-empty result set (13 matches).
    await page.fill('#verbs-search-input', 'tragen');
    await page.waitForFunction(() => window.verbsEngine.queue.length === 13);

    await expectAutoplayCancelled(page);
    const context = await page.evaluate(() => ({
      firstId: window.verbsEngine.queue[0].id,
      firstIndex: window.verbsEngine.queue[0].index
    }));
    expect(context).toEqual({ firstId: 'v_tragen', firstIndex: 51 });

    // The old queue's late onend is a no-op.
    await page.evaluate(() => window.__verbsAudio.stale.onend(new Event('end')));

    // Restart: only the filtered (current) verbs speak.
    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 2);
    const spoken = await page.evaluate(() => ({
      count: window.__verbsAudio.speakCount,
      last: window.__verbsAudio.utterances[1]
    }));
    expect(spoken.count).toBe(2);
    expect(spoken.last).toEqual({ text: 'tragen', lang: 'de-DE' });
    await expect(page.locator('tr[data-id="v_tragen"]')).toHaveClass(/highlighted-speech/);
    await page.locator('#btn-stop-words').click();
  });

  test('[AUDIO-002-C1] starting playback with an empty controller queue stops a previous session instead of leaving it alive', async ({ page }) => {
    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 1);
    await expect(page.locator('#btn-play-all-words')).toHaveText(/Auto Playing/);

    // The controller queue becomes empty by a path that did not itself cancel
    // (defense in depth for the empty-queue early return; synthetic state,
    // disclosed in the report — the Play path itself is the real controller).
    await page.evaluate(() => { window.verbsEngine.queue = []; });

    await page.locator('#btn-play-all-words').click();

    await expectAutoplayCancelled(page);
    const speakCount = await page.evaluate(() => window.__verbsAudio.speakCount);
    expect(speakCount).toBe(1);
  });

  test('[AUDIO-002-C1] a start attempt producing an empty planned sequence stops a previous session instead of leaving it alive', async ({ page }) => {
    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 1);
    await expect(page.locator('#btn-play-all-words')).toHaveText(/Auto Playing/);

    // Only an unspeakable verb remains, so the planned sequence is empty
    // (synthetic state, disclosed in the report; the Play path is real).
    await page.evaluate(() => {
      window.verbsEngine.queue = [{
        id: 'v_synthetic_mute', index: 999, infinitive: '', meaning: '',
        exampleDe: '', exampleEn: '', tags: [], prefixInfo: {}, conjugation: {}
      }];
    });

    await page.locator('#btn-play-all-words').click();

    await expectAutoplayCancelled(page);
    const speakCount = await page.evaluate(() => window.__verbsAudio.speakCount);
    expect(speakCount).toBe(1);
  });

  test('[AUDIO-002-C1] navigating to another view cancels autoplay and hides the floating player', async ({ page }) => {
    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 1);
    await page.evaluate(() => { window.__verbsAudio.stale = window.__verbsAudio.current; });

    // View navigation away from the glossary autoplay context (the sidebar
    // items call exactly this controller method; the floating player lives
    // outside the view containers, so only cancellation can hide it).
    await page.evaluate(() => window.verbsEngine.switchView('dashboard'));

    await expectAutoplayCancelled(page);
    await expect(page.locator('#view-dashboard')).not.toHaveClass(/hidden/);
    await expect(page.locator('#view-glossary')).toHaveClass(/hidden/);

    // The cancelled session's late onend is a no-op.
    await page.evaluate(() => window.__verbsAudio.stale.onend(new Event('end')));
    await expectAutoplayCancelled(page);

    // Returning to the glossary presents the deck intact with no session.
    await page.evaluate(() => window.verbsEngine.switchView('glossary'));
    await expect(page.locator('#view-glossary')).not.toHaveClass(/hidden/);
    await expectAutoplayCancelled(page);
  });

  test('[AUDIO-002-C1] a stale callback from the replaced queue cannot advance the new session after navigation', async ({ page }) => {
    // Verb-only mode so every session's sequence is one step per verb and the
    // exact utterance list is a direct ownership fingerprint.
    await openSettings(page);
    await page.locator('#auto-repeat-count').selectOption('1');
    await page.locator('#auto-example-mode').selectOption('none');
    await page.locator('#auto-include-en').uncheck();

    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 1); // 'werden'
    await page.evaluate(() => window.__verbsAudio.finishCurrent());
    await waitForUtterance(page, 2); // 'haben'
    await page.evaluate(() => { window.__verbsAudio.stale = window.__verbsAudio.current; });

    // Replace the session via navigation (deck change) + a fresh Play.
    await page.locator('.deck-chip-card[data-deck-id="2"]').click();
    await page.locator('#btn-play-all-words').click();
    await waitForUtterance(page, 3); // 'tragen' (deck 2)
    await expect(page.locator('tr[data-id="v_tragen"]')).toHaveClass(/highlighted-speech/);

    // The replaced session's late onend fires while the new session owns the
    // speaker: it must not advance anything — the current row stays put and
    // no extra utterance appears.
    await page.evaluate(() => window.__verbsAudio.stale.onend(new Event('end')));
    await expect(page.locator('tr[data-id="v_tragen"]')).toHaveClass(/highlighted-speech/);
    await expect(page.locator('tr[data-id="v_gewinnen"]')).not.toHaveClass(/highlighted-speech/);
    const afterStale = await page.evaluate(() => window.__verbsAudio.speakCount);
    expect(afterStale).toBe(3);

    // The new session continues its own exact verb-only sequence.
    await page.evaluate(() => window.__verbsAudio.finishCurrent()); // finish 'tragen'
    await waitForUtterance(page, 4); // 'gewinnen'
    await page.evaluate(() => window.__verbsAudio.finishCurrent());
    await waitForUtterance(page, 5); // 'fallen'
    const spoken = await page.evaluate(() => window.__verbsAudio.utterances.slice(0, 5));
    expect(spoken).toEqual([
      { text: 'werden', lang: 'de-DE' },
      { text: 'haben', lang: 'de-DE' },
      { text: 'tragen', lang: 'de-DE' },
      { text: 'gewinnen', lang: 'de-DE' },
      { text: 'fallen', lang: 'de-DE' }
    ]);
    await page.locator('#btn-stop-words').click();
  });
});
