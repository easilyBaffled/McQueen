/**
 * McQueen Player Data for Chrome Extension
 * This file contains player stock data transformed for quick lookups on ESPN.com
 *
 * Data structure:
 * - PLAYER_LOOKUP: Map of searchTerm (lowercase) -> player stock data
 * - Each player has: name, currentPrice, previousPrice, changePercent, trend
 */

const MCQUEEN_PLAYERS = {
  // Patrick Mahomes
  'patrick mahomes': {
    name: 'Patrick Mahomes',
    team: 'KC',
    position: 'QB',
    currentPrice: 158.26,
    previousPrice: 156.8,
    changePercent: 0.93,
    trend: 'up',
  },
  mahomes: {
    name: 'Patrick Mahomes',
    team: 'KC',
    position: 'QB',
    currentPrice: 158.26,
    previousPrice: 156.8,
    changePercent: 0.93,
    trend: 'up',
  },

  // Josh Allen
  'josh allen': {
    name: 'Josh Allen',
    team: 'BUF',
    position: 'QB',
    currentPrice: 173.53,
    previousPrice: 179.2,
    changePercent: -3.16,
    trend: 'down',
  },
  allen: {
    name: 'Josh Allen',
    team: 'BUF',
    position: 'QB',
    currentPrice: 173.53,
    previousPrice: 179.2,
    changePercent: -3.16,
    trend: 'down',
  },

  // Travis Kelce
  'travis kelce': {
    name: 'Travis Kelce',
    team: 'KC',
    position: 'TE',
    currentPrice: 119.6,
    previousPrice: 117.84,
    changePercent: 1.49,
    trend: 'up',
  },
  kelce: {
    name: 'Travis Kelce',
    team: 'KC',
    position: 'TE',
    currentPrice: 119.6,
    previousPrice: 117.84,
    changePercent: 1.49,
    trend: 'up',
  },

  // Stefon Diggs
  'stefon diggs': {
    name: 'Stefon Diggs',
    team: 'HOU',
    position: 'WR',
    currentPrice: 86.7,
    previousPrice: 86.27,
    changePercent: 0.5,
    trend: 'up',
  },
  diggs: {
    name: 'Stefon Diggs',
    team: 'HOU',
    position: 'WR',
    currentPrice: 86.7,
    previousPrice: 86.27,
    changePercent: 0.5,
    trend: 'up',
  },

  // Rashee Rice
  'rashee rice': {
    name: 'Rashee Rice',
    team: 'KC',
    position: 'WR',
    currentPrice: 79.56,
    previousPrice: 78.38,
    changePercent: 1.51,
    trend: 'up',
  },
  rice: {
    name: 'Rashee Rice',
    team: 'KC',
    position: 'WR',
    currentPrice: 79.56,
    previousPrice: 78.38,
    changePercent: 1.51,
    trend: 'up',
  },

  // James Cook
  'james cook': {
    name: 'James Cook',
    team: 'BUF',
    position: 'RB',
    currentPrice: 102.34,
    previousPrice: 97.47,
    changePercent: 5.0,
    trend: 'up',
  },
  cook: {
    name: 'James Cook',
    team: 'BUF',
    position: 'RB',
    currentPrice: 102.34,
    previousPrice: 97.47,
    changePercent: 5.0,
    trend: 'up',
  },

  // Isiah Pacheco
  'isiah pacheco': {
    name: 'Isiah Pacheco',
    team: 'KC',
    position: 'RB',
    currentPrice: 98.53,
    previousPrice: 96.6,
    changePercent: 2.0,
    trend: 'up',
  },
  pacheco: {
    name: 'Isiah Pacheco',
    team: 'KC',
    position: 'RB',
    currentPrice: 98.53,
    previousPrice: 96.6,
    changePercent: 2.0,
    trend: 'up',
  },

  // Dalton Kincaid
  'dalton kincaid': {
    name: 'Dalton Kincaid',
    team: 'BUF',
    position: 'TE',
    currentPrice: 72.18,
    previousPrice: 71.46,
    changePercent: 1.01,
    trend: 'up',
  },
  kincaid: {
    name: 'Dalton Kincaid',
    team: 'BUF',
    position: 'TE',
    currentPrice: 72.18,
    previousPrice: 71.46,
    changePercent: 1.01,
    trend: 'up',
  },

  // Xavier Worthy
  'xavier worthy': {
    name: 'Xavier Worthy',
    team: 'KC',
    position: 'WR',
    currentPrice: 73.35,
    previousPrice: 71.91,
    changePercent: 2.0,
    trend: 'up',
  },
  worthy: {
    name: 'Xavier Worthy',
    team: 'KC',
    position: 'WR',
    currentPrice: 73.35,
    previousPrice: 71.91,
    changePercent: 2.0,
    trend: 'up',
  },

  // Khalil Shakir
  'khalil shakir': {
    name: 'Khalil Shakir',
    team: 'BUF',
    position: 'WR',
    currentPrice: 54.84,
    previousPrice: 53.77,
    changePercent: 1.99,
    trend: 'up',
  },
  shakir: {
    name: 'Khalil Shakir',
    team: 'BUF',
    position: 'WR',
    currentPrice: 54.84,
    previousPrice: 53.77,
    changePercent: 1.99,
    trend: 'up',
  },

  // Justin Jefferson
  'justin jefferson': {
    name: 'Justin Jefferson',
    team: 'MIN',
    position: 'WR',
    currentPrice: 134.54,
    previousPrice: 134.0,
    changePercent: 0.4,
    trend: 'up',
  },
  jefferson: {
    name: 'Justin Jefferson',
    team: 'MIN',
    position: 'WR',
    currentPrice: 134.54,
    previousPrice: 134.0,
    changePercent: 0.4,
    trend: 'up',
  },

  // Ja'Marr Chase
  "ja'marr chase": {
    name: "Ja'Marr Chase",
    team: 'CIN',
    position: 'WR',
    currentPrice: 146.0,
    previousPrice: 145.25,
    changePercent: 0.52,
    trend: 'up',
  },
  'jamarr chase': {
    name: "Ja'Marr Chase",
    team: 'CIN',
    position: 'WR',
    currentPrice: 146.0,
    previousPrice: 145.25,
    changePercent: 0.52,
    trend: 'up',
  },
  chase: {
    name: "Ja'Marr Chase",
    team: 'CIN',
    position: 'WR',
    currentPrice: 146.0,
    previousPrice: 145.25,
    changePercent: 0.52,
    trend: 'up',
  },

  // Tyreek Hill
  'tyreek hill': {
    name: 'Tyreek Hill',
    team: 'MIA',
    position: 'WR',
    currentPrice: 118.15,
    previousPrice: 118.75,
    changePercent: -0.51,
    trend: 'down',
  },
  hill: {
    name: 'Tyreek Hill',
    team: 'MIA',
    position: 'WR',
    currentPrice: 118.15,
    previousPrice: 118.75,
    changePercent: -0.51,
    trend: 'down',
  },

  // Christian McCaffrey
  'christian mccaffrey': {
    name: 'Christian McCaffrey',
    team: 'SF',
    position: 'RB',
    currentPrice: 157.0,
    previousPrice: 156.25,
    changePercent: 0.48,
    trend: 'up',
  },
  mccaffrey: {
    name: 'Christian McCaffrey',
    team: 'SF',
    position: 'RB',
    currentPrice: 157.0,
    previousPrice: 156.25,
    changePercent: 0.48,
    trend: 'up',
  },
  cmc: {
    name: 'Christian McCaffrey',
    team: 'SF',
    position: 'RB',
    currentPrice: 157.0,
    previousPrice: 156.25,
    changePercent: 0.48,
    trend: 'up',
  },

  // Derrick Henry
  'derrick henry': {
    name: 'Derrick Henry',
    team: 'BAL',
    position: 'RB',
    currentPrice: 129.5,
    previousPrice: 128.75,
    changePercent: 0.58,
    trend: 'up',
  },
  henry: {
    name: 'Derrick Henry',
    team: 'BAL',
    position: 'RB',
    currentPrice: 129.5,
    previousPrice: 128.75,
    changePercent: 0.58,
    trend: 'up',
  },

  // Saquon Barkley
  'saquon barkley': {
    name: 'Saquon Barkley',
    team: 'PHI',
    position: 'RB',
    currentPrice: 152.76,
    previousPrice: 152.0,
    changePercent: 0.5,
    trend: 'up',
  },
  barkley: {
    name: 'Saquon Barkley',
    team: 'PHI',
    position: 'RB',
    currentPrice: 152.76,
    previousPrice: 152.0,
    changePercent: 0.5,
    trend: 'up',
  },
  saquon: {
    name: 'Saquon Barkley',
    team: 'PHI',
    position: 'RB',
    currentPrice: 152.76,
    previousPrice: 152.0,
    changePercent: 0.5,
    trend: 'up',
  },

  // Lamar Jackson
  'lamar jackson': {
    name: 'Lamar Jackson',
    team: 'BAL',
    position: 'QB',
    currentPrice: 159.5,
    previousPrice: 158.75,
    changePercent: 0.47,
    trend: 'up',
  },
  lamar: {
    name: 'Lamar Jackson',
    team: 'BAL',
    position: 'QB',
    currentPrice: 159.5,
    previousPrice: 158.75,
    changePercent: 0.47,
    trend: 'up',
  },

  // Jalen Hurts
  'jalen hurts': {
    name: 'Jalen Hurts',
    team: 'PHI',
    position: 'QB',
    currentPrice: 139.0,
    previousPrice: 138.25,
    changePercent: 0.54,
    trend: 'up',
  },
  hurts: {
    name: 'Jalen Hurts',
    team: 'PHI',
    position: 'QB',
    currentPrice: 139.0,
    previousPrice: 138.25,
    changePercent: 0.54,
    trend: 'up',
  },

  // CeeDee Lamb
  'ceedee lamb': {
    name: 'CeeDee Lamb',
    team: 'DAL',
    position: 'WR',
    currentPrice: 111.0,
    previousPrice: 112.5,
    changePercent: -1.33,
    trend: 'down',
  },
  lamb: {
    name: 'CeeDee Lamb',
    team: 'DAL',
    position: 'WR',
    currentPrice: 111.0,
    previousPrice: 112.5,
    changePercent: -1.33,
    trend: 'down',
  },
  'cd lamb': {
    name: 'CeeDee Lamb',
    team: 'DAL',
    position: 'WR',
    currentPrice: 111.0,
    previousPrice: 112.5,
    changePercent: -1.33,
    trend: 'down',
  },

  // A.J. Brown
  'a.j. brown': {
    name: 'A.J. Brown',
    team: 'PHI',
    position: 'WR',
    currentPrice: 126.25,
    previousPrice: 125.5,
    changePercent: 0.6,
    trend: 'up',
  },
  'aj brown': {
    name: 'A.J. Brown',
    team: 'PHI',
    position: 'WR',
    currentPrice: 126.25,
    previousPrice: 125.5,
    changePercent: 0.6,
    trend: 'up',
  },
  brown: {
    name: 'A.J. Brown',
    team: 'PHI',
    position: 'WR',
    currentPrice: 126.25,
    previousPrice: 125.5,
    changePercent: 0.6,
    trend: 'up',
  },
};

// Export for content script use
window.MCQUEEN_PLAYERS = MCQUEEN_PLAYERS;
