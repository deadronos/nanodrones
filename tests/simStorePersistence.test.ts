import { describe, it, expect, beforeEach } from 'vitest';
import { useSimStore, createSim } from '../src/state/simStore';

const STORAGE_KEY = 'nano-drones-save';

describe('sim store snapshot & stepping', () => {
  beforeEach(() => {
    // clear persisted state between tests
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  });

  it('getSnapshot and loadSnapshot roundtrip', () => {
    const store = useSimStore.getState();
    store.reset(4242);
    const snap = store.getSnapshot();
    expect(snap.state.seed).toBe(4242);
    // mutate store by issuing an order
    store.issueMineOrder();
    const mutated = store.getSnapshot();
    expect(mutated.state.orders.length).toBeGreaterThanOrEqual(1);
    // load original snapshot
    store.loadSnapshot(snap);
    const after = store.getSnapshot();
    expect(after.state.seed).toBe(4242);
    expect(after.state.orders.length).toBe(0);
  });

  it('stepOnce advances tick by one', () => {
    useSimStore.getState().reset(1111);
    const before = useSimStore.getState().tick;
    useSimStore.getState().stepOnce();
    const after = useSimStore.getState().tick;
    expect(after).toBe(before + 1);
  });
});
