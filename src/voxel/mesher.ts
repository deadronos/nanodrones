import type { BlockId, ChunkState, WorldState } from '../state/simTypes';
import { chunkBlockIndex, chunkKey, getBlockId, isSolidBlock } from './world';

export interface MeshData {
  positions: number[];
  normals: number[];
  uvs: number[];
  indices: number[];
}

const addFace = (
  data: MeshData,
  vertices: [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ],
  normal: [number, number, number],
) => {
  const start = data.positions.length / 3;
  data.positions.push(...vertices);
  for (let i = 0; i < 4; i += 1) {
    data.normals.push(normal[0], normal[1], normal[2]);
    data.uvs.push(i === 1 || i === 2 ? 1 : 0, i >= 2 ? 1 : 0);
  }
  data.indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
};

const neighborBlock = (
  world: WorldState,
  chunk: ChunkState,
  x: number,
  y: number,
  z: number,
): BlockId | null => {
  if (x >= 0 && x < chunk.size && z >= 0 && z < chunk.size && y >= 0 && y < chunk.height) {
    return chunk.blocks[chunkBlockIndex(chunk, x, y, z)];
  }

  const offsetChunk = { x: chunk.id.x, z: chunk.id.z };
  let localX = x;
  let localZ = z;

  if (x < 0) {
    offsetChunk.x -= 1;
    localX = chunk.size + x;
  } else if (x >= chunk.size) {
    offsetChunk.x += 1;
    localX = x - chunk.size;
  }

  if (z < 0) {
    offsetChunk.z -= 1;
    localZ = chunk.size + z;
  } else if (z >= chunk.size) {
    offsetChunk.z += 1;
    localZ = z - chunk.size;
  }

  const neighbor = world.chunks[chunkKey(offsetChunk)];
  if (!neighbor) return null;
  if (localX < 0 || localX >= neighbor.size || localZ < 0 || localZ >= neighbor.size) return null;
  if (y < 0 || y >= neighbor.height) return null;
  return neighbor.blocks[chunkBlockIndex(neighbor, localX, y, localZ)];
};

export const buildChunkMesh = (world: WorldState, chunk: ChunkState): MeshData => {
  const data: MeshData = {
    positions: [],
    normals: [],
    uvs: [],
    indices: [],
  };

  const half = chunk.size / 2;

  for (let z = 0; z < chunk.size; z += 1) {
    for (let y = 0; y < chunk.height; y += 1) {
      for (let x = 0; x < chunk.size; x += 1) {
        const block = chunk.blocks[chunkBlockIndex(chunk, x, y, z)];
        if (!isSolidBlock(block)) continue;

        const baseX = x - half;
        const baseZ = z - half;
        const x0 = baseX;
        const x1 = baseX + 1;
        const y0 = y;
        const y1 = y + 1;
        const z0 = baseZ;
        const z1 = baseZ + 1;

        const faces = [
          {
            normal: [0, 1, 0] as [number, number, number],
            neighbor: neighborBlock(world, chunk, x, y + 1, z),
            vertices: [x0, y1, z0, x1, y1, z0, x1, y1, z1, x0, y1, z1],
          },
          {
            normal: [0, -1, 0] as [number, number, number],
            neighbor: neighborBlock(world, chunk, x, y - 1, z),
            vertices: [x0, y0, z1, x1, y0, z1, x1, y0, z0, x0, y0, z0],
          },
          {
            normal: [1, 0, 0] as [number, number, number],
            neighbor: neighborBlock(world, chunk, x + 1, y, z),
            vertices: [x1, y0, z0, x1, y1, z0, x1, y1, z1, x1, y0, z1],
          },
          {
            normal: [-1, 0, 0] as [number, number, number],
            neighbor: neighborBlock(world, chunk, x - 1, y, z),
            vertices: [x0, y0, z1, x0, y1, z1, x0, y1, z0, x0, y0, z0],
          },
          {
            normal: [0, 0, 1] as [number, number, number],
            neighbor: neighborBlock(world, chunk, x, y, z + 1),
            vertices: [x1, y0, z1, x1, y1, z1, x0, y1, z1, x0, y0, z1],
          },
          {
            normal: [0, 0, -1] as [number, number, number],
            neighbor: neighborBlock(world, chunk, x, y, z - 1),
            vertices: [x0, y0, z0, x0, y1, z0, x1, y1, z0, x1, y0, z0],
          },
        ];

        faces.forEach((face) => {
          if (!face.neighbor || !isSolidBlock(face.neighbor)) {
            addFace(data, face.vertices, face.normal);
          }
        });
      }
    }
  }

  return data;
};
