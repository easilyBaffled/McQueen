# Test Plan: mcq-qbm.1 -- Add unit tests for service modules

## Summary

- **Bead:** `mcq-qbm.1`
- **Feature:** Comprehensive unit tests for sentimentEngine, espnService, priceCalculator, priceResolver, and storageService
- **Total Test Cases:** 45
- **Test Types:** Functional

---

## TC-001: sentimentEngine — null/undefined/empty input returns neutral default

**Priority:** P0
**Type:** Functional

### Objective

Verify that `analyzeSentiment` returns a neutral result with zero magnitude and confidence when given null, undefined, or empty-string input.

### Preconditions

- `analyzeSentiment` is imported from `sentimentEngine.ts`

### Steps

1. Call `analyzeSentiment(null)`
   **Expected:** Returns `{ sentiment: 'neutral', magnitude: 0, confidence: 0, keywords: [] }`

2. Call `analyzeSentiment(undefined)`
   **Expected:** Same neutral default as above

3. Call `analyzeSentiment('')`
   **Expected:** Same neutral default as above

### Test Data

- Inputs: `null`, `undefined`, `''`

### Edge Cases

- Whitespace-only string `'   '` — should still attempt keyword matching (no early return)

---

## TC-002: sentimentEngine — high-level positive keyword detection

**Priority:** P0
**Type:** Functional

### Objective

Verify that high-level positive keywords (e.g., "touchdown", "mvp", "record-breaking") are detected and assigned weight 3, yielding a positive sentiment.

### Preconditions

- `analyzeSentiment` is imported

### Steps

1. Call `analyzeSentiment('Player scores a touchdown in the fourth quarter')`
   **Expected:** `sentiment` is `'positive'`, `keywords` array contains `{ word: 'touchdown', type: 'positive', level: 'high' }`, `scores.positive >= 3`

2. Call `analyzeSentiment('Named MVP of the game')`
   **Expected:** `keywords` includes `{ word: 'mvp', type: 'positive', level: 'high' }`

### Test Data

- All 15 high-level positive keywords should be individually testable

### Edge Cases

- Case insensitivity: `'TOUCHDOWN'` and `'Touchdown'` should both match
- Keyword embedded in a longer word (e.g., `'touchdowns'`) should still match because `includes()` is used

---

## TC-003: sentimentEngine — medium-level positive keyword detection

**Priority:** P1
**Type:** Functional

### Objective

Verify that medium-level positive keywords (e.g., "scores", "breakout", "comeback") are detected and assigned weight 2.

### Preconditions

- `analyzeSentiment` is imported

### Steps

1. Call `analyzeSentiment('Player leads team to a comeback victory')`
   **Expected:** `keywords` contains entries for "leads" and "comeback" with `type: 'positive'` and `level: 'medium'`, `scores.positive >= 4`

### Test Data

- Representative medium keywords: "scores", "leads", "dominates", "breakout", "comeback"

### Edge Cases

- Multiple medium keywords in one text should each contribute weight 2

---

## TC-004: sentimentEngine — low-level positive keyword detection

**Priority:** P1
**Type:** Functional

### Objective

Verify that low-level positive keywords (e.g., "solid", "healthy", "cleared") are detected and assigned weight 1.

### Preconditions

- `analyzeSentiment` is imported

### Steps

1. Call `analyzeSentiment('Player cleared for full participation, looking healthy')`
   **Expected:** `keywords` contains `{ word: 'cleared', type: 'positive', level: 'low' }` and `{ word: 'healthy', type: 'positive', level: 'low' }`, `scores.positive >= 2`

### Test Data

- Representative low keywords: "solid", "consistent", "cleared", "healthy"

### Edge Cases

- "full participation" as a multi-word keyword should match when present in text

---

## TC-005: sentimentEngine — high-level negative keyword detection

**Priority:** P0
**Type:** Functional

### Objective

Verify that high-level negative keywords (e.g., "injury", "torn", "suspended") are detected with weight 3 and produce negative sentiment.

### Preconditions

- `analyzeSentiment` is imported

### Steps

1. Call `analyzeSentiment('Player suffers torn ACL, out for season')`
   **Expected:** `sentiment` is `'negative'`, `keywords` contains entries for "torn", "acl", "out for season" with `level: 'high'`, `scores.negative >= 9`

### Test Data

- All 15 high-level negative keywords

### Edge Cases

- Multiple high-negative keywords in a single headline should accumulate

---

## TC-006: sentimentEngine — medium and low negative keyword detection

**Priority:** P1
**Type:** Functional

### Objective

Verify that medium-level (weight 2) and low-level (weight 1) negative keywords are correctly identified and scored.

### Preconditions

- `analyzeSentiment` is imported

### Steps

1. Call `analyzeSentiment('Player listed as questionable after missed practice')`
   **Expected:** `keywords` includes `{ word: 'questionable', level: 'medium' }` and `{ word: 'missed practice', level: 'medium' }`, `scores.negative >= 4`

