import type { Point } from './world';

/**
 * Fireworks over the midway: a rocket climbs from the ground to where it
 * bursts, then its sparks spread out, fall and fade. Plain state and plain
 * functions, in world pixels, so it's testable without a canvas.
 */

export const ROCKET_SPEED = 260;
export const SPARK_COUNT = 28;
export const SPARK_SPEED = 70;
export const SPARK_LIFE = 1.4;
export const GRAVITY = 40;
/** How far below the burst a rocket starts, so it rises into frame. */
export const ROCKET_CLIMB = 140;

export interface Spark extends Point {
  vx: number;
  vy: number;
}

export interface Firework {
  /** Where the rocket is now, until it bursts. */
  rocket: Point;
  /** Where it bursts. */
  burst: Point;
  colors: readonly string[];
  sparks: Spark[];
  /** Seconds since it burst, or undefined while the rocket is still climbing. */
  age?: number;
}

export function launchFirework(
  burst: Point,
  colors: readonly string[],
  random: () => number,
): Firework {
  // Two colours from the set, so each burst looks a little different.
  const first = Math.floor(random() * colors.length);
  const second = (first + 1 + Math.floor(random() * (colors.length - 1))) % colors.length;
  return {
    rocket: { x: burst.x + (random() - 0.5) * 20, y: burst.y + ROCKET_CLIMB },
    burst: { ...burst },
    colors: colors.length > 1 ? [colors[first], colors[second]] : colors,
    sparks: [],
  };
}

function explode(firework: Firework, random: () => number) {
  firework.age = 0;
  firework.rocket = { ...firework.burst };
  for (let i = 0; i < SPARK_COUNT; i++) {
    const angle = (i / SPARK_COUNT) * Math.PI * 2;
    const speed = SPARK_SPEED * (0.7 + random() * 0.3);
    firework.sparks.push({
      x: firework.burst.x,
      y: firework.burst.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
    });
  }
}

/** Moves one firework on by `dt` seconds. Returns false once it has faded out. */
export function updateFirework(firework: Firework, dt: number, random: () => number): boolean {
  if (firework.age === undefined) {
    const dx = firework.burst.x - firework.rocket.x;
    const dy = firework.burst.y - firework.rocket.y;
    const left = Math.hypot(dx, dy);
    const step = ROCKET_SPEED * dt;
    if (step < left) {
      firework.rocket.x += (dx / left) * step;
      firework.rocket.y += (dy / left) * step;
      return true;
    }
    explode(firework, random);
    return true;
  }
  firework.age += dt;
  // Sparks slow as they spread, and gravity pulls them down.
  const drag = Math.exp(-dt * 1.5);
  for (const spark of firework.sparks) {
    spark.vx *= drag;
    spark.vy = spark.vy * drag + GRAVITY * dt;
    spark.x += spark.vx * dt;
    spark.y += spark.vy * dt;
  }
  return firework.age < SPARK_LIFE;
}

/** Moves every firework on, dropping the ones that have faded out. */
export function updateFireworks(fireworks: Firework[], dt: number, random: () => number) {
  const alive = fireworks.filter((f) => updateFirework(f, dt, random));
  fireworks.splice(0, fireworks.length, ...alive);
}

/** How bright a burst's sparks are, from 1 when it bursts to 0 when it's gone. */
export function sparkle(firework: Firework): number {
  if (firework.age === undefined) return 1;
  return Math.max(0, 1 - firework.age / SPARK_LIFE);
}
