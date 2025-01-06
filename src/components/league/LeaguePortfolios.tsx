import React from 'react';
import { Users } from 'lucide-react';
import { MemberPortfolio } from './MemberPortfolio';
import { useLeagueStore } from '../../store/leagueStore';

export function LeaguePortfolios() {
  const members = useLeagueStore(state => state.members);

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-6 h-6 text-blue-500" />
        <h2 className="text-2xl font-bold">League Portfolios</h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {members.map(member => (
          <MemberPortfolio key={member.id} member={member} />
        ))}
      </div>
    </section>
  );
}