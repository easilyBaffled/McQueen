# Test Plan: mcq-tj0.1 -- Create TypeScript type definitions

## Summary

- **Bead:** `mcq-tj0.1`
- **Feature:** TypeScript type definitions for all McQueen data shapes (interfaces, union types, and re-exports in `src/types/`)
- **Total Test Cases:** 18
- **Test Types:** Functional, Integration

---

## TC-001: src/types/ directory exists with expected module files

**Priority:** P0
**Type:** Functional

### Objective

Verify the `src/types/` directory is created and contains the required module files that organize types by domain.

### Preconditions

- Repository is cloned and dependencies are installed.

### Steps

1. Check that the directory `src/types/` exists.
   **Expected:** The directory is present at the project root under `src/`.

2. List the files inside `src/types/`.
   **Expected:** At minimum the following files exist: `index.ts`, `scenario.ts`, `simulation.ts`, `social.ts`, `espn.ts`, `trading.ts`.

### Test Data

- N/A

### Edge Cases

- No extraneous `.js` or `.d.ts` files should be present (only `.ts` source files).

---

## TC-002: index.ts re-exports all type modules

**Priority:** P0
**Type:** Functional

### Objective

Verify that `src/types/index.ts` is a barrel file that re-exports every type module so consumers can import from a single entry point.

### Preconditions

- `src/types/index.ts` exists.

### Steps

1. Read `src/types/index.ts`.
   **Expected:** The file contains `export * from './scenario'`, `export * from './trading'`, `export * from './simulation'`, `export * from './social'`, and `export * from './espn'`.

2. Import `{ ScenarioData, Player, LeagueMember, Article, TimelineEntry, TradeResult }` from `src/types/index.ts` in a test harness or IDE.
   **Expected:** All named imports resolve without errors; no "module not found" or "export not found" diagnostics.

### Test Data

- N/A

### Edge Cases

- If a new module is added to `src/types/` but not added to `index.ts`, the re-export chain breaks. Verify no module is omitted.

---

## TC-003: ScenarioData interface is defined with correct shape

**Priority:** P0
**Type:** Functional

### Objective

Verify the `ScenarioData` interface matches the JSON root structure: `scenario` (required string), `timestamp` (optional string), `headline` (optional string), `startingPortfolio` (optional Portfolio), `players` (required Player[]).

### Preconditions

- `src/types/scenario.ts` exists and is importable.

### Steps

1. Inspect the exported `ScenarioData` interface.
   **Expected:** It has exactly these fields:
   - `scenario: string` (required)
   - `timestamp?: string` (optional)
   - `headline?: string` (optional)
   - `startingPortfolio?: Portfolio` (optional)
   - `players: Player[]` (required)

2. Attempt to assign an object with only `{ scenario: "test", players: [] }` to a variable typed `ScenarioData`.
   **Expected:** TypeScript compiles without error since all required fields are present.

3. Attempt to assign an object missing `players` to `ScenarioData`.
   **Expected:** TypeScript reports a compile error for the missing required field.

### Test Data

- `{ scenario: "live", timestamp: "2025-12-09T21:45:00", headline: "MNF", players: [] }`
- `{ scenario: "live" }` (missing `players` — should fail)

### Edge Cases

- An object with extra unknown properties should be flagged by TypeScript's excess property check in strict mode.

---

## TC-004: Player interface is defined with correct shape

**Priority:** P0
**Type:** Functional

### Objective

Verify the `Player` interface captures all fields from the player object schema, with correct required/optional designations.

### Preconditions

- `src/types/scenario.ts` exists.

### Steps

1. Inspect the exported `Player` interface.
   **Expected:** It has these fields:
   - `id: string` (required)
   - `name: string` (required)
   - `team: string` (required)
   - `position: string` (required)
   - `basePrice: number` (required)
   - `totalSharesAvailable?: number` (optional)
   - `isActive?: boolean` (optional)
   - `isBuyback?: boolean` (optional)
   - `priceHistory?: PriceHistoryEntry[]` (optional)
   - `espnId?: string` (optional)
   - `searchTerms?: string[]` (optional)

2. Assign a minimal valid player object `{ id: "test", name: "Test", team: "KC", position: "QB", basePrice: 100 }`.
   **Expected:** Compiles without error.

3. Omit `basePrice` from the object.
   **Expected:** TypeScript reports a compile error.

### Test Data

- Full player object from `live.json` (Mahomes entry).

### Edge Cases

- `priceHistory` is typed as `PriceHistoryEntry[]`, not a raw `any[]`. Assigning an array with incorrect entry shapes should produce a type error.

---

## TC-005: PriceHistoryEntry interface is defined with correct shape

**Priority:** P0
**Type:** Functional

### Objective

Verify `PriceHistoryEntry` captures `timestamp`, `price`, `reason`, and optional `content` and `sentimentDescription`.

