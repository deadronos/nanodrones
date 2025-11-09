export type Vec3 = [number, number, number];

export interface VoxelCoord {
  x: number;
  y: number;
  z: number;
}

export type BlockId = 'air' | 'ground' | 'resource';

export interface ChunkId {
  x: number;
  z: number;
}

export interface ChunkState {
  id: ChunkId;
  size: number;
  height: number;
  blocks: BlockId[];
}

export interface WorldState {
  seed: number;
  chunk: ChunkState;
}

export type DroneActivity = 'idle' | 'moving' | 'mining' | 'returning' | 'charging';

export interface DroneTask {
  id: string; // order id
  type: 'mine';
  target: VoxelCoord;
  progress: number; // seconds spent mining
}

export interface DroneState {
  id: string;
  position: Vec3;
  velocity: Vec3;
  battery: number; // 0..1
  carrying: number; // units of ore
  activity: DroneActivity;
  task: DroneTask | null;
}

export interface PlayerState {
  position: Vec3;
  yaw: number;
  pitch: number;
  velocity: Vec3;
}

export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
}

export type OrderStatus = 'pending' | 'assigned' | 'completed';

export interface MineOrder {
  id: string;
  type: 'mine';
  target: VoxelCoord;
  status: OrderStatus;
  droneId?: string;
}

export type Order = MineOrder;

export interface SimState {
  seed: number;
  rngSeed: number;
  tick: number;
  world: WorldState;
  player: PlayerState;
  drones: DroneState[];
  orders: Order[];
  orderCounter: number;
}

export interface Snapshot {
  version: number;
  createdAt?: string;
  state: SimState;
  metadata?: Record<string, unknown>;
}

const isBlockId = (value: unknown): value is BlockId =>
  value === 'air' || value === 'ground' || value === 'resource';

const validateChunkShape = (chunk: unknown): chunk is ChunkState => {
  if (!chunk || typeof chunk !== 'object') return false;
  const chk = chunk as any;
  if (!chk.id || typeof chk.id !== 'object') return false;
  if (typeof chk.id.x !== 'number' || typeof chk.id.z !== 'number') return false;
  if (typeof chk.size !== 'number' || chk.size <= 0) return false;
  if (typeof chk.height !== 'number' || chk.height <= 0) return false;
  if (!Array.isArray(chk.blocks)) return false;
  if (chk.blocks.length !== chk.size * chk.size * chk.height) return false;
  if (!chk.blocks.every(isBlockId)) return false;
  return true;
};

export const validateSnapshotShape = (s: unknown): s is Snapshot => {
  if (!s || typeof s !== 'object') return false;
  const snap = s as any;
  if (typeof snap.version !== 'number') return false;
  if (!snap.state || typeof snap.state !== 'object') return false;
  const st = snap.state as any;
  if (typeof st.seed !== 'number') return false;
  if (typeof st.rngSeed !== 'number') return false;
  if (typeof st.tick !== 'number') return false;
  if (!Array.isArray(st.drones)) return false;
  if (!Array.isArray(st.orders)) return false;
  if (!st.world || typeof st.world !== 'object') return false;
  if (!validateChunkShape(st.world.chunk)) return false;
  // basic drone shape check
  for (const d of st.drones) {
    if (!d || typeof d !== 'object') return false;
    if (typeof d.id !== 'string') return false;
    if (!Array.isArray(d.position) || d.position.length !== 3) return false;
    if (!d.position.every((n: any) => typeof n === 'number')) return false;
  }
  return true;
};
