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
