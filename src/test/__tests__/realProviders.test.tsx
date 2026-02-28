import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../renderWithProviders';
import { useTrading } from '../../context/TradingContext';
import { useSocial } from '../../context/SocialContext';
import { useScenario } from '../../context/ScenarioContext';
import { useState } from 'react';

beforeEach(() => {
  const keys = Object.keys(localStorage).filter((k) => k.startsWith('mcqueen'));
  keys.forEach((k) => localStorage.removeItem(k));
});

/* ── Test consumer components ─────────────────────────────────── */

function FullContextConsumer() {
  const { scenario, players, currentData } = useScenario();
  const { cash, portfolio, getEffectivePrice, getPlayer, getPortfolioValue } = useTrading();
  const { watchlist, isWatching, missionPicks } = useSocial();

  const mahomesPrice = getEffectivePrice('mahomes');
  const mahomesPlayer = getPlayer('mahomes');
  const portfolioValue = getPortfolioValue();

  return (
    <div>
      <span data-testid="scenario">{scenario}</span>
      <span data-testid="player-count">{players.length}</span>
      <span data-testid="has-data">{String(currentData !== null)}</span>
      <span data-testid="cash">{cash}</span>
      <span data-testid="portfolio">{JSON.stringify(portfolio)}</span>
      <span data-testid="mahomes-price">{mahomesPrice}</span>
      <span data-testid="mahomes-name">{mahomesPlayer?.name ?? 'null'}</span>
      <span data-testid="mahomes-change">{mahomesPlayer?.changePercent ?? 'null'}</span>
      <span data-testid="portfolio-value">{portfolioValue.value}</span>
      <span data-testid="portfolio-cost">{portfolioValue.cost}</span>
      <span data-testid="portfolio-gain">{portfolioValue.gain}</span>
      <span data-testid="watchlist-length">{watchlist.length}</span>
      <span data-testid="watching-mahomes">{String(isWatching('mahomes'))}</span>
      <span data-testid="mission-risers">{missionPicks.risers.length}</span>
    </div>
  );
}

function TradingConsumer() {
  const { cash, portfolio, buyShares, sellShares, getEffectivePrice, getPortfolioValue } = useTrading();
  const [lastResult, setLastResult] = useState<string>('');

  const handleBuy = (playerId: string, shares: number) => {
    const result = buyShares(playerId, shares);
    setLastResult(String(result));
  };

  const handleSell = (playerId: string, shares: number) => {
    const result = sellShares(playerId, shares);
    setLastResult(String(result));
  };

  const pv = getPortfolioValue();
  const mahomesPrice = getEffectivePrice('mahomes');

  return (
    <div>
      <span data-testid="cash">{cash}</span>
      <span data-testid="portfolio">{JSON.stringify(portfolio)}</span>
      <span data-testid="last-result">{lastResult}</span>
      <span data-testid="pv-value">{pv.value}</span>
      <span data-testid="pv-cost">{pv.cost}</span>
      <span data-testid="pv-gain">{pv.gain}</span>
      <span data-testid="pv-gain-percent">{pv.gainPercent}</span>
      <span data-testid="mahomes-price">{mahomesPrice}</span>
      <button data-testid="buy-mahomes-2" onClick={() => handleBuy('mahomes', 2)}>Buy 2 Mahomes</button>
      <button data-testid="buy-mahomes-999999" onClick={() => handleBuy('mahomes', 999999)}>Buy 999999</button>
      <button data-testid="sell-mahomes-1" onClick={() => handleSell('mahomes', 1)}>Sell 1 Mahomes</button>
      <button data-testid="sell-unknown-1" onClick={() => handleSell('nobody', 1)}>Sell unknown</button>
      <button data-testid="buy-zero" onClick={() => handleBuy('mahomes', 0)}>Buy 0</button>
    </div>
  );
}

function SocialConsumer() {
  const { watchlist, isWatching, addToWatchlist, removeFromWatchlist, missionPicks, setMissionPick } = useSocial();

  return (
    <div>
      <span data-testid="watchlist">{JSON.stringify(watchlist)}</span>
      <span data-testid="watching-mahomes">{String(isWatching('mahomes'))}</span>
      <span data-testid="mission-risers">{JSON.stringify(missionPicks.risers)}</span>
      <button data-testid="add-mahomes" onClick={() => addToWatchlist('mahomes')}>Add</button>
      <button data-testid="remove-mahomes" onClick={() => removeFromWatchlist('mahomes')}>Remove</button>
      <button data-testid="pick-riser" onClick={() => setMissionPick('mahomes', 'riser')}>Pick riser</button>
    </div>
  );
}

