const https = require('https');

https.get('https://babelforge-preview-13196.web.app/', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    // Look for all .js script tags or references in the html
    const regex = /[\w-]+\.js/g;
    const matches = data.match(regex) || [];
    console.log('JS files found in live Firebase index.html:', [...new Set(matches)]);
  });
}).on('error', (e) => {
  console.error(e);
});
