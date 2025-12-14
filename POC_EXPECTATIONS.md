# McQueen POC - Tester Expectations Guide

Welcome to the **McQueen NFL Stock Market** proof-of-concept! This document outlines what to expect, what to explore, and how to get the most out of your testing experience.

---

## 🎯 What This POC Is

McQueen is a **front-end prototype** demonstrating a fantasy NFL stock market concept where:

- NFL players are tradeable "stocks"
- Prices fluctuate based on game performance, news, and trading activity
- Users can buy/sell shares, make predictions, and compete on leaderboards

**This is a visual and interaction prototype** — not a production-ready product. The goal is to validate the concept, gather feedback on the user experience, and explore how fans might engage with an NFL stock market.

---

## ⚠️ What This POC Is NOT

| Expectation | Reality |
|-------------|---------|
| Real money | **Play money only** — you start with $10,000 in virtual cash |
| Live data | **Simulated data** — prices come from pre-scripted scenarios, not real-time feeds |
| Backend integration | **Front-end only** — no accounts, no persistence across browser sessions |
| Mobile optimized | **Desktop-first** — works on mobile but best experienced on desktop |
| ESPN integration | **Mockup only** — ESPN content tiles are placeholders |

---

## 🚀 Getting Started

### First-Time Experience

1. **Onboarding Flow**: New users see a 6-step tutorial explaining the concept
2. **Welcome Banner**: A dismissible banner on the Market page reinforces the "play money" nature
3. **First Trade Guide**: A subtle prompt guides you toward making your first trade

### Reset the Experience

To see the onboarding again or start fresh, open your browser console and run:

```javascript
localStorage.clear();
location.reload();
```

---

## 🎮 Three Demo Scenarios

Toggle between scenarios using the tabs in the header. Each demonstrates different market conditions:

### 1. Midweek (Default)
**Wednesday afternoon, no games**

- Prices move based on: trade rumors, injury news, analysis pieces
- Best for: Understanding baseline trading mechanics
- Notable: Check Tyreek Hill (hamstring news) and Saquon Barkley (trade rumors)

### 2. Live Game
**Monday Night Football: Chiefs vs Bills**

- Prices react in **real-time** to simulated game events
- **Use the "Play Live" button** to start the simulation
- Watch the **Live Ticker** at the top for breaking plays
- Events: Touchdowns, interceptions, stats accumulation
- Notable: Patrick Mahomes and Josh Allen prices spike on TDs

### 3. Playoffs
**Conference Championship Weekend**

- See **buyback mechanics** for eliminated teams (price crashes)
- Heightened volatility for contenders
- Modal announcement appears explaining playoff rules
- Notable: Stefon Diggs (HOU) shows buyback scenario after Texans elimination

---

## 🔍 Key Features to Explore

### Market Home (`/`)
- Browse 20 player cards with prices, changes, and sparkline charts
- **Sort by**: Biggest Risers, Biggest Fallers, Most Active, Highest Price
- **Search**: Filter by player name or team
- **Mini Leaderboard**: See how you stack up against AI traders

### Player Detail (`/player/:id`)
- Interactive price chart with clickable event markers
- **Price Changes Timeline**: See exactly why prices moved
- **Buy/Sell Panel**: Execute trades
- **Watchlist**: Star players to track without buying
- **League Owners**: See which AI traders hold this player

### Portfolio (`/portfolio`)
- View all your holdings and their performance
- See total portfolio value and P/L

### Watchlist (`/watchlist`)
- Track players you're interested in without committing capital

### Daily Mission (`/mission`)
- **Prediction game**: Pick 3 risers and 3 fallers
- Tests your NFL knowledge
- Scores tracked against leaderboard

### Leaderboard (`/leaderboard`)
- See rankings across the league
- Compare your performance to AI traders

---

## 🛠️ Developer Tools

### Timeline Debugger (Live Mode Only)
When in **Live Game** scenario with dev mode enabled:
1. Look for "Timeline Debugger" button (bottom of screen)
2. Click to expand the simulation timeline
3. **Scrub through events** to see price changes at each moment
4. **Rewind** to replay specific game moments

### Scenario Inspector (`/inspector`)
A hidden debug page showing:
- All events in the current scenario
- Event types and their price impacts
- Timeline visualization

---

## 📝 Things to Notice

### Visual Feedback
- ✅ **Green** = price going up
- ❌ **Red** = price going down
- 🔴 **LIVE badge** = player currently in a game
- ⭐ **Event markers** on charts = clickable for details

### Animations
- Cards animate when sorting changes
- Smooth transitions between pages
- Toast notifications for trade confirmations

### Information Density
- Sparklines show price trends at a glance
- Tooltips explain key concepts (hover over info icons)
- Content tiles link to related ESPN content (placeholder links)

---

## 🐛 Known Limitations

1. **No data persistence** — Refreshing the page resets your portfolio to default
2. **Scenario data is static** — The same events replay each time
3. **AI traders are scripted** — Their behavior is predetermined, not dynamic
4. **Content links are placeholders** — ESPN URLs don't lead to real articles
5. **No real-time sync** — Multiple browser tabs won't stay in sync
6. **Limited players** — Only 19-21 players per scenario (not full NFL rosters)

---

## 💬 Feedback We're Looking For

As you explore, consider:

1. **Intuitiveness**: Could you understand the concept without the tutorial?
2. **Engagement**: What made you want to explore further? What felt tedious?
3. **Information Design**: Was the right information visible at the right time?
4. **Emotional Response**: Did price movements feel meaningful? Exciting?
5. **Feature Gaps**: What did you expect to be able to do but couldn't?
6. **Confusion Points**: Where did you get stuck or misunderstand something?

---

## 📱 Recommended Test Flow

For a complete experience, try this sequence:

1. **Complete onboarding** (don't skip!)
2. **Browse the Market** — sort by different criteria
3. **Make your first trade** — buy shares of a player you like
4. **Check Player Detail** — click a player to see why their price moved
5. **Add to Watchlist** — star a few players
6. **Switch to Live Mode** — hit "Play Live" and watch prices change
7. **Try the Daily Mission** — make your predictions
8. **Switch to Playoffs** — see the buyback mechanics
9. **Check your Portfolio** — see how your trades performed
10. **View the Leaderboard** — see your ranking

---

## 🔗 Quick Links

| Page | URL |
|------|-----|
| Market | `/` |
| Portfolio | `/portfolio` |
| Watchlist | `/watchlist` |
| Daily Mission | `/mission` |
| Leaderboard | `/leaderboard` |
| Scenario Inspector (debug) | `/inspector` |

---

## ❓ FAQ

**Q: Is this real money?**
A: No! This is 100% play money. The $10,000 balance is virtual.

**Q: Why don't prices change when I just sit there?**
A: In Midweek/Playoffs scenarios, prices are static snapshots. In Live mode, click "Play Live" to start the simulation.

**Q: I made a trade but the price only moved a tiny bit?**
A: User trades have small price impact (0.1% per share) to simulate market depth. Big moves come from game events and news.

**Q: Can I lose more than I invest?**
A: No — this isn't real margin trading. You can only spend the cash you have.

**Q: Why do some players have a "BUYBACK" label?**
A: In the Playoffs scenario, players on eliminated teams have their shares bought back at a discount — simulating how player value drops when their season ends.

---

Thank you for testing McQueen! Your feedback will shape the future of this concept. 🏈📈
