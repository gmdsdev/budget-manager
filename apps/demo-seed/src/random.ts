/**
 * A seeded PRNG, so `--seed 7` always produces the same account. `Math.random`
 * would make two runs impossible to compare when a figure looks wrong.
 */
export function createRandom(seed: number) {
  let state = (seed || 1) >>> 0;

  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const intBetween = (min: number, max: number) =>
    min + Math.floor(next() * (max - min + 1));

  const pick = <T>(items: readonly T[]): T => {
    const item = items[intBetween(0, items.length - 1)];

    if (item === undefined) {
      throw new Error("Cannot pick from an empty list");
    }

    return item;
  };

  return {
    intBetween,
    pick,
    chance: (probability: number) => next() < probability,
  };
}

export type Random = ReturnType<typeof createRandom>;
