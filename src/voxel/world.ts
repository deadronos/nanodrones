import type {
  BlockId,
  ChunkId,
  ChunkKey,
  ChunkMeshDiff,
  ChunkState,
  PlacementPreview,
  TargetedVoxel,
  Vec3,
  VoxelCoord,
  WorldState,
} from '../state/simTypes';

export const chunkKey = (id: ChunkId): ChunkKey => `${id.x}:${id.z}`;

export const parseChunkKey = (key: ChunkKey): ChunkId => {
  const [xs, zs] = key.split(':');
  const x = Number(xs ?? 0);
  const z = Number(zs ?? 0);
  return { x: Number.isFinite(x) ? Math.trunc(x) : 0, z: Number.isFinite(z) ? Math.trunc(z) : 0 };
};

export const cloneChunk = (chunk: ChunkState): ChunkState => ({
  ...chunk,
  blocks: chunk.blocks.slice(),
});

export const chunkBlockIndex = (chunk: ChunkState, x: number, y: number, z: number) =>
  y * chunk.size * chunk.size + z * chunk.size + x;

export const isSolidBlock = (block: BlockId) => block !== 'air';

export const getBlockId = (chunk: ChunkState, coord: VoxelCoord): BlockId | null => {
  if (!isInsideChunk(chunk, coord)) return null;
  return chunk.blocks[chunkBlockIndex(chunk, coord.x, coord.y, coord.z)];
};

export const isInsideChunk = (chunk: ChunkState, coord: VoxelCoord) =>
  coord.x >= 0 &&
  coord.x < chunk.size &&
  coord.z >= 0 &&
  coord.z < chunk.size &&
  coord.y >= 0 &&
  coord.y < chunk.height;

export const getColumnHeight = (chunk: ChunkState, x: number, z: number): number => {
  if (x < 0 || z < 0 || x >= chunk.size || z >= chunk.size) return 0;
  for (let y = chunk.height - 1; y >= 0; y -= 1) {
    if (isSolidBlock(chunk.blocks[chunkBlockIndex(chunk, x, y, z)])) {
      return y + 1;
    }
  }
  return 0;
};

const ensureDiff = (diffs: ChunkMeshDiff[], chunk: ChunkId): ChunkMeshDiff[] => {
  const exists = diffs.some((d) => d.chunkId.x === chunk.x && d.chunkId.z === chunk.z);
  return exists ? diffs : [...diffs, { chunkId: chunk, type: 'rebuild' }];
};

const applyChunkUpdate = (world: WorldState, chunk: ChunkState): WorldState => {
  const key = chunkKey(chunk.id);
  return {
    ...world,
    chunks: {
      ...world.chunks,
      [key]: chunk,
    },
    meshDiffs: ensureDiff(world.meshDiffs, chunk.id),
  };
};

export const setBlockInChunk = (chunk: ChunkState, coord: VoxelCoord, block: BlockId): ChunkState => {
  if (!isInsideChunk(chunk, coord)) return chunk;
  const idx = chunkBlockIndex(chunk, coord.x, coord.y, coord.z);
  if (chunk.blocks[idx] === block) return chunk;
  const nextBlocks = chunk.blocks.slice();
  nextBlocks[idx] = block;
  return {
    ...chunk,
    blocks: nextBlocks,
    dirty: true,
  };
};

export const setBlockInWorld = (
  world: WorldState,
  chunkId: ChunkId,
  coord: VoxelCoord,
  block: BlockId,
): WorldState => {
  const key = chunkKey(chunkId);
  const current = world.chunks[key];
  if (!current) return world;
  const updated = setBlockInChunk(current, coord, block);
  if (updated === current) return world;
  return applyChunkUpdate(world, updated);
};

export const markResourceDepleted = (
  world: WorldState,
  chunkId: ChunkId,
  coord: VoxelCoord,
): WorldState => {
  const key = chunkKey(chunkId);
  const chunk = world.chunks[key];
  if (!chunk) return world;
  if (!isInsideChunk(chunk, coord)) return world;
  const idx = chunkBlockIndex(chunk, coord.x, coord.y, coord.z);
  if (chunk.blocks[idx] !== 'resource') return world;
  const columnHeight = getColumnHeight(chunk, coord.x, coord.z);
  const replacement: BlockId = columnHeight > 1 ? 'air' : 'ground';
  return setBlockInWorld(world, chunkId, coord, replacement);
};