2. Call `analyzeSentiment('Minor issue, day-to-day, precautionary rest')`
   **Expected:** `keywords` includes entries with `level: 'low'`, `scores.negative >= 3`

### Test Data

- Medium: "questionable", "limited", "benched", "fumble", "missed practice"
- Low: "minor", "rest", "day-to-day", "precautionary"

### Edge Cases

- None beyond standard matching

---

## TC-007: sentimentEngine — negation flips positive keyword scoring

**Priority:** P0
**Type:** Functional

### Objective

Verify that when a negation word (e.g., "not", "won't", "didn't") appears within 5 words before a positive keyword, the keyword's weight is added to `negativeScore` instead of `positiveScore`.

### Preconditions

- `analyzeSentiment` is imported

### Steps

1. Call `analyzeSentiment("Player did not score a touchdown")`
   **Expected:** `keywords` contains `{ word: 'touchdown', type: 'positive' }`, but `scores.negative >= 3` (weight redirected), `sentiment` is `'negative'`

2. Call `analyzeSentiment("Won't be winning anytime soon")`
   **Expected:** "winning" keyword found, but score added to negative due to "won't" negation

### Test Data

- Each negation word: "not", "no", "won't", "didn't", "isn't", "wasn't", "unlikely", "denied"

### Edge Cases

- Negation word more than 5 words away from keyword should NOT flip the score
- Negation near a negative keyword should flip it to positive (double-negative)

---

## TC-008: sentimentEngine — negation flips negative keyword scoring

**Priority:** P0
**Type:** Functional

### Objective

Verify that negation near a negative keyword adds its weight to `positiveScore` instead of `negativeScore`.

### Preconditions

- `analyzeSentiment` is imported

### Steps

1. Call `analyzeSentiment("The injury is not serious")`
   **Expected:** "injury" detected as negative keyword, but negation flips it — `scores.positive >= 3`

### Test Data

- Negation + high-negative: "not torn", "no fracture", "wasn't suspended"

### Edge Cases

- Negation present in text but far from the keyword — should NOT flip

---

## TC-009: sentimentEngine — position-specific QB keywords

**Priority:** P1
**Type:** Functional

### Objective

Verify that position-specific keywords for QB are matched when `position='QB'` is provided, adding 1.5 to the appropriate score.

### Preconditions

- `analyzeSentiment` is imported

### Steps

1. Call `analyzeSentiment('Great passing yards and passer rating today', '', 'QB')`
   **Expected:** `keywords` includes `{ word: 'passing yards', type: 'positive', level: 'medium' }` and `{ word: 'passer rating', type: 'positive', level: 'medium' }`, `scores.positive >= 3`

2. Call `analyzeSentiment('Threw two interceptions and a pick six', '', 'QB')`
   **Expected:** `keywords` includes position-negative entries for "interceptions" and "pick six", `scores.negative >= 3`

### Test Data

- QB positive: "passing yards", "completions", "passer rating", "qbr", "clean pocket"
- QB negative: "interceptions", "sacks taken", "fumbles", "pick six"

### Edge Cases

- Position keywords should NOT match when `position` is empty or a different position

---

## TC-010: sentimentEngine — position-specific RB/WR/TE keywords

**Priority:** P1
**Type:** Functional

### Objective

Verify that position-specific keywords for RB, WR, and TE are correctly matched and scored at 1.5 weight.

### Preconditions

- `analyzeSentiment` is imported

### Steps

1. Call `analyzeSentiment('Workhorse with big rushing yards', '', 'RB')`
   **Expected:** RB-positive keywords "workhorse" and "rushing yards" matched

2. Call `analyzeSentiment('Great targets and contested catch performance', '', 'WR')`
   **Expected:** WR-positive keywords "targets" and "contested catch" matched

3. Call `analyzeSentiment('Used for blocking only, limited route tree', '', 'TE')`
   **Expected:** TE-negative keywords "blocking only" and "limited route tree" matched

### Test Data

- All position-specific keyword lists per position

### Edge Cases

- Unknown position string (e.g., "K") — should skip position keywords without error

---

## TC-011: sentimentEngine — fantasy keywords

**Priority:** P1
**Type:** Functional

### Objective

Verify that fantasy-specific keywords (both positive and negative) are detected with weight 1 and level "low".

### Preconditions

- `analyzeSentiment` is imported

### Steps

1. Call `analyzeSentiment('Increased target share and snap count increase as the starter')`
   **Expected:** `keywords` includes entries for "target share", "snap count increase", "starter" with `type: 'positive'`, `level: 'low'`

2. Call `analyzeSentiment('In a committee, timeshare with reduced role')`
   **Expected:** `keywords` includes entries for "committee", "timeshare", "reduced role" with `type: 'negative'`, `level: 'low'`

### Test Data

- All fantasy positive and negative keywords

### Edge Cases

- None beyond standard matching

---

## TC-012: sentimentEngine — magnitude and confidence calculation

**Priority:** P0
**Type:** Functional

### Objective

