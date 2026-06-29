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
});
