import type { EspnPlayersData } from '../types';

let cachedData: EspnPlayersData | null = null;

async function ensureData(): Promise<EspnPlayersData> {
  if (!cachedData) {
    const m = await import('../data/espnPlayers.json');
    cachedData = m.default as unknown as EspnPlayersData;
  }
  return cachedData;
}

const ESPN_BASE = 'https://www.espn.com/nfl';

export function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[.']/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function getPlayerNewsUrl(espnId: string, playerName: string): string {
  const slug = nameToSlug(playerName);
  return `${ESPN_BASE}/player/news/_/id/${espnId}/${slug}`;
}

export function getPlayerUrl(espnId: string, playerName: string): string {
  const slug = nameToSlug(playerName);
  return `${ESPN_BASE}/player/_/id/${espnId}/${slug}`;
}

export function getTeamNewsUrl(teamAbbr: string): string {
  return `${ESPN_BASE}/team/news/_/name/${teamAbbr.toLowerCase()}`;
}

export function getTeamUrl(teamAbbr: string): string {
  return `${ESPN_BASE}/team/_/name/${teamAbbr.toLowerCase()}`;
}

export function getGameUrl(gameId: string): string {
  return `${ESPN_BASE}/game/_/gameId/${gameId}`;
}

export async function getEspnIdFromPlayerId(
  playerId: string,
): Promise<string | null> {
  const data = await ensureData();
  const player = data.players.find((p) => p.id === playerId);
  return player?.espnId || null;
}

export async function getPlayerData(
  playerId: string,
): Promise<EspnPlayersData['players'][number] | null> {
  const data = await ensureData();
  return data.players.find((p) => p.id === playerId) || null;
}

export async function getPlayerNewsUrlById(
  playerId: string,
): Promise<string> {
  const player = await getPlayerData(playerId);
  if (!player) return '#';
  return getPlayerNewsUrl(player.espnId, player.name);
}

export async function getPlayerNewsUrls(): Promise<Record<string, string>> {
  const data = await ensureData();
  return Object.fromEntries(
    data.players.map((p) => [p.id, getPlayerNewsUrl(p.espnId, p.name)]),
  );
}

export const TEAM_NEWS_URLS: Record<string, string> = {
  KC: getTeamNewsUrl('KC'),
  BUF: getTeamNewsUrl('BUF'),
  HOU: getTeamNewsUrl('HOU'),
  MIN: getTeamNewsUrl('MIN'),
  CIN: getTeamNewsUrl('CIN'),
  MIA: getTeamNewsUrl('MIA'),
  SF: getTeamNewsUrl('SF'),
  BAL: getTeamNewsUrl('BAL'),
  PHI: getTeamNewsUrl('PHI'),
  DAL: getTeamNewsUrl('DAL'),
  DET: getTeamNewsUrl('DET'),
  NYG: getTeamNewsUrl('NYG'),
};

export default {
  nameToSlug,
  getPlayerNewsUrl,
  getPlayerUrl,
  getTeamNewsUrl,
  getTeamUrl,
  getGameUrl,
  getEspnIdFromPlayerId,
  getPlayerData,
  getPlayerNewsUrlById,
  getPlayerNewsUrls,
  TEAM_NEWS_URLS,
};
