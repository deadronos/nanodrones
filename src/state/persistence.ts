import type { SimState } from './simTypes'

const STORAGE_KEY = 'nano-drones-save'
const CURRENT_VERSION = 1 as const

interface PersistedV1 {
  version: 1
  state: SimState
}

type PersistedSim = PersistedV1

const migrate = (data: PersistedSim): SimState => {
  // For future schema changes. For now, V1 is directly SimState.
  if (data.version === 1) return data.state
  return data.state
}

export const loadSim = (): SimState | null => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedSim
    if (parsed.version !== CURRENT_VERSION) return null
    return migrate(parsed)
  } catch {
    return null
  }
}

export const saveSim = (state: SimState) => {
  if (typeof window === 'undefined') return
  const payload: PersistedSim = { version: CURRENT_VERSION, state }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore quota errors in MVP
  }
}
