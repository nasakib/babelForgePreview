const puppeteer = require('puppeteer');

async function checkPage(url) {
    console.log(`\n--- Checking URL: ${url} ---`);
    const browser = await puppeteer.launch({ 
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: "new"
    });
    const page = await browser.newPage();
    
    page.on('console', msg => {
        const type = msg.type();
        if (type === 'error' || type === 'warn' || type === 'trace') {
            console.log(`[CONSOLE ${type.toUpperCase()}] ${msg.text()}`);
        }
    });
    
    page.on('pageerror', err => {
        console.log(`[UNCAUGHT EXCEPTION] ${err.stack || err.toString()}`);
    });

    page.on('requestfailed', request => {
        console.log(`[REQUEST FAILED] ${request.method()} ${request.url()} - ${request.failure().errorText}`);
    });

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        // Wait a bit more for any late-loading scripts/errors
        await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (e) {
        console.log(`[NAVIGATION ERROR] ${e.message}`);
    } finally {
        await browser.close();
    }
}

(async () => {
    const baseUrl = 'https://babelforge-preview-13196.web.app';
    await checkPage(baseUrl);
    await checkPage(baseUrl + '/council');
})();
