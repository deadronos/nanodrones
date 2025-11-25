import { describe, expect, it } from 'vitest';
import { runSimTick, findNearestResource } from '../src/ecs/engine';
import { createInitialState } from '../src/state/initialState';
import type { MineOrder } from '../src/state/simTypes';

const FIXED_DT = 1 / 60;

describe('Simulation engine', () => {
  it('advances deterministically for identical inputs', () => {
    const base = createInitialState(4242);
    const ctx = {
      input: {
        forward: true,
        backward: false,
        left: false,
        right: false,
        ascend: false,
        descend: false,
      },
      heading: 0,
      dt: FIXED_DT,
      actions: [],
      cameraPhi: base.player.pitch,
    };

    const a = runSimTick(base, ctx);
    const b = runSimTick(base, ctx);

    expect(a).toEqual(b);
  });

  it('assigns mining orders to nearest resource', () => {
    const state = createInitialState(1337);
    const target = findNearestResource(state, state.orders as MineOrder[], state.player.position);
    expect(target).not.toBeNull();
    if (!target) return;

    const order: MineOrder = {
      id: 'order-1',
      type: 'mine',
      target: { x: target.x, y: target.y, z: target.z },
      chunk: target.chunk,
      status: 'pending',
    };

    // Ensure a drone is close enough to the target
    // const drone = state.drones[0];
    // const [tx, ty, tz] = [target.x, target.y, target.z]; // Voxel coords, need world coords
    // Actually, findNearestResource returns voxel coords.
    // We need to convert to world to place drone.
    // But we can just set drone position to be near the target.
    // We need to know the world position of the target.
    // Let's just set the drone's sensor range to Infinity for this test.
    const dronesWithRange = state.drones.map(d => ({ ...d, sensorRange: 1000 }));

    const assigned = runSimTick(
      { ...state, orders: [order], drones: dronesWithRange },
      {
        input: { forward: false, backward: false, left: false, right: false, ascend: false, descend: false },
        heading: 0,
        dt: FIXED_DT,
        actions: [],
        cameraPhi: state.player.pitch,
      },
    );

    expect(
      assigned.orders[0].status === 'assigned' || assigned.orders[0].status === 'completed',
    ).toBeTruthy();
    expect(assigned.drones.some((d) => d.task?.id === 'order-1' || d.carrying > 0)).toBeTruthy();
  });
});
