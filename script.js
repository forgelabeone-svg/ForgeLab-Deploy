import Game from './js/game.js';
import levels from './js/levels.js';

/*
 * Orbit Drift — entry point.
 * NOTE: This file is NOT dead code — it is loaded directly by index.html via
 *   <script type="module" src="/script.js"></script>
 * That <script> tag is the sole "import" of this module; static import-graph
 * tools that only scan JS `import` statements will not see that reference,
 * but Vite resolves and bundles this file as the app's entry module.
 * Wires the DOM UI (menus, HUD, overlays) to the Game engine (./js/game.js).
 *
 * Game public API (implemented in js/game.js):
 *   new Game(canvas, callbacks)
 *     callbacks.onHudUpdate({ level, thrustRemaining, timeSeconds })
 *     callbacks.onLevelComplete({ levelIndex, timeSeconds, thrustUsed, parTime, parThrust, rating })
 *     callbacks.onGameOver({ reason })
 *     callbacks.onPauseChange(isPaused)
 *   game.playLevel(index)
 *   game.togglePause()
 *   game.restartCurrentLevel()
 *   game.stop()                          -> optional, halts the loop entirely
 *   game.resizeCanvas(width, height)      -> updates internal render dimensions
 *
 * Level metadata comes from js/levels.js (default export `levels`), NOT from
 * the Game instance.
 */

const LS_HOWTO_SEEN = 'orbitDrift_howtoSeen';
const LS_PROGRESS = 'orbitDrift_progress';

const RATING_MEDAL = { gold: '🥇', silver: '🥈', bronze: '🥉' };
const RATING_LABEL = { gold: 'ARANY', silver: 'EZÜST', bronze: 'BRONZ' };

