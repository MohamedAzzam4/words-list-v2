import { test, expect } from '@playwright/test';

test.describe('Spaced Repetition System (SRS) E2E Suite', () => {
  let consoleErrors = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    page.on('console', msg => {
      console.log(`[Browser Console ${msg.type()}] ${msg.text()}`);
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', err => {
      console.log(`[Browser Uncaught Error] ${err.message}\nStack: ${err.stack}`);
      consoleErrors.push(`[Page Error] ${err.message}\nStack: ${err.stack}`);
    });

    // Mock speechSynthesis deterministically
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

  test.afterEach(async () => {
    if (consoleErrors.length > 0) {
      console.error('Console errors detected during test execution:', consoleErrors);
    }
  });

  async function initEmptyProgressAndOpen(page) {
    await page.goto('/index.html');
    // Clear localStorage to start clean
    await page.evaluate(() => {
      localStorage.removeItem('german_app_progress_german-a1-app');
    });
    // Go to A1
    await page.waitForSelector('.a1-card');
    await page.locator('.a1-card').click();
    await page.waitForSelector('.nav-item');
    await page.waitForFunction('window.app !== undefined');
  }

  test('SRS Level Progression and Time Machine Verification', async ({ page }) => {
    await initEmptyProgressAndOpen(page);

    // Go to Flashcards tab
    await page.locator('button', { hasText: 'Flashcards' }).click();
    await page.waitForSelector('.flashcard-container');

    // Ensure we are in "Learning" filter by default or click it
    await page.locator('#filter-learning-btn').click();

    // Tap to flip the card to enable controls
    await page.locator('#active-flashcard').click();

    // Click "Got it" (mark correct)
    await page.locator('.fc-btn.btn-known').click();

    // Wait for progress to be saved in localStorage
    await page.waitForFunction(() => {
      const raw = localStorage.getItem('german_app_progress_german-a1-app');
      if (!raw) return false;
      const data = JSON.parse(raw);
      return data.known && data.known.length > 0;
    });

    const progress = await page.evaluate(() => {
      const raw = localStorage.getItem('german_app_progress_german-a1-app');
      return raw ? JSON.parse(raw) : {};
    });

    const knownIds = progress.known || [];
    expect(knownIds.length).toBe(1);
    const answeredWordId = knownIds[0];
    expect(answeredWordId).toBeDefined();

    const srsDataAfterCorrect = progress.srsData || {};
    const wordSrsState = srsDataAfterCorrect[answeredWordId];
    expect(wordSrsState).toBeDefined();
    expect(wordSrsState.level).toBe(1);

    // Call debug_shiftSRS(1) to simulate time travel (make Level 1 card due)
    // This will reload the page
    await page.evaluate(() => window.app.debug_shiftSRS(1));
    
    // Wait for reload, switch back to Flashcards
    await page.waitForFunction('window.app !== undefined');
    await page.locator('button', { hasText: 'Flashcards' }).click();
    await page.waitForSelector('.flashcard-container');

    // Filter by Learning again
    await page.locator('#filter-learning-btn').click();

    // Locate our card which should be back in the queue
    // (We will check if the dots container has 1 filled dot for that card)
    const dotsHtml = await page.locator('#fc-srs-dots').innerHTML();
    expect(dotsHtml).toContain('class="srs-dot filled"'); // Level 1 (1 filled dot)

    // Answer "Got it" again (Day 1) -> Level 2 (Due in 3 days)
    await page.locator('#active-flashcard').click();
    await page.locator('.fc-btn.btn-known').click();

    // Wait for level 2 to be saved
    await page.waitForFunction((wordId) => {
      const raw = localStorage.getItem('german_app_progress_german-a1-app');
      if (!raw) return false;
      const data = JSON.parse(raw);
      const srs = data.srsData || {};
      return srs[wordId] && srs[wordId].level === 2;
    }, answeredWordId);

    const progressLevel2 = await page.evaluate(() => {
      const raw = localStorage.getItem('german_app_progress_german-a1-app');
      return raw ? JSON.parse(raw) : {};
    });
    const srsDataLevel2 = progressLevel2.srsData || {};
    expect(srsDataLevel2[answeredWordId].level).toBe(2);

    // Call debug_shiftSRS(3) to make Level 2 card due
    await page.evaluate(() => window.app.debug_shiftSRS(3));
    
    // Wait for reload, switch back to Flashcards
    await page.waitForFunction('window.app !== undefined');
    await page.locator('button', { hasText: 'Flashcards' }).click();
    await page.waitForSelector('.flashcard-container');
    await page.locator('#filter-learning-btn').click();

    // Verify card is back in queue with Level 2 (2 filled dots)
    const level2DotsHtml = await page.locator('#fc-srs-dots').innerHTML();
    const filledDotsCount = (level2DotsHtml.match(/class="srs-dot filled"/g) || []).length;
    expect(filledDotsCount).toBe(2);

    // Verify Missed it (incorrect) logic -> Drop by 2 levels (min 1), so Level 2 -> Level 1
    await page.locator('#active-flashcard').click();
    await page.locator('.fc-btn.btn-learning').click(); // Missed it button

    // Wait for level 1 to be saved after miss
    await page.waitForFunction((wordId) => {
      const raw = localStorage.getItem('german_app_progress_german-a1-app');
      if (!raw) return false;
      const data = JSON.parse(raw);
      const srs = data.srsData || {};
      return srs[wordId] && srs[wordId].level === 1;
    }, answeredWordId);

    const progressAfterMiss = await page.evaluate(() => {
      const raw = localStorage.getItem('german_app_progress_german-a1-app');
      return raw ? JSON.parse(raw) : {};
    });
    const srsDataAfterMiss = progressAfterMiss.srsData || {};
    expect(srsDataAfterMiss[answeredWordId].level).toBe(1);

    // Verify knownIds STILL contains the word (gamification remains untouched)
    const knownIdsAfterMiss = progressAfterMiss.known || [];
    expect(knownIdsAfterMiss).toContain(answeredWordId);
  });
});
