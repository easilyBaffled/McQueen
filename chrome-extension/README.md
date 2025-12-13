# McQueen Fantasy Stock Market - Chrome Extension

A companion Chrome extension for the McQueen POC that displays stock market indicators next to NFL player names on ESPN.com.

## Installation

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select this `chrome-extension` folder
5. The extension icon should appear in your toolbar

## Usage

Once installed, visit any ESPN.com page with NFL player names:
- Player pages: `espn.com/nfl/player/_/id/...`
- Fantasy pages: `espn.com/fantasy/football/...`
- Game pages: `espn.com/nfl/game/_/...`
- News articles mentioning players

The extension will automatically detect player names from the McQueen simulation and display a stock indicator badge next to them showing:
- **Current price** (e.g., `$158.26`)
- **Trend arrow** (▲ green for up, ▼ red for down)
- **Percent change** (e.g., `2.4%`)

## Supported Players

The extension currently tracks the following players from the simulation:

| Player | Team | Position |
|--------|------|----------|
| Patrick Mahomes | KC | QB |
| Josh Allen | BUF | QB |
| Travis Kelce | KC | TE |
| Ja'Marr Chase | CIN | WR |
| Justin Jefferson | MIN | WR |
| Tyreek Hill | MIA | WR |
| Christian McCaffrey | SF | RB |
| Saquon Barkley | PHI | RB |
| Lamar Jackson | BAL | QB |
| ... and more |

## Files

- `manifest.json` - Extension configuration (Manifest V3)
- `content.js` - Content script that scans pages and injects indicators
- `playerData.js` - Player stock data transformed for quick lookups
- `styles.css` - Indicator badge styling
- `icons/` - Extension icons

## Updating Player Data

To update player prices, edit `playerData.js` with the latest data from the McQueen simulation JSON files.

## Development

The extension uses:
- Manifest V3 (Chrome's latest extension platform)
- Content scripts for DOM manipulation
- MutationObserver for dynamic content (ESPN uses client-side routing)
- TreeWalker for efficient text node scanning

