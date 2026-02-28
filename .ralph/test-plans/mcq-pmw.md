# Test Plan: mcq-pmw -- Research: Exploratory UI Audit via Browser Testing

## Summary

- **Bead:** `mcq-pmw`
- **Feature:** Exploratory UI audit of the full McQueen app via browser testing across 4 user personas, documenting all UI issues, UX friction, and visual bugs into a structured research artifact
- **Total Test Cases:** 14
- **Test Types:** Functional, UI/Visual, Integration

---

## TC-001: New User persona walkthrough is fully completed

**Priority:** P0
**Type:** Functional

### Objective

Verify the New User persona was fully exercised: localStorage cleared to trigger onboarding, onboarding flow completed, market browsed for the first time, player detail opened, first buy executed, and portfolio checked. This persona validates the first-run experience end-to-end.

### Preconditions

- Dev server running at http://localhost:5173 via `npm run dev`
- Browser session open with localStorage cleared
- Browser console visible for error capture

### Steps

1. Clear localStorage and navigate to the app root.
   **Expected:** Onboarding flow is triggered and displayed to the user.

2. Walk through the complete onboarding flow (all steps/screens).
   **Expected:** Each onboarding step renders correctly, navigation between steps works, and the flow completes without errors.

3. After onboarding, browse the Market page.
   **Expected:** Market page loads with player cards, prices, and sorting/filtering controls visible.

4. Open a PlayerDetail page by clicking on a player card.
   **Expected:** PlayerDetail page renders with price history chart, ESPN content tiles, and buy/sell controls.

5. Execute a first buy transaction from the PlayerDetail page.
   **Expected:** Buy succeeds, user receives confirmation feedback (toast or visual indicator), cash balance decreases.

6. Navigate to the Portfolio page.
   **Expected:** Portfolio shows the newly purchased holding with correct share count, current value, and P&L.

### Test Data

- Fresh browser session with empty localStorage
- Any available player for the first buy transaction

### Edge Cases

- Verify that refreshing the page mid-onboarding does not skip or repeat steps
- Verify that after onboarding completes, returning to the app does not re-trigger onboarding
- Check for console errors at each step transition

---

## TC-002: Active Trader persona walkthrough is fully completed

**Priority:** P0
**Type:** Functional

### Objective

Verify the Active Trader persona was fully exercised: multiple buys, some sells, portfolio value and P&L checked, watchlist managed (add/remove stars), and player details revisited to verify price changes after trades.

### Preconditions

- Dev server running at http://localhost:5173
- Browser session with onboarding already completed (or skipped)
- Starting cash balance of $10,000

### Steps

1. Navigate to the Market page and buy shares in at least 3 different players.
   **Expected:** Each buy transaction succeeds with feedback; cash balance decreases after each purchase.

2. Navigate to the Portfolio page and verify all purchased holdings appear.
   **Expected:** Portfolio shows all 3+ holdings with share counts, current prices, and P&L for each position.

3. Sell shares in at least one of the held players.
   **Expected:** Sell transaction succeeds with feedback; share count decreases (or position removed if fully sold); cash balance increases.

4. Verify portfolio value and P&L update after the sell.
   **Expected:** Total portfolio value and individual P&L figures reflect the sell transaction accurately.

5. Add at least 2 players to the watchlist by clicking the star/favorite icon.
   **Expected:** Star icon toggles to "active" state; players appear on the Watchlist page.

6. Remove at least 1 player from the watchlist.
   **Expected:** Star icon toggles back to "inactive" state; player is removed from the Watchlist page.

7. Navigate to a PlayerDetail page for a player that was traded.
   **Expected:** Price information reflects any changes; trade history or position info is accurate.

### Test Data

- At least 3 distinct player IDs for buy transactions
- Sufficient cash to complete all buys

### Edge Cases

- Attempt to sell more shares than owned (should be prevented or show error)
- Attempt to buy with insufficient cash (should be prevented or show error)
- Verify watchlist state persists after page navigation

---

## TC-003: Mission Player persona walkthrough is fully completed

**Priority:** P0
**Type:** Functional

### Objective

Verify the Mission Player persona was fully exercised: Daily Mission opened, 3 risers and 3 fallers picked, results revealed, and leaderboard standings checked.

