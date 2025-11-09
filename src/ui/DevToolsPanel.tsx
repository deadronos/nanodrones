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
    <div className="devtools-panel panel">
      <h3 className="panel-title">Dev Tools (dev only)</h3>

      <div className="devtools-row">
        <label className="panel-label" htmlFor="dev-seed-input">
          Seed
        </label>
        <div>
          <input
            id="dev-seed-input"
            className="devtools-input"
            value={seedInput}
            onChange={(e) => setSeedInput(e.target.value)}
          />
          <button type="button" className="panel-button" onClick={handleNewSeed}>
            New Seed
          </button>
        </div>
      </div>

      <div className="devtools-row">
        <button type="button" className="panel-button" onClick={handleSave}>
          Save Snapshot
        </button>
        <button type="button" className="panel-button" onClick={handleLoadFromStorage}>
          Load Snapshot
        </button>
        <button type="button" className="panel-button" onClick={handleExport}>
          Export Snapshot
        </button>
      </div>

      <div className="devtools-row">
        <label className="panel-label" htmlFor="dev-file-input">
          Import File
        </label>
        <input id="dev-file-input" ref={fileRef} type="file" accept="application/json" onChange={handleLoad} />
      </div>

      <div className="devtools-row">
        <button type="button" className="panel-button" onClick={handleStep}>
          Step Tick
        </button>
      </div>
    </div>
  );
};

export default DevToolsPanel;
