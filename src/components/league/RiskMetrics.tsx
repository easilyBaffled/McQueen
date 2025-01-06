import React from 'react';
import { useLeagueStore } from '../../store/leagueStore';

interface RiskMetricsProps {
  memberId: string;
}

export function RiskMetrics({ memberId }: RiskMetricsProps) {
  const metrics = useLeagueStore(state => 
    state.members.find(m => m.id === memberId)?.riskMetrics
  );

  if (!metrics) return null;

  return (
    <div className="mt-6 pt-6 border-t">
      <h4 className="text-sm font-semibold mb-4">Risk Metrics</h4>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-500">Beta</div>
          <div className="font-medium">{metrics.beta.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-gray-500">Sharpe Ratio</div>
          <div className="font-medium">{metrics.sharpeRatio.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}