import React, { useRef, useState } from 'react';
import { useSimStore } from '../state/simStore';
import {
  saveSnapshot as persistSaveSnapshot,
  loadSnapshot as persistLoadSnapshot,
  exportSnapshotFile,
  importSnapshotFile,
} from '../state/persistence';

export const DevToolsPanel: React.FC = () => {
  const [seedInput, setSeedInput] = useState('1337');
  const fileRef = useRef<HTMLInputElement | null>(null);
  const store = useSimStore();

  const handleNewSeed = () => {
    const seed = Number(seedInput) || 1337;
    store.reset(seed);
  };

  const handleSave = () => {
    const snap = store.getSnapshot();
    persistSaveSnapshot(snap);
  };

  const handleExport = () => {
    const snap = store.getSnapshot();
    exportSnapshotFile(snap);
  };

  const handleLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const snap = await importSnapshotFile(file);
      store.loadSnapshot(snap);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to import snapshot', err);
    }
  };

  const handleLoadFromStorage = () => {
    const snap = persistLoadSnapshot();
    if (!snap) return;
    store.loadSnapshot(snap);
  };

  const handleStep = () => {
    store.stepOnce();
  };

  return (
    <div style={{ padding: 8, background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
      <h3>Dev Tools (dev only)</h3>
      <div style={{ marginBottom: 8 }}>
        <label>
          Seed:
          <input
            value={seedInput}
            onChange={(e) => setSeedInput(e.target.value)}
            style={{ marginLeft: 8, width: 120 }}
          />
        </label>
        <button type="button" onClick={handleNewSeed} style={{ marginLeft: 8 }}>
          New Seed
        </button>
      </div>

      <div style={{ marginBottom: 8 }}>
        <button type="button" onClick={handleSave}>
          Save Snapshot
        </button>
        <button type="button" onClick={handleLoadFromStorage} style={{ marginLeft: 8 }}>
          Load Snapshot (localStorage)
        </button>
        <button type="button" onClick={handleExport} style={{ marginLeft: 8 }}>
          Export Snapshot
        </button>
      </div>

      <div style={{ marginBottom: 8 }}>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          onChange={handleLoad}
          style={{ display: 'inline-block' }}
        />
      </div>

      <div>
        <button type="button" onClick={handleStep}>
          Step Tick
        </button>
      </div>
    </div>
  );
};

export default DevToolsPanel;
