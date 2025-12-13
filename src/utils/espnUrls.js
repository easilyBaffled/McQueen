/**
 * ESPN URL Generation Utilities
 * Generates real ESPN URLs for players and teams to make sim stories link to actual content
 */

import espnPlayersData from '../data/espnPlayers.json';

// ESPN URL base paths
const ESPN_BASE = 'https://www.espn.com/nfl';

/**
 * Convert a player name to URL slug format
 * "Patrick Mahomes" -> "patrick-mahomes"
 * "Ja'Marr Chase" -> "jamarr-chase"
 * "A.J. Brown" -> "aj-brown"
 */
export function nameToSlug(name) {
  return name
    .toLowerCase()
    .replace(/[.']/g, '')  // Remove periods and apostrophes
    .replace(/\s+/g, '-')  // Replace spaces with hyphens
    .replace(/-+/g, '-');  // Collapse multiple hyphens
}

/**
 * Get ESPN player news URL
 * @param {string} espnId - ESPN player ID
 * @param {string} playerName - Player's full name
 * @returns {string} ESPN player news URL
 */
export function getPlayerNewsUrl(espnId, playerName) {
  const slug = nameToSlug(playerName);
  return `${ESPN_BASE}/player/news/_/id/${espnId}/${slug}`;
}

/**
 * Get ESPN player profile URL
 * @param {string} espnId - ESPN player ID
 * @param {string} playerName - Player's full name
 * @returns {string} ESPN player profile URL
 */
export function getPlayerUrl(espnId, playerName) {
  const slug = nameToSlug(playerName);
  return `${ESPN_BASE}/player/_/id/${espnId}/${slug}`;
}

/**
 * Get ESPN team news URL
 * @param {string} teamAbbr - Team abbreviation (e.g., 'KC', 'BUF')
 * @returns {string} ESPN team news URL
 */
export function getTeamNewsUrl(teamAbbr) {
  return `${ESPN_BASE}/team/news/_/name/${teamAbbr.toLowerCase()}`;
}

/**
 * Get ESPN team page URL
 * @param {string} teamAbbr - Team abbreviation (e.g., 'KC', 'BUF')
 * @returns {string} ESPN team page URL
 */
export function getTeamUrl(teamAbbr) {
  return `${ESPN_BASE}/team/_/name/${teamAbbr.toLowerCase()}`;
}

/**
 * Get ESPN game URL (for live game events)
 * @param {string} gameId - ESPN game ID
 * @returns {string} ESPN game URL
 */
export function getGameUrl(gameId) {
  return `${ESPN_BASE}/game/_/gameId/${gameId}`;
}

/**
 * Look up a player's ESPN ID from the espnPlayers.json data
 * @param {string} playerId - Internal player ID (e.g., 'mahomes')
 * @returns {string|null} ESPN player ID or null if not found
 */
export function getEspnIdFromPlayerId(playerId) {
  const player = espnPlayersData.players.find(p => p.id === playerId);
  return player?.espnId || null;
}

/**
 * Look up a player's data from the espnPlayers.json data
 * @param {string} playerId - Internal player ID (e.g., 'mahomes')
 * @returns {Object|null} Player data or null if not found
 */
export function getPlayerData(playerId) {
  return espnPlayersData.players.find(p => p.id === playerId) || null;
}

/**
 * Get the appropriate ESPN URL for a player based on their ID
 * @param {string} playerId - Internal player ID
 * @returns {string} ESPN player news URL or '#' if not found
 */
export function getPlayerNewsUrlById(playerId) {
  const player = getPlayerData(playerId);
  if (!player) return '#';
  return getPlayerNewsUrl(player.espnId, player.name);
}

// Export a lookup table for quick access to player URLs
export const PLAYER_NEWS_URLS = Object.fromEntries(
  espnPlayersData.players.map(p => [
    p.id,
    getPlayerNewsUrl(p.espnId, p.name)
  ])
);

// Export a lookup table for team news URLs
export const TEAM_NEWS_URLS = {
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