Verify that `magnitude` is capped at 1 (`min(score/9, 1)`), `confidence` is capped at 1 (`min(totalScore/10, 1)`), and the `scores` breakdown is accurate.

### Preconditions

- `analyzeSentiment` is imported

### Steps

1. Call `analyzeSentiment` with text containing many high-positive keywords (e.g., 5+ high keywords)
   **Expected:** `magnitude` is 1.0 (capped), `confidence` approaches or equals 1.0

2. Call `analyzeSentiment` with text containing a single low-positive keyword
   **Expected:** `magnitude` is approximately `1/9 ≈ 0.11`, `confidence` is approximately `1/10 = 0.1`

### Test Data

- Constructed strings with known keyword counts

### Edge Cases

- Equal positive and negative scores: `sentiment` should be `'neutral'`, `magnitude` should be `0.5`
- Zero total score (no keywords found): all values should be 0 except `sentiment` is `'neutral'`

---

## TC-013: sentimentEngine — getMagnitudeLevel thresholds

**Priority:** P1
**Type:** Functional

### Objective

Verify that `getMagnitudeLevel` returns correct bucket for boundary values.

### Preconditions

- `getMagnitudeLevel` is imported

### Steps

1. Call `getMagnitudeLevel(0.66)`
   **Expected:** `'high'`

2. Call `getMagnitudeLevel(0.65)`
   **Expected:** `'medium'`

3. Call `getMagnitudeLevel(0.33)`
   **Expected:** `'medium'`

4. Call `getMagnitudeLevel(0.32)`
   **Expected:** `'low'`

5. Call `getMagnitudeLevel(0)`
   **Expected:** `'low'`

6. Call `getMagnitudeLevel(1)`
   **Expected:** `'high'`

### Test Data

- Boundary values: 0, 0.32, 0.33, 0.65, 0.66, 1.0

### Edge Cases

- Negative magnitude (e.g., -0.1) — should return `'low'`
- Magnitude > 1 — should return `'high'`

---

## TC-014: sentimentEngine — getSentimentDescription

**Priority:** P2
**Type:** Functional

### Objective

Verify that `getSentimentDescription` maps all 9 sentiment+magnitude combinations to the correct emoji description string.

### Preconditions

- `getSentimentDescription` is imported

### Steps

1. Call `getSentimentDescription({ sentiment: 'positive', magnitude: 0.8 })`
   **Expected:** `'Very Bullish 🚀'`

2. Call `getSentimentDescription({ sentiment: 'negative', magnitude: 0.5 })`
   **Expected:** `'Bearish 🔻'`

3. Call `getSentimentDescription({ sentiment: 'neutral', magnitude: 0.1 })`
   **Expected:** `'Neutral ➡️'`

### Test Data

- All 9 combinations: positive/negative/neutral x high/medium/low

### Edge Cases

- Unknown sentiment string (e.g., `'mixed'`) — should return `'Neutral ➡️'` (fallback)

---

## TC-015: espnService — cache hit returns cached data without fetch

**Priority:** P0
**Type:** Functional

### Objective

Verify that `fetchWithFallback` returns cached data when the cache entry is fresh (within 5-minute TTL) and does not issue a network request.

### Preconditions

- Global `fetch` is mocked
- Internal cache is pre-populated with a known endpoint and fresh timestamp

### Steps

1. Pre-populate the cache by calling `fetchNFLNews()` once with a mocked fetch response
   **Expected:** `fetch` called once, response stored in cache

2. Call `fetchNFLNews()` again immediately
   **Expected:** `fetch` is NOT called a second time; same data is returned from cache

### Test Data

- Mock response: `{ articles: [{ headline: 'Test' }] }`

### Edge Cases

- None

---

## TC-016: espnService — cache miss after TTL expiration

**Priority:** P0
**Type:** Functional

### Objective

Verify that expired cache entries (older than 5 minutes) are evicted and a fresh fetch is made.

### Preconditions

- Global `fetch` is mocked
- Time manipulation available (e.g., `jest.useFakeTimers` or mock `Date.now`)

### Steps

1. Populate cache with a fetch call
   **Expected:** Data cached

2. Advance time by more than 5 minutes (300,001 ms)
   **Expected:** —

3. Call the same endpoint again
   **Expected:** `fetch` is called again; fresh data returned

### Test Data

- Mock different responses for first and second fetch to distinguish them

### Edge Cases

- Exactly at TTL boundary (300,000 ms) — should still be valid (uses `<` comparison)

---

## TC-017: espnService — proxy fallback to direct ESPN API

**Priority:** P0
**Type:** Functional

### Objective

Verify that when the proxy endpoint (`/espn-api/...`) returns a non-OK status, the service falls back to the direct ESPN API (`https://site.api.espn.com/...`).

### Preconditions

- Global `fetch` is mocked to return non-OK for proxy, OK for direct

### Steps

1. Mock `fetch` to return `{ ok: false, status: 503 }` for the proxy URL and `{ ok: true, json: () => mockData }` for the direct URL
   **Expected:** —