### Preconditions

- `src/types/scenario.ts` exists.

### Steps

1. Inspect the exported `PriceHistoryEntry` interface.
   **Expected:** Fields are:
   - `timestamp: string` (required)
   - `price: number` (required)
   - `reason: PriceReason` (required)
   - `content?: ContentItem[]` (optional)
   - `sentimentDescription?: string` (optional)

2. Construct a valid `PriceHistoryEntry` with all required fields and no optional ones.
   **Expected:** Compiles without error.

### Test Data

- Touchdown event entry from `live.json`.

### Edge Cases

- `reason` must be typed as `PriceReason`, not a loose `object` or `any`.

---

## TC-006: PriceReason interface is defined with union type constraint

**Priority:** P0
**Type:** Functional

### Objective

Verify `PriceReason` uses a union literal type for `type` and includes all variant-specific optional fields.

### Preconditions

- `src/types/scenario.ts` exists.

### Steps

1. Inspect the exported `PriceReason` interface.
   **Expected:** Fields include:
   - `type: 'news' | 'game_event' | 'league_trade'` (required, union literal)
   - `headline: string` (required)
   - `source?: string` (optional)
   - `eventType?: string` (optional, used by `game_event`)
   - `url?: string` (optional)
   - `memberId?: string` (optional, used by `league_trade`)
   - `action?: string` (optional, used by `league_trade`)
   - `shares?: number` (optional, used by `league_trade`)
   - `sentiment?: string` (optional)
   - `magnitude?: number` (optional)

2. Assign `{ type: 'news', headline: 'Test' }` to `PriceReason`.
   **Expected:** Compiles without error.

3. Assign `{ type: 'invalid', headline: 'Test' }` to `PriceReason`.
   **Expected:** TypeScript reports a type error because `'invalid'` is not in the union.

### Test Data

- News reason, game_event reason, and league_trade reason objects from the scenario JSON files.

### Edge Cases

- `type` must be a string literal union, not a plain `string`, to provide compile-time narrowing.

---

## TC-007: ContentItem interface is defined with correct shape

**Priority:** P1
**Type:** Functional

### Objective

Verify `ContentItem` captures optional `type`, `title`, `headline`, `source`, and `url` fields.

### Preconditions

- `src/types/scenario.ts` exists.

### Steps

1. Inspect the exported `ContentItem` interface.
   **Expected:** Fields include:
   - `type: string` (required)
   - `title?: string` (optional)
   - `headline?: string` (optional)
   - `source?: string` (optional)
   - `url?: string` (optional)

2. Assign `{ type: 'video' }` to `ContentItem`.
   **Expected:** Compiles without error.

### Test Data

- Content tile objects from `live.json`.

### Edge Cases

- Empty object `{}` should fail compilation (missing `type`).

---

## TC-008: Portfolio type alias and Holding interface

**Priority:** P0
**Type:** Functional

### Objective

Verify `Holding` is a typed interface with `shares` and `avgCost`, and `Portfolio` is a `Record<string, Holding>` type alias.

### Preconditions

- `src/types/scenario.ts` exists.

### Steps

1. Inspect the `Holding` interface.
   **Expected:** Fields are:
   - `shares: number` (required)
   - `avgCost: number` (required)

2. Inspect the `Portfolio` type.
   **Expected:** Defined as `Record<string, Holding>`.

3. Assign `{ "mahomes": { shares: 10, avgCost: 140 } }` to a `Portfolio` variable.
   **Expected:** Compiles without error.

4. Assign `{ "mahomes": { shares: "ten", avgCost: 140 } }` to `Portfolio`.
   **Expected:** TypeScript reports a type error (`shares` must be `number`).

### Test Data

- N/A

### Edge Cases

- An empty object `{}` is a valid `Record<string, Holding>` — this is expected behavior.

---

## TC-009: TimelineEntry interface is defined with correct shape

**Priority:** P0
**Type:** Functional

### Objective

Verify `TimelineEntry` captures the merged timeline shape with cross-file type references.

### Preconditions

- `src/types/simulation.ts` exists.
- `src/types/scenario.ts` exists (provides `PriceReason` and `ContentItem`).

### Steps

1. Inspect the exported `TimelineEntry` interface.
   **Expected:** Fields are:
   - `playerId: string` (required)
   - `playerName: string` (required)
   - `entryIndex: number` (required)
   - `timestamp: string` (required)
   - `price: number` (required)
   - `reason: PriceReason` (required, imported from scenario)
   - `content?: ContentItem[]` (optional, imported from scenario)

2. Verify `simulation.ts` imports `PriceReason` and `ContentItem` from `./scenario`.
   **Expected:** The import statement `import type { PriceReason, ContentItem } from './scenario'` is present.

### Test Data

- N/A

