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
});
