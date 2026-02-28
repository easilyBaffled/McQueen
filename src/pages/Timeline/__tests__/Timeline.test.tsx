import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Timeline from '../Timeline';
import { renderWithProviders } from '../../../test/renderWithProviders';
import type { EnrichedPlayer } from '../../../types';

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_: unknown, tag: string | symbol) => {
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
              typeof value !== 'function' &&
              !['initial', 'animate', 'exit', 'transition', 'layout', 'layoutId'].includes(key)
            ) {
              domProps[key] = value;
            }
            if (key === 'style' && typeof value === 'object') domProps[key] = value;
            if (typeof value === 'function' && key.startsWith('on')) domProps[key] = value;
          }
          return React.createElement(String(tag), { ref, ...domProps }, children);
        };
        return Component;
      },
    },
  ),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => {
    const safeProps: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(props)) {
      if (typeof value !== 'object' && typeof value !== 'function') safeProps[key] = value;
      if (key === 'style') safeProps[key] = value;
      if (typeof value === 'function' && key.startsWith('on')) safeProps[key] = value;
    }
    return <a {...(safeProps as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>{children}</a>;
  },
}));

function makePlayers(): EnrichedPlayer[] {
  return [
    {
      id: 'p1',
      name: 'Patrick Mahomes',
      team: 'KC',
      position: 'QB',
      basePrice: 50,
      totalSharesAvailable: 1000,
      currentPrice: 54.25,
      changePercent: 2.5,
      priceChange: 2.5,
      moveReason: 'Strong performance',
      contentTiles: [],
      priceHistory: [
        {
          price: 50,
          timestamp: '2024-11-25T10:00:00Z',
          reason: { type: 'news', headline: 'Week start baseline' },
        },
        {
          price: 51,
          timestamp: '2024-12-01T12:00:00Z',
          reason: { type: 'news', headline: 'Midweek news update' },
        },
        {
          price: 52,
          timestamp: '2024-12-03T14:00:00Z',
          reason: { type: 'league_trade', headline: 'Traded in fantasy league', memberId: 'user1', action: 'buy', shares: 5 },
        },
        {
          price: 54.25,
          timestamp: '2024-12-04T16:00:00Z',
          reason: { type: 'game_event', eventType: 'TD', headline: 'Mahomes throws 40-yard TD' },
        },
      ],
    },
    {
      id: 'p2',
      name: 'Josh Allen',
      team: 'BUF',
      position: 'QB',
      basePrice: 48,
      totalSharesAvailable: 1000,
      currentPrice: 45,
      changePercent: -3,
      priceChange: -3,
      moveReason: 'Interception in Q2',
      contentTiles: [],
      priceHistory: [
        {
          price: 48,
          timestamp: '2024-12-04T15:00:00Z',
          reason: { type: 'game_event', eventType: 'INT', headline: 'Allen interception' },
        },
        {
          price: 45,
          timestamp: '2024-12-04T16:30:00Z',
          reason: { type: 'game_event', headline: 'General game stats update' },
        },
      ],
    },
  ];
}

function renderTimeline(players?: EnrichedPlayer[]) {
  const p = players ?? makePlayers();
  return renderWithProviders(<Timeline />, {
    tradingOverrides: {
      getPlayers: vi.fn(() => p),
      getPlayer: vi.fn((id: string) => p.find((pl) => pl.id === id) ?? null),
      portfolio: {},
      cash: 10000,
    },
  });
}

