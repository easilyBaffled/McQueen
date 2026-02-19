import { describe, it, expect } from 'vitest';
import {
  nameToSlug,
  getPlayerNewsUrl,
  getPlayerUrl,
  getTeamNewsUrl,
  getTeamUrl,
  getGameUrl,
  getEspnIdFromPlayerId,
  getPlayerData,
  getPlayerNewsUrlById,
} from '../espnUrls';

describe('nameToSlug', () => {
  it('converts a simple name to lowercase hyphenated slug', () => {
    expect(nameToSlug('Patrick Mahomes')).toBe('patrick-mahomes');
  });

  it('removes apostrophes', () => {
    expect(nameToSlug("Ja'Marr Chase")).toBe('jamarr-chase');
  });

  it('removes periods', () => {
    expect(nameToSlug('A.J. Brown')).toBe('aj-brown');
  });

  it('collapses multiple hyphens', () => {
    expect(nameToSlug('Test  Name')).toBe('test-name');
  });

  it('handles single-word names', () => {
    expect(nameToSlug('Kelce')).toBe('kelce');
  });
});

describe('getPlayerNewsUrl', () => {
  it('builds correct ESPN player news URL', () => {
    expect(getPlayerNewsUrl('3139477', 'Patrick Mahomes')).toBe(
      'https://www.espn.com/nfl/player/news/_/id/3139477/patrick-mahomes',
    );
  });
});

describe('getPlayerUrl', () => {
  it('builds correct ESPN player profile URL', () => {
    expect(getPlayerUrl('3918298', 'Josh Allen')).toBe(
      'https://www.espn.com/nfl/player/_/id/3918298/josh-allen',
    );
  });
});

describe('getTeamNewsUrl', () => {
  it('builds correct ESPN team news URL', () => {
    expect(getTeamNewsUrl('KC')).toBe(
      'https://www.espn.com/nfl/team/news/_/name/kc',
    );
  });

  it('lowercases uppercase abbreviation', () => {
    expect(getTeamNewsUrl('BUF')).toBe(
      'https://www.espn.com/nfl/team/news/_/name/buf',
    );
  });
});

describe('getTeamUrl', () => {
  it('builds correct ESPN team page URL', () => {
    expect(getTeamUrl('SF')).toBe('https://www.espn.com/nfl/team/_/name/sf');
  });
});

describe('getGameUrl', () => {
  it('builds correct ESPN game URL', () => {
    expect(getGameUrl('401547417')).toBe(
      'https://www.espn.com/nfl/game/_/gameId/401547417',
    );
  });
});

describe('getEspnIdFromPlayerId', () => {
  it('returns ESPN ID for known player', async () => {
    const id = await getEspnIdFromPlayerId('mahomes');
    expect(id).toBeTruthy();
    expect(typeof id).toBe('string');
  });

  it('returns null for unknown player', async () => {
    expect(await getEspnIdFromPlayerId('nonexistent-player')).toBeNull();
  });
});

describe('getPlayerData', () => {
  it('returns player object for known player', async () => {
    const data = await getPlayerData('mahomes');
    expect(data).toBeTruthy();
    expect(data.name).toBeTruthy();
    expect(data.espnId).toBeTruthy();
  });

  it('returns null for unknown player', async () => {
    expect(await getPlayerData('nonexistent')).toBeNull();
  });
});

describe('getPlayerNewsUrlById', () => {
  it('returns ESPN URL for known player ID', async () => {
    const url = await getPlayerNewsUrlById('mahomes');
    expect(url).toContain('https://www.espn.com/nfl/player/news/_/id/');
    expect(url).toContain('mahomes');
  });

  it('returns "#" for unknown player ID', async () => {
    expect(await getPlayerNewsUrlById('nonexistent')).toBe('#');
  });
});
