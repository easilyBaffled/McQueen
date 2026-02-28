# Test Plan: mcq-vlu.4 -- Create SocialContext

## Summary

- **Bead:** `mcq-vlu.4`
- **Feature:** SocialContext providing watchlist (persisted via storageService, survives scenario switches), mission picks/scoring (resets on scenarioVersion change), and leaderboard rankings from real league member data
- **Total Test Cases:** 25
- **Test Types:** Functional, Integration

---

## TC-001: useSocial hook returns correct initial state with empty storage

**Priority:** P0
**Type:** Functional

### Objective

Verify that SocialContext provides all expected fields with correct defaults when localStorage is empty.

### Preconditions

- SocialProvider rendered inside full provider tree (ScenarioProvider → SimulationProvider → TradingProvider → SocialProvider)
- localStorage is cleared

### Steps

1. Call `useSocial()`
   **Expected:** Returns object with all fields: `watchlist`, `missionPicks`, `missionRevealed`, `addToWatchlist`, `removeFromWatchlist`, `isWatching`, `setMissionPick`, `clearMissionPick`, `revealMission`, `resetMission`, `getMissionScore`, `getLeaderboardRankings`, `getLeagueHoldings`, `getLeagueMembers`

2. Check `watchlist`
   **Expected:** `[]`

3. Check `missionPicks`
   **Expected:** `{ risers: [], fallers: [] }`

4. Check `missionRevealed`
   **Expected:** `false`

### Test Data

- N/A

### Edge Cases

- N/A (see TC-002 for hook misuse)

---

## TC-002: useSocial throws outside SocialProvider

**Priority:** P0
**Type:** Functional

### Objective

Verify that calling `useSocial()` outside a `SocialProvider` throws a descriptive error, preventing silent undefined behavior.

### Preconditions

- No SocialProvider in the component tree

### Steps

1. Render a component that calls `useSocial()` without a wrapping SocialProvider
   **Expected:** Throws error with message `"useSocial must be used within a SocialProvider"`

### Test Data

- N/A

### Edge Cases

- N/A

---

## TC-003: addToWatchlist adds a player

**Priority:** P0
**Type:** Functional

### Objective

Verify that calling `addToWatchlist` with a player ID adds that ID to the watchlist array.

### Preconditions

- SocialProvider rendered, watchlist initially empty

### Steps

1. Call `addToWatchlist('mahomes')`
   **Expected:** `watchlist` contains `['mahomes']`

2. Call `isWatching('mahomes')`
   **Expected:** Returns `true`

3. Call `isWatching('allen')`
   **Expected:** Returns `false`

### Test Data

- Player IDs: `'mahomes'`, `'allen'`

### Edge Cases

- Adding an empty string as player ID — should still be added (no validation in implementation)

---

## TC-004: addToWatchlist is idempotent (no duplicates)

**Priority:** P0
**Type:** Functional

### Objective

Verify that calling `addToWatchlist` with an already-watched player ID does not create a duplicate entry.

### Preconditions

- SocialProvider rendered, `'mahomes'` already in watchlist

### Steps

1. Call `addToWatchlist('mahomes')` when `'mahomes'` is already in watchlist
   **Expected:** `watchlist` still contains exactly one `'mahomes'` entry; `watchlist.length` unchanged

2. Call `addToWatchlist('allen')` then `addToWatchlist('allen')`
   **Expected:** `watchlist` contains `['mahomes', 'allen']` — only two items

### Test Data

- Player IDs: `'mahomes'`, `'allen'`

### Edge Cases

- Rapid duplicate calls in sequence — array length must never exceed unique count

---

## TC-005: removeFromWatchlist removes a player

**Priority:** P0
**Type:** Functional

### Objective

Verify that calling `removeFromWatchlist` removes the specified player ID from the watchlist.

### Preconditions

- SocialProvider rendered, watchlist contains `['mahomes', 'allen']`

### Steps

1. Call `removeFromWatchlist('mahomes')`
   **Expected:** `watchlist` is `['allen']`; `isWatching('mahomes')` returns `false`

2. Call `removeFromWatchlist('allen')`
   **Expected:** `watchlist` is `[]`

### Test Data

- Player IDs: `'mahomes'`, `'allen'`

### Edge Cases

- Calling `removeFromWatchlist('nonexistent')` when ID is not in watchlist — should be a no-op, watchlist unchanged

