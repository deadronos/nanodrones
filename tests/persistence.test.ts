import { describe, it, expect, beforeEach } from 'vitest';
import { createInitialState } from '../src/state/initialState';
import { saveSnapshot, loadSnapshot, importSnapshotFile } from '../src/state/persistence';

const STORAGE_KEY = 'nano-drones-save';

describe('persistence helpers', () => {
  beforeEach(() => {
    window.localStorage.removeItem(STORAGE_KEY);
  });

  it('save and load snapshot roundtrip', () => {
    const state = createInitialState(4242);
    const snapshot = { version: 2, createdAt: new Date().toISOString(), state };
    saveSnapshot(snapshot);
    const loaded = loadSnapshot();
    expect(loaded).not.toBeNull();
    if (!loaded) return;
    expect(loaded.state.seed).toEqual(snapshot.state.seed);
    expect(loaded.state.tick).toEqual(snapshot.state.tick);
  });

  it('handles localStorage quota errors without throwing', () => {
    const orig = window.localStorage.setItem;
    window.localStorage.setItem = () => {
      throw new Error('quota');
    };
    const state = createInitialState(1);
    const snapshot = { version: 2, createdAt: new Date().toISOString(), state };
    expect(() => saveSnapshot(snapshot)).not.toThrow();
    // restore
    // @ts-ignore
    window.localStorage.setItem = orig;
  });

  it('imports snapshot file (basic flow)', async () => {
    const state = createInitialState(7);
    const payload = { version: 2, createdAt: new Date().toISOString(), state };
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    // create a File-like object
    const file = new File([blob], 'test.json', { type: 'application/json' });
    const imported = await importSnapshotFile(file);
    expect(imported.state.seed).toEqual(state.seed);
  });
});
