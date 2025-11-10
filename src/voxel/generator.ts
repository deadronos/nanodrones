import { Rng } from '../state/rng';
import type {
  ChunkId,
  ChunkKey,
  ChunkMeshDiff,
  ChunkState,
  VoxelCoord,
  WorldState,
} from '../state/simTypes';
import { chunkBlockIndex, chunkKey, getColumnHeight } from './world';
import { cloneChunk } from './world';

const BASE_HEIGHT = 2;
const VARIATION = 3;
const EXTRA_HEADROOM = 2;

export const DEFAULT_CHUNK_SIZE = 16;
export const DEFAULT_CHUNK_HEIGHT = BASE_HEIGHT + VARIATION + EXTRA_HEADROOM;
export const DEFAULT_CHUNK_RADIUS = 1;

export interface GeneratedChunk {
  chunk: ChunkState;
  resources: VoxelCoord[];
}

const createChunkBlocks = (size: number, height: number) => new Array(size * height * size).fill('air');

const deriveChunkSeed = (seed: number, id: ChunkId) => {
  const h1 = (id.x * 73856093) ^ (id.z * 19349663);
  return (seed ^ h1) >>> 0;
};

const fillColumnGround = (chunk: ChunkState, blocks: string[], x: number, z: number, columnHeight: number) => {
  const limit = Math.min(columnHeight, chunk.height);
  for (let y = 0; y < limit; y += 1) {
    blocks[chunkBlockIndex(chunk, x, y, z)] = 'ground';
  }
};

const ensureResourceInColumn = (chunk: ChunkState, blocks: string[], coord: VoxelCoord) => {
  const idx = chunkBlockIndex(chunk, coord.x, coord.y, coord.z);
  blocks[idx] = 'resource';
};

export const generateChunk = (
  seed: number,
  id: ChunkId,
  size = DEFAULT_CHUNK_SIZE,
  height = DEFAULT_CHUNK_HEIGHT,
): GeneratedChunk => {
  const rng = new Rng(deriveChunkSeed(seed, id));
  const chunk: ChunkState = {
    id,
    size,
    height,
    blocks: createChunkBlocks(size, height),
    dirty: false,
  };

  const resourceCoords: VoxelCoord[] = [];

  for (let z = 0; z < size; z += 1) {
    for (let x = 0; x < size; x += 1) {
      const ridge = Math.sin((x / size) * Math.PI) + Math.cos((z / size) * Math.PI);
      const noise = rng.nextRange(-1, 1);
      const columnHeight = Math.max(
        1,
        Math.min(Math.round(BASE_HEIGHT + VARIATION * 0.3 * ridge + VARIATION * 0.5 * noise), BASE_HEIGHT + VARIATION),
      );
      fillColumnGround(chunk, chunk.blocks, x, z, columnHeight);
      const hasResource = rng.next() > 0.6;
      if (hasResource) {
        const resourceY = Math.min(columnHeight - 1, chunk.height - 1);
        ensureResourceInColumn(chunk, chunk.blocks, { x, y: resourceY, z });
        resourceCoords.push({ x, y: resourceY, z });
      }
    }
  }

  if (resourceCoords.length === 0) {
    const center = Math.floor(size / 2);
    const columnHeight = Math.max(1, getColumnHeight(chunk, center, center));
    const resourceY = Math.min(columnHeight - 1, chunk.height - 1);
    ensureResourceInColumn(chunk, chunk.blocks, { x: center, y: resourceY, z: center });
    resourceCoords.push({ x: center, y: resourceY, z: center });
  }

  return {
    chunk,
    resources: resourceCoords,
  };
};

export interface GeneratedWorldResult {
  world: WorldState;
  resources: Map<ChunkKey, VoxelCoord[]>;
}

export const generateWorld = (
  seed: number,
  radius = DEFAULT_CHUNK_RADIUS,
  size = DEFAULT_CHUNK_SIZE,
  height = DEFAULT_CHUNK_HEIGHT,
): GeneratedWorldResult => {
  const chunks: Record<ChunkKey, ChunkState> = {};
  const visibleKeys: ChunkKey[] = [];
  const meshDiffs: ChunkMeshDiff[] = [];
  const resources = new Map<ChunkKey, VoxelCoord[]>();

  for (let cz = -radius; cz <= radius; cz += 1) {
    for (let cx = -radius; cx <= radius; cx += 1) {
      const id = { x: cx, z: cz } satisfies ChunkId;
      const generated = generateChunk(seed, id, size, height);
      const key = chunkKey(id);
      chunks[key] = generated.chunk;
      visibleKeys.push(key);
      meshDiffs.push({ chunkId: id, type: 'rebuild' });
      resources.set(key, generated.resources);
    }
  }

  const world: WorldState = {
    seed,
    chunkSize: size,
    chunkHeight: height,
    chunks,
    visibleChunkKeys: visibleKeys,
    meshDiffs,
  };

  return { world, resources };
};

export { listActiveResources, markResourceDepleted, sampleHeightAtWorld, voxelToWorld, columnKey, getColumnHeight } from './world';

export const cloneWorldChunks = (world: WorldState): Record<ChunkKey, ChunkState> => {
  const entries = Object.entries(world.chunks).map(([key, chunk]) => [key, cloneChunk(chunk)] as const);
  return Object.fromEntries(entries);
};