function init() {
  const canvas = document.querySelector('#gameCanvas');
  const hud = document.querySelector('#hud');
  const hudLevel = document.querySelector('#hud-level');
  const hudThrust = document.querySelector('#hud-thrust');
  const hudTimer = document.querySelector('#hud-timer');
  const btnPause = document.querySelector('#btn-pause');
  const touchHint = document.querySelector('#touch-hint');

  const screenMenu = document.querySelector('#screen-menu');
  const btnPlay = document.querySelector('#btn-play');
  const btnLevelSelect = document.querySelector('#btn-level-select');
  const btnHowToPlay = document.querySelector('#btn-how-to-play');

  const screenLevels = document.querySelector('#screen-levels');
  const levelGrid = document.querySelector('#level-grid');
  const btnLevelsBack = document.querySelector('#btn-levels-back');

  const screenHowto = document.querySelector('#screen-howto');
  const btnHowtoClose = document.querySelector('#btn-howto-close');

  const screenPause = document.querySelector('#screen-pause');
  const btnResume = document.querySelector('#btn-resume');
  const btnRestartPause = document.querySelector('#btn-restart-pause');
  const btnQuitMenu = document.querySelector('#btn-quit-menu');

  const screenComplete = document.querySelector('#screen-complete');
  const ratingMedal = document.querySelector('#rating-medal');
  const ratingLabel = document.querySelector('#rating-label');
  const completeTime = document.querySelector('#complete-time');
  const completeThrust = document.querySelector('#complete-thrust');
  const completeParTime = document.querySelector('#complete-par-time');
  const completeParThrust = document.querySelector('#complete-par-thrust');
  const btnNextLevel = document.querySelector('#btn-next-level');
  const btnReplayLevel = document.querySelector('#btn-replay-level');
  const btnCompleteMenu = document.querySelector('#btn-complete-menu');

  const screenGameover = document.querySelector('#screen-gameover');
  const gameoverReason = document.querySelector('#gameover-reason');
  const btnRestartGameover = document.querySelector('#btn-restart-gameover');
  const btnGameoverMenu = document.querySelector('#btn-gameover-menu');

  const allScreens = [screenMenu, screenLevels, screenHowto, screenPause, screenComplete, screenGameover];

  let currentLevelIndex = 0;
  let touchHintTimer = null;

  function showOnly(screenToShow) {
    allScreens.forEach((screen) => {
      if (screen === screenToShow) screen.classList.remove('hidden');
      else screen.classList.add('hidden');
    });
  }

  function hideAllScreens() {
    allScreens.forEach((screen) => screen.classList.add('hidden'));
  }

  function formatTime(seconds) {
    const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
    return safeSeconds.toFixed(1).padStart(4, '0');
  }

  function isTouchDevice() {
    return 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
  }

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    if (typeof game.resizeCanvas === 'function') {
      game.resizeCanvas(canvas.width, canvas.height);
    }
  }

  function loadProgress() {
    try {
      const raw = localStorage.getItem(LS_PROGRESS);
      return raw ? JSON.parse(raw) : {};
    } catch (err) {
      return {};
    }
  }

  function saveProgress(levelIndex, rating, timeSeconds, thrustUsed) {
    const progress = loadProgress();
    const existing = progress[levelIndex];
    const rank = { bronze: 1, silver: 2, gold: 3 };
    if (!existing || rank[rating] > rank[existing.rating]) {
      progress[levelIndex] = { rating, timeSeconds, thrustUsed };
      try {
        localStorage.setItem(LS_PROGRESS, JSON.stringify(progress));
      } catch (err) {
        /* localStorage unavailable — ignore silently */
      }
    }
  }

  function showTouchHint() {
    if (!isTouchDevice()) return;
    touchHint.classList.remove('hidden');
    if (touchHintTimer) clearTimeout(touchHintTimer);
    touchHintTimer = setTimeout(() => {
      touchHint.classList.add('hidden');
    }, 4000);
  }

  function hideTouchHint() {
    touchHint.classList.add('hidden');
    if (touchHintTimer) clearTimeout(touchHintTimer);
  }

  function onHudUpdate(state) {
    hudLevel.textContent = String(state.level + 1);
    hudThrust.textContent = String(state.thrustRemaining);
    hudTimer.textContent = formatTime(state.timeSeconds);
  }

  function onLevelComplete(result) {
    hud.classList.add('hidden');
    hideTouchHint();
    currentLevelIndex = result.levelIndex;
    ratingMedal.textContent = RATING_MEDAL[result.rating] || RATING_MEDAL.bronze;
    ratingLabel.textContent = RATING_LABEL[result.rating] || RATING_LABEL.bronze;
    completeTime.textContent = formatTime(result.timeSeconds) + 's';
    completeThrust.textContent = String(result.thrustUsed);
    completeParTime.textContent = formatTime(result.parTime) + 's';
    completeParThrust.textContent = String(result.parThrust);
    saveProgress(result.levelIndex, result.rating, result.timeSeconds, result.thrustUsed);
    const hasNext = result.levelIndex + 1 < levels.length;
    btnNextLevel.classList.toggle('hidden', !hasNext);
    showOnly(screenComplete);
  }

  function onGameOver(info) {
    hud.classList.add('hidden');
    hideTouchHint();
    const reasons = {
      collision: 'A hajó becsapódott egy bolygóba.',
      bounds: 'A hajó kirepült a pálya határain túl.',
    };
    gameoverReason.textContent = reasons[info.reason] || 'A küldetés megszakadt.';
    showOnly(screenGameover);
  }

  function onPauseChange(isPaused) {
    if (isPaused) {
      showOnly(screenPause);
    } else {
      hideAllScreens();
      hud.classList.remove('hidden');
      showTouchHint();
    }
  }

  const game = new Game(canvas, { onHudUpdate, onLevelComplete, onGameOver, onPauseChange });

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function startLevel(index) {
    currentLevelIndex = index;
    hideAllScreens();
    hud.classList.remove('hidden');
    game.playLevel(index);
    showTouchHint();
  }

  function populateLevelGrid() {
    levelGrid.innerHTML = '';
    levels.forEach((level, index) => {
      const card = document.createElement('button');
      card.className = 'btn btn-ghost';
      const saved = progress[index];
      const medal = saved ? RATING_MEDAL[saved.rating] || '' : '';
      card.textContent = `Pálya ${index + 1}${medal ? ' ' + medal : ''}`;
      card.addEventListener('click', () => {
        startLevel(index);
      });
      levelGrid.appendChild(card);
    });
  }

  btnPlay.addEventListener('click', () => {
    startLevel(0);
  });

  btnLevelSelect.addEventListener('click', () => {
    populateLevelGrid();
    showOnly(screenLevels);
  });

  btnHowToPlay.addEventListener('click', () => {
    showOnly(screenHowto);
  });

  btnLevelsBack.addEventListener('click', () => {
    showOnly(screenMenu);
  });

  btnHowtoClose.addEventListener('click', () => {
    try {
      localStorage.setItem(LS_HOWTO_SEEN, '1');
    } catch (err) {
      /* localStorage unavailable — ignore silently */
    }
    showOnly(screenMenu);
  });

  btnPause.addEventListener('click', () => {
    game.togglePause();
    onPauseChange(true);
  });

  btnResume.addEventListener('click', () => {
    game.togglePause();
    onPauseChange(false);
  });

  btnRestartPause.addEventListener('click', () => {
    game.restartCurrentLevel();
    onPauseChange(false);
  });

  btnQuitMenu.addEventListener('click', () => {
    if (typeof game.stop === 'function') game.stop();
    hud.classList.add('hidden');
    hideTouchHint();
    showOnly(screenMenu);
  });

  btnNextLevel.addEventListener('click', () => {
    const nextIndex = currentLevelIndex + 1;
    if (nextIndex < levels.length) {
      startLevel(nextIndex);
    } else {
      showOnly(screenMenu);
    }
  });

  btnReplayLevel.addEventListener('click', () => {
    startLevel(currentLevelIndex);
  });

  btnCompleteMenu.addEventListener('click', () => {
    if (typeof game.stop === 'function') game.stop();
    hud.classList.add('hidden');
    hideTouchHint();
    showOnly(screenMenu);
  });

  btnRestartGameover.addEventListener('click', () => {
    startLevel(currentLevelIndex);
  });

  btnGameoverMenu.addEventListener('click', () => {
    if (typeof game.stop === 'function') game.stop();
    hud.classList.add('hidden');
    hideTouchHint();
    showOnly(screenMenu);
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      const pauseVisible = !screenPause.classList.contains('hidden');
      const hudVisible = !hud.classList.contains('hidden');
      if (pauseVisible) {
        game.togglePause();
        onPauseChange(false);
      } else if (hudVisible) {
        game.togglePause();
        onPauseChange(true);
      }
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (!hud.classList.contains('hidden') && typeof game.togglePause === 'function') {
        game.togglePause();
        onPauseChange(true);
      }
    }
  });

  hideAllScreens();
  const alreadySeenHowto = localStorage.getItem(LS_HOWTO_SEEN);
  if (!alreadySeenHowto) {
    showOnly(screenHowto);
  } else {
    showOnly(screenMenu);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
// [FL:DONE]