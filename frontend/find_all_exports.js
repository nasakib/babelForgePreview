const fs = require('fs');
const path = require('path');

const dir = '/home/nasakib/babelForgePreview/frontend/.next';

function searchDir(currentDir) {
  const items = fs.readdirSync(currentDir);
  items.forEach(item => {
    const itemPath = path.join(currentDir, item);
    const stat = fs.statSync(itemPath);
    if (stat.isDirectory()) {
      searchDir(itemPath);
    } else if (stat.isFile() && item.endsWith('.js')) {
      const content = fs.readFileSync(itemPath, 'utf8');
      
      // Standalone exports not preceded by dot
      const regex = /(?<!\.)\bexports\b/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        const idx = match.index;
        const start = Math.max(0, idx - 100);
        const end = Math.min(content.length, idx + 100);
        const relativeName = path.relative(dir, itemPath);
        // Exclude common webpack/polyfills patterns to find the real culprit
        const snippet = content.slice(start, end).replace(/\n/g, ' ');
        if (!snippet.includes('exports:{}}') && 
            !snippet.includes('var e={exports:{}}') &&
            !snippet.includes('exports: r') &&
            !snippet.includes('exports: e') &&
            !snippet.includes('exports:r') &&
            !snippet.includes('exports:a') &&
            !snippet.includes('exports:i') &&
            !snippet.includes('exports:t')) {
          console.log(`\n--- Bare exports in ${relativeName} at index ${idx} ---`);
          console.log(snippet);
        }
      }
    }
  });
}

searchDir(dir);
