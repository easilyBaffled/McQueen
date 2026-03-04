import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const TYPES_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const DATA_DIR = path.resolve(TYPES_DIR, '..', 'data');

function readTS(filename) {
  return fs.readFileSync(path.join(TYPES_DIR, filename), 'utf-8');
}

function readJSON(filename) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, filename), 'utf-8'));
}

// ---------------------------------------------------------------------------
// TC-001: src/types/ directory exists with expected module files
// ---------------------------------------------------------------------------
describe('TC-001: directory structure', () => {
  it('src/types/ directory exists', () => {
    expect(fs.existsSync(TYPES_DIR)).toBe(true);
    expect(fs.statSync(TYPES_DIR).isDirectory()).toBe(true);
  });

  const requiredFiles = [
    'index.ts',
    'scenario.ts',
    'simulation.ts',
    'social.ts',
    'espn.ts',
    'trading.ts',
  ];

  it.each(requiredFiles)('%s exists', (file) => {
    expect(fs.existsSync(path.join(TYPES_DIR, file))).toBe(true);
  });

  it('contains only .ts source files (no .js or .d.ts)', () => {
    const files = fs.readdirSync(TYPES_DIR).filter((f) => !fs.statSync(path.join(TYPES_DIR, f)).isDirectory());
    for (const f of files) {
      expect(f).toMatch(/\.ts$/);
      expect(f).not.toMatch(/\.d\.ts$/);
      expect(f).not.toMatch(/\.js$/);
    }
  });
});

// ---------------------------------------------------------------------------
// TC-002: index.ts re-exports all type modules
// ---------------------------------------------------------------------------
describe('TC-002: barrel re-exports', () => {
  const expectedExports = [
    './scenario',
    './trading',
    './simulation',
    './social',
    './espn',
  ];

  it.each(expectedExports)('re-exports from %s', (mod) => {
    const content = readTS('index.ts');
    expect(content).toContain(`export * from '${mod}'`);
  });
});

// ---------------------------------------------------------------------------
// TC-003: ScenarioData interface
// ---------------------------------------------------------------------------
describe('TC-003: ScenarioData interface', () => {
  let src;
  beforeAll(() => { src = readTS('scenario.ts'); });

  it('exports ScenarioData with required scenario and players fields', () => {
    expect(src).toMatch(/export\s+interface\s+ScenarioData/);
    expect(src).toMatch(/scenario:\s*string/);
    expect(src).toMatch(/players:\s*Player\[\]/);
  });

  it('has optional timestamp, headline, startingPortfolio', () => {
    expect(src).toMatch(/timestamp\?\s*:\s*string/);
    expect(src).toMatch(/headline\?\s*:\s*string/);
    expect(src).toMatch(/startingPortfolio\?\s*:\s*Portfolio/);
  });
});

// ---------------------------------------------------------------------------
// TC-004: Player interface
// ---------------------------------------------------------------------------
describe('TC-004: Player interface', () => {
  let src;
  beforeAll(() => { src = readTS('scenario.ts'); });

  it('exports Player with required fields', () => {
    expect(src).toMatch(/export\s+interface\s+Player/);
    expect(src).toMatch(/id:\s*string/);
    expect(src).toMatch(/name:\s*string/);
    expect(src).toMatch(/team:\s*string/);
    expect(src).toMatch(/position:\s*string/);
    expect(src).toMatch(/basePrice:\s*number/);
  });

  it('has optional fields', () => {
    expect(src).toMatch(/totalSharesAvailable\?\s*:\s*number/);
    expect(src).toMatch(/isActive\?\s*:\s*boolean/);
    expect(src).toMatch(/isBuyback\?\s*:\s*boolean/);
    expect(src).toMatch(/priceHistory\?\s*:\s*PriceHistoryEntry\[\]/);
    expect(src).toMatch(/espnId\?\s*:\s*string/);
    expect(src).toMatch(/searchTerms\?\s*:\s*string\[\]/);
  });
});

