import type { FC } from 'react';
import { useEffect, useRef } from 'react';
import * as pc from 'playcanvas';
import { buildChunkMesh } from '../voxel/mesher';
import type { ChunkState } from '../state/simTypes';
import { useSimStore } from '../state/simStore';
import { useKeyboard } from '../controls/useKeyboard';
import { createStandardMaterial } from './scene/materials';
import { createSimpleScene } from './scene/simpleScene';

const TERRAIN_MATERIAL_COLOR = new pc.Color(0.2, 0.45, 0.25);
const DRONE_COLOR = new pc.Color(0.9, 0.8, 0.25);

const buildTerrainEntity = (app: pc.Application, chunk: ChunkState) => {
  const meshData = buildChunkMesh(chunk);
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

  const entity = new pc.Entity('terrain');
  entity.addComponent('render', {
    meshInstances: [meshInstance],
  });

  return entity;
};

interface PlayCanvasShellProps {
  onReady?: (app: pc.Application) => void;
}

export const PlayCanvasShell: FC<PlayCanvasShellProps> = ({ onReady }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const appRef = useRef<pc.Application | null>(null);
  const playerRef = useRef<pc.Entity | null>(null);
  const droneRefs = useRef<Map<string, pc.Entity>>(new Map());
  const terrainRef = useRef<pc.Entity | null>(null);
  const cameraRef = useRef<pc.Entity | null>(null);
  const lastChunkRef = useRef<ChunkState | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const advance = useSimStore((s) => s.advance);
  const setInput = useSimStore((s) => s.setInput);

  useKeyboard((keys) => {
    setInput({
      forward: Boolean(keys['w'] || keys['arrowup']),
      backward: Boolean(keys['s'] || keys['arrowdown']),
      left: Boolean(keys['a'] || keys['arrowleft']),
      right: Boolean(keys['d'] || keys['arrowright']),
    });
  });

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
      farClip: 200,
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
      app.destroy();
      appRef.current = null;
      playerRef.current = null;
      cameraRef.current = null;
      droneRefs.current.forEach((entity) => entity.destroy());
      droneRefs.current.clear();
      terrainRef.current?.destroy();
      terrainRef.current = null;
      window.removeEventListener('resize', handleResize);
    };
  }, [onReady]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let isDragging = false;
    const handleDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      isDragging = true;
      canvas.requestPointerLock?.();
    };
    const handleUp = () => {
      isDragging = false;
      document.exitPointerLock?.();
    };
    const handleMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const { camera } = useSimStore.getState();
      const nextTheta = camera.theta - e.movementX * 0.003;
      const nextPhi = camera.phi - e.movementY * 0.003;
      useSimStore.getState().setCamera(nextTheta, nextPhi);
    };
    canvas.addEventListener('mousedown', handleDown);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('mousemove', handleMove);
    return () => {
      canvas.removeEventListener('mousedown', handleDown);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('mousemove', handleMove);
    };
  }, []);

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
        playerRef.current.setLocalPosition(
          player.position[0],
          player.position[1],
          player.position[2],
        );
      }

      const activeIds = new Set<string>();
      drones.forEach((drone) => {
        activeIds.add(drone.id);
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
        if (!activeIds.has(id)) {
          entity.destroy();
          droneRefs.current.delete(id);
        }
      });

      if (world.chunk !== lastChunkRef.current) {
        terrainRef.current?.destroy();
        const terrain = buildTerrainEntity(app, world.chunk);
        app.root.addChild(terrain);
        terrainRef.current = terrain;
        lastChunkRef.current = world.chunk;
      }

      if (cameraRef.current) {
        const target = new pc.Vec3(
          player.position[0],
          player.position[1] + 0.8,
          player.position[2],
        );
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
  }, [advance]);

  return <canvas ref={canvasRef} className="ndc-canvas" />;
};
