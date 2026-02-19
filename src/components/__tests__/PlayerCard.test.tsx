import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import PlayerCard from '../PlayerCard/PlayerCard';
import { renderWithProviders } from '../../test/renderWithProviders';
import { createMockEnrichedPlayer } from '../../test/mockData';

vi.mock('../../utils/playerImages', () => ({
  getPlayerHeadshotUrl: () => null,
}));

vi.mock('recharts', () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const basePlayer = createMockEnrichedPlayer({
  currentPrice: 54.25,
  changePercent: 2.5,
  priceChange: 1.25,
  moveReason: 'test reason',
  contentTiles: [],
  priceHistory: [],
});

describe('PlayerCard', () => {
  it('renders the player name and team', () => {
    renderWithProviders(<PlayerCard player={basePlayer} />);

    expect(screen.getByText('Patrick Mahomes')).toBeInTheDocument();
    expect(screen.getByText('KC')).toBeInTheDocument();
    expect(screen.getByText('QB')).toBeInTheDocument();
  });

  it('displays the formatted price', () => {
    renderWithProviders(<PlayerCard player={basePlayer} />);
    expect(screen.getByText('$54.25')).toBeInTheDocument();
  });

  it('shows positive change indicator when price is up', () => {
    renderWithProviders(<PlayerCard player={basePlayer} />);
    const change = screen.getByText(/2\.50%/);
    expect(change.className).toMatch(/up/);
  });

  it('shows negative change indicator when price is down', () => {
    const downPlayer = { ...basePlayer, changePercent: -3.1 };
    renderWithProviders(<PlayerCard player={downPlayer} />);
    const change = screen.getByText(/3\.10%/);
    expect(change.className).toMatch(/down/);
  });

  it('truncates moveReason to 60 characters', () => {
    const longReason = 'A'.repeat(100);
    const player = { ...basePlayer, moveReason: longReason };
    renderWithProviders(<PlayerCard player={player} />);
    expect(screen.getByText(`${'A'.repeat(60)}...`)).toBeInTheDocument();
  });
});
