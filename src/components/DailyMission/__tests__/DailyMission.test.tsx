import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DailyMission from '../DailyMission';
import { renderWithProviders, type RenderWithProvidersOptions } from '../../../test/renderWithProviders';
import { createMockEnrichedPlayer } from '../../../test/mockData';
import type { EnrichedPlayer, SocialContextValue, TradingContextValue } from '../../../types';

// ── Mock framer-motion ──────────────────────────────────────────────
const componentCache: Record<string, React.ComponentType<Record<string, unknown>>> = {};
vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_: unknown, tag: string | symbol) => {
        const tagStr = String(tag);
        if (!componentCache[tagStr]) {
          const Component = ({
            children,
            ref,
            ...props
          }: {
            children?: React.ReactNode;
            ref?: React.Ref<unknown>;
            [key: string]: unknown;
          }) => {
            const domProps: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(props)) {
              if (
                typeof value !== 'object' &&
                !key.startsWith('initial') &&
                !key.startsWith('animate') &&
                !key.startsWith('exit') &&
                !key.startsWith('transition') &&
                !key.startsWith('whileHover') &&
                !key.startsWith('whileTap') &&
                !key.startsWith('layout')
              ) {
                domProps[key] = value;
              }
            }
            return React.createElement(tagStr, { ref, ...domProps }, children);
          };
          Component.displayName = `motion.${tagStr}`;
          componentCache[tagStr] = Component;
        }
        return componentCache[tagStr];
      },
    },
  ),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ── Helpers ─────────────────────────────────────────────────────────

function makePlayers(count: number): EnrichedPlayer[] {
  const names = [
    'Patrick Mahomes', 'Josh Allen', 'Lamar Jackson', 'Jalen Hurts',
    'Joe Burrow', 'Dak Prescott', 'Tua Tagovailoa', 'Justin Herbert',
    'Trevor Lawrence', 'Brock Purdy', 'CJ Stroud', 'Kyler Murray',
    'Kirk Cousins', 'Geno Smith', 'Anthony Richardson',
  ];
  const changes = [2.5, -1.3, 0.8, -3.1, 0.5, -2.0, 1.1, -0.7, 3.2, -1.9, 0.3, -0.4, 1.5, -2.3, 0.0];
  return Array.from({ length: count }, (_, i) =>
    createMockEnrichedPlayer({
      id: `p${i + 1}`,
      name: names[i] || `Player ${i + 1}`,
      changePercent: changes[i % changes.length],
    }),
  );
}

const sixPlayers = makePlayers(6);

function renderMission(
  tradingOverrides?: Partial<TradingContextValue>,
  socialOverrides?: Partial<SocialContextValue>,
  props: Record<string, unknown> = {},
) {
  const opts: RenderWithProvidersOptions = {
    tradingOverrides: {
      getPlayers: vi.fn(() => sixPlayers),
      ...tradingOverrides,
    },
    socialOverrides,
  };
  return renderWithProviders(<DailyMission {...props} />, opts);
}

// ── TC-001 ──────────────────────────────────────────────────────────