2. Call `fetchNFLNews()`
   **Expected:** `fetch` called twice (proxy then direct), returns direct API data successfully

### Test Data

- Proxy URL pattern: `/espn-api/apis/site/v2/sports/football/nfl/news?limit=20`
- Direct URL pattern: `https://site.api.espn.com/apis/site/v2/sports/football/nfl/news?limit=20`

### Edge Cases

- Both proxy and direct fail — should throw error

---

## TC-018: espnService — both proxy and direct fail throws error

**Priority:** P0
**Type:** Functional

### Objective

Verify that when both the proxy and direct ESPN API return errors, the function throws and the caller handles it gracefully.

### Preconditions

- Global `fetch` is mocked to fail for both URLs

### Steps

1. Mock `fetch` to return `{ ok: false, status: 500 }` for both URLs
   **Expected:** —

2. Call `fetchNFLNews()`
   **Expected:** Returns `[]` (the catch block in `fetchNFLNews` returns empty array)

3. Call `fetchScoreboard()`
   **Expected:** Returns `{ events: [], week: null, season: null }`

### Test Data

- None beyond mocks

### Edge Cases

- `fetch` throws a network error (e.g., `TypeError: Failed to fetch`) — same graceful fallback

---

## TC-019: espnService — fetchNFLNews normalizes articles

**Priority:** P1
**Type:** Functional

### Objective

Verify that `fetchNFLNews` transforms raw ESPN article objects into the normalized `Article` format with correct field mapping.

### Preconditions

- Global `fetch` is mocked to return raw ESPN article data

### Steps

1. Mock fetch with a response containing a full raw article object with all optional fields
   **Expected:** Returned article has `headline`, `description`, `published`, `url` (from `links.web.href`), `images`, `thumbnail` (first image URL), `source: 'ESPN NFL'`, `type`, `premium`, `categories`

2. Mock fetch with a minimal raw article (most fields missing)
   **Expected:** Defaults applied: empty strings for text fields, `'#'` for URL, `null` for thumbnail, `false` for premium, etc.

### Test Data

- Full article: `{ id: '123', headline: 'Test', description: 'Desc', published: '2025-01-01', links: { web: { href: 'http://...' } }, images: [{ url: 'img.jpg' }], type: 'story', premium: true }`
- Minimal article: `{}`

### Edge Cases

- `data.articles` is undefined — should return `[]`
- `data.articles` is empty array — should return `[]`

---

## TC-020: espnService — fetchTeamNews with valid team abbreviation

**Priority:** P1
**Type:** Functional

### Objective

Verify that `fetchTeamNews` correctly maps team abbreviation to ESPN team ID and fetches team-specific news.

### Preconditions

- Global `fetch` is mocked

### Steps

1. Call `fetchTeamNews('KC', 5)`
   **Expected:** Fetch called with URL containing `/teams/12/news?limit=5` (KC maps to team ID 12)

2. Call `fetchTeamNews('sf')` (lowercase)
   **Expected:** Fetch called with URL containing `/teams/25/` (SF maps to 25, input uppercased)

### Test Data

- Team mappings: KC=12, SF=25, DAL=6

### Edge Cases

- None

---

## TC-021: espnService — fetchTeamNews with unknown team abbreviation

**Priority:** P1
**Type:** Functional

### Objective

Verify that `fetchTeamNews` returns an empty array when given an unrecognized team abbreviation.

### Preconditions

- Global `fetch` is mocked

### Steps

1. Call `fetchTeamNews('XYZ')`
   **Expected:** Returns `[]`, `fetch` is NOT called

### Test Data

- Invalid abbreviations: "XYZ", "", "NFLTEAM"

### Edge Cases

- Empty string as team abbreviation

---

## TC-022: espnService — fetchScoreboard normalizes game events

**Priority:** P1
**Type:** Functional

### Objective

Verify that `fetchScoreboard` transforms raw ESPN event objects into normalized `GameEvent` format, correctly extracting home/away teams, status, venue, and broadcast.

### Preconditions

- Global `fetch` is mocked with scoreboard data

### Steps

1. Mock fetch with a full event object containing two competitors (home and away), status, venue, broadcasts
   **Expected:** Returned event has `homeTeam` and `awayTeam` objects with `id`, `abbr`, `name`, `score`, `logo`; `status` with `type`, `description`, `period`, `clock`; `venue` string; `broadcast` string

2. Mock fetch with minimal event (no competitions)
   **Expected:** `homeTeam: null`, `awayTeam: null`, venue and broadcast are empty strings

### Test Data

- Full event with nested competition data
- Event with empty `competitions` array

### Edge Cases

- Missing `competitors` array — both teams should be null
- Competitor without `team` sub-object — fields default to empty strings

---

## TC-023: espnService — fetchPlayerNews deduplicates and filters

**Priority:** P1
**Type:** Functional

### Objective

Verify that `fetchPlayerNews` merges team news and general news, deduplicates by article ID, and filters to only articles mentioning the player.

