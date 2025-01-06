import { Stock } from '../../types/stock';
import { TradingDecision, StrategyType } from '../../types/trading';

export abstract class BaseStrategy {
  protected maxPositionSize: number;
  protected minStockPrice: number;

  constructor() {
    this.maxPositionSize = 0.1; // 10% of portfolio
    this.minStockPrice = 5; // No penny stocks
  }

  abstract analyze(
    stock: Stock,
    portfolioValue: number,
    currentHoldings: number
  ): TradingDecision;

  protected validateStock(stock: Stock): boolean {
    return stock.price >= this.minStockPrice;
  }

  protected calculateMaxShares(portfolioValue: number, stockPrice: number): number {
    const maxInvestment = portfolioValue * this.maxPositionSize;
    return Math.floor(maxInvestment / stockPrice);
  }
}