import { beforeEach, describe, expect, it } from 'vitest';
import { useSimStore } from '../src/state/simStore';
import { DEFAULT_SEED } from '../src/state/initialState';
import { PLAYER_SPEED } from '../src/ecs/systems/thirdPersonController';

const FIXED_DT = 1 / 60;

describe('player movement integration', () => {
  beforeEach(() => {
    window.localStorage?.clear();
    useSimStore.getState().reset(DEFAULT_SEED);
  });

  it('moves the player when forward input is applied', () => {
    const store = useSimStore.getState();
    const startPosition = [...store.player.position];
    store.setInput({ forward: true });
    store.advance(FIXED_DT);

    const { player } = useSimStore.getState();
    const dx = player.position[0] - startPosition[0];
    const dz = player.position[2] - startPosition[2];
    const horizontalDistance = Math.hypot(dx, dz);

    expect(horizontalDistance).toBeCloseTo(PLAYER_SPEED * FIXED_DT);
  });
});