// ---------------------------------------------------------------------------
// TC-005: PriceHistoryEntry interface
// ---------------------------------------------------------------------------
describe('TC-005: PriceHistoryEntry interface', () => {
  let src;
  beforeAll(() => { src = readTS('scenario.ts'); });

  it('exports PriceHistoryEntry with correct fields', () => {
    expect(src).toMatch(/export\s+interface\s+PriceHistoryEntry/);
    expect(src).toMatch(/timestamp:\s*string/);
    expect(src).toMatch(/price:\s*number/);
    expect(src).toMatch(/reason:\s*PriceReason/);
    expect(src).toMatch(/content\?\s*:\s*ContentItem\[\]/);
    expect(src).toMatch(/sentimentDescription\?\s*:\s*string/);
  });
});

// ---------------------------------------------------------------------------
// TC-006: PriceReason interface with union type
// ---------------------------------------------------------------------------
describe('TC-006: PriceReason interface', () => {
  let src;
  beforeAll(() => { src = readTS('scenario.ts'); });

  it('exports PriceReason with union literal type', () => {
    expect(src).toMatch(/export\s+interface\s+PriceReason/);
    expect(src).toMatch(/type:\s*'news'\s*\|\s*'game_event'\s*\|\s*'league_trade'/);
  });

  it('has required headline and optional variant fields', () => {
    expect(src).toMatch(/headline:\s*string/);
    expect(src).toMatch(/source\?\s*:\s*string/);
    expect(src).toMatch(/eventType\?\s*:\s*string/);
    expect(src).toMatch(/url\?\s*:\s*string/);
    expect(src).toMatch(/memberId\?\s*:\s*string/);
    expect(src).toMatch(/action\?\s*:\s*string/);
    expect(src).toMatch(/shares\?\s*:\s*number/);
    expect(src).toMatch(/sentiment\?\s*:\s*string/);
    expect(src).toMatch(/magnitude\?\s*:\s*number/);
  });
});

// ---------------------------------------------------------------------------
// TC-007: ContentItem interface
// ---------------------------------------------------------------------------
describe('TC-007: ContentItem interface', () => {
  let src;
  beforeAll(() => { src = readTS('scenario.ts'); });

  it('exports ContentItem with required type and optional fields', () => {
    expect(src).toMatch(/export\s+interface\s+ContentItem/);
    expect(src).toMatch(/type:\s*string/);
    expect(src).toMatch(/title\?\s*:\s*string/);
    expect(src).toMatch(/source\?\s*:\s*string/);
    expect(src).toMatch(/url\?\s*:\s*string/);
  });
});

// ---------------------------------------------------------------------------
// TC-008: Portfolio type alias and Holding interface
// ---------------------------------------------------------------------------
describe('TC-008: Portfolio and Holding', () => {
  let src;
  beforeAll(() => { src = readTS('scenario.ts'); });

  it('exports Holding with shares and avgCost', () => {
    expect(src).toMatch(/export\s+interface\s+Holding/);
    expect(src).toMatch(/shares:\s*number/);
    expect(src).toMatch(/avgCost:\s*number/);
  });

  it('exports Portfolio as Record<string, Holding>', () => {
    expect(src).toMatch(/export\s+type\s+Portfolio\s*=\s*Record<string,\s*Holding>/);
  });
});

// ---------------------------------------------------------------------------
// TC-009: TimelineEntry interface
// ---------------------------------------------------------------------------
describe('TC-009: TimelineEntry interface', () => {
  let src;
  beforeAll(() => { src = readTS('simulation.ts'); });

  it('exports TimelineEntry with all required fields', () => {
    expect(src).toMatch(/export\s+interface\s+TimelineEntry/);
    expect(src).toMatch(/playerId:\s*string/);
    expect(src).toMatch(/playerName:\s*string/);
    expect(src).toMatch(/entryIndex:\s*number/);
    expect(src).toMatch(/timestamp:\s*string/);
    expect(src).toMatch(/price:\s*number/);
    expect(src).toMatch(/reason:\s*PriceReason/);
    expect(src).toMatch(/content\?\s*:\s*ContentItem\[\]/);
  });

  it('imports PriceReason and ContentItem from scenario', () => {
    expect(src).toMatch(/import\s+type\s*\{[^}]*PriceReason[^}]*\}\s*from\s*'\.\/scenario'/);
    expect(src).toMatch(/import\s+type\s*\{[^}]*ContentItem[^}]*\}\s*from\s*'\.\/scenario'/);
  });
});

