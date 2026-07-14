// js/ship.js
// Player ship entity for "Orbit Drift".
// Holds position/velocity state, manages the limited thrust budget,
// and keeps a fading trail of recent positions for rendering.

import { calculateGravity } from './physics.js';
import { add, scale } from './vector.js';

const MAX_TRAIL_LENGTH = 40;
const DEFAULT_RADIUS = 8;

export default class Ship {
  /**
   * @param {{x:number,y:number}} startPos - initial ship position
   * @param {number} maxThrusts - number of thrust impulses available this level
   * @param {number} thrustPower - magnitude applied per thrust impulse
   */
  constructor(startPos, maxThrusts, thrustPower) {
    this.startPos = { x: startPos.x, y: startPos.y };
    this.maxThrusts = maxThrusts;
    this.thrustPower = thrustPower;

    this.position = { x: startPos.x, y: startPos.y };
    this.velocity = { x: 0, y: 0 };
    this.radius = DEFAULT_RADIUS;
    this.thrustsRemaining = maxThrusts;
    this.trail = [{ x: startPos.x, y: startPos.y }];

    // Set true briefly after a thrust fires, useful for renderer flare fx.
    this.justThrusted = false;
    this.thrustFlashTimer = 0;
  }

  /**
   * Fire a discrete thrust impulse in the given direction (unit vector
   * recommended, but any vector works — it gets scaled by thrustPower).
   * @param {{x:number,y:number}} direction
   * @returns {boolean} true if the thrust was applied, false if out of fuel
   */
  applyThrust(direction) {
    if (this.thrustsRemaining <= 0) return false;
    if (!direction || (direction.x === 0 && direction.y === 0)) return false;

    const impulse = scale(direction, this.thrustPower);
    this.velocity = {
      x: this.velocity.x + impulse.x,
      y: this.velocity.y + impulse.y,
    };

    this.thrustsRemaining -= 1;
    this.justThrusted = true;
    this.thrustFlashTimer = 0.25;

    return true;
  }

  /**
   * Advance the ship's physics state by `dt` seconds under the influence
   * of gravity from `planets`, then record the new position into the trail.
   * Uses semi-implicit (symplectic) Euler integration: velocity is updated
   * from acceleration first, then position is updated from the new
   * velocity — this is stable and frame-rate independent when driven by dt.
   * @param {number} dt - delta time in seconds
   * @param {Array<{x:number,y:number,radius:number,mass:number}>} planets
   */
  update(dt, planets) {
    const acceleration = calculateGravity(this.position, planets);

    // v' = v + a * dt
    this.velocity = add(this.velocity, scale(acceleration, dt));

    // p' = p + v' * dt
    this.position = add(this.position, scale(this.velocity, dt));

    this.trail.push({ x: this.position.x, y: this.position.y });
    while (this.trail.length > MAX_TRAIL_LENGTH) {
      this.trail.shift();
    }

    if (this.thrustFlashTimer > 0) {
      this.thrustFlashTimer = Math.max(0, this.thrustFlashTimer - dt);
      if (this.thrustFlashTimer === 0) {
        this.justThrusted = false;
      }
    }
  }

  /**
   * Reset the ship to a fresh state for a (re)started level.
   * @param {{x:number,y:number}} startPos
   * @param {number} maxThrusts
   */
  reset(startPos, maxThrusts) {
    this.startPos = { x: startPos.x, y: startPos.y };
    this.position = { x: startPos.x, y: startPos.y };
    this.velocity = { x: 0, y: 0 };
    this.thrustsRemaining = maxThrusts;
    this.maxThrusts = maxThrusts;
    this.trail = [{ x: startPos.x, y: startPos.y }];
    this.justThrusted = false;
    this.thrustFlashTimer = 0;
  }
}
// [FL:DONE]