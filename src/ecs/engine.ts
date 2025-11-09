import { Rng } from '../state/rng';
import type { DroneState, MineOrder, SimState, Vec3, VoxelCoord } from '../state/simTypes';
import { columnKey, listActiveResources, markResourceDepleted, voxelToWorld } from '../voxel/generator';
import { thirdPersonController, type SimContext } from './systems/thirdPersonController';

const cloneOrder = (order: MineOrder): MineOrder => ({ ...order });

const assignOrders = (orders: MineOrder[], drones: DroneState[]): MineOrder[] => {
  const next = orders.map(cloneOrder);
  const idleDrones = new Set(drones.filter((d) => !d.task).map((d) => d.id));
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

import { processDroneTick } from '../sim/drones';

export const runSimTick = (state: SimState, ctx: SimContext): SimState => {
  const rng = new Rng(state.rngSeed);
  rng.next();
  const assignedOrders = assignOrders(state.orders, state.drones);

  let worldChunk = state.world.chunk;
  const drones: DroneState[] = [];
  const completedOrders = new Set<string>();

  for (const drone of state.drones) {
    const order = assignedOrders.find((o) => o.droneId === drone.id && o.status === 'assigned');
    const { drone: nextDrone, completedOrderId, updatedWorldChunk } = processDroneTick(
      drone,
      order,
      state,
      ctx.dt,
    );
    if (updatedWorldChunk && order) {
      worldChunk = markResourceDepleted(worldChunk, order.target);
    }
    if (completedOrderId) {
      completedOrders.add(completedOrderId);
    }
    drones.push({ ...nextDrone, battery: Math.max(0, nextDrone.battery - 0.001) });
  }

  const orders: MineOrder[] = assignedOrders.map((order) => {
    if (completedOrders.has(order.id)) {
      return { ...order, status: 'completed' as const };
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

  return thirdPersonController(nextState, ctx);
};

export const findNearestResource = (
  state: SimState,
  excludeOrders: MineOrder[],
  origin: Vec3,
): VoxelCoord | null => {
  const reserved = new Set<string>(excludeOrders.map((o) => columnKey(o.target)));
  const chunk = state.world.chunk;
  let best: { coord: VoxelCoord; distance: number } | null = null;
  for (const coord of listActiveResources(chunk)) {
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
  return best?.coord ?? null;
};

export type { SimContext } from './systems/thirdPersonController';
