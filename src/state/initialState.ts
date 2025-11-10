import { Rng } from './rng';
import type { ChunkId, DroneState, SimState, Vec3, InventoryState, ItemStack } from './simTypes';
import { generateWorld, sampleHeightAtWorld, voxelToWorld } from '../voxel/generator';
import { chunkKey, parseChunkKey } from '../voxel/world';

export const DEFAULT_SEED = 1337;
const DRONE_COUNT = 3;
const INVENTORY_SIZE = 20;
const HOTBAR_SLOTS = 5;

const createDrone = (id: number, position: Vec3): DroneState => ({
  id: `drone-${id + 1}`,
  position,
  velocity: [0, 0, 0],
  battery: 1,
  carrying: 0,
  activity: 'idle',
  task: null,
});

export const createInitialState = (seed = DEFAULT_SEED): SimState => {
  const rng = new Rng(seed);
  const generated = generateWorld(seed);
  const world = generated.world;

  const allResourceEntries: Array<{ chunk: ChunkId; voxel: { x: number; y: number; z: number } }> = [];
  for (const [key, coords] of generated.resources.entries()) {
    const id = parseChunkKey(key);
    coords.forEach((voxel) => {
      allResourceEntries.push({ chunk: id, voxel });
    });
  }

  const drones: DroneState[] = [];
  for (let i = 0; i < DRONE_COUNT; i += 1) {
    const resource = allResourceEntries[i];
    if (resource) {
      const chunk = world.chunks[chunkKey(resource.chunk)];
      if (chunk) {
        const [rx, ry, rz] = voxelToWorld(chunk, resource.voxel);
        drones.push(createDrone(i, [rx, ry + 1.2, rz]));
        continue;
      }
    }
    const offsetX = i - Math.floor(DRONE_COUNT / 2);
    const spawnY = sampleHeightAtWorld(world, offsetX, 0) + 1.2;
    drones.push(createDrone(i, [offsetX, spawnY, 2 - i]));
  }

  const playerY = sampleHeightAtWorld(world, 0, 0) + 0.6;

  const emptySlot: ItemStack | null = null;
  const inventory: InventoryState = Array.from({ length: INVENTORY_SIZE }, () => emptySlot);
  const hotbarSlots = Array.from({ length: HOTBAR_SLOTS }, (_, idx) => (idx < INVENTORY_SIZE ? idx : null));

  const player: SimState['player'] = {
    position: [0, playerY, 0],
    yaw: 0,
    pitch: 0,
    velocity: [0, 0, 0],
    inventory,
    hotbar: { slots: hotbarSlots, activeIndex: 0 },
    equipment: {
      head: null,
      chest: null,
      legs: null,
      boots: null,
      leftHand: null,
      rightHand: null,
      backpack: null,
    },
    devCreative: false,
    devFly: false,
    devNoclip: false,
  };

  return {
    seed,
    rngSeed: rng.getState(),
    tick: 0,
    world,
    player,
    drones,
    orders: [],
    orderCounter: 0,
    interaction: { target: null, placement: null },
  };
};
