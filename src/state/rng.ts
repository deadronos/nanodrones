// Simple deterministic RNG (LCG)
export class Rng {
  private seed: number

  constructor(seed: number) {
    this.seed = seed >>> 0
  }

  next(): number {
    // LCG constants (Numerical Recipes)
    this.seed = (1664525 * this.seed + 1013904223) >>> 0
    return this.seed / 0xffffffff
  }

  nextInt(max: number): number {
    return Math.floor(this.next() * max)
  }
}
