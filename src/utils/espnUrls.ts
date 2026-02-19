import espnPlayersData from '../data/espnPlayers.json';
import type { EspnPlayersData } from '../types';

const typedEspnPlayersData = espnPlayersData as unknown as EspnPlayersData;

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

export function getEspnIdFromPlayerId(playerId: string): string | null {
  const player = typedEspnPlayersData.players.find((p) => p.id === playerId);
  return player?.espnId || null;
}

export function getPlayerData(
  playerId: string,
): EspnPlayersData['players'][number] | null {
  return (
    typedEspnPlayersData.players.find((p) => p.id === playerId) || null
  );
}

export function getPlayerNewsUrlById(playerId: string): string {
  const player = getPlayerData(playerId);
  if (!player) return '#';
  return getPlayerNewsUrl(player.espnId, player.name);
}

export const PLAYER_NEWS_URLS: Record<string, string> = Object.fromEntries(
  typedEspnPlayersData.players.map((p) => [
    p.id,
    getPlayerNewsUrl(p.espnId, p.name),
  ]),
);

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
  PLAYER_NEWS_URLS,
  TEAM_NEWS_URLS,
};
