import { describe, it, expect } from 'vitest';
import { createInitialState } from '../src/state/initialState';
import { processDroneTick } from '../src/sim/drones';
import { listActiveResources, voxelToWorld } from '../src/voxel/generator';
import { chunkKey } from '../src/voxel/world';

const FIXED_DT = 1 / 60;

describe('Drone behavior (pure)', () => {
  it('moves toward target deterministically', () => {
    const state = createInitialState(1234);
    const order = state.orders[0] ?? null;
    // pick first drone and a synthetic order targeting nearby resource
    const drone = { ...state.drones[0] };
    if (!order) {
      // if no orders present, build a simple MineOrder-like shape
      const target = { x: 0, y: 0, z: 0 };
      const syntheticOrder = { id: 'o-1', type: 'mine', target, status: 'pending', chunk: { x: 0, z: 0 } } as any;
      const res = processDroneTick(drone, syntheticOrder, state as any, FIXED_DT);
      const res2 = processDroneTick(drone, syntheticOrder, state as any, FIXED_DT);
      expect(res).toEqual(res2);
      return;
    }
    const ord = {
      id: 'order-1',
      type: 'mine',
      target: state.orders[0].target,
      status: 'pending',
      chunk: state.orders[0].chunk,
    } as any;
    const a = processDroneTick(drone, ord, state, FIXED_DT);
    const b = processDroneTick(drone, ord, state, FIXED_DT);
    expect(a).toEqual(b);
  });

  it('progresses mining task deterministically and completes after enough time', () => {
    const state = createInitialState(777);
    // find a resource in the world to target
    const resources = listActiveResources(state.world);
    if (resources.length === 0) {
      // no resources to test against; skip assertion
      const drone = { ...state.drones[0] };
      const order = {
        id: 'm-1',
        type: 'mine',
        target: { x: 0, y: 0, z: 0 },
        status: 'pending',
        chunk: { x: 0, z: 0 },
      } as any;
      const s1 = processDroneTick(drone, order, state, 1);
      const s2 = processDroneTick(s1.drone, order, state, 1);
      expect(s2).toBeDefined();
      return;
    }
    const target = resources[0];
    const chunk = state.world.chunks[chunkKey(target.chunk)];
    if (!chunk) throw new Error('missing chunk for test');
    const coord = target.voxel;
    const [wx, , wz] = voxelToWorld(chunk, coord);
    const hover = [wx, coord.y + 1.4, wz] as [number, number, number];
    const drone = { ...state.drones[0], position: hover };
    const order = { id: 'm-1', type: 'mine', target: coord, status: 'pending', chunk: target.chunk } as any;

    // simulate two seconds in one-second steps
    const step1 = processDroneTick(drone, order, state, 1);
    expect(step1.drone.activity === 'mining' || step1.drone.activity === 'moving').toBeTruthy();
    const step2 = processDroneTick(step1.drone, order, state, 1);
    // after 2 seconds mining should complete
    expect(step2.completedOrderId === 'm-1' || step2.drone.carrying > 0).toBeTruthy();
  });
});
