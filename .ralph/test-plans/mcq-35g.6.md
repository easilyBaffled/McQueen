# Test Plan: mcq-35g.6 -- Fix Leaderboard to use real league data

## Summary

- **Bead:** `mcq-35g.6`
- **Feature:** Leaderboard page uses `getLeaderboardRankings()` from SocialContext instead of hardcoded fake trader data
- **Total Test Cases:** 10
- **Test Types:** Functional, Integration, Regression

---

## TC-001: Leaderboard calls getLeaderboardRankings() from SocialContext

**Priority:** P0
**Type:** Integration

### Objective

Verify that the Leaderboard component retrieves its ranking data from `getLeaderboardRankings()` via `useSocial()`, not from any inline/hardcoded array. This is the core requirement of the bead.

### Preconditions

- App is running with SocialProvider wrapping the Leaderboard route
- League member data (`leagueMembers.json`) is loadable

### Steps

1. Navigate to `/leaderboard`
   **Expected:** The page renders without errors

2. Inspect the rendered trader rows in the leaderboard table
   **Expected:** Trader names match the members defined in `leagueMembers.json` (e.g., GridironGuru, TDKing2024, FantasyMVP, StockJock, etc.), not any placeholder names like "Alice", "Bob", or "TraderX"

3. Count the total rows in the leaderboard table
   **Expected:** Row count equals the number of league members (11 members including the user, per `leagueMembers.json`)

### Test Data

- League members from `src/data/leagueMembers.json`: 10 AI members + 1 user entry

### Edge Cases

- If `leagueMembers.json` is empty or fails to load, the leaderboard should still render (possibly with only the user row)

---

## TC-002: Rankings reflect actual portfolio values from league holdings

**Priority:** P0
**Type:** Functional

### Objective

Verify that each trader's portfolio value shown on the leaderboard is computed from their holdings (shares × current price) plus their base cash (`AI_BASE_CASH = 2000`), not from static numbers.

### Preconditions

- App is running with scenario data loaded (player prices available)
- League holdings data is loaded from `leagueMembers.json`

### Steps

1. Navigate to `/leaderboard`
   **Expected:** Each trader row displays a dollar value in the "Portfolio Value" column

2. For a known AI trader (e.g., GridironGuru who holds mahomes, mccaffrey, chase, barkley, rice, diggs-s, stroud, st-brown), verify the displayed total value
   **Expected:** The total equals `AI_BASE_CASH (2000)` + sum of (current price × shares) for each holding. The value should change as player prices fluctuate.

3. Compare two traders with different holdings
   **Expected:** The trader with higher total portfolio value appears higher in the ranking

### Test Data

- GridironGuru holdings: mahomes (15 shares), mccaffrey (18), chase (10), barkley (8), rice (12), diggs-s (6), stroud (10), st-brown (14)
- AI_BASE_CASH = 2000

### Edge Cases

- A trader with zero holdings should show a total value equal to `AI_BASE_CASH` ($2,000)

---

## TC-003: User's row correctly positioned in rankings

**Priority:** P0
**Type:** Functional

### Objective

Verify that the current user appears in the leaderboard at the correct rank based on their actual cash + portfolio value relative to all other league members.

### Preconditions

- User is logged in with a known portfolio state

### Steps

1. Start with default state (no trades made, $10,000 starting cash)
   **Expected:** User total value is $10,000

2. Navigate to `/leaderboard`
   **Expected:** The user's row is highlighted (has `user-row` styling) and displays "You" as the trader name

3. Check the user's rank position
   **Expected:** The user's rank reflects their $10,000 total value sorted correctly among all AI trader totals. Since AI traders start with $2,000 base cash + holdings, the user's rank depends on current prices.

4. Execute a profitable trade (buy a player whose price increases), then return to `/leaderboard`
   **Expected:** The user's total value increases and their rank may improve accordingly

### Test Data