### Preconditions

- Dev server running at http://localhost:5173
- Browser session with access to the Mission page

### Steps

1. Navigate to the Mission page (Daily Mission).
   **Expected:** Mission page loads with instructions and player selection interface.

2. Pick exactly 3 players as "risers" (predicted to go up).
   **Expected:** Each pick is visually confirmed; the UI shows 3 risers selected.

3. Pick exactly 3 players as "fallers" (predicted to go down).
   **Expected:** Each pick is visually confirmed; the UI shows 3 fallers selected.

4. Submit/lock in the picks and reveal results.
   **Expected:** Results are revealed showing which predictions were correct/incorrect; a score is calculated.

5. Navigate to the Leaderboard page and check standings.
   **Expected:** Leaderboard displays ranked traders with scores; user's position is identifiable.

### Test Data

- 6 distinct players: 3 for risers, 3 for fallers
- Mission must be in a state that allows picking (not already completed for the day)

### Edge Cases

- Attempt to pick more than 3 risers (should be prevented)
- Attempt to pick more than 3 fallers (should be prevented)
- Attempt to pick the same player as both riser and faller (should be prevented)
- Attempt to reveal before all 6 picks are made (should be prevented or show guidance)

---

## TC-004: Scenario Explorer persona walkthrough is fully completed

**Priority:** P0
**Type:** Functional

### Objective

Verify the Scenario Explorer persona was fully exercised: switched between all 3 scenarios (Midweek, Live, Playoffs), used the Timeline Debugger in Live mode (play, pause, scrub), observed the Playoff announcement modal, and verified LiveTicker behavior.

### Preconditions

- Dev server running at http://localhost:5173
- Browser session with access to scenario switching controls

### Steps

1. Start in the default scenario (Midweek) and verify the app state.
   **Expected:** App displays Midweek scenario data; scenario toggle shows "Midweek" as active.

2. Switch to the Live scenario.
   **Expected:** Scenario transitions smoothly; player prices update to Live data; LiveTicker component becomes active and displays scrolling updates.

3. In Live mode, navigate to the Timeline page and use the Timeline Debugger.
   **Expected:** Timeline Debugger is accessible with play, pause, and scrub controls.

4. Press Play on the Timeline Debugger and observe simulation advancing.
   **Expected:** Tick counter advances; player prices change over time; timeline scrubber moves forward.

5. Press Pause on the Timeline Debugger.
   **Expected:** Simulation stops advancing; tick counter freezes; prices stop changing.

6. Scrub the timeline to a different point.
   **Expected:** Simulation jumps to the scrubbed position; prices reflect the state at that tick.

7. Switch to the Playoffs scenario.
   **Expected:** Scenario transitions to Playoffs; Playoff announcement modal appears; player data reflects playoff context.

8. Observe and dismiss the Playoff announcement modal.
   **Expected:** Modal renders with playoff information; can be dismissed by clicking close or overlay.

9. Switch back to Midweek scenario.
   **Expected:** App returns to Midweek state; Timeline Debugger is no longer active (Live-only feature).

### Test Data

- All 3 scenarios: Midweek, Live, Playoffs

### Edge Cases

- Rapidly toggle between scenarios (should not cause state corruption or console errors)
- Scrub timeline to the very beginning (tick 0) and very end (max tick)
- Verify LiveTicker does not appear in Midweek or Playoffs scenarios
- Check that the Playoff modal does not reappear after dismissal without a scenario re-switch

---

## TC-005: Every required page visited at least once across all personas

**Priority:** P0
**Type:** Functional

### Objective

Verify that the audit covers all 7 required pages at least once across the 4 persona walkthroughs: Market, PlayerDetail, Portfolio, Watchlist, Mission, Leaderboard, and Timeline.

### Preconditions

- All 4 persona walkthroughs (TC-001 through TC-004) have been executed
- Output artifact `.ralph/research/ui-audit.md` has been produced

### Steps

1. Check the output artifact for references to the Market page.
   **Expected:** At least one issue or observation references the Market page, or the artifact explicitly confirms Market was audited.

