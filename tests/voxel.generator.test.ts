import { describe, it, expect } from 'vitest';
import { Rng } from '../src/state/rng';
import { generateChunk } from '../src/voxel/generator';

describe('voxel generator', () => {
  it('produces deterministic chunk data for the same seed', () => {
    const seed = 12345;
    const chunkA = generateChunk(new Rng(seed));
    const chunkB = generateChunk(new Rng(seed));
    expect(chunkA).toEqual(chunkB);
  });
});
