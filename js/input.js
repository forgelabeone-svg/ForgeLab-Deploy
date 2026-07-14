// js/input.js
// Keyboard / mouse / touch thrust-input handling for "Orbit Drift".
// Fires discrete, normalized thrust impulses via callbacks.onThrust({x,y})
// and toggles pause via callbacks.onPauseToggle().

import { sub, normalize } from './vector.js';

// Canonical direction vectors for keyboard cardinal/diagonal thrust.
const KEY_TO_DIR = {
  arrowup: 'up', w: 'up',
  arrowdown: 'down', s: 'down',
  arrowleft: 'left', a: 'left',
  arrowright: 'right', d: 'right',
};

const DIR_VECTORS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export default class InputHandler {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{ onThrust: (direction:{x:number,y:number}) => void, onPauseToggle: () => void }} callbacks
   */
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks || {};

    // Ship position in world/canvas space, kept in sync by the game loop
    // via setShipPosition() so mouse/tap thrust direction can be computed.
    this.shipPosition = { x: 0, y: 0 };

    // Keyboard state: which canonical directions are currently held down.
    this.activeKeys = new Set();

    // Touch joystick state.
    this.joystickEl = document.getElementById('joystick');
    this.joystickKnobEl = document.getElementById('joystick-knob');
    this.joystickActive = false;
    this.joystickDirection = { x: 0, y: 0 };
    this.joystickPointerId = null;
    this.joystickMaxRadius = 40;

    // Prevents a ghost "click" from firing a second thrust right after a
    // joystick drag release (touch devices can synthesize a click on the
    // element under the finger when the touch ends).
    this.suppressNextClick = false;

    // Bind handlers once so they can be removed in destroy().
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onCanvasClick = this._onCanvasClick.bind(this);
    this._onKnobPointerDown = this._onKnobPointerDown.bind(this);
    this._onKnobPointerMove = this._onKnobPointerMove.bind(this);
    this._onKnobPointerUp = this._onKnobPointerUp.bind(this);

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    this.canvas.addEventListener('click', this._onCanvasClick);

    this._setupJoystick();
  }

  /**
   * Called by game.js every frame (or whenever the ship moves) so input.js
   * can compute mouse/tap thrust direction relative to the ship.
   * @param {{x:number,y:number}} pos
   */
  setShipPosition(pos) {
    if (!pos) return;
    this.shipPosition.x = pos.x;
    this.shipPosition.y = pos.y;
  }

  // ---------------------------------------------------------------------
  // Keyboard
  // ---------------------------------------------------------------------

  _onKeyDown(e) {
    const key = e.key.toLowerCase();

    if (key === 'escape' || key === 'p') {
      e.preventDefault();
      if (this.callbacks.onPauseToggle) this.callbacks.onPauseToggle();
      return;
    }

    const canonical = KEY_TO_DIR[key];
    if (!canonical) return;

    e.preventDefault();

    // Ignore OS key-repeat while the key stays held down.
    if (this.activeKeys.has(canonical)) return;
    this.activeKeys.add(canonical);

    this._fireKeyboardThrust();
  }

  _onKeyUp(e) {
    if (!canonical) return;
    this.activeKeys.delete(canonical);
  }

  _fireKeyboardThrust() {
    let dx = 0;
    let dy = 0;
    for (const dir of this.activeKeys) {
      const v = DIR_VECTORS[dir];
      dx += v.x;
      dy += v.y;
    }
    if (dx === 0 && dy === 0) return;

    const direction = normalize({ x: dx, y: dy });
    if (this.callbacks.onThrust) this.callbacks.onThrust(direction);
  }

  // ---------------------------------------------------------------------
  // Mouse click / touch tap fallback on the canvas itself
  // ---------------------------------------------------------------------

  _onCanvasClick(e) {
    if (this.suppressNextClick) {
      this.suppressNextClick = false;
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    const point = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };

    const delta = sub(point, this.shipPosition);
    if (delta.x === 0 && delta.y === 0) return;

    if (this.callbacks.onThrust) this.callbacks.onThrust(direction);
  }

  // ---------------------------------------------------------------------
  // Touch joystick (drag #joystick-knob inside #joystick)
  // ---------------------------------------------------------------------

  _setupJoystick() {
    if (!this.joystickEl || !this.joystickKnobEl) return;

    const containerRect = this.joystickEl.getBoundingClientRect();
    this.joystickMaxRadius = Math.max(20, containerRect.width / 2 - this.joystickKnobEl.getBoundingClientRect().width / 2);

    this.joystickKnobEl.addEventListener('pointerdown', this._onKnobPointerDown);
    window.addEventListener('pointermove', this._onKnobPointerMove);
    window.addEventListener('pointerup', this._onKnobPointerUp);
    window.addEventListener('pointercancel', this._onKnobPointerUp);
  }

  _onKnobPointerDown(e) {
    e.preventDefault();
    this.joystickActive = true;
    this.joystickPointerId = e.pointerId;
    this.joystickDirection = { x: 0, y: 0 };
    if (this.joystickKnobEl.setPointerCapture) {
      try {
        this.joystickKnobEl.setPointerCapture(e.pointerId);
      } catch (err) {
        // Pointer capture is best-effort; ignore failures on unsupported browsers.
      }
    }
  }

  _onKnobPointerMove(e) {
    if (!this.joystickActive || !this.joystickEl || !this.joystickKnobEl) return;
    if (this.joystickPointerId !== null && e.pointerId !== this.joystickPointerId) return;

    const centerX = containerRect.left + containerRect.width / 2;
    const centerY = containerRect.top + containerRect.height / 2;

    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > this.joystickMaxRadius && dist > 0) {
      const scale = this.joystickMaxRadius / dist;
      dx *= scale;
      dy *= scale;
    }

    this.joystickKnobEl.style.transform = `translate(${dx}px, ${dy}px)`;

    if (dist > 0.001) {
      this.joystickDirection = normalize({ x: dx, y: dy });
    } else {
      this.joystickDirection = { x: 0, y: 0 };
    }
  }

  _onKnobPointerUp(e) {
    if (!this.joystickActive) return;
    if (this.joystickPointerId !== null && e.pointerId !== this.joystickPointerId) return;

    this.joystickActive = false;
    this.joystickPointerId = null;

    if (this.joystickKnobEl) {
      this.joystickKnobEl.style.transform = 'translate(0px, 0px)';
    }

    const dir = this.joystickDirection;
    this.joystickDirection = { x: 0, y: 0 };

    if (dir.x !== 0 || dir.y !== 0) {
      // Avoid a duplicate thrust from a synthetic click that some touch
      // browsers fire on the element under the finger at release time.
      this.suppressNextClick = true;
      if (this.callbacks.onThrust) this.callbacks.onThrust(dir);
      window.setTimeout(() => {
        this.suppressNextClick = false;
      }, 300);
    }
  }

  // ---------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------

  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    this.canvas.removeEventListener('click', this._onCanvasClick);

    if (this.joystickKnobEl) {
      this.joystickKnobEl.removeEventListener('pointerdown', this._onKnobPointerDown);
    }
    window.removeEventListener('pointermove', this._onKnobPointerMove);
    window.removeEventListener('pointerup', this._onKnobPointerUp);
    window.removeEventListener('pointercancel', this._onKnobPointerUp);

    this.activeKeys.clear();
  }
}