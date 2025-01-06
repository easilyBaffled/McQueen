import { Stock } from '../types/stock';
import { BaseStrategy } from './strategies/baseStrategy';
import { ValueStrategy } from './strategies/valueStrategy';
import { MomentumStrategy } from './strategies/momentumStrategy';
import { TradingDecision, TradeExecution, StrategyType } from '../types/trading';
import { useStockStore } from '../store/stockStore';

export class AITrader {
  private strategy: BaseStrategy;
  private portfolioValue: number;
  private cash: number;
  private holdings: Map<string, number>;
  private strategyType: StrategyType;

  constructor(strategyType: StrategyType, initialCash: number = 100000) {
    this.strategyType = strategyType;
    this.strategy = this.initializeStrategy(strategyType);
    this.cash = initialCash;
    this.portfolioValue = initialCash;
    this.holdings = new Map();
  }

  private initializeStrategy(type: StrategyType): BaseStrategy {
    switch (type) {
      case 'value':
        return new ValueStrategy();
      case 'momentum':
        return new MomentumStrategy();
      default:
        return new ValueStrategy();
    }
  }

  public analyzeTradingOpportunity(stock: Stock): TradingDecision {
    const currentHoldings = this.holdings.get(stock.id) || 0;
    return this.strategy.analyze(stock, this.portfolioValue, currentHoldings);
  }

  public executeTrade(decision: TradingDecision, stock: Stock): TradeExecution | null {
    if (decision.action === 'hold' || !decision.quantity) return null;

    const total = stock.price * decision.quantity;
    
    if (decision.action === 'buy' && total > this.cash) {
      return null;
    }

    const execution: TradeExecution = {
      timestamp: Date.now(),
      stockId: stock.id,
      action: decision.action,
      quantity: decision.quantity,
      price: stock.price,
      total,
      strategyType: this.strategyType
    };

    this.updatePortfolio(execution);
    return execution;
  }

  private updatePortfolio(trade: TradeExecution): void {
    const currentHoldings = this.holdings.get(trade.stockId) || 0;

    if (trade.action === 'buy') {
      this.cash -= trade.total;
      this.holdings.set(trade.stockId, currentHoldings + trade.quantity);
    } else {
      this.cash += trade.total;
      this.holdings.set(trade.stockId, currentHoldings - trade.quantity);
    }

    this.updatePortfolioValue();
  }

  private updatePortfolioValue(): void {
    const stockStore = useStockStore.getState();
    let holdingsValue = 0;

    this.holdings.forEach((quantity, stockId) => {
      const stock = stockStore.stocks.find(s => s.id === stockId);
      if (stock) {
        holdingsValue += stock.price * quantity;
      }
    });

    this.portfolioValue = this.cash + holdingsValue;
  }
}