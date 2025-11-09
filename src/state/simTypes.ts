export type Vec3 = [number, number, number];

export interface VoxelCoord {
  x: number;
  y: number;
  z: number;
}

export interface ChunkState {
  size: number;
  heightMap: number[]; // length = size * size
  resources: boolean[]; // true if resource block present at column top
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
  // basic drone shape check
  for (const d of st.drones) {
    if (!d || typeof d !== 'object') return false;
    if (typeof d.id !== 'string') return false;
    if (!Array.isArray(d.position) || d.position.length !== 3) return false;
    if (!d.position.every((n: any) => typeof n === 'number')) return false;
  }
  return true;
};