// ---------------------------------------------------------------------------
// TC-010: HistoryEntry interface
// ---------------------------------------------------------------------------
describe('TC-010: HistoryEntry interface', () => {
  let src;
  beforeAll(() => { src = readTS('simulation.ts'); });

  it('exports HistoryEntry with required and optional fields', () => {
    expect(src).toMatch(/export\s+interface\s+HistoryEntry/);
    expect(src).toMatch(/tick:\s*number/);
    expect(src).toMatch(/prices:\s*Record<string,\s*number>/);
    expect(src).toMatch(/action:\s*string/);
    expect(src).toMatch(/playerId\?\s*:\s*string/);
    expect(src).toMatch(/playerName\?\s*:\s*string/);
    expect(src).toMatch(/sentiment\?\s*:\s*string/);
    expect(src).toMatch(/changePercent\?\s*:\s*number/);
  });
});

// ---------------------------------------------------------------------------
// TC-011: MissionPicks interface
// ---------------------------------------------------------------------------
describe('TC-011: MissionPicks interface', () => {
  let src;
  beforeAll(() => { src = readTS('social.ts'); });

  it('exports MissionPicks with risers and fallers arrays', () => {
    expect(src).toMatch(/export\s+interface\s+MissionPicks/);
    expect(src).toMatch(/risers:\s*string\[\]/);
    expect(src).toMatch(/fallers:\s*string\[\]/);
  });
});

// ---------------------------------------------------------------------------
// TC-012: LeaderboardEntry interface
// ---------------------------------------------------------------------------
describe('TC-012: LeaderboardEntry interface', () => {
  let src;
  beforeAll(() => { src = readTS('social.ts'); });

  it('exports LeaderboardEntry with required and optional fields', () => {
    expect(src).toMatch(/export\s+interface\s+LeaderboardEntry/);
    expect(src).toMatch(/memberId:\s*string/);
    expect(src).toMatch(/name:\s*string/);
    expect(src).toMatch(/avatar\?\s*:\s*string/);
    expect(src).toMatch(/isUser:\s*boolean/);
    expect(src).toMatch(/cash:\s*number/);
    expect(src).toMatch(/holdingsValue:\s*number/);
    expect(src).toMatch(/totalValue:\s*number/);
    expect(src).toMatch(/rank:\s*number/);
    expect(src).toMatch(/gapToNext:\s*number/);
    expect(src).toMatch(/gain\?\s*:\s*number/);
    expect(src).toMatch(/gainPercent\?\s*:\s*number/);
  });

  it('has self-referential traderAhead field', () => {
    expect(src).toMatch(/traderAhead\?\s*:\s*LeaderboardEntry\s*\|\s*null/);
  });
});

// ---------------------------------------------------------------------------
// TC-013: Article interface
// ---------------------------------------------------------------------------
describe('TC-013: Article interface', () => {
  let src;
  beforeAll(() => { src = readTS('espn.ts'); });

  it('exports Article with all required fields', () => {
    expect(src).toMatch(/export\s+interface\s+Article/);
    expect(src).toMatch(/id:\s*string/);
    expect(src).toMatch(/headline:\s*string/);
    expect(src).toMatch(/description:\s*string/);
    expect(src).toMatch(/published:\s*string/);
    expect(src).toMatch(/url:\s*string/);
    expect(src).toMatch(/images:\s*ArticleImage\[\]/);
    expect(src).toMatch(/thumbnail:\s*string\s*\|\s*null/);
    expect(src).toMatch(/source:\s*string/);
    expect(src).toMatch(/premium:\s*boolean/);
    expect(src).toMatch(/categories:\s*ArticleCategory\[\]/);
    expect(src).toMatch(/_raw\?\s*:\s*Record<string,\s*unknown>/);
  });

  it('exports ArticleImage and ArticleCategory supporting types', () => {
    expect(src).toMatch(/export\s+interface\s+ArticleImage/);
    expect(src).toMatch(/export\s+interface\s+ArticleCategory/);
  });
});

