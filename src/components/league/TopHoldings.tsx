import React from 'react';
import { MemberHolding } from '../../types/league';
import { formatCurrency } from '../../lib/utils';
import { useStockStore } from '../../store/stockStore';

interface TopHoldingsProps {
  holdings: MemberHolding[];
}

export function TopHoldings({ holdings }: TopHoldingsProps) {
  const stocks = useStockStore(state => state.stocks);

  return (
    <div>
      <div className="text-sm text-gray-500 mb-2">Top Holdings</div>
      <div className="space-y-2">
        {holdings.map(holding => {
          const stock = stocks.find(s => s.id === holding.stockId);
          if (!stock) return null;

          return (
            <div key={holding.stockId} className="flex justify-between items-center">
              <div className="flex items-center">
                <span className="font-medium">{stock.symbol}</span>
                <span className="text-sm text-gray-500 ml-2">
                  {holding.quantity} shares
                </span>
              </div>
              <span className="font-medium">
                {formatCurrency(holding.currentValue)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}