import { Rng } from '../state/rng';
import type {
  DroneState,
  MineOrder,
  SimState,
  Vec3,
  VoxelCoord,
} from '../state/simTypes';
import { add, clampVec3XZ, length, normalize, scale } from '../utils/vec3';
import {
  columnKey,
  markResourceDepleted,
  sampleHeightAtWorld,
  voxelToWorld,
} from '../voxel/generator';

const PLAYER_SPEED = 4;
const DRONE_SPEED = 2.5;
const MINING_TIME = 2; // seconds to mine a resource block
const WORLD_MARGIN = 1;

export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
}

export interface SimContext {
  input: InputState;
  heading: number;
  dt: number;
}

const cloneOrder = (order: MineOrder): MineOrder => ({ ...order });

const movePlayer = (state: SimState, ctx: SimContext): SimState => {
  const { input, heading, dt } = ctx;
  const forwardVec: Vec3 = [Math.sin(heading), 0, Math.cos(heading)];
  const rightVec: Vec3 = [Math.cos(heading), 0, -Math.sin(heading)];

  let move: Vec3 = [0, 0, 0];
  if (input.forward) move = add(move, forwardVec);
  if (input.backward) move = add(move, scale(forwardVec, -1));
  if (input.left) move = add(move, scale(rightVec, -1));
  if (input.right) move = add(move, rightVec);

  const direction = normalize(move);
  const displacement = scale(direction, PLAYER_SPEED * dt);
  const tentative = add(state.player.position, displacement);
  const half = state.world.chunk.size / 2 - WORLD_MARGIN;
  const clamped = clampVec3XZ(tentative, half);
  const ground = sampleHeightAtWorld(state.world.chunk, clamped[0], clamped[2]);
  const y = ground + 0.6;

  return {
    ...state,
    player: {
      ...state.player,
      position: [clamped[0], y, clamped[2]],
      velocity: displacement,
    },
  };
};

const assignOrders = (orders: MineOrder[], drones: DroneState[]): MineOrder[] => {
  const next = orders.map(cloneOrder);
  const idleDrones = new Set(
    drones.filter((d) => !d.task).map((d) => d.id),
  );
  for (const order of next) {
    if (order.status !== 'pending') continue;
    const iter = idleDrones.values().next();
    if (iter.done) break;
    order.status = 'assigned';
    order.droneId = iter.value;
    idleDrones.delete(iter.value);
  }
  return next;
};

const moveTowards = (current: Vec3, target: Vec3, speed: number, dt: number): Vec3 => {
  const delta = [target[0] - current[0], target[1] - current[1], target[2] - current[2]] as Vec3;
  const dist = length(delta);
  if (dist === 0) return target;
  const step = Math.min(dist, speed * dt);
  const direction = scale(delta, 1 / dist);
  return add(current, scale(direction, step));
};

const droneHoverHeight = (coord: VoxelCoord) => coord.y + 1.4;

interface DroneStepResult {
  drone: DroneState;
  completedOrderId: string | null;
  updatedWorldChunk: boolean;
}

const stepDrone = (
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
      updatedWorldChunk: false,
    };
  }

  const chunk = state.world.chunk;
  const targetWorld = voxelToWorld(chunk, order.target);
  const hoverTarget: Vec3 = [targetWorld[0], droneHoverHeight(order.target), targetWorld[2]];
  const arrivedHover = length([
    drone.position[0] - hoverTarget[0],
    drone.position[1] - hoverTarget[1],
    drone.position[2] - hoverTarget[2],
  ]) < 0.1;

  let updatedDrone = { ...drone };
  let completedOrderId: string | null = null;
  let updatedWorldChunk = false;

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
    return { drone: updatedDrone, completedOrderId, updatedWorldChunk };
  }

  const miningTask = drone.task?.id === order.id ? drone.task : { id: order.id, type: 'mine', target: order.target, progress: 0 };
  const progress = miningTask.progress + dt;
  if (progress < MINING_TIME) {
    updatedDrone = {
      ...updatedDrone,
      activity: 'mining',
      task: { ...miningTask, progress },
      velocity: [0, 0, 0],
      position: hoverTarget,
    };
    return { drone: updatedDrone, completedOrderId, updatedWorldChunk };
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
  updatedWorldChunk = true;
  return { drone: updatedDrone, completedOrderId, updatedWorldChunk };
};

export const runSimTick = (state: SimState, ctx: SimContext): SimState => {
  const rng = new Rng(state.rngSeed);
  rng.next();
  const assignedOrders = assignOrders(state.orders, state.drones);

  let worldChunk = state.world.chunk;
  const drones: DroneState[] = [];
  const completedOrders = new Set<string>();

  for (const drone of state.drones) {
    const order = assignedOrders.find((o) => o.droneId === drone.id && o.status === 'assigned');
    const { drone: nextDrone, completedOrderId, updatedWorldChunk } = stepDrone(drone, order, state, ctx.dt);
    if (updatedWorldChunk && order) {
      worldChunk = markResourceDepleted(worldChunk, order.target);
    }
    if (completedOrderId) {
      completedOrders.add(completedOrderId);
    }
    drones.push({
      ...nextDrone,
      battery: Math.max(0, nextDrone.battery - 0.001),
    });
  }

  const orders = assignedOrders.map((order) => {
    if (completedOrders.has(order.id)) {
      return { ...order, status: 'completed' };
    }
    return order;
  });

  const nextState: SimState = {
    ...state,
    rngSeed: rng.getState(),
    tick: state.tick + 1,
    player: state.player,
    drones,
    orders,
    world: {
      ...state.world,
      chunk: worldChunk,
    },
  };

  return movePlayer(nextState, ctx);
};

export const findNearestResource = (
  state: SimState,
  excludeOrders: MineOrder[],
  origin: Vec3,
): VoxelCoord | null => {
  const reserved = new Set<string>(excludeOrders.map((o) => columnKey(o.target)));
  const chunk = state.world.chunk;
  let best: { coord: VoxelCoord; distance: number } | null = null;
  for (let z = 0; z < chunk.size; z += 1) {
    for (let x = 0; x < chunk.size; x += 1) {
      const idx = z * chunk.size + x;
      if (!chunk.resources[idx]) continue;
      const coord: VoxelCoord = { x, y: chunk.heightMap[idx] - 1, z };
      const key = columnKey(coord);
      if (reserved.has(key)) continue;
      const [wx, wy, wz] = voxelToWorld(chunk, coord);
      const dx = wx - origin[0];
      const dy = wy - origin[1];
      const dz = wz - origin[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (!best || dist < best.distance) {
        best = { coord, distance: dist };
      }
    }
  }
  return best?.coord ?? null;
};
