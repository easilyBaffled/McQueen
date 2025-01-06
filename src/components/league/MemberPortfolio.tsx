import React from 'react';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { LeagueMember } from '../../types/league';
import { formatCurrency, formatPercentage } from '../../lib/utils';
import { HoldingsTable } from './HoldingsTable';
import { RiskMetrics } from './RiskMetrics';

interface MemberPortfolioProps {
  member: LeagueMember;
}

export function MemberPortfolio({ member }: MemberPortfolioProps) {
  const performanceChange = ((member.portfolioValue - member.previousDayValue) / member.previousDayValue) * 100;
  const isPositive = performanceChange >= 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-4 mb-6">
        <img
          src={member.photoUrl}
          alt={member.username}
          className="w-12 h-12 rounded-full"
        />
        <div>
          <h3 className="font-bold text-lg">{member.username}</h3>
          <span className={`inline-block px-2 py-1 text-xs rounded-full ${
            member.algorithm === 'Conservative' ? 'bg-blue-100 text-blue-700' :
            member.algorithm === 'Aggressive' ? 'bg-red-100 text-red-700' :
            'bg-purple-100 text-purple-700'
          }`}>
            {member.algorithm}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <div className="text-sm text-gray-500">Portfolio Value</div>
          <div className="text-xl font-bold">{formatCurrency(member.portfolioValue)}</div>
        </div>
        
        <div>
          <div className="text-sm text-gray-500">Cash Balance</div>
          <div className="flex items-center gap-1">
            <Wallet size={16} className="text-gray-400" />
            <span className="text-xl font-bold">{formatCurrency(member.cashBalance)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <div className={`flex items-center ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          <span className="text-lg font-semibold ml-1">
            {formatPercentage(performanceChange)}
          </span>
        </div>
        <span className="text-sm text-gray-500">24h Change</span>
      </div>

      <HoldingsTable holdings={member.holdings} />
      <RiskMetrics memberId={member.id} />
    </div>
  );
}