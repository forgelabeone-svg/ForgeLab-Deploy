// js/renderer.js
// Canvas rendering module for "Orbit Drift".
// Handles all draw calls: starfield, bounds, gravity fields, planets,
// portal/goal, ship trail, ship, and particle effects.
// Vanilla JS, no dependencies besides vector math helpers.

import { distance } from './vector.js';

const COLORS = {
  bounds: 'rgba(80, 140, 200, 0.35)',
  gravityLine: (alpha) => `rgba(120, 170, 255, ${alpha})`,
  planetGlow: (alpha) => `rgba(255, 200, 120, ${alpha})`,
  trailBright: '210, 235, 255',
  shipFill: '#eaf6ff',
  shipGlow: 'rgba(120, 200, 255, 0.9)',
  portalCore: '0, 255, 210',
  portalRing: '80, 255, 190'
};

export default class Renderer {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx || canvas.getContext('2d');
  }

  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  clear() {
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#04060d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  render(scene) {
    if (!scene) return;
    this.clear();
    const time = scene.time || 0;
    if (scene.starfield) this.drawStarfield(scene.starfield);
    if (scene.bounds) this.drawBounds(scene.bounds);
    if (scene.planets) this.drawGravityFields(scene.planets, time);
    if (scene.planets) this.drawPlanets(scene.planets);
    if (scene.goal) this.drawGoal(scene.goal, time);
    if (scene.trail) this.drawShipTrail(scene.trail);
    if (scene.particles) this.drawParticles(scene.particles);
    if (scene.shipPosition) this.drawShip(scene.shipPosition, scene.shipVelocity);
  }

  drawStarfield(starfield) {
    if (!scene) return;
    this.clear();
    if (scene.starfield) this.drawStarfield(scene.starfield);
    if (scene.bounds) this.drawBounds(scene.bounds);
    if (scene.planets) this.drawGravityFields(scene.planets, time);
    if (scene.planets) this.drawPlanets(scene.planets);
    if (scene.goal) this.drawGoal(scene.goal, time);
    if (scene.trail) this.drawShipTrail(scene.trail);
    if (scene.particles) this.drawParticles(scene.particles);
    if (scene.shipPosition) this.drawShip(scene.shipPosition, scene.shipVelocity);
  }

  drawStarfield(starfield) {
    if (!scene) return;
    this.clear();
    if (scene.starfield) this.drawStarfield(scene.starfield);
    if (scene.bounds) this.drawBounds(scene.bounds);
    if (scene.planets) this.drawGravityFields(scene.planets, time);
    if (scene.planets) this.drawPlanets(scene.planets);
    if (scene.goal) this.drawGoal(scene.goal, time);
    if (scene.trail) this.drawShipTrail(scene.trail);
    if (scene.particles) this.drawParticles(scene.particles);
    if (scene.shipPosition) this.drawShip(scene.shipPosition, scene.shipVelocity);
  }

  drawStarfield(starfield) {
    if (!scene) return;
    this.clear();
    if (scene.starfield) this.drawStarfield(scene.starfield);
    if (scene.bounds) this.drawBounds(scene.bounds);
    if (scene.planets) this.drawGravityFields(scene.planets, time);
    if (scene.planets) this.drawPlanets(scene.planets);
    if (scene.goal) this.drawGoal(scene.goal, time);
    if (scene.trail) this.drawShipTrail(scene.trail);
    if (scene.particles) this.drawParticles(scene.particles);
    if (scene.shipPosition) this.drawShip(scene.shipPosition, scene.shipVelocity);
  }

  drawStarfield(starfield) {
    if (!scene) return;
    this.clear();
    if (scene.starfield) this.drawStarfield(scene.starfield);
    if (scene.bounds) this.drawBounds(scene.bounds);
    if (scene.planets) this.drawGravityFields(scene.planets, time);
    if (scene.planets) this.drawPlanets(scene.planets);
    if (scene.goal) this.drawGoal(scene.goal, time);
    if (scene.trail) this.drawShipTrail(scene.trail);
    if (scene.particles) this.drawParticles(scene.particles);
    if (scene.shipPosition) this.drawShip(scene.shipPosition, scene.shipVelocity);
  }

  drawStarfield(starfield) {
    if (!scene) return;
    this.clear();
    if (scene.starfield) this.drawStarfield(scene.starfield);
    if (scene.bounds) this.drawBounds(scene.bounds);
    if (scene.planets) this.drawGravityFields(scene.planets, time);
    if (scene.planets) this.drawPlanets(scene.planets);
    if (scene.goal) this.drawGoal(scene.goal, time);
    if (scene.trail) this.drawShipTrail(scene.trail);
    if (scene.particles) this.drawParticles(scene.particles);
    if (scene.shipPosition) this.drawShip(scene.shipPosition, scene.shipVelocity);
  }

  drawStarfield(starfield) {
    if (!scene) return;
    this.clear();
    if (scene.starfield) this.drawStarfield(scene.starfield);
    if (scene.bounds) this.drawBounds(scene.bounds);
    if (scene.planets) this.drawGravityFields(scene.planets, time);
    if (scene.planets) this.drawPlanets(scene.planets);
    if (scene.goal) this.drawGoal(scene.goal, time);
    if (scene.trail) this.drawShipTrail(scene.trail);
    if (scene.particles) this.drawParticles(scene.particles);
    if (scene.shipPosition) this.drawShip(scene.shipPosition, scene.shipVelocity);
  }

  drawStarfield(starfield) {
    if (!scene) return;
    this.clear();
    if (scene.starfield) this.drawStarfield(scene.starfield);
    if (scene.bounds) this.drawBounds(scene.bounds);
    if (scene.planets) this.drawGravityFields(scene.planets, time);
    if (scene.planets) this.drawPlanets(scene.planets);
    if (scene.goal) this.drawGoal(scene.goal, time);
    if (scene.trail) this.drawShipTrail(scene.trail);
    if (scene.particles) this.drawParticles(scene.particles);
    if (scene.shipPosition) this.drawShip(scene.shipPosition, scene.shipVelocity);
  }

  drawStarfield(starfield) {
    if (!scene) return;
    this.clear();
    if (scene.starfield) this.drawStarfield(scene.starfield);
    if (scene.bounds) this.drawBounds(scene.bounds);
    if (scene.planets) this.drawGravityFields(scene.planets, time);
    if (scene.planets) this.drawPlanets(scene.planets);
    if (scene.goal) this.drawGoal(scene.goal, time);
    if (scene.trail) this.drawShipTrail(scene.trail);
    if (scene.particles) this.drawParticles(scene.particles);
    if (scene.shipPosition) this.drawShip(scene.shipPosition, scene.shipVelocity);
  }

  drawStarfield(starfield) {
    if (!scene) return;
    this.clear();
    if (scene.starfield) this.drawStarfield(scene.starfield);
    if (scene.bounds) this.drawBounds(scene.bounds);
    if (scene.planets) this.drawGravityFields(scene.planets, time);
    if (scene.planets) this.drawPlanets(scene.planets);
    if (scene.goal) this.drawGoal(scene.goal, time);
    if (scene.trail) this.drawShipTrail(scene.trail);
    if (scene.particles) this.drawParticles(scene.particles);
    if (scene.shipPosition) this.drawShip(scene.shipPosition, scene.shipVelocity);
  }

  drawStarfield(starfield) {
    if (!scene) return;
    this.clear();
    if (scene.starfield) this.drawStarfield(scene.starfield);
    if (scene.bounds) this.drawBounds(scene.bounds);
    if (scene.planets) this.drawGravityFields(scene.planets, time);
    if (scene.planets) this.drawPlanets(scene.planets);
    if (scene.goal) this.drawGoal(scene.goal, time);
    if (scene.trail) this.drawShipTrail(scene.trail);
    if (scene.particles) this.drawParticles(scene.particles);
    if (scene.shipPosition) this.drawShip(scene.shipPosition, scene.shipVelocity);
  }

  drawStarfield(starfield) {
    if (!scene) return;
    this.clear();
    if (scene.starfield) this.drawStarfield(scene.starfield);
    if (scene.bounds) this.drawBounds(scene.bounds);
    if (scene.planets) this.drawGravityFields(scene.planets, time);
    if (scene.planets) this.drawPlanets(scene.planets);
    if (scene.goal) this.drawGoal(scene.goal, time);
    if (scene.trail) this.drawShipTrail(scene.trail);
    if (scene.particles) this.drawParticles(scene.particles);
    if (scene.shipPosition) this.drawShip(scene.shipPosition, scene.shipVelocity);
  }

  drawStarfield(starfield) {
    if (!scene) return;
    this.clear();
    if (scene.starfield) this.drawStarfield(scene.starfield);
    if (scene.bounds) this.drawBounds(scene.bounds);
    if (scene.planets) this.drawGravityFields(scene.planets, time);
    if (scene.planets) this.drawPlanets(scene.planets);
    if (scene.goal) this.drawGoal(scene.goal, time);
    if (scene.trail) this.drawShipTrail(scene.trail);
    if (scene.particles) this.drawParticles(scene.particles);
    if (scene.shipPosition) this.drawShip(scene.shipPosition, scene.shipVelocity);
  }

  drawStarfield(starfield) {
    if (!scene) return;
    this.clear();
    if (scene.starfield) this.drawStarfield(scene.starfield);
    if (scene.bounds) this.drawBounds(scene.bounds);
    if (scene.planets) this.drawGravityFields(scene.planets, time);
    if (scene.planets) this.drawPlanets(scene.planets);
    if (scene.goal) this.drawGoal(scene.goal, time);
    if (scene.trail) this.drawShipTrail(scene.trail);
    if (scene.particles) this.drawParticles(scene.particles);
    if (scene.shipPosition) this.drawShip(scene.shipPosition, scene.shipVelocity);
  }

  drawStarfield(starfield) {
    if (!scene) return;
    this.clear();
    if (scene.starfield) this.drawStarfield(scene.starfield);
    if (scene.bounds) this.drawBounds(scene.bounds);
    if (scene.planets) this.drawGravityFields(scene.planets, time);
    if (scene.planets) this.drawPlanets(scene.planets);
    if (scene.goal) this.drawGoal(scene.goal, time);
    if (scene.trail) this.drawShipTrail(scene.trail);
    if (scene.particles) this.drawParticles(scene.particles);
    if (scene.shipPosition) this.drawShip(scene.shipPosition, scene.shipVelocity);
  }

  drawStarfield(starfield) {
    if (!scene) return;
    this.clear();
    if (scene.starfield) this.drawStarfield(scene.starfield);
    if (scene.bounds) this.drawBounds(scene.bounds);
    if (scene.planets) this.drawGravityFields(scene.planets, time);
    if (scene.planets) this.drawPlanets(scene.planets);
    if (scene.goal) this.drawGoal(scene.goal, time);
    if (scene.trail) this.drawShipTrail(scene.trail);
    if (scene.particles) this.drawParticles(scene.particles);
    if (scene.shipPosition) this.drawShip(scene.shipPosition, scene.shipVelocity);
  }

  drawStarfield(starfield) {
    if (!scene) return;
    this.clear();
    if (scene.starfield) this.drawStarfield(scene.starfield);
    if (scene.bounds) this.drawBounds(scene.bounds);
    if (scene.planets) this.drawGravityFields(scene.planets, time);
    if (scene.planets) this.drawPlanets(scene.planets);
    if (scene.goal) this.drawGoal(scene.goal, time);
    if (scene.trail) this.drawShipTrail(scene.trail);
    if (scene.particles) this.drawParticles(scene.particles);
    if (scene.shipPosition) this.drawShip(scene.shipPosition, scene.shipVelocity);
  }

  drawStarfield(starfield) {
    if (!scene) return;
    this.clear();
    if (scene.starfield) this.drawStarfield(scene.starfield);
    if (scene.bounds) this.drawBounds(scene.bounds);
    if (scene.planets) this.drawGravityFields(scene.planets, time);
    if (scene.planets) this.drawPlanets(scene.planets);
    if (scene.goal) this.drawGoal(scene.goal, time);
    if (scene.trail) this.drawShipTrail(scene.trail);
    if (scene.particles) this.drawParticles(scene.particles);
    if (scene.shipPosition) this.drawShip(scene.shipPosition, scene.shipVelocity);
  }

  drawStarfield(starfield) {
    if (!scene) return;
    this.clear();
    if (scene.starfield) this.drawStarfield(scene.starfield);
    if (scene.bounds) this.drawBounds(scene.bounds);
    if (scene.planets) this.drawGravityFields(scene.planets, time);
    if (scene.planets) this.drawPlanets(scene.planets);
    if (scene.goal) this.drawGoal(scene.goal, time);
    if (scene.trail) this.drawShipTrail(scene.trail);
    if (scene.particles) this.drawParticles(scene.particles);
    if (scene.shipPosition) this.drawShip(scene.shipPosition, scene.shipVelocity);
  }

  drawStarfield(starfield) {
    if (!scene) return;
    this.clear();
    if (scene.starfield) this.drawStarfield(scene.starfield);
    if (scene.bounds) this.drawBounds(scene.bounds);
    if (scene.planets) this.drawGravityFields(scene.planets, time);
    if (scene.planets) this.drawPlanets(scene.planets);
    if (scene.goal) this.drawGoal(scene.goal, time);
    if (scene.trail) this.drawShipTrail(scene.trail);
    if (scene.particles) this.drawParticles(scene.particles);
    if (scene.shipPosition) this.drawShip(scene.shipPosition, scene.shipVelocity);
  }

  drawStarfield(starfield) {
    if (!scene) return;
    this.clear();
    if (scene.starfield) this.drawStarfield(scene.starfield);
    if (scene.bounds) this.drawBounds(scene.bounds);
    if (scene.planets) this.drawGravityFields(scene.planets, time);
    if (scene.planets) this.drawPlanets(scene.planets);
    if (scene.goal) this.drawGoal(scene.goal, time);
    if (scene.trail) this.drawShipTrail(scene.trail);
    if (scene.particles) this.drawParticles(scene.particles);
    if (scene.shipPosition) this.drawShip(scene.shipPosition, scene.shipVelocity);
  }

  drawStarfield(starfield) {
    if (!scene) return;
    this.clear();
    if (scene.starfield) this.drawStarfield(scene.starfield);
    if (scene.bounds) this.drawBounds(scene.bounds);
    if (scene.planets) this.drawGravityFields(scene.planets, time);
    if (scene.planets) this.drawPlanets(scene.planets);
    if (scene.goal) this.drawGoal(scene.goal, time);
    if (scene.trail) this.drawShipTrail(scene.trail);
    if (scene.particles) this.drawParticles(scene.particles);
    if (scene.shipPosition) this.drawShip(scene.shipPosition, scene.shipVelocity);
  }

  drawStarfield(starfield) {
    if (!scene) return;
    this.clear();
    if (scene.starfield) this.drawStarfield(scene.starfield);
    if (scene.bounds) this.drawBounds(scene.bounds);
    if (scene.planets) this.drawGravityFields(scene.planets, time);
    if (scene.planets) this.drawPlanets(scene.planets);
    if (scene.goal) this.drawGoal(scene.goal, time);
    if (scene.trail) this.drawShipTrail(scene.trail);
    if (scene.particles) this.drawParticles(scene.particles);
    if (scene.shipPosition) this.drawShip(scene.shipPosition, scene.shipVelocity);
  }

  drawStarfield(starfield) {
    if (!scene) return;
    this.clear();
    if (scene.starfield) this.drawStarfield(scene.starfield);
    if (scene.bounds) this.drawBounds(scene.bounds);
    if (scene.planets) this.drawGravityFields(scene.planets, time);
    if (scene.planets) this.drawPlanets(scene.planets);
    if (scene.goal) this.drawGoal(scene.goal, time);
    if (scene.trail) this.drawShipTrail(scene.trail);
    if (scene.particles) this.drawParticles(scene.particles);
    if (scene.shipPosition) this.drawShip(scene.shipPosition, scene.shipVelocity);
  }

  drawStarfield(starfield) {
    if (!scene) return;
    this.clear();
    if (scene.starfield) this.drawStarfield(scene.starfield);
    if (scene.bounds) this.drawBounds(scene.bounds);
    if (scene.planets) this.drawGravityFields(scene.planets, time);
    if (scene.planets) this.drawPlanets(scene.planets);
    if (scene.goal) this.drawGoal(scene.goal, time);
    if (scene.trail) this.drawShipTrail(scene.trail);
    if (scene.particles) this.drawParticles(scene.particles);
    if (scene.shipPosition) this.drawShip(scene.shipPosition, scene.shipVelocity);
  }

  drawStarfield(starfield) {
    if (!scene) return;
    this.clear();
    if (scene.starfield) this.drawStarfield(scene.starfield);
    if (scene.bounds) this.drawBounds(scene.bounds);
    if (scene.planets) this.drawGravityFields(scene.planets, time);
    if (scene.planets) this.drawPlanets(scene.planets);
    if (scene.goal) this.drawGoal(scene.goal, time);
    if (scene.trail) this.drawShipTrail(scene.trail);
    if (scene.particles) this.drawParticles(scene.particles);
    if (scene.shipPosition) this.drawShip(scene.shipPosition, scene.shipVelocity);
  }

  drawStarfield(starfield) {
    if (!starfield || typeof starfield.draw !== 'function') return;
    starfield.draw(this.ctx);
  }

  drawBounds(bounds) {
    if (!bounds) return;
    const ctx = this.ctx;
    let x, y, w, h;
    if (typeof bounds.width === 'number' && typeof bounds.height === 'number') {
      x = bounds.x || 0;
      y = bounds.y || 0;
      w = bounds.width;
      h = bounds.height;
    } else {
      x = bounds.minX;
      y = bounds.minY;
      w = bounds.maxX - bounds.minX;
      h = bounds.maxY - bounds.minY;
    }
    ctx.save();
    ctx.strokeStyle = COLORS.bounds;
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 8]);
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    ctx.restore();
  }

  drawGravityFields(planets, time) {
    if (!Array.isArray(planets)) return;
    ctx.save();
    for (const planet of planets) {
      const pos = planet;
      const mass = planet.mass || 1;
      const baseRadius = planet.radius || 20;
      const fieldRadius = baseRadius + Math.sqrt(mass) * 6;
      const ringCount = Math.min(5, 2 + Math.floor(mass / 40));
      for (let i = 1; i <= ringCount; i++) {
        const t = i / ringCount;
        const pulse = 0.5 + 0.5 * Math.sin((time || 0) * 0.6 + i * 0.8);
        const radius = fieldRadius * (0.6 + t * 1.6) + pulse * 3;
        const alpha = 0.12 * (1 - t * 0.7) * (0.6 + 0.4 * pulse);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = COLORS.gravityLine(alpha);
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      // faint radial warp lines
      const spokes = 8;
      for (let s = 0; s < spokes; s++) {
        const angle = (s / spokes) * Math.PI * 2 + (time || 0) * 0.05;
        const inner = fieldRadius * 0.6;
        const outer = fieldRadius * 2.1;
        ctx.beginPath();
        ctx.moveTo(pos.x + Math.cos(angle) * inner, pos.y + Math.sin(angle) * inner);
        ctx.lineTo(pos.x + Math.cos(angle) * outer, pos.y + Math.sin(angle) * outer);
        ctx.strokeStyle = COLORS.gravityLine(0.05);
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  drawPlanets(planets) {
    if (!Array.isArray(planets)) return;
    ctx.save();
    for (const planet of planets) {
      const radius = planet.radius || 20;
      const hue = Math.min(40, 10 + mass * 0.15);
      const lightness = Math.max(35, 60 - mass * 0.05);

      const glowGrad = ctx.createRadialGradient(pos.x, pos.y, radius * 0.4, pos.x, pos.y, radius * 2.2);
      glowGrad.addColorStop(0, `hsla(${hue}, 90%, ${lightness}%, 0.35)`);
      glowGrad.addColorStop(1, 'hsla(20, 80%, 40%, 0)');
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius * 2.2, 0, Math.PI * 2);
      ctx.fillStyle = glowGrad;
      ctx.fill();

      const bodyGrad = ctx.createRadialGradient(
        pos.x - radius * 0.3, pos.y - radius * 0.3, radius * 0.2,
        pos.x, pos.y, radius
      );
      bodyGrad.addColorStop(0, `hsl(${hue}, 70%, ${Math.min(85, lightness + 25)}%)`);
      bodyGrad.addColorStop(1, `hsl(${hue}, 65%, ${lightness}%)`);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = bodyGrad;
      ctx.fill();
      ctx.strokeStyle = `hsla(${hue}, 60%, ${lightness + 10}%, 0.5)`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();
  }

  drawGoal(goal, time) {
    if (!goal || typeof goal.x !== 'number') return;
    const pos = goal;
    const radius = goal.radius || 24;
    const pulse = 0.5 + 0.5 * Math.sin((time || 0) * 3);
    ctx.save();

    const outerGlow = ctx.createRadialGradient(pos.x, pos.y, radius * 0.2, pos.x, pos.y, radius * 2.6);
    outerGlow.addColorStop(0, `rgba(${COLORS.portalRing}, ${0.25 + pulse * 0.15})`);
    outerGlow.addColorStop(1, `rgba(${COLORS.portalRing}, 0)`);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius * 2.6, 0, Math.PI * 2);
    ctx.fillStyle = outerGlow;
    ctx.fill();

    for (let i = 0; i < 3; i++) {
      const ringRadius = radius * (0.7 + i * 0.25) + pulse * 4;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${COLORS.portalRing}, ${0.6 - i * 0.15})`;
      ctx.lineWidth = 2.5 - i * 0.5;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius * 0.35 + pulse * 2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${COLORS.portalCore}, ${0.5 + pulse * 0.4})`;
    ctx.fill();

    ctx.restore();
  }

  drawShipTrail(trail) {
    if (!Array.isArray(trail) || trail.length < 2) return;
    ctx.save();
    ctx.lineCap = 'round';
    const n = trail.length;
    for (let i = 1; i < n; i++) {
      const p0 = trail[i - 1];
      const p1 = trail[i];
      const t = i / n;
      const alpha = Math.pow(t, 1.5) * 0.85;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.strokeStyle = `rgba(${COLORS.trailBright}, ${alpha})`;
      ctx.lineWidth = 1 + t * 2.5;
      ctx.stroke();
    }
    const last = trail[n - 1];
    ctx.beginPath();
    ctx.arc(last.x, last.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${COLORS.trailBright}, 0.9)`;
    ctx.fill();
    ctx.restore();
  }

  drawShip(position, velocity) {
    if (!position) return;
    const vx = velocity ? velocity.x : 0;
    const vy = velocity ? velocity.y : 1;
    const speed = Math.hypot(vx, vy);
    const angle = speed > 0.001 ? Math.atan2(vy, vx) : -Math.PI / 2;

    const size = 10;
    ctx.save();
    ctx.translate(position.x, position.y);
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.arc(0, 0, size * 1.8, 0, Math.PI * 2);
    const glowGrad = ctx.createRadialGradient(0, 0, size * 0.3, 0, 0, size * 1.8);
    glowGrad.addColorStop(0, COLORS.shipGlow);
    glowGrad.addColorStop(1, 'rgba(120, 200, 255, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(size * 1.3, 0);
    ctx.lineTo(-size * 0.9, size * 0.8);
    ctx.lineTo(-size * 0.5, 0);
    ctx.lineTo(-size * 0.9, -size * 0.8);
    ctx.closePath();
    ctx.fillStyle = COLORS.shipFill;
    ctx.fill();
    ctx.strokeStyle = 'rgba(60, 140, 220, 0.9)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.restore();
  }

  drawParticles(particleSystem) {
    if (!particleSystem) return;
    const particles = particleSystem.particles || particleSystem.list || particleSystem;
    if (!Array.isArray(particles) || particles.length === 0) return;
    ctx.save();
    for (const p of particles) {
      const life = typeof p.life === 'number' ? p.life : 1;
      const maxLife = typeof p.maxLife === 'number' && p.maxLife > 0 ? p.maxLife : 1;
      const t = Math.max(0, Math.min(1, life / maxLife));
      const alpha = typeof p.alpha === 'number' ? p.alpha : t;
      const size = typeof p.size === 'number' ? p.size : (typeof p.radius === 'number' ? p.radius : 2);
      const color = p.color || '255, 170, 60';
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.2, size * t), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${color}, ${Math.max(0, Math.min(1, alpha))})`;
      ctx.fill();
    }
    ctx.restore();
  }
}