// js/game.js
// Orbit Drift — main game state machine.
// Ties together physics, ship, input, renderer, particles, starfield and levels.
//
// ASSUMED SUB-MODULE APIs (not yet in symbol registry — documented here so
// ship.js / particles.js / input.js / renderer.js stay consistent):
//   new Ship(startPos:{x,y}, radius:number)
//     .position {x,y} .velocity {x,y} .radius .trail:[{x,y}]
//     .update(dtSeconds, planets[])        // applies gravity + integrates + trail
//     .applyThrust(direction:{x,y} normalized, power:number)
//     .reset(startPos:{x,y})
//   new ParticleSystem()
//     .update(dtSeconds) .render(ctx) .spawnExplosion(x, y, color:string) .clear()
//   new InputHandler(canvas, { onThrust:(direction:{x,y})=>void, onTogglePause:()=>void })
//     .destroy()
//   new Renderer(canvas)
//     .resize(width, height)
//     .render({ state, starfield, particles, ship, level })

import levels, { TOTAL_LEVELS } from './levels.js';
import Ship from './ship.js';
import { checkOutOfBounds, checkGoalReached, updateOrbitingPlanet } from './physics.js';
import { distance } from './vector.js';
import ParticleSystem from './particles.js';
import InputHandler from './input.js';
import Renderer from './renderer.js';
import Starfield from './starfield.js';

const MAX_DT = 0.05;

// NOTE: physics.js does not export a checkPlanetCollision helper, so we
// implement the (simple) circle-vs-circle collision check locally here.
// Each planet is expected to have { x, y, radius }.
function checkPlanetCollision(shipPosition, shipRadius, planets) {
  if (!planets || planets.length === 0) return false;

  for (const planet of planets) {
    const planetPos = { x: planet.x, y: planet.y };
    const d = distance(shipPosition, planetPos);
    const combinedRadius = (planet.radius || 0) + (shipRadius || 0);
    if (d <= combinedRadius) {
      return true;
    }
  }

  return false;
}

function computeRating(level, thrustsUsed, elapsedTime) {
  const par = level.par || {};
  const parThrusts = par.thrusts;
  const parTime = par.time;

  let rating = 'bronze';

  const thrustsOk = typeof parThrusts !== 'number' || thrustsUsed <= parThrusts;
  const timeOk = typeof parTime !== 'number' || elapsedTime <= parTime;

  if (thrustsOk && timeOk) {
    rating = 'gold';
  } else if (thrustsOk || timeOk) {
    rating = 'silver';
  }

  return rating;
}

export default class Game {
  constructor(canvas, uiHooks) {
    this.canvas = canvas;
    this.uiHooks = uiHooks || {};

    this.state = 'menu';
    this.levelIndex = 0;
    this.currentLevel = null;
    this.ship = null;

    this.thrustsRemaining = 0;
    this.thrustsUsed = 0;
    this.elapsedTime = 0;

    this._lastTimestamp = null;
    this._rafId = null;

    const initialWidth = canvas.width || (typeof window !== 'undefined' ? window.innerWidth : 800);
    const initialHeight = canvas.height || (typeof window !== 'undefined' ? window.innerHeight : 600);

    this.particles = new ParticleSystem();
    this.renderer = new Renderer(this.canvas);
    this.starfield = new Starfield(initialWidth, initialHeight);

    this.input = new InputHandler(this.canvas, {
      onThrust: (direction) => this.handleThrustInput(direction),
      onTogglePause: () => this.togglePause(),
    });

    this._loop = this._loop.bind(this);
  }

  _setState(newState) {
    this.state = newState;
    if (typeof this.uiHooks.onStateChange === 'function') {
      this.uiHooks.onStateChange(newState);
    }
  }

  _updateHud() {
    if (typeof this.uiHooks.onHudUpdate === 'function') {
      this.uiHooks.onHudUpdate({
        level: this.currentLevel ? this.currentLevel.id : 0,
        thrustsRemaining: this.thrustsRemaining,
        timer: this.elapsedTime,
      });
    }
  }

  _cloneLevel(levelData) {
    return JSON.parse(JSON.stringify(levelData));
  }

  startMenu() {
    this.currentLevel = null;
    this.ship = null;
    this._setState('menu');
    this._startLoop();
  }

