import { describe, it, expect } from 'vitest';
import { generateChunk } from '../src/voxel/generator';

describe('voxel generator', () => {
  it('produces deterministic chunk data for the same seed', () => {
    const seed = 12345;
    const chunkA = generateChunk(seed, { x: 0, z: 0 });
    const chunkB = generateChunk(seed, { x: 0, z: 0 });
    expect(chunkA).toEqual(chunkB);
  });
});
