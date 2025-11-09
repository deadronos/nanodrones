import { describe, expect, it } from 'vitest';
import { runSimTick, findNearestResource } from '../src/ecs/engine';
import { createInitialState } from '../src/state/initialState';
import type { MineOrder } from '../src/state/simTypes';

const FIXED_DT = 1 / 60;

describe('Simulation engine', () => {
  it('advances deterministically for identical inputs', () => {
    const base = createInitialState(4242);
    const ctx = {
      input: { forward: true, backward: false, left: false, right: false },
      heading: 0,
      dt: FIXED_DT,
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

    const order: MineOrder = { id: 'order-1', type: 'mine', target, status: 'pending' };
    const assigned = runSimTick(
      { ...state, orders: [order] },
      {
        input: { forward: false, backward: false, left: false, right: false },
        heading: 0,
        dt: FIXED_DT,
      },
    );

    expect(
      assigned.orders[0].status === 'assigned' || assigned.orders[0].status === 'completed',
    ).toBeTruthy();
    expect(assigned.drones.some((d) => d.task?.id === 'order-1' || d.carrying > 0)).toBeTruthy();
  });
});
