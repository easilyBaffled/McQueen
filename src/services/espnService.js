/**
 * ESPN API Service
 * Fetches news and data from ESPN's public API endpoints
 */

// ESPN API base URL (proxied in development)
const ESPN_API_BASE = '/espn-api';

// Fallback to direct URL if proxy not available (may have CORS issues)
const ESPN_DIRECT_BASE = 'https://site.api.espn.com';

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map();

// ESPN Team IDs for NFL
export const NFL_TEAM_IDS = {
  ARI: 22, ATL: 1, BAL: 33, BUF: 2, CAR: 29, CHI: 3, CIN: 4, CLE: 5,
  DAL: 6, DEN: 7, DET: 8, GB: 9, HOU: 34, IND: 11, JAX: 30, KC: 12,
  LV: 13, LAC: 24, LAR: 14, MIA: 15, MIN: 16, NE: 17, NO: 18, NYG: 19,
  NYJ: 20, PHI: 21, PIT: 23, SF: 25, SEA: 26, TB: 27, TEN: 10, WAS: 28
};

/**
 * Get cached data or null if expired/missing
 */
function getFromCache(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

/**
 * Store data in cache
 */
function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Make a fetch request with fallback handling
 */
async function fetchWithFallback(endpoint) {
  const cacheKey = endpoint;
  const cached = getFromCache(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Try proxied endpoint first
    let response = await fetch(`${ESPN_API_BASE}${endpoint}`);
    
    if (!response.ok) {
      // Fallback to direct (may fail due to CORS in browser)
      console.warn('Proxy failed, trying direct ESPN API...');
      response = await fetch(`${ESPN_DIRECT_BASE}${endpoint}`);
    }

    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status}`);
    }

    const data = await response.json();
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    console.error('ESPN API fetch error:', error);
    throw error;
  }
}

/**
 * Fetch general NFL news
 * @param {number} limit - Number of articles to fetch
 * @returns {Promise<Array>} Array of normalized news articles
 */
export async function fetchNFLNews(limit = 20) {
  try {
    const data = await fetchWithFallback(`/apis/site/v2/sports/football/nfl/news?limit=${limit}`);
    return normalizeNewsArticles(data.articles || []);
  } catch (error) {
    console.error('Failed to fetch NFL news:', error);
    return [];
  }
}

/**
 * Fetch news for a specific team
 * @param {string} teamAbbr - Team abbreviation (e.g., 'KC', 'BUF')
 * @param {number} limit - Number of articles
 * @returns {Promise<Array>} Array of normalized news articles
 */
export async function fetchTeamNews(teamAbbr, limit = 10) {
  const teamId = NFL_TEAM_IDS[teamAbbr.toUpperCase()];
  if (!teamId) {
    console.warn(`Unknown team abbreviation: ${teamAbbr}`);
    return [];
  }

  try {
    const data = await fetchWithFallback(`/apis/site/v2/sports/football/nfl/teams/${teamId}/news?limit=${limit}`);
    return normalizeNewsArticles(data.articles || []);
  } catch (error) {
    console.error(`Failed to fetch news for team ${teamAbbr}:`, error);
    return [];
  }
}

/**
 * Fetch current NFL scoreboard (live games)
 * @returns {Promise<Object>} Scoreboard data
 */
export async function fetchScoreboard() {
  try {
    const data = await fetchWithFallback('/apis/site/v2/sports/football/nfl/scoreboard');
    return {
      events: (data.events || []).map(normalizeGameEvent),
      week: data.week,
      season: data.season
    };
  } catch (error) {
    console.error('Failed to fetch scoreboard:', error);
    return { events: [], week: null, season: null };
  }
}

/**
 * Search for news related to a specific player
 * @param {string} playerName - Player's full name
 * @param {string[]} searchTerms - Additional search terms
 * @param {string} teamAbbr - Player's team
 * @returns {Promise<Array>} Filtered news articles
 */
export async function fetchPlayerNews(playerName, searchTerms = [], teamAbbr = '') {
  // Build search terms array
  const terms = [
    playerName.toLowerCase(),
    ...searchTerms.map(t => t.toLowerCase())
  ];

  // Fetch team news first (more relevant)
  let articles = [];
  if (teamAbbr) {
    articles = await fetchTeamNews(teamAbbr, 20);
  }

  // Also fetch general NFL news
  const generalNews = await fetchNFLNews(30);
  
  // Combine and dedupe
  const allArticles = [...articles];
  generalNews.forEach(article => {
    if (!allArticles.find(a => a.id === article.id)) {
      allArticles.push(article);
    }
  });

  // Filter articles that mention the player
  const playerArticles = allArticles.filter(article => {
    const searchText = `${article.headline} ${article.description}`.toLowerCase();
    return terms.some(term => searchText.includes(term));
  });

  return playerArticles;
}

/**
 * Normalize ESPN news article to our format
 */
function normalizeNewsArticles(articles) {
  return articles.map(article => ({
    id: article.id || String(Date.now() + Math.random()),
    headline: article.headline || '',
    description: article.description || '',
    published: article.published || new Date().toISOString(),
    url: article.links?.web?.href || article.links?.api?.self?.href || '#',
    images: article.images || [],
    thumbnail: article.images?.[0]?.url || null,
    source: 'ESPN NFL',
    type: article.type || 'news',
    premium: article.premium || false,
    categories: article.categories || [],
    // Keep original for debugging
    _raw: article
  }));
}

/**
 * Normalize game event data
 */
function normalizeGameEvent(event) {
  const competition = event.competitions?.[0] || {};
  const homeTeam = competition.competitors?.find(c => c.homeAway === 'home');
  const awayTeam = competition.competitors?.find(c => c.homeAway === 'away');

  return {
    id: event.id,
    name: event.name,
    shortName: event.shortName,
    date: event.date,
    status: {
      type: competition.status?.type?.name || 'scheduled',
      description: competition.status?.type?.description || '',
      period: competition.status?.period || 0,
      clock: competition.status?.displayClock || ''
    },
    homeTeam: homeTeam ? {
      id: homeTeam.team?.id,
      abbr: homeTeam.team?.abbreviation,
      name: homeTeam.team?.displayName,
      score: homeTeam.score,
      logo: homeTeam.team?.logo
    } : null,
    awayTeam: awayTeam ? {
      id: awayTeam.team?.id,
      abbr: awayTeam.team?.abbreviation,
      name: awayTeam.team?.displayName,
      score: awayTeam.score,
      logo: awayTeam.team?.logo
    } : null,
    venue: competition.venue?.fullName || '',
    broadcast: competition.broadcasts?.[0]?.names?.join(', ') || ''
  };
}

/**
 * Clear the cache (useful for testing or manual refresh)
 */
export function clearCache() {
  cache.clear();
}

/**
 * Get cache stats for debugging
 */
export function getCacheStats() {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
    entries: Array.from(cache.entries()).map(([key, value]) => ({
      key,
      age: Date.now() - value.timestamp,
      expired: Date.now() - value.timestamp > CACHE_TTL
    }))
  };
}

export default {
  fetchNFLNews,
  fetchTeamNews,
  fetchPlayerNews,
  fetchScoreboard,
  clearCache,
  getCacheStats,
  NFL_TEAM_IDS
};