// ---------------------------------------------------------------------------
// TC-014: GameEvent interface
// ---------------------------------------------------------------------------
describe('TC-014: GameEvent interface', () => {
  let src;
  beforeAll(() => { src = readTS('espn.ts'); });

  it('exports GameEvent with all required fields', () => {
    expect(src).toMatch(/export\s+interface\s+GameEvent/);
    expect(src).toMatch(/name:\s*string/);
    expect(src).toMatch(/shortName:\s*string/);
    expect(src).toMatch(/date:\s*string/);
    expect(src).toMatch(/status:\s*GameEventStatus/);
    expect(src).toMatch(/homeTeam:\s*GameEventTeam\s*\|\s*null/);
    expect(src).toMatch(/awayTeam:\s*GameEventTeam\s*\|\s*null/);
    expect(src).toMatch(/venue:\s*string/);
    expect(src).toMatch(/broadcast:\s*string/);
  });

  it('exports GameEventStatus with type, description, period, clock', () => {
    expect(src).toMatch(/export\s+interface\s+GameEventStatus/);
    expect(src).toMatch(/type:\s*string/);
    expect(src).toMatch(/description:\s*string/);
    expect(src).toMatch(/period:\s*number/);
    expect(src).toMatch(/clock:\s*string/);
  });

  it('exports GameEventTeam with id, abbr, name, score, logo', () => {
    expect(src).toMatch(/export\s+interface\s+GameEventTeam/);
    expect(src).toMatch(/abbr:\s*string/);
    expect(src).toMatch(/score:\s*string/);
    expect(src).toMatch(/logo:\s*string/);
  });
});

// ---------------------------------------------------------------------------
// TC-015: LeagueMember and LeagueHolding interfaces
// ---------------------------------------------------------------------------
describe('TC-015: LeagueMember and LeagueHolding', () => {
  let src;
  beforeAll(() => { src = readTS('social.ts'); });

  it('exports LeagueMember with id, name, optional avatar and isUser', () => {
    expect(src).toMatch(/export\s+interface\s+LeagueMember/);
    expect(src).toMatch(/id:\s*string/);
    expect(src).toMatch(/name:\s*string/);
    expect(src).toMatch(/avatar\?\s*:\s*string/);
    expect(src).toMatch(/isUser\?\s*:\s*boolean/);
  });

  it('exports LeagueHolding with memberId, shares, avgCost', () => {
    expect(src).toMatch(/export\s+interface\s+LeagueHolding/);
    expect(src).toMatch(/memberId:\s*string/);
    expect(src).toMatch(/shares:\s*number/);
    expect(src).toMatch(/avgCost:\s*number/);
  });

  it('exports LeagueData composing both types', () => {
    expect(src).toMatch(/export\s+interface\s+LeagueData/);
    expect(src).toMatch(/members:\s*LeagueMember\[\]/);
    expect(src).toMatch(/holdings:\s*Record<string,\s*LeagueHolding\[\]>/);
  });
});

