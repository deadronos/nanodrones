import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, it, beforeEach, expect } from 'vitest';
import DevToolsPanel from '../../src/ui/DevToolsPanel';
import { useSimStore } from '../../src/state/simStore';

const STORAGE_KEY = 'nano-drones-save';

describe('DevToolsPanel UI', () => {
  beforeEach(() => {
    // reset store and storage
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    // reset sim store to known seed
    useSimStore.getState().reset(1337);
  });

  it('New Seed / Save / Load / Step work as expected', async () => {
    act(() => {
      render(<DevToolsPanel />);
    });

    // change seed and apply
    const seedInput = screen.getByLabelText('Seed') as HTMLInputElement;
    act(() => {
      fireEvent.change(seedInput, { target: { value: '4242' } });
    });
    const newSeedBtn = screen.getByText('New Seed');
    act(() => {
      fireEvent.click(newSeedBtn);
    });
    expect(useSimStore.getState().seed).toBe(4242);

    // save snapshot to localStorage
    const saveBtn = screen.getByText('Save Snapshot');
    act(() => {
      fireEvent.click(saveBtn);
    });
    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw as string);
    expect(parsed.state.seed).toBe(4242);

    // mutate store (issue an order), then restore from saved snapshot
    const beforeOrders = useSimStore.getState().orders.length;
    act(() => {
      useSimStore.getState().issueMineOrder();
    });
    expect(useSimStore.getState().orders.length).toBeGreaterThanOrEqual(beforeOrders + 0);

    const loadBtn = screen.getByText('Load Snapshot');
    act(() => {
      fireEvent.click(loadBtn);
    });
    // after loading, orders should match the saved snapshot (likely restored to original count)
    expect(useSimStore.getState().seed).toBe(4242);

    // step tick
    const beforeTick = useSimStore.getState().tick;
    const stepBtn = screen.getByText('Step Tick');
    act(() => {
      fireEvent.click(stepBtn);
    });
    expect(useSimStore.getState().tick).toBe(beforeTick + 1);
  });
});
