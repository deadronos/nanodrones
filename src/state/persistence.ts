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

// --- Snapshot-oriented helpers ------------------------------------------------
import type { Snapshot } from './simTypes';

export const saveSnapshot = (snapshot: Snapshot, key = STORAGE_KEY) => {
  if (typeof window === 'undefined') return;
  const payload = {
    version: CURRENT_VERSION,
    createdAt: snapshot.createdAt ?? new Date().toISOString(),
    state: snapshot.state,
  } as PersistedV2;
  try {
    window.localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // ignore quota errors
  }
};

export const loadSnapshot = (key = STORAGE_KEY): Snapshot | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedSim & { createdAt?: string };
    const migrated = migrate(parsed);
    if (!migrated) return null;
    return {
      version: CURRENT_VERSION,
      createdAt: parsed.createdAt ?? new Date().toISOString(),
      state: migrated,
    };
  } catch {
    return null;
  }
};

export const migrateSnapshot = (raw: unknown): Snapshot | null => {
  try {
    const parsed = raw as PersistedSim & { createdAt?: string };
    const migrated = migrate(parsed);
    if (!migrated) return null;
    return {
      version: CURRENT_VERSION,
      createdAt: parsed.createdAt ?? new Date().toISOString(),
      state: migrated,
    };
  } catch {
    return null;
  }
};

export const exportSnapshotFile = (snapshot: Snapshot, filename = 'nano-drones-save.json') => {
  if (typeof window === 'undefined') return;
  const payload = {
    version: snapshot.version ?? CURRENT_VERSION,
    createdAt: snapshot.createdAt ?? new Date().toISOString(),
    state: snapshot.state,
  };
  const str = JSON.stringify(payload);
  if (str.length > 1_000_000) {
    // warn about large exports
    // eslint-disable-next-line no-console
    console.warn('Snapshot export size > 1MB');
  }
  const blob = new Blob([str], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export const importSnapshotFile = async (file: File): Promise<Snapshot> => {
  if (typeof window === 'undefined') throw new Error('import not supported');
  let text: string;
  if (typeof (file as any).text === 'function') {
    text = await (file as any).text();
  } else {
    // fallback for environments where File.text() is not available
    text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
  const parsed = JSON.parse(text) as PersistedSim & { createdAt?: string };
  const migrated = migrate(parsed);
  if (!migrated) throw new Error('Invalid snapshot');
  return {
    version: CURRENT_VERSION,
    createdAt: parsed.createdAt ?? new Date().toISOString(),
    state: migrated,
  };
};