// ---------------------------------------------------------------------------
// TC-016: PortfolioStats and TradeResult
// ---------------------------------------------------------------------------
describe('TC-016: PortfolioStats and TradeResult', () => {
  let src;
  beforeAll(() => { src = readTS('trading.ts'); });

  it('exports PortfolioStats with value, cost, gain, gainPercent', () => {
    expect(src).toMatch(/export\s+interface\s+PortfolioStats/);
    expect(src).toMatch(/value:\s*number/);
    expect(src).toMatch(/cost:\s*number/);
    expect(src).toMatch(/gain:\s*number/);
    expect(src).toMatch(/gainPercent:\s*number/);
  });

  it('exports TradeResult with success and optional detail fields', () => {
    expect(src).toMatch(/export\s+interface\s+TradeResult/);
    expect(src).toMatch(/success:\s*boolean/);
    expect(src).toMatch(/playerId\?\s*:\s*string/);
    expect(src).toMatch(/shares\?\s*:\s*number/);
    expect(src).toMatch(/price\?\s*:\s*number/);
    expect(src).toMatch(/total\?\s*:\s*number/);
  });
});

// ---------------------------------------------------------------------------
// TC-017: SimulationMode union type
// ---------------------------------------------------------------------------
describe('TC-017: SimulationMode union type', () => {
  it('defines SimulationMode as a 5-value string literal union', () => {
    const src = readTS('scenario.ts');
    expect(src).toMatch(/export\s+type\s+SimulationMode/);
    expect(src).toContain("'midweek'");
    expect(src).toContain("'live'");
    expect(src).toContain("'playoffs'");
    expect(src).toContain("'superbowl'");
    expect(src).toContain("'espn-live'");
  });
});

// ---------------------------------------------------------------------------
// TC-018: Types align with actual JSON data files
// ---------------------------------------------------------------------------
describe('TC-018: JSON data alignment', () => {
  function validatePlayer(player) {
    expect(typeof player.id).toBe('string');
    expect(typeof player.name).toBe('string');
    expect(typeof player.team).toBe('string');
    expect(typeof player.position).toBe('string');
    expect(typeof player.basePrice).toBe('number');

    if (player.priceHistory) {
      for (const entry of player.priceHistory) {
        expect(typeof entry.timestamp).toBe('string');
        expect(typeof entry.price).toBe('number');
        expect(entry.reason).toBeDefined();
        expect(typeof entry.reason.type).toBe('string');
        expect(['news', 'game_event', 'league_trade']).toContain(entry.reason.type);
        expect(typeof entry.reason.headline).toBe('string');

        if (entry.content) {
          for (const item of entry.content) {
            expect(typeof item.type).toBe('string');
          }
        }
      }
    }
  }

  function validateScenario(data) {
    expect(typeof data.scenario).toBe('string');
    expect(Array.isArray(data.players)).toBe(true);
    expect(data.players.length).toBeGreaterThan(0);

    if (data.startingPortfolio) {
      for (const [key, holding] of Object.entries(data.startingPortfolio)) {
        expect(typeof key).toBe('string');
        expect(typeof holding.shares).toBe('number');
        expect(typeof holding.avgCost).toBe('number');
      }
    }

    for (const player of data.players) {
      validatePlayer(player);
    }
  }

  const scenarios = ['midweek', 'live', 'playoffs', 'superbowl'];

  it.each(scenarios)('%s.json conforms to ScenarioData shape', (scenario) => {
    const data = readJSON(`${scenario}.json`);
    validateScenario(data);
  });

  it('leagueMembers.json conforms to LeagueData shape', () => {
    const data = readJSON('leagueMembers.json');
    expect(Array.isArray(data.members)).toBe(true);
    expect(data.members.length).toBeGreaterThan(0);

    for (const member of data.members) {
      expect(typeof member.id).toBe('string');
      expect(typeof member.name).toBe('string');
      if (member.avatar !== undefined) expect(typeof member.avatar).toBe('string');
      if (member.isUser !== undefined) expect(typeof member.isUser).toBe('boolean');
    }

    expect(typeof data.holdings).toBe('object');
    for (const [playerId, holdings] of Object.entries(data.holdings)) {
      expect(typeof playerId).toBe('string');
      expect(Array.isArray(holdings)).toBe(true);
      for (const h of holdings) {
        expect(typeof h.memberId).toBe('string');
        expect(typeof h.shares).toBe('number');
        expect(typeof h.avgCost).toBe('number');
      }
    }
  });
});
