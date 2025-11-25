import { describe, expect, it } from 'vitest';
import { thirdPersonController } from '../src/ecs/systems/thirdPersonController';
import { createInitialState } from '../src/state/initialState';
import type { SimContext } from '../src/ecs/systems/thirdPersonController';

const baseInput = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  ascend: false,
  descend: false,
};

describe('thirdPersonController', () => {
  it('returns the same position when no input is provided', () => {
    const state = createInitialState();
    const ctx: SimContext = {
      input: baseInput,
      heading: 0,
      dt: 0.5,
      actions: [],
      cameraPhi: 0,
    };
    const nextState = thirdPersonController(state, ctx);
    expect(nextState.player.position).toEqual(state.player.position);
  });

  it('accelerates forward when input is provided', () => {
    const state = createInitialState();
    const dt = 1 / 60; // Use small dt to avoid drag instability
    const ctx: SimContext = {
      input: { ...baseInput, forward: true },
      heading: 0,
      dt,
      actions: [],
      cameraPhi: 0,
    };
    const nextState = thirdPersonController(state, ctx);
    
    // With physics, position change should be > 0 but likely less than full speed * dt initially
    const dz = nextState.player.position[2] - state.player.position[2];
    expect(dz).toBeGreaterThan(0);
    expect(nextState.player.velocity[2]).toBeGreaterThan(0);
  });
});
