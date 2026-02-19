import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PlayerCard from '../PlayerCard';

vi.mock('../../context/ScenarioContext', () => ({
  useScenario: () => ({
    scenario: 'midweek',
  }),
}));

vi.mock('../../context/TradingContext', () => ({
  useTrading: () => ({
    portfolio: {},
  }),
}));

vi.mock('../../context/SocialContext', () => ({
  useSocial: () => ({
    isWatching: () => false,
    getLeagueHoldings: () => [],
  }),
}));

vi.mock('../../utils/playerImages', () => ({
  getPlayerHeadshotUrl: () => null,
}));

vi.mock('recharts', () => ({
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
}));

const basePlayer = {
  id: 'p1',
  name: 'Patrick Mahomes',
  team: 'KC',
  position: 'QB',
  currentPrice: 54.25,
  changePercent: 2.5,
  priceHistory: [50, 51, 52, 53],
};

describe('PlayerCard', () => {
  it('renders the player name and team', () => {
    render(<PlayerCard player={basePlayer} />);

    expect(screen.getByText('Patrick Mahomes')).toBeInTheDocument();
    expect(screen.getByText('KC')).toBeInTheDocument();
    expect(screen.getByText('QB')).toBeInTheDocument();
  });

  it('displays the formatted price', () => {
    render(<PlayerCard player={basePlayer} />);
    expect(screen.getByText('$54.25')).toBeInTheDocument();
  });

  it('shows positive change indicator when price is up', () => {
    render(<PlayerCard player={basePlayer} />);
    const change = screen.getByText(/2\.50%/);
    expect(change).toHaveClass('up');
  });

  it('shows negative change indicator when price is down', () => {
    const downPlayer = { ...basePlayer, changePercent: -3.1 };
    render(<PlayerCard player={downPlayer} />);
    const change = screen.getByText(/3\.10%/);
    expect(change).toHaveClass('down');
  });

  it('truncates moveReason to 60 characters', () => {
    const longReason = 'A'.repeat(100);
    const player = { ...basePlayer, moveReason: longReason };
    render(<PlayerCard player={player} />);
    expect(screen.getByText(`${'A'.repeat(60)}...`)).toBeInTheDocument();
  });
});
