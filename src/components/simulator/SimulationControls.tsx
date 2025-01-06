import React from 'react';
import { Play, Pause, RotateCcw, FastForward } from 'lucide-react';
import { useSimulatorStore } from '../../store/simulationStore';

export function SimulationControls() {
  const { isPlaying, speed, setPlaying, setSpeed, reset } = useSimulatorStore();

  return (
    <div className="flex items-center space-x-4 bg-white p-4 rounded-lg shadow">
      <button
        onClick={() => setPlaying(!isPlaying)}
        className="p-2 rounded-full hover:bg-gray-100"
      >
        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
      </button>

      <button
        onClick={reset}
        className="p-2 rounded-full hover:bg-gray-100"
      >
        <RotateCcw size={20} />
      </button>

      <div className="flex items-center space-x-2">
        <FastForward size={16} />
        <select
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value) as 1 | 2 | 4)}
          className="border rounded px-2 py-1"
        >
          <option value={1}>1x</option>
          <option value={2}>2x</option>
          <option value={4}>4x</option>
        </select>
      </div>
    </div>
  );
}