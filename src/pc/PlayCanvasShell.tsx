import type { FC } from 'react'
import { useEffect, useRef } from 'react'
import * as pc from 'playcanvas'
import { useSimStore } from '../state/simStore'
import { useKeyboard } from '../controls/useKeyboard'

export const PlayCanvasShell: FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const appRef = useRef<pc.Application | null>(null)
  const playerRef = useRef<pc.Entity | null>(null)
  const droneRefs = useRef<Record<string, pc.Entity>>({})
  const lastTimeRef = useRef<number | null>(null)

  const advance = useSimStore((s) => s.advance)

  // Keyboard -> update sim state (deterministic placeholder)
  useKeyboard((keys) => {
    const speed = 4
    const dt = 1 / 60
    useSimStore.setState((state) => {
      const [x0, y0, z0] = state.player.position
      let x = x0
      let z = z0
      if (keys['w']) z -= speed * dt
      if (keys['s']) z += speed * dt
      if (keys['a']) x -= speed * dt
      if (keys['d']) x += speed * dt
      return {
        ...state,
        player: { ...state.player, position: [x, y0, z] },
      }
    })
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const app = new pc.Application(canvas, {
      graphicsDeviceOptions: { alpha: false },
    })
    appRef.current = app

    app.start()
    app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW)
    app.setCanvasResolution(pc.RESOLUTION_AUTO)

    // Camera
    const camera = new pc.Entity('camera')
    camera.addComponent('camera', {
      clearColor: new pc.Color(0.02, 0.05, 0.09, 1),
    })
    camera.setLocalPosition(8, 8, 8)
    camera.lookAt(0, 0.6, 0)
    app.root.addChild(camera)

    // Light
    const light = new pc.Entity('light')
    light.addComponent('light', {
      type: 'directional',
      castShadows: true,
      color: new pc.Color(1, 1, 1),
      intensity: 1.4,
    })
    light.setLocalEulerAngles(45, 35, 0)
    app.root.addChild(light)

    // Ground
    const ground = new pc.Entity('ground')
    ground.addComponent('render', { type: 'box' })
    ground.setLocalScale(20, 0.2, 20)
    const groundMat = new pc.StandardMaterial()
    groundMat.diffuse = new pc.Color(0.06, 0.15, 0.14)
    groundMat.update()
    ;(ground.render!.material as pc.Material) = groundMat
    app.root.addChild(ground)

    // Player entity
    const player = new pc.Entity('player')
    player.addComponent('render', { type: 'box' })
    player.setLocalScale(0.6, 0.6, 0.6)
    app.root.addChild(player)
    playerRef.current = player

    // Drone entities from initial sim state
    const refs: Record<string, pc.Entity> = {}
    useSimStore.getState().drones.forEach((d) => {
      const e = new pc.Entity(d.id)
      e.addComponent('render', { type: 'box' })
      e.setLocalScale(0.3, 0.3, 0.3)
      app.root.addChild(e)
      refs[d.id] = e
    })
    droneRefs.current = refs

    const loop = (time: number) => {
      const last = lastTimeRef.current ?? time
      const dt = (time - last) / 1000
      lastTimeRef.current = time

      advance(dt)

      const { player, drones } = useSimStore.getState()
      if (playerRef.current) {
        const [x, y, z] = player.position
        playerRef.current.setLocalPosition(x, y, z)
      }
      drones.forEach((d) => {
        const e = droneRefs.current[d.id]
        if (e) {
          const [x, y, z] = d.position
          e.setLocalPosition(x, y, z)
        }
      })

      app.render()
      requestAnimationFrame(loop)
    }

    const id = requestAnimationFrame(loop)

    const handleResize = () => {
      app.resizeCanvas(canvas.clientWidth, canvas.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(id)
      window.removeEventListener('resize', handleResize)
      app.destroy()
      appRef.current = null
    }
  }, [advance])

  return <canvas ref={canvasRef} className="ndc-canvas" />
}
