import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { LeagueMember } from '../../types/league';
import { formatCurrency, formatPercentage } from '../../lib/utils';
import { TopHoldings } from './TopHoldings';

interface MemberCardProps {
  member: LeagueMember;
}

export function MemberCard({ member }: MemberCardProps) {
  const performanceChange = ((member.portfolioValue - member.previousDayValue) / member.previousDayValue) * 100;
  const isPositive = performanceChange >= 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100">
      <div className="flex items-center gap-4 mb-4">
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

      <div className="space-y-3">
        <div>
          <div className="text-sm text-gray-500">Portfolio Value</div>
          <div className="text-xl font-bold">{formatCurrency(member.portfolioValue)}</div>
        </div>

        <div className="flex items-center">
          <div className={`flex items-center ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span className="ml-1 font-semibold">
              {formatPercentage(performanceChange)}
            </span>
          </div>
          <span className="text-sm text-gray-500 ml-2">24h</span>
        </div>

        <TopHoldings holdings={member.holdings.slice(0, 3)} />
      </div>
    </div>
  );
}