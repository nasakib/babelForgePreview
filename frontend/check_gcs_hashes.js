const https = require('https');

https.get('https://storage.googleapis.com/babelforge-frontend-prod/index.html', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const regex = /[\w-]+\.js/g;
    const matches = data.match(regex) || [];
    console.log('JS files found in live GCS index.html:', [...new Set(matches)]);
  });
}).on('error', (e) => {
  console.error(e);
});
