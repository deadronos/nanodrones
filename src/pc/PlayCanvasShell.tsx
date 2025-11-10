import type { FC } from 'react';
import { useEffect, useRef } from 'react';
import * as pc from 'playcanvas';
import { buildChunkMesh } from '../voxel/mesher';
import { useSimStore } from '../state/simStore';
import { useKeyboard } from '../controls/useKeyboard';
import { createStandardMaterial } from './scene/materials';
import { createSimpleScene } from './scene/simpleScene';
import { chunkKey } from '../voxel/world';

const TERRAIN_MATERIAL_COLOR = new pc.Color(0.2, 0.45, 0.25);
const DRONE_COLOR = new pc.Color(0.9, 0.8, 0.25);
const CHUNK_CULL_DISTANCE = 64;

interface PlayCanvasShellProps {
  onReady?: (app: pc.Application) => void;
}

const createChunkEntity = (app: pc.Application, world: ReturnType<typeof useSimStore.getState>['world'], chunkKeyStr: string) => {
  const chunk = world.chunks[chunkKeyStr];
  if (!chunk) return null;
  const meshData = buildChunkMesh(world, chunk);
  const mesh = new pc.Mesh(app.graphicsDevice);
  mesh.setPositions(meshData.positions);
  mesh.setNormals(meshData.normals);
  mesh.setUvs(0, meshData.uvs);
  mesh.setIndices(meshData.indices);
  mesh.update(pc.PRIMITIVE_TRIANGLES);

  const node = new pc.GraphNode();
  const material = createStandardMaterial(TERRAIN_MATERIAL_COLOR.clone());
  material.useMetalness = false;
  const meshInstance = new pc.MeshInstance(mesh, material, node);

  const entity = new pc.Entity(`chunk-${chunkKeyStr}`);
  entity.addComponent('render', {
    meshInstances: [meshInstance],
  });
  entity.setLocalPosition(chunk.id.x * world.chunkSize, 0, chunk.id.z * world.chunkSize);
  return entity;
};

