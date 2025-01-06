import React from 'react';
import { Users } from 'lucide-react';
import { MemberCard } from './MemberCard';
import { useLeagueStore } from '../../store/leagueStore';

export function LeagueDashboard() {
  const members = useLeagueStore(state => state.members);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-6 h-6 text-blue-500" />
        <h2 className="text-2xl font-bold">League Dashboard</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map(member => (
          <MemberCard key={member.id} member={member} />
        ))}
      </div>
    </div>
  );
}