const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = '/home/z/my-project';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Track failed requests
  const failedRequests = [];
  page.on('requestfailed', req => {
    failedRequests.push({ url: req.url(), failure: req.failure()?.errorText });
  });

  // Intercept all network requests and serve from local filesystem
  await page.route('**/*', async (route) => {
    const url = route.request().url();
    let urlPath;
    try {
      urlPath = new URL(url).pathname;
    } catch(e) {
      await route.abort();
      return;
    }
    
    // Remove query params for file lookup
    const cleanPath = urlPath.split('?')[0];
    const fullPath = path.join(BASE, cleanPath);
    
    try {
      if (!fs.existsSync(fullPath)) {
        await route.abort();
        return;
      }
      const content = fs.readFileSync(fullPath);
      const ext = path.extname(fullPath);
      const contentTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
      };
      await route.fulfill({
        status: 200,
        contentType: contentTypes[ext] || 'application/octet-stream',
        body: content
      });
    } catch (e) {
      await route.abort();
    }
  });

  const consoleMsgs = [];
  page.on('console', msg => {
    consoleMsgs.push(`[${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', err => {
    consoleMsgs.push(`[PAGE_ERROR] ${err.message}`);
  });

  const log = (msg) => console.log(`[TEST] ${msg}`);

  // Navigate to page
  log('Loading page...');
  await page.goto('http://localhost/a1.html', { waitUntil: 'load', timeout: 15000 });
  log('Page loaded (load event)');
  
  // Wait for app to initialize
  await page.waitForTimeout(5000);
  
  // Check if app object exists now
  const appExists = await page.evaluate(() => typeof window.app !== 'undefined');
  log(`App exists: ${appExists}`);

  if (!appExists) {
    log('App not loaded yet. Waiting more...');
    await page.waitForTimeout(5000);
    const appExists2 = await page.evaluate(() => typeof window.app !== 'undefined');
    log(`App exists after extra wait: ${appExists2}`);
  }

  // Print console messages to debug
  log('Console messages so far:');
  consoleMsgs.forEach(m => log(`  ${m}`));
  
  log('Failed requests:');
  failedRequests.forEach(r => log(`  ${r.url} - ${r.failure}`));

  await browser.close();
})();
