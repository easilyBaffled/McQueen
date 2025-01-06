import { Stock } from '../../types/stock';

interface ValueMetrics {
  isUndervalued: boolean;
  isOvervalued: boolean;
  peRatio: number;
  priceToBook: number;
}

export function calculateValueMetrics(stock: Stock): ValueMetrics {
  // In a real system, these would come from financial data
  const peRatio = calculatePERatio(stock);
  const priceToBook = calculatePriceToBook(stock);
  
  return {
    isUndervalued: peRatio < 15 && priceToBook < 1.5,
    isOvervalued: peRatio > 25 || priceToBook > 3,
    peRatio,
    priceToBook
  };
}

function calculatePERatio(stock: Stock): number {
  // Simplified P/E calculation
  const earnings = stock.price * 0.05; // Mock earnings data
  return stock.price / earnings;
}

function calculatePriceToBook(stock: Stock): number {
  // Simplified P/B calculation
  const bookValue = stock.price * 0.7; // Mock book value
  return stock.price / bookValue;
}