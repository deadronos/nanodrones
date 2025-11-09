import { Rng } from '../state/rng';
import type { ChunkState, VoxelCoord } from '../state/simTypes';

export interface GeneratedWorld {
  chunk: ChunkState;
  resources: VoxelCoord[];
}

const BASE_HEIGHT = 2;
const VARIATION = 3;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const heightIndex = (size: number, x: number, z: number) => z * size + x;

export const generateChunk = (rng: Rng, size = 16): GeneratedWorld => {
  const heightMap: number[] = new Array(size * size).fill(BASE_HEIGHT);
  const resources: boolean[] = new Array(size * size).fill(false);
  const resourceCoords: VoxelCoord[] = [];

  for (let z = 0; z < size; z += 1) {
    for (let x = 0; x < size; x += 1) {
      const idx = heightIndex(size, x, z);
      const ridge = Math.sin((x / size) * Math.PI) + Math.cos((z / size) * Math.PI);
      const noise = rng.nextRange(-1, 1);
      const height = clamp(
        Math.round(BASE_HEIGHT + VARIATION * 0.3 * ridge + VARIATION * 0.5 * noise),
        1,
        BASE_HEIGHT + VARIATION,
      );
      heightMap[idx] = height;
      const hasResource = rng.next() > 0.6;
      resources[idx] = hasResource;
      if (hasResource) {
        resourceCoords.push({ x, y: height - 1, z });
      }
    }
  }

  if (resourceCoords.length === 0) {
    const x = Math.floor(size / 2);
    const z = Math.floor(size / 2);
    const idx = heightIndex(size, x, z);
    resources[idx] = true;
    resourceCoords.push({ x, y: heightMap[idx] - 1, z });
  }

  return {
    chunk: {
      size,
      heightMap,
      resources,
    },
    resources: resourceCoords,
  };
};

export const listActiveResources = (chunk: ChunkState): VoxelCoord[] => {
  const coords: VoxelCoord[] = [];
  const { size, heightMap, resources } = chunk;
  for (let z = 0; z < size; z += 1) {
    for (let x = 0; x < size; x += 1) {
      const idx = heightIndex(size, x, z);
      if (!resources[idx]) continue;
      coords.push({ x, y: heightMap[idx] - 1, z });
    }
  }
  return coords;
};

export const markResourceDepleted = (chunk: ChunkState, coord: VoxelCoord): ChunkState => {
  const { size, heightMap, resources } = chunk;
  const idx = heightIndex(size, coord.x, coord.z);
  if (!resources[idx]) return chunk;

  const nextHeight = Math.max(1, heightMap[idx] - 1);
  const nextResources = resources.slice();
  nextResources[idx] = false;
  const nextHeightMap = heightMap.slice();
  nextHeightMap[idx] = nextHeight;

  return {
    size,
    heightMap: nextHeightMap,
    resources: nextResources,
  };
};

export const voxelToWorld = (chunk: ChunkState, coord: VoxelCoord): [number, number, number] => {
  const offset = chunk.size / 2;
  const x = coord.x - offset + 0.5;
  const y = coord.y + 0.5;
  const z = coord.z - offset + 0.5;
  return [x, y, z];
};

export const columnKey = (coord: { x: number; z: number }) => `${coord.x}:${coord.z}`;

export const sampleHeightAtWorld = (chunk: ChunkState, wx: number, wz: number): number => {
  const offset = chunk.size / 2;
  const x = Math.floor(wx + offset);
  const z = Math.floor(wz + offset);
  if (x < 0 || z < 0 || x >= chunk.size || z >= chunk.size) return 0;
  return chunk.heightMap[z * chunk.size + x];
};
