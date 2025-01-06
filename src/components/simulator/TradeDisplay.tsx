import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useSimulatorStore } from '../../store/simulationStore';
import { formatCurrency } from '../../lib/utils';

export function TradeDisplay() {
  const { stockData, currentTrade } = useSimulatorStore();

  if (!stockData || !currentTrade) {
    return null;
  }

  const TrendIcon = {
    UP: TrendingUp,
    DOWN: TrendingDown,
    FLAT: Minus
  }[currentTrade.trend];

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{stockData.stockSymbol}</h2>
        <span className="text-sm text-gray-500">{currentTrade.timestamp}</span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="text-sm text-gray-500">Current Price</div>
          <div className="text-xl font-bold flex items-center gap-2">
            {formatCurrency(currentTrade.price)}
            <TrendIcon 
              size={20} 
              className={
                currentTrade.trend === 'UP' ? 'text-green-500' :
                currentTrade.trend === 'DOWN' ? 'text-red-500' :
                'text-gray-500'
              }
            />
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-500">Volume Traded</div>
          <div className="text-xl font-bold">
            {currentTrade.volumeTraded.toLocaleString()}
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-500">Total Volume</div>
          <div className="text-xl font-bold">
            {stockData.totalVolume.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}