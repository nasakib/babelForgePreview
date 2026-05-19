const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  console.log('Navigating to https://babelforge-preview-13196.web.app/ ...');
  await page.goto('https://babelforge-preview-13196.web.app/', { waitUntil: 'domcontentloaded' });
  
  await new Promise(r => setTimeout(r, 5000)); // wait for canvas
  
  const canvasRect = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { width: rect.width, height: rect.height, top: rect.top, left: rect.left };
  });
  console.log('Canvas Rect:', canvasRect);

  await page.screenshot({ path: 'screenshot.png' });
  console.log('Screenshot saved to screenshot.png');
  await browser.close();
})();