export const voxelToWorld = (chunk: ChunkState, coord: VoxelCoord): Vec3 => {
  const half = chunk.size / 2;
  const offsetX = chunk.id.x * chunk.size;
  const offsetZ = chunk.id.z * chunk.size;
  const x = coord.x - half + 0.5 + offsetX;
  const y = coord.y + 0.5;
  const z = coord.z - half + 0.5 + offsetZ;
  return [x, y, z];
};

export interface WorldVoxelCoord {
  chunk: ChunkId;
  voxel: VoxelCoord;
}

export const worldToVoxel = (world: WorldState, position: Vec3): WorldVoxelCoord | null => {
  const [wx, wy, wz] = position;
  const chunkSize = world.chunkSize;
  const half = chunkSize / 2;
  const chunkX = Math.floor((wx + half) / chunkSize);
  const chunkZ = Math.floor((wz + half) / chunkSize);
  const localX = Math.floor(wx - chunkX * chunkSize + half);
  const localZ = Math.floor(wz - chunkZ * chunkSize + half);
  const localY = Math.floor(wy);
  const key = chunkKey({ x: chunkX, z: chunkZ });
  const chunk = world.chunks[key];
  if (!chunk) return null;
  if (localX < 0 || localX >= chunk.size || localZ < 0 || localZ >= chunk.size) return null;
  if (localY < 0 || localY >= chunk.height) return null;
  return {
    chunk: { x: chunkX, z: chunkZ },
    voxel: { x: localX, y: localY, z: localZ },
  };
};

export const sampleHeightAtWorld = (world: WorldState, wx: number, wz: number): number => {
  const coord = worldToVoxel(world, [wx, 0, wz]);
  if (!coord) return 0;
  const chunk = world.chunks[chunkKey(coord.chunk)];
  if (!chunk) return 0;
  return getColumnHeight(chunk, coord.voxel.x, coord.voxel.z);
};

export interface ListedResource {
  chunk: ChunkId;
  voxel: VoxelCoord;
}

export const listActiveResources = (world: WorldState): ListedResource[] => {
  const results: ListedResource[] = [];
  for (const key of Object.keys(world.chunks)) {
    const chunk = world.chunks[key];
    for (let z = 0; z < chunk.size; z += 1) {
      for (let y = 0; y < chunk.height; y += 1) {
        for (let x = 0; x < chunk.size; x += 1) {
          const idx = chunkBlockIndex(chunk, x, y, z);
          if (chunk.blocks[idx] === 'resource') {
            results.push({ chunk: { ...chunk.id }, voxel: { x, y, z } });
          }
        }
      }
    }
  }
  return results;
};

export const columnKey = (chunk: ChunkId, coord: { x: number; z: number }) =>
  `${chunk.x}:${chunk.z}:${coord.x}:${coord.z}`;

const globalFromVoxel = (world: WorldState, chunk: ChunkId, voxel: VoxelCoord) => {
  const chunkSize = world.chunkSize;
  const gx = chunk.x * chunkSize + voxel.x;
  const gz = chunk.z * chunkSize + voxel.z;
  return { gx, gy: voxel.y, gz };
};

const addressFromGlobal = (world: WorldState, gx: number, gy: number, gz: number): WorldVoxelCoord | null => {
  const chunkSize = world.chunkSize;
  const chunkX = Math.floor(gx / chunkSize);
  const chunkZ = Math.floor(gz / chunkSize);
  const localX = gx - chunkX * chunkSize;
  const localZ = gz - chunkZ * chunkSize;
  const key = chunkKey({ x: chunkX, z: chunkZ });
  const chunk = world.chunks[key];
  if (!chunk) return null;
  if (localX < 0 || localX >= chunk.size || localZ < 0 || localZ >= chunk.size) return null;
  if (gy < 0 || gy >= chunk.height) return null;
  return {
    chunk: { x: chunkX, z: chunkZ },
    voxel: { x: localX, y: gy, z: localZ },
  };
};

