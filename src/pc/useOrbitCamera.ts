import { useEffect } from 'react'
import * as pc from 'playcanvas'

interface OrbitConfig {
  distance?: number
}

export const useOrbitCamera = (app: pc.Application | null, camera: pc.Entity | null, target: pc.Vec3, _config?: OrbitConfig) => {
  useEffect(() => {
    if (!app || !camera) return

    const onMouseMove = (e: MouseEvent) => {
      if (e.buttons !== 1) return
      const dx = e.movementX * 0.002
      const dy = e.movementY * 0.002

      const pos = camera.getPosition().clone().sub(target)
      const spherical = {
        r: pos.length(),
        theta: Math.atan2(pos.x, pos.z),
        phi: Math.acos(pos.y / Math.max(pos.length(), 0.0001)),
      }

      spherical.theta -= dx
      spherical.phi = Math.min(Math.max(0.2, spherical.phi + dy), Math.PI - 0.2)

      const sinPhi = Math.sin(spherical.phi)
      const x = spherical.r * sinPhi * Math.sin(spherical.theta)
      const y = spherical.r * Math.cos(spherical.phi)
      const z = spherical.r * sinPhi * Math.cos(spherical.theta)

      camera.setLocalPosition(target.x + x, target.y + y, target.z + z)
      camera.lookAt(target)
    }

    app.graphicsDevice.canvas.addEventListener('mousemove', onMouseMove)
    return () => {
      app.graphicsDevice.canvas.removeEventListener('mousemove', onMouseMove)
    }
  }, [app, camera, target])
}
