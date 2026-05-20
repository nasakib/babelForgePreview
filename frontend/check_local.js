const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', error => errors.push(error.message));

  console.log('Navigating to http://localhost:3001/ ...');
  try {
    await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(r => setTimeout(r, 5000));
    console.log('Errors:', errors);
  } catch (e) {
    console.error('Failed to load:', e);
  }

  await browser.close();
})();