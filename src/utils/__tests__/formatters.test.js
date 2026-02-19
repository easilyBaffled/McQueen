import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatPercent,
  formatCompact,
  formatRelativeTime,
} from '../formatters';

describe('formatCurrency', () => {
  it('formats a basic dollar amount', () => {
    expect(formatCurrency(42.5)).toBe('$42.50');
  });

  it('formats large values with commas', () => {
    expect(formatCurrency(1234567.89)).toBe('$1,234,567.89');
  });

  it('respects custom decimal places', () => {
    expect(formatCurrency(9.9, 0)).toBe('$10');
  });

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('handles negative values', () => {
    expect(formatCurrency(-25.1)).toBe('-$25.10');
  });
});

describe('formatPercent', () => {
  it('adds + sign for positive values', () => {
    expect(formatPercent(3.456)).toBe('+3.46%');
  });

  it('keeps - sign for negative values', () => {
    expect(formatPercent(-1.2)).toBe('-1.20%');
  });

  it('treats zero as non-negative', () => {
    expect(formatPercent(0)).toBe('+0.00%');
  });

  it('respects custom decimal places', () => {
    expect(formatPercent(12.3456, 1)).toBe('+12.3%');
  });
});

describe('formatCompact', () => {
  it('abbreviates thousands', () => {
    expect(formatCompact(1500)).toBe('1.5K');
  });

  it('abbreviates millions', () => {
    expect(formatCompact(2_300_000)).toBe('2.3M');
  });

  it('abbreviates billions', () => {
    expect(formatCompact(7_000_000_000)).toBe('7B');
  });

  it('leaves small numbers as-is', () => {
    expect(formatCompact(42)).toBe('42');
  });

  it('handles zero', () => {
    expect(formatCompact(0)).toBe('0');
  });

  it('handles negative values', () => {
    expect(formatCompact(-1500)).toBe('-1.5K');
  });
});

describe('formatRelativeTime', () => {
  it('formats seconds ago', () => {
    const date = new Date(Date.now() - 30_000);
    const result = formatRelativeTime(date);
    expect(result).toContain('second');
  });

  it('formats hours ago', () => {
    const date = new Date(Date.now() - 3_600_000);
    const result = formatRelativeTime(date);
    expect(result).toContain('hour');
  });

  it('formats days ago', () => {
    const date = new Date(Date.now() - 86_400_000);
    const result = formatRelativeTime(date);
    expect(result).toMatch(/yesterday|day/);
  });

  it('accepts a string input', () => {
    const result = formatRelativeTime('2025-01-01T00:00:00Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('formats minutes ago', () => {
    const date = new Date(Date.now() - 120_000);
    const result = formatRelativeTime(date);
    expect(result).toContain('minute');
  });
});
