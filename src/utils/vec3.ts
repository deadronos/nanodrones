import type { Vec3 } from '../state/simTypes';

export const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

export const subtract = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

export const scale = (v: Vec3, s: number): Vec3 => [v[0] * s, v[1] * s, v[2] * s];

export const length = (v: Vec3): number => Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);

export const normalize = (v: Vec3): Vec3 => {
  const len = length(v);
  if (len === 0) return [0, 0, 0];
  return scale(v, 1 / len);
};

export const lerp = (a: Vec3, b: Vec3, t: number): Vec3 => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const clampVec3XZ = (v: Vec3, range: number): Vec3 => [
  clamp(v[0], -range, range),
  v[1],
  clamp(v[2], -range, range),
];
