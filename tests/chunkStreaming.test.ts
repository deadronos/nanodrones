import { describe, expect, it } from 'vitest';
import { chunkKey } from '../src/voxel/world';
import {
  createEmptyWorld,
  DEFAULT_CHUNK_SIZE,
  ensureChunksForPosition,
  generateChunk,
} from '../src/voxel/generator';

describe('chunk streaming', () => {
  it('expands the visible window as the player moves', () => {
    const seed = 1234;
    const base = createEmptyWorld(seed);
    const initial = ensureChunksForPosition(base, seed, [0, 0, 0], 1);

    expect(initial.visibleChunkKeys).toContain(chunkKey({ x: 0, z: 0 }));
    expect(initial.meshDiffs.filter((d) => d.type === 'rebuild')).toHaveLength(9);

    const moved = ensureChunksForPosition(initial, seed, [DEFAULT_CHUNK_SIZE * 3, 0, 0], 1);

    expect(moved.visibleChunkKeys).toContain(chunkKey({ x: 3, z: 0 }));
    expect(moved.meshDiffs.some((d) => d.type === 'rebuild' && d.chunkId.x === 3 && d.chunkId.z === 0)).toBe(true);
    expect(moved.meshDiffs.some((d) => d.type === 'remove' && d.chunkId.x === -1 && d.chunkId.z === -1)).toBe(true);
  });

  it('flags existing chunks for rebuild when they come back into view', () => {
    const seed = 9876;
    const base = createEmptyWorld(seed);
    const generated = generateChunk(seed, { x: 0, z: 0 });
    const withChunk = {
      ...base,
      chunks: { [chunkKey({ x: 0, z: 0 })]: generated.chunk },
    };

    const firstView = ensureChunksForPosition(withChunk, seed, [DEFAULT_CHUNK_SIZE * 3, 0, 0], 1);
    const returnView = ensureChunksForPosition(firstView, seed, [0, 0, 0], 1);

    expect(returnView.meshDiffs.some((d) => d.type === 'rebuild' && d.chunkId.x === 0 && d.chunkId.z === 0)).toBe(true);
  });
});
