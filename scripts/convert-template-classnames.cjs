const fs = require('fs');
const path = require('path');

const dirs = ['src/components', 'src/shared', 'src/pages'];
const jsxFiles = [];

function walkDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkDir(full);
    else if (entry.name.endsWith('.jsx') && !entry.name.endsWith('.test.jsx')) jsxFiles.push(full);
  }
}
dirs.forEach(walkDir);

const globalClasses = new Set([
  'text-up', 'text-down', 'text-muted', 'bg-up', 'bg-down',
  'animate-in', 'skeleton', 'live-pulse'
]);

function replaceClassRef(cls) {
  cls = cls.trim();
  if (!cls) return "''";
  if (globalClasses.has(cls)) return "'" + cls + "'";
  return "styles['" + cls + "']";
}

function transformTemplateExpression(expr) {
  let result = expr;
  result = result.replace(/'([a-zA-Z][a-zA-Z0-9-]*)'/g, (m, cls) => {
    return replaceClassRef(cls);
  });
  return result;
}

let totalChanged = 0;
for (const file of jsxFiles) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('import styles from')) continue;

  const original = content;

  content = content.replace(/className=\{`([^`]*)`\}/g, (match, templateContent) => {
    let result = '';
    let i = 0;
    while (i < templateContent.length) {
      if (templateContent[i] === '$' && templateContent[i + 1] === '{') {
        let depth = 1;
        let j = i + 2;
        while (j < templateContent.length && depth > 0) {
          if (templateContent[j] === '{') depth++;
          if (templateContent[j] === '}') depth--;
          j++;
        }
        const exprInner = templateContent.substring(i + 2, j - 1);
        const transformed = transformTemplateExpression(exprInner);
        result += '${' + transformed + '}';
        i = j;
      } else {
        let j = i;
        while (j < templateContent.length && !(templateContent[j] === '$' && templateContent[j + 1] === '{')) {
          j++;
        }
        const textPart = templateContent.substring(i, j).trim();
        if (textPart) {
          const classes = textPart.split(/\s+/).filter(Boolean);
          for (const cls of classes) {
            if (result && !result.endsWith(' ')) result += ' ';
            result += '${' + replaceClassRef(cls) + '}';
          }
        }
        if (j > i) {
          result += ' ';
        }
        i = j;
      }
    }
    return 'className={`' + result + '`}';
  });

  if (content !== original) {
    totalChanged++;
    fs.writeFileSync(file, content);
    console.log('  Updated:', file);
  }
}
console.log('Transformed template literals in', totalChanged, 'files');
