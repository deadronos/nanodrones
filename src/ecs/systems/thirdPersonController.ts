import { add, clampVec3XZ, normalize, scale } from '../../utils/vec3';
import { sampleHeightAtWorld } from '../../voxel/generator';
import { parseChunkKey } from '../../voxel/world';
import type { InputState, SimAction, SimState, Vec3 } from '../../state/simTypes';
import { applyPhysics } from './physics';

const WORLD_MARGIN = 1;
const FOOT_OFFSET = 0.6;
export const PLAYER_SPEED = 4;
// const FLY_SPEED = 6;
const ACCELERATION = 20; // Units per second squared

export interface SimContext {
  input: InputState;
  heading: number;
  dt: number;
  actions: SimAction[];
  cameraPhi: number;
}

export const thirdPersonController = (state: SimState, ctx: SimContext): SimState => {
  const { input, heading, dt } = ctx;
  
  // Calculate input direction
  const forwardVec: Vec3 = [Math.sin(heading), 0, Math.cos(heading)];
  const rightVec: Vec3 = [Math.cos(heading), 0, -Math.sin(heading)];

  let moveDir: Vec3 = [0, 0, 0];
  if (input.forward) moveDir = add(moveDir, forwardVec);
  if (input.backward) moveDir = add(moveDir, scale(forwardVec, -1));
  if (input.left) moveDir = add(moveDir, scale(rightVec, -1));
  if (input.right) moveDir = add(moveDir, rightVec);

  const direction = normalize(moveDir);
  const accelMag = state.player.devFly ? ACCELERATION * 2 : ACCELERATION;
  const acceleration = scale(direction, accelMag);

  // Apply vertical movement for fly mode
  if (state.player.devFly) {
    const verticalDir = (input.ascend ? 1 : 0) - (input.descend ? 1 : 0);
    acceleration[1] = verticalDir * accelMag;
  }

  // Apply physics
  const nextPhysics = applyPhysics(
    { 
      position: state.player.position, 
      velocity: state.player.velocity,
      drag: state.player.devFly ? 2.0 : 5.0 
    }, 
    dt, 
    acceleration
  );

  let finalPos = nextPhysics.position;
  const finalVel = nextPhysics.velocity;

  // World bounds clamping
  const maxChunkOffset = state.world.visibleChunkKeys.reduce((max, key) => {
    const id = parseChunkKey(key);
    return Math.max(max, Math.abs(id.x), Math.abs(id.z));
  }, 0);
  const worldHalf = state.world.chunkSize * maxChunkOffset + state.world.chunkSize / 2 - WORLD_MARGIN;
  const clamped = clampVec3XZ(finalPos, worldHalf);
  finalPos = [clamped[0], finalPos[1], clamped[2]];

  // Ground collision / snapping
  if (!state.player.devFly) {
    const ground = sampleHeightAtWorld(state.world, finalPos[0], finalPos[2]);
    const targetY = ground + FOOT_OFFSET;
    // Simple snap to ground for now, but preserve vertical velocity if jumping (not implemented yet)
    finalPos[1] = targetY;
    finalVel[1] = 0;
  }

  return {
    ...state,
    player: {
      ...state.player,
      position: finalPos,
      velocity: finalVel,
    },
  };
};
