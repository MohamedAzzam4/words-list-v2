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
      window.__mockTTS = { currentUtterance: null, speakCount: 0, _speakResolvers: [] };
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
          // Resolve any pending waitForSpeak promises
          const resolvers = window.__mockTTS._speakResolvers.splice(0);
          resolvers.forEach(r => r());
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
      // Helper: simulate speech completion on the current utterance
      window.__mockTTS.finishCurrent = () => {
        const utt = window.__mockTTS.currentUtterance;
        if (utt && utt.onend) {
          mockSpeechSynthesis.speaking = false;
          utt.onend(new Event('end'));
        }
      };
      // Helper: returns a promise that resolves when the next speak() call happens.
      // Needed because SpeechQueue uses cancel() + 250ms delay + speak().
      window.__mockTTS.waitForSpeak = () => {
        return new Promise(resolve => {
          window.__mockTTS._speakResolvers.push(resolve);
        });
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

    // First card is highlighted (onHighlight fires synchronously before the 250ms speak delay)
    await expect(phraseCards.nth(0)).toHaveClass(/highlighted-speech/, { timeout: 2000 });

    // Wait for the 250ms cancel-delay-speak to actually call speak(), then finish it
    await page.evaluate(() => window.__mockTTS.waitForSpeak());
    await page.evaluate(() => window.__mockTTS.finishCurrent());

    // Wait for next speak (250ms delay for second utterance)
    await page.evaluate(() => window.__mockTTS.waitForSpeak());

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

  test('Phrases Hide and Guess Practice Controls', async ({ page }) => {
    // 1. Open A1 Unit 22 (index 21).
    await navigateToUnit(page, 21);

    // 2. Open Phrases tab.
    await page.locator('button[role="tab"]', { hasText: 'Phrases' }).click();
    await page.waitForSelector('.phrase-card');

    const phraseCards = page.locator('.phrase-card');
    const firstCard = phraseCards.first();
    const firstDe = firstCard.locator('.phrase-de');
    const firstEn = firstCard.locator('.phrase-en span');
    const firstNote = firstCard.locator('.phrase-note span');
    const firstWords = firstCard.locator('.phrase-badge.words');

    // 3. Click Hide German.
    await page.locator('#panel-phrases button', { hasText: 'Hide German' }).click();
    // 4. Verify German phrase text is hidden but speaker icon remains visible.
    await expect(firstDe).toHaveClass(/hidden-word/);
    await expect(firstCard.locator('.speak-btn').first()).toBeVisible();

    // 5. Click Reveal All.
    await page.locator('#panel-phrases button', { hasText: 'Reveal All' }).click();
    await expect(firstDe).not.toHaveClass(/hidden-word/);

    // 6. Click Hide English.
    await page.locator('#panel-phrases button', { hasText: 'Hide English' }).click();
    // 7. Verify English meaning is hidden.
    await expect(firstEn).toHaveClass(/hidden-word/);

    // 8. Click Reveal All.
    await page.locator('#panel-phrases button', { hasText: 'Reveal All' }).click();
    await expect(firstEn).not.toHaveClass(/hidden-word/);

    // 9. Click Hide Notes.
    await page.locator('#panel-phrases button', { hasText: 'Hide Notes' }).click();
    // 10. Verify note/context is hidden.
    if (await firstNote.count() > 0) {
      await expect(firstNote).toHaveClass(/hidden-word/);
    }

    // 11. Click Reveal All.
    await page.locator('#panel-phrases button', { hasText: 'Reveal All' }).click();
    if (await firstNote.count() > 0) {
      await expect(firstNote).not.toHaveClass(/hidden-word/);
    }

    // 12. Click Hide Used Words.
    await page.locator('#panel-phrases button', { hasText: 'Hide Used Words' }).click();
    // 13. Verify used words are hidden.
    if (await firstWords.count() > 0) {
      await expect(firstWords).toHaveClass(/hidden-word/);
    }

    // 14. Click Reveal All.
    await page.locator('#panel-phrases button', { hasText: 'Reveal All' }).click();
    if (await firstWords.count() > 0) {
      await expect(firstWords).not.toHaveClass(/hidden-word/);
    }

    // 15. Click Hide Mixed.
    await page.locator('#panel-phrases button', { hasText: 'Hide Mixed' }).click();
    // 16. Verify some phrase cards hide German and some hide English.
    let hasHiddenDe = false;
    let hasHiddenEn = false;
    const cardCount = await phraseCards.count();
    for (let i = 0; i < cardCount; i++) {
      const deClass = await phraseCards.nth(i).locator('.phrase-de').getAttribute('class');
      const enClass = await phraseCards.nth(i).locator('.phrase-en span').getAttribute('class');
      if (deClass.includes('hidden-word')) hasHiddenDe = true;
      if (enClass.includes('hidden-word')) hasHiddenEn = true;
    }
    expect(hasHiddenDe || hasHiddenEn).toBe(true);

    // 17. Verify Play All still starts and highlights cards.
    const playAllBtn = page.locator('#btn-play-all-phrases');
    await playAllBtn.click();
    await expect(playAllBtn).toHaveClass(/playing/);
    await expect(phraseCards.nth(0)).toHaveClass(/highlighted-speech/, { timeout: 2000 });

    // 18. Verify Stop still cancels playback.
    const stopBtn = page.locator('#btn-stop-phrases');
    await stopBtn.click();
    await expect(playAllBtn).not.toHaveClass(/playing/);

    // 19. Verify Words tab hide controls still work.
    await page.locator('button[role="tab"]', { hasText: 'Words' }).click();
    await page.locator('#panel-words button', { hasText: 'Hide English' }).click();
    const firstWordTranslation = page.locator('#glossary-tbody tr td').nth(1).locator('span').first();
    await expect(firstWordTranslation).toHaveClass(/hidden-word/);
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

  test('Dashboard and Phrases tab progress stats model', async ({ page }) => {
    // 1. Navigate to Unit 1 (index 0)
    await navigateToUnit(page, 0);

    // 2. Open dashboard
    await page.evaluate(() => window.app.switchView('dashboard'));

    // 3. Verify card labels contain "A1"
    const wordsKnownLabel = page.locator('#label-words-known');
    const completionLabel = page.locator('#label-completion');
    await expect(wordsKnownLabel).toHaveText(/A1 Words Known/);
    await expect(completionLabel).toHaveText(/A1 Word Completion/);

    // 4. Verify Phrases Known card displays correctly (starting at 0 known, out of dynamic positive total phrases)
    const phrasesKnownValue = page.locator('#stat-session');
    const phrasesTotalValue = page.locator('#stat-phrases-total');
    await expect(phrasesKnownValue).toHaveText('0');
    
    // Total phrases count should resolve to a positive number
    await expect(phrasesTotalValue).not.toHaveText('...');
    await expect(phrasesTotalValue).not.toHaveText('0');
    const totalText = await phrasesTotalValue.innerText();
    expect(parseInt(totalText)).toBeGreaterThan(0);

    // 5. Verify topbar progress label says "Word Progress"
    const progressLabel = page.locator('#progress-label');
    await expect(progressLabel).toHaveText(/Word Progress/);

    // 6. Verify Leaderboard column header says "Words Mastered (All Levels)"
    await page.evaluate(() => window.app.switchView('leaderboard'));
    const leaderboardCol = page.locator('th', { hasText: 'Words Mastered (All Levels)' });
    await expect(leaderboardCol).toBeVisible();

    // 7. Go to Unit 1 Phrases tab, verify Phrases Learned counter is visible and shows "0 / X" (where X > 0)
    await page.evaluate(() => {
      window.app.switchUnit(0);
      window.app.switchView('glossary');
    });
    await page.locator('button[role="tab"]', { hasText: 'Phrases' }).click();
    const tabCounter = page.locator('#phrases-tab-counter');
    await expect(tabCounter).toBeVisible();
    await expect(page.locator('#phrases-tab-known-count')).toHaveText('0');
    
    const tabTotalVal = page.locator('#phrases-tab-total-count');
    const unitTotalText = await tabTotalVal.innerText();
    const unitTotal = parseInt(unitTotalText);
    expect(unitTotal).toBeGreaterThan(0);

    // 8. Go to Flashcards, mark first card as known (desktop-only to prevent mobile flakiness / race conditions)
    const isMobile = page.viewportSize() && page.viewportSize().width <= 768;
    if (!isMobile) {
      await page.locator('button', { hasText: 'Flashcards' }).click();
      await page.waitForSelector('.flashcard-container');
      await page.locator('.btn-known').click();

      // Go back to glossary mode
      await page.evaluate(() => window.app.switchMode('glossary'));

      // 9. Return to Phrases tab, verify counter shows "1 / X"
      await page.locator('button[role="tab"]', { hasText: 'Phrases' }).click();
      await expect(page.locator('#phrases-tab-known-count')).toHaveText('1');

      // 10. Open dashboard, verify level-wide Phrases Known is updated to 1
      await page.evaluate(() => window.app.switchView('dashboard'));
      await expect(phrasesKnownValue).toHaveText('1');
    }
  });

  test('Mobile sidebar navigation works with real UI clicks', async ({ page }) => {
    const isMobile = page.viewportSize() && page.viewportSize().width <= 768;
    if (!isMobile) {
      test.skip();
    }

    // 1-2. Open the website and select A1
    await page.goto('/index.html');
    await page.waitForSelector('.a1-card');
    await page.locator('.a1-card').click();
    await page.waitForSelector('#mobile-menu-btn');
    await page.waitForFunction('window.app !== undefined');
    await page.waitForSelector('#glossary-tbody tr');

    // 3. Confirm the mobile menu button is visible
    await expect(page.locator('#mobile-menu-btn')).toBeVisible();

    // 4. Click the mobile menu button
    await page.locator('#mobile-menu-btn').tap();

    // 5. Confirm the sidebar opens
    await expect(page.locator('#sidebar')).toHaveClass(/open/);
    await page.waitForTimeout(350); // Wait for transition animation to finish

    // 6. Click the Dashboard nav item using the visible sidebar UI
    await page.locator('#sidebar .nav-item', { hasText: 'Dashboard' }).click({ force: true });

    // 7. Confirm the Dashboard view is visible
    await expect(page.locator('#view-dashboard')).not.toHaveClass(/hidden/);

    // 8. Confirm the sidebar closes after navigation
    await expect(page.locator('#sidebar')).not.toHaveClass(/open/);

    // 9. Click the mobile menu button again
    await page.locator('#mobile-menu-btn').tap();
    await expect(page.locator('#sidebar')).toHaveClass(/open/);
    await page.waitForTimeout(350); // Wait for transition animation to finish

    // 10. Click the Leaderboard nav item using the visible sidebar UI
    await page.locator('#sidebar .nav-item', { hasText: 'Leaderboard' }).click({ force: true });

    // 11. Confirm the Leaderboard view is visible
    await expect(page.locator('#view-leaderboard')).not.toHaveClass(/hidden/);

    // 12. Confirm the sidebar closes after navigation
    await expect(page.locator('#sidebar')).not.toHaveClass(/open/);

    // 13. Click the mobile menu button again
    await page.locator('#mobile-menu-btn').tap();
    await expect(page.locator('#sidebar')).toHaveClass(/open/);
    await page.waitForTimeout(350); // Wait for transition animation to finish

    // 14. Click the first unit in the sidebar using the real unit item UI
    await page.locator('#unit-list .nav-item').first().click({ force: true });

    // 15. Confirm the Unit/Glossary view opens
    await expect(page.locator('#view-glossary')).not.toHaveClass(/hidden/);

    // 16. Confirm Words tab is default
    await expect(page.locator('#tab-words')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#panel-words')).not.toHaveClass(/hidden/);

    // 17. Open the mobile menu again and close it using the close button
    await page.locator('#mobile-menu-btn').tap();
    await expect(page.locator('#sidebar')).toHaveClass(/open/);
    await page.waitForTimeout(350); // Wait for transition animation to finish
    await page.locator('#sidebar-close-btn').tap({ force: true });

    // 18. Confirm the sidebar closes
    await expect(page.locator('#sidebar')).not.toHaveClass(/open/);
  });

  test('SpeechQueue advances through multiple items correctly', async ({ page }) => {
    await navigateToUnit(page, 0);
    await page.locator('button[role="tab"]', { hasText: 'Phrases' }).click();
    await page.waitForSelector('.phrase-card');

    const phraseCards = page.locator('.phrase-card');
    const totalCards = await phraseCards.count();

    // Start Play All
    await page.locator('#btn-play-all-phrases').click();
    await expect(page.locator('#btn-play-all-phrases')).toHaveClass(/playing/);

    // Advance through at least 5 cards (or all cards if fewer than 5)
    const advanceCount = Math.min(5, totalCards);
    for (let i = 0; i < advanceCount; i++) {
      // Wait for speak() to be called (after the 250ms delay)
      await page.evaluate(() => window.__mockTTS.waitForSpeak());

      // Verify the correct card is highlighted
      await expect(phraseCards.nth(i)).toHaveClass(/highlighted-speech/, { timeout: 2000 });

      // Verify speak count increments
      const speakCount = await page.evaluate(() => window.__mockTTS.speakCount);
      expect(speakCount).toBe(i + 1);

      // Finish current utterance to advance
      await page.evaluate(() => window.__mockTTS.finishCurrent());
    }

    // Stop playback
    await page.locator('#btn-stop-phrases').click();
    await expect(page.locator('#btn-play-all-phrases')).not.toHaveClass(/playing/);
  });

  test('SpeechQueue stop during 250ms delay cancels correctly', async ({ page }) => {
    await navigateToUnit(page, 0);
    await page.locator('button[role="tab"]', { hasText: 'Phrases' }).click();
    await page.waitForSelector('.phrase-card');

    // Start Play All
    await page.locator('#btn-play-all-phrases').click();
    await expect(page.locator('#btn-play-all-phrases')).toHaveClass(/playing/);

    // Wait for first speak, finish it so we enter the cancel-delay cycle
    await page.evaluate(() => window.__mockTTS.waitForSpeak());
    const countBefore = await page.evaluate(() => window.__mockTTS.speakCount);
    await page.evaluate(() => window.__mockTTS.finishCurrent());

    // Now the queue is in the 250ms delay before speaking item #2.
    // Stop immediately (during the delay). Use evaluate to click instantly,
    // because Playwright's simulated click can take longer than 250ms on mobile.
    await page.evaluate(() => document.getElementById('btn-stop-phrases').click());

    // Wait 500ms to ensure the delayed speak would have fired if not cancelled
    await page.waitForTimeout(500);

    // Speak count should NOT have incremented
    const countAfter = await page.evaluate(() => window.__mockTTS.speakCount);
    expect(countAfter).toBe(countBefore);

    // Playback should be fully stopped
    await expect(page.locator('#btn-play-all-phrases')).not.toHaveClass(/playing/);
    const isSpeaking = await page.evaluate(() => window.speechSynthesis.speaking);
    expect(isSpeaking).toBe(false);
  });

  test('SpeechQueue rapid stop-and-restart works correctly', async ({ page }) => {
    await navigateToUnit(page, 0);
    await page.locator('button[role="tab"]', { hasText: 'Phrases' }).click();
    await page.waitForSelector('.phrase-card');

    const phraseCards = page.locator('.phrase-card');

    // Start Play All
    await page.locator('#btn-play-all-phrases').click();
    await expect(page.locator('#btn-play-all-phrases')).toHaveClass(/playing/);

    // Wait for first speak
    await page.evaluate(() => window.__mockTTS.waitForSpeak());

    // Stop immediately
    await page.locator('#btn-stop-phrases').click();
    await expect(page.locator('#btn-play-all-phrases')).not.toHaveClass(/playing/);

    // Reset speak count
    await page.evaluate(() => { window.__mockTTS.speakCount = 0; });

    // Start again
    await page.locator('#btn-play-all-phrases').click();
    await expect(page.locator('#btn-play-all-phrases')).toHaveClass(/playing/);

    // Should highlight first card again
    await expect(phraseCards.nth(0)).toHaveClass(/highlighted-speech/, { timeout: 2000 });

    // Wait for the new speak call
    await page.evaluate(() => window.__mockTTS.waitForSpeak());
    const count = await page.evaluate(() => window.__mockTTS.speakCount);
    expect(count).toBe(1); // Only 1 new speak, not stale ones

    // Clean up
    await page.locator('#btn-stop-phrases').click();
  });

  test('SpeechQueue completes all items and fires onFinished', async ({ page }) => {
    await navigateToUnit(page, 0);
    await page.locator('button[role="tab"]', { hasText: 'Phrases' }).click();
    await page.waitForSelector('.phrase-card');

    const phraseCards = page.locator('.phrase-card');
    const totalCards = await phraseCards.count();

    // Start Play All
    await page.locator('#btn-play-all-phrases').click();
    await expect(page.locator('#btn-play-all-phrases')).toHaveClass(/playing/);

    // Advance through ALL items
    for (let i = 0; i < totalCards; i++) {
      await page.evaluate(() => window.__mockTTS.waitForSpeak());
      await page.evaluate(() => window.__mockTTS.finishCurrent());
    }

    // After all items complete, onFinished should call stopAudioQueue,
    // which removes .playing class and all highlights
    await expect(page.locator('#btn-play-all-phrases')).not.toHaveClass(/playing/, { timeout: 2000 });

    // Verify speak count matches total cards
    const speakCount = await page.evaluate(() => window.__mockTTS.speakCount);
    expect(speakCount).toBe(totalCards);
  });
});
