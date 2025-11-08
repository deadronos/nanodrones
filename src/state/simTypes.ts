export type DroneId = string;

export interface DroneState {
  id: DroneId;
  position: [number, number, number];
}

export interface PlayerState {
  position: [number, number, number];
}

export interface SimState {
  seed: number;
  tick: number;
  player: PlayerState;
  drones: DroneState[];
  paused: boolean;
}
