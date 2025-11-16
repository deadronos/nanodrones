import type { ChunkState, WorldState } from '../src/state/simTypes';
import { buildChunkMesh } from '../src/voxel/mesher';
import { chunkKey } from '../src/voxel/world';

const singleBlockWorld = (): { world: WorldState; chunk: ChunkState } => {
  const chunk: ChunkState = {
    id: { x: 0, z: 0 },
    size: 1,
    height: 1,
    blocks: ['ground'],
    dirty: false,
  };

  const world: WorldState = {
    seed: 1,
    chunkSize: 1,
    chunkHeight: 1,
    chunks: {
      [chunkKey(chunk.id)]: chunk,
    },
    visibleChunkKeys: [],
    meshDiffs: [],
  };

  return { world, chunk };
};

const triangleNormal = (positions: number[], indices: number[], triangleStart: number) => {
  const idx0 = indices[triangleStart] * 3;
  const idx1 = indices[triangleStart + 1] * 3;
  const idx2 = indices[triangleStart + 2] * 3;

  const ax = positions[idx0];
  const ay = positions[idx0 + 1];
  const az = positions[idx0 + 2];
  const bx = positions[idx1];
  const by = positions[idx1 + 1];
  const bz = positions[idx1 + 2];
  const cx = positions[idx2];
  const cy = positions[idx2 + 1];
  const cz = positions[idx2 + 2];

  const e1x = bx - ax;
  const e1y = by - ay;
  const e1z = bz - az;
  const e2x = cx - ax;
  const e2y = cy - ay;
  const e2z = cz - az;

  return {
    x: e1y * e2z - e1z * e2y,
    y: e1z * e2x - e1x * e2z,
    z: e1x * e2y - e1y * e2x,
  };
};

describe('buildChunkMesh', () => {
  it('creates a closed cube for a single solid voxel', () => {
    const { world, chunk } = singleBlockWorld();
    const mesh = buildChunkMesh(world, chunk);

    expect(mesh.positions).toHaveLength(72);
    expect(mesh.indices).toHaveLength(36);

    const topNormal = triangleNormal(mesh.positions, mesh.indices, 0);
    const bottomNormal = triangleNormal(mesh.positions, mesh.indices, 6);

    expect(topNormal.y).toBeGreaterThan(0);
    expect(bottomNormal.y).toBeLessThan(0);
  });
});
