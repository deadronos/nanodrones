import type { ChunkState } from '../state/simTypes';

export interface MeshData {
  positions: number[];
  normals: number[];
  uvs: number[];
  indices: number[];
}

const addFace = (
  data: MeshData,
  vertices: [number, number, number, number, number, number, number, number, number, number, number, number],
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

const heightAt = (chunk: ChunkState, x: number, z: number): number => {
  if (x < 0 || z < 0 || x >= chunk.size || z >= chunk.size) return 0;
  return chunk.heightMap[z * chunk.size + x];
};

export const buildChunkMesh = (chunk: ChunkState): MeshData => {
  const data: MeshData = {
    positions: [],
    normals: [],
    uvs: [],
    indices: [],
  };

  const half = chunk.size / 2;

  for (let z = 0; z < chunk.size; z += 1) {
    for (let x = 0; x < chunk.size; x += 1) {
      const height = heightAt(chunk, x, z);
      if (height <= 0) continue;
      const baseX = x - half;
      const baseZ = z - half;
      const x0 = baseX;
      const x1 = baseX + 1;
      const z0 = baseZ;
      const z1 = baseZ + 1;

      // top face
      addFace(
        data,
        [
          x0,
          height,
          z0,
          x1,
          height,
          z0,
          x1,
          height,
          z1,
          x0,
          height,
          z1,
        ],
        [0, 1, 0],
      );

      const neighbors: Array<{
        dx: number;
        dz: number;
        normal: [number, number, number];
        vertices: () => [number, number, number, number, number, number, number, number, number, number, number, number];
      }> = [
        {
          dx: 1,
          dz: 0,
          normal: [1, 0, 0],
          vertices: () => {
            const neighborHeight = heightAt(chunk, x + 1, z);
            const y0 = neighborHeight;
            return [
              x1,
              y0,
              z0,
              x1,
              height,
              z0,
              x1,
              height,
              z1,
              x1,
              y0,
              z1,
            ];
          },
        },
        {
          dx: -1,
          dz: 0,
          normal: [-1, 0, 0],
          vertices: () => {
            const neighborHeight = heightAt(chunk, x - 1, z);
            const y0 = neighborHeight;
            return [
              x0,
              y0,
              z1,
              x0,
              height,
              z1,
              x0,
              height,
              z0,
              x0,
              y0,
              z0,
            ];
          },
        },
        {
          dx: 0,
          dz: 1,
          normal: [0, 0, 1],
          vertices: () => {
            const neighborHeight = heightAt(chunk, x, z + 1);
            const y0 = neighborHeight;
            return [
              x1,
              y0,
              z1,
              x1,
              height,
              z1,
              x0,
              height,
              z1,
              x0,
              y0,
              z1,
            ];
          },
        },
        {
          dx: 0,
          dz: -1,
          normal: [0, 0, -1],
          vertices: () => {
            const neighborHeight = heightAt(chunk, x, z - 1);
            const y0 = neighborHeight;
            return [
              x0,
              y0,
              z0,
              x0,
              height,
              z0,
              x1,
              height,
              z0,
              x1,
              y0,
              z0,
            ];
          },
        },
      ];

      neighbors.forEach(({ dx, dz, vertices, normal }) => {
        const neighborHeight = heightAt(chunk, x + dx, z + dz);
        if (neighborHeight >= height) return;
        addFace(data, vertices(), normal);
      });

      // bottom face to seal overhangs if height > 0 and neighbor < 0
      addFace(
        data,
        [
          x0,
          0,
          z1,
          x1,
          0,
          z1,
          x1,
          0,
          z0,
          x0,
          0,
          z0,
        ],
        [0, -1, 0],
      );
    }
  }

  return data;
};
