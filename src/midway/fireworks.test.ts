import { describe, expect, it } from 'vitest';
import {
  launchFirework,
  ROCKET_CLIMB,
  SPARK_COUNT,
  SPARK_LIFE,
  sparkle,
  updateFirework,
  updateFireworks,
  type Firework,
} from './fireworks';
import { seededRandom } from './world';

const COLORS = ['red', 'gold', 'blue'];

function runFor(firework: Firework, seconds: number, random = seededRandom(1)) {
  let alive = true;
  for (let t = 0; t < seconds && alive; t += 0.02) alive = updateFirework(firework, 0.02, random);
  return alive;
}

describe('launchFirework', () => {
  it('starts the rocket below where it bursts', () => {
    const f = launchFirework({ x: 50, y: -100 }, COLORS, seededRandom(1));
    expect(f.rocket.y).toBe(-100 + ROCKET_CLIMB);
    expect(f.age).toBeUndefined();
    expect(f.sparks).toHaveLength(0);
  });

  it('picks two different colours from the set', () => {
    for (let seed = 1; seed < 20; seed++) {
      const f = launchFirework({ x: 0, y: 0 }, COLORS, seededRandom(seed));
      expect(f.colors).toHaveLength(2);
      expect(f.colors[0]).not.toBe(f.colors[1]);
      for (const c of f.colors) expect(COLORS).toContain(c);
    }
  });
});

describe('updateFirework', () => {
  it('climbs, then bursts into sparks where it was aimed', () => {
    const f = launchFirework({ x: 50, y: -100 }, COLORS, seededRandom(1));
    const start = f.rocket.y;
    updateFirework(f, 0.1, seededRandom(2));
    expect(f.rocket.y).toBeLessThan(start);
    expect(f.age).toBeUndefined();

    runFor(f, 1);
    expect(f.age).toBeDefined();
    expect(f.sparks).toHaveLength(SPARK_COUNT);
  });

  it('spreads its sparks out, then lets them fall', () => {
    const f = launchFirework({ x: 0, y: 0 }, COLORS, seededRandom(1));
    while (f.age === undefined) updateFirework(f, 0.02, seededRandom(3));
    updateFirework(f, 0.1, seededRandom(3));
    const spread = Math.max(...f.sparks.map((s) => Math.hypot(s.x, s.y)));
    expect(spread).toBeGreaterThan(3);

    const middle = () => f.sparks.reduce((sum, s) => sum + s.y, 0) / f.sparks.length;
    const before = middle();
    updateFirework(f, 0.5, seededRandom(3));
    expect(middle()).toBeGreaterThan(before);
  });

  it('fades out and is gone a little after it bursts', () => {
    const f = launchFirework({ x: 0, y: 0 }, COLORS, seededRandom(1));
    while (f.age === undefined) updateFirework(f, 0.02, seededRandom(3));
    expect(sparkle(f)).toBe(1);
    expect(runFor(f, SPARK_LIFE / 2)).toBe(true);
    expect(sparkle(f)).toBeLessThan(1);
    expect(runFor(f, SPARK_LIFE)).toBe(false);
    expect(sparkle(f)).toBe(0);
  });
});

describe('updateFireworks', () => {
  it('drops the fireworks that have faded out', () => {
    const random = seededRandom(4);
    const old = launchFirework({ x: 0, y: 0 }, COLORS, random);
    runFor(old, 1.6);
    const fireworks = [old, launchFirework({ x: 0, y: 0 }, COLORS, random)];
    for (let i = 0; i < 40; i++) updateFireworks(fireworks, 0.02, random);
    expect(fireworks).toHaveLength(1);
    expect(fireworks[0]).not.toBe(old);
  });
});
