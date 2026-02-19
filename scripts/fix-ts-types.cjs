const fs = require('fs');

// Simple replacements: [file, old, new]
const replacements = [
  // --- App.tsx ---
  ['src/App.tsx', 'function LazyPage({ children })', 'function LazyPage({ children }: { children: React.ReactNode })'],

  // --- SimulationContext.tsx remaining issues ---
  ['src/context/SimulationContext.tsx', "const initialPrices = {};\n    players.forEach((player) => {\n      if (scenario === 'espn-live') {\n        initialPrices[player.id] = player.basePrice;\n      } else {\n        initialPrices[player.id] = getCurrentPriceFromHistory(player);\n      }\n    });\n\n    const actionMessage =\n      scenario === 'espn-live'\n        ? 'ESPN Live mode activated - fetching real news...'\n        : 'Scenario loaded';\n\n    setHistory([{ tick: 0, prices: initialPrices, action: actionMessage }]);\n  }, [scenarioVersion]); // eslint-disable-line react-hooks/exhaustive-deps\n\n  // Initial history on first mount (when scenarioVersion === 0)\n  useEffect(() => {\n    if (players.length === 0) return;\n    if (history.length > 0) return;\n\n    const initialPrices = {};\n    players.forEach((player) => {\n      if (scenario === 'espn-live') {\n        initialPrices[player.id] = player.basePrice;\n      } else {\n        initialPrices[player.id] = getCurrentPriceFromHistory(player);\n      }\n    });",
    "const initialPrices: Record<string, number> = {};\n    players.forEach((player) => {\n      if (scenario === 'espn-live') {\n        initialPrices[player.id] = player.basePrice;\n      } else {\n        initialPrices[player.id] = getCurrentPriceFromHistory(player);\n      }\n    });\n\n    const actionMessage =\n      scenario === 'espn-live'\n        ? 'ESPN Live mode activated - fetching real news...'\n        : 'Scenario loaded';\n\n    setHistory([{ tick: 0, prices: initialPrices, action: actionMessage }]);\n  }, [scenarioVersion]); // eslint-disable-line react-hooks/exhaustive-deps\n\n  // Initial history on first mount (when scenarioVersion === 0)\n  useEffect(() => {\n    if (players.length === 0) return;\n    if (history.length > 0) return;\n\n    const initialPrices: Record<string, number> = {};\n    players.forEach((player) => {\n      if (scenario === 'espn-live') {\n        initialPrices[player.id] = player.basePrice;\n      } else {\n        initialPrices[player.id] = getCurrentPriceFromHistory(player);\n      }\n    });"],

  // --- PlayerCard.tsx ---
  ['src/components/PlayerCard/PlayerCard.tsx', 'export default function PlayerCard({ player, showFirstTradeTip = false })', "import type { EnrichedPlayer } from '../../types';\n\ninterface PlayerCardProps {\n  player: EnrichedPlayer;\n  showFirstTradeTip?: boolean;\n}\n\nexport default function PlayerCard({ player, showFirstTradeTip = false }: PlayerCardProps)"],
  ['src/components/PlayerCard/PlayerCard.tsx', 'const dismissLeagueTooltip = (e) => {', 'const dismissLeagueTooltip = (e: React.MouseEvent) => {'],

  // --- DailyMission.tsx ---
  ['src/components/DailyMission/DailyMission.tsx', 'export default function DailyMission()', "export default function DailyMission()"],

  // --- MiniLeaderboard.tsx ---
  ['src/components/MiniLeaderboard/MiniLeaderboard.tsx', 'const getMedal = (rank) => {', 'const getMedal = (rank: number) => {'],

  // --- Onboarding.tsx ---
  ['src/components/Onboarding/Onboarding.tsx', 'export function OnboardingProvider({ children })', "export function OnboardingProvider({ children }: { children: React.ReactNode })"],

  // --- ScenarioToggle.tsx ---
  ['src/components/ScenarioToggle/ScenarioToggle.tsx', 'const handleScenarioChange = (newScenario) => {', 'const handleScenarioChange = (newScenario: string) => {'],

  // --- Leaderboard.tsx ---
  ['src/pages/Leaderboard/Leaderboard.tsx', 'const getMedal = (rank) => {', 'const getMedal = (rank: number) => {'],
];

let changed = 0;
for (const [file, old, newStr] of replacements) {
  if (!fs.existsSync(file)) {
    console.log('  SKIP (not found):', file);
    continue;
  }
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes(old)) {
    content = content.replace(old, newStr);
    fs.writeFileSync(file, content);
    changed++;
    console.log('  Fixed:', file);
  } else {
    console.log('  SKIP (no match):', file, old.substring(0, 50));
  }
}
console.log('Applied', changed, 'fixes');