  playLevel(index) {
    const clamped = Math.max(0, Math.min(index, TOTAL_LEVELS - 1));
    this.levelIndex = clamped;

    const levelData = levels[clamped];
    this.currentLevel = this._cloneLevel(levelData);

    this.ship = new Ship(
      { x: this.currentLevel.start.x, y: this.currentLevel.start.y },
      this.currentLevel.maxThrusts,
      this.currentLevel.thrustPower
    );

    this.thrustsRemaining = this.currentLevel.maxThrusts;
    this.thrustsUsed = 0;
    this.elapsedTime = 0;

    this.particles.clear();

    if (this.input && typeof this.input.setShipPosition === 'function') {
      this.input.setShipPosition(this.ship.position);
    }

    this._setState('playing');
    this._updateHud();
    this._startLoop();
  }

  restartLevel() {
    this.playLevel(this.levelIndex);
  }

  nextLevel() {
    const next = this.levelIndex + 1;
    if (next >= TOTAL_LEVELS) {
      this.startMenu();
    } else {
      this.playLevel(next);
    }
  }

  togglePause() {
    if (this.state === 'playing') {
      this._setState('paused');
    } else if (this.state === 'paused') {
      this._setState('playing');
    }
  }

  handleThrustInput(direction) {
    if (this.state !== 'playing') return;
    if (!this.ship) return;
    if (this.thrustsRemaining <= 0) return;
    if (!direction) return;

    this.ship.applyThrust(direction, this.currentLevel.thrustPower);
    this.thrustsRemaining -= 1;
    this.thrustsUsed += 1;
    this._updateHud();
  }

  resize(width, height) {
    if (this.renderer && typeof this.renderer.resize === 'function') {
      this.renderer.resize(width, height);
    }
    if (this.starfield && typeof this.starfield.resize === 'function') {
      this.starfield.resize(width, height);
    }
  }

  _startLoop() {
    if (this._rafId !== null) return;
    this._lastTimestamp = null;
    this._rafId = requestAnimationFrame(this._loop);
  }

  _stopLoop() {
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  _loop(timestamp) {
    if (this._lastTimestamp === null) {
      this._lastTimestamp = timestamp;
    }
    let dt = (timestamp - this._lastTimestamp) / 1000;
    this._lastTimestamp = timestamp;
    dt = Math.min(Math.max(dt, 0), MAX_DT);

    this.update(dt);
    this.render();

    this._rafId = requestAnimationFrame(this._loop);
  }

  update(dtSeconds) {
    this.starfield.update(dtSeconds);
    this.particles.update(dtSeconds);

    if (this.state !== 'playing') return;

    const level = this.currentLevel;
    if (!level || !this.ship) return;

    this.elapsedTime += dtSeconds;

    for (const planet of level.planets) {
      if (planet.orbit) {
        updateOrbitingPlanet(planet, dtSeconds);
      }
    }

    this.ship.update(dtSeconds, level.planets);
    this._updateHud();

    if (checkPlanetCollision(this.ship.position, this.ship.radius, level.planets)) {
      this._triggerGameOver();
      return;
    }

    if (checkOutOfBounds(this.ship.position, level.bounds)) {
      this._triggerGameOver();
      return;
    }

    if (checkGoalReached(this.ship.position, level.goal, this.ship.radius)) {
      this._triggerLevelComplete();
      return;
    }
  }

  _triggerGameOver() {
    if (this.ship) {
      this.particles.spawnExplosion(this.ship.position.x, this.ship.position.y, '#ff9d3d');
    }
    this._setState('gameover');

    if (typeof this.uiHooks.onGameOver === 'function') {
      this.uiHooks.onGameOver({ reason: 'collision' });
    }
  }

  _triggerLevelComplete() {
    const rating = level ? computeRating(level, this.thrustsUsed, this.elapsedTime) : 'bronze';

    this._setState('levelcomplete');

    if (typeof this.uiHooks.onLevelComplete === 'function') {
      this.uiHooks.onLevelComplete({
        levelIndex: this.levelIndex,
        thrustsUsed: this.thrustsUsed,
        elapsedTime: this.elapsedTime,
        rating,
        isLastLevel: this.levelIndex >= TOTAL_LEVELS - 1,
      });
    }
  }

  render() {
    if (!this.renderer || typeof this.renderer.render !== 'function') return;

    this.renderer.render({
      state: this.state,
      starfield: this.starfield,
      particles: this.particles,
      ship: this.ship,
      level: this.currentLevel,
    });
  }

  destroy() {
    this._stopLoop();
    if (this.input && typeof this.input.destroy === 'function') {
      this.input.destroy();
    }
  }
}
// [FL:DONE]