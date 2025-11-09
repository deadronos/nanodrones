import * as pc from 'playcanvas';
import { createStandardMaterial } from './materials';

const GROUND_COLOR = new pc.Color(0.05, 0.12, 0.1);
const PLAYER_COLOR = new pc.Color(0.85, 0.9, 1);
const AMBIENT_COLOR = new pc.Color(0.12, 0.15, 0.2);
const SUN_COLOR = new pc.Color(1, 0.98, 0.92);

export interface SimpleSceneHandles {
  player: pc.Entity;
  ground: pc.Entity;
  sun: pc.Entity;
  ambient: pc.Entity;
}

export const createSimpleScene = (app: pc.Application): SimpleSceneHandles => {
  const ambient = new pc.Entity('ambient-light');
  ambient.addComponent('light', {
    type: 'ambient',
    color: AMBIENT_COLOR,
  });
  app.root.addChild(ambient);

  const sun = new pc.Entity('sun');
  sun.addComponent('light', {
    type: 'directional',
    castShadows: true,
    color: SUN_COLOR,
    intensity: 2.4,
    shadowDistance: 50,
    shadowBias: 0.12,
  });
  sun.setLocalEulerAngles(45, 35, 0);
  app.root.addChild(sun);

  const ground = new pc.Entity('ground');
  ground.addComponent('render', { type: 'plane' });
  ground.setLocalScale(80, 1, 80);
  (ground.render!.material as pc.Material) = createStandardMaterial(GROUND_COLOR.clone(), {
    useMetalness: false,
  });
  app.root.addChild(ground);

  const player = new pc.Entity('player');
  player.addComponent('render', { type: 'box' });
  player.setLocalScale(0.6, 1.2, 0.6);
  (player.render!.material as pc.Material) = createStandardMaterial(PLAYER_COLOR.clone());
  app.root.addChild(player);

  return { player, ground, sun, ambient };
};
