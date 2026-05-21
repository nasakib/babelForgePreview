const fs = require('fs');

const content = fs.readFileSync('/home/nasakib/babelForgePreview/frontend/out/_next/static/chunks/472-c2d50006477ea834.js', 'utf8');
const regex = /(?<!\.)\bexports\b/g;
let match;
let found = false;
while ((match = regex.exec(content)) !== null) {
  found = true;
  const idx = match.index;
  const start = Math.max(0, idx - 100);
  const end = Math.min(content.length, idx + 100);
  console.log(`Match at index ${idx}:`);
  console.log(content.slice(start, end).replace(/\n/g, ' '));
}
if (!found) {
  console.log('No bare exports found in 472-c2d50006477ea834.js!');
}