- INITIAL_CASH = 10,000
- User portfolio starts empty

### Edge Cases

- User with $0 cash and no holdings (if possible) should appear at the bottom of the leaderboard
- User tied in value with an AI trader: both should have valid ranks (sort is stable)

---

## TC-004: User rank card displays correct data from rankings

**Priority:** P1
**Type:** Functional

### Objective

Verify that the prominent "Your Current Rank" card at the top of the Leaderboard page shows the user's rank, total value, and gain percentage derived from the real rankings data.

### Preconditions

- User has a known portfolio state

### Steps

1. Navigate to `/leaderboard` with no trades made
   **Expected:** The rank card shows rank `#N` where N is the user's position among all 11 members, a total value of `$10,000.00`, and a gain of `0.0%`

2. Make some trades that result in a net gain, then return to `/leaderboard`
   **Expected:** The rank card updates to reflect the new total value and positive gain percentage (shown with `▲ +` prefix and green styling)

3. Make trades that result in a net loss, then return to `/leaderboard`
   **Expected:** The rank card shows negative gain percentage (shown with `▼` prefix and red/negative styling)

### Test Data

- Default starting state: $10,000 cash, 0 holdings

### Edge Cases

- If the user is not found in rankings (defensive): card should default to rank `#12` (rankings.length + 1), value `$0.00`, gain `0.0%`

---

## TC-005: Medal icons preserved for top 3 traders

**Priority:** P1
**Type:** Regression

### Objective

Verify that the top 3 ranked traders in the leaderboard display medal emoji icons (🥇, 🥈, 🥉) and that traders ranked 4th and below display numeric ranks.

### Preconditions

- Leaderboard renders with at least 3 traders

### Steps

1. Navigate to `/leaderboard`
   **Expected:** The leaderboard table renders with multiple rows

2. Check the first row
   **Expected:** Displays the 🥇 gold medal icon, has the `top-three` CSS class

3. Check the second row
   **Expected:** Displays the 🥈 silver medal icon, has the `top-three` CSS class

4. Check the third row
   **Expected:** Displays the 🥉 bronze medal icon, has the `top-three` CSS class

5. Check the fourth row
   **Expected:** Displays the numeric rank `4` (no medal icon), does NOT have the `top-three` CSS class

### Test Data

- N/A — uses default league data

### Edge Cases

- If fewer than 3 traders exist (e.g., data load failure), only available medals should appear without errors

---

## TC-006: Rankings are sorted by total portfolio value descending

**Priority:** P0
**Type:** Functional

### Objective

Verify that `getLeaderboardRankings()` returns traders sorted from highest to lowest total value, and that this ordering is reflected in the rendered leaderboard table.

### Preconditions

- League data is loaded with holdings and current prices

### Steps

1. Navigate to `/leaderboard`
   **Expected:** The leaderboard table renders all traders

2. Read the portfolio values column top-to-bottom
   **Expected:** Each value is greater than or equal to the value in the row below it (strictly descending order, ties allowed)

3. Verify the `rank` field matches the display order
   **Expected:** Rank 1 is the top row, rank 2 is the second row, and so on sequentially

### Test Data

- All 11 league members (10 AI + 1 user)

### Edge Cases

- Two traders with identical total value: both should appear with sequential ranks without crashing

---

## TC-007: Leaderboard displays correct trader metadata (name, avatar)

**Priority:** P1
**Type:** Functional

### Objective

Verify that trader names and avatars shown on the leaderboard match the league member data, not hardcoded values.

### Preconditions

- League members loaded from `leagueMembers.json`

### Steps

1. Navigate to `/leaderboard`
   **Expected:** Table renders with trader rows

2. For each AI trader row, verify the name and avatar
   **Expected:** Names and avatars match `leagueMembers.json`. For example: GridironGuru (🏈), TDKing2024 (👑), FantasyMVP (🏆), StockJock (📈), RookieTrader (🌟)

