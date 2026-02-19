import type {
  Article,
  ArticleImage,
  ArticleCategory,
  GameEvent,
} from '../types';

const ESPN_API_BASE = '/espn-api';
const ESPN_DIRECT_BASE = 'https://site.api.espn.com';
const CACHE_TTL = 5 * 60 * 1000;

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

interface EspnRawArticle {
  id?: string;
  headline?: string;
  description?: string;
  published?: string;
  links?: {
    web?: { href?: string };
    api?: { self?: { href?: string } };
  };
  images?: ArticleImage[];
  type?: string;
  premium?: boolean;
  categories?: ArticleCategory[];
}

interface EspnRawCompetitor {
  homeAway?: string;
  team?: {
    id?: string;
    abbreviation?: string;
    displayName?: string;
    logo?: string;
  };
  score?: string;
}

interface EspnRawCompetition {
  competitors?: EspnRawCompetitor[];
  status?: {
    type?: { name?: string; description?: string };
    period?: number;
    displayClock?: string;
  };
  venue?: { fullName?: string };
  broadcasts?: Array<{ names?: string[] }>;
}

interface EspnRawEvent {
  id: string;
  name: string;
  shortName: string;
  date: string;
  competitions?: EspnRawCompetition[];
}

interface EspnNewsResponse {
  articles?: EspnRawArticle[];
}

interface EspnScoreboardResponse {
  events?: EspnRawEvent[];
  week?: unknown;
  season?: unknown;
}

const cache = new Map<string, CacheEntry>();

export const NFL_TEAM_IDS: Record<string, number> = {
  ARI: 22,
  ATL: 1,
  BAL: 33,
  BUF: 2,
  CAR: 29,
  CHI: 3,
  CIN: 4,
  CLE: 5,
  DAL: 6,
  DEN: 7,
  DET: 8,
  GB: 9,
  HOU: 34,
  IND: 11,
  JAX: 30,
  KC: 12,
  LV: 13,
  LAC: 24,
  LAR: 14,
  MIA: 15,
  MIN: 16,
  NE: 17,
  NO: 18,
  NYG: 19,
  NYJ: 20,
  PHI: 21,
  PIT: 23,
  SF: 25,
  SEA: 26,
  TB: 27,
  TEN: 10,
  WAS: 28,
};

function getFromCache(key: string): unknown | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

async function fetchWithFallback<T = unknown>(endpoint: string): Promise<T> {
  const cacheKey = endpoint;
  const cached = getFromCache(cacheKey);
  if (cached) {
    return cached as T;
  }

  try {
    let response = await fetch(`${ESPN_API_BASE}${endpoint}`);

    if (!response.ok) {
      console.warn('Proxy failed, trying direct ESPN API...');
      response = await fetch(`${ESPN_DIRECT_BASE}${endpoint}`);
    }

    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status}`);
    }

    const data: T = await response.json();
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    console.error('ESPN API fetch error:', error);
    throw error;
  }
}

export async function fetchNFLNews(limit: number = 20): Promise<Article[]> {
  try {
    const data = await fetchWithFallback<EspnNewsResponse>(
      `/apis/site/v2/sports/football/nfl/news?limit=${limit}`,
    );
    return normalizeNewsArticles(data.articles || []);
  } catch (error) {
    console.error('Failed to fetch NFL news:', error);
    return [];
  }
}

export async function fetchTeamNews(
  teamAbbr: string,
  limit: number = 10,
): Promise<Article[]> {
  const teamId = NFL_TEAM_IDS[teamAbbr.toUpperCase()];
  if (!teamId) {
    console.warn(`Unknown team abbreviation: ${teamAbbr}`);
    return [];
  }

  try {
    const data = await fetchWithFallback<EspnNewsResponse>(
      `/apis/site/v2/sports/football/nfl/teams/${teamId}/news?limit=${limit}`,
    );
    return normalizeNewsArticles(data.articles || []);
  } catch (error) {
    console.error(`Failed to fetch news for team ${teamAbbr}:`, error);
    return [];
  }
}

export async function fetchScoreboard(): Promise<{
  events: GameEvent[];
  week: unknown;
  season: unknown;
}> {
  try {
    const data = await fetchWithFallback<EspnScoreboardResponse>(
      '/apis/site/v2/sports/football/nfl/scoreboard',
    );
    return {
      events: (data.events || []).map(normalizeGameEvent),
      week: data.week,
      season: data.season,
    };
  } catch (error) {
    console.error('Failed to fetch scoreboard:', error);
    return { events: [], week: null, season: null };
  }
}

export async function fetchPlayerNews(
  playerName: string,
  searchTerms: string[] = [],
  teamAbbr: string = '',
): Promise<Article[]> {
  const terms = [
    playerName.toLowerCase(),
    ...searchTerms.map((t) => t.toLowerCase()),
  ];

  let articles: Article[] = [];
  if (teamAbbr) {
    articles = await fetchTeamNews(teamAbbr, 20);
  }

  const generalNews = await fetchNFLNews(30);

  const allArticles = [...articles];
  generalNews.forEach((article) => {
    if (!allArticles.find((a) => a.id === article.id)) {
      allArticles.push(article);
    }
  });

  const playerArticles = allArticles.filter((article) => {
    const searchText =
      `${article.headline} ${article.description}`.toLowerCase();
    return terms.some((term) => searchText.includes(term));
  });

  return playerArticles;
}

function normalizeNewsArticles(articles: EspnRawArticle[]): Article[] {
  return articles.map((article) => ({
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
    _raw: article as unknown as Record<string, unknown>,
  }));
}

function normalizeGameEvent(event: EspnRawEvent): GameEvent {
  const competition: EspnRawCompetition = event.competitions?.[0] || {};
  const homeTeam = competition.competitors?.find(
    (c) => c.homeAway === 'home',
  );
  const awayTeam = competition.competitors?.find(
    (c) => c.homeAway === 'away',
  );

  return {
    id: event.id,
    name: event.name,
    shortName: event.shortName,
    date: event.date,
    status: {
      type: competition.status?.type?.name || 'scheduled',
      description: competition.status?.type?.description || '',
      period: competition.status?.period || 0,
      clock: competition.status?.displayClock || '',
    },
    homeTeam: homeTeam
      ? {
          id: homeTeam.team?.id || '',
          abbr: homeTeam.team?.abbreviation || '',
          name: homeTeam.team?.displayName || '',
          score: homeTeam.score || '0',
          logo: homeTeam.team?.logo || '',
        }
      : null,
    awayTeam: awayTeam
      ? {
          id: awayTeam.team?.id || '',
          abbr: awayTeam.team?.abbreviation || '',
          name: awayTeam.team?.displayName || '',
          score: awayTeam.score || '0',
          logo: awayTeam.team?.logo || '',
        }
      : null,
    venue: competition.venue?.fullName || '',
    broadcast: competition.broadcasts?.[0]?.names?.join(', ') || '',
  };
}

export function clearCache(): void {
  cache.clear();
}

export function getCacheStats(): {
  size: number;
  keys: string[];
  entries: Array<{ key: string; age: number; expired: boolean }>;
} {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
    entries: Array.from(cache.entries()).map(([key, value]) => ({
      key,
      age: Date.now() - value.timestamp,
      expired: Date.now() - value.timestamp > CACHE_TTL,
    })),
  };
}

export default {
  fetchNFLNews,
  fetchTeamNews,
  fetchPlayerNews,
  fetchScoreboard,
  clearCache,
  getCacheStats,
  NFL_TEAM_IDS,
};