describe('DailyMission', () => {
  it('TC-001: renders pick-selection UI when mission is not yet revealed', () => {
    renderMission(
      { getPlayers: vi.fn(() => makePlayers(3)) },
      { missionRevealed: false, missionPicks: { risers: [], fallers: [] } },
    );

    expect(screen.getByText(/Risers \(0\/3\)/)).toBeInTheDocument();
    expect(screen.getByText(/Fallers \(0\/3\)/)).toBeInTheDocument();
    expect(screen.getByText('Click a player to add them to your picks:')).toBeInTheDocument();

    const revealBtn = screen.getByRole('button', { name: /Select 6 more players/ });
    expect(revealBtn).toBeDisabled();
  });

  // ── TC-002 ────────────────────────────────────────────────────────

  it('TC-002: displays up to 12 players in the selector', () => {
    const fifteenPlayers = makePlayers(15);
    renderMission(
      { getPlayers: vi.fn(() => fifteenPlayers) },
      { missionRevealed: false, missionPicks: { risers: [], fallers: [] } },
    );

    const selectorBtns = screen.getAllByLabelText(/Pick .+ as riser/);
    expect(selectorBtns).toHaveLength(12);
  });

  it('TC-002 edge: fewer than 12 players shows all', () => {
    renderMission(
      { getPlayers: vi.fn(() => makePlayers(5)) },
      { missionRevealed: false, missionPicks: { risers: [], fallers: [] } },
    );

    const selectorBtns = screen.getAllByLabelText(/Pick .+ as riser/);
    expect(selectorBtns).toHaveLength(5);
  });

  // ── TC-003 ────────────────────────────────────────────────────────

  it('TC-003: clicking riser button calls setMissionPick with correct arguments', async () => {
    const setMissionPick = vi.fn();
    const user = userEvent.setup();
    renderMission(
      { getPlayers: vi.fn(() => makePlayers(3)) },
      { missionPicks: { risers: [], fallers: [] }, setMissionPick },
    );

    await user.click(screen.getByLabelText('Pick Patrick Mahomes as riser'));
    expect(setMissionPick).toHaveBeenCalledWith('p1', 'riser');
  });

  // ── TC-004 ────────────────────────────────────────────────────────

  it('TC-004: clicking faller button calls setMissionPick with correct arguments', async () => {
    const setMissionPick = vi.fn();
    const user = userEvent.setup();
    renderMission(
      { getPlayers: vi.fn(() => makePlayers(3)) },
      { missionPicks: { risers: [], fallers: [] }, setMissionPick },
    );

    await user.click(screen.getByLabelText('Pick Patrick Mahomes as faller'));
    expect(setMissionPick).toHaveBeenCalledWith('p1', 'faller');
  });

  // ── TC-005 ────────────────────────────────────────────────────────

  it('TC-005: picked players appear in the risers column with remove button', async () => {
    const clearMissionPick = vi.fn();
    const players = makePlayers(3);
    const user = userEvent.setup();
    renderMission(
      { getPlayers: vi.fn(() => players) },
      { missionPicks: { risers: ['p1'], fallers: [] }, clearMissionPick },
    );

    expect(screen.getByText(/Risers \(1\/3\)/)).toBeInTheDocument();
    expect(screen.getByLabelText('Remove Patrick Mahomes from risers')).toBeInTheDocument();

    const emptySlots = screen.getAllByText('Select a riser');
    expect(emptySlots).toHaveLength(2);

    await user.click(screen.getByLabelText('Remove Patrick Mahomes from risers'));
    expect(clearMissionPick).toHaveBeenCalledWith('p1');
  });

  // ── TC-006 ────────────────────────────────────────────────────────

  it('TC-006: picked players appear in the fallers column with remove button', async () => {
    const clearMissionPick = vi.fn();
    const players = makePlayers(3);
    const user = userEvent.setup();
    renderMission(
      { getPlayers: vi.fn(() => players) },
      { missionPicks: { risers: [], fallers: ['p2'] }, clearMissionPick },
    );

    expect(screen.getByText(/Fallers \(1\/3\)/)).toBeInTheDocument();
    expect(screen.getByLabelText('Remove Josh Allen from fallers')).toBeInTheDocument();

    const emptySlots = screen.getAllByText('Select a faller');
    expect(emptySlots).toHaveLength(2);

    await user.click(screen.getByLabelText('Remove Josh Allen from fallers'));
    expect(clearMissionPick).toHaveBeenCalledWith('p2');
  });

  // ── TC-007 ────────────────────────────────────────────────────────

  it('TC-007: riser button is disabled when risers column is full for unpicked players', () => {
    const players = makePlayers(4);
    renderMission(
      { getPlayers: vi.fn(() => players) },
      { missionPicks: { risers: ['p1', 'p2', 'p3'], fallers: [] } },
    );

    const p4RiserBtn = screen.getByLabelText('Pick Jalen Hurts as riser');
    expect(p4RiserBtn).toBeDisabled();

    const p1RiserBtn = screen.getByLabelText('Pick Patrick Mahomes as riser');
    expect(p1RiserBtn).not.toBeDisabled();

    // Faller buttons for p4 should NOT be disabled
    const p4FallerBtn = screen.getByLabelText('Pick Jalen Hurts as faller');
    expect(p4FallerBtn).not.toBeDisabled();
  });

  // ── TC-008 ────────────────────────────────────────────────────────

  it('TC-008: faller button is disabled when fallers column is full for unpicked players', () => {
    const players = makePlayers(4);
    renderMission(
      { getPlayers: vi.fn(() => players) },
      { missionPicks: { risers: [], fallers: ['p1', 'p2', 'p3'] } },
    );

    const p4FallerBtn = screen.getByLabelText('Pick Jalen Hurts as faller');
    expect(p4FallerBtn).toBeDisabled();

    const p1FallerBtn = screen.getByLabelText('Pick Patrick Mahomes as faller');
    expect(p1FallerBtn).not.toBeDisabled();

    // Riser buttons for p4 should NOT be disabled
    const p4RiserBtn = screen.getByLabelText('Pick Jalen Hurts as riser');
    expect(p4RiserBtn).not.toBeDisabled();
  });

  // ── TC-009 ────────────────────────────────────────────────────────

  it('TC-009: reveal button shows remaining count and is disabled when picks incomplete', () => {
    const { unmount } = renderMission(
      undefined,
      { missionPicks: { risers: [], fallers: [] } },
    );
    expect(screen.getByRole('button', { name: 'Select 6 more players' })).toBeDisabled();
    unmount();

    const { unmount: unmount2 } = renderMission(
      undefined,
      { missionPicks: { risers: ['p1'], fallers: ['p2'] } },
    );
    expect(screen.getByRole('button', { name: 'Select 4 more players' })).toBeDisabled();
    unmount2();

    renderMission(
      undefined,
      { missionPicks: { risers: ['p1', 'p2'], fallers: ['p3', 'p4', 'p5'] } },
    );
    expect(screen.getByRole('button', { name: 'Select 1 more players' })).toBeDisabled();
  });

  // ── TC-010 ────────────────────────────────────────────────────────

  it('TC-010: reveal button is enabled and shows "Reveal Results!" when all 6 picks are made', () => {
    renderMission(
      undefined,
      {
        missionPicks: { risers: ['p1', 'p2', 'p3'], fallers: ['p4', 'p5', 'p6'] },
        missionRevealed: false,
      },
    );

    const btn = screen.getByRole('button', { name: 'Reveal Results!' });
    expect(btn).not.toBeDisabled();
  });

  // ── TC-011 ────────────────────────────────────────────────────────

  it('TC-011: clicking "Reveal Results!" calls revealMission', async () => {
    const revealMission = vi.fn();
    const user = userEvent.setup();
    renderMission(
      undefined,
      {
        missionPicks: { risers: ['p1', 'p2', 'p3'], fallers: ['p4', 'p5', 'p6'] },
        missionRevealed: false,
        revealMission,
      },
    );

    await user.click(screen.getByRole('button', { name: 'Reveal Results!' }));
    expect(revealMission).toHaveBeenCalledTimes(1);
  });

  // ── TC-012 ────────────────────────────────────────────────────────

  it('TC-012: results view displays score correctly after reveal', () => {
    renderMission(
      undefined,
      {
        missionRevealed: true,
        missionPicks: { risers: ['p1', 'p2', 'p3'], fallers: ['p4', 'p5', 'p6'] },
        getMissionScore: vi.fn(() => ({ correct: 4, total: 6, percentile: 83 })),
      },
    );

    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText(/You beat/)).toBeInTheDocument();
    expect(screen.getByText('83%')).toBeInTheDocument();
  });

  // ── TC-013 ────────────────────────────────────────────────────────

  it('TC-013: results view shows correct/incorrect status for each riser pick', () => {
    // p1: +2.5 (correct riser), p2: -1.3 (incorrect riser), p3: +0.8 (correct riser)
    const players = makePlayers(6);
    renderMission(
      { getPlayers: vi.fn(() => players) },
      {
        missionRevealed: true,
        missionPicks: { risers: ['p1', 'p2', 'p3'], fallers: [] },
        getMissionScore: vi.fn(() => ({ correct: 2, total: 3, percentile: 83 })),
      },
    );

    const risersHeading = screen.getByText('Your Risers');
    const risersColumn = risersHeading.parentElement!;
    const resultChips = risersColumn.querySelectorAll('[class*="result-chip"]');

    // p1 correct (changePercent 2.5 > 0)
    expect(resultChips[0].textContent).toContain('Patrick Mahomes');
    expect(resultChips[0].textContent).toContain('✓');
    expect(resultChips[0].textContent).toContain('2.5%');

    // p2 incorrect (changePercent -1.3 < 0)
    expect(resultChips[1].textContent).toContain('Josh Allen');
    expect(resultChips[1].textContent).toContain('✗');
    expect(resultChips[1].textContent).toContain('1.3%');

    // p3 correct (changePercent 0.8 > 0)
    expect(resultChips[2].textContent).toContain('Lamar Jackson');
    expect(resultChips[2].textContent).toContain('✓');
  });

  // ── TC-014 ────────────────────────────────────────────────────────

  it('TC-014: results view shows correct/incorrect status for each faller pick', () => {
    // p4: -3.1 (correct faller), p5: +0.5 (incorrect faller), p6: -2.0 (correct faller)
    const players = makePlayers(6);
    renderMission(
      { getPlayers: vi.fn(() => players) },
      {
        missionRevealed: true,
        missionPicks: { risers: [], fallers: ['p4', 'p5', 'p6'] },
        getMissionScore: vi.fn(() => ({ correct: 2, total: 3, percentile: 83 })),
      },
    );

    const fallersHeading = screen.getByText('Your Fallers');
    const fallersColumn = fallersHeading.parentElement!;
    const resultChips = fallersColumn.querySelectorAll('[class*="result-chip"]');

    // p4 correct (changePercent -3.1 < 0)
    expect(resultChips[0].textContent).toContain('Jalen Hurts');
    expect(resultChips[0].textContent).toContain('✓');
    expect(resultChips[0].textContent).toContain('3.1%');

    // p5 incorrect (changePercent 0.5 > 0)
    expect(resultChips[1].textContent).toContain('Joe Burrow');
    expect(resultChips[1].textContent).toContain('✗');
    expect(resultChips[1].textContent).toContain('0.5%');

    // p6 correct (changePercent -2.0 < 0)
    expect(resultChips[2].textContent).toContain('Dak Prescott');
    expect(resultChips[2].textContent).toContain('✓');
  });

  // ── TC-015 ────────────────────────────────────────────────────────

  it('TC-015: "Play Again" button calls resetMission', async () => {
    const resetMission = vi.fn();
    const user = userEvent.setup();
    renderMission(
      undefined,
      {
        missionRevealed: true,
        missionPicks: { risers: ['p1', 'p2', 'p3'], fallers: ['p4', 'p5', 'p6'] },
        getMissionScore: vi.fn(() => ({ correct: 4, total: 6, percentile: 83 })),
        resetMission,
      },
    );

    const playAgainBtn = screen.getByRole('button', { name: 'Play Again' });
    expect(playAgainBtn).toBeInTheDocument();
    await user.click(playAgainBtn);
    expect(resetMission).toHaveBeenCalledTimes(1);
  });

  // ── TC-016 ────────────────────────────────────────────────────────

  it('TC-016: collapsible mode renders header with expand/collapse toggle', async () => {
    const user = userEvent.setup();
    renderMission(
      undefined,
      { missionRevealed: false, missionPicks: { risers: [], fallers: [] } },
      { collapsible: true },
    );

    expect(screen.getByText("Today's Mission")).toBeInTheDocument();
    expect(screen.getByText('Pick 3 risers and 3 fallers')).toBeInTheDocument();

    const headerBtn = screen.getByRole('button', { name: /Today's Mission/ });
    expect(headerBtn).toHaveAttribute('aria-expanded', 'true');

    // Content should be visible
    expect(screen.getByText('Click a player to add them to your picks:')).toBeInTheDocument();

    // Collapse
    await user.click(headerBtn);
    expect(headerBtn).toHaveAttribute('aria-expanded', 'false');

    // Expand again
    await user.click(headerBtn);
    expect(headerBtn).toHaveAttribute('aria-expanded', 'true');
  });

  // ── TC-017 ────────────────────────────────────────────────────────

  it('TC-017: non-collapsible mode does not render header, always shows content', () => {
    renderMission(
      { getPlayers: vi.fn(() => makePlayers(3)) },
      { missionRevealed: false, missionPicks: { risers: [], fallers: [] } },
    );

    expect(screen.queryByText("Today's Mission")).not.toBeInTheDocument();
    expect(screen.getByText('Click a player to add them to your picks:')).toBeInTheDocument();
    expect(screen.getByText(/Risers \(0\/3\)/)).toBeInTheDocument();
  });

  // ── TC-018 ────────────────────────────────────────────────────────

  it('TC-018: collapsible header shows score badge when mission is revealed', () => {
    renderMission(
      undefined,
      {
        missionRevealed: true,
        missionPicks: { risers: ['p1', 'p2', 'p3'], fallers: ['p4', 'p5', 'p6'] },
        getMissionScore: vi.fn(() => ({ correct: 4, total: 6, percentile: 83 })),
      },
      { collapsible: true },
    );

    expect(screen.getByText('4/6 correct')).toBeInTheDocument();
  });

  it('TC-018 edge: score badge not shown when unrevealed', () => {
    renderMission(
      undefined,
      {
        missionRevealed: false,
        missionPicks: { risers: [], fallers: [] },
        getMissionScore: vi.fn(() => null),
      },
      { collapsible: true },
    );

    expect(screen.queryByText(/correct/)).not.toBeInTheDocument();
  });

  // ── TC-019 ────────────────────────────────────────────────────────

  it('TC-019: picked player chip in selector shows "picked" styling', () => {
    const players = makePlayers(3);
    renderMission(
      { getPlayers: vi.fn(() => players) },
      { missionPicks: { risers: ['p1'], fallers: ['p2'] } },
    );

    // Find chips via their riser button's parent (the selector-chip div)
    const p1Chip = screen.getByLabelText('Pick Patrick Mahomes as riser').closest('[class*="selector-chip"]')!;
    expect(p1Chip.className).toMatch(/picked/);

    const p3Chip = screen.getByLabelText('Pick Lamar Jackson as riser').closest('[class*="selector-chip"]')!;
    expect(p3Chip.className).not.toMatch(/picked/);
  });

  // ── TC-020 ────────────────────────────────────────────────────────

  it('TC-020: active riser/faller button shows "active" styling', () => {
    const players = makePlayers(3);
    renderMission(
      { getPlayers: vi.fn(() => players) },
      { missionPicks: { risers: ['p1'], fallers: ['p2'] } },
    );

    // p1 riser btn should be active
    const p1RiserBtn = screen.getByLabelText('Pick Patrick Mahomes as riser');
    expect(p1RiserBtn.className).toMatch(/active/);

    // p1 faller btn should NOT be active
    const p1FallerBtn = screen.getByLabelText('Pick Patrick Mahomes as faller');
    expect(p1FallerBtn.className).not.toMatch(/active/);

    // p2 faller btn should be active
    const p2FallerBtn = screen.getByLabelText('Pick Josh Allen as faller');
    expect(p2FallerBtn.className).toMatch(/active/);

    // p2 riser btn should NOT be active
    const p2RiserBtn = screen.getByLabelText('Pick Josh Allen as riser');
    expect(p2RiserBtn.className).not.toMatch(/active/);
  });

  // ── TC-021 ────────────────────────────────────────────────────────

  it('TC-021: player change percent display in selector shows sign and formatted value', () => {
    const players = makePlayers(3);
    renderMission(
      { getPlayers: vi.fn(() => players) },
      { missionPicks: { risers: [], fallers: [] } },
    );

    // p1 changePercent 2.5 -> "+2.5%"
    expect(screen.getByText('+2.5%')).toBeInTheDocument();
    const upChange = screen.getByText('+2.5%');
    expect(upChange.className).toMatch(/up/);

    // p2 changePercent -1.3 -> "-1.3%"
    expect(screen.getByText('-1.3%')).toBeInTheDocument();
    const downChange = screen.getByText('-1.3%');
    expect(downChange.className).toMatch(/down/);
  });

  // ── TC-022 ────────────────────────────────────────────────────────

  it('TC-022: results view falls back to player id when player not found', () => {
    renderMission(
      { getPlayers: vi.fn(() => []) },
      {
        missionRevealed: true,
        missionPicks: { risers: ['unknown-id'], fallers: [] },
        getMissionScore: vi.fn(() => ({ correct: 0, total: 1, percentile: 50 })),
      },
    );

    const risersHeading = screen.getByText('Your Risers');
    const risersColumn = risersHeading.parentElement!;

    expect(risersColumn.textContent).toContain('unknown-id');
    expect(risersColumn.textContent).toContain('0.0%');
  });
});
