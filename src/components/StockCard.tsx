import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Stock } from '../types/stock';
import { formatCurrency, formatPercentage } from '../lib/utils';
import { LineChart } from './LineChart';

interface StockCardProps {
  stock: Stock;
  onSelect: (stock: Stock) => void;
}

export function StockCard({ stock, onSelect }: StockCardProps) {
  const priceChange = stock.price - stock.previousPrice;
  const priceChangePercentage = (priceChange / stock.previousPrice) * 100;
  const isPositive = priceChange >= 0;

  return (
    <div 
      className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onSelect(stock)}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-lg">{stock.symbol}</h3>
          <p className="text-gray-600 text-sm">{stock.name}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg">{formatCurrency(stock.price)}</p>
          <div className={`flex items-center ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span className="ml-1 text-sm">
              {formatPercentage(priceChangePercentage)}
            </span>
          </div>
        </div>
      </div>

      <div className="h-20 mb-2">
        <LineChart 
          data={stock.priceHistory} 
          news={stock.news}
        />
      </div>

      <div className="flex justify-between text-sm text-gray-600">
        <span>Available: {stock.availableShares.toLocaleString()} shares</span>
        <span>Vol: {(stock.price * stock.availableShares).toLocaleString()}</span>
      </div>
    </div>
  );
}