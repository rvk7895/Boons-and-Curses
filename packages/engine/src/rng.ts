export class Rng {
  private s: number;

  constructor(seed: string | number) {
    this.s = typeof seed === "number" ? seed >>> 0 : Rng.hashSeed(seed);
    if (this.s === 0) this.s = 0x9e3779b9;
  }

  static hashSeed(s: string): number {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  next(): number {
    let t = (this.s + 0x6d2b79f5) | 0;
    this.s = t;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextInt(maxExclusive: number): number {
    return Math.floor(this.next() * maxExclusive);
  }

  rollD(faces: number): number {
    return 1 + this.nextInt(faces);
  }

  pick<T>(arr: readonly T[]): T {
    if (arr.length === 0) throw new Error("Rng.pick: empty array");
    return arr[this.nextInt(arr.length)]!;
  }

  shuffle<T>(arr: T[]): T[] {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.nextInt(i + 1);
      const tmp = a[i]!;
      a[i] = a[j]!;
      a[j] = tmp;
    }
    return a;
  }

  getState(): string {
    return this.s.toString(16);
  }

  setState(s: string): void {
    this.s = parseInt(s, 16) >>> 0;
  }
}
