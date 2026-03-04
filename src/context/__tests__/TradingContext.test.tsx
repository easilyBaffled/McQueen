import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor, render, screen } from '@testing-library/react';
import { ScenarioProvider, useScenario } from '../ScenarioContext';
import { SimulationProvider, useSimulation } from '../SimulationContext';
import { EspnProvider, useEspn } from '../EspnContext';
import { TradingProvider, useTrading } from '../TradingContext';
import { INITIAL_CASH, USER_IMPACT_FACTOR, STORAGE_KEYS } from '../../constants';
import { write, read } from '../../services/storageService';

vi.mock('../../services/espnService', async (importOriginal) => {
  const original = (await importOriginal()) as Record<string, unknown>;
  return {
    ...original,
    fetchNFLNews: vi.fn().mockResolvedValue([]),
  };
});

import { fetchNFLNews } from '../../services/espnService';

const mockFetchNFLNews = vi.mocked(fetchNFLNews);

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ScenarioProvider>
      <SimulationProvider>
        <EspnProvider>
          <TradingProvider>{children}</TradingProvider>
        </EspnProvider>
      </SimulationProvider>
    </ScenarioProvider>
  );
}

function useTradingAndScenario() {
  return { trading: useTrading(), scenario: useScenario(), simulation: useSimulation(), espn: useEspn() };
}

function renderTrading() {
  return renderHook(() => useTradingAndScenario(), { wrapper: Wrapper });
}

async function renderAndWait() {
  const hook = renderTrading();
  await waitFor(() => {
    expect(hook.result.current.scenario.scenarioLoading).toBe(false);
  });
  return hook;
}