### Edge Cases

- Removing the import from `./scenario` should cause a compile error, confirming the cross-module dependency is real and not shadowed by local definitions.

---

## TC-010: HistoryEntry interface is defined with correct shape

**Priority:** P1
**Type:** Functional

### Objective

Verify `HistoryEntry` captures the simulation history shape for tick-based replay.

### Preconditions

- `src/types/simulation.ts` exists.

### Steps

1. Inspect the exported `HistoryEntry` interface.
   **Expected:** Fields are:
   - `tick: number` (required)
   - `prices: Record<string, number>` (required)
   - `action: string` (required)
   - `playerId?: string` (optional)
   - `playerName?: string` (optional)
   - `sentiment?: string` (optional)
   - `changePercent?: number` (optional)

2. Assign `{ tick: 0, prices: {}, action: "init" }` to `HistoryEntry`.
   **Expected:** Compiles without error.

### Test Data

- N/A

### Edge Cases

- `prices` must be `Record<string, number>`, not `Record<string, any>`.

---

## TC-011: MissionPicks interface is defined with correct shape

**Priority:** P1
**Type:** Functional

### Objective

Verify `MissionPicks` captures the risers/fallers prediction arrays.

### Preconditions

- `src/types/social.ts` exists.

### Steps

1. Inspect the exported `MissionPicks` interface.
   **Expected:** Fields are:
   - `risers: string[]` (required)
   - `fallers: string[]` (required)

2. Assign `{ risers: ["mahomes"], fallers: ["hill"] }` to `MissionPicks`.
   **Expected:** Compiles without error.

3. Assign `{ risers: [1], fallers: [] }` to `MissionPicks`.
   **Expected:** TypeScript reports a type error (`number` is not assignable to `string`).

### Test Data

- N/A

### Edge Cases

- Empty arrays `{ risers: [], fallers: [] }` should be valid.

---

## TC-012: LeaderboardEntry interface is defined with correct shape

**Priority:** P1
**Type:** Functional

### Objective

Verify `LeaderboardEntry` captures all ranking and portfolio value fields, including the self-referential `traderAhead` field.

### Preconditions

- `src/types/social.ts` exists.

### Steps

1. Inspect the exported `LeaderboardEntry` interface.
   **Expected:** Fields include:
   - `memberId: string` (required)
   - `name: string` (required)
   - `avatar?: string` (optional)
   - `isUser: boolean` (required)
   - `cash: number` (required)
   - `holdingsValue: number` (required)
   - `totalValue: number` (required)
   - `rank: number` (required)
   - `gapToNext: number` (required)
   - `gain?: number` (optional)
   - `gainPercent?: number` (optional)
   - `traderAhead?: LeaderboardEntry | null` (optional, self-referential)

2. Verify that `traderAhead` is typed as `LeaderboardEntry | null`, allowing recursive reference.
   **Expected:** The type compiles and can represent a chain of entries.

### Test Data

- N/A

### Edge Cases

- A `LeaderboardEntry` with `traderAhead: null` should compile (first-place entry).
- A `LeaderboardEntry` with `traderAhead: undefined` (omitted) should also compile.

---

## TC-013: Article interface is defined with correct shape

**Priority:** P1
**Type:** Functional

### Objective

Verify the ESPN `Article` interface captures full article metadata including nested image and category types.

### Preconditions

- `src/types/espn.ts` exists.

### Steps

1. Inspect the exported `Article` interface.
   **Expected:** Fields include:
   - `id: string` (required)
   - `headline: string` (required)
   - `description: string` (required)
   - `published: string` (required)
   - `url: string` (required)
   - `images: ArticleImage[]` (required)
   - `thumbnail: string | null` (required, nullable)
   - `source: string` (required)
   - `type: string` (required)
   - `premium: boolean` (required)
   - `categories: ArticleCategory[]` (required)
   - `_raw?: Record<string, unknown>` (optional)

2. Verify `ArticleImage` and `ArticleCategory` are also exported as supporting types.
   **Expected:** Both interfaces are exported from `espn.ts`.

### Test Data

- N/A

### Edge Cases

- `thumbnail` accepts `null` (not just `undefined`), distinguishing between "no thumbnail" and "field absent".
- `_raw` uses `Record<string, unknown>` (not `any`) for type safety.

---

## TC-014: GameEvent interface is defined with correct shape

**Priority:** P1
**Type:** Functional

### Objective

Verify `GameEvent` and its supporting types (`GameEventTeam`, `GameEventStatus`) capture live game event data.

### Preconditions

- `src/types/espn.ts` exists.

### Steps

1. Inspect the exported `GameEvent` interface.
   **Expected:** Fields include:
   - `id: string` (required)
   - `name: string` (required)
   - `shortName: string` (required)
   - `date: string` (required)
   - `status: GameEventStatus` (required)
   - `homeTeam: GameEventTeam | null` (required, nullable)
   - `awayTeam: GameEventTeam | null` (required, nullable)
   - `venue: string` (required)
   - `broadcast: string` (required)

