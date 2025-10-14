export interface Rng { nextInt(maxExclusive: number): number; snapshot(): { type: string; cursor: number; seed?: string } }
import * as nodeCrypto from 'crypto';

export class SystemRng implements Rng {
  private cursor = 0;

  nextInt(maxExclusive: number): number {
    if (maxExclusive <= 0) throw new Error("maxExclusive must be > 0");
    const n = nodeCrypto.randomInt(0, maxExclusive);
    this.cursor++;
    return n;
  }

  snapshot() {
    return { type: "system", cursor: this.cursor };
  }
}


export class SeededRng implements Rng {
  private cursor = 0;
  private state: number[];
  constructor(private seed: string) {
    const h = (s: string) => { let x = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) x = (x ^ s.charCodeAt(i)) * 16777619 >>> 0; return x >>> 0; };
    const s1 = h(seed), s2 = h(seed + "#"), s3 = h("!" + seed), s4 = h(seed + "$");
    this.state = [s1, s2, s3, s4];
  }
  private nextUint32() {
    let [x, y, z, w] = this.state;
    const t = x ^ (x << 11);
    x = y; y = z; z = w;
    w = (w ^ (w >>> 19) ^ (t ^ (t >>> 8))) >>> 0;
    this.state = [x, y, z, w];
    return w >>> 0;
  }
  nextInt(maxExclusive: number): number {
    if (maxExclusive <= 0) throw new Error("maxExclusive must be > 0");
    this.cursor++;
    return this.nextUint32() % maxExclusive;
  }
  snapshot() { return { type: "seeded", cursor: this.cursor, seed: this.seed }; }
}