---

## TC-006: Watchlist persists via storageService

**Priority:** P0
**Type:** Functional

### Objective

Verify that watchlist changes are written to storage with key `STORAGE_KEYS.watchlist` (`'mcqueen-watchlist'`) and restored on remount.

### Preconditions

- storageService is functional
- localStorage is cleared

### Steps

1. Call `addToWatchlist('mahomes')`, then `addToWatchlist('allen')`
   **Expected:** `storageService.write` is called with key `'mcqueen-watchlist'` and value `['mahomes', 'allen']`

2. Unmount SocialProvider, then remount a new SocialProvider
   **Expected:** `watchlist` initializes as `['mahomes', 'allen']` (read from storage)

### Test Data

- Storage key: `'mcqueen-watchlist'`

### Edge Cases

- Corrupt storage value (e.g., invalid JSON) — should fall back to `[]`

---

## TC-007: Watchlist persists across scenario switches (NOT reset)

**Priority:** P0
**Type:** Integration

### Objective

Verify that switching scenarios (changing `scenarioVersion`) does NOT reset the watchlist — it is explicitly preserved across scenario changes.

### Preconditions

- SocialProvider rendered inside full provider tree
- Watchlist contains `['mahomes', 'allen']`

### Steps

1. Confirm `watchlist` is `['mahomes', 'allen']`
   **Expected:** Watchlist has two entries

2. Trigger a scenario switch (e.g., call `setScenario('playoffs')` to increment `scenarioVersion`)
   **Expected:** `watchlist` is still `['mahomes', 'allen']` — unchanged

3. Call `isWatching('mahomes')`
   **Expected:** Returns `true`

### Test Data

- Any two valid player IDs

### Edge Cases

- Multiple rapid scenario switches — watchlist must survive all of them

---

## TC-008: setMissionPick adds player as riser

**Priority:** P0
**Type:** Functional

### Objective

Verify that calling `setMissionPick` with type `'riser'` adds the player to the risers category.

### Preconditions

- SocialProvider rendered, missionPicks is `{ risers: [], fallers: [] }`

### Steps

1. Call `setMissionPick('mahomes', 'riser')`
   **Expected:** `missionPicks.risers` is `['mahomes']`; `missionPicks.fallers` is `[]`

2. Call `setMissionPick('allen', 'riser')`
   **Expected:** `missionPicks.risers` is `['mahomes', 'allen']`

### Test Data

- Player IDs: `'mahomes'`, `'allen'`

### Edge Cases

- N/A (see TC-010 for category limit)

---

## TC-009: setMissionPick adds player as faller

**Priority:** P0
**Type:** Functional

### Objective

Verify that calling `setMissionPick` with type `'faller'` adds the player to the fallers category.

### Preconditions

- SocialProvider rendered, missionPicks is `{ risers: [], fallers: [] }`

### Steps

1. Call `setMissionPick('burrow', 'faller')`
   **Expected:** `missionPicks.fallers` is `['burrow']`; `missionPicks.risers` is `[]`

### Test Data

- Player ID: `'burrow'`

### Edge Cases

- N/A

---

## TC-010: setMissionPick enforces MISSION_PICKS_PER_CATEGORY limit (3)

**Priority:** P0
**Type:** Functional

### Objective

Verify that each category (risers, fallers) is capped at `MISSION_PICKS_PER_CATEGORY` (3). Attempting to add a 4th pick to a full category is silently ignored.

### Preconditions

- SocialProvider rendered

### Steps

1. Call `setMissionPick('p1', 'riser')`, `setMissionPick('p2', 'riser')`, `setMissionPick('p3', 'riser')`
   **Expected:** `missionPicks.risers` is `['p1', 'p2', 'p3']` (length 3)

2. Call `setMissionPick('p4', 'riser')`
   **Expected:** `missionPicks.risers` is still `['p1', 'p2', 'p3']` — `'p4'` is NOT added

3. Repeat for fallers: add 3 fallers, then attempt a 4th
   **Expected:** Fallers capped at 3 as well

### Test Data

- `MISSION_PICKS_PER_CATEGORY` = 3

### Edge Cases

- Adding the same player ID that's already in risers as a riser again — player is removed first then re-added (no net change, still at 3 if category was full minus 1)

---

## TC-011: setMissionPick moves player between categories

**Priority:** P1
**Type:** Functional

### Objective

Verify that calling `setMissionPick` for a player already in one category removes them from the old category and adds them to the new one.

### Preconditions

- SocialProvider rendered, `'mahomes'` is in risers

### Steps

1. Call `setMissionPick('mahomes', 'riser')` to place in risers
   **Expected:** `missionPicks.risers` contains `'mahomes'`

2. Call `setMissionPick('mahomes', 'faller')`
   **Expected:** `missionPicks.risers` no longer contains `'mahomes'`; `missionPicks.fallers` contains `'mahomes'`

### Test Data

- Player ID: `'mahomes'`

### Edge Cases

- Moving a player when the target category is at the limit — player is removed from source but NOT added to target (target full)

---

## TC-012: clearMissionPick removes player from both categories

**Priority:** P1
**Type:** Functional

### Objective

Verify that `clearMissionPick` removes the specified player ID from both risers and fallers.

### Preconditions

- SocialProvider rendered, `'mahomes'` is in risers, `'allen'` is in fallers

### Steps

1. Call `clearMissionPick('mahomes')`
   **Expected:** `missionPicks.risers` no longer contains `'mahomes'`; fallers unchanged

2. Call `clearMissionPick('allen')`
   **Expected:** `missionPicks.fallers` no longer contains `'allen'`

### Test Data

- Player IDs: `'mahomes'`, `'allen'`

### Edge Cases

- Calling `clearMissionPick('nonexistent')` — no-op, picks unchanged

---

## TC-013: revealMission sets missionRevealed to true

**Priority:** P0
**Type:** Functional

### Objective

Verify that calling `revealMission()` transitions `missionRevealed` from `false` to `true`.

### Preconditions

- SocialProvider rendered, `missionRevealed` is `false`

### Steps

1. Call `revealMission()`
   **Expected:** `missionRevealed` is `true`

2. Call `revealMission()` again
   **Expected:** `missionRevealed` remains `true` (idempotent)

### Test Data

- N/A

### Edge Cases

- N/A

---

## TC-014: resetMission clears picks and unreveals

**Priority:** P0
**Type:** Functional

### Objective

Verify that `resetMission()` clears all mission picks and sets `missionRevealed` back to `false`.

### Preconditions

- SocialProvider rendered, mission has picks in both categories and `missionRevealed` is `true`

### Steps

1. Add picks: `setMissionPick('p1', 'riser')`, `setMissionPick('p2', 'faller')`, then `revealMission()`
   **Expected:** Picks populated, `missionRevealed` is `true`

2. Call `resetMission()`
   **Expected:** `missionPicks` is `{ risers: [], fallers: [] }`; `missionRevealed` is `false`

### Test Data

- N/A

### Edge Cases

- Calling `resetMission()` when already in default state — no-op, no errors

---

## TC-015: getMissionScore returns null when mission not revealed

**Priority:** P0
**Type:** Functional

### Objective

Verify that `getMissionScore()` returns `null` when `missionRevealed` is `false`, regardless of picks.

### Preconditions

- SocialProvider rendered, picks may or may not exist, `missionRevealed` is `false`

### Steps

1. Add picks: `setMissionPick('p1', 'riser')`, `setMissionPick('p2', 'faller')`
   **Expected:** Picks populated

2. Call `getMissionScore()`
   **Expected:** Returns `null`

### Test Data

- N/A

### Edge Cases

- N/A

---

## TC-016: getMissionScore calculates correct results when revealed

**Priority:** P0
**Type:** Functional

### Objective

Verify that `getMissionScore()` returns the correct `{ correct, total, percentile }` object after mission is revealed, based on each player's `changePercent`.

### Preconditions

- SocialProvider rendered inside full provider tree with players loaded
- Players have known `changePercent` values (some positive, some negative)

### Steps

1. Pick 2 risers with positive `changePercent` and 1 riser with negative `changePercent`
   **Expected:** Picks registered

2. Pick 1 faller with negative `changePercent`
   **Expected:** Picks registered

3. Call `revealMission()`
   **Expected:** `missionRevealed` is `true`

4. Call `getMissionScore()`
   **Expected:** Returns `{ correct: 3, total: 4, percentile: 88 }` — 2 correct risers + 1 correct faller = 3; percentile = `Math.round(50 + (3/4) * 50)` = 88