describe('Timeline – event type labels (TC-015 to TC-018)', () => {
  it('TC-015 / TC-001: league_trade displays as "Trade"', () => {
    renderTimeline();
    const badges = screen.getAllByTestId('timeline-event-content');
    const tradeBadge = badges.find((b) => b.textContent?.includes('Trade'));
    expect(tradeBadge).toBeTruthy();
    const rawBadge = badges.find((b) => b.textContent?.includes('league_trade'));
    expect(rawBadge).toBeFalsy();
  });

  it('TC-016 / TC-003: game_event with eventType "TD" displays as "TD"', () => {
    renderTimeline();
    const badges = screen.getAllByTestId('timeline-event-content');
    const tdBadge = badges.find((b) => b.textContent?.includes('TD'));
    expect(tdBadge).toBeTruthy();
  });

  it('TC-016 / TC-003: game_event with eventType "INT" displays as "INT"', () => {
    renderTimeline();
    const badges = screen.getAllByTestId('timeline-event-content');
    const intBadge = badges.find((b) => b.textContent?.includes('INT'));
    expect(intBadge).toBeTruthy();
  });

  it('TC-016 / TC-002: game_event without eventType displays as "Game Update"', () => {
    renderTimeline();
    const badges = screen.getAllByTestId('timeline-event-content');
    const gameUpdateBadge = badges.find((b) => b.textContent?.includes('Game Update'));
    expect(gameUpdateBadge).toBeTruthy();
  });

  it('TC-002 edge: game_event with empty string eventType falls back to "Game Update"', () => {
    const players = [{
      id: 'p3',
      name: 'Test Player',
      team: 'TST',
      position: 'QB',
      basePrice: 50,
      totalSharesAvailable: 1000,
      currentPrice: 52,
      changePercent: 2,
      priceChange: 2,
      moveReason: 'Test',
      contentTiles: [],
      priceHistory: [{
        price: 52,
        timestamp: '2024-12-04T10:00:00Z',
        reason: { type: 'game_event', eventType: '', headline: 'Empty eventType' },
      }],
    }] as EnrichedPlayer[];
    renderTimeline(players);
    const badges = screen.getAllByTestId('timeline-event-content');
    const gameUpdateBadge = badges.find((b) => b.textContent?.includes('Game Update'));
    expect(gameUpdateBadge).toBeTruthy();
  });

  it('TC-017 / TC-004: News events display as "News"', () => {
    renderTimeline();
    const badges = screen.getAllByTestId('timeline-event-content');
    const newsBadge = badges.find((b) => b.textContent?.includes('News'));
    expect(newsBadge).toBeTruthy();
  });

  it('TC-018 / TC-006: unknown reason.type displays fallback "Event"', () => {
    const players = [{
      id: 'p3',
      name: 'Test Player',
      team: 'TST',
      position: 'QB',
      basePrice: 50,
      totalSharesAvailable: 1000,
      currentPrice: 52,
      changePercent: 2,
      priceChange: 2,
      moveReason: 'Test',
      contentTiles: [],
      priceHistory: [{
        price: 52,
        timestamp: '2024-12-04T10:00:00Z',
        reason: { type: 'unknown_type', headline: 'Unknown event happened' },
      }],
    }] as EnrichedPlayer[];
    renderTimeline(players);
    const badges = screen.getAllByTestId('timeline-event-content');
    const fallbackBadge = badges.find((b) => b.textContent?.includes('Event'));
    expect(fallbackBadge).toBeTruthy();
    const rawBadge = badges.find((b) => b.textContent?.includes('unknown_type'));
    expect(rawBadge).toBeFalsy();
  });

  it('TC-018 / TC-005: null reason displays fallback "Event"', () => {
    const players = [{
      id: 'p3',
      name: 'Test Player',
      team: 'TST',
      position: 'QB',
      basePrice: 50,
      totalSharesAvailable: 1000,
      currentPrice: 52,
      changePercent: 2,
      priceChange: 2,
      moveReason: 'Test',
      contentTiles: [],
      priceHistory: [{
        price: 52,
        timestamp: '2024-12-04T10:00:00Z',
        reason: null as unknown as import('../../../types').PriceReason,
      }],
    }] as EnrichedPlayer[];
    renderTimeline(players);
    const badges = screen.getAllByTestId('timeline-event-content');
    const fallbackBadge = badges.find((b) => b.textContent?.includes('Event'));
    expect(fallbackBadge).toBeTruthy();
  });

  it('TC-005 edge: empty reason object displays fallback "Event"', () => {
    const players = [{
      id: 'p3',
      name: 'Test Player',
      team: 'TST',
      position: 'QB',
      basePrice: 50,
      totalSharesAvailable: 1000,
      currentPrice: 52,
      changePercent: 2,
      priceChange: 2,
      moveReason: 'Test',
      contentTiles: [],
      priceHistory: [{
        price: 52,
        timestamp: '2024-12-04T10:00:00Z',
        reason: {} as import('../../../types').PriceReason,
      }],
    }] as EnrichedPlayer[];
    renderTimeline(players);
    const badges = screen.getAllByTestId('timeline-event-content');
    const fallbackBadge = badges.find((b) => b.textContent?.includes('Event'));
    expect(fallbackBadge).toBeTruthy();
  });

  it('TC-007: no badge displays raw strings with underscores', () => {
    renderTimeline();
    const badges = screen.getAllByTestId('timeline-type-badge');
    badges.forEach((badge) => {
      expect(badge.textContent).not.toContain('_');
    });
  });
});

