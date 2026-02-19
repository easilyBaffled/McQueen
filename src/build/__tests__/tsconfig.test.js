import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

describe('tsconfig.json', () => {
  it('exists at project root', () => {
    const tsconfigPath = path.join(ROOT, 'tsconfig.json');
    expect(fs.existsSync(tsconfigPath)).toBe(true);
  });

  it('has strict mode enabled', () => {
    const tsconfig = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'tsconfig.json'), 'utf-8'),
    );
    expect(tsconfig.compilerOptions.strict).toBe(true);
  });

  it('uses react-jsx transform', () => {
    const tsconfig = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'tsconfig.json'), 'utf-8'),
    );
    expect(tsconfig.compilerOptions.jsx).toBe('react-jsx');
  });

  it('includes src directory', () => {
    const tsconfig = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'tsconfig.json'), 'utf-8'),
    );
    expect(tsconfig.include).toContain('src');
  });

  it('excludes node_modules and dist', () => {
    const tsconfig = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'tsconfig.json'), 'utf-8'),
    );
    expect(tsconfig.exclude).toContain('node_modules');
    expect(tsconfig.exclude).toContain('dist');
  });
});
