import { describe, it, expect } from 'vitest';
import { vendorChunks } from '../vendorChunks';

describe('vendorChunks', () => {
  it('maps recharts to vendor-recharts', () => {
    expect(
      vendorChunks('/project/node_modules/recharts/es/index.js'),
    ).toBe('vendor-recharts');
  });

  it('maps d3 (recharts dependency) to vendor-recharts', () => {
    expect(
      vendorChunks('/project/node_modules/d3-scale/src/index.js'),
    ).toBe('vendor-recharts');
  });

  it('maps framer-motion to vendor-framer-motion', () => {
    expect(
      vendorChunks('/project/node_modules/framer-motion/dist/es/index.mjs'),
    ).toBe('vendor-framer-motion');
  });

  it('maps react-router-dom to vendor-react-router', () => {
    expect(
      vendorChunks('/project/node_modules/react-router-dom/dist/index.js'),
    ).toBe('vendor-react-router');
  });

  it('maps react-router to vendor-react-router', () => {
    expect(
      vendorChunks('/project/node_modules/react-router/dist/index.js'),
    ).toBe('vendor-react-router');
  });

  it('returns undefined for app source files', () => {
    expect(vendorChunks('/project/src/App.jsx')).toBeUndefined();
  });

  it('returns undefined for unmatched vendor modules', () => {
    expect(
      vendorChunks('/project/node_modules/react/index.js'),
    ).toBeUndefined();
  });
});