2. Verify `GameEventStatus` has `type`, `description`, `period`, and `clock` fields.
   **Expected:** All four fields are required strings/numbers.

3. Verify `GameEventTeam` has `id`, `abbr`, `name`, `score`, and `logo` fields.
   **Expected:** All five fields are required strings.

### Test Data

- N/A

### Edge Cases

- `homeTeam` and `awayTeam` can be `null` (e.g., for bye weeks or TBD matchups).

---

## TC-015: LeagueMember and LeagueHolding interfaces are defined

**Priority:** P0
**Type:** Functional

### Objective

Verify `LeagueMember` and `LeagueHolding` (referred to as "LeagueHoldings" in the bead description) match the `leagueMembers.json` schema.

### Preconditions

- `src/types/social.ts` exists.

### Steps

1. Inspect the exported `LeagueMember` interface.
   **Expected:** Fields are:
   - `id: string` (required)
   - `name: string` (required)
   - `avatar?: string` (optional)
   - `isUser?: boolean` (optional)

2. Inspect the exported `LeagueHolding` interface.
   **Expected:** Fields are:
   - `memberId: string` (required)
   - `shares: number` (required)
   - `avgCost: number` (required)

3. Verify `LeagueData` uses these two types: `members: LeagueMember[]` and `holdings: Record<string, LeagueHolding[]>`.
   **Expected:** The composite `LeagueData` interface composes both correctly.

### Test Data

- Sample from `leagueMembers.json`.

### Edge Cases

- `avatar` is optional (the user member has no avatar).
- `isUser` is optional (AI members omit it).

---

## TC-016: PortfolioStats and TradeResult interfaces (trading.ts)

**Priority:** P1
**Type:** Functional

### Objective

Verify the trading domain types are defined for portfolio value tracking and trade outcomes.

### Preconditions

- `src/types/trading.ts` exists.

### Steps

1. Inspect the exported `PortfolioStats` interface.
   **Expected:** Fields are:
   - `value: number` (required)
   - `cost: number` (required)
   - `gain: number` (required)
   - `gainPercent: number` (required)

2. Inspect the exported `TradeResult` interface.
   **Expected:** Fields are:
   - `success: boolean` (required)
   - `playerId?: string` (optional)
   - `shares?: number` (optional)
   - `price?: number` (optional)
   - `total?: number` (optional)

### Test Data

- N/A

### Edge Cases

- A failed trade `{ success: false }` should be valid (all other fields are optional).

---

## TC-017: SimulationMode union type is defined

**Priority:** P1
**Type:** Functional

### Objective

Verify the `SimulationMode` type is a string literal union covering all supported scenario modes.

### Preconditions

- `src/types/scenario.ts` exists.

### Steps

1. Inspect the exported `SimulationMode` type.
   **Expected:** Defined as `'midweek' | 'live' | 'playoffs' | 'superbowl' | 'espn-live'`.

2. Assign `'live'` to a variable typed `SimulationMode`.
   **Expected:** Compiles without error.

3. Assign `'exhibition'` to a variable typed `SimulationMode`.
   **Expected:** TypeScript reports a type error.

### Test Data

- N/A

### Edge Cases

- The union should be exhaustive for all scenarios currently supported by the game engine.

---

## TC-018: Types align with actual JSON data files

**Priority:** P0
**Type:** Integration

### Objective

Verify that the type definitions are structurally compatible with the actual JSON data files (`midweek.json`, `live.json`, `playoffs.json`, `leagueMembers.json`). This ensures the types are not just syntactically valid but semantically correct.

### Preconditions

- All JSON data files exist in `src/data/`.
- All type definition files exist in `src/types/`.
- `tsconfig.json` has `resolveJsonModule: true` and `strict: true`.

### Steps

1. In a test file, import a scenario JSON file and type-assert it as `ScenarioData`:
   ```ts
   import liveData from '../data/live.json';
   const typed: ScenarioData = liveData;
   ```
   **Expected:** Compiles without error — the JSON shape satisfies `ScenarioData`.

2. Import `leagueMembers.json` and type-assert it as `LeagueData`.
   **Expected:** Compiles without error.

3. Run `npx tsc --noEmit` across the project.
   **Expected:** Zero type errors related to `src/types/` or files importing from `src/types/`.

### Test Data

- `src/data/midweek.json`, `src/data/live.json`, `src/data/playoffs.json`, `src/data/leagueMembers.json`.

### Edge Cases

- If any JSON field is present in the data but absent from the type, `tsc --noEmit` under strict mode will surface it.
- If a required field in the type is missing from the JSON, the type assertion will fail.
