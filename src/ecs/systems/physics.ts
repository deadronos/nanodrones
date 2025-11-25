import type { Vec3 } from '../../state/simTypes';

export interface PhysicsObject {
  position: Vec3;
  velocity: Vec3;
  drag?: number;
  mass?: number;
}

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (v: Vec3, s: number): Vec3 => [v[0] * s, v[1] * s, v[2] * s];

export const applyPhysics = <T extends PhysicsObject>(obj: T, dt: number, acceleration: Vec3 = [0, 0, 0]): T => {
  const drag = obj.drag ?? 5.0; // Default drag
  
  // v = v + a * dt
  let nextVel = add(obj.velocity, scale(acceleration, dt));
  
  // Apply drag: v = v * (1 - drag * dt)
  // Simple damping
  const damping = Math.max(0, 1 - drag * dt);
  nextVel = scale(nextVel, damping);

  // p = p + v * dt
  const nextPos = add(obj.position, scale(nextVel, dt));

  return {
    ...obj,
    position: nextPos,
    velocity: nextVel,
  };
};
