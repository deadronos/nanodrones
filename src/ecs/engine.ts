import { Rng } from '../state/rng';
import type {
  BlockId,
  ChunkId,
  DroneState,
  InventoryState,
  ItemId,
  MineOrder,
  SimAction,
  SimState,
  Vec3,
  VoxelCoord,
} from '../state/simTypes';
import {
  columnKey,
  listActiveResources,
  markResourceDepleted,
  voxelToWorld,
} from '../voxel/generator';
import { chunkKey, getBlockId, raycastWorld, setBlockInWorld } from '../voxel/world';
import { thirdPersonController, type SimContext } from './systems/thirdPersonController';
import { processDroneTick } from '../sim/drones';

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

const blockToItem = (block: BlockId): ItemId | null => {
  switch (block) {
    case 'ground':
      return 'block:ground';
    case 'resource':
      return 'resource:ore';
    default:
      return null;
  }
};

const itemToBlock = (item: ItemId): BlockId | null => {
  switch (item) {
    case 'block:ground':
      return 'ground';
    case 'block:resource':
      return 'resource';
    default:
      return null;
  }
};

const addItemToInventory = (inventory: InventoryState, item: ItemId, count = 1): InventoryState => {
  if (count <= 0) return inventory;
  const next = inventory.map((slot) => (slot ? { ...slot } : null));
  let remaining = count;
  for (let i = 0; i < next.length && remaining > 0; i += 1) {
    const slot = next[i];
    if (slot && slot.item === item) {
      slot.count += remaining;
      remaining = 0;
    }
  }
  for (let i = 0; i < next.length && remaining > 0; i += 1) {
    if (!next[i]) {
      next[i] = { item, count: remaining };
      remaining = 0;
    }
  }
  return next;
};

const removeFromInventorySlot = (
  inventory: InventoryState,
  slotIndex: number,
  amount = 1,
): { inventory: InventoryState; success: boolean } => {
  if (slotIndex < 0 || slotIndex >= inventory.length) {
    return { inventory, success: false };
  }
  const slot = inventory[slotIndex];
  if (!slot || amount <= 0) {
    return { inventory, success: false };
  }
  const next = inventory.map((entry, idx) => (idx === slotIndex && entry ? { ...entry } : entry ? { ...entry } : null));
  const target = next[slotIndex];
  if (!target) return { inventory, success: false };
  if (target.count <= amount) {
    next[slotIndex] = null;
  } else {
    target.count -= amount;
  }
  return { inventory: next, success: true };
};

const cycleHotbarIndex = (current: number, length: number, direction: -1 | 1) => {
  if (length <= 0) return 0;
  const next = (current + direction + length) % length;
  return next < 0 ? next + length : next;
};

const computeLookDirection = (heading: number, cameraPhi: number): Vec3 => {
  const pitch = cameraPhi - Math.PI / 2;
  const cosPitch = Math.cos(pitch);
  const sinPitch = Math.sin(pitch);
  return [Math.sin(heading) * cosPitch, sinPitch, Math.cos(heading) * cosPitch];
};

