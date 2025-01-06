import React, { useEffect } from 'react';
import { SimulationControls } from './SimulationControls';
import { TradeDisplay } from './TradeDisplay';
import { useSimulatorStore } from '../../store/simulationStore';

export function Simulator() {
  const { isPlaying, speed, processNextTrade } = useSimulatorStore();

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      processNextTrade();
    }, 1000 / speed);

    return () => clearInterval(interval);
  }, [isPlaying, speed, processNextTrade]);

  return (
    <div className="space-y-4">
      <SimulationControls />
      <TradeDisplay />
    </div>
  );
}