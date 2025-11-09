import './App.css';
import { PlayCanvasShell } from './pc/PlayCanvasShell';
import { DroneList } from './ui/DroneList';
import { OrderRadial } from './ui/OrderRadial';
import { DebugPanel } from './ui/DebugPanel';
import DevToolsPanel from './ui/DevToolsPanel';
import { useSimStore } from './state/simStore';
import { useState } from 'react';

function App() {
  const paused = useSimStore((s) => s.paused);
  const togglePause = useSimStore((s) => s.togglePause);
  const reset = useSimStore((s) => s.reset);
  const seed = useSimStore((s) => s.seed);
  const [showDev, setShowDev] = useState(false);

  return (
    <div className="app-root">
      <header className="hud">
        <div className="hud-info">
          <h1>Nano Drones Commander</h1>
          <p>Deterministic voxel sandbox with autonomous mining drones.</p>
        </div>
        <div className="hud-actions">
          <button type="button" onClick={togglePause}>
            {paused ? 'Resume' : 'Pause'} Sim
          </button>
          <button type="button" onClick={() => reset(seed)}>
            Reload Seed
          </button>
          {process.env.NODE_ENV !== 'production' && (
            <button type="button" onClick={() => setShowDev((s) => !s)} title="Dev Tools">
              ⚙
            </button>
          )}
        </div>
      </header>
      <main className="app-main">
        <div className="scene">
          <PlayCanvasShell />
        </div>
        <aside className="sidebar">
          <OrderRadial />
          <DroneList />
          <DebugPanel />
          {process.env.NODE_ENV !== 'production' && showDev && <DevToolsPanel />}
        </aside>
      </main>
    </div>
  );
}

export default App;
