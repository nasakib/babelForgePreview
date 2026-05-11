const puppeteer = require('puppeteer');

async function checkPage(url) {
    console.log(`Checking ${url}...`);
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    page.on('console', msg => {
        if (msg.type() === 'error') console.log(`[PAGE ERROR] ${url}: ${msg.text()}`);
    });
    
    page.on('pageerror', err => {
        console.log(`[PAGE UNCAUGHT ERROR] ${url}: ${err.toString()}`);
    });

    await page.goto(url, { waitUntil: 'networkidle2' }).catch(e => console.log(e));
    await browser.close();
}

(async () => {
    await checkPage('http://localhost:8080/index.html');
    await checkPage('http://localhost:8080/11d-projection.html');
    await checkPage('http://localhost:8080/pharma-projection.html');
    await checkPage('http://localhost:8080/stack-simulator.html');
    process.exit(0);
})();
