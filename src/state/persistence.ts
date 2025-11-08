import { createInitialState, DEFAULT_SEED } from './initialState';
import type { SimState } from './simTypes';

const STORAGE_KEY = 'nano-drones-save';
const CURRENT_VERSION = 2 as const;

interface LegacyDrone {
  id: string;
  position: [number, number, number];
}

interface LegacySimStateV1 {
  seed: number;
  tick: number;
  player: { position: [number, number, number] };
  drones: LegacyDrone[];
  paused?: boolean;
}

interface PersistedV1 {
  version: 1;
  state: LegacySimStateV1;
}

interface PersistedV2 {
  version: 2;
  state: SimState;
}

type PersistedSim = PersistedV1 | PersistedV2;

const migrateV1 = (data: PersistedV1): SimState => {
  const legacy = data.state;
  const base = createInitialState(legacy.seed ?? DEFAULT_SEED);
  const drones = base.drones.map((drone, idx) => {
    const legacyDrone = legacy.drones[idx];
    if (!legacyDrone) return drone;
    return { ...drone, id: legacyDrone.id, position: legacyDrone.position };
  });
  return {
    ...base,
    tick: legacy.tick,
    player: { ...base.player, position: legacy.player.position },
    drones,
  };
};

const migrate = (data: PersistedSim): SimState | null => {
  if (data.version === 2) return data.state;
  if (data.version === 1) return migrateV1(data);
  return null;
};

export const loadSim = (): SimState | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedSim;
    const migrated = migrate(parsed);
    return migrated ?? null;
  } catch {
    return null;
  }
};

export const saveSim = (state: SimState) => {
  if (typeof window === 'undefined') return;
  const payload: PersistedV2 = { version: CURRENT_VERSION, state };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota errors
  }
};
