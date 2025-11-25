import type { ChunkId, DroneState, MineOrder, SimState, Vec3, VoxelCoord } from '../state/simTypes';
import { length, normalize, scale } from '../utils/vec3';
import { chunkKey } from '../voxel/world';
import { voxelToWorld } from '../voxel/generator';
import { applyPhysics } from '../ecs/systems/physics';

const DRONE_SPEED = 4;
// const DRONE_ACCEL = 10;
const DRONE_DRAG = 2.0;
const MINING_TIME = 2; // seconds to mine a resource block

const BATTERY_DRAIN_IDLE = 0.005; // per second
const BATTERY_DRAIN_MOVE = 0.02;
const BATTERY_DRAIN_MINE = 0.05;
const BATTERY_CHARGE_RATE = 0.1;
const LOW_BATTERY_THRESHOLD = 0.2;

const droneHoverHeight = (coord: VoxelCoord) => coord.y + 1.4;

export interface DroneStepResult {
  drone: DroneState;
  completedOrderId: string | null;
  consumedResource: { chunk: ChunkId; voxel: VoxelCoord } | null;
}

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

const findBasePosition = (state: SimState): Vec3 | null => {
  const chunk = state.world.chunks['0:0'];
  if (!chunk) return null;
  // Find base block
  for (let i = 0; i < chunk.blocks.length; i++) {
    if (chunk.blocks[i] === 'base') {
      const y = Math.floor(i / (chunk.size * chunk.size));
      const z = Math.floor((i % (chunk.size * chunk.size)) / chunk.size);
      const x = i % chunk.size;
      return voxelToWorld(chunk, { x, y, z });
    }
  }
  return null;
};

export const processDroneTick = (
  drone: DroneState,
  order: MineOrder | undefined,
  state: SimState,
  dt: number,
): DroneStepResult => {
  // Battery check (dead)
  if (drone.battery <= 0) {
    return {
      drone: { ...drone, activity: 'idle', velocity: [0, 0, 0] },
      completedOrderId: null,
      consumedResource: null,
    };
  }

  let batteryDrain = BATTERY_DRAIN_IDLE;
  let nextActivity = drone.activity;
  let nextTask = drone.task;
  let targetPos: Vec3 | null = null;
  let nextBattery = drone.battery;
  let nextCarrying = drone.carrying;

  // Check for low battery or carrying resources -> Return to base
  const needsBase = drone.battery < LOW_BATTERY_THRESHOLD || drone.carrying > 0;
  
  if (needsBase && nextActivity !== 'mining') {
    const basePos = findBasePosition(state);
    if (basePos) {
      const hoverBase = [basePos[0], basePos[1] + 1.5, basePos[2]] as Vec3;
      const dist = length(sub(hoverBase, drone.position));
      
      if (dist < 0.5) {
        // At base
        if (drone.carrying > 0) {
          nextCarrying = 0; // Drop resources
        }
        if (drone.battery < 1.0) {
          nextActivity = 'charging';
          nextBattery = Math.min(1.0, drone.battery + BATTERY_CHARGE_RATE * dt);
          batteryDrain = 0; // Charging
        } else {
          nextActivity = 'idle';
        }
        targetPos = hoverBase;
      } else {
        // Move to base
        nextActivity = 'returning';
        batteryDrain = BATTERY_DRAIN_MOVE;
        targetPos = hoverBase;
      }
      // Override order if we are returning/charging
      nextTask = null; 
    }
  } else if (order) {
    // Normal order processing
    const key = chunkKey(order.chunk);
    const activeChunk = state.world.chunks[key];
    
    if (activeChunk) {
      const targetWorld = voxelToWorld(activeChunk, order.target);
      const hoverTarget: Vec3 = [targetWorld[0], droneHoverHeight(order.target), targetWorld[2]];
      
      const distToHover = length(sub(hoverTarget, drone.position));
      
      if (distToHover < 0.2) {
        // Arrived at hover position, start mining
        const miningTask = drone.task?.id === order.id
          ? drone.task
          : { id: order.id, type: 'mine', target: order.target, progress: 0 };
        
        const progress = miningTask.progress + dt;
        
        if (progress < MINING_TIME) {
          // Mining in progress
          nextActivity = 'mining';
          batteryDrain = BATTERY_DRAIN_MINE;
          nextTask = { ...miningTask, progress, type: 'mine' as const };
          targetPos = hoverTarget; // Stay at hover
        } else {
          // Mining complete
          const landingPos: Vec3 = [targetWorld[0], targetWorld[1] + 0.2, targetWorld[2]];
          return {
            drone: {
              ...drone,
              position: landingPos,
              velocity: [0, 0, 0],
              activity: 'returning',
              carrying: drone.carrying + 1,
              task: null,
              battery: Math.max(0, drone.battery - BATTERY_DRAIN_MINE * dt),
            },
            completedOrderId: order.id,
            consumedResource: { chunk: order.chunk, voxel: order.target },
          };
        }
      } else {
        // Move towards hover target
        nextActivity = 'moving';
        batteryDrain = BATTERY_DRAIN_MOVE;
        targetPos = hoverTarget;
        nextTask = { id: order.id, type: 'mine', target: order.target, progress: 0 };
      }
    }
  } else {
    // No order, not returning/charging
    nextActivity = 'idle';
    nextTask = null;
    targetPos = drone.position; 
  }

  // Physics Movement
  let acceleration: Vec3 = [0, 0, 0];
  if (targetPos && (nextActivity === 'moving' || nextActivity === 'returning')) {
    const delta = sub(targetPos, drone.position);
    const dist = length(delta);
    if (dist > 0.01) {
      const dir = normalize(delta);
      const targetVel = scale(dir, DRONE_SPEED);
      const velDiff = sub(targetVel, drone.velocity);
      acceleration = scale(velDiff, 5.0); // Gain
    }
  } else if (nextActivity === 'mining' || nextActivity === 'idle' || nextActivity === 'charging') {
    // Dampen velocity to stop
    acceleration = scale(drone.velocity, -5.0);
  }

  const nextPhysics = applyPhysics(
    { position: drone.position, velocity: drone.velocity, drag: DRONE_DRAG },
    dt,
    acceleration
  );

  return {
    drone: {
      ...drone,
      position: nextPhysics.position,
      velocity: nextPhysics.velocity,
      activity: nextActivity,
      task: nextTask,
      battery: batteryDrain === 0 ? nextBattery : Math.max(0, nextBattery - batteryDrain * dt),
      carrying: nextCarrying,
    },
    completedOrderId: null,
    consumedResource: null,
  };
};

export default processDroneTick;
