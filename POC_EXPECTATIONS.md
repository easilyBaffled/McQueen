# McQueen POC — Product Evaluation Guide

This document is for product stakeholders evaluating the McQueen NFL Stock Market concept. It clarifies what is fully functional, what is simulated, and what was intentionally scoped down for this proof-of-concept.

---

## Executive Summary

**McQueen** demonstrates a fantasy NFL stock market where fans trade player "stocks" that rise and fall based on performance, news, and market activity. This POC validates the core user experience and interaction patterns without backend infrastructure.

**Build time:** ~2 weeks  
**Stack:** React 19, Vite, Framer Motion, Recharts  
**Deployment:** Static front-end (Vercel-ready)

---

## What's Real vs. Simulated

### ✅ Fully Functional in This POC

| Feature | Description |
|---------|-------------|
| **Trading mechanics** | Buy/sell shares, portfolio tracking, P/L calculations all work correctly |
| **Price impact from user trades** | Each share bought/sold moves price by 0.1% (configurable) |
| **Three distinct scenarios** | Midweek, Live Game, and Playoffs each demonstrate different market conditions |
| **Live game simulation** | Real-time event playback with prices reacting to TDs, INTs, stats |
| **Onboarding flow** | 6-step tutorial explains the concept to new users |
| **Daily prediction game** | Pick 3 risers/3 fallers mechanic is fully interactive |
| **Watchlist management** | Add/remove players, persists in session |
| **Leaderboard with AI traders** | 10 AI competitors with pre-populated portfolios |
| **Responsive layout** | Works on desktop and tablet (mobile is functional but not optimized) |

### 🔶 Simulated / Hard-coded

| What You See | What's Actually Happening |
|--------------|---------------------------|
| **Player prices** | Static JSON data with scripted price histories — not calculated from real stats |
| **News headlines** | Pre-written content tied to price events — not fetched from ESPN APIs |
| **ESPN content tiles** | Placeholder links (`#`) — would need real ESPN integration |
| **AI trader behavior** | Scripted trades baked into scenario data — not dynamic algorithms |
| **Leaderboard rankings** | Pre-calculated positions — not computed from actual performance |
| **Player headshots** | ESPN CDN URLs for real player images (these are real) |
| **Game events (Live mode)** | Scripted timeline replaying at 3-second intervals — not live NFL data |

### ❌ Not Implemented (Out of Scope)

| Feature | Why It Was Cut |
|---------|----------------|
| **User accounts / authentication** | No backend — state lives in browser memory |
| **Data persistence** | Refreshing the page resets everything to defaults |
| **Real ESPN data integration** | Would require API contracts and content licensing |
| **Push notifications** | Requires backend infrastructure |
| **Social features** | Leagues, friends, sharing — all require user accounts |
| **Real-time multiplayer** | No WebSocket infrastructure |
| **Mobile-native experience** | Responsive CSS only, no native app |

---

## Corners Cut for Scope

These are intentional simplifications that could be expanded in a production version:

### 1. Static Scenario Data
**What we did:** All price movements come from hand-crafted JSON files with ~15-25 events per scenario.

**Production approach:** Real-time price calculation engine that ingests:
- Live game feeds (TDs, yards, turnovers)
- News/injury APIs
- Actual user trading volume
- Sentiment analysis

### 2. Limited Player Roster
**What we did:** 19-21 players per scenario, manually curated.

**Production approach:** Full NFL roster (~1,700 players) with dynamic filtering, position groups, team views, and search.

### 3. Simplified Price Algorithm
**What we did:** Prices are hard-coded at each event timestamp. User trades add ±0.1% per share.

**Production approach:** Multi-factor pricing model considering:
- Fantasy point projections
- Recent performance trends
- News sentiment scoring
- Trading volume/liquidity
- Supply/demand dynamics

### 4. No Historical Data
**What we did:** Each scenario is a snapshot — no week-over-week or season trends.

**Production approach:** Full historical price charts, season performance, year-over-year comparisons.

### 5. AI Traders Are Scripted
**What we did:** AI league members have pre-determined portfolios and make scripted trades.

**Production approach:** AI agents with different strategies (momentum, value, news-reactive) that create genuine market activity.

### 6. Prediction Game Is Display-Only
**What we did:** Users can make picks, but scoring/results don't persist or affect leaderboard.

**Production approach:** Daily/weekly prediction contests with real scoring, streaks, and prizes.

### 7. Content Links Are Placeholders
**What we did:** ESPN article/video tiles link to `#` — visual mockups only.

**Production approach:** Deep integration with ESPN content graph, personalized recommendations, embedded video players.

---

## The Three Scenarios Explained

