const fs = require('fs');
const path = require('path');

const dir = '/home/nasakib/babelForgePreview/frontend/out/_next/static/chunks';

function searchDir(currentDir) {
  const items = fs.readdirSync(currentDir);
  items.forEach(item => {
    const itemPath = path.join(currentDir, item);
    const stat = fs.statSync(itemPath);
    if (stat.isDirectory()) {
      searchDir(itemPath);
    } else if (stat.isFile() && item.endsWith('.js')) {
      const content = fs.readFileSync(itemPath, 'utf8');
      
      // Look for standalone exports not preceded by dot
      const regex = /(?<!\.)\bexports\b/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        const idx = match.index;
        const start = Math.max(0, idx - 100);
        const end = Math.min(content.length, idx + 100);
        const relativeName = path.relative(dir, itemPath);
        console.log(`\n--- Bare exports in ${relativeName} at index ${idx} ---`);
        console.log(content.slice(start, end).replace(/\n/g, ' '));
      }
    }
  });
}

searchDir(dir);
