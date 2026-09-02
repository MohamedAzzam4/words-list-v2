const { test, expect } = require('@playwright/test');

test.describe('Favorites and Filters State', () => {
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

  test('Toggling filters should not remove favorites', async ({ page }) => {
    await initEmptyProgressAndOpen(page);
    
    // Make sure we are on the Words tab
    await page.click('#tab-words');
    await page.waitForSelector('#glossary-tbody tr');
    
    // Favorite the first word
    const firstRow = page.locator('#glossary-tbody tr').first();
    const favBtn = firstRow.locator('span[title="Toggle Favorite"]');
    
    // Initially not favorited (grayscale 100%)
    await expect(favBtn).toHaveCSS('filter', 'grayscale(1)');
    
    // Click to favorite
    await favBtn.click();
    
    // Verify it is favorited
    await expect(favBtn).toHaveCSS('filter', 'grayscale(0)');
    
    // Now hide English
    await page.locator('button', { hasText: 'Hide English' }).click();
    
    // Verify the favorite state is PRESERVED after render
    await expect(favBtn).toHaveCSS('filter', 'grayscale(0)');
    
    // Now click Reveal All
    await page.locator('button', { hasText: 'Reveal All' }).click();

    // Verify favorite state is STILL PRESERVED
    await expect(favBtn).toHaveCSS('filter', 'grayscale(0)');
  });

  // AUDIO-003-C1 (owner review Finding 1): a favorite-membership change that
  // alters the active Favorites-filter result rerenders the table from the
  // updated favorite set — the removed card disappears immediately, the
  // remaining favorite's star state survives the rerender, and the empty
  // scope shows the empty state with no stale Start At options.
  test('Un-favoriting under the Favorites filter rerenders from the updated favorite set', async ({ page }) => {
    await initEmptyProgressAndOpen(page);

    // Make sure we are on the Words tab
    await page.click('#tab-words');
    await page.waitForSelector('#glossary-tbody tr[data-id]');

    // Favorite the first two words under the 'all' filter.
    await page.locator('tr[data-id="1-0"] span[title="Toggle Favorite"]').click();
    await page.locator('tr[data-id="1-1"] span[title="Toggle Favorite"]').click();

    // Favorites filter: exactly those two rows are visible.
    await page.locator('#type-filter').selectOption('fav');
    await page.waitForFunction(() => document.querySelectorAll('#glossary-tbody tr[data-id]').length === 2);
    await expect(page.locator('tr[data-id="1-0"]')).toHaveCount(1);
    await expect(page.locator('tr[data-id="1-1"]')).toHaveCount(1);

    // Remove one favorite: the table rerenders immediately from the updated
    // favorite set and the remaining favorite's star state is preserved.
    await page.locator('tr[data-id="1-0"] span[title="Toggle Favorite"]').click();
    await page.waitForFunction(() => document.querySelectorAll('#glossary-tbody tr[data-id]').length === 1);
    await expect(page.locator('tr[data-id="1-0"]')).toHaveCount(0);
    await expect(page.locator('tr[data-id="1-1"]')).toHaveCount(1);
    const remainingStar = page.locator('tr[data-id="1-1"] span[title="Toggle Favorite"]');
    await expect(remainingStar).toHaveCSS('filter', 'grayscale(0)');

    // Removing the last favorite shows the empty state, and the Start At
    // control exposes no stale options for the empty scope.
    await page.locator('tr[data-id="1-1"] span[title="Toggle Favorite"]').click();
    await page.waitForFunction(() => document.querySelectorAll('#glossary-tbody tr[data-id]').length === 0);
    const startOptionCount = await page.evaluate(() => document.querySelectorAll('#auto-start-word option').length);
    expect(startOptionCount).toBe(0);
  });
});
