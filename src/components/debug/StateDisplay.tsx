import React from 'react';
import { useStockStore } from '../../store/stockStore';
import { useSimulatorStore } from '../../store/simulationStore';
import { formatCurrency } from '../../lib/utils';

export function StateDisplay() {
  const { stocks, walletBalance, updateInterval } = useStockStore();
  const { currentTrade, currentIndex, speed } = useSimulatorStore();

  return (
    <div className="bg-gray-50 p-3 rounded text-xs font-mono">
      <div className="grid grid-cols-2 gap-2">
        <div>Update Interval:</div>
        <div>{updateInterval}ms</div>
        
        <div>Wallet Balance:</div>
        <div>{formatCurrency(walletBalance)}</div>
        
        <div>Simulation Speed:</div>
        <div>{speed}x</div>
        
        <div>Current Index:</div>
        <div>{currentIndex}</div>
        
        {currentTrade && (
          <>
            <div>Current Price:</div>
            <div>{formatCurrency(currentTrade.price)}</div>
            
            <div>Trade Time:</div>
            <div>{currentTrade.timestamp}</div>
          </>
        )}
      </div>

      <div className="mt-2 pt-2 border-t">
        <div className="font-semibold mb-1">Stock Prices:</div>
        {stocks.map(stock => (
          <div key={stock.id} className="flex justify-between">
            <span>{stock.symbol}:</span>
            <span>{formatCurrency(stock.price)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}