### Test Data

- Players with positive `changePercent`: at least 2
- Players with negative `changePercent`: at least 2
- `MISSION_PICKS_PER_CATEGORY` = 3

### Edge Cases

- All picks correct (percentile = 100)
- All picks wrong (percentile = 50)
- Zero picks total (percentile = `Math.round(50 + 0/1 * 50)` = 50)
- Player with `changePercent === 0` — counts as WRONG for both riser and faller

---

## TC-017: Mission state resets on scenarioVersion change

**Priority:** P0
**Type:** Integration

### Objective

Verify that when `scenarioVersion` changes (via `setScenario`), mission picks are cleared and `missionRevealed` is set to `false`.

### Preconditions

- SocialProvider rendered inside full provider tree
- Mission has picks and is revealed

### Steps

1. Add picks and reveal: `setMissionPick('p1', 'riser')`, `revealMission()`
   **Expected:** `missionPicks.risers` contains `'p1'`, `missionRevealed` is `true`

2. Trigger scenario switch: call `setScenario('playoffs')`
   **Expected:** `missionPicks` resets to `{ risers: [], fallers: [] }`; `missionRevealed` resets to `false`

### Test Data

- Any valid scenario key

### Edge Cases

- Multiple rapid scenario switches — mission state must be reset after each one

---

## TC-018: scenarioVersion === 0 does NOT trigger mission reset

**Priority:** P1
**Type:** Functional

### Objective

Verify that the initial `scenarioVersion` of `0` does not trigger the mission reset effect, allowing initial state to remain intact.

### Preconditions

- SocialProvider mounted for the first time (scenarioVersion = 0)
- Watchlist has been loaded from storage with saved picks (hypothetical)

### Steps

1. Render SocialProvider where `scenarioVersion` starts at `0`
   **Expected:** `missionPicks` remains `{ risers: [], fallers: [] }` (default, not a reset artifact)

2. Add picks: `setMissionPick('p1', 'riser')`
   **Expected:** Picks are retained; no automatic clearing occurs

### Test Data

- N/A

### Edge Cases

- N/A

---

## TC-019: League data loads from JSON on mount

**Priority:** P0
**Type:** Functional

### Objective

Verify that league members and holdings are loaded asynchronously from `leagueMembers.json` when SocialProvider mounts.

### Preconditions

- SocialProvider rendered inside full provider tree

### Steps

1. Render SocialProvider and wait for async load to complete
   **Expected:** `getLeagueMembers()` returns a non-empty array of `LeagueMember` objects with `id`, `name`, and optional `avatar`/`isUser` fields

### Test Data

- League data file: `src/data/leagueMembers.json`

### Edge Cases

- If league data returns `null` members — should default to `[]`
- If league data returns `null` holdings — should default to `{}`

---

## TC-020: League data is cached after first load

**Priority:** P1
**Type:** Functional

### Objective

Verify that the `getLeagueData()` function caches results after the first successful load, so subsequent mounts do not re-import the JSON module.

### Preconditions

- SocialProvider has been mounted once and league data loaded

### Steps

1. Mount SocialProvider, wait for league data to load
   **Expected:** `getLeagueMembers()` returns members

2. Unmount and remount SocialProvider
   **Expected:** `getLeagueMembers()` returns the same data without a new dynamic import (cache hit)

### Test Data

- N/A

### Edge Cases

- N/A

---

## TC-021: getLeaderboardRankings includes all AI members and user, sorted by totalValue

**Priority:** P0
**Type:** Functional

### Objective

Verify that `getLeaderboardRankings()` returns an array containing every non-user league member (with `AI_BASE_CASH` = 2000) plus a user entry, sorted descending by `totalValue`, with correct `rank`, `gapToNext`, and `traderAhead`.

### Preconditions

- SocialProvider rendered, league data loaded
- User has a known portfolio and cash balance

### Steps

1. Call `getLeaderboardRankings()`
   **Expected:** Returns array sorted by `totalValue` descending

2. Check the user entry (where `isUser === true`)
   **Expected:** `name` is `'You'`, `avatar` is `'👤'`, `cash` matches user's actual cash, `holdingsValue` matches `getPortfolioValue().value`, `totalValue` = `cash + holdingsValue`

