Start the dev server and manually walk through the entire McQueen app in the
browser (via cursor-ide-browser MCP). Simulate 4 user personas and document
every UI issue, UX friction point, and visual bug encountered.

## Personas to simulate

1. **New User** — Clear localStorage to trigger onboarding. Walk through the
   onboarding flow, browse the market for the first time, open a player detail,
   make a first buy, check portfolio.

2. **Active Trader** — Buy several players, sell some, check portfolio value
   and P&L, manage watchlist (add/remove stars), revisit player details to
   verify price changes after trades.

3. **Mission Player** — Open Daily Mission, pick 3 risers and 3 fallers,
   reveal results, check leaderboard standings.

4. **Scenario Explorer** — Switch between all 3 scenarios (Midweek, Live,
   Playoffs). In Live mode, use the Timeline Debugger (play, pause, scrub).
   Observe the Playoff announcement modal. Verify LiveTicker behavior.

## What to look for

- Visual bugs (overlapping elements, clipped text, broken layouts, misaligned
  components, missing images/icons)
- Interaction bugs (buttons that don't respond, broken navigation, stale state
  after actions)
- UX friction (confusing flows, missing feedback after actions, unclear
  affordances, dead ends)
- Data display issues (wrong formats, missing units, stale prices, chart
  rendering problems)
- Accessibility gaps (missing focus indicators, poor contrast, no keyboard nav)
- Console errors or warnings during normal usage
- Performance issues (slow transitions, janky animations, long loads)

## Process

1. Run `npm run dev` to start the Vite dev server
2. Use browser_navigate to open the app (default http://localhost:5173)
3. For each persona, use browser_snapshot before and after key interactions
4. Document every issue with: description, steps to reproduce, severity
   (Critical/High/Medium/Low), and a screenshot reference if possible
5. Check the browser console for errors/warnings after each major interaction
6. Produce output artifact at `.ralph/research/ui-audit.md`

## Pages to visit

Every page must be visited at least once across the 4 personas:

- Market (home) — browse, sort, filter
- PlayerDetail — view price history, ESPN content tiles, buy/sell
- Portfolio — holdings, P&L, total value
- Watchlist — starred players, add/remove
- Mission — daily picks, reveal, scoring
- Leaderboard — rankings, league data
- Timeline — debugger controls (Live scenario only)

## Output format

The output artifact (`.ralph/research/ui-audit.md`) must contain:

1. **Executive summary** — total issues found, breakdown by severity
2. **Issues by severity** — grouped as Critical, High, Medium, Low, each with:
   - Title
   - Affected page/component
   - Description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
3. **Console errors** — any JS errors or warnings captured
4. **Recommended fix priority** — ordered list of what to fix first

## Acceptance criteria

1. All 4 personas fully walked through (onboarding, trading, mission,
   scenario switching)
2. Every page visited at least once (Market, PlayerDetail, Portfolio,
   Watchlist, Mission, Leaderboard, Timeline)
3. Output artifact exists at `.ralph/research/ui-audit.md` with:
   - Issues grouped by severity
   - Each issue has: title, description, repro steps, affected page/component
   - Summary stats (total issues by severity)
   - Recommended fix priority order
4. Console errors captured and included in findings
