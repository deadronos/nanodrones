import { describe, expect, it } from 'vitest';
import { applyMovement, PLAYER_SPEED } from '../src/ecs/systems/thirdPersonController';

const baseInput = {
  forward: false,
  backward: false,
  left: false,
  right: false,
};

describe('thirdPersonController.applyMovement', () => {
  it('returns the same position when no input is provided', () => {
    const next = applyMovement([0, 0, 0], baseInput, 0, 0.5);
    expect(next).toEqual([0, 0, 0]);
  });

  it('moves forward along the heading vector', () => {
    const dt = 0.25;
    const next = applyMovement([0, 0, 0], { ...baseInput, forward: true }, 0, dt);
    expect(next[0]).toBeCloseTo(0);
    expect(next[2]).toBeCloseTo(PLAYER_SPEED * dt);
  });

  it('normalizes diagonal input so the total distance equals speed * dt', () => {
    const dt = 1 / 60;
    const diagonalInput = { ...baseInput, forward: true, right: true };
    const next = applyMovement([0, 0, 0], diagonalInput, 0, dt);
    const distance = Math.hypot(next[0], next[2]);
    expect(distance).toBeCloseTo(PLAYER_SPEED * dt);
  });
});
