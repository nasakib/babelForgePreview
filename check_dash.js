const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log(`[PAGE LOG] ${msg.text()}`));
    page.on('pageerror', error => console.error(`[PAGE ERROR] ${error.message}`));

    await page.goto('http://127.0.0.1:8081/index.html', { waitUntil: 'domcontentloaded' });
    
    // Wait for the 3D scene to initialize
    await new Promise(r => setTimeout(r, 2000));
    
    // Click the PTSD checkbox
    await page.evaluate(() => {
        const chk = document.getElementById('chk-PTSD');
        if (chk) {
            chk.click();
        } else {
            console.log("Checkbox chk-PTSD not found.");
        }
    });
    
    await new Promise(r => setTimeout(r, 1000));
    
    const nodeCount = await page.evaluate(() => {
        return typeof lobeGroup !== 'undefined' ? lobeGroup.children.length : -1;
    });
    console.log("Node count after PTSD:", nodeCount);
    
    await browser.close();
    process.exit(0);
})();
