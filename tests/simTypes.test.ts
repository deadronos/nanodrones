import { describe, it, expect } from 'vitest';
import { validateSnapshotShape } from '../src/state/simTypes';

describe('Snapshot shape validator', () => {
  it('accepts a valid snapshot object', () => {
    const snapshot = {
      version: 2,
      createdAt: new Date().toISOString(),
      state: {
        seed: 123,
        rngSeed: 456,
        tick: 0,
        world: { seed: 123, chunk: { size: 16, heightMap: [], resources: [] } },
        player: { position: [0, 0, 0], yaw: 0, pitch: 0, velocity: [0, 0, 0] },
        drones: [
          {
            id: 'drone-1',
            position: [0, 0, 0],
            velocity: [0, 0, 0],
            battery: 1,
            carrying: 0,
            activity: 'idle',
            task: null,
          },
        ],
        orders: [],
        orderCounter: 0,
      },
    };

    expect(validateSnapshotShape(snapshot)).toBe(true);
  });

  it('rejects invalid or missing fields', () => {
    expect(validateSnapshotShape({})).toBe(false);
    expect(validateSnapshotShape({ version: 'nope' })).toBe(false);
    expect(
      validateSnapshotShape({ version: 1, state: { seed: 'bad', rngSeed: 0, tick: 0, drones: [], orders: [] } }),
    ).toBe(false);
  });
});
