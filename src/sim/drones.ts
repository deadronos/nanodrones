import type { ChunkId, DroneState, MineOrder, SimState, Vec3, VoxelCoord } from '../state/simTypes';
import { add, length, scale } from '../utils/vec3';
import { chunkKey } from '../voxel/world';
import { columnKey, voxelToWorld } from '../voxel/generator';

const DRONE_SPEED = 2.5;
const MINING_TIME = 2; // seconds to mine a resource block

const moveTowards = (current: Vec3, target: Vec3, speed: number, dt: number): Vec3 => {
  const delta = [target[0] - current[0], target[1] - current[1], target[2] - current[2]] as Vec3;
  const dist = length(delta);
  if (dist === 0) return target;
  const step = Math.min(dist, speed * dt);
  const direction = scale(delta, 1 / dist);
  return add(current, scale(direction, step));
};

const droneHoverHeight = (coord: VoxelCoord) => coord.y + 1.4;

export interface DroneStepResult {
  drone: DroneState;
  completedOrderId: string | null;
  consumedResource: { chunk: ChunkId; voxel: VoxelCoord } | null;
}

export const processDroneTick = (
  drone: DroneState,
  order: MineOrder | undefined,
  state: SimState,
  dt: number,
): DroneStepResult => {
  if (!order) {
    return {
      drone: {
        ...drone,
        activity: 'idle',
        velocity: [0, 0, 0],
        task: null,
      },
      completedOrderId: null,
      consumedResource: null,
    };
  }

  const key = chunkKey(order.chunk);
  const activeChunk = state.world.chunks[key];
  if (!activeChunk) {
    return {
      drone: {
        ...drone,
        activity: 'idle',
        velocity: [0, 0, 0],
        task: null,
      },
      completedOrderId: null,
      consumedResource: null,
    };
  }

  const targetWorld = voxelToWorld(activeChunk, order.target);
  const hoverTarget: Vec3 = [targetWorld[0], droneHoverHeight(order.target), targetWorld[2]];
  const arrivedHover =
    length([
      drone.position[0] - hoverTarget[0],
      drone.position[1] - hoverTarget[1],
      drone.position[2] - hoverTarget[2],
    ]) < 0.1;

  let updatedDrone = { ...drone };
  let completedOrderId: string | null = null;
  let consumedResource: { chunk: ChunkId; voxel: VoxelCoord } | null = null;

  if (!arrivedHover) {
    const nextPos = moveTowards(drone.position, hoverTarget, DRONE_SPEED, dt);
    updatedDrone = {
      ...updatedDrone,
      position: nextPos,
      velocity: [
        (nextPos[0] - drone.position[0]) / dt,
        (nextPos[1] - drone.position[1]) / dt,
        (nextPos[2] - drone.position[2]) / dt,
      ],
      activity: 'moving',
      task: { id: order.id, type: 'mine', target: order.target, progress: 0 },
    };
    return { drone: updatedDrone, completedOrderId, consumedResource };
  }

  const miningTask =
    drone.task?.id === order.id
      ? drone.task
      : { id: order.id, type: 'mine', target: order.target, progress: 0 };
  const progress = miningTask.progress + dt;
  if (progress < MINING_TIME) {
    updatedDrone = {
      ...updatedDrone,
      activity: 'mining',
      task: { ...miningTask, progress },
      velocity: [0, 0, 0],
      position: hoverTarget,
    };
    return { drone: updatedDrone, completedOrderId, consumedResource };
  }

  const landingPos: Vec3 = [targetWorld[0], targetWorld[1] + 0.2, targetWorld[2]];
  updatedDrone = {
    ...updatedDrone,
    position: landingPos,
    activity: 'returning',
    carrying: updatedDrone.carrying + 1,
    task: null,
    velocity: [0, 0, 0],
  };
  completedOrderId = order.id;
  consumedResource = { chunk: order.chunk, voxel: order.target };
  return { drone: updatedDrone, completedOrderId, consumedResource };
};

export default processDroneTick;
