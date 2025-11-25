// Simple 2D Perlin Noise implementation
// Based on standard implementations

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (t: number, a: number, b: number) => a + t * (b - a);
const grad = (hash: number, x: number, y: number) => {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
};

export class Perlin {
  private p: number[] = [];

  constructor(seed: number) {
    this.p = new Array(512);
    const permutation = new Array(256).fill(0).map((_, i) => i);
    
    // Shuffle permutation using seed (simple LCG for shuffling)
    let s = seed;
    const next = () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };

    for (let i = 255; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [permutation[i], permutation[j]] = [permutation[j], permutation[i]];
    }

    for (let i = 0; i < 512; i++) {
      this.p[i] = permutation[i & 255];
    }
  }

  noise2d(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);

    const u = fade(x);
    const v = fade(y);

    const A = this.p[X] + Y;
    const AA = this.p[A];
    const AB = this.p[A + 1];
    const B = this.p[X + 1] + Y;
    const BA = this.p[B];
    const BB = this.p[B + 1];

    return lerp(
      v,
      lerp(u, grad(this.p[AA], x, y), grad(this.p[BA], x - 1, y)),
      lerp(u, grad(this.p[AB], x, y - 1), grad(this.p[BB], x - 1, y - 1))
    );
  }
}
