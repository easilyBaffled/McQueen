import { describe, it, expect } from 'vitest';
import { getPlayerHeadshotUrl, getTeamLogoUrl } from '../playerImages';

describe('getPlayerHeadshotUrl', () => {
  it('returns a valid ESPN headshot URL for a known player', () => {
    const url = getPlayerHeadshotUrl('mahomes');
    expect(url).toContain('espncdn.com');
    expect(url).toContain('3139477');
  });

  it('returns null for an unknown player', () => {
    expect(getPlayerHeadshotUrl('nonexistent-player')).toBeNull();
  });

  it('uses medium dimensions by default', () => {
    const url = getPlayerHeadshotUrl('mahomes');
    expect(url).toContain('w=96');
    expect(url).toContain('h=70');
  });

  it('uses small dimensions when requested', () => {
    const url = getPlayerHeadshotUrl('mahomes', 'small');
    expect(url).toContain('w=48');
    expect(url).toContain('h=35');
  });

  it('uses large dimensions when requested', () => {
    const url = getPlayerHeadshotUrl('mahomes', 'large');
    expect(url).toContain('w=200');
    expect(url).toContain('h=146');
  });

  it('falls back to medium for unknown size', () => {
    const url = getPlayerHeadshotUrl('mahomes', 'unknown');
    expect(url).toContain('w=96');
    expect(url).toContain('h=70');
  });
});

describe('getTeamLogoUrl', () => {
  it('returns a valid ESPN team logo URL for a known team', () => {
    const url = getTeamLogoUrl('KC');
    expect(url).toContain('espncdn.com');
    expect(url).toContain('kan');
  });

  it('returns null for an unknown team', () => {
    expect(getTeamLogoUrl('UNKNOWN')).toBeNull();
  });

  it('uses default size of 40', () => {
    const url = getTeamLogoUrl('KC');
    expect(url).toContain('w=40');
    expect(url).toContain('h=40');
  });

  it('accepts custom size', () => {
    const url = getTeamLogoUrl('BUF', 80);
    expect(url).toContain('w=80');
    expect(url).toContain('h=80');
  });
});