Each scenario demonstrates a different market context:

### Midweek
**Purpose:** Show how prices move on non-game days  
**Key mechanics:** News-driven price movement, injury reports, trade rumors  
**Players highlighted:** Tyreek Hill (injury news), Saquon Barkley (trade speculation)

### Live Game
**Purpose:** Demonstrate real-time price reactions during a game  
**Key mechanics:** Play-by-play events, live ticker, "Play/Pause" simulation control  
**Players highlighted:** Patrick Mahomes, Josh Allen (TD spikes), Travis Kelce

### Playoffs
**Purpose:** Show special mechanics for postseason  
**Key mechanics:** **Buyback system** — when a team is eliminated, their players' stocks crash and shares are forcibly repurchased at a discount  
**Players highlighted:** Stefon Diggs (buyback after Texans elimination)

---

## Architecture Notes

### Current (POC)
```
┌─────────────────────────────────────────────┐
│              Browser (Client)               │
├─────────────────────────────────────────────┤
│  React App                                  │
│  ├── GameContext (state + simulation)       │
│  ├── Static JSON (scenarios)                │
│  └── localStorage (session preferences)     │
└─────────────────────────────────────────────┘
```

### Production (Proposed)
```
┌─────────────────┐     ┌─────────────────┐
│   Mobile Apps   │     │    Web App      │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     │
         ┌───────────▼───────────┐
         │      API Gateway      │
         └───────────┬───────────┘
                     │
    ┌────────────────┼────────────────┐
    │                │                │
┌───▼───┐      ┌─────▼─────┐    ┌─────▼─────┐
│ Auth  │      │  Trading  │    │  Pricing  │
│Service│      │  Engine   │    │  Engine   │
└───────┘      └─────┬─────┘    └─────┬─────┘
                     │                │
              ┌──────▼────────────────▼──────┐
              │         Database            │
              │   (Users, Portfolios,       │
              │    Transactions, Prices)    │
              └──────────────┬──────────────┘
                             │
              ┌──────────────▼──────────────┐
              │      External Feeds         │
              │  (ESPN, NFL, News APIs)     │
              └─────────────────────────────┘
```

---

## What This POC Validates

1. **The concept is explainable** — Users understand "NFL stocks" within the onboarding flow
2. **Trading feels intuitive** — Buy/sell mechanics mirror familiar stock trading apps
3. **Price movements create emotion** — Watching your player score a TD and spike in value is satisfying
4. **News integration adds context** — Seeing *why* a price moved (with ESPN content) deepens engagement
5. **Live games are compelling** — Real-time price changes during games create urgency
6. **Prediction games add stickiness** — Daily picks give users a reason to return
7. **Social proof matters** — Seeing what AI traders are buying/selling influences decisions

---

## Open Questions for Product

1. **Monetization model** — Premium features? Transaction fees? Ads? Subscription?
2. **Legal/compliance** — How does this intersect with gambling regulations?
3. **ESPN content licensing** — What's the path to real article/video integration?
4. **Real-money vs. play-money** — Does this stay virtual or become a real trading platform?
5. **League mechanics** — Private leagues with friends? Public competitions?
6. **Seasonal reset** — Do portfolios carry over year-to-year or reset each season?

---

## Recommended Evaluation Flow

To see the full range of what this POC demonstrates:

1. **Complete the onboarding** — Don't skip; it shows the educational approach
2. **Make a few trades** — Buy 2-3 players, see the portfolio update
3. **Explore a player detail page** — Click the chart markers to see event details
4. **Switch to Live Game mode** — Click "Play Live" and watch prices react
5. **Try the Playoffs scenario** — See the buyback mechanic on eliminated players
6. **Make daily predictions** — Experience the prediction game flow
7. **Check the leaderboard** — See the competitive framing

---

## Resetting the Experience

To clear all local state and see the first-time user experience again:

```javascript
// Run in browser console
localStorage.clear();
location.reload();
```

---

## Summary

| Aspect | POC Status | Production Path |
|--------|------------|-----------------|
| Core trading UX | ✅ Complete | Scale to full roster |
| Price calculation | 🔶 Simulated | Build pricing engine |
| Live game integration | 🔶 Scripted replay | Connect to NFL feeds |
| ESPN content | 🔶 Placeholder links | API integration |
| User accounts | ❌ Not built | Auth service needed |
| Data persistence | ❌ Not built | Database needed |
| Mobile apps | ❌ Web only | Native development |

This POC demonstrates that the **core experience is engaging and the concept is viable**. The path to production requires backend infrastructure, data partnerships, and content licensing — but the front-end interaction model is validated and ready to build upon.
