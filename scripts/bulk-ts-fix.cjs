const fs = require('fs');
const { execSync } = require('child_process');

// Get all TSC errors
const tscOutput = execSync('npx tsc --noEmit 2>&1 || true', {
  encoding: 'utf8',
  cwd: process.cwd(),
  maxBuffer: 10 * 1024 * 1024,
});

// Parse errors
const errors = [];
for (const line of tscOutput.split('\n')) {
  const match = line.match(/^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)/);
  if (match) {
    errors.push({
      file: match[1],
      line: parseInt(match[2]),
      col: parseInt(match[3]),
      code: match[4],
      message: match[5],
    });
  }
}

console.log(`Found ${errors.length} errors`);

// Group by file
const byFile = {};
for (const e of errors) {
  if (!byFile[e.file]) byFile[e.file] = [];
  byFile[e.file].push(e);
}

// For each file with errors, apply fixes
for (const [file, fileErrors] of Object.entries(byFile)) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  let changed = false;

  for (const err of fileErrors) {
    const lineIdx = err.line - 1;
    if (lineIdx < 0 || lineIdx >= lines.length) continue;
    const line = lines[lineIdx];

    // TS7006: Parameter 'x' implicitly has an 'any' type
    if (err.code === 'TS7006') {
      const paramMatch = err.message.match(/Parameter '(\w+)' implicitly/);
      if (!paramMatch) continue;
      const param = paramMatch[1];

      // Event handler parameter 'e' or 'event'
      if (param === 'e' || param === 'event') {
        // Check context: onClick, onChange, onSubmit, onKeyDown, etc.
        if (line.includes('onChange') || line.includes('handleJsonChange') || line.includes('handleChange')) {
          const fixed = line.replace(new RegExp(`\\(${param}\\)\\s*=>`), `(${param}: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>`);
          if (fixed !== line) { lines[lineIdx] = fixed; changed = true; continue; }
        }
        if (line.includes('onKeyDown') || line.includes('handleKeyDown') || line.includes('handleKey')) {
          const fixed = line.replace(new RegExp(`\\(${param}\\)\\s*=>`), `(${param}: React.KeyboardEvent) =>`);
          if (fixed !== line) { lines[lineIdx] = fixed; changed = true; continue; }
        }
        if (line.includes('onSubmit') || line.includes('handleSubmit')) {
          const fixed = line.replace(new RegExp(`\\(${param}\\)\\s*=>`), `(${param}: React.FormEvent) =>`);
          if (fixed !== line) { lines[lineIdx] = fixed; changed = true; continue; }
        }
        if (line.includes('onClick') || line.includes('onMouseDown') || line.includes('handleClick') || line.includes('stopPropagation')) {
          const fixed = line.replace(new RegExp(`\\(${param}\\)\\s*=>`), `(${param}: React.MouseEvent) =>`);
          if (fixed !== line) { lines[lineIdx] = fixed; changed = true; continue; }
        }
        if (line.includes('addEventListener') && line.includes('mousemove')) {
          const fixed = line.replace(new RegExp(`\\(${param}\\)\\s*=>`), `(${param}: MouseEvent) =>`);
          if (fixed !== line) { lines[lineIdx] = fixed; changed = true; continue; }
        }
        if (line.includes('addEventListener') && line.includes('keydown')) {
          const fixed = line.replace(new RegExp(`\\(${param}\\)\\s*=>`), `(${param}: KeyboardEvent) =>`);
          if (fixed !== line) { lines[lineIdx] = fixed; changed = true; continue; }
        }
        // Generic fallback for event
        const fixed = line.replace(new RegExp(`\\(${param}\\)\\s*=>`), `(${param}: React.SyntheticEvent) =>`);
        if (fixed !== line) { lines[lineIdx] = fixed; changed = true; continue; }
      }

      // Common parameter types
      if (['playerId', 'id', 'memberId', 'scenario', 'term', 'field', 'key', 'type', 'text', 'message', 'searchPattern', 'value'].includes(param)) {
        const regex = new RegExp(`(\\(|,\\s*)${param}(\\)|,|\\s*=>)`);
        const fixed = line.replace(regex, (m, before, after) => `${before}${param}: string${after}`);
        if (fixed !== line) { lines[lineIdx] = fixed; changed = true; continue; }
      }

      if (['index', 'idx', 'i', 'entryIndex', 'rank', 'shares', 'count', 'amount', 'duration', 'price'].includes(param)) {
        const regex = new RegExp(`(\\(|,\\s*)${param}(\\)|,|\\s*=>)`);
        const fixed = line.replace(regex, (m, before, after) => `${before}${param}: number${after}`);
        if (fixed !== line) { lines[lineIdx] = fixed; changed = true; continue; }
      }

      if (param === 'player') {
        const regex = new RegExp(`(\\(|,\\s*)player(\\)|,|\\s*=>)`);
        // check if this is in a .map or .find or .filter
        if (line.includes('.map(') || line.includes('.find(') || line.includes('.filter(') || line.includes('.forEach(') || line.includes('.some(')) {
          // Skip - these should be inferred from the array type
        }
      }

      if (param === 'err') {
        const regex = new RegExp(`\\(${param}\\)\\s*=>`);
        const fixed = line.replace(regex, `(${param}: unknown) =>`);
        if (fixed !== line) { lines[lineIdx] = fixed; changed = true; continue; }
      }

      if (param === 'data') {
        const regex = new RegExp(`\\(${param}\\)\\s*=>`);
        const fixed = line.replace(regex, `(${param}: unknown) =>`);
        if (fixed !== line) { lines[lineIdx] = fixed; changed = true; continue; }
      }

      if (param === 'playerName') {
        const regex = new RegExp(`(\\(|,\\s*)playerName(\\)|,|\\s*=>)`);
        const fixed = line.replace(regex, (m, before, after) => `${before}playerName: string${after}`);
        if (fixed !== line) { lines[lineIdx] = fixed; changed = true; continue; }
      }
    }

    // TS7031: Binding element 'x' implicitly has an 'any' type (destructured props)
    if (err.code === 'TS7031') {
      // These need props interfaces - handled per-file below
    }
  }

  if (changed) {
    fs.writeFileSync(file, lines.join('\n'));
    console.log('Updated:', file);
  }
}

console.log('Done with bulk fixes');
