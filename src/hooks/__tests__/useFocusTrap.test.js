import { describe, it, expect } from 'vitest';
import { useFocusTrap } from '../useFocusTrap';

describe('useFocusTrap', () => {
  it('is exported as a named export', () => {
    expect(typeof useFocusTrap).toBe('function');
  });
});
