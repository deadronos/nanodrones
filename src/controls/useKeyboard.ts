import { useEffect } from 'react'

export type KeyState = Record<string, boolean>

export const useKeyboard = (onChange: (keys: KeyState) => void) => {
  useEffect(() => {
    const keys: KeyState = {}

    const handleDown = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true
      onChange({ ...keys })
    }

    const handleUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false
      onChange({ ...keys })
    }

    window.addEventListener('keydown', handleDown)
    window.addEventListener('keyup', handleUp)

    return () => {
      window.removeEventListener('keydown', handleDown)
      window.removeEventListener('keyup', handleUp)
    }
  }, [onChange])
}