const cloneAddress = (address: WorldVoxelCoord): WorldVoxelCoord => ({
  chunk: { ...address.chunk },
  voxel: { ...address.voxel },
});

export interface RaycastResult {
  target: TargetedVoxel | null;
  placement: PlacementPreview | null;
}

const normalize = (vec: Vec3): Vec3 => {
  const [x, y, z] = vec;
  const len = Math.sqrt(x * x + y * y + z * z) || 1;
  return [x / len, y / len, z / len];
};

export const raycastWorld = (
  world: WorldState,
  origin: Vec3,
  direction: Vec3,
  maxDistance = 6,
): RaycastResult => {
  const dir = normalize(direction);
  const half = world.chunkSize / 2;
  let x = origin[0] + half;
  let y = origin[1];
  let z = origin[2] + half;

  let gx = Math.floor(x);
  let gy = Math.floor(y);
  let gz = Math.floor(z);

  const stepX = dir[0] > 0 ? 1 : dir[0] < 0 ? -1 : 0;
  const stepY = dir[1] > 0 ? 1 : dir[1] < 0 ? -1 : 0;
  const stepZ = dir[2] > 0 ? 1 : dir[2] < 0 ? -1 : 0;

  const nextBoundary = (pos: number, step: number) =>
    step > 0 ? Math.floor(pos) + 1 : Math.floor(pos);

  const safeDiv = (value: number) => (value === 0 ? Number.POSITIVE_INFINITY : Math.abs(1 / value));

  const tDeltaX = safeDiv(dir[0]);
  const tDeltaY = safeDiv(dir[1]);
  const tDeltaZ = safeDiv(dir[2]);

  let tMaxX =
    stepX !== 0
      ? Math.abs((nextBoundary(x, stepX) - x) / dir[0])
      : Number.POSITIVE_INFINITY;
  let tMaxY =
    stepY !== 0
      ? Math.abs((nextBoundary(y, stepY) - y) / dir[1])
      : Number.POSITIVE_INFINITY;
  let tMaxZ =
    stepZ !== 0
      ? Math.abs((nextBoundary(z, stepZ) - z) / dir[2])
      : Number.POSITIVE_INFINITY;

  let traveled = 0;
  let lastAir: PlacementPreview | null = null;
  let lastNormal: Vec3 = [0, 0, 0];

  const updateNormal = (axis: 0 | 1 | 2, step: number) => {
    if (axis === 0) lastNormal = [-step, 0, 0];
    else if (axis === 1) lastNormal = [0, -step, 0];
    else lastNormal = [0, 0, -step];
  };

  while (traveled <= maxDistance) {
    const address = addressFromGlobal(world, gx, gy, gz);
    if (address) {
      const chunk = world.chunks[chunkKey(address.chunk)];
      const block = getBlockId(chunk, address.voxel);
      if (block && isSolidBlock(block)) {
        return {
          target: {
            chunk: { ...address.chunk },
            voxel: { ...address.voxel },
            normal: [...lastNormal],
          },
          placement: lastAir,
        };
      }
      lastAir = {
        chunk: { ...address.chunk },
        voxel: { ...address.voxel },
      };
    } else {
      lastAir = null;
    }

    if (tMaxX < tMaxY) {
      if (tMaxX < tMaxZ) {
        gx += stepX;
        traveled = tMaxX;
        tMaxX += tDeltaX;
        updateNormal(0, stepX);
      } else {
        gz += stepZ;
        traveled = tMaxZ;
        tMaxZ += tDeltaZ;
        updateNormal(2, stepZ);
      }
    } else if (tMaxY < tMaxZ) {
      gy += stepY;
      traveled = tMaxY;
      tMaxY += tDeltaY;
      updateNormal(1, stepY);
    } else {
      gz += stepZ;
      traveled = tMaxZ;
      tMaxZ += tDeltaZ;
      updateNormal(2, stepZ);
    }
  }

  return { target: null, placement: lastAir };
};

export const clearMeshDiffs = (world: WorldState): WorldState => ({
  ...world,
  meshDiffs: [],
  chunks: Object.fromEntries(
    Object.entries(world.chunks).map(([key, chunk]) => [key, { ...chunk, dirty: false }]),
  ),
});