### Preconditions

- Global `fetch` is mocked; `fetchTeamNews` and `fetchNFLNews` return known article sets

### Steps

1. Mock data so team news and general news share one article ID, and only some articles mention the player name
   **Expected:** No duplicate articles in result; only articles where headline or description contains the player name (case-insensitive)

2. Call `fetchPlayerNews('Patrick Mahomes', ['mahomes'], 'KC')`
   **Expected:** Articles filtered to those containing "patrick mahomes" or "mahomes"

### Test Data

- Team articles: `[{ id: '1', headline: 'Mahomes throws 3 TDs' }, { id: '2', headline: 'KC defense update' }]`
- General articles: `[{ id: '1', headline: 'Mahomes throws 3 TDs' }, { id: '3', headline: 'League news' }]`
- Expected result: only article with id '1'

### Edge Cases

- `teamAbbr` is empty — should skip team news fetch, only use general news
- No articles match the player name — should return `[]`
- `searchTerms` provided — articles matching any search term should be included

---

## TC-024: espnService — clearCache empties all entries

**Priority:** P2
**Type:** Functional

### Objective

Verify that `clearCache()` removes all cached entries and subsequent requests trigger fresh fetches.

### Preconditions

- Cache populated from previous fetches

### Steps

1. Populate cache by calling `fetchNFLNews()`
   **Expected:** `getCacheStats().size > 0`

2. Call `clearCache()`
   **Expected:** `getCacheStats().size === 0`, `getCacheStats().keys` is empty

### Test Data

- None beyond mocks

### Edge Cases

- Calling `clearCache()` on already empty cache — should not throw

---

## TC-025: espnService — getCacheStats reports correct metadata

**Priority:** P2
**Type:** Functional

### Objective

Verify that `getCacheStats()` returns accurate size, keys, and per-entry age/expired status.

### Preconditions

- Cache populated with known entries, time control available

### Steps

1. Populate cache with two different endpoint calls
   **Expected:** `getCacheStats().size === 2`, `keys` contains both endpoint strings

2. Advance time past TTL for one entry
   **Expected:** That entry's `expired` field is `true`, the other is `false`

### Test Data

- Two distinct endpoints

### Edge Cases

- None

---

## TC-026: priceCalculator — impact ranges for positive/high sentiment

**Priority:** P0
**Type:** Functional

### Objective

Verify that `calculatePriceImpact` with positive sentiment and high magnitude produces an impact within the defined range (3%–5% before confidence weighting).

### Preconditions

- `calculatePriceImpact` is imported
- `Math.random` is mocked or results are checked against the range bounds

### Steps

1. Call `calculatePriceImpact({ sentiment: 'positive', magnitude: 0.8, confidence: 1.0 })` many times (or mock `Math.random`)
   **Expected:** `impactPercent` is between 3.0 and 5.0, `details.level` is `'high'`, `details.sentiment` is `'positive'`

### Test Data

- Sentiment: positive, magnitude: 0.8 (maps to "high" via `getMagnitudeLevel`)

### Edge Cases

- Magnitude exactly at 0.66 boundary — should use "high" range

---

## TC-027: priceCalculator — impact ranges for all sentiment/magnitude combos

**Priority:** P0
**Type:** Functional

### Objective

Verify that each of the 9 sentiment+magnitude combinations maps to the correct price impact range.

### Preconditions

- `calculatePriceImpact` is imported, `Math.random` mocked to 0 and 1 alternately to test range boundaries

### Steps

1. For each combination (positive/negative/neutral x high/medium/low), call `calculatePriceImpact` with `confidence: 1.0` and `Math.random` returning 0
   **Expected:** Impact equals `min` of the range for that combo

2. Repeat with `Math.random` returning ~1
   **Expected:** Impact equals `max` of the range for that combo

### Test Data

- All 9 combinations with known ranges from `PRICE_IMPACT_RANGES`
- positive/high: [3%, 5%], positive/medium: [1.5%, 3%], positive/low: [0.5%, 1.5%]
- negative/high: [-5%, -3%], negative/medium: [-3%, -1.5%], negative/low: [-1.5%, -0.5%]
- neutral/high: [-0.5%, 0.5%], neutral/medium: [-0.5%, 0.5%], neutral/low: [-0.3%, 0.3%]

### Edge Cases

- None beyond boundary checks

---

## TC-028: priceCalculator — confidence weighting

**Priority:** P0
**Type:** Functional

### Objective

Verify that the confidence multiplier formula `0.7 + 0.3 * confidence` correctly scales the base impact.

### Preconditions

- `calculatePriceImpact` is imported, `Math.random` is mocked for deterministic output

### Steps

1. Call with `confidence: 0.0`, mock `Math.random` to return a known value
   **Expected:** `confidenceMultiplier` is `0.7`, final impact is `baseImpact * 0.7`

2. Call with `confidence: 1.0`
   **Expected:** `confidenceMultiplier` is `1.0`, final impact equals `baseImpact`