2. Check the output artifact for references to the PlayerDetail page.
   **Expected:** At least one issue or observation references the PlayerDetail page.

3. Check the output artifact for references to the Portfolio page.
   **Expected:** At least one issue or observation references the Portfolio page.

4. Check the output artifact for references to the Watchlist page.
   **Expected:** At least one issue or observation references the Watchlist page.

5. Check the output artifact for references to the Mission page.
   **Expected:** At least one issue or observation references the Mission page.

6. Check the output artifact for references to the Leaderboard page.
   **Expected:** At least one issue or observation references the Leaderboard page.

7. Check the output artifact for references to the Timeline page.
   **Expected:** At least one issue or observation references the Timeline page.

### Test Data

- The completed `.ralph/research/ui-audit.md` artifact

### Edge Cases

- If a page had zero issues, the artifact should still document that the page was visited and audited (e.g., in the executive summary or a "pages audited" section)
- Verify that page names are used consistently (not aliases that could cause ambiguity)

---

## TC-006: Output artifact exists at the correct path

**Priority:** P0
**Type:** Functional

### Objective

Verify that the audit produces the output artifact at exactly `.ralph/research/ui-audit.md` as specified in the acceptance criteria.

### Preconditions

- All persona walkthroughs have been completed

### Steps

1. Check that the file `.ralph/research/ui-audit.md` exists on disk.
   **Expected:** File exists and is non-empty.

2. Verify the file is valid Markdown (parseable, no broken syntax).
   **Expected:** File renders correctly as Markdown with proper headings, lists, and formatting.

3. Verify the file is not placed at an alternate path (e.g., `.ralph/ui-audit.md` or `.ralph/research/audit.md`).
   **Expected:** Only `.ralph/research/ui-audit.md` contains the audit results.

### Test Data

- None.

### Edge Cases

