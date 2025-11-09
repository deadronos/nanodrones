import { describe, it, expect, beforeEach } from 'vitest';
import { createInitialState } from '../src/state/initialState';
import {
  saveSnapshot,
  loadSnapshot,
  importSnapshotFile,
  migrateSnapshot,
  CURRENT_VERSION,
} from '../src/state/persistence';

const STORAGE_KEY = 'nano-drones-save';

describe('persistence helpers', () => {
  beforeEach(() => {
    window.localStorage.removeItem(STORAGE_KEY);
  });

  it('save and load snapshot roundtrip', () => {
    const state = createInitialState(4242);
    const snapshot = { version: CURRENT_VERSION, createdAt: new Date().toISOString(), state };
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
    const snapshot = { version: CURRENT_VERSION, createdAt: new Date().toISOString(), state };
    expect(() => saveSnapshot(snapshot)).not.toThrow();
    // restore
    // @ts-ignore
    window.localStorage.setItem = orig;
  });

  it('imports snapshot file (basic flow)', async () => {
    const state = createInitialState(7);
    const payload = { version: CURRENT_VERSION, createdAt: new Date().toISOString(), state };
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    // create a File-like object
    const file = new File([blob], 'test.json', { type: 'application/json' });
    const imported = await importSnapshotFile(file);
    expect(imported.state.seed).toEqual(state.seed);
  });

  it('migrates legacy v2 snapshots', () => {
    const legacy = {
      version: 2,
      createdAt: new Date().toISOString(),
      state: {
        seed: 42,
        rngSeed: 99,
        tick: 5,
        world: {
          seed: 42,
          chunk: {
            size: 2,
            heightMap: [1, 2, 1, 2],
            resources: [false, true, false, false],
          },
        },
        player: { position: [1, 2, 3], yaw: 0, pitch: 0, velocity: [0, 0, 0] },
        drones: [],
        orders: [],
        orderCounter: 0,
      },
    };

    const migrated = migrateSnapshot(legacy);
    expect(migrated).not.toBeNull();
    if (!migrated) return;
    expect(migrated.state.player.position).toEqual([1, 2, 3]);
    expect(migrated.state.world.chunk.blocks.some((value) => value === 'resource')).toBeTruthy();
  });
});