3. Call with `confidence: 0.5`
   **Expected:** `confidenceMultiplier` is `0.85`, final impact is `baseImpact * 0.85`

4. Call with confidence omitted (defaults to 0.5)
   **Expected:** Same as step 3

### Test Data

- Fixed `Math.random` value and various confidence levels

### Edge Cases

- Confidence > 1.0 — multiplier exceeds 1.0
- Confidence < 0 — multiplier below 0.7

---

## TC-029: priceCalculator — applyPriceImpact

**Priority:** P1
**Type:** Functional

### Objective

Verify that `applyPriceImpact` multiplies the current price by the impact multiplier and rounds to 2 decimal places.

### Preconditions

- `applyPriceImpact` is imported

### Steps

1. Call `applyPriceImpact(100, { impactMultiplier: 1.05 })`
   **Expected:** Returns `105.00`

2. Call `applyPriceImpact(33.33, { impactMultiplier: 0.97 })`
   **Expected:** Returns `32.33` (rounded to 2 decimals)

### Test Data

- Various prices and multipliers

### Edge Cases

- Price of 0 — should return 0
- Multiplier of exactly 1.0 — price unchanged
- Very small price (e.g., 0.01) — verify rounding

---

## TC-030: priceCalculator — calculateNewPrice end-to-end

**Priority:** P0
**Type:** Functional

### Objective

Verify that `calculateNewPrice` composes `calculatePriceImpact` and `applyPriceImpact` and returns a complete `PriceResult`.

### Preconditions

- `calculateNewPrice` is imported, `Math.random` is mocked

### Steps

1. Call `calculateNewPrice(100, { sentiment: 'positive', magnitude: 0.8, confidence: 1.0 })`
   **Expected:** `previousPrice` is 100, `newPrice` is `100 * impactMultiplier`, `change` is `newPrice - 100`, `changePercent` matches `impact.impactPercent`

### Test Data

- Deterministic random for reproducibility

### Edge Cases

- Neutral sentiment — `newPrice` should be very close to `currentPrice`

---

## TC-031: priceCalculator — calculateCumulativeImpact with multiple sentiments

**Priority:** P0
**Type:** Functional

### Objective

Verify that `calculateCumulativeImpact` applies decaying impacts from multiple sentiment results, sorted by confidence descending.

### Preconditions

- `calculateCumulativeImpact` is imported, `Math.random` mocked

### Steps

1. Call with `currentPrice: 100` and 3 sentiment results with varying confidence
   **Expected:** Results sorted by confidence (highest first); first impact has `decay: 1.0`, second `decay: 0.7`, third `decay: 0.49`; `impacts` array has 3 entries with correct `runningPrice` progression

### Test Data

- Three sentiments: `{ sentiment: 'positive', magnitude: 0.8, confidence: 0.9 }`, `{ sentiment: 'positive', magnitude: 0.5, confidence: 0.7 }`, `{ sentiment: 'negative', magnitude: 0.3, confidence: 0.5 }`

### Edge Cases

- Empty sentiment array — should return `newPrice === currentPrice`, empty impacts array

---

## TC-032: priceCalculator — cumulative impact respects maxTotalImpact cap

**Priority:** P0
**Type:** Functional

### Objective

Verify that cumulative impact stops accumulating once `maxTotalImpact` threshold (default 10%) would be exceeded.

### Preconditions

- `calculateCumulativeImpact` is imported, `Math.random` mocked for large impacts

### Steps

1. Call with many high-impact positive sentiments and `maxTotalImpact: 0.05`
   **Expected:** `totalImpactPercent` does not exceed 5%; some impacts are skipped

2. Call with `maxTotalImpact: 0.1` (default)
   **Expected:** Total impact stays within 10%

### Test Data

- 5+ high-positive sentiments designed to exceed cap

### Edge Cases

- Single impact that already exceeds the cap — it should still be applied (cap is checked before adding the next one)

---

## TC-033: priceCalculator — cumulative impact custom decayFactor

**Priority:** P1
**Type:** Functional

### Objective

Verify that a custom `decayFactor` correctly adjusts the decay curve.

### Preconditions

- `calculateCumulativeImpact` is imported

### Steps

1. Call with `decayFactor: 0.5` and 3 sentiments
   **Expected:** Decays are `1.0`, `0.5`, `0.25` respectively

2. Call with `decayFactor: 1.0`
   **Expected:** No decay applied — all impacts at full weight

### Test Data

- Known sentiments and deterministic random

### Edge Cases

- `decayFactor: 0` — only first impact applies, rest have `decay: 0`

---

## TC-034: priceCalculator — createPriceHistoryEntry

**Priority:** P1
**Type:** Functional

### Objective

Verify that `createPriceHistoryEntry` assembles a correct history entry from article and sentiment inputs.

### Preconditions

- `createPriceHistoryEntry` is imported

### Steps

