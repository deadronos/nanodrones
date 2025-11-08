import './App.css';
import { PlayCanvasShell } from './pc/PlayCanvasShell';

function App() {
  return (
    <div className="app-root">
      <div className="hud">
        <h1>Nano Drones Commander</h1>
        <p>Seeded voxel test scene with player + drones (scaffold).</p>
      </div>
      <div className="scene">
        <PlayCanvasShell />
      </div>
    </div>
  );
}

export default App;
