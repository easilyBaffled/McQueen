import React from 'react';
import { Wallet, TrendingUp } from 'lucide-react';
import { useStockStore } from '../store/stockStore';
import { formatCurrency } from '../lib/utils';
import { calculatePortfolioValue } from '../lib/portfolio';

export function Header() {
  const { walletBalance, updateInterval, setUpdateInterval, stocks, portfolio } = useStockStore();
  const portfolioValue = calculatePortfolioValue(portfolio, stocks);

  return (
    <header className="sticky top-0 bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold flex items-center">
              <TrendingUp className="mr-2" /> Stock Simulator
            </h1>
            <div className="flex items-center space-x-2">
              <Wallet className="text-blue-500" />
              <span className="font-semibold">{formatCurrency(walletBalance)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Portfolio Value:</span>
              <span className="font-semibold">{formatCurrency(portfolioValue)}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="text-sm text-gray-600">Update Interval:</label>
            <select
              value={updateInterval}
              onChange={(e) => setUpdateInterval(Number(e.target.value))}
              className="border rounded px-2 py-1"
            >
              <option value={1000}>1s</option>
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}