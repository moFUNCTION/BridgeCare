export type Rng = () => number;

export function createSeededRng(seed: number): Rng {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Matches Super Designer `getRandomValue(max, min?)`. */
export function getRandomValue(max: number, min = 0, rng: Rng = Math.random): number {
  if (min > max) [min, max] = [max, min];
  return min + rng() * (max - min);
}
