import { describe, it, expect, beforeEach } from 'vitest';
import { useSimStore } from '../../src/state/simStore';
import { saveSnapshot, loadSnapshot, sanitizeForPersistence } from '../../src/state/persistence';

const STORAGE_KEY = 'nano-drones-save-test-integration';

describe('Integration: sim persistence roundtrip', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  });

  it('save at checkpoint and continue after load produces identical state', () => {
    const store = useSimStore.getState();
    // Sequence A: reset, issue order, step K, save, step L more
    store.reset(4242);
    store.issueMineOrder();
    const K = 2;
    for (let i = 0; i < K; i++) store.stepOnce();
    const snapshot = store.getSnapshot();
    // persist to localStorage under test key
    saveSnapshot(snapshot, STORAGE_KEY);

    const L = 3;
    for (let i = 0; i < L; i++) store.stepOnce();
    const finalA = store.getSnapshot().state;

    // Sequence B: reset fresh, issue order, load snapshot from storage, then step L
    store.reset(4242);
    store.issueMineOrder();
    const loaded = loadSnapshot(STORAGE_KEY);
    expect(loaded).not.toBeNull();
    if (!loaded) return;
    store.loadSnapshot(loaded);
    for (let i = 0; i < L; i++) store.stepOnce();
    const finalB = store.getSnapshot().state;

    expect(sanitizeForPersistence(finalA)).toEqual(sanitizeForPersistence(finalB));
  });
});
