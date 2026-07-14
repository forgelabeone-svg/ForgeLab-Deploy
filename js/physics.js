import { add, sub, scale, length, distance, distanceSq } from './vector.js';

// Gravitational constant tuned for gameplay feel (small scale, arcade-like pull)
export const G = 5000;

/**
 * Calculate net gravitational acceleration acting on a point at `position`
 * from all `planets`. Each planet: { x, y, radius, mass }.
 * force = G * mass / distanceSq, direction toward planet center.
 * When too close (inside radius) we clamp the distance to avoid a
 * singularity / explosive acceleration spike.
 */
export function calculateGravity(position, planets) {
  let acc = { x: 0, y: 0 };

  if (!planets || planets.length === 0) return acc;

  for (const planet of planets) {
    const planetPos = { x: planet.x, y: planet.y };
    let distSq = distanceSq(position, planetPos);

    // Clamp minimum distance to planet radius to avoid singularities
    const minDist = planet.radius || 1;
    const minDistSq = minDist * minDist;
    if (distSq < minDistSq) {
      distSq = minDistSq;
    }

    // Avoid division by zero in the extreme edge case
    if (distSq <= 0.0001) continue;

    const dist = Math.sqrt(distSq);
    const forceMag = (G * (planet.mass || 0)) / distSq;

    // Direction vector from position toward planet, normalized
    const dir = sub(planetPos, position);
    const dirNormalized = dist > 0 ? scale(dir, 1 / dist) : { x: 0, y: 0 };

    const contribution = scale(dirNormalized, forceMag);
    acc = add(acc, contribution);
  }

  return acc;
}

/**
 * Returns true if `position` is outside the playfield `bounds`.
 * bounds: { x, y, width, height } (top-left origin rectangle)
 */
export function checkOutOfBounds(position, bounds) {
  if (!bounds) return false;

  const x = bounds.x || 0;
  const y = bounds.y || 0;
  const { width, height } = bounds;

  return (
    position.x < x ||
    position.x > x + width ||
    position.y < y ||
    position.y > y + height
  );
}

/**
 * Returns true if the ship (circle of shipRadius centered at `position`)
 * overlaps the goal portal.
 * goal: { x, y, radius }
 */
export function checkGoalReached(position, goal, shipRadius) {
  if (!goal) return false;

  const goalPos = { x: goal.x, y: goal.y };
  const d = distance(position, goalPos);
  const combinedRadius = (goal.radius || 0) + (shipRadius || 0);

  return d <= combinedRadius;
}

/**
 * Mutates `planet.x` / `planet.y` when the planet has an `orbit` config.
 * planet.orbit: { centerX, centerY, radius, angle, speed }
 * Advances orbit.angle by orbit.speed * dt (radians/sec) and recomputes
 * planet.x / planet.y from the new angle around the orbit center.
 */
export function updateOrbitingPlanet(planet, dt) {
  if (!planet || !planet.orbit) return;

  const orbit = planet.orbit;

  orbit.angle = (orbit.angle || 0) + (orbit.speed || 0) * dt;

  planet.x = orbit.centerX + Math.cos(orbit.angle) * orbit.radius;
  planet.y = orbit.centerY + Math.sin(orbit.angle) * orbit.radius;
}