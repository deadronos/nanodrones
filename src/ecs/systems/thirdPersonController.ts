import { add, normalize, scale } from '../../utils/vec3';
import { sampleHeightAtWorld } from '../../voxel/generator';
import type { InputState, SimAction, SimState, Vec3 } from '../../state/simTypes';

const FOOT_OFFSET = 0.6;
export const PLAYER_SPEED = 4;
const FLY_SPEED = 6;

export interface SimContext {
  input: InputState;
  heading: number;
  dt: number;
  actions: SimAction[];
  cameraPhi: number;
}

export interface MovementOptions {
  speed?: number;
  allowVertical?: boolean;
  verticalSpeed?: number;
}

export const applyMovement = (
  position: Vec3,
  input: InputState,
  heading: number,
  dt: number,
  speed = PLAYER_SPEED,
  options: MovementOptions = {},
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
  let next = add(position, displacement);

  if (options.allowVertical) {
    const verticalDir = (input.ascend ? 1 : 0) - (input.descend ? 1 : 0);
    if (verticalDir !== 0) {
      const verticalSpeed = options.verticalSpeed ?? speed;
      next = add(next, [0, verticalDir * verticalSpeed * dt, 0]);
    }
  } else {
    next = [next[0], position[1], next[2]];
  }

  return next;
};

export const thirdPersonController = (state: SimState, ctx: SimContext): SimState => {
  const speed = state.player.devFly ? FLY_SPEED : PLAYER_SPEED;
  const nextPosition = applyMovement(
    state.player.position,
    ctx.input,
    ctx.heading,
    ctx.dt,
    speed,
    state.player.devFly ? { allowVertical: true, verticalSpeed: FLY_SPEED } : { allowVertical: false },
  );

  let targetY = nextPosition[1];
  if (!state.player.devFly) {
    const ground = sampleHeightAtWorld(state.world, nextPosition[0], nextPosition[2]);
    targetY = ground + FOOT_OFFSET;
  }

  const finalPos: Vec3 = [nextPosition[0], targetY, nextPosition[2]];
  const invDt = ctx.dt > 0 ? 1 / ctx.dt : 0;
  const velocity: Vec3 = [
    (finalPos[0] - state.player.position[0]) * invDt,
    (finalPos[1] - state.player.position[1]) * invDt,
    (finalPos[2] - state.player.position[2]) * invDt,
  ];

  return {
    ...state,
    player: {
      ...state.player,
      position: finalPos,
      velocity,
    },
  };
};
