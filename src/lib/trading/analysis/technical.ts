import { Stock } from '../../types/stock';

interface MomentumSignals {
  strongBuy: boolean;
  strongSell: boolean;
  rsi: number;
  macdSignal: 'buy' | 'sell' | 'neutral';
}

export function calculateMomentumSignals(stock: Stock): MomentumSignals {
  const rsi = calculateRSI(stock.priceHistory);
  const macd = calculateMACD(stock.priceHistory);

  return {
    strongBuy: rsi < 30 && macd.signal === 'buy',
    strongSell: rsi > 70 && macd.signal === 'sell',
    rsi,
    macdSignal: macd.signal
  };
}

function calculateRSI(prices: number[], period: number = 14): number {
  // RSI calculation logic
  const gains = [];
  const losses = [];
  
  for (let i = 1; i < prices.length; i++) {
    const difference = prices[i] - prices[i - 1];
    gains.push(Math.max(difference, 0));
    losses.push(Math.max(-difference, 0));
  }

  const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
  
  const rs = avgGain / (avgLoss || 1);
  return 100 - (100 / (1 + rs));
}

function calculateMACD(prices: number[]): { signal: 'buy' | 'sell' | 'neutral' } {
  // MACD calculation logic
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine = ema12 - ema26;
  const signalLine = calculateEMA([macdLine], 9);

  if (macdLine > signalLine) return { signal: 'buy' };
  if (macdLine < signalLine) return { signal: 'sell' };
  return { signal: 'neutral' };
}

function calculateEMA(prices: number[], period: number): number {
  const multiplier = 2 / (period + 1);
  let ema = prices[0];

  for (let i = 1; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }

  return ema;
}