describe('Timeline – search input type (TC-011)', () => {
  it('search input uses type="search" for consistency with Market page', () => {
    renderTimeline();
    const input = screen.getByTestId('search-input');
    expect(input).toHaveAttribute('type', 'search');
  });

  it('search filtering still works after type change', async () => {
    const user = userEvent.setup();
    renderTimeline();
    const input = screen.getByTestId('search-input');
    await user.type(input, 'Mahomes');
    const events = screen.getAllByTestId('timeline-event');
    events.forEach((event) => {
      expect(event.textContent).toContain('Mahomes');
    });
  });
});

describe('Timeline – scenario-relative time filters (TC-001 to TC-012)', () => {
  it('TC-001: "Today" filter shows only events from the latest event day', async () => {
    const user = userEvent.setup();
    renderTimeline();
    const timeFilter = screen.getAllByTestId('filter-select')[2];
    await user.selectOptions(timeFilter, 'today');
    const events = screen.getAllByTestId('timeline-event');
    events.forEach((event) => {
      expect(event.textContent).not.toContain('Week start baseline');
      expect(event.textContent).not.toContain('Midweek news update');
    });
    const dec4Events = events.filter(
      (e) => e.textContent?.includes('Mahomes throws') || e.textContent?.includes('Allen interception') || e.textContent?.includes('General game'),
    );
    expect(dec4Events.length).toBeGreaterThan(0);
  });

  it('TC-002: "This Week" filters events within 7 days of latest timestamp', async () => {
    const user = userEvent.setup();
    renderTimeline();
    const timeFilter = screen.getAllByTestId('filter-select')[2];
    await user.selectOptions(timeFilter, 'week');
    const events = screen.getAllByTestId('timeline-event');
    const oldEvent = events.find((e) => e.textContent?.includes('Week start baseline'));
    expect(oldEvent).toBeFalsy();
    const recentEvent = events.find((e) => e.textContent?.includes('Midweek news update'));
    expect(recentEvent).toBeTruthy();
  });

  it('TC-003: "All Time" shows all events after toggling filters', async () => {
    const user = userEvent.setup();
    renderTimeline();
    const allEventsInitial = screen.getAllByTestId('timeline-event');
    const initialCount = allEventsInitial.length;

    const timeFilter = screen.getAllByTestId('filter-select')[2];
    await user.selectOptions(timeFilter, 'today');
    const filteredEvents = screen.getAllByTestId('timeline-event');
    expect(filteredEvents.length).toBeLessThan(initialCount);

    await user.selectOptions(timeFilter, 'all');
    const allEvents = screen.getAllByTestId('timeline-event');
    expect(allEvents.length).toBe(initialCount);
  });

  it('TC-004: scenarioNow tracks the global newest event across all players', async () => {
    const user = userEvent.setup();
    const players: EnrichedPlayer[] = [
      {
        id: 'pA',
        name: 'Player A',
        team: 'AAA',
        position: 'QB',
        basePrice: 40,
        totalSharesAvailable: 1000,
        currentPrice: 42,
        changePercent: 5,
        priceChange: 5,
        moveReason: '',
        contentTiles: [],
        priceHistory: [
          { price: 42, timestamp: '2025-03-10T12:00:00Z', reason: { type: 'news', headline: 'A March 10 event' } },
        ],
      },
      {
        id: 'pB',
        name: 'Player B',
        team: 'BBB',
        position: 'WR',
        basePrice: 30,
        totalSharesAvailable: 1000,
        currentPrice: 31,
        changePercent: 3,
        priceChange: 3,
        moveReason: '',
        contentTiles: [],
        priceHistory: [
          { price: 30, timestamp: '2025-03-09T08:00:00Z', reason: { type: 'news', headline: 'B March 9 event' } },
          { price: 31, timestamp: '2025-03-11T09:00:00Z', reason: { type: 'news', headline: 'B March 11 event' } },
        ],
      },
    ];
    renderTimeline(players);
    const timeFilter = screen.getAllByTestId('filter-select')[2];
    await user.selectOptions(timeFilter, 'today');
    const events = screen.getAllByTestId('timeline-event');
    expect(events.length).toBe(1);
    expect(events[0].textContent).toContain('B March 11 event');
  });

  it('TC-005: empty event list shows empty state without errors', async () => {
    const user = userEvent.setup();
    const emptyPlayers = [{
      id: 'p3',
      name: 'Test',
      team: 'TST',
      position: 'QB',
      basePrice: 50,
      totalSharesAvailable: 1000,
      currentPrice: 50,
      changePercent: 0,
      priceChange: 0,
      moveReason: '',
      contentTiles: [],
      priceHistory: [],
    }] as EnrichedPlayer[];
    renderTimeline(emptyPlayers);
    expect(screen.getByText('No events match your filters')).toBeInTheDocument();

    const timeFilter = screen.getAllByTestId('filter-select')[2];
    await user.selectOptions(timeFilter, 'today');
    expect(screen.getByText('No events match your filters')).toBeInTheDocument();

    await user.selectOptions(timeFilter, 'week');
    expect(screen.getByText('No events match your filters')).toBeInTheDocument();
  });

  it('TC-006: "Today" combined with type filter yields correct intersection', async () => {
    const user = userEvent.setup();
    renderTimeline();
    const timeFilter = screen.getAllByTestId('filter-select')[2];
    await user.selectOptions(timeFilter, 'today');
    const typeFilter = screen.getAllByTestId('filter-select')[0];
    await user.selectOptions(typeFilter, 'news');
    expect(screen.getByText('No events match your filters')).toBeInTheDocument();

    await user.selectOptions(typeFilter, 'all');
    expect(screen.getAllByTestId('timeline-event').length).toBeGreaterThan(0);
  });

  it('TC-007: "This Week" combined with magnitude filter yields correct intersection', async () => {
    const user = userEvent.setup();
    renderTimeline();
    const timeFilter = screen.getAllByTestId('filter-select')[2];
    const magnitudeFilter = screen.getAllByTestId('filter-select')[1];

    await user.selectOptions(timeFilter, 'week');
    const weekEvents = screen.getAllByTestId('timeline-event');
    const weekCount = weekEvents.length;
    expect(weekCount).toBeGreaterThan(0);

    await user.selectOptions(magnitudeFilter, 'major');
    const majorEvents = screen.queryAllByTestId('timeline-event');
    expect(majorEvents.length).toBeLessThanOrEqual(weekCount);
  });

  it('TC-009: "Today" includes events at different times on the same calendar day', async () => {
    const user = userEvent.setup();
    renderTimeline();
    const timeFilter = screen.getAllByTestId('filter-select')[2];
    await user.selectOptions(timeFilter, 'today');
    const events = screen.getAllByTestId('timeline-event');
    const dec4Events = events.filter(
      (e) =>
        e.textContent?.includes('Mahomes throws') ||
        e.textContent?.includes('Allen interception') ||
        e.textContent?.includes('General game'),
    );
    expect(dec4Events.length).toBe(3);
  });

  it('TC-010: Time filter dropdown has all three options', () => {
    renderTimeline();
    const timeFilter = screen.getAllByTestId('filter-select')[2] as HTMLSelectElement;
    const options = Array.from(timeFilter.options).map((o) => o.textContent);
    expect(options).toEqual(['All Time', 'Today', 'This Week']);
  });

  it('TC-011: filters use scenario dates, not browser real date', async () => {
    const user = userEvent.setup();
    renderTimeline();
    const timeFilter = screen.getAllByTestId('filter-select')[2];

    await user.selectOptions(timeFilter, 'today');
    const todayEvents = screen.getAllByTestId('timeline-event');
    expect(todayEvents.length).toBeGreaterThan(0);

    await user.selectOptions(timeFilter, 'week');
    const weekEvents = screen.getAllByTestId('timeline-event');
    expect(weekEvents.length).toBeGreaterThan(0);
  });

  it('TC-012: empty state displays when all events are filtered out', async () => {
    const user = userEvent.setup();
    renderTimeline();
    const timeFilter = screen.getAllByTestId('filter-select')[2];
    await user.selectOptions(timeFilter, 'today');
    expect(screen.getAllByTestId('timeline-event').length).toBeGreaterThan(0);

    const typeFilter = screen.getAllByTestId('filter-select')[0];
    await user.selectOptions(typeFilter, 'news');
    expect(screen.getByText('No events match your filters')).toBeInTheDocument();

    await user.selectOptions(typeFilter, 'all');
    expect(screen.getAllByTestId('timeline-event').length).toBeGreaterThan(0);
  });
});
