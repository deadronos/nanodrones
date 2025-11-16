import { Rng } from '../state/rng';
import type {
  ChunkId,
  ChunkKey,
  ChunkMeshDiff,
  ChunkState,
  Vec3,
  VoxelCoord,
  WorldState,
} from '../state/simTypes';
import { chunkBlockIndex, chunkKey, getColumnHeight, parseChunkKey } from './world';
import { cloneChunk } from './world';

const BASE_HEIGHT = 2;
const VARIATION = 3;
const EXTRA_HEADROOM = 2;

export const DEFAULT_CHUNK_SIZE = 16;
export const DEFAULT_CHUNK_HEIGHT = BASE_HEIGHT + VARIATION + EXTRA_HEADROOM;
export const DEFAULT_CHUNK_RADIUS = 2;

export interface GeneratedChunk {
  chunk: ChunkState;
  resources: VoxelCoord[];
}

const appendDiff = (diffs: ChunkMeshDiff[], diff: ChunkMeshDiff): ChunkMeshDiff[] => {
  const exists = diffs.some(
    (entry) => entry.type === diff.type && entry.chunkId.x === diff.chunkId.x && entry.chunkId.z === diff.chunkId.z,
  );
  return exists ? diffs : [...diffs, diff];
};

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

export const createEmptyWorld = (
  seed: number,
  size = DEFAULT_CHUNK_SIZE,
  height = DEFAULT_CHUNK_HEIGHT,
): WorldState => ({
  seed,
  chunkSize: size,
  chunkHeight: height,
  chunks: {},
  visibleChunkKeys: [],
  meshDiffs: [],
});

const resourcesInChunk = (chunk: ChunkState): VoxelCoord[] => {
  const coords: VoxelCoord[] = [];
  for (let z = 0; z < chunk.size; z += 1) {
    for (let y = 0; y < chunk.height; y += 1) {
      for (let x = 0; x < chunk.size; x += 1) {
        const idx = chunkBlockIndex(chunk, x, y, z);
        if (chunk.blocks[idx] === 'resource') {
          coords.push({ x, y, z });
        }
      }
    }
  }
  return coords;
};

const chunkIdFromPosition = (chunkSize: number, position: Vec3): ChunkId => {
  const half = chunkSize / 2;
  const chunkX = Math.floor((position[0] + half) / chunkSize);
  const chunkZ = Math.floor((position[2] + half) / chunkSize);
  return { x: chunkX, z: chunkZ } satisfies ChunkId;
};

const desiredChunkIds = (center: ChunkId, radius: number): ChunkId[] => {
  const ids: ChunkId[] = [];
  for (let z = center.z - radius; z <= center.z + radius; z += 1) {
    for (let x = center.x - radius; x <= center.x + radius; x += 1) {
      ids.push({ x, z });
    }
  }
  return ids;
};

export const ensureChunksForPosition = (
  world: WorldState,
  seed: number,
  position: Vec3,
  radius = DEFAULT_CHUNK_RADIUS,
): WorldState => {
  const centerChunk = chunkIdFromPosition(world.chunkSize, position);
  const neededIds = desiredChunkIds(centerChunk, radius);
  const neededKeys = new Set(neededIds.map((id) => chunkKey(id)));
  const previousVisible = new Set(world.visibleChunkKeys);

  let nextChunks = world.chunks;
  let nextMeshDiffs = world.meshDiffs;
  let changed = false;

  for (const id of neededIds) {
    const key = chunkKey(id);
    const existing = nextChunks[key];
    if (!existing) {
      const generated = generateChunk(seed, id, world.chunkSize, world.chunkHeight);
      nextChunks = { ...nextChunks, [key]: generated.chunk };
      nextMeshDiffs = appendDiff(nextMeshDiffs, { chunkId: id, type: 'rebuild' });
      changed = true;
    } else if (!previousVisible.has(key)) {
      nextMeshDiffs = appendDiff(nextMeshDiffs, { chunkId: id, type: 'rebuild' });
    }
  }

  const nextVisibleKeys: ChunkKey[] = neededIds.map((id) => chunkKey(id));
  const removed = world.visibleChunkKeys.filter((key) => !neededKeys.has(key));
  if (removed.length > 0) {
    removed.forEach((key) => {
      nextMeshDiffs = appendDiff(nextMeshDiffs, { chunkId: parseChunkKey(key), type: 'remove' });
    });
    changed = true;
  }

  if (!changed && nextVisibleKeys.length === world.visibleChunkKeys.length) {
    const same = nextVisibleKeys.every((key, idx) => key === world.visibleChunkKeys[idx]);
    if (same && nextMeshDiffs === world.meshDiffs) {
      return world;
    }
  }

  return {
    ...world,
    chunks: nextChunks,
    visibleChunkKeys: nextVisibleKeys,
    meshDiffs: nextMeshDiffs,
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
  const baseWorld = createEmptyWorld(seed, size, height);
  const world = ensureChunksForPosition(baseWorld, seed, [0, 0, 0], radius);
  const resources = new Map<ChunkKey, VoxelCoord[]>();

  world.visibleChunkKeys.forEach((key) => {
    const chunk = world.chunks[key];
    if (!chunk) return;
    const coords = resourcesInChunk(chunk);
    if (coords.length > 0) {
      resources.set(key, coords);
    }
  });

  return { world, resources };
};

export { listActiveResources, markResourceDepleted, sampleHeightAtWorld, voxelToWorld, columnKey, getColumnHeight } from './world';

export const cloneWorldChunks = (world: WorldState): Record<ChunkKey, ChunkState> => {
  const entries = Object.entries(world.chunks).map(([key, chunk]) => [key, cloneChunk(chunk)] as const);
  return Object.fromEntries(entries);
};

