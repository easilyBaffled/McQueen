import React, { useState } from 'react';
import { Header } from './components/Header';
import { StockCard } from './components/StockCard';
import { Portfolio } from './components/Portfolio';
import { TradeModal } from './components/TradeModal';
import { DebugControls } from './components/debug/DebugControls';
import { LeaguePortfolios } from './components/league/LeaguePortfolios';
import { useStockStore } from './store/stockStore';
import { useDebugInterval } from './hooks/useDebugInterval';
import { Stock } from './types/stock';

export default function App() {
  const { stocks, updateStockPrices, updateInterval } = useStockStore();
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

  useDebugInterval(updateStockPrices, updateInterval);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <LeaguePortfolios />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold mb-4">Market Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stocks.map((stock) => (
                <StockCard
                  key={stock.id}
                  stock={stock}
                  onSelect={setSelectedStock}
                />
              ))}
            </div>
          </div>
          
          <div>
            <Portfolio />
          </div>
        </div>
      </main>

      {selectedStock && (
        <TradeModal
          stock={selectedStock}
          onClose={() => setSelectedStock(null)}
        />
      )}
      
      <DebugControls />
    </div>
  );
}