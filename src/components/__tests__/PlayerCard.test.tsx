import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import PlayerCard from '../PlayerCard/PlayerCard';
import { truncateAtWord } from '../PlayerCard/PlayerCard';
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

  it('truncates long moveReason at word boundary before 60 chars', () => {
    const longReason = 'Patrick Mahomes threw his third touchdown pass of the game to seal the victory';
    const player = { ...basePlayer, moveReason: longReason };
    renderWithProviders(<PlayerCard player={player} />);
    expect(screen.getByText('Patrick Mahomes threw his third touchdown pass of the game...')).toBeInTheDocument();
  });

  it('displays short moveReason without ellipsis', () => {
    const shortReason = 'Quick trade update';
    const player = { ...basePlayer, moveReason: shortReason };
    renderWithProviders(<PlayerCard player={player} />);
    expect(screen.getByText('Quick trade update')).toBeInTheDocument();
    expect(screen.queryByText(/\.\.\./)).not.toBeInTheDocument();
  });

  it('displays moveReason of exactly 60 chars without ellipsis', () => {
    const exactReason = 'A'.repeat(60);
    const player = { ...basePlayer, moveReason: exactReason };
    renderWithProviders(<PlayerCard player={player} />);
    expect(screen.getByText(exactReason)).toBeInTheDocument();
  });

  it('truncates moveReason of 61 chars at word boundary with ellipsis', () => {
    const reason = 'abcdefghij abcdefghij abcdefghij abcdefghij abcdefghij abcde fg';
    const player = { ...basePlayer, moveReason: reason };
    renderWithProviders(<PlayerCard player={player} />);
    expect(screen.getByText('abcdefghij abcdefghij abcdefghij abcdefghij abcdefghij...')).toBeInTheDocument();
  });

  it('truncates single long word at 60 chars when no word boundary found', () => {
    const longWord = 'A'.repeat(100);
    const player = { ...basePlayer, moveReason: longWord };
    renderWithProviders(<PlayerCard player={player} />);
    expect(screen.getByText('A'.repeat(60) + '...')).toBeInTheDocument();
  });

  it('does not render moveReason paragraph when moveReason is falsy', () => {
    const player = { ...basePlayer, moveReason: '' };
    renderWithProviders(<PlayerCard player={player} />);
    const cardReason = document.querySelector('[class*="card-reason"]');
    expect(cardReason).toBeNull();
  });
});

describe('truncateAtWord', () => {
  it('returns short text unchanged', () => {
    expect(truncateAtWord('Traded to the Chiefs', 60)).toBe('Traded to the Chiefs');
  });

  it('returns exactly maxLen text unchanged', () => {
    const text = 'Promoted to starter after strong preseason camp performance';
    expect(text.length).toBe(59);
    const exact60 = text + 'X';
    expect(truncateAtWord(exact60, 60)).toBe(exact60);
  });

  it('truncates at last space before maxLen', () => {
    const input = 'Breakout performance in Week 3 elevated his stock significantly among fantasy managers';
    const result = truncateAtWord(input, 60);
    expect(result).toBe('Breakout performance in Week 3 elevated his stock...');
    expect(result.endsWith('...')).toBe(true);
  });

  it('returns empty string unchanged', () => {
    expect(truncateAtWord('', 60)).toBe('');
  });

  it('falls back to hard cut when no spaces exist', () => {
    const input = 'a'.repeat(69);
    expect(truncateAtWord(input, 60)).toBe('a'.repeat(60) + '...');
  });

  it('falls back to hard cut when only space is at position 0 (TC-007)', () => {
    const input = ' ' + 'a'.repeat(65);
    const result = truncateAtWord(input, 60);
    expect(result).toBe(input.slice(0, 60) + '...');
  });

  it('trims trailing whitespace before appending ellipsis (TC-008)', () => {
    const input = 'Hello     ' + 'X'.repeat(55);
    const result = truncateAtWord(input, 60);
    expect(result).toBe('Hello...');
    expect(result).not.toMatch(/\s\.\.\./);
  });
});