/* ── TC-001: Full provider tree renders with real data ────────── */

describe('TC-001: useRealProviders wraps in full provider tree', () => {
  it('renders without errors and receives real context values', () => {
    renderWithProviders(<FullContextConsumer />, { useRealProviders: true });

    expect(screen.getByTestId('scenario')).toHaveTextContent('midweek');
    expect(screen.getByTestId('has-data')).toHaveTextContent('true');
    expect(screen.getByTestId('player-count')).toHaveTextContent('3');
    expect(screen.getByTestId('cash')).toHaveTextContent('10000');
  });

  it('getEffectivePrice returns real price from scenario data', () => {
    renderWithProviders(<FullContextConsumer />, { useRealProviders: true });

    const price = Number(screen.getByTestId('mahomes-price').textContent);
    expect(price).toBe(52);
  });

  it('getPlayer returns enriched player with computed fields', () => {
    renderWithProviders(<FullContextConsumer />, { useRealProviders: true });

    expect(screen.getByTestId('mahomes-name')).toHaveTextContent('Patrick Mahomes');
    const change = Number(screen.getByTestId('mahomes-change').textContent);
    expect(change).toBe(4);
  });

  it('portfolio is an object (empty initially), not a vi.fn() stub', () => {
    renderWithProviders(<FullContextConsumer />, { useRealProviders: true });

    const portfolio = JSON.parse(screen.getByTestId('portfolio').textContent!);
    expect(typeof portfolio).toBe('object');
    expect(Object.keys(portfolio)).toHaveLength(0);
  });
});

/* ── TC-002: Default mock mode still works ────────────────────── */

describe('TC-002: default mock mode unchanged', () => {
  it('default mode provides vi.fn() stubs', () => {
    renderWithProviders(<FullContextConsumer />);

    expect(screen.getByTestId('scenario')).toHaveTextContent('midweek');
    expect(screen.getByTestId('cash')).toHaveTextContent('10000');
    expect(screen.getByTestId('mahomes-price')).toHaveTextContent('0');
    expect(screen.getByTestId('player-count')).toHaveTextContent('0');
  });

  it('useRealProviders: false behaves same as omitting', () => {
    renderWithProviders(<FullContextConsumer />, { useRealProviders: false });

    expect(screen.getByTestId('mahomes-price')).toHaveTextContent('0');
  });

  it('overrides still work in mock mode', () => {
    renderWithProviders(<FullContextConsumer />, {
      tradingOverrides: { cash: 500 },
    });
    expect(screen.getByTestId('cash')).toHaveTextContent('500');
  });
});

/* ── TC-004: Real providers perform actual portfolio calculations ─ */

describe('TC-004: real providers — trading operations', () => {
  it('buyShares deducts cash and updates portfolio', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TradingConsumer />, { useRealProviders: true });

    expect(screen.getByTestId('cash')).toHaveTextContent('10000');
    const price = Number(screen.getByTestId('mahomes-price').textContent);
    expect(price).toBe(52);

    await user.click(screen.getByTestId('buy-mahomes-2'));

    expect(screen.getByTestId('last-result')).toHaveTextContent('true');

    const newCash = Number(screen.getByTestId('cash').textContent);
    expect(newCash).toBe(10000 - 2 * price);

    const portfolio = JSON.parse(screen.getByTestId('portfolio').textContent!);
    expect(portfolio.mahomes.shares).toBe(2);
  });

  it('getPortfolioValue returns computed values after buy', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TradingConsumer />, { useRealProviders: true });

    await user.click(screen.getByTestId('buy-mahomes-2'));

    const pvValue = Number(screen.getByTestId('pv-value').textContent);
    expect(pvValue).toBeGreaterThan(0);
    expect(pvValue).toBeCloseTo(2 * 52, 0);
  });
});

/* ── TC-005: Real providers resolve prices from scenario data ──── */

describe('TC-005: price resolution with real providers', () => {
  it('getEffectivePrice returns last priceHistory entry', () => {
    renderWithProviders(<FullContextConsumer />, { useRealProviders: true });
    expect(Number(screen.getByTestId('mahomes-price').textContent)).toBe(52);
  });
});

