import { Rng } from './rng';
import type { DroneState, SimState, Vec3 } from './simTypes';
import { generateChunk, sampleHeightAtWorld, voxelToWorld } from '../voxel/generator';

export const DEFAULT_SEED = 1337;
const CHUNK_SIZE = 16;
const DRONE_COUNT = 3;

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
  const { chunk, resources } = generateChunk(rng, CHUNK_SIZE);

  const drones: DroneState[] = [];
  for (let i = 0; i < DRONE_COUNT; i += 1) {
    const resource = resources[i];
    if (resource) {
      const [rx, ry, rz] = voxelToWorld(chunk, resource);
      drones.push(createDrone(i, [rx, ry + 1.2, rz]));
    } else {
      drones.push(createDrone(i, [i - 1, sampleHeightAtWorld(chunk, i - 1, 0) + 1.2, 2 - i]));
    }
  }

  const playerY = sampleHeightAtWorld(chunk, 0, 0) + 0.6;

  const player: SimState['player'] = {
    position: [0, playerY, 0],
    yaw: 0,
    pitch: 0,
    velocity: [0, 0, 0],
  };

  return {
    seed,
    rngSeed: rng.getState(),
    tick: 0,
    world: {
      seed,
      chunk,
    },
    player,
    drones,
    orders: [],
    orderCounter: 0,
  };
};
