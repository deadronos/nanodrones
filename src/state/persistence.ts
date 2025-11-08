const STORAGE_KEY = 'nano-drones-save'

interface PersistedSim {
  version: 1
  state: unknown
}

export const loadSim = (): PersistedSim | null => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedSim
    if (parsed.version !== 1) return null
    return parsed
  } catch {
    return null
  }
}

export const saveSim = (state: unknown) => {
  if (typeof window === 'undefined') return
  const payload: PersistedSim = { version: 1, state }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // ignore quota errors in MVP
  }
}
