import { createInitialState, DEFAULT_SEED } from './initialState';
import { DEFAULT_CHUNK_HEIGHT } from '../voxel/generator';
import type { ChunkState, DroneState, Order, PlayerState, SimState } from './simTypes';

const STORAGE_KEY = 'nano-drones-save';
export const CURRENT_VERSION = 3 as const;

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

interface LegacyChunkStateV2 {
  size: number;
  heightMap: number[];
  resources: boolean[];
}

interface LegacyWorldStateV2 {
  seed: number;
  chunk: LegacyChunkStateV2;
}

interface LegacySimStateV2 {
  seed: number;
  rngSeed: number;
  tick: number;
  world: LegacyWorldStateV2;
  player: PlayerState;
  drones: DroneState[];
  orders: Order[];
  orderCounter: number;
}

interface PersistedV2 {
  version: 2;
  state: LegacySimStateV2;
}

interface PersistedV3 {
  version: 3;
  state: SimState;
}

type PersistedSim = PersistedV1 | PersistedV2 | PersistedV3;

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

const columnBlockIndex = (size: number, height: number, x: number, y: number, z: number) =>
  y * size * size + z * size + x;

const buildChunkFromLegacy = (legacy: LegacyChunkStateV2): ChunkState => {
  const blocks = new Array(legacy.size * DEFAULT_CHUNK_HEIGHT * legacy.size).fill('air');
  for (let z = 0; z < legacy.size; z += 1) {
    for (let x = 0; x < legacy.size; x += 1) {
      const idx = z * legacy.size + x;
      const storedHeight = Math.max(1, legacy.heightMap[idx] ?? 1);
      const columnHeight = Math.min(storedHeight, DEFAULT_CHUNK_HEIGHT);
      for (let y = 0; y < columnHeight; y += 1) {
        blocks[columnBlockIndex(legacy.size, DEFAULT_CHUNK_HEIGHT, x, y, z)] = 'ground';
      }
      if (legacy.resources[idx]) {
        const resourceY = Math.min(columnHeight - 1, DEFAULT_CHUNK_HEIGHT - 1);
        blocks[columnBlockIndex(legacy.size, DEFAULT_CHUNK_HEIGHT, x, resourceY, z)] = 'resource';
      }
    }
  }
  return {
    id: { x: 0, z: 0 },
    size: legacy.size,
    height: DEFAULT_CHUNK_HEIGHT,
    blocks,
  };
};

const migrateV2 = (data: PersistedV2): SimState => {
  const legacy = data.state;
  return {
    ...legacy,
    world: {
      ...legacy.world,
      chunk: buildChunkFromLegacy(legacy.world.chunk),
    },
  };
};

const migrate = (data: PersistedSim): SimState | null => {
  if (data.version === 3) return data.state;
  if (data.version === 2) return migrateV2(data);
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
  const payload: PersistedV3 = { version: CURRENT_VERSION, state };
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
  } as PersistedV3;
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
