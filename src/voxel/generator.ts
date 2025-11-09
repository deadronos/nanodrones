import { Rng } from '../state/rng';
import type { BlockId, ChunkState, VoxelCoord } from '../state/simTypes';

export interface GeneratedWorld {
  chunk: ChunkState;
  resources: VoxelCoord[];
}

const BASE_HEIGHT = 2;
const VARIATION = 3;
const CHUNK_HEIGHT = BASE_HEIGHT + VARIATION + 2;
export const DEFAULT_CHUNK_HEIGHT = CHUNK_HEIGHT;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const columnBlockIndex = (chunk: ChunkState, x: number, y: number, z: number) =>
  y * chunk.size * chunk.size + z * chunk.size + x;
const createChunkBlocks = (size: number, height: number): BlockId[] =>
  new Array(size * height * size).fill('air');

const fillColumnGround = (
  chunk: ChunkState,
  blocks: BlockId[],
  x: number,
  z: number,
  columnHeight: number,
) => {
  const limit = Math.min(columnHeight, chunk.height);
  for (let y = 0; y < limit; y += 1) {
    blocks[columnBlockIndex(chunk, x, y, z)] = 'ground';
  }
};

const findResourceLayer = (chunk: ChunkState, x: number, z: number): number | null => {
  if (x < 0 || z < 0 || x >= chunk.size || z >= chunk.size) return null;
  for (let y = chunk.height - 1; y >= 0; y -= 1) {
    if (chunk.blocks[columnBlockIndex(chunk, x, y, z)] === 'resource') {
      return y;
    }
  }
  return null;
};

export const getColumnHeight = (chunk: ChunkState, x: number, z: number): number => {
  if (x < 0 || z < 0 || x >= chunk.size || z >= chunk.size) return 0;
  for (let y = chunk.height - 1; y >= 0; y -= 1) {
    if (chunk.blocks[columnBlockIndex(chunk, x, y, z)] !== 'air') {
      return y + 1;
    }
  }
  return 0;
};

export const generateChunk = (rng: Rng, size = 16): GeneratedWorld => {
  const chunk: ChunkState = {
    id: { x: 0, z: 0 },
    size,
    height: CHUNK_HEIGHT,
    blocks: createChunkBlocks(size, CHUNK_HEIGHT),
  };
  const resourceCoords: VoxelCoord[] = [];

  for (let z = 0; z < size; z += 1) {
    for (let x = 0; x < size; x += 1) {
      const ridge = Math.sin((x / size) * Math.PI) + Math.cos((z / size) * Math.PI);
      const noise = rng.nextRange(-1, 1);
      const columnHeight = clamp(
        Math.round(BASE_HEIGHT + VARIATION * 0.3 * ridge + VARIATION * 0.5 * noise),
        1,
        BASE_HEIGHT + VARIATION,
      );
      fillColumnGround(chunk, chunk.blocks, x, z, columnHeight);
      const hasResource = rng.next() > 0.6;
      if (hasResource) {
        const resourceY = Math.min(columnHeight - 1, chunk.height - 1);
        chunk.blocks[columnBlockIndex(chunk, x, resourceY, z)] = 'resource';
        resourceCoords.push({ x, y: resourceY, z });
      }
    }
  }

  if (resourceCoords.length === 0) {
    const center = Math.floor(size / 2);
    const columnHeight = Math.max(1, getColumnHeight(chunk, center, center));
    const resourceY = Math.min(columnHeight - 1, chunk.height - 1);
    chunk.blocks[columnBlockIndex(chunk, center, resourceY, center)] = 'resource';
    resourceCoords.push({ x: center, y: resourceY, z: center });
  }

  return {
    chunk,
    resources: resourceCoords,
  };
};

export const listActiveResources = (chunk: ChunkState): VoxelCoord[] => {
  const coords: VoxelCoord[] = [];
  for (let z = 0; z < chunk.size; z += 1) {
    for (let x = 0; x < chunk.size; x += 1) {
      const y = findResourceLayer(chunk, x, z);
      if (y !== null) {
        coords.push({ x, y, z });
      }
    }
  }
  return coords;
};

export const markResourceDepleted = (chunk: ChunkState, coord: VoxelCoord): ChunkState => {
  if (
    coord.x < 0 ||
    coord.z < 0 ||
    coord.x >= chunk.size ||
    coord.z >= chunk.size ||
    coord.y < 0 ||
    coord.y >= chunk.height
  ) {
    return chunk;
  }
  const idx = columnBlockIndex(chunk, coord.x, coord.y, coord.z);
  if (chunk.blocks[idx] !== 'resource') {
    return chunk;
  }
  const columnHeight = getColumnHeight(chunk, coord.x, coord.z);
  if (columnHeight === 0) {
    return chunk;
  }
  const updatedBlocks = chunk.blocks.slice();
  if (columnHeight > 1) {
    updatedBlocks[idx] = 'air';
  } else {
    updatedBlocks[idx] = 'ground';
  }
  return {
    ...chunk,
    blocks: updatedBlocks,
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
  return getColumnHeight(chunk, x, z);
};