3. Check an AI member entry
   **Expected:** `cash` is `AI_BASE_CASH` (2000), `holdingsValue` is the sum of (effectivePrice × shares) for all their holdings, `totalValue` = `cash + holdingsValue`

4. Check `rank` fields
   **Expected:** Sequential 1-based ranks matching sort order

5. Check `gapToNext` for rank 1 entry
   **Expected:** `gapToNext` is `0`

6. Check `gapToNext` for a non-rank-1 entry
   **Expected:** `gapToNext` = (totalValue of rank above) − (own totalValue)

7. Check `traderAhead` for rank 1 entry
   **Expected:** `null`

8. Check `traderAhead` for a non-rank-1 entry
   **Expected:** Object describing the trader one rank above

### Test Data

- `AI_BASE_CASH` = 2000
- `INITIAL_CASH` = 10000

### Edge Cases

- User has no holdings (holdingsValue = 0, totalValue = cash only)
- All AI members have no holdings (all tied at AI_BASE_CASH) — sort is stable, ranks still assigned

---

## TC-022: getLeagueHoldings returns enriched holdings for a player

**Priority:** P0
**Type:** Functional

### Objective

Verify that `getLeagueHoldings(playerId)` returns an array of enriched holdings with `name`, `avatar`, `isUser`, `currentValue`, and `gainPercent` computed from effective price.

### Preconditions

- SocialProvider rendered, league data loaded
- League holdings contain entries for the queried player

### Steps

1. Call `getLeagueHoldings('mahomes')` for a player with known league holdings
   **Expected:** Returns array of objects, each containing original `memberId`, `shares`, `avgCost` plus enriched `name`, `avatar`, `isUser`, `currentValue`, `gainPercent`

2. Verify `currentValue` calculation
   **Expected:** `currentValue` = `effectivePrice * shares`, rounded to 2 decimal places

3. Verify `gainPercent` calculation
   **Expected:** `gainPercent` = `((effectivePrice - avgCost) / avgCost) * 100`, rounded to 2 decimal places

### Test Data

- A player with at least 2 league member holdings at different `avgCost` values

### Edge Cases

- `avgCost` of 0 — would cause division by zero in gainPercent (potential bug to document)

---

## TC-023: getLeagueHoldings includes user's own holding

**Priority:** P0
**Type:** Functional

### Objective

Verify that if the user holds shares of a player, their holding appears first in the `getLeagueHoldings` result with `memberId: 'user'`.

### Preconditions

- SocialProvider rendered, league data loaded
- User has bought shares of the queried player

### Steps

1. Buy shares of `'mahomes'` via `buyShares('mahomes', 5)`
   **Expected:** Portfolio contains `'mahomes'`

2. Call `getLeagueHoldings('mahomes')`
   **Expected:** First entry has `memberId: 'user'`, `isUser: false` (no matching league member with `isUser: true` for `'user'` ID unless explicitly configured), `shares` = user's share count, `avgCost` = user's avg cost

### Test Data

- Player with existing league holdings

### Edge Cases

- User has no holding in the player — user entry should NOT appear in results

---

## TC-024: getLeagueHoldings returns empty array for unknown player

**Priority:** P1
**Type:** Functional

### Objective

Verify that querying holdings for a player ID with no league data returns an empty array (or only the user's holding if they have one).

### Preconditions

- SocialProvider rendered, league data loaded
- User does NOT own shares of the queried player

### Steps

1. Call `getLeagueHoldings('unknown_player_xyz')`
   **Expected:** Returns `[]`

### Test Data

- Non-existent player ID

### Edge Cases

- N/A

---

## TC-025: getLeagueMembers returns all league members

**Priority:** P1
**Type:** Functional

### Objective

Verify that `getLeagueMembers()` returns the full array of league members as loaded from the data file.

### Preconditions

- SocialProvider rendered, league data loaded

### Steps

1. Call `getLeagueMembers()`
   **Expected:** Returns array matching the `members` array from `leagueMembers.json`; each entry has `id`, `name`, and optionally `avatar`, `isUser`

2. Verify at least one member has `isUser: true` (the user's own league entry, if present in data)
   **Expected:** Found or confirmed absent depending on data file contents

### Test Data

- Data from `src/data/leagueMembers.json`

### Edge Cases

- League data has no members (empty array) — returns `[]`
