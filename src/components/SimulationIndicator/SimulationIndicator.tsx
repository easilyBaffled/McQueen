import { useScenario } from '../../context/ScenarioContext';
import { useSimulation } from '../../context/SimulationContext';
import { isDevMode } from '../../utils/devMode';
import styles from './SimulationIndicator.module.css';

export default function SimulationIndicator() {
  const { scenario } = useScenario();
  const { isPlaying, setIsPlaying } = useSimulation();

  const isLiveScenario = scenario === 'live' || scenario === 'superbowl';
  if (!isLiveScenario || isDevMode()) return null;

  return (
    <div className={styles['simulation-indicator']} data-testid="simulation-indicator">
      <span className={styles['indicator-dot']} />
      <span className={styles['indicator-text']}>
        Simulation {isPlaying ? 'playing' : 'paused'}
      </span>
      <button
        className={styles['indicator-toggle']}
        onClick={() => setIsPlaying(!isPlaying)}
        aria-label={isPlaying ? 'Pause simulation' : 'Play simulation'}
      >
        {isPlaying ? (
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
    </div>
  );
}
