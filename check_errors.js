const puppeteer = require('puppeteer');
const fs = require('fs');

async function checkPage(file) {
    console.log(`Checking ${file}...`);
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    page.on('console', msg => {
        if (msg.type() === 'error') console.log(`[PAGE ERROR] ${file}: ${msg.text()}`);
    });
    
    page.on('pageerror', err => {
        console.log(`[PAGE UNCAUGHT ERROR] ${file}: ${err.toString()}`);
    });

    await page.goto(`file://${__dirname}/${file}`, { waitUntil: 'networkidle2' }).catch(e => console.log(e));
    await browser.close();
}

(async () => {
    await checkPage('index.html');
    await checkPage('11d-projection.html');
    await checkPage('pharma-projection.html');
    await checkPage('stack-simulator.html');
})();