const processActions = (
  actions: SimAction[],
  player: SimState['player'],
  world: SimState['world'],
  interaction: SimState['interaction'],
) => {
  let nextPlayer = player;
  let nextWorld = world;
  for (const action of actions) {
    switch (action.type) {
      case 'cycle-hotbar': {
        const nextIndex = cycleHotbarIndex(
          nextPlayer.hotbar.activeIndex,
          nextPlayer.hotbar.slots.length,
          action.direction,
        );
        nextPlayer = {
          ...nextPlayer,
          hotbar: { ...nextPlayer.hotbar, activeIndex: nextIndex },
        };
        break;
      }
      case 'break-block': {
        if (interaction.target) {
          const chunk = nextWorld.chunks[chunkKey(interaction.target.chunk)];
          if (chunk) {
            const block = getBlockId(chunk, interaction.target.voxel);
            if (block && block !== 'air') {
              if (!nextPlayer.devCreative) {
                const item = blockToItem(block);
                if (item) {
                  nextPlayer = {
                    ...nextPlayer,
                    inventory: addItemToInventory(nextPlayer.inventory, item, 1),
                  };
                }
              }
              if (block === 'resource') {
                nextWorld = markResourceDepleted(nextWorld, interaction.target.chunk, interaction.target.voxel);
              } else {
                nextWorld = setBlockInWorld(nextWorld, interaction.target.chunk, interaction.target.voxel, 'air');
              }
            }
          }
        }
        break;
      }
      case 'place-block': {
        if (interaction.placement) {
          const chunk = nextWorld.chunks[chunkKey(interaction.placement.chunk)];
          if (chunk && getBlockId(chunk, interaction.placement.voxel) === 'air') {
            let blockToPlace: BlockId | null = null;
            let inventoryState = nextPlayer.inventory;
            if (nextPlayer.devCreative) {
              blockToPlace = 'ground';
            } else {
              const slotIndex = nextPlayer.hotbar.slots[nextPlayer.hotbar.activeIndex];
              if (slotIndex !== null && slotIndex !== undefined) {
                const slot = inventoryState[slotIndex];
                if (slot) {
                  blockToPlace = itemToBlock(slot.item);
                  if (blockToPlace) {
                    const removal = removeFromInventorySlot(inventoryState, slotIndex, 1);
                    if (removal.success) {
                      inventoryState = removal.inventory;
                    } else {
                      blockToPlace = null;
                    }
                  }
                }
              }
            }
            if (blockToPlace) {
              nextWorld = setBlockInWorld(nextWorld, interaction.placement.chunk, interaction.placement.voxel, blockToPlace);
              nextPlayer = {
                ...nextPlayer,
                inventory: inventoryState,
              };
            }
          }
        }
        break;
      }
      default:
        break;
    }
  }
  return { player: nextPlayer, world: nextWorld };
};

export const runSimTick = (state: SimState, ctx: SimContext): SimState => {
  const rng = new Rng(state.rngSeed);
  rng.next();
  const assignedOrders = assignOrders(state.orders, state.drones);

  let worldState = state.world;
  let playerState = {
    ...state.player,
    yaw: ctx.heading,
    pitch: ctx.cameraPhi,
  };

  const lookDir = computeLookDirection(ctx.heading, ctx.cameraPhi);
  const initialRay = raycastWorld(worldState, playerState.position, lookDir, 8);
  let interaction = { target: initialRay.target, placement: initialRay.placement };

  const actionResult = processActions(ctx.actions, playerState, worldState, interaction);
  playerState = actionResult.player;
  worldState = actionResult.world;

  const drones: DroneState[] = [];
  const completedOrders = new Set<string>();

  for (const drone of state.drones) {
    const order = assignedOrders.find((o) => o.droneId === drone.id && o.status === 'assigned');
    const { drone: nextDrone, completedOrderId, consumedResource } = processDroneTick(
      drone,
      order,
      state,
      ctx.dt,
    );
    if (consumedResource) {
      worldState = markResourceDepleted(worldState, consumedResource.chunk, consumedResource.voxel);
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

  const interimState: SimState = {
    ...state,
    rngSeed: rng.getState(),
    tick: state.tick + 1,
    player: playerState,
    drones,
    orders,
    world: worldState,
    interaction,
  };

  const movedState = thirdPersonController(interimState, ctx);
  const finalRay = raycastWorld(movedState.world, movedState.player.position, lookDir, 8);

  return {
    ...movedState,
    interaction: { target: finalRay.target, placement: finalRay.placement },
  };
};

export const findNearestResource = (
  state: SimState,
  excludeOrders: MineOrder[],
  origin: Vec3,
): (VoxelCoord & { chunk: ChunkId }) | null => {
  const reserved = new Set<string>(excludeOrders.map((o) => columnKey(o.chunk, o.target)));
  let best: { coord: VoxelCoord; distance: number; chunk: ChunkId } | null = null;
  for (const entry of listActiveResources(state.world)) {
    const key = columnKey(entry.chunk, entry.voxel);
    if (reserved.has(key)) continue;
    const chunkState = state.world.chunks[chunkKey(entry.chunk)];
    if (!chunkState) continue;
    const [wx, wy, wz] = voxelToWorld(chunkState, entry.voxel);
    const dx = wx - origin[0];
    const dy = wy - origin[1];
    const dz = wz - origin[2];
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (!best || dist < best.distance) {
      best = { coord: entry.voxel, distance: dist, chunk: entry.chunk };
    }
  }
  return best ? { ...best.coord, chunk: best.chunk } : null;
};

export type { SimContext } from './systems/thirdPersonController';
