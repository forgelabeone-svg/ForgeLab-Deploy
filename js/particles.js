// js/particles.js
// Explosion particle effect system for "Orbit Drift".
// Small glowing dots that fly outward with random velocity, fading alpha
// and shrinking radius over their lifetime. Frame-rate independent (dt in seconds).

import { fromAngle } from './vector.js';

const TWO_PI = Math.PI * 2;

export default class ParticleSystem {
  constructor() {
    /** @type {Array<Object>} */
    this.particles = [];
  }

  /**
   * Spawn a burst of glowing particles at (x, y).
   * @param {number} x
   * @param {number} y
   * @param {string} color CSS color for the glow (defaults to warm orange explosion color)
   * @param {number} count number of particles to spawn
   */
  spawnExplosion(x, y, color = '#ff5544', count = 30) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * TWO_PI;
      // Random outward speed - gives a nice varied burst radius.
      const speed = 60 + Math.random() * 220;
      const velocity = fromAngle(angle, speed);

      const lifetime = 0.6 + Math.random() * 0.4; // 0.6s - 1.0s
      const radius = 1.5 + Math.random() * 2.5;

      this.particles.push({
        x,
        y,
        vx: velocity.x,
        vy: velocity.y,
        color,
        life: lifetime,
        maxLife: lifetime,
        radius,
        maxRadius: radius,
        // slight drag so particles decelerate naturally
        drag: 0.9 + Math.random() * 0.08,
      });
    }
  }

  /**
   * Advance all particles by dt seconds. Removes dead particles.
   * @param {number} dt delta time in seconds
   */
  update(dt) {
    if (this.particles.length === 0) return;

    const alive = [];
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) continue;

      // Frame-rate independent drag: scale toward 1 based on dt.
      const dragFactor = Math.pow(p.drag, dt * 60);
      p.vx *= dragFactor;
      p.vy *= dragFactor;

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      alive.push(p);
    }
    this.particles = alive;
  }

  /**
   * Draw all active particles as glowing dots that fade and shrink over life.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    if (this.particles.length === 0) return;

    ctx.save();
    for (let i = 0; i < this.particles.length; i++) {
      const t = Math.max(0, Math.min(1, p.life / p.maxLife));
      const alpha = t;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10 * t;

      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, TWO_PI);
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * Remove all particles immediately.
   */
  clear() {
    this.particles.length = 0;
  }

  /**
   * @returns {boolean} true if there are no active particles.
   */
  isEmpty() {
    return this.particles.length === 0;
  }
}
// [FL:DONE]