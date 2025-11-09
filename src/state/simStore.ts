import { create } from 'zustand';
import { runSimTick, findNearestResource } from '../ecs/engine';
import { createInitialState, DEFAULT_SEED } from './initialState';
import { loadSim, saveSim } from './persistence';
import type { MineOrder, SimState } from './simTypes';

const FIXED_DT = 1 / 60;
const PERSIST_INTERVAL = 60; // once per simulated second

export interface CameraOrbitState {
  theta: number;
  phi: number;
  distance: number;
}

export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
}

export interface SimStore extends SimState {
  paused: boolean;
  accumulator: number;
  lastPersistedTick: number;
  camera: CameraOrbitState;
  input: InputState;
  advance(dt: number): void;
  togglePause(): void;
  issueMineOrder(): void;
  setInput(input: Partial<InputState>): void;
  setCamera(theta: number, phi: number, distance?: number): void;
  reset(seed?: number): void;
}

const defaultInput: InputState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
};

const defaultCamera: CameraOrbitState = {
  theta: Math.PI / 4,
  phi: Math.PI / 3,
  distance: 10,
};

const pickSimState = (state: SimState): SimState => ({
  seed: state.seed,
  rngSeed: state.rngSeed,
  tick: state.tick,
  world: state.world,
  player: state.player,
  drones: state.drones,
  orders: state.orders,
  orderCounter: state.orderCounter,
});

const shouldPersist = (tick: number, lastPersistedTick: number) =>
  tick - lastPersistedTick >= PERSIST_INTERVAL;

export const useSimStore = create<SimStore>()((set, get) => {
  const persisted = loadSim();
  const initialSim = persisted ?? createInitialState(DEFAULT_SEED);

  const initial: SimStore = {
    ...initialSim,
    paused: false,
    accumulator: 0,
    lastPersistedTick: initialSim.tick,
    camera: { ...defaultCamera },
    input: { ...defaultInput },
    advance: (dt: number) => {
      const state = get();
      if (state.paused) return;
      let accumulator = state.accumulator + dt;
      let simState: SimState = pickSimState(state);
      while (accumulator >= FIXED_DT) {
        simState = runSimTick(simState, {
          input: state.input,
          heading: state.camera.theta,
          dt: FIXED_DT,
        });
        accumulator -= FIXED_DT;
      }
      const next: SimStore = {
        ...state,
        ...simState,
        accumulator,
      };
      set(next);
      if (shouldPersist(simState.tick, state.lastPersistedTick)) {
        saveSim(pickSimState(simState));
        set({ lastPersistedTick: simState.tick });
      }
    },
    togglePause: () => {
      set((current) => ({ ...current, paused: !current.paused }));
    },
    issueMineOrder: () => {
      set((current) => {
        const simState = pickSimState(current);
        const candidate = findNearestResource(
          simState,
          simState.orders as MineOrder[],
          simState.player.position,
        );
        if (!candidate) return current;
        const order: MineOrder = {
          id: `order-${simState.orderCounter + 1}`,
          type: 'mine',
          target: candidate,
          status: 'pending',
        };
        const nextOrders = [...simState.orders, order];
        const next = {
          ...current,
          orders: nextOrders,
          orderCounter: simState.orderCounter + 1,
        };
        saveSim(pickSimState(next));
        return next;
      });
    },
    setInput: (input: Partial<InputState>) => {
      set((current) => ({
        ...current,
        input: { ...current.input, ...input },
      }));
    },
    setCamera: (theta: number, phi: number, distance?: number) => {
      const clampedPhi = Math.min(Math.max(phi, 0.2), Math.PI - 0.2);
      set((current) => ({
        ...current,
        camera: {
          theta,
          phi: clampedPhi,
          distance: distance ?? current.camera.distance,
        },
      }));
    },
    reset: (seed?: number) => {
      const nextSim = createInitialState(seed ?? DEFAULT_SEED);
      saveSim(nextSim);
      set((current) => ({
        ...current,
        ...nextSim,
        paused: false,
        accumulator: 0,
        lastPersistedTick: nextSim.tick,
        camera: { ...defaultCamera },
        input: { ...defaultInput },
      }));
    },
  };

  return initial;
});
