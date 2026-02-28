const fs = require('fs');
const path = require('path');

const dirs = ['src/components', 'src/shared', 'src/pages'];
const files = [];

function walkDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkDir(full);
    else if (entry.name.endsWith('.tsx') && !entry.name.endsWith('.test.tsx')) files.push(full);
  }
}
dirs.forEach(walkDir);

let totalFixed = 0;
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Fix styles[styles['foo']] -> styles['foo']
  content = content.replace(/styles\[styles\['([^']+)'\]\]/g, "styles['$1']");

  if (content !== original) {
    totalFixed++;
    fs.writeFileSync(file, content);
    console.log('  Fixed:', file);
  }
}
console.log('Fixed double-styles in', totalFixed, 'files');
