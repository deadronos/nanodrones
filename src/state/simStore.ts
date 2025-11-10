import { create } from 'zustand';
import { runSimTick, findNearestResource } from '../ecs/engine';
import { createInitialState, DEFAULT_SEED } from './initialState';
import { loadSim, saveSim, saveSnapshot, loadSnapshot, CURRENT_VERSION } from './persistence';
import type { InputState, MineOrder, SimAction, SimState, Snapshot, Order } from './simTypes';
import { clearMeshDiffs } from '../voxel/world';

const FIXED_DT = 1 / 60;
const PERSIST_INTERVAL = 60; // once per simulated second

export interface CameraOrbitState {
  theta: number;
  phi: number;
  distance: number;
}

export interface SimStore extends SimState {
  paused: boolean;
  accumulator: number;
  lastPersistedTick: number;
  camera: CameraOrbitState;
  input: InputState;
  pendingActions: SimAction[];
  advance(dt: number): void;
  togglePause(): void;
  issueMineOrder(): void;
  setInput(input: Partial<InputState>): void;
  setCamera(theta: number, phi: number, distance?: number): void;
  reset(seed?: number): void;
  getSnapshot(): Snapshot;
  loadSnapshot(snapshot: Snapshot): void;
  stepOnce(): void;
  applyCommand(cmd: Order): void;
  triggerBreak(): void;
  triggerPlace(): void;
  cycleHotbar(direction: -1 | 1): void;
  selectHotbar(index: number): void;
  toggleDevFlag(flag: 'devCreative' | 'devFly' | 'devNoclip'): void;
  acknowledgeMeshDiffs(): void;
}

const defaultInput: InputState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  ascend: false,
  descend: false,
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
  interaction: state.interaction,
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
    pendingActions: [],
    advance: (dt: number) => {
      const state = get();
      if (state.paused) return;
      let accumulator = state.accumulator + dt;
      let simState: SimState = {
        ...pickSimState(state),
        player: { ...state.player, yaw: state.camera.theta, pitch: state.camera.phi },
      };
      let pending = state.pendingActions;
      while (accumulator >= FIXED_DT) {
        simState = runSimTick(simState, {
          input: state.input,
          heading: state.camera.theta,
          dt: FIXED_DT,
          actions: pending,
          cameraPhi: state.camera.phi,
        });
        accumulator -= FIXED_DT;
        pending = [];
      }
      const next: SimStore = {
        ...state,
        ...simState,
        accumulator,
        pendingActions: [],
      };
      set(next);
      if (shouldPersist(simState.tick, state.lastPersistedTick)) {
        saveSim(pickSimState(simState));
        set({ lastPersistedTick: simState.tick });
      }
    },
    getSnapshot: () => {
      const state = get();
      return {
        version: CURRENT_VERSION as number,
        createdAt: new Date().toISOString(),
        state: pickSimState(state),
      } as Snapshot;
    },
    loadSnapshot: (snapshot: Snapshot) => {
      const s = snapshot.state;
      set((current) => ({
        ...current,
        ...s,
        paused: false,
        accumulator: 0,
        lastPersistedTick: s.tick,
        pendingActions: [],
        player: {
          ...s.player,
          devCreative: false,
          devFly: false,
          devNoclip: false,
        },
      }));
    },
    stepOnce: () => {
      set((current) => {
        const simState: SimState = {
          ...pickSimState(current),
          player: { ...current.player, yaw: current.camera.theta, pitch: current.camera.phi },
        };
        const nextSim = runSimTick(simState, {
          input: current.input,
          heading: current.camera.theta,
          dt: FIXED_DT,
          actions: current.pendingActions,
          cameraPhi: current.camera.phi,
        });
        const next: SimStore = {
          ...current,
          ...nextSim,
          pendingActions: [],
        };
        // persist after single step
        saveSim(pickSimState(nextSim));
        return next;
      });
    },
    applyCommand: (cmd: Order) => {
      set((current) => {
        const simState = pickSimState(current);
        const id = (cmd as any).id ?? `order-${simState.orderCounter + 1}`;
        const order: MineOrder = {
          id,
          type: 'mine',
          // @ts-ignore - assume cmd has target
          target: (cmd as any).target,
          chunk: (cmd as any).chunk ?? { x: 0, z: 0 },
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
          target: { x: candidate.x, y: candidate.y, z: candidate.z },
          chunk: { x: candidate.chunk.x, z: candidate.chunk.z },
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
        player: {
          ...current.player,
          yaw: theta,
          pitch: clampedPhi,
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
        pendingActions: [],
      }));
    },
    triggerBreak: () => {
      set((current) => ({
        ...current,
        pendingActions: [...current.pendingActions, { type: 'break-block' }],
      }));
    },
    triggerPlace: () => {
      set((current) => ({
        ...current,
        pendingActions: [...current.pendingActions, { type: 'place-block' }],
      }));
    },
    cycleHotbar: (direction: -1 | 1) => {
      set((current) => ({
        ...current,
        pendingActions: [...current.pendingActions, { type: 'cycle-hotbar', direction }],
      }));
    },
    selectHotbar: (index: number) => {
      set((current) => ({
        ...current,
        player: {
          ...current.player,
          hotbar: {
            ...current.player.hotbar,
            activeIndex: Math.max(0, Math.min(index, current.player.hotbar.slots.length - 1)),
          },
        },
      }));
    },
    toggleDevFlag: (flag: 'devCreative' | 'devFly' | 'devNoclip') => {
      set((current) => ({
        ...current,
        player: { ...current.player, [flag]: !current.player[flag] },
      }));
    },
    acknowledgeMeshDiffs: () => {
      set((current) => ({
        ...current,
        world: clearMeshDiffs(current.world),
      }));
    },
  };

  return initial;
});

export const createSim = (seed?: number) => createInitialState(seed);