3. Locate the user's row
   **Expected:** Displays "You" as the name (not "user" or the raw memberId), with the 👤 avatar

### Test Data

- Expected mappings from `leagueMembers.json`:
  - gridiron → GridironGuru 🏈
  - tdking → TDKing2024 👑
  - fantasymvp → FantasyMVP 🏆
  - stockjock → StockJock 📈
  - rookie → RookieTrader 🌟

### Edge Cases

- A league member with no `avatar` field should render an empty string (or fallback), not crash

---

## TC-008: Weekly gain percentage displayed for each trader

**Priority:** P1
**Type:** Functional

### Objective

Verify that the "Weekly Gain" column shows a gain percentage for each trader, with correct positive/negative indicators and aria-labels for accessibility.

### Preconditions

- Leaderboard data is loaded

### Steps

1. Navigate to `/leaderboard`
   **Expected:** Each row has a "Weekly Gain" column value ending in `%`

2. Check a trader row with a positive gain
   **Expected:** Shows `▲ +X.X%` with `text-up` class and aria-label of "Up X.X percent"

3. Check a trader row with a negative gain (or zero)
   **Expected:** Shows `▼ -X.X%` (or `▼ 0.0%`) with `text-down` class and aria-label of "Down X.X percent"

4. Verify the user row's gain
   **Expected:** User's gain percentage matches `getPortfolioValue().gainPercent` from TradingContext

### Test Data

- Default state: user gain is 0.0%

### Edge Cases

- Trader with `gainPercent` of `undefined` or `null`: should default to 0 via the `?? 0` fallback and display `▲ +0.0%`

---

## TC-009: "Start Trading" tip shown when user has no trades

**Priority:** P2
**Type:** Functional

### Objective

Verify that a motivational tip with a link to the market appears when the user has made zero trades, and disappears once trades exist.

### Preconditions

- User has no holdings in their portfolio

### Steps

1. Navigate to `/leaderboard` with a fresh/empty portfolio
   **Expected:** A tip banner is visible with text "Ready to climb the leaderboard?" and a "Start Trading →" link pointing to `/market`

2. Click the "Start Trading →" link
   **Expected:** User is navigated to `/market`

3. Make at least one trade, then navigate back to `/leaderboard`
   **Expected:** The tip banner is no longer visible

### Test Data

- Empty portfolio (default starting state)

### Edge Cases

- If the user sells all holdings (returns to empty portfolio), the tip should reappear

---

## TC-010: Cypress leaderboard tests pass

**Priority:** P0
**Type:** Regression

### Objective

Verify that the existing Cypress e2e tests in `cypress/e2e/leaderboard.cy.js` continue to pass with the real data integration. These tests were written for the original leaderboard and validate table structure, medals, user rank card, and gain color-coding.

### Preconditions

- App is running and accessible for Cypress
- Cypress is installed and configured

### Steps

1. Run `npx cypress run --spec cypress/e2e/leaderboard.cy.js`
   **Expected:** All 5 test cases pass:
   - TC-LB-001: Renders the leaderboard table with ≥10 rows, trader/value/gain columns
   - TC-LB-002: Medal icons 🥇🥈🥉 present in top 3 rows
   - TC-LB-003: User rank card shows `#` prefix and `$` value
   - TC-LB-004: User row exists with "You" text (note: test expects `.table-divider` which may need CSS module adjustment)
   - TC-LB-006: At least one `.col-gain.text-up` element exists

2. Review any failures
   **Expected:** No failures. If CSS module class name selectors have changed (e.g., `.leaderboard-table` vs hashed names), the Cypress tests may need selector updates — flag these as follow-up.

### Test Data

- Default app state (cleared via `cy.clearAppState()` + `cy.skipOnboarding()`)

### Edge Cases

- Cypress selectors using plain class names (`.table-row`, `.user-row`) may not match CSS module hashed classes — verify selectors align with actual DOM output