export const PlayCanvasShell: FC<PlayCanvasShellProps> = ({ onReady }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const appRef = useRef<pc.Application | null>(null);
  const playerRef = useRef<pc.Entity | null>(null);
  const droneRefs = useRef<Map<string, pc.Entity>>(new Map());
  const chunkRefs = useRef<Map<string, pc.Entity>>(new Map());
  const cameraRef = useRef<pc.Entity | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const advance = useSimStore((s) => s.advance);
  const setInput = useSimStore((s) => s.setInput);
  const triggerBreak = useSimStore((s) => s.triggerBreak);
  const triggerPlace = useSimStore((s) => s.triggerPlace);
  const cycleHotbar = useSimStore((s) => s.cycleHotbar);
  const selectHotbar = useSimStore((s) => s.selectHotbar);
  const acknowledgeMeshDiffs = useSimStore((s) => s.acknowledgeMeshDiffs);

  useKeyboard((keys) => {
    setInput({
      forward: Boolean(keys['w'] || keys['arrowup']),
      backward: Boolean(keys['s'] || keys['arrowdown']),
      left: Boolean(keys['a'] || keys['arrowleft']),
      right: Boolean(keys['d'] || keys['arrowright']),
      ascend: Boolean(keys[' '] || keys['space']),
      descend: Boolean(keys['shift']),
    });
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const key = event.key.toLowerCase();
      if (key === 'q') {
        cycleHotbar(-1);
      } else if (key === 'e') {
        cycleHotbar(1);
      } else if (key >= '1' && key <= '9') {
        selectHotbar(Number(key) - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cycleHotbar, selectHotbar]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const app = new pc.Application(canvas, {
      graphicsDeviceOptions: { alpha: false, antialias: true },
    });
    app.start();
    app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
    app.setCanvasResolution(pc.RESOLUTION_AUTO);
    const camera = new pc.Entity('camera');
    camera.addComponent('camera', {
      clearColor: new pc.Color(0.03, 0.04, 0.07),
      farClip: 250,
      gammaCorrection: pc.GAMMA_SRGB,
      toneMapping: pc.TONEMAP_ACES,
    });
    app.root.addChild(camera);
    cameraRef.current = camera;

    appRef.current = app;
    const { player } = createSimpleScene(app);
    playerRef.current = player;
    onReady?.(app);

    const handleResize = () => {
      app.resizeCanvas(canvas.clientWidth, canvas.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      const chunkSnapshot = chunkRefs.current;
      const droneSnapshot = droneRefs.current;
      app.destroy();
      appRef.current = null;
      playerRef.current = null;
      cameraRef.current = null;
      droneSnapshot.forEach((entity) => entity.destroy());
      droneSnapshot.clear();
      chunkSnapshot.forEach((entity) => entity.destroy());
      chunkSnapshot.clear();
      window.removeEventListener('resize', handleResize);
    };
  }, [onReady]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let isDragging = false;

    const handleDown = (e: MouseEvent) => {
      if (e.button === 0) {
        triggerBreak();
        isDragging = true;
        canvas.requestPointerLock?.();
      } else if (e.button === 2) {
        triggerPlace();
      }
    };

    const handleUp = (e: MouseEvent) => {
      if (e.button === 0) {
        isDragging = false;
        document.exitPointerLock?.();
      }
    };

    const handleMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const { camera } = useSimStore.getState();
      const nextTheta = camera.theta - e.movementX * 0.003;
      const nextPhi = camera.phi - e.movementY * 0.003;
      useSimStore.getState().setCamera(nextTheta, nextPhi);
    };

    const preventContextMenu = (e: MouseEvent) => {
      if (e.button === 2) {
        e.preventDefault();
      }
    };

    canvas.addEventListener('mousedown', handleDown);
    canvas.addEventListener('contextmenu', preventContextMenu);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('mousemove', handleMove);
    return () => {
      canvas.removeEventListener('mousedown', handleDown);
      canvas.removeEventListener('contextmenu', preventContextMenu);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('mousemove', handleMove);
    };
  }, [triggerBreak, triggerPlace]);

  useEffect(() => {
    const app = appRef.current;
    if (!app) return;

    let frameId = 0;

    const loop = (time: number) => {
      const last = lastTimeRef.current ?? time;
      const dt = (time - last) / 1000;
      lastTimeRef.current = time;

      advance(dt);

      const { player, drones, world, camera } = useSimStore.getState();

      if (playerRef.current) {
        playerRef.current.setLocalPosition(player.position[0], player.position[1], player.position[2]);
      }

      const activeDroneIds = new Set<string>();
      drones.forEach((drone) => {
        activeDroneIds.add(drone.id);
        let entity = droneRefs.current.get(drone.id);
        if (!entity) {
          entity = new pc.Entity(drone.id);
          entity.addComponent('render', { type: 'box' });
          entity.setLocalScale(0.4, 0.4, 0.4);
          const mat = createStandardMaterial(DRONE_COLOR.clone());
          (entity.render!.material as pc.Material) = mat;
          app.root.addChild(entity);
          droneRefs.current.set(drone.id, entity);
        }
        entity.setLocalPosition(drone.position[0], drone.position[1], drone.position[2]);
      });
      droneRefs.current.forEach((entity, id) => {
        if (!activeDroneIds.has(id)) {
          entity.destroy();
          droneRefs.current.delete(id);
        }
      });

      if (world.meshDiffs.length > 0) {
        world.meshDiffs.forEach((diff) => {
          const key = chunkKey(diff.chunkId);
          const existing = chunkRefs.current.get(key);
          if (existing) {
            existing.destroy();
            chunkRefs.current.delete(key);
          }
          if (diff.type !== 'remove') {
            const entity = createChunkEntity(app, world, key);
            if (entity) {
              app.root.addChild(entity);
              chunkRefs.current.set(key, entity);
            }
          }
        });
        acknowledgeMeshDiffs();
      }

      const playerPos = player.position;
      chunkRefs.current.forEach((entity, key) => {
        const chunk = world.chunks[key];
        if (!chunk) {
          entity.destroy();
          chunkRefs.current.delete(key);
          return;
        }
        const centerX = chunk.id.x * world.chunkSize;
        const centerZ = chunk.id.z * world.chunkSize;
        const dx = centerX - playerPos[0];
        const dz = centerZ - playerPos[2];
        const distance = Math.sqrt(dx * dx + dz * dz);
        entity.enabled = distance <= CHUNK_CULL_DISTANCE;
      });

      if (cameraRef.current) {
        const target = new pc.Vec3(player.position[0], player.position[1] + 0.8, player.position[2]);
        const sinPhi = Math.sin(camera.phi);
        const camX = target.x + camera.distance * sinPhi * Math.sin(camera.theta);
        const camY = target.y + camera.distance * Math.cos(camera.phi);
        const camZ = target.z + camera.distance * sinPhi * Math.cos(camera.theta);
        cameraRef.current.setLocalPosition(camX, camY, camZ);
        cameraRef.current.lookAt(target);
      }

      app.render();
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [advance, acknowledgeMeshDiffs]);

  return <canvas ref={canvasRef} className="ndc-canvas" />;
};
