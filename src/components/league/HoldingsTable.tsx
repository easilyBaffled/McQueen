import React from 'react';
import { MemberHolding } from '../../types/league';
import { formatCurrency } from '../../lib/utils';

interface HoldingsTableProps {
  holdings: MemberHolding[];
}

export function HoldingsTable({ holdings }: HoldingsTableProps) {
  if (holdings.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-4">
        No holdings yet
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="pb-2">Symbol</th>
            <th className="pb-2">Shares</th>
            <th className="pb-2">Avg Price</th>
            <th className="pb-2">Value</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map(holding => (
            <tr key={holding.stockId} className="border-b last:border-0">
              <td className="py-2 font-medium">{holding.stockId}</td>
              <td className="py-2">{holding.quantity}</td>
              <td className="py-2">{formatCurrency(holding.averagePrice)}</td>
              <td className="py-2">{formatCurrency(holding.currentValue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}