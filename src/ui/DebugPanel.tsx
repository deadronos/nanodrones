import type { FC } from 'react';
import { useSimStore } from '../state/simStore';

export const DebugPanel: FC = () => {
  const tick = useSimStore((s) => s.tick);
  const paused = useSimStore((s) => s.paused);
  const seed = useSimStore((s) => s.seed);
  const togglePause = useSimStore((s) => s.togglePause);
  const reset = useSimStore((s) => s.reset);

  return (
    <section className="panel">
      <h2 className="panel-title">Simulation</h2>
      <div className="panel-row">
        <span className="panel-label">Tick</span>
        <span className="panel-value">{tick}</span>
      </div>
      <div className="panel-row">
        <span className="panel-label">Seed</span>
        <span className="panel-value">{seed}</span>
      </div>
      <div className="panel-row">
        <span className="panel-label">Status</span>
        <span className="panel-value">{paused ? 'Paused' : 'Running'}</span>
      </div>
      <div className="panel-actions">
        <button type="button" className="panel-button" onClick={togglePause}>
          {paused ? 'Resume' : 'Pause'}
        </button>
        <button type="button" className="panel-button" onClick={() => reset(seed)}>
          Reset World
        </button>
      </div>
    </section>
  );
};
