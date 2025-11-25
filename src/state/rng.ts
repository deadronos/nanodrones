export type RngState = number;

// Mulberry32 - a fast, high-quality 32-bit PRNG
export class Rng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  static fromState(state: RngState) {
    return new Rng(state);
  }

  clone() {
    return new Rng(this.state);
  }

  getState(): RngState {
    return this.state;
  }

  next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
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