describe('TradingContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // TC-001
  it('TradingProvider renders children', () => {
    render(
      <ScenarioProvider>
        <SimulationProvider>
          <EspnProvider>
            <TradingProvider>
              <div data-testid="child" />
            </TradingProvider>
          </EspnProvider>
        </SimulationProvider>
      </ScenarioProvider>,
    );
    expect(screen.getByTestId('child')).toBeTruthy();
  });

  // TC-002
  it('useTrading throws when used outside TradingProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      renderHook(() => useTrading());
    }).toThrow('useTrading must be used within a TradingProvider');
    spy.mockRestore();
  });

  // TC-003
  it('useTrading returns complete context shape', async () => {
    const { result } = await renderAndWait();
    const ctx = result.current.trading;

    expect(typeof ctx.portfolio).toBe('object');
    expect(typeof ctx.cash).toBe('number');
    expect(typeof ctx.buyShares).toBe('function');
    expect(typeof ctx.sellShares).toBe('function');
    expect(typeof ctx.getEffectivePrice).toBe('function');
    expect(typeof ctx.getPlayer).toBe('function');
    expect(typeof ctx.getPlayers).toBe('function');
    expect(typeof ctx.getPortfolioValue).toBe('function');
  });

  // TC-006
  it('portfolio initializes from storageService on mount', async () => {
    const storedPortfolio = { p1: { shares: 3, avgCost: 45 } };
    write(STORAGE_KEYS.portfolio, storedPortfolio);

    const { result } = await renderAndWait();
    expect(result.current.trading.portfolio).toEqual(storedPortfolio);
  });

  // TC-007
  it('cash initializes from storageService on mount', async () => {
    write(STORAGE_KEYS.cash, 7500.50);

    const { result } = await renderAndWait();
    expect(result.current.trading.cash).toBe(7500.50);
  });

  it('cash defaults to INITIAL_CASH when no stored value', async () => {
    const { result } = await renderAndWait();
    expect(result.current.trading.cash).toBe(INITIAL_CASH);
  });

  // TC-008
  it('portfolio changes are written to storageService', async () => {
    const { result } = await renderAndWait();

    act(() => {
      result.current.trading.buyShares('allen', 1);
    });

    const stored = read(STORAGE_KEYS.portfolio, {});
    expect(stored).toHaveProperty('allen');
  });

  // TC-009
  it('cash changes are written to storageService', async () => {
    const { result } = await renderAndWait();
    const initialCash = result.current.trading.cash;

    act(() => {
      result.current.trading.buyShares('allen', 1);
    });

    const stored = read(STORAGE_KEYS.cash, INITIAL_CASH);
    expect(stored).toBeLessThan(initialCash);
  });

  // TC-010
  it('applies startingPortfolio from currentData when localStorage is empty', async () => {
    const { result } = await renderAndWait();

    expect(result.current.trading.portfolio).toHaveProperty('mahomes');
    expect(result.current.trading.portfolio.mahomes).toEqual({
      shares: 3,
      avgCost: 138,
    });
    expect(result.current.trading.portfolio).toHaveProperty('mccaffrey');
    expect(result.current.trading.portfolio).toHaveProperty('jefferson');
  });

  it('does not reapply startingPortfolio when localStorage has data', async () => {
    const customPortfolio = { allen: { shares: 7, avgCost: 80 } };
    write(STORAGE_KEYS.portfolio, customPortfolio);

    const { result } = await renderAndWait();
    expect(result.current.trading.portfolio).toEqual(customPortfolio);
    expect(result.current.trading.portfolio).not.toHaveProperty('mahomes');
  });

  // TC-014
  it('scenarioVersion 0 does not trigger reset', async () => {
    const { result } = await renderAndWait();
    expect(result.current.scenario.scenarioVersion).toBe(0);

    act(() => {
      result.current.trading.buyShares('allen', 2);
    });

    const cashAfterBuy = result.current.trading.cash;
    expect(cashAfterBuy).toBeLessThan(INITIAL_CASH);
    expect(result.current.trading.portfolio).toHaveProperty('allen');

    // No scenario change occurred; scenarioVersion is still 0
    expect(result.current.trading.cash).toBe(cashAfterBuy);
    expect(result.current.trading.portfolio).toHaveProperty('allen');
  });

  describe('buyShares', () => {
    // TC-004
    it('delegates to priceResolver for pricing (uses effective price, not base)', async () => {
      const { result } = await renderAndWait();

      const effectivePrice = result.current.trading.getEffectivePrice('allen');
      const cashBefore = result.current.trading.cash;

      let success: boolean | undefined;
      act(() => {
        success = result.current.trading.buyShares('allen', 2);
      });

      expect(success).toBe(true);
      expect(result.current.trading.cash).toBe(
        +(cashBefore - effectivePrice * 2).toFixed(2),
      );

      // userImpact changed, so effective price should now differ
      const priceAfterBuy = result.current.trading.getEffectivePrice('allen');
      expect(priceAfterBuy).toBeGreaterThan(effectivePrice);
    });

    // TC-015
    it('deducts cash and adds shares to portfolio', async () => {
      const { result } = await renderAndWait();

      const price = result.current.trading.getEffectivePrice('allen');
      const cashBefore = result.current.trading.cash;

      let success: boolean | undefined;
      act(() => {
        success = result.current.trading.buyShares('allen', 3);
      });

      expect(success).toBe(true);
      expect(result.current.trading.cash).toBe(
        +(cashBefore - price * 3).toFixed(2),
      );
      expect(result.current.trading.portfolio.allen).toEqual({
        shares: 3,
        avgCost: price,
      });
    });

    // TC-016
    it('computes weighted average cost on multiple buys', async () => {
      const { result } = await renderAndWait();

      const price1 = result.current.trading.getEffectivePrice('allen');
      act(() => {
        result.current.trading.buyShares('allen', 2);
      });

      const price2 = result.current.trading.getEffectivePrice('allen');
      act(() => {
        result.current.trading.buyShares('allen', 3);
      });

      const expectedAvg = +((2 * price1 + 3 * price2) / 5).toFixed(2);
      expect(result.current.trading.portfolio.allen.shares).toBe(5);
      expect(result.current.trading.portfolio.allen.avgCost).toBe(expectedAvg);
    });

    // TC-017
    it('updates userImpact on buy', async () => {
      const { result } = await renderAndWait();

      const priceBefore = result.current.trading.getEffectivePrice('allen');

      act(() => {
        result.current.trading.buyShares('allen', 5);
      });

      // Effective price should increase by factor of 5 * USER_IMPACT_FACTOR
      const priceAfter = result.current.trading.getEffectivePrice('allen');
      const expectedImpact = 5 * USER_IMPACT_FACTOR;
      expect(priceAfter).toBeCloseTo(
        priceBefore * (1 + expectedImpact),
        1,
      );

      // Second buy accumulates further
      act(() => {
        result.current.trading.buyShares('allen', 3);
      });

      const priceAfter2 = result.current.trading.getEffectivePrice('allen');
      expect(priceAfter2).toBeGreaterThan(priceAfter);
    });

    // TC-018
    it('returns false when insufficient cash', async () => {
      const { result } = await renderAndWait();
      const cashBefore = result.current.trading.cash;

      let success: boolean | undefined;
      act(() => {
        success = result.current.trading.buyShares('allen', 1_000_000);
      });

      expect(success).toBe(false);
      expect(result.current.trading.cash).toBe(cashBefore);
      expect(result.current.trading.portfolio.allen).toBeUndefined();
    });

    // TC-019
    it('succeeds when cost exactly equals available cash', async () => {
      const { result: setupResult, unmount } = await renderAndWait();
      const price = setupResult.current.trading.getEffectivePrice('allen');
      unmount();

      // Set up localStorage with cash exactly equal to price * 10
      const exactCash = +(price * 10).toFixed(2);
      write(STORAGE_KEYS.cash, exactCash);
      write(STORAGE_KEYS.portfolio, { dummy: { shares: 1, avgCost: 1 } });

      const { result } = await renderAndWait();
      expect(result.current.trading.cash).toBe(exactCash);

      let success: boolean | undefined;
      act(() => {
        success = result.current.trading.buyShares('allen', 10);
      });

      expect(success).toBe(true);
      expect(result.current.trading.cash).toBe(0);
    });
  });

  describe('sellShares', () => {
    // TC-005
    it('delegates to priceResolver for pricing', async () => {
      const { result } = await renderAndWait();

      // Buy shares first so we have something to sell
      act(() => {
        result.current.trading.buyShares('allen', 5);
      });

      const effectivePrice = result.current.trading.getEffectivePrice('allen');
      const cashBefore = result.current.trading.cash;

      let success: boolean | undefined;
      act(() => {
        success = result.current.trading.sellShares('allen', 2);
      });

      expect(success).toBe(true);
      expect(result.current.trading.cash).toBe(
        +(cashBefore + effectivePrice * 2).toFixed(2),
      );
    });

    // TC-020
    it('adds proceeds to cash and reduces shares', async () => {
      const { result } = await renderAndWait();

      act(() => {
        result.current.trading.buyShares('allen', 5);
      });

      const avgCostAfterBuy = result.current.trading.portfolio.allen.avgCost;
      const cashBeforeSell = result.current.trading.cash;
      const price = result.current.trading.getEffectivePrice('allen');

      let success: boolean | undefined;
      act(() => {
        success = result.current.trading.sellShares('allen', 2);
      });

      expect(success).toBe(true);
      expect(result.current.trading.cash).toBe(
        +(cashBeforeSell + price * 2).toFixed(2),
      );
      expect(result.current.trading.portfolio.allen.shares).toBe(3);
      // avgCost does not change on sell
      expect(result.current.trading.portfolio.allen.avgCost).toBe(
        avgCostAfterBuy,
      );
    });

    // TC-021
    it('removes player from portfolio when all shares sold', async () => {
      const { result } = await renderAndWait();

      act(() => {
        result.current.trading.buyShares('allen', 3);
      });
      expect(result.current.trading.portfolio.allen).toBeDefined();

      act(() => {
        result.current.trading.sellShares('allen', 3);
      });
      expect(result.current.trading.portfolio.allen).toBeUndefined();
      expect(Object.keys(result.current.trading.portfolio)).not.toContain(
        'allen',
      );
    });

    // TC-022
    it('updates userImpact (decreases) on sell', async () => {
      const { result } = await renderAndWait();

      act(() => {
        result.current.trading.buyShares('allen', 10);
      });
      const priceAfterBuy = result.current.trading.getEffectivePrice('allen');

      act(() => {
        result.current.trading.sellShares('allen', 4);
      });
      const priceAfterSell = result.current.trading.getEffectivePrice('allen');

      // Price should have decreased after selling (impact reduced)
      expect(priceAfterSell).toBeLessThan(priceAfterBuy);
    });

    // TC-023
    it('returns false when insufficient shares', async () => {
      const { result } = await renderAndWait();

      act(() => {
        result.current.trading.buyShares('allen', 2);
      });

      const cashBefore = result.current.trading.cash;
      let success: boolean | undefined;
      act(() => {
        success = result.current.trading.sellShares('allen', 5);
      });

      expect(success).toBe(false);
      expect(result.current.trading.cash).toBe(cashBefore);
      expect(result.current.trading.portfolio.allen.shares).toBe(2);
    });

    // TC-024
    it('returns false when player not in portfolio', async () => {
      const { result } = await renderAndWait();

      const cashBefore = result.current.trading.cash;
      let success: boolean | undefined;
      act(() => {
        success = result.current.trading.sellShares('nonexistent', 1);
      });

      expect(success).toBe(false);
      expect(result.current.trading.cash).toBe(cashBefore);
    });
  });

  describe('scenario reset', () => {
    // TC-011
    it('portfolio resets to startingPortfolio on scenarioVersion change', async () => {
      const { result } = await renderAndWait();

      act(() => {
        result.current.trading.buyShares('allen', 5);
      });
      expect(result.current.trading.portfolio).toHaveProperty('allen');

      act(() => {
        result.current.scenario.setScenario('playoffs');
      });

      await waitFor(() => {
        expect(result.current.scenario.scenarioLoading).toBe(false);
      });

      // allen was not in startingPortfolio so it should be gone
      expect(result.current.trading.portfolio).not.toHaveProperty('allen');
    });

    // TC-012
    it('cash resets to INITIAL_CASH on scenarioVersion change', async () => {
      const { result } = await renderAndWait();

      act(() => {
        result.current.trading.buyShares('allen', 5);
      });
      expect(result.current.trading.cash).toBeLessThan(INITIAL_CASH);

      act(() => {
        result.current.scenario.setScenario('playoffs');
      });

      await waitFor(() => {
        expect(result.current.scenario.scenarioLoading).toBe(false);
      });

      expect(result.current.trading.cash).toBe(INITIAL_CASH);
    });

    // TC-013
    it('userImpact cleared on scenarioVersion change', async () => {
      const { result } = await renderAndWait();

      const basePriceBefore = result.current.trading.getEffectivePrice('allen');

      act(() => {
        result.current.trading.buyShares('allen', 10);
      });

      const priceWithImpact = result.current.trading.getEffectivePrice('allen');
      expect(priceWithImpact).toBeGreaterThan(basePriceBefore);

      // Switch to the same scenario — version increments, triggering reset
      act(() => {
        result.current.scenario.setScenario('midweek');
      });

      await waitFor(() => {
        expect(result.current.scenario.scenarioLoading).toBe(false);
      });

      const priceAfterReset =
        result.current.trading.getEffectivePrice('allen');
      expect(priceAfterReset).toBe(basePriceBefore);
    });
  });

  describe('getPlayer', () => {
    // TC-042
    it('returns enriched player data with all computed fields', async () => {
      const { result } = await renderAndWait();
      const player = result.current.trading.getPlayer('mahomes');

      expect(player).not.toBeNull();
      expect(typeof player!.currentPrice).toBe('number');
      expect(typeof player!.changePercent).toBe('number');
      expect(typeof player!.priceChange).toBe('number');
      expect(typeof player!.moveReason).toBe('string');
      expect(Array.isArray(player!.contentTiles)).toBe(true);
      expect(Array.isArray(player!.allContent)).toBe(true);
      expect(player!.priceHistory).toBeDefined();
    });

    it('currentPrice matches getEffectivePrice', async () => {
      const { result } = await renderAndWait();
      const player = result.current.trading.getPlayer('mahomes');
      const effectivePrice = result.current.trading.getEffectivePrice('mahomes');

      expect(player!.currentPrice).toBe(effectivePrice);
    });

    it('changePercent is computed from basePrice', async () => {
      const { result } = await renderAndWait();
      const player = result.current.trading.getPlayer('mahomes');
      const effectivePrice = result.current.trading.getEffectivePrice('mahomes');
      const expected = +((effectivePrice - player!.basePrice) / player!.basePrice * 100).toFixed(2);

      expect(player!.changePercent).toBe(expected);
    });

    it('returns null for unknown player ID', async () => {
      const { result } = await renderAndWait();
      expect(result.current.trading.getPlayer('nonexistent_id')).toBeNull();
    });
  });

  describe('getPlayers', () => {
    // TC-043
    it('returns all players with enriched data', async () => {
      const { result } = await renderAndWait();
      const players = result.current.trading.getPlayers();
      const scenarioPlayers = result.current.scenario.players;

      expect(players.length).toBe(scenarioPlayers.length);

      players.forEach((p) => {
        expect(typeof p.currentPrice).toBe('number');
        expect(typeof p.changePercent).toBe('number');
        expect(typeof p.priceChange).toBe('number');
        expect(typeof p.moveReason).toBe('string');
        expect(Array.isArray(p.contentTiles)).toBe(true);
      });
    });
  });

  describe('getPortfolioValue', () => {
    // TC-025
    it('returns correct value, cost, gain, and gainPercent', async () => {
      // Set up a controlled portfolio
      write(STORAGE_KEYS.portfolio, {
        mahomes: { shares: 10, avgCost: 40 },
        allen: { shares: 5, avgCost: 60 },
      });

      const { result } = await renderAndWait();

      const mahomesPrice =
        result.current.trading.getEffectivePrice('mahomes');
      const allenPrice = result.current.trading.getEffectivePrice('allen');

      const expectedValue = +(mahomesPrice * 10 + allenPrice * 5).toFixed(2);
      const expectedCost = +(40 * 10 + 60 * 5).toFixed(2);
      const expectedGain = +(expectedValue - expectedCost).toFixed(2);
      const expectedGainPercent =
        expectedCost > 0
          ? +(((expectedValue - expectedCost) / expectedCost) * 100).toFixed(2)
          : 0;

      const pv = result.current.trading.getPortfolioValue();
      expect(pv.value).toBe(expectedValue);
      expect(pv.cost).toBe(expectedCost);
      expect(pv.gain).toBe(expectedGain);
      expect(pv.gainPercent).toBe(expectedGainPercent);
    });

    // TC-026
    it('returns zeroes for empty portfolio', async () => {
      write(STORAGE_KEYS.portfolio, {});
      write(STORAGE_KEYS.cash, INITIAL_CASH);

      const { result } = await renderAndWait();

      // Wait for startingPortfolio to be applied (since portfolio is empty)
      // The midweek scenario applies startingPortfolio, so sell everything
      const portfolio = result.current.trading.portfolio;
      for (const [playerId, holding] of Object.entries(portfolio)) {
        act(() => {
          result.current.trading.sellShares(playerId, holding.shares);
        });
      }

      const pv = result.current.trading.getPortfolioValue();
      expect(pv.value).toBe(0);
      expect(pv.cost).toBe(0);
      expect(pv.gain).toBe(0);
      expect(pv.gainPercent).toBe(0);
    });

    // TC-027
    it('getPortfolioValue is memoized with useCallback', async () => {
      write(STORAGE_KEYS.portfolio, { mahomes: { shares: 1, avgCost: 100 } });
      const { result, rerender } = await renderAndWait();

      const ref1 = result.current.trading.getPortfolioValue;
      rerender();
      const ref2 = result.current.trading.getPortfolioValue;
      expect(ref2).toBe(ref1);
    });
  });

  describe('ESPN live mode enrichment', () => {
    const espnArticle = {
      id: 'art-mahomes-espn',
      headline: 'Patrick Mahomes throws 4 touchdowns in dominant win',
      description: 'Mahomes leads team to a dominant victory',
      published: new Date().toISOString(),
      url: 'https://example.com',
      images: [],
      thumbnail: null,
      source: 'ESPN NFL',
      type: 'news',
      premium: false,
      categories: [],
    };

    it('getPlayer uses ESPN price history when in espn-live mode', async () => {
      mockFetchNFLNews.mockResolvedValue([espnArticle]);

      const { result } = await renderAndWait();

      act(() => {
        result.current.scenario.setScenario('espn-live');
      });

      await waitFor(() => {
        expect(result.current.scenario.scenarioLoading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.espn.espnLoading).toBe(false);
      });

      await waitFor(() => {
        expect(Object.keys(result.current.espn.espnPriceHistory).length).toBeGreaterThan(0);
      });

      const player = result.current.trading.getPlayer('mahomes');
      expect(player).not.toBeNull();
      expect(typeof player!.currentPrice).toBe('number');
      expect(typeof player!.moveReason).toBe('string');
      expect(Array.isArray(player!.contentTiles)).toBe(true);
      expect(Array.isArray(player!.allContent)).toBe(true);
      expect(Array.isArray(player!.priceHistory)).toBe(true);
      expect(player!.priceHistory!.length).toBeGreaterThan(0);
    });

    it('getPlayers uses ESPN price history when in espn-live mode', async () => {
      mockFetchNFLNews.mockResolvedValue([
        { ...espnArticle, id: 'art-mahomes-espn-2' },
      ]);

      const { result } = await renderAndWait();

      act(() => {
        result.current.scenario.setScenario('espn-live');
      });

      await waitFor(() => {
        expect(result.current.scenario.scenarioLoading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.espn.espnLoading).toBe(false);
      });

      await waitFor(() => {
        expect(Object.keys(result.current.espn.espnPriceHistory).length).toBeGreaterThan(0);
      });

      const players = result.current.trading.getPlayers();
      expect(players.length).toBeGreaterThan(0);

      const mahomes = players.find((p) => p.id === 'mahomes');
      expect(mahomes).toBeDefined();
      expect(typeof mahomes!.currentPrice).toBe('number');
      expect(typeof mahomes!.changePercent).toBe('number');
      expect(typeof mahomes!.moveReason).toBe('string');
      expect(Array.isArray(mahomes!.contentTiles)).toBe(true);
    });
  });
});