- Directory `.ralph/research/` must exist (should be created if it doesn't)
- File should not be empty or contain only boilerplate with no actual findings

---

## TC-007: Output artifact contains executive summary with severity breakdown

**Priority:** P0
**Type:** Functional

### Objective

Verify the output artifact includes an executive summary section with the total number of issues found and a breakdown by severity level (Critical, High, Medium, Low).

### Preconditions

- Output artifact exists at `.ralph/research/ui-audit.md`

### Steps

1. Open the artifact and locate the executive summary section.
   **Expected:** A clearly labeled "Executive Summary" (or equivalent) section exists near the top of the document.

2. Verify the summary includes a total issue count.
   **Expected:** A numeric total of all issues found is stated (e.g., "Total issues: 15").

3. Verify the summary includes a breakdown by severity.
   **Expected:** Counts are provided for each severity level: Critical, High, Medium, Low (e.g., "Critical: 2, High: 5, Medium: 6, Low: 2").

4. Verify the severity counts sum to the stated total.
   **Expected:** Critical + High + Medium + Low = Total issues.

### Test Data

- The completed `.ralph/research/ui-audit.md` artifact

### Edge Cases

- If zero issues were found at a given severity, that severity should still appear with a count of 0
- Summary should not include severities outside the defined set (e.g., no "Blocker" or "Trivial")

---

## TC-008: Issues are grouped by severity in the output artifact

**Priority:** P0
**Type:** Functional

### Objective

Verify that all documented issues in the artifact are organized into sections grouped by severity: Critical, High, Medium, Low — in that order.

### Preconditions

- Output artifact exists at `.ralph/research/ui-audit.md`
- At least one issue has been documented

### Steps

1. Scan the artifact for severity group headings.
   **Expected:** Sections exist for "Critical", "High", "Medium", and "Low" (as headings or clearly delineated groups).

2. Verify issues within each group share the same severity.
   **Expected:** No Critical issue appears under the High section, and vice versa.

3. Verify the groups appear in descending severity order.
   **Expected:** Critical appears before High, High before Medium, Medium before Low.

### Test Data

- The completed `.ralph/research/ui-audit.md` artifact

### Edge Cases

- A severity group with zero issues may be omitted or present with a "No issues found" note — both are acceptable
- Issues should not appear outside of any severity group (no ungrouped orphan issues)

---

## TC-009: Each documented issue contains all required fields

**Priority:** P0
**Type:** Functional

### Objective

Verify that every individual issue entry in the output artifact includes all four required fields: title, description of the problem, steps to reproduce, and affected page/component.

### Preconditions

- Output artifact exists at `.ralph/research/ui-audit.md`
- At least one issue has been documented

### Steps

1. Select the first issue in the artifact and verify it has a title.
   **Expected:** Issue has a clear, concise title summarizing the bug or friction point.

2. Verify the first issue has a description of the problem.
   **Expected:** A narrative description explains what is wrong and why it matters.

3. Verify the first issue has steps to reproduce.
   **Expected:** Numbered or bulleted steps describe how to trigger the issue, specific enough for someone else to follow.

4. Verify the first issue identifies the affected page/component.
   **Expected:** The page name (e.g., "Market", "PlayerDetail") or component name (e.g., "LiveTicker", "PlayerCard") is explicitly stated.

5. Repeat steps 1–4 for at least 3 additional issues sampled from different severity groups.
   **Expected:** All sampled issues contain all four required fields.

6. Spot-check for expected vs. actual behavior in issue descriptions.
   **Expected:** Issues describe both what should happen and what actually happens.

### Test Data

- The completed `.ralph/research/ui-audit.md` artifact

### Edge Cases

- Issues with very simple repro (e.g., "open page X") should still have explicit steps, not just a description
- Component-level issues should reference the component name, not just the page
- Issues found via console inspection should still have repro steps (e.g., "Open page X, open dev console, observe error Y")

---

## TC-010: Recommended fix priority order is included

**Priority:** P1
**Type:** Functional

### Objective

Verify the output artifact includes a recommended fix priority section that provides an ordered list of which issues to fix first, helping the development team triage effectively.

### Preconditions

- Output artifact exists at `.ralph/research/ui-audit.md`

### Steps

1. Locate a "Recommended fix priority" (or equivalent) section in the artifact.
   **Expected:** A clearly labeled section exists with an ordered list.

2. Verify the list is ordered (numbered or explicitly ranked).
   **Expected:** Items are in priority order, not alphabetical or random.

3. Verify the ordering reflects severity and user impact (Critical/High issues before Medium/Low).
   **Expected:** Critical-severity issues appear near the top of the priority list; Low-severity issues appear toward the bottom.

4. Verify each item in the priority list can be cross-referenced to an issue documented in the severity-grouped sections.
   **Expected:** Every priority item maps to a documented issue; no phantom recommendations without backing issues.

### Test Data

- The completed `.ralph/research/ui-audit.md` artifact

### Edge Cases

- If two issues share the same severity, the priority order should still differentiate them (e.g., by user impact or frequency)
- The priority list should not introduce new issues that weren't documented in the main findings

---

## TC-011: Console errors are captured and included in findings

**Priority:** P0
**Type:** Functional

### Objective

Verify that browser console errors and warnings encountered during the audit are captured and documented in the output artifact, as required by AC4.

### Preconditions

- All 4 persona walkthroughs have been completed
- Browser console was monitored during each walkthrough
- Output artifact exists at `.ralph/research/ui-audit.md`

### Steps

1. Locate a "Console errors" (or equivalent) section in the output artifact.
   **Expected:** A dedicated section exists for console findings.

2. If errors were encountered, verify each console error entry includes the error message text.
   **Expected:** The actual error message or warning text is quoted or paraphrased.

3. Verify each console error entry identifies when/where it occurred (which page or action triggered it).
   **Expected:** Context is provided, e.g., "Occurs when navigating to PlayerDetail for player X" or "Appears on Market page load."

4. If no console errors were encountered, verify the section explicitly states this.
   **Expected:** Section contains a statement like "No console errors or warnings were observed" rather than being absent entirely.

### Test Data

- The completed `.ralph/research/ui-audit.md` artifact
- Browser console output captured during each persona walkthrough

### Edge Cases

- React development-mode warnings (e.g., key prop warnings, strict mode double-render) should be captured if present
- Warnings should be distinguished from errors
- Network errors (failed fetches, 404s) visible in console should also be captured
- Console output from browser extensions should be excluded if identifiable

---

## TC-012: Dev server is started and app is accessible before testing begins

**Priority:** P0
**Type:** Functional

### Objective

Verify the audit process begins by starting the Vite dev server via `npm run dev` and confirming the app is accessible at http://localhost:5173 before any persona walkthroughs begin.

### Preconditions

- Project dependencies installed (`npm install` completed)
- Port 5173 is available

### Steps

1. Run `npm run dev` from the project root.
   **Expected:** Vite dev server starts without errors and reports a local URL (http://localhost:5173).

2. Open http://localhost:5173 in the browser.
   **Expected:** The McQueen app loads and renders the default page without a blank screen or crash.

3. Verify no build errors are present in the terminal output.
   **Expected:** Vite reports successful compilation with no TypeScript or syntax errors.

### Test Data

- None.

### Edge Cases

- If port 5173 is occupied, Vite may use an alternate port — the audit should use whatever port Vite reports
- Hot Module Replacement (HMR) should be functional (not required for the audit, but indicates healthy dev server state)

---

## TC-013: Browser snapshots taken before and after key interactions

**Priority:** P1
**Type:** Functional

### Objective

Verify that the audit process captures browser snapshots (via `browser_snapshot`) before and after key interactions for each persona, providing visual evidence for documented issues.

### Preconditions

- Browser MCP (cursor-ide-browser) is available and functional
- Dev server is running and app is loaded

### Steps

1. Review the audit process for the New User persona.
   **Expected:** Snapshots were taken at minimum before onboarding starts and after onboarding completes.

2. Review the audit process for the Active Trader persona.
   **Expected:** Snapshots were taken at minimum before a trade and after a trade (showing portfolio update).

3. Review the audit process for the Mission Player persona.
   **Expected:** Snapshots were taken at minimum before picks are made and after results are revealed.

4. Review the audit process for the Scenario Explorer persona.
   **Expected:** Snapshots were taken at minimum in each of the 3 scenarios (Midweek, Live, Playoffs).

5. Verify that issues in the output artifact reference snapshot evidence where applicable.
   **Expected:** Visual bugs and layout issues reference a screenshot or snapshot that demonstrates the problem.

### Test Data

- None.

### Edge Cases

- If browser_snapshot is unavailable, the audit should note this limitation and rely on textual descriptions
- Snapshots of transient states (animations, transitions) may be difficult to capture — the audit should describe these rather than require pixel-perfect evidence

---

## TC-014: Audit covers all seven categories of issues to look for

**Priority:** P1
**Type:** Functional

### Objective

Verify the audit systematically checked for all 7 categories of issues specified in the issue description: visual bugs, interaction bugs, UX friction, data display issues, accessibility gaps, console errors, and performance issues.

### Preconditions

- All 4 persona walkthroughs have been completed
- Output artifact exists at `.ralph/research/ui-audit.md`

### Steps

1. Review the output artifact for any documented visual bugs (overlapping elements, clipped text, broken layouts, misaligned components, missing images/icons).
   **Expected:** Visual bug category was evaluated; issues documented or explicitly noted as "none found."

2. Review the output artifact for any documented interaction bugs (buttons that don't respond, broken navigation, stale state).
   **Expected:** Interaction bug category was evaluated.

3. Review the output artifact for any documented UX friction points (confusing flows, missing feedback, unclear affordances, dead ends).
   **Expected:** UX friction category was evaluated.

4. Review the output artifact for any documented data display issues (wrong formats, missing units, stale prices, chart rendering problems).
   **Expected:** Data display category was evaluated.

5. Review the output artifact for any documented accessibility gaps (missing focus indicators, poor contrast, no keyboard nav).
   **Expected:** Accessibility category was evaluated.

6. Review the output artifact for console errors section (covered by TC-011).
   **Expected:** Console errors category was evaluated.

7. Review the output artifact for any documented performance issues (slow transitions, janky animations, long loads).
   **Expected:** Performance category was evaluated.

### Test Data

- The completed `.ralph/research/ui-audit.md` artifact

### Edge Cases

- Not every category will necessarily have findings — but the audit should demonstrate that each was checked
- An issue may span multiple categories (e.g., a broken chart is both a visual bug and a data display issue) — it should be categorized by its primary impact
