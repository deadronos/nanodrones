// Minimal PlayCanvas stub used only for tests to avoid importing the
// real `playcanvas` package during Vitest pre-bundling.
// Keep this intentionally tiny — it provides the shapes the app imports
// without any browser/GL initialization.

export class Color {
  r: number;
  g: number;
  b: number;
  a: number;
  constructor(r = 0, g = 0, b = 0, a = 1) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }
  clone() {
    return new Color(this.r, this.g, this.b, this.a);
  }
}

export class Mesh {
  graphicsDevice: any;
  constructor(graphicsDevice: any) {
    this.graphicsDevice = graphicsDevice;
  }
  setPositions() {}
  setNormals() {}
  setUvs() {}
  setIndices() {}
  update() {}
}

export class MeshInstance {
  mesh: any;
  material: any;
  node: any;
  constructor(mesh: any, material: any, node: any) {
    this.mesh = mesh;
    this.material = material;
    this.node = node;
  }
}export class GraphNode {}

export class Material {}

export class Entity {
  name: string;
  components: Record<string, any> = {};
  children: any[] = [];
  constructor(name = '') {
    this.name = name;
  }
  addComponent(name: string, opts?: any) {
    this.components[name] = opts ?? {};
  }
  setLocalScale() {}
  setLocalPosition() {}
  lookAt() {}
  destroy() {}
  addChild(child: any) {
    this.children.push(child);
  }
}

export class Application {
  canvas: any;
  options: any;
  graphicsDevice: any;
  root: { addChild: (c: any) => void };
  constructor(canvas?: any, opts?: any) {
    this.canvas = canvas;
    this.options = opts;
    this.graphicsDevice = {};
    this.root = { addChild: () => {} };
  }
  start() {}
  setCanvasFillMode() {}
  setCanvasResolution() {}
  render() {}
  resizeCanvas() {}
  destroy() {}
}

export class Vec3 {
  x: number;
  y: number;
  z: number;
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

// Common constants used by the app (arbitrary values are fine for tests)
export const PRIMITIVE_TRIANGLES = 0;
export const FILLMODE_FILL_WINDOW = 0;
export const RESOLUTION_AUTO = 0;
export const GAMMA_SRGB = 0;
export const TONEMAP_ACES = 0;

// provide a tiny MeshInstance factory to satisfy older code
export function createMeshInstance(mesh: any, material: any, node: any) {
  return new MeshInstance(mesh, material, node);
}

export default {
  Color,
  Mesh,
  MeshInstance,
  GraphNode,
  Material,
  Entity,
  Application,
  Vec3,
};
