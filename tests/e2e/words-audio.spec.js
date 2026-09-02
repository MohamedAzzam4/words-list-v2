const { test, expect } = require('@playwright/test');

test.describe('Words Play All Audio Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Mock speechSynthesis deterministically BEFORE navigation
    await page.addInitScript(() => {
      window.__mockTTS = { currentUtterance: null, speakCount: 0 };
      const mockSpeechSynthesis = {
        speaking: false,
        paused: false,
        pending: false,
        getVoices: () => [{ lang: 'de-DE', name: 'Mock Voice' }],
        speak: (utterance) => {
          mockSpeechSynthesis.speaking = true;
          window.__mockTTS.currentUtterance = utterance;
          window.__mockTTS.speakCount++;
          if (utterance.onend) {
            setTimeout(() => {
              mockSpeechSynthesis.speaking = false;
              utterance.onend(new Event('end'));
            }, 50);
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
        constructor(text) { this.text = text; }
      };
    });
  });

  async function initEmptyProgressAndOpen(page) {
    await page.goto('/index.html');
    await page.evaluate(() => {
      localStorage.removeItem('german_app_progress_german-a1-app');
    });
    await page.waitForSelector('.a1-card');
    await page.locator('.a1-card').click();
    await page.waitForSelector('.nav-item');
    await page.waitForFunction('window.app !== undefined');
  }

  test('Play all words highlights rows and respects filters', async ({ page }) => {
    await initEmptyProgressAndOpen(page);
    
    // Make sure we are on the Words tab
    await page.click('#tab-words');
    
    // Wait for glossary table to populate
    await page.waitForSelector('#glossary-tbody tr');
    
    const rows = await page.$$('#glossary-tbody tr');
    expect(rows.length).toBeGreaterThan(0);
    
    // Click Play All
    await page.click('#btn-play-all-words');
    
    // Check if button is in playing state
    await expect(page.locator('#btn-play-all-words')).toHaveClass(/playing/);
    
    // Wait for at least one row to be highlighted
    await page.waitForSelector('#glossary-tbody tr.highlighted-speech');
    
    // Stop the playback
    await page.click('#btn-stop-words');
    
    // Check if button reverted
    await expect(page.locator('#btn-play-all-words')).not.toHaveClass(/playing/);
    
    // Check if highlights are cleared
    const highlightedRows = await page.$$('#glossary-tbody tr.highlighted-speech');
    expect(highlightedRows.length).toBe(0);
  });

  // AUDIO-003: the Stop button must also clear the highlighted row (the
  // known baseline defect this package fixes), and the same clearing must
  // hold across navigation, filter changes, queue replacement, and natural
  // completion. The mock auto-completes each utterance after 50ms, so these
  // tests await observable control/queue states instead of sleeping.

  async function playAndAwaitFirstHighlight(page) {
    await page.click('#btn-play-all-words');
    await expect(page.locator('#btn-play-all-words')).toHaveClass(/playing/);
    await page.waitForSelector('#glossary-tbody tr.highlighted-speech');
  }

  async function expectRestingAndCleared(page) {
    await expect(page.locator('#btn-play-all-words')).not.toHaveClass(/playing/);
    await expect(page.locator('#btn-play-all-words')).toHaveText(/Play All/);
    const highlightedRows = await page.$$('#glossary-tbody tr.highlighted-speech');
    expect(highlightedRows.length).toBe(0);
    const speaking = await page.evaluate(() => window.speechSynthesis.speaking);
    expect(speaking).toBe(false);
  }

  test('Highlights clear after unit navigation', async ({ page }) => {
    await initEmptyProgressAndOpen(page);
    await page.click('#tab-words');
    await page.waitForSelector('#glossary-tbody tr');

    await playAndAwaitFirstHighlight(page);

    // Switching to another unit cancels the queue and clears the highlight.
    await page.evaluate(() => window.app.switchUnit(1));
    await page.waitForSelector('tr[data-id="2-0"]');
    await expectRestingAndCleared(page);
  });

  test('Highlights clear after a filter change and the queue stops', async ({ page }) => {
    await initEmptyProgressAndOpen(page);
    await page.click('#tab-words');
    await page.waitForSelector('#glossary-tbody tr');

    await playAndAwaitFirstHighlight(page);
    const speakCountAtFilterChange = await page.evaluate(() => window.__mockTTS.speakCount);

    // An 'e' (expressions) filter keeps row 1-0 rendered, so a live queue
    // could keep highlighting and speaking it; the change must cancel.
    await page.locator('#type-filter').selectOption('e');
    await expectRestingAndCleared(page);

    // No further utterance may appear after the cancellation.
    const speakCountAfter = await page.evaluate(() => window.__mockTTS.speakCount);
    expect(speakCountAfter).toBe(speakCountAtFilterChange);
  });

  test('Highlights clear after rapid queue replacement and re-highlight only the current row', async ({ page }) => {
    await initEmptyProgressAndOpen(page);
    await page.click('#tab-words');
    await page.waitForSelector('#glossary-tbody tr');

    await playAndAwaitFirstHighlight(page);
    await page.click('#btn-stop-words');
    await expectRestingAndCleared(page);

    // A restart replaces the queue: exactly one highlighted row again.
    await playAndAwaitFirstHighlight(page);
    const highlighted = await page.$$('#glossary-tbody tr.highlighted-speech');
    expect(highlighted.length).toBe(1);
    await page.click('#btn-stop-words');
    await expectRestingAndCleared(page);
  });

  test('Highlights clear after natural completion', async ({ page }) => {
    await initEmptyProgressAndOpen(page);
    await page.click('#tab-words');
    await page.waitForSelector('#glossary-tbody tr');

    // Minimal queue: start at the last card, one repeat, no examples, no
    // translation -> a single utterance that the mock completes itself.
    await page.locator('#btn-toggle-audio-settings').click();
    await page.locator('#auto-repeat-count').selectOption('1');
    await page.locator('#auto-example-mode').selectOption('none');
    await page.locator('#auto-include-en').uncheck();
    await page.locator('#auto-start-word').selectOption('29');

    await page.click('#btn-play-all-words');
    await expect(page.locator('#btn-play-all-words')).toHaveClass(/playing/);
    await page.waitForSelector('#glossary-tbody tr.highlighted-speech');

    // The queue drains through the mock's automatic completion: controls
    // reset and no highlight survives the natural completion.
    await expectRestingAndCleared(page);
    const speakCount = await page.evaluate(() => window.__mockTTS.speakCount);
    expect(speakCount).toBe(1);
  });
});
