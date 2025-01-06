import { BaseStrategy } from './baseStrategy';
import { Stock } from '../../types/stock';
import { TradingDecision } from '../../types/trading';
import { calculateValueMetrics } from '../analysis/fundamentals';

export class ValueStrategy extends BaseStrategy {
  analyze(
    stock: Stock,
    portfolioValue: number,
    currentHoldings: number
  ): TradingDecision {
    if (!this.validateStock(stock)) {
      return { action: 'hold', reason: 'Stock does not meet minimum criteria' };
    }

    const metrics = calculateValueMetrics(stock);
    const maxShares = this.calculateMaxShares(portfolioValue, stock.price);

    if (metrics.isUndervalued && currentHoldings < maxShares) {
      return {
        action: 'buy',
        quantity: maxShares - currentHoldings,
        reason: 'Stock appears undervalued'
      };
    }

    if (metrics.isOvervalued && currentHoldings > 0) {
      return {
        action: 'sell',
        quantity: currentHoldings,
        reason: 'Stock appears overvalued'
      };
    }

    return { action: 'hold', reason: 'No clear value opportunity' };
  }
}