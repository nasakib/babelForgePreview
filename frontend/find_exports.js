const fs = require('fs');
const path = require('path');

const dir = '/home/nasakib/babelForgePreview/frontend/out/_next/static/chunks';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Find matches where 'exports' is used as a standalone identifier.
  // We want to avoid matching within comments or string literals if possible, 
  // but a simple regex \bexports\b is a great start.
  const regex = /\bexports\b/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const idx = match.index;
    const start = Math.max(0, idx - 100);
    const end = Math.min(content.length, idx + 100);
    console.log(`\n--- Match in ${file} at index ${idx} ---`);
    console.log(content.slice(start, end).replace(/\n/g, ' '));
  }
});
