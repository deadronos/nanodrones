export type RngState = number;

// Simple deterministic RNG (LCG)
export class Rng {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed >>> 0;
  }

  static fromState(state: RngState) {
    return new Rng(state);
  }

  clone() {
    return new Rng(this.seed);
  }

  getState(): RngState {
    return this.seed >>> 0;
  }

  next(): number {
    // LCG constants (Numerical Recipes)
    this.seed = (1664525 * this.seed + 1013904223) >>> 0;
    return this.seed / 0xffffffff;
  }

  nextInt(max: number): number {
    if (max <= 0) return 0;
    return Math.floor(this.next() * max);
  }

  nextRange(min: number, max: number): number {
    if (max <= min) return min;
    return min + this.next() * (max - min);
  }
}
