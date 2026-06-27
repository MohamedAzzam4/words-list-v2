import { test, expect } from '@playwright/test';

test.describe('Phrases and Conversations E2E Suite', () => {
  let consoleErrors = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    // Mock speechSynthesis deterministically.
    // Use Object.defineProperty because window.speechSynthesis is read-only.
    await page.addInitScript(() => {
      window.__mockTTS = { currentUtterance: null, speakCount: 0 };
      const mockSpeechSynthesis = {
        speaking: false,
        paused: false,
        pending: false,
        onvoiceschanged: null,
        getVoices: () => [{ lang: 'de-DE', name: 'Mock Voice' }],
        speak: (utterance) => {
          mockSpeechSynthesis.speaking = true;
          window.__mockTTS.currentUtterance = utterance;
          window.__mockTTS.speakCount++;
          // Fallback auto-fire after 5s to prevent infinite hangs in non-audio tests
          window.__mockTTS._fallbackTimer = setTimeout(() => {
            if (mockSpeechSynthesis.speaking) {
              mockSpeechSynthesis.speaking = false;
              if (utterance.onend) utterance.onend(new Event('end'));
            }
          }, 5000);
        },
        pause: () => { mockSpeechSynthesis.paused = true; },
        resume: () => { mockSpeechSynthesis.paused = false; },
        cancel: () => {
          mockSpeechSynthesis.speaking = false;
          if (window.__mockTTS._fallbackTimer) {
            clearTimeout(window.__mockTTS._fallbackTimer);
            window.__mockTTS._fallbackTimer = null;
          }
        }
      };
      Object.defineProperty(window, 'speechSynthesis', {
        value: mockSpeechSynthesis,
        configurable: true,
        writable: true
      });
      // Helper: test code calls this to simulate speech completion
      window.__mockTTS.finishCurrent = () => {
        const utt = window.__mockTTS.currentUtterance;
        if (utt && utt.onend) {
          mockSpeechSynthesis.speaking = false;
          utt.onend(new Event('end'));
        }
      };
      window.SpeechSynthesisUtterance = class {
        constructor(text) {
          this.text = text;
        }
      };
    });
  });

  // Helper: navigate to level page, wait for app, switch to unit
  async function navigateToUnit(page, unitIndex = 0) {
    await page.goto('/index.html');
    await page.waitForSelector('.a1-card');
    await page.locator('.a1-card').click();
    await page.waitForSelector('.nav-item');
    await page.waitForFunction('window.app !== undefined');
    await page.evaluate((idx) => window.app.switchUnit(idx), unitIndex);
  }

  test('Load App, default tabs, and existing words behavior', async ({ page }) => {
    await navigateToUnit(page, 0);

    // Words tab is default
    const activeTab = page.locator('.tab-btn.active');
    await expect(activeTab).toHaveText(/Words/);

    // Existing word pronunciation can be clicked
    await page.waitForSelector('#glossary-tbody tr[data-id]');
    const firstWordSpeaker = page.locator('#glossary-tbody tr[data-id] .speak-btn').first();
    await firstWordSpeaker.click(); // Mock should handle this without error

    // Existing word flashcards still work
    await page.locator('button', { hasText: 'Flashcards' }).click();
    await page.waitForSelector('.flashcard-container');
    await expect(page.locator('#fc-de')).toBeVisible();
    await page.locator('.btn-known').click(); // Mark known

    // Wait to ensure no console errors during Word flashcards
    await page.waitForTimeout(200);
    expect(consoleErrors).toHaveLength(0);
  });

  test('Phrases Tab Rendering and Flashcards', async ({ page }) => {
    await navigateToUnit(page, 0);

    // Phrases tab opens
    await page.locator('button[role="tab"]', { hasText: 'Phrases' }).click();

    // Phrase cards render
    await page.waitForSelector('.phrase-card');
    const phraseCards = page.locator('.phrase-card');
    await expect(phraseCards.first()).toBeVisible();

    // Individual phrase speaker can be clicked (speakPhrase adds highlighted-speech for 1500ms)
    const speakBtn = phraseCards.first().locator('.speak-btn').first();
    await speakBtn.click();

    // The speakPhrase function adds highlighted-speech and keeps it for 1500ms
    await expect(phraseCards.first()).toHaveClass(/highlighted-speech/, { timeout: 2000 });

    // Trigger mock onend to complete speech
    await page.evaluate(() => window.__mockTTS.finishCurrent());

    // After the 1500ms timeout in speakPhrase, highlight should be removed.
    // We wait for the class to be removed (speakPhrase uses 1500ms setTimeout).
    await expect(phraseCards.first()).not.toHaveClass(/highlighted-speech/, { timeout: 3000 });

    // Phrase meaning reveal works via flashcard mode
    await page.locator('button', { hasText: 'Flashcards' }).click();
    await page.waitForSelector('.flashcard-container');

    // Phrase flashcard shows, can flip and navigate
    await page.locator('.flashcard-inner').click(); // Flip to reveal meaning
    await expect(page.locator('#fc-en')).toBeVisible();
    await page.locator('button', { hasText: 'Next' }).click();

    expect(consoleErrors).toHaveLength(0);
  });

  test('SpeechQueue Play All, Stop, and Navigation Cleanup', async ({ page }) => {
    await navigateToUnit(page, 0);
    await page.locator('button[role="tab"]', { hasText: 'Phrases' }).click();

    // Wait for phrase cards to render
    await page.waitForSelector('.phrase-card');
    await page.waitForSelector('#btn-play-all-phrases');

    const playAllBtn = page.locator('#btn-play-all-phrases');
    const phraseCards = page.locator('.phrase-card');

    // --- Play All starts ---
    await playAllBtn.click();

    // Button shows playing state
    await expect(playAllBtn).toHaveClass(/playing/);

    // First card is highlighted (onHighlight fires synchronously during playAll)
    await expect(phraseCards.nth(0)).toHaveClass(/highlighted-speech/, { timeout: 2000 });

    // Trigger mock onend to advance to next card
    await page.evaluate(() => window.__mockTTS.finishCurrent());

    // Second card should now be highlighted
    await expect(phraseCards.nth(1)).toHaveClass(/highlighted-speech/, { timeout: 2000 });
    // First card should no longer be highlighted
    await expect(phraseCards.nth(0)).not.toHaveClass(/highlighted-speech/);

    // --- Stop stops playback and removes highlight ---
    // Click the dedicated Stop button
    const stopBtn = page.locator('#btn-stop-phrases');
    await stopBtn.click();
    await expect(playAllBtn).not.toHaveClass(/playing/);
    // All highlights should be removed after stop
    await expect(phraseCards.nth(1)).not.toHaveClass(/highlighted-speech/);

    // --- Navigating away stops playback ---
    // Start playback again
    await playAllBtn.click();
    await expect(playAllBtn).toHaveClass(/playing/);

    // Switch to Words tab (triggers stopAudioQueue)
    await page.locator('button[role="tab"]', { hasText: 'Words' }).click();

    // Verify speech is stopped by checking speechSynthesis.speaking is false
    const isSpeaking = await page.evaluate(() => window.speechSynthesis.speaking);
    expect(isSpeaking).toBe(false);
  });

  test('Conversation clean text and Missing Content Graceful State', async ({ page }) => {
    // --- Part 1: Unit 22 conversation displays correctly ---
    await navigateToUnit(page, 21);
    await page.locator('button[role="tab"]', { hasText: 'Conversation' }).click();

    // Clean conversation displays, V2 annotations are absent
    await page.waitForSelector('.conversation-container');
    const convoContainer = page.locator('.conversation-container');

    const text = await convoContainer.innerText();
    expect(text).not.toContain('(friendly)');
    expect(text).not.toContain('(rushed)');
    expect(text).toContain('T-Shirt'); // Something from Unit 22 scene

    // --- Part 2: Missing content shows graceful empty state ---
    // Use route interception to simulate a missing file (404) for a specific unit.
    // All 24 units have generated content, so we intercept unit-01-phrases.md
    // after switching to a different unit to guarantee a 404 response.
    await page.route('**/content/generated/a1/unit-01-phrases.md', route => {
      route.fulfill({ status: 404, body: 'Not Found' });
    });

    // Switch back to Unit 1 (index 0) and open Phrases tab
    await page.evaluate(() => window.app.switchUnit(0));
    await page.locator('button[role="tab"]', { hasText: 'Phrases' }).click();

    // Should display empty state (no phrases parsed from 404 response)
    await page.waitForSelector('#panel-phrases');
    await expect(page.locator('#panel-phrases')).toHaveText(/No phrases available|Error loading/i, { timeout: 5000 });

    // Ensure no unhandled console errors (404 warning from ContentLoader is expected, not an error)
    const realErrors = consoleErrors.filter(e => !e.includes('404') && !e.includes('Not Found'));
    expect(realErrors).toHaveLength(0);
  });

  test('Mobile viewport layout verification', async ({ page, isMobile }) => {
    if (!isMobile) return; // Skip for desktop
    await navigateToUnit(page, 0);

    // Verify tabs don't overflow on 375px
    await page.waitForSelector('[role="tablist"]');
    const tablist = page.locator('[role="tablist"]');
    await expect(tablist).toBeVisible();

    const boundingBox = await tablist.boundingBox();
    expect(boundingBox.width).toBeLessThanOrEqual(400);
  });
});
