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

  // Track requests
  const failedRequests = [];
  page.on('requestfailed', req => {
    failedRequests.push({ url: req.url(), failure: req.failure()?.errorText });
  });

  // Only intercept localhost requests - let external requests pass through
  await page.route('http://localhost/**', async (route) => {
    const url = route.request().url();
    let urlPath;
    try {
      urlPath = new URL(url).pathname;
    } catch(e) {
      await route.abort();
      return;
    }
    
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

  log('Loading page...');
  await page.goto('http://localhost/a1.html', { waitUntil: 'load', timeout: 15000 });
  log('Page loaded');
  
  await page.waitForTimeout(8000);
  
  const appExists = await page.evaluate(() => typeof window.app !== 'undefined');
  log(`App exists: ${appExists}`);

  log('Console messages:');
  consoleMsgs.forEach(m => log(`  ${m}`));
  
  log('Failed requests:');
  failedRequests.forEach(r => log(`  ${r.url} - ${r.failure}`));

  await browser.close();
})();