1. Call with a full article `{ headline: 'Big Win', published: '2025-01-01T00:00:00Z', source: 'ESPN NFL', url: 'http://example.com' }`, sentiment `{ sentiment: 'positive', magnitude: 0.7 }`, and price `105.50`
   **Expected:** Entry has `timestamp: '2025-01-01T00:00:00Z'`, `price: 105.50`, `reason.type: 'news'`, `reason.headline: 'Big Win'`, `content` array has one article entry

2. Call with article `url: '#'`
   **Expected:** `content` array is empty (URL filtered out)

3. Call with article `url: undefined`
   **Expected:** `content` array is empty

### Test Data

- Full and minimal article objects

### Edge Cases

- Missing `published` — should default to `new Date().toISOString()`
- Missing `source` — should default to `'ESPN NFL'`

---

## TC-035: priceResolver — getCurrentPriceFromHistory with price history

**Priority:** P0
**Type:** Functional

### Objective

Verify that `getCurrentPriceFromHistory` returns the last entry's price from a player's `priceHistory`.

### Preconditions

- `getCurrentPriceFromHistory` is imported

### Steps

1. Call with a player object having `priceHistory: [{ price: 50 }, { price: 55 }, { price: 60 }]`
   **Expected:** Returns `60`

2. Call with a player having `priceHistory: [{ price: 42 }]`
   **Expected:** Returns `42`

### Test Data

- Player objects with varying history lengths

### Edge Cases

- None

---

## TC-036: priceResolver — getCurrentPriceFromHistory falls back to basePrice

**Priority:** P0
**Type:** Functional

### Objective

Verify that when a player has no `priceHistory` (or empty array), the function returns `basePrice`.

### Preconditions

- `getCurrentPriceFromHistory` is imported

### Steps

1. Call with a player having `priceHistory: []` and `basePrice: 25`
   **Expected:** Returns `25`

2. Call with a player having `priceHistory: undefined` and `basePrice: 30`
   **Expected:** Returns `30`

### Test Data

- Player with missing/empty history

### Edge Cases

- None

---

## TC-037: priceResolver — getCurrentPriceFromHistory with null/undefined player

**Priority:** P0
**Type:** Functional

### Objective

Verify that the function safely returns `0` when passed `null` or `undefined`.

### Preconditions

- `getCurrentPriceFromHistory` is imported

### Steps

1. Call `getCurrentPriceFromHistory(null)`
   **Expected:** Returns `0`

2. Call `getCurrentPriceFromHistory(undefined)`
   **Expected:** Returns `0`

### Test Data

- None

### Edge Cases

- None

---

## TC-038: priceResolver — getEffectivePrice with override priority

**Priority:** P0
**Type:** Functional

### Objective

Verify that `getEffectivePrice` uses `priceOverrides` value when one exists for the player, ignoring history-based price.

### Preconditions

- `getEffectivePrice` is imported

### Steps

1. Call with `playerId: 'p1'`, `priceOverrides: { p1: 80 }`, `userImpact: {}`, and a players array where p1 has `priceHistory` ending at price 60
   **Expected:** Returns `80.00` (override used, not history price)

### Test Data

- Player with both override and history

### Edge Cases

- Override value of 0 — should use 0, not fall through to history (explicitly checks `!== undefined`)

---

## TC-039: priceResolver — getEffectivePrice with user impact multiplier

**Priority:** P0
**Type:** Functional

### Objective

Verify that user impact is applied as a multiplier: `basePrice * (1 + impact)`.

### Preconditions

- `getEffectivePrice` is imported

### Steps

1. Call with `playerId: 'p1'`, `priceOverrides: {}`, `userImpact: { p1: 0.1 }`, player history price is 100
   **Expected:** Returns `110.00` (100 * 1.1)

2. Call with negative impact: `userImpact: { p1: -0.05 }`, price is 100
   **Expected:** Returns `95.00` (100 * 0.95)

3. Call with both override and impact: `priceOverrides: { p1: 80 }`, `userImpact: { p1: 0.1 }`
   **Expected:** Returns `88.00` (80 * 1.1 — override is the base, impact applied on top)

### Test Data

- Various combinations of overrides and impacts

### Edge Cases

- No user impact for the player — `impact` defaults to 0, price unchanged
- Impact of 0 — price unchanged

---

## TC-040: priceResolver — getEffectivePrice with null/undefined playerId

**Priority:** P1
**Type:** Functional

### Objective

Verify that `getEffectivePrice` returns `0` when `playerId` is null or undefined.

### Preconditions

- `getEffectivePrice` is imported

### Steps

1. Call `getEffectivePrice(null, {}, {}, [])`
   **Expected:** Returns `0`

2. Call `getEffectivePrice(undefined, {}, {}, [])`
   **Expected:** Returns `0`

### Test Data

- None

### Edge Cases

- Player ID that doesn't match any player in the array and has no override — returns `0` (history returns basePrice of undefined player = 0)

---

## TC-041: priceResolver — getChangePercentFromHistory and getMoveReasonFromHistory

**Priority:** P1
**Type:** Functional

