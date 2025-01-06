import { BaseStrategy } from './baseStrategy';
import { Stock } from '../../types/stock';
import { TradingDecision } from '../../types/trading';
import { calculateMomentumSignals } from '../analysis/technical';

export class MomentumStrategy extends BaseStrategy {
  analyze(
    stock: Stock,
    portfolioValue: number,
    currentHoldings: number
  ): TradingDecision {
    if (!this.validateStock(stock)) {
      return { action: 'hold', reason: 'Stock does not meet minimum criteria' };
    }

    const signals = calculateMomentumSignals(stock);
    const maxShares = this.calculateMaxShares(portfolioValue, stock.price);

    if (signals.strongBuy && currentHoldings < maxShares) {
      return {
        action: 'buy',
        quantity: maxShares - currentHoldings,
        reason: 'Strong upward momentum detected'
      };
    }

    if (signals.strongSell && currentHoldings > 0) {
      return {
        action: 'sell',
        quantity: currentHoldings,
        reason: 'Strong downward momentum detected'
      };
    }

    return { action: 'hold', reason: 'No clear momentum signals' };
  }
}