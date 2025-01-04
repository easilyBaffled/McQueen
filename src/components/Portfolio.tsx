import React from 'react';
import { useStockStore } from '../store/stockStore';
import { formatCurrency } from '../lib/utils';

export function Portfolio() {
  const { portfolio, stocks } = useStockStore();

  const portfolioItems = Object.entries(portfolio.stocks).map(([stockId, holding]) => {
    const stock = stocks.find(s => s.id === stockId);
    if (!stock || holding.quantity === 0) return null;

    const currentValue = stock.price * holding.quantity;
    const profitLoss = currentValue - (holding.averagePrice * holding.quantity);
    const profitLossPercentage = (profitLoss / (holding.averagePrice * holding.quantity)) * 100;

    return (
      <div key={stockId} className="border-b last:border-b-0 py-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold">{stock.symbol}</h3>
            <p className="text-sm text-gray-600">{holding.quantity} shares</p>
          </div>
          <div className="text-right">
            <p className="font-semibold">{formatCurrency(currentValue)}</p>
            <p className={`text-sm ${profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency(profitLoss)} ({profitLossPercentage.toFixed(2)}%)
            </p>
          </div>
        </div>
      </div>
    );
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-bold mb-4">Portfolio</h2>
      <div className="divide-y">
        {portfolioItems}
      </div>
    </div>
  );
}