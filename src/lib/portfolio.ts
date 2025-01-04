import { Portfolio, Stock } from '../types/stock';

export function calculatePortfolioValue(portfolio: Portfolio, stocks: Stock[]): number {
  return Object.entries(portfolio.stocks).reduce((total, [stockId, holding]) => {
    const stock = stocks.find(s => s.id === stockId);
    if (!stock || holding.quantity === 0) return total;
    return total + (stock.price * holding.quantity);
  }, 0);
}