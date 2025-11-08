import { create } from 'zustand'
import type { SimState } from './simTypes'
import { loadSim, saveSim } from './persistence'

const TICK_DT = 1 / 60
const DEFAULT_SEED = 1337

interface SimStore extends SimState {
  advance(dt: number): void
  togglePause(): void
}

const createInitialState = (): SimState => ({
  seed: DEFAULT_SEED,
  tick: 0,
  player: { position: [0, 0.6, 0] },
  drones: [
    { id: 'd1', position: [2, 1, 0] },
    { id: 'd2', position: [-2, 1, -1] },
    { id: 'd3', position: [1, 1, 2] },
  ],
  paused: false,
})

export const useSimStore = create<SimStore>()((set, get) => {
  const persisted = loadSim()
  const base = persisted?.state as SimState | undefined
  const initial = base ?? createInitialState()

  return {
    ...initial,
    advance: (dt: number) => {
      const { paused, tick } = get()
      if (paused) return
      const steps = Math.max(1, Math.floor(dt / TICK_DT))
      const next = { ...get(), tick: tick + steps }
      set(next)
      saveSim(next)
    },
    togglePause: () => {
      const next = { ...get(), paused: !get().paused }
      set(next)
      saveSim(next)
    },
  }
})
