import React from 'react';
import { Bug, Play, Pause, StepForward, X } from 'lucide-react';
import { useDebugStore } from '../../store/debugStore';
import { useStockStore } from '../../store/stockStore';
import { useSimulatorStore } from '../../store/simulationStore';
import { StateDisplay } from './StateDisplay';

export function DebugControls() {
  const { isDebugMode, isPaused, toggleDebugMode, togglePause } = useDebugStore();
  const { updateStockPrices } = useStockStore();
  const simulatorState = useSimulatorStore();

  if (!isDebugMode) {
    return (
      <button
        onClick={toggleDebugMode}
        className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700"
        title="Enable Debug Mode"
      >
        <Bug size={20} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg space-y-4 max-w-md">
      <div className="flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2">
          <Bug size={16} />
          Debug Controls
        </h3>
        <button
          onClick={toggleDebugMode}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={togglePause}
          className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {isPaused ? <Play size={16} /> : <Pause size={16} />}
          {isPaused ? 'Resume' : 'Pause'}
        </button>
        
        {isPaused && (
          <button
            onClick={() => {
              updateStockPrices();
              simulatorState.processNextTrade();
            }}
            className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
          >
            <StepForward size={16} />
            Step
          </button>
        )}
      </div>

      <div className="space-y-2 text-sm">
        <h4 className="font-semibold">Current State:</h4>
        <StateDisplay />
      </div>
    </div>
  );
}