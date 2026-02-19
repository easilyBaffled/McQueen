import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { isDevMode, enableDevMode, disableDevMode } from '../devMode';

describe('isDevMode', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
    vi.stubGlobal('location', { search: '', reload: vi.fn() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns false by default', () => {
    expect(isDevMode()).toBe(false);
  });

  it('returns true when URL has ?dev=true', () => {
    vi.stubGlobal('location', { search: '?dev=true', reload: vi.fn() });
    expect(isDevMode()).toBe(true);
  });

  it('returns true when localStorage has dev mode flag', () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) =>
        key === 'mcqueen-dev-mode' ? 'true' : null,
      ),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
    expect(isDevMode()).toBe(true);
  });

  it('returns false when URL param is not "true"', () => {
    vi.stubGlobal('location', { search: '?dev=false', reload: vi.fn() });
    expect(isDevMode()).toBe(false);
  });
});

describe('enableDevMode', () => {
  it('sets localStorage flag and reloads', () => {
    const setItem = vi.fn();
    const reload = vi.fn();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem,
      removeItem: vi.fn(),
    });
    vi.stubGlobal('location', { search: '', reload });

    enableDevMode();

    expect(setItem).toHaveBeenCalledWith('mcqueen-dev-mode', 'true');
    expect(reload).toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});

describe('disableDevMode', () => {
  it('removes localStorage flag and reloads', () => {
    const removeItem = vi.fn();
    const reload = vi.fn();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem,
    });
    vi.stubGlobal('location', { search: '', reload });

    disableDevMode();

    expect(removeItem).toHaveBeenCalledWith('mcqueen-dev-mode');
    expect(reload).toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});
