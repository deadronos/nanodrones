import { add, clampVec3XZ, normalize, scale } from '../../utils/vec3';
import { sampleHeightAtWorld } from '../../voxel/generator';
import type { InputState, SimState, Vec3 } from '../../state/simTypes';

const WORLD_MARGIN = 1;
const FOOT_OFFSET = 0.6;
export const PLAYER_SPEED = 4;

export interface SimContext {
  input: InputState;
  heading: number;
  dt: number;
}

export const applyMovement = (
  position: Vec3,
  input: InputState,
  heading: number,
  dt: number,
  speed = PLAYER_SPEED,
): Vec3 => {
  if (dt <= 0) {
    return position;
  }

  const forwardVec: Vec3 = [Math.sin(heading), 0, Math.cos(heading)];
  const rightVec: Vec3 = [Math.cos(heading), 0, -Math.sin(heading)];

  let move: Vec3 = [0, 0, 0];
  if (input.forward) move = add(move, forwardVec);
  if (input.backward) move = add(move, scale(forwardVec, -1));
  if (input.left) move = add(move, scale(rightVec, -1));
  if (input.right) move = add(move, rightVec);

  const direction = normalize(move);
  const displacement = scale(direction, speed * dt);
  return add(position, displacement);
};

export const thirdPersonController = (state: SimState, ctx: SimContext): SimState => {
  const nextPosition = applyMovement(state.player.position, ctx.input, ctx.heading, ctx.dt);
  const half = state.world.chunk.size / 2 - WORLD_MARGIN;
  const clamped = clampVec3XZ(nextPosition, half);
  const ground = sampleHeightAtWorld(state.world.chunk, clamped[0], clamped[2]);
  const height = ground + FOOT_OFFSET;
  const invDt = ctx.dt > 0 ? 1 / ctx.dt : 0;
  const velocity: Vec3 = [
    (clamped[0] - state.player.position[0]) * invDt,
    (height - state.player.position[1]) * invDt,
    (clamped[2] - state.player.position[2]) * invDt,
  ];

  return {
    ...state,
    player: {
      ...state.player,
      position: [clamped[0], height, clamped[2]],
      velocity,
    },
  };
};