### Objective

Verify that `getChangePercentFromHistory` computes the correct percentage change from `basePrice`, and `getMoveReasonFromHistory` returns the last entry's headline.

### Preconditions

- Both functions are imported

### Steps

1. Call `getChangePercentFromHistory` with player having `basePrice: 50` and history ending at price `60`
   **Expected:** Returns `20` (i.e., 20%)

2. Call `getMoveReasonFromHistory` with player having history `[{ reason: { headline: 'Big trade' } }]`
   **Expected:** Returns `'Big trade'`

3. Call both with `null`
   **Expected:** `getChangePercentFromHistory` returns `0`, `getMoveReasonFromHistory` returns `''`

### Test Data

- Players with known base prices and history

### Edge Cases

- `basePrice` is 0 — `getChangePercentFromHistory` should return `0` (division by zero guard)
- Empty `priceHistory` — `getMoveReasonFromHistory` returns `''`
- History entry with no `reason.headline` — returns `''`

---

## TC-042: storageService — write and read round-trip

**Priority:** P0
**Type:** Functional

### Objective

Verify that `write` stores data with a version wrapper and `read` retrieves it correctly.

### Preconditions

- `localStorage` is mocked (e.g., via jsdom or manual mock)
- `STORAGE_VERSION` is 1

### Steps

1. Call `write('testKey', { name: 'test', value: 42 })`
   **Expected:** `localStorage.setItem` called with key `'testKey'` and JSON `{ version: 1, data: { name: 'test', value: 42 } }`

2. Call `read('testKey', null)`
   **Expected:** Returns `{ name: 'test', value: 42 }`

### Test Data

- Various data types: object, array, string, number, boolean

### Edge Cases

- Write and read a deeply nested object
- Write and read an empty array `[]`
- Write and read `0`, `false`, empty string `''` — these are falsy but valid

---

## TC-043: storageService — read returns default for missing/empty/corrupt data

**Priority:** P0
**Type:** Functional

### Objective

Verify that `read` returns the `defaultValue` when the key is missing, the raw value is empty, or the JSON is corrupt.

### Preconditions

- `localStorage` is mocked

### Steps

1. Call `read('nonexistent', 'default')` when key doesn't exist in storage
   **Expected:** Returns `'default'`

2. Set `localStorage.getItem` to return `''` for a key
   **Expected:** `read` returns `defaultValue`

3. Set `localStorage.getItem` to return invalid JSON (e.g., `'{broken'`)
   **Expected:** `read` returns `defaultValue` (catch block)

### Test Data

- Default values of various types

### Edge Cases

- `localStorage.getItem` returns `'null'` — parsed as `null`, should return default
- `localStorage.getItem` returns `'undefined'` — invalid JSON, should return default

---

## TC-044: storageService — version migration / rejection

**Priority:** P0
**Type:** Functional

### Objective

Verify that `read` handles version mismatches: rejects entries with `version <= 0` or `version > CURRENT_VERSION`, and accepts valid versions.

### Preconditions

- `localStorage` is mocked, `CURRENT_VERSION` is 1

### Steps

1. Store `{ version: 1, data: 'valid' }` in localStorage, call `read`
   **Expected:** Returns `'valid'`

2. Store `{ version: 0, data: 'old' }`, call `read`
   **Expected:** Returns `defaultValue` (version <= 0 rejected)

3. Store `{ version: -1, data: 'negative' }`, call `read`
   **Expected:** Returns `defaultValue`

4. Store `{ version: 2, data: 'future' }`, call `read` (assuming CURRENT_VERSION is 1)
   **Expected:** Returns `defaultValue` (version > CURRENT_VERSION rejected)

5. Store `{ version: 1, data: null }`, call `read`
   **Expected:** Returns `defaultValue` (data is null)

6. Store `{ version: 1, data: undefined }`, call `read`
   **Expected:** Returns `defaultValue` (data is undefined)

### Test Data

- Various version numbers and data values

### Edge Cases

- Legacy entry without version wrapper (e.g., plain `'"hello"'` in storage) — should be returned as-is

---

## TC-045: storageService — localStorage unavailable or quota exceeded

**Priority:** P0
**Type:** Functional

### Objective

Verify that `read` and `write` fail gracefully when `localStorage` is unavailable or throws.

### Preconditions

- `localStorage` is mocked to throw or be undefined

### Steps

1. Mock `typeof localStorage` to throw (simulating SSR or restricted environment), call `read('key', 'default')`
   **Expected:** Returns `'default'`

2. Same environment, call `write('key', 'value')`
   **Expected:** Does not throw; silently no-ops

3. Mock `localStorage.setItem` to throw `QuotaExceededError`, call `write('key', 'value')`
   **Expected:** Does not throw; silently fails

4. Call `remove('key')` when localStorage is unavailable
   **Expected:** Does not throw; silently no-ops

### Test Data

- None beyond mocks

### Edge Cases

- `localStorage.removeItem` throws — `remove` should still not throw
