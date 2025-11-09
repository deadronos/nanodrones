import * as pc from 'playcanvas';

export interface MaterialOptions {
  useMetalness?: boolean;
  metalness?: number;
  shininess?: number;
}

export const createStandardMaterial = (color: pc.Color, options: MaterialOptions = {}) => {
  const material = new pc.StandardMaterial();
  material.diffuse = color;
  material.metalness = options.metalness ?? 0.1;
  material.shininess = options.shininess ?? 40;
  material.useMetalness = options.useMetalness ?? true;
  material.update();
  return material;
};
