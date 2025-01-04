import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Stock } from '../types/stock';
import { useStockStore } from '../store/stockStore';
import { formatCurrency } from '../lib/utils';

interface TradeModalProps {
  stock: Stock;
  onClose: () => void;
}

export function TradeModal({ stock, onClose }: TradeModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [type, setType] = useState<'buy' | 'sell'>('buy');
  const { executeTrade, walletBalance } = useStockStore();

  const total = stock.price * quantity;
  const canAfford = type === 'sell' || total <= walletBalance;
  const hasEnoughShares = type === 'buy' || quantity <= (useStockStore.getState().portfolio.stocks[stock.id]?.quantity || 0);

  const handleTrade = () => {
    if (!canAfford || !hasEnoughShares) return;
    executeTrade(stock.id, type, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{type === 'buy' ? 'Buy' : 'Sell'} {stock.symbol}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between">
            <span>Current Price:</span>
            <span className="font-semibold">{formatCurrency(stock.price)}</span>
          </div>

          <div className="flex space-x-2">
            <button
              className={`flex-1 py-2 rounded ${type === 'buy' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setType('buy')}
            >
              Buy
            </button>
            <button
              className={`flex-1 py-2 rounded ${type === 'sell' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setType('sell')}
            >
              Sell
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>

          <div className="flex justify-between font-semibold">
            <span>Total:</span>
            <span>{formatCurrency(total)}</span>
          </div>

          {!canAfford && (
            <p className="text-red-500 text-sm">Insufficient funds</p>
          )}
          {!hasEnoughShares && type === 'sell' && (
            <p className="text-red-500 text-sm">Insufficient shares</p>
          )}

          <button
            onClick={handleTrade}
            disabled={!canAfford || !hasEnoughShares}
            className={`w-full py-2 rounded-md ${
              canAfford && hasEnoughShares
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Confirm {type === 'buy' ? 'Purchase' : 'Sale'}
          </button>
        </div>
      </div>
    </div>
  );
}