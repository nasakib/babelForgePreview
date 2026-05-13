const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    page.on('console', msg => console.log(`[PAGE LOG] ${msg.text()}`));
    page.on('pageerror', error => console.error(`[PAGE ERROR] ${error.message}`));
    await page.goto('http://127.0.0.1:8081/stack-simulator.html', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));
    await browser.close();
    process.exit(0);
})();
