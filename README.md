# McQueen - NFL Stock Market

A front-end POC showcasing an "NFL Stock Market" concept where fans trade player stocks whose prices move based on performance, news, and trading activity.

![McQueen Screenshot](https://via.placeholder.com/800x400?text=McQueen+NFL+Stock+Market)

## Features

- **Market Home**: Browse 20 player cards with live prices, changes, and sparkline charts
- **Player Detail**: Deep dive into why prices moved with ESPN content tiles
- **Portfolio & Watchlist**: Track your "investments" and watched players
- **Daily Mission**: Pick 3 risers and 3 fallers prediction game
- **Leaderboard**: See how you stack up against other traders
- **3 Demo Scenarios**: Midweek, Live Game, and Playoffs

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Demo Scenarios

Toggle between scenarios using the prominent tabs in the header:

1. **Midweek** - Wednesday afternoon, no games. Prices move on trade rumors, injury news, and analysis.

2. **Live Game** - Monday Night Football (Chiefs vs Bills). Watch prices react in real-time to game events. Use the "Play Live" button and Timeline Debugger to control the simulation.

3. **Playoffs** - Conference Championship weekend. See buyback mechanics for eliminated teams and heightened volatility for playoff contenders.

## Key Interactions

1. **Browse Market**: Sort by risers, fallers, most active, or highest price
2. **Buy/Sell**: Click any player to view details and trade shares
3. **Watchlist**: Star players to track without buying
4. **Daily Mission**: Pick 3 up, 3 down predictions for bragging rights
5. **Time Travel**: In Live mode, use the Timeline Debugger to rewind and replay events

## Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool
- **React Router** - Navigation
- **Framer Motion** - Animations
- **Recharts** - Charts and sparklines
- **CSS Variables** - ESPN-inspired theming

## Project Structure

```
src/
  components/     # Reusable UI components
  context/        # GameContext (state management + simulation engine)
  data/           # Static JSON for 3 scenarios
  pages/          # Main views (Market, Portfolio, etc.)
  utils/          # Helpers and formatters
```

## Reset Onboarding

To see the onboarding flow again, run in browser console:

```javascript
localStorage.removeItem('mcqueen-onboarded');
location.reload();
```

## Future Enhancements

- Real ESPN content integration
- Multiplayer leagues
- Push notifications for price alerts
- Social sharing
- Mobile-optimized views