/* ── TC-020: Trading guard rails with real providers ──────────── */

describe('TC-020: trading rejects invalid operations', () => {
  it('rejects buying more shares than cash allows', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TradingConsumer />, { useRealProviders: true });

    await user.click(screen.getByTestId('buy-mahomes-999999'));

    expect(screen.getByTestId('last-result')).toHaveTextContent('false');
    expect(screen.getByTestId('cash')).toHaveTextContent('10000');
    expect(screen.getByTestId('portfolio')).toHaveTextContent('{}');
  });

  it('rejects selling shares not in portfolio', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TradingConsumer />, { useRealProviders: true });

    await user.click(screen.getByTestId('sell-unknown-1'));

    expect(screen.getByTestId('last-result')).toHaveTextContent('false');
  });

  it('buying 0 shares is a no-op (succeeds with zero cost)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TradingConsumer />, { useRealProviders: true });

    await user.click(screen.getByTestId('buy-zero'));

    expect(screen.getByTestId('cash')).toHaveTextContent('10000');
  });

  it('buying exactly affordable shares succeeds', async () => {
    const user = userEvent.setup();

    function MaxBuyConsumer() {
      const { cash, buyShares, getEffectivePrice } = useTrading();
      const [result, setResult] = useState('');
      const price = getEffectivePrice('mahomes');
      const maxShares = Math.floor(cash / price);

      return (
        <div>
          <span data-testid="cash">{cash}</span>
          <span data-testid="result">{result}</span>
          <button data-testid="buy-max" onClick={() => setResult(String(buyShares('mahomes', maxShares)))}>
            Buy max
          </button>
        </div>
      );
    }

    renderWithProviders(<MaxBuyConsumer />, { useRealProviders: true });
    await user.click(screen.getByTestId('buy-max'));

    expect(screen.getByTestId('result')).toHaveTextContent('true');
    const remainingCash = Number(screen.getByTestId('cash').textContent);
    expect(remainingCash).toBeLessThan(52);
    expect(remainingCash).toBeGreaterThanOrEqual(0);
  });
});

/* ── TC-021: Social context works with real providers ────────── */

describe('TC-021: social context with real providers', () => {
  it('addToWatchlist/removeFromWatchlist mutate state', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SocialConsumer />, { useRealProviders: true });

    expect(screen.getByTestId('watching-mahomes')).toHaveTextContent('false');

    await user.click(screen.getByTestId('add-mahomes'));
    expect(screen.getByTestId('watching-mahomes')).toHaveTextContent('true');

    const watchlist = JSON.parse(screen.getByTestId('watchlist').textContent!);
    expect(watchlist).toContain('mahomes');

    await user.click(screen.getByTestId('remove-mahomes'));
    expect(screen.getByTestId('watching-mahomes')).toHaveTextContent('false');
  });

  it('setMissionPick mutates mission picks', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SocialConsumer />, { useRealProviders: true });

    await user.click(screen.getByTestId('pick-riser'));

    const risers = JSON.parse(screen.getByTestId('mission-risers').textContent!);
    expect(risers).toContain('mahomes');
  });

  it('adding same player twice does not duplicate', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SocialConsumer />, { useRealProviders: true });

    await user.click(screen.getByTestId('add-mahomes'));
    await user.click(screen.getByTestId('add-mahomes'));

    const watchlist = JSON.parse(screen.getByTestId('watchlist').textContent!);
    expect(watchlist.filter((id: string) => id === 'mahomes')).toHaveLength(1);
  });
});

/* ── TC-024: Real-provider tests catch broken logic ──────────── */

describe('TC-024: integration tests detect broken logic', () => {
  it('portfolio value is non-zero after buying shares', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TradingConsumer />, { useRealProviders: true });

    expect(Number(screen.getByTestId('pv-value').textContent)).toBe(0);

    await user.click(screen.getByTestId('buy-mahomes-2'));

    const pvValue = Number(screen.getByTestId('pv-value').textContent);
    expect(pvValue).toBeGreaterThan(0);
    expect(pvValue).not.toBe(0);
  });

  it('effective price is non-zero for known player', () => {
    renderWithProviders(<TradingConsumer />, { useRealProviders: true });

    const price = Number(screen.getByTestId('mahomes-price').textContent);
    expect(price).toBeGreaterThan(0);
    expect(price).not.toBe(0);
  });
});
