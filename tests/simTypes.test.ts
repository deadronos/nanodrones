import { describe, it, expect } from 'vitest';
import { validateSnapshotShape } from '../src/state/simTypes';
import { CURRENT_VERSION } from '../src/state/persistence';
import { chunkKey } from '../src/voxel/world';

describe('Snapshot shape validator', () => {
  it('accepts a valid snapshot object', () => {
    const width = 2;
    const height = 4;
    const chunkId = { x: 0, z: 0 } as const;
    const chunk = {
      id: chunkId,
      size: width,
      height,
      blocks: new Array(width * width * height).fill('air'),
      dirty: false,
    };
    const snapshot = {
      version: CURRENT_VERSION,
      createdAt: new Date().toISOString(),
      state: {
        seed: 123,
        rngSeed: 456,
        tick: 0,
        world: {
          seed: 123,
          chunkSize: width,
          chunkHeight: height,
          chunks: {
            [chunkKey(chunkId)]: chunk,
          },
          visibleChunkKeys: [chunkKey(chunkId)],
          meshDiffs: [],
        },
        player: {
          position: [0, 0, 0],
          yaw: 0,
          pitch: 0,
          velocity: [0, 0, 0],
          inventory: [null],
          hotbar: { slots: [0], activeIndex: 0 },
          equipment: {
            head: null,
            chest: null,
            legs: null,
            boots: null,
            leftHand: null,
            rightHand: null,
            backpack: null,
          },
          devCreative: false,
          devFly: false,
          devNoclip: false,
        },
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
        orders: [
          {
            id: 'order-1',
            type: 'mine' as const,
            chunk: { x: 0, z: 0 },
            target: { x: 0, y: 0, z: 0 },
            status: 'pending' as const,
          },
        ],
        orderCounter: 1,
        interaction: { target: null, placement: null },
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
