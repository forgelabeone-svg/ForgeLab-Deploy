/**
 * Trinexus Developer Companion — script.js
 * Chrome Companion 1.4 — BEOCIA Kft. / Trinexus Aqua
 * Main JavaScript for the internal developer dashboard.
 */

'use strict';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const state = {
  logEntries: [],
  apiStatus: 'unknown', // 'ok' | 'error' | 'unknown'
  bridgeBaseUrl: 'http://localhost:8000',
  readOnly: true,
};

const UNAS_ENDPOINTS = [
  'login','getOrder','setOrder','getStock','setStock',
  'getProduct','setProduct','getProductDB','setProductDB',
  'getProductParameter','setProductParameter',
  'getCategory','setCategory',
  'getCustomer','setCustomer','checkCustomer',
  'getCustomerGroup','setCustomerGroup',
  'getNewsletter','setNewsletter',
  'getOrderStatus','setOrderStatus',
  'getMethod','setMethod',
  'getWarehouse','setWarehouse',
  'getSetting','setSetting',
];

// ---------------------------------------------------------------------------
// Logging helpers
// ---------------------------------------------------------------------------
function timestamp() {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

function maskSecret(s) {
  if (!s || s.length < 8) return '****';
  return s.substring(0, 4) + '****' + s.substring(s.length - 4);
}

function addLog(level, message) {
  state.logEntries.push({ level, message, time: timestamp() });
  renderLogConsole();
  updateLogCount();
}

function renderLogConsole() {
  const logConsole = document.querySelector('#logConsole');
  if (!logConsole) return;

  const html = state.logEntries.map(entry => {
    const levelClass = entry.level === 'ERROR' ? 'log-error'
      : entry.level === 'WARN' ? 'log-warn'
      : entry.level === 'SUCCESS' ? 'log-success'
      : 'log-info';
    const safeMsg = entry.message.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<div class="log-entry ${levelClass}"><span class="log-time">${entry.time}</span> <span class="log-level">[${entry.level}]</span> ${safeMsg}</div>`;
  }).join('');

  logConsole.innerHTML = html || '<div class="log-empty">No log entries yet. Run an action from the sidebar.</div>';
  logConsole.scrollTop = logConsole.scrollHeight;
}

function updateLogCount() {
  const statLogs = document.querySelector('#statLogs');
  if (statLogs) statLogs.textContent = String(state.logEntries.length);
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------
function initNavigation() {
  const navBtns = document.querySelectorAll('.nav-btn');
  const sections = document.querySelectorAll('.section');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-section');
      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      sections.forEach(s => {
        s.classList.remove('active');
        if (s.id === 'section-' + target) s.classList.add('active');
      });
      addLog('INFO', `Navigated to section: ${target}`);
    });
  });
}

// ---------------------------------------------------------------------------
// Sidebar actions
// ---------------------------------------------------------------------------
function initSidebarActions() {
  const sidebarBtns = document.querySelectorAll('.sidebar-btn');
  sidebarBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.getAttribute('data-action');
      handleSidebarAction(action);
    });
  });
}

function handleSidebarAction(action) {
  addLog('INFO', `Sidebar action triggered: ${action}`);

  // Navigate to logs section to show results
  const navBtns = document.querySelectorAll('.nav-btn');
  const sections = document.querySelectorAll('.section');

  switch (action) {
    case 'healthcheck':
      runApiAction('/unas/healthcheck', 'UNAS Healthcheck');
      break;
    case 'order-statuses':
      runApiAction('/unas/order-statuses', 'Get Order Statuses');
      break;
    case 'get-orders':
      runApiAction('/unas/orders?limit=10', 'Get Orders (limit=10)');
      break;
    case 'get-products':
      runApiAction('/unas/products?limit=5', 'Get Products (limit=5)');
      break;
    case 'get-stock':
      runApiAction('/unas/stock', 'Get Stock');
      break;
    case 'get-methods':
      runApiAction('/unas/methods', 'Get Methods');
      break;
    case 'get-warehouses':
      runApiAction('/unas/warehouses', 'Get Warehouses');
      break;
    case 'ext-setup':
      showModal('Chrome Extension Setup Guide', buildExtSetupContent());
      return;
    case 'ext-test':
      showModal('CSP Checker', buildCspCheckerContent());
      return;
    case 'ext-manifest':
      showModal('Manifest V3 Information', buildManifestInfoContent());
      return;
    case 'env-check':
      showModal('.env Configuration Check', buildEnvCheckContent());
      return;
    case 'api-bridge':
      showModal('Local API Bridge', buildApiBridgeContent());
      return;
    default:
      addLog('WARN', `Unknown action: ${action}`);
      return;
  }

  // Switch to logs tab for API actions
  navBtns.forEach(b => b.classList.remove('active'));
  const logsNav = document.querySelector('.nav-btn[data-section="logs"]');
  if (logsNav) logsNav.classList.add('active');
  sections.forEach(s => {
    s.classList.remove('active');
    if (s.id === 'section-logs') s.classList.add('active');
  });
}

// ---------------------------------------------------------------------------
// API Bridge calls (to local Python server at localhost:8000)
// ---------------------------------------------------------------------------
async function runApiAction(path, label) {
  addLog('INFO', `[${label}] Calling local API bridge: ${state.bridgeBaseUrl}${path}`);
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(state.bridgeBaseUrl + path, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errText = '';
      try { errText = await response.text(); } catch (_) { errText = '(no body)'; }
      addLog('ERROR', `[${label}] HTTP ${response.status}: ${errText.substring(0, 200)}`);
      return;
    }

    const data = await response.json();
    addLog('SUCCESS', `[${label}] Response OK. Data: ${JSON.stringify(data).substring(0, 300)}`);

    if (path.includes('healthcheck')) {
      setApiStatus('ok');
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      addLog('ERROR', `[${label}] Request timed out (8s). Is the local API bridge running? Start with: python main.py serve`);
    } else {
      addLog('ERROR', `[${label}] Connection failed: ${err.message}. Make sure the Python API bridge is running on port 8000.`);
    }
    if (path.includes('healthcheck')) setApiStatus('error');
  }
}

async function checkApiStatus() {
  addLog('INFO', 'Checking local API bridge status...');
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(state.bridgeBaseUrl + '/health', {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);
    if (response.ok) {
      setApiStatus('ok');
      addLog('SUCCESS', 'Local API bridge is reachable at ' + state.bridgeBaseUrl);
    } else {
      setApiStatus('error');
      addLog('WARN', `API bridge returned HTTP ${response.status}`);
    }
  } catch (_) {
    setApiStatus('error');
    addLog('WARN', 'Local API bridge not reachable. Start it with: python main.py serve');
  }
}

function setApiStatus(status) {
  state.apiStatus = status;
  const dot = document.querySelector('#apiStatusDot');
  const label = document.querySelector('#apiStatusLabel');
  if (!dot || !label) return;
  dot.classList.remove('status-ok', 'status-error', 'status-unknown');
  if (status === 'ok') {
    dot.classList.add('status-ok');
    label.textContent = 'API Bridge Online';
  } else if (status === 'error') {
    dot.classList.add('status-error');
    label.textContent = 'API Bridge Offline';
  } else {
    dot.classList.add('status-unknown');
    label.textContent = 'Checking...';
  }
}

// ---------------------------------------------------------------------------
// Copy buttons
// ---------------------------------------------------------------------------
function initCopyButtons() {
  document.addEventListener('click', e => {
    const btn = e.target.closest('.copy-btn');
    if (!btn) return;
    const text = btn.getAttribute('data-copy');
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      const original = btn.textContent;
      btn.textContent = 'Copied!';
      btn.style.background = '#22c55e';
      setTimeout(() => {
        btn.textContent = original;
        btn.style.background = '';
      }, 1500);
      addLog('INFO', `Copied to clipboard: ${text.substring(0, 60)}${text.length > 60 ? '...' : ''}`);
    }).catch(err => {
      addLog('ERROR', 'Clipboard write failed: ' + err.message);
    });
  });
}

// ---------------------------------------------------------------------------
// Clear logs button
// ---------------------------------------------------------------------------
function initClearLogs() {
  const clearBtn = document.querySelector('#clearLogsBtn');
  if (!clearBtn) return;
  clearBtn.addEventListener('click', () => {
    state.logEntries = [];
    renderLogConsole();
    updateLogCount();
  });
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------
function initModal() {
  const overlay = document.querySelector('#modalOverlay');
  const closeBtn = document.querySelector('#modalClose');
  if (!overlay || !closeBtn) return;

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });
}

function showModal(title, bodyHtml) {
  const overlay = document.querySelector('#modalOverlay');
  const titleEl = document.querySelector('#modalTitle');
  const bodyEl = document.querySelector('#modalBody');
  if (!overlay || !titleEl || !bodyEl) return;
  titleEl.textContent = title;
  bodyEl.innerHTML = bodyHtml;
  overlay.classList.add('active');
  addLog('INFO', `Modal opened: ${title}`);
}

function closeModal() {
  const overlay = document.querySelector('#modalOverlay');
  if (overlay) overlay.classList.remove('active');
}

// ---------------------------------------------------------------------------
// Modal content builders
// ---------------------------------------------------------------------------
function buildExtSetupContent() {
  return `
    <ol class="modal-list">
      <li>Open <strong>chrome://extensions</strong> in your Chrome browser.</li>
      <li>Enable <strong>Developer Mode</strong> (top-right toggle).</li>
      <li>Click <strong>Load unpacked</strong>.</li>
      <li>Select the <code>chrome_extension/</code> folder from this project.</li>
      <li>The <em>Smart Tab Manager</em> extension should appear in your toolbar.</li>
      <li>Click the extension icon to open the popup.</li>
      <li>Verify the tab list loads all open tabs.</li>
      <li>Test search, switch, close tab, and session save/restore.</li>
      <li>Check badge count in the toolbar icon.</li>
    </ol>
    <p class="modal-note">Requires icons at: chrome_extension/icons/icon-16.png, icon-32.png, icon-48.png, icon-128.png<br/>Generate with: <code>python scripts/generate_icons.py</code></p>
  `;
}

function buildCspCheckerContent() {
  const cspItems = [
    { label: 'No inline scripts in popup.html', status: 'CSP Rule — all JS must be in popup.js' },
    { label: 'No inline event handlers (onclick=, onerror=)', status: 'CSP Rule — use addEventListener()' },
    { label: 'No eval() or new Function()', status: 'Manifest V3 blocks dynamic code execution' },
    { label: 'No external CDN resources', status: 'All assets must be local to the extension' },
    { label: 'background.js is a service worker', status: 'Manifest V3 — use background.service_worker' },
    { label: 'chrome.* API calls wrapped in try/catch', status: 'Required for robust error handling' },
    { label: 'Permissions declared in manifest.json', status: 'tabs, storage, activeTab required' },
  ];
  const rows = cspItems.map(item => `
    <div class="csp-item">
      <span class="csp-icon">&#10003;</span>
      <div>
        <strong>${item.label}</strong>
        <div class="csp-desc">${item.status}</div>
      </div>
    </div>
  `).join('');
  return `<div class="csp-list">${rows}</div>`;
}

function buildManifestInfoContent() {
  return `
    <p>This extension uses <strong>Chrome Manifest V3</strong>.</p>
    <div class="modal-code"><pre>{
  "manifest_version": 3,
  "name": "Smart Tab Manager",
  "version": "1.4.0",
  "description": "Trinexus Developer Companion — Smart Tab Manager",
  "permissions": ["tabs", "storage", "activeTab"],
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_popup": "popup.html",
    "default_icon": { "16": "icons/icon-16.png", "32": "icons/icon-32.png" }
  },
  "icons": {
    "16": "icons/icon-16.png",
    "32": "icons/icon-32.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  }
}</pre></div>
    <p class="modal-note">Background scripts in MV3 are <strong>service workers</strong> — they do not persist between events. Use <code>chrome.storage</code> for persistence.</p>
  `;
}

function buildEnvCheckContent() {
  const vars = [
    { name: 'UNAS_API_BASE_URL', example: 'https://api.unas.eu/shop/', required: true },
    { name: 'UNAS_API_KEY', example: '<your_unas_api_key>', required: true },
    { name: 'UNAS_SHOP_DOMAIN', example: 'trinexus.hu', required: true },
    { name: 'UNAS_SECONDARY_SHOP_DOMAIN', example: 'trinexus.at', required: false },
    { name: 'UNAS_DEFAULT_LANG', example: 'base', required: false },
    { name: 'UNAS_READ_ONLY', example: 'true', required: false },
    { name: 'UNAS_LOG_LEVEL', example: 'INFO', required: false },
    { name: 'BRIDGE_PORT', example: '8000', required: false },
  ];
  const rows = vars.map(v => `
    <div class="env-row">
      <code class="env-key">${v.name}</code>
      <span class="env-example">${v.example}</span>
      <span class="env-req ${v.required ? 'env-required' : 'env-optional'}">${v.required ? 'Required' : 'Optional'}</span>
    </div>
  `).join('');
  return `
    <p>Copy <code>.env.example</code> to <code>.env</code> and fill in your values:</p>
    <div class="cmd-row" style="margin-bottom:12px;">
      <code class="cmd">cp .env.example .env</code>
      <button class="copy-btn" data-copy="cp .env.example .env">Copy</button>
    </div>
    <div class="env-table">${rows}</div>
    <p class="modal-note">&#128274; Never commit your <code>.env</code> file. It is in <code>.gitignore</code>. Only <code>.env.example</code> is safe to commit.</p>
  `;
}

function buildApiBridgeContent() {
  const endpoints = [
    { method: 'GET', path: '/health', desc: 'Bridge health check — no auth required' },
    { method: 'GET', path: '/unas/healthcheck', desc: 'UNAS API login + token validation' },
    { method: 'GET', path: '/unas/orders?limit=10', desc: 'Fetch recent orders (read-only)' },
    { method: 'GET', path: '/unas/products?limit=5', desc: 'Fetch active products (read-only)' },
    { method: 'GET', path: '/unas/order-statuses', desc: 'Fetch all order statuses' },
    { method: 'GET', path: '/unas/stock', desc: 'Fetch stock levels (read-only)' },
    { method: 'GET', path: '/unas/methods', desc: 'Fetch payment/shipping methods' },
    { method: 'GET', path: '/unas/warehouses', desc: 'Fetch warehouse list' },
  ];
  const rows = endpoints.map(ep => `
    <div class="endpoint-row">
      <span class="ep-method ep-get">${ep.method}</span>
      <code class="ep-path">${ep.path}</code>
      <span class="ep-desc">${ep.desc}</span>
    </div>
  `).join('');
  return `
    <p>Start the local API bridge with:</p>
    <div class="cmd-row" style="margin-bottom:12px;">
      <code class="cmd">python main.py serve --port 8000</code>
      <button class="copy-btn" data-copy="python main.py serve --port 8000">Copy</button>
    </div>
    <p>Current configured bridge URL: <code>${state.bridgeBaseUrl}</code></p>
    <div class="endpoint-list">${rows}</div>
    <p class="modal-note">Secrets are never exposed through the bridge. The API key lives in <code>.env</code> on the server side only.</p>
  `;
}

// ---------------------------------------------------------------------------
// Read-only badge
// ---------------------------------------------------------------------------
function initReadOnlyBadge() {
  const badge = document.querySelector('#readonlyBadge');
  const label = document.querySelector('#readonlyLabel');
  if (!badge || !label) return;
  if (state.readOnly) {
    badge.style.background = 'rgba(239,68,68,0.15)';
    badge.style.borderColor = 'rgba(239,68,68,0.4)';
    label.textContent = 'READ-ONLY MODE';
  } else {
    badge.style.background = 'rgba(34,197,94,0.15)';
    badge.style.borderColor = 'rgba(34,197,94,0.4)';
    label.textContent = 'WRITE MODE ACTIVE';
  }
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------
function initStats() {
  const statEndpoints = document.querySelector('#statEndpoints');
  if (statEndpoints) statEndpoints.textContent = String(UNAS_ENDPOINTS.length);

  const statExtVersion = document.querySelector('#statExtVersion');
  if (statExtVersion) statExtVersion.textContent = '1.4.0';

  const statShops = document.querySelector('#statShops');
  if (statShops) statShops.textContent = '2';

  updateLogCount();
}

// ---------------------------------------------------------------------------
// Inject dynamic modal styles (since static project has no build step)
// ---------------------------------------------------------------------------
function injectModalStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .modal-list { padding-left: 20px; line-height: 2; color: #cbd5e1; }
    .modal-list li { margin-bottom: 4px; }
    .modal-note { margin-top: 16px; font-size: 12px; color: #64748b; border-top: 1px solid #1e293b; padding-top: 10px; }
    .modal-code pre { background: #0f172a; border: 1px solid #1e293b; border-radius: 6px; padding: 14px; font-size: 12px; color: #7dd3fc; overflow-x: auto; white-space: pre-wrap; }
    .csp-list { display: flex; flex-direction: column; gap: 10px; }
    .csp-item { display: flex; gap: 12px; align-items: flex-start; padding: 10px; background: rgba(59,130,246,0.05); border-radius: 6px; border: 1px solid rgba(59,130,246,0.1); }
    .csp-icon { color: #22c55e; font-size: 16px; flex-shrink: 0; margin-top: 2px; }
    .csp-desc { font-size: 12px; color: #64748b; margin-top: 2px; }
    .env-table { display: flex; flex-direction: column; gap: 6px; margin: 12px 0; }
    .env-row { display: flex; align-items: center; gap: 10px; padding: 8px 10px; background: #0f172a; border-radius: 5px; font-size: 13px; flex-wrap: wrap; }
    .env-key { color: #7dd3fc; min-width: 220px; }
    .env-example { color: #64748b; flex: 1; font-size: 12px; }
    .env-req { font-size: 11px; padding: 2px 7px; border-radius: 4px; font-weight: 600; }
    .env-required { background: rgba(239,68,68,0.15); color: #f87171; }
    .env-optional { background: rgba(100,116,139,0.15); color: #94a3b8; }
    .endpoint-list { display: flex; flex-direction: column; gap: 6px; margin: 12px 0; }
    .endpoint-row { display: flex; align-items: center; gap: 10px; padding: 8px 10px; background: #0f172a; border-radius: 5px; font-size: 13px; flex-wrap: wrap; }
    .ep-method { font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 4px; min-width: 44px; text-align: center; }
    .ep-get { background: rgba(34,197,94,0.15); color: #4ade80; }
    .ep-path { color: #7dd3fc; flex: 1; }
    .ep-desc { color: #64748b; font-size: 12px; }
    .log-entry { padding: 4px 0; font-size: 12px; font-family: 'Fira Mono', 'Consolas', monospace; border-bottom: 1px solid rgba(30,41,59,0.5); line-height: 1.6; }
    .log-time { color: #475569; margin-right: 6px; }
    .log-level { font-weight: 700; margin-right: 6px; }
    .log-info .log-level { color: #7dd3fc; }
    .log-error .log-level { color: #f87171; }
    .log-warn .log-level { color: #fbbf24; }
    .log-success .log-level { color: #4ade80; }
    .log-info { color: #cbd5e1; }
    .log-error { color: #fca5a5; }
    .log-warn { color: #fde68a; }
    .log-success { color: #bbf7d0; }
    .log-empty { color: #475569; font-size: 13px; padding: 20px 0; text-align: center; }
    #modalOverlay.active { display: flex !important; }
    .status-dot.status-ok { background: #22c55e; box-shadow: 0 0 8px #22c55e; }
    .status-dot.status-error { background: #ef4444; box-shadow: 0 0 8px #ef4444; }
    .status-dot.status-unknown { background: #94a3b8; }
  `;
  document.head.appendChild(style);
}

// ---------------------------------------------------------------------------
// Inject log console container into logs section if not present
// ---------------------------------------------------------------------------
function ensureLogConsole() {
  const logsSection = document.querySelector('#section-logs');
  if (!logsSection) return;
  if (document.querySelector('#logConsole')) return;

  const existingHeader = logsSection.querySelector('.section-header');

  const logWrapper = document.createElement('div');
  logWrapper.className = 'card';
  logWrapper.style.marginTop = '16px';
  logWrapper.innerHTML = `
    <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
      <span>Log Console</span>
      <button id="clearLogsBtn" style="
        background: rgba(239,68,68,0.15);
        border: 1px solid rgba(239,68,68,0.3);
        color: #f87171;
        padding: 4px 12px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 12px;
      ">Clear Logs</button>
    </div>
    <div class="card-body" id="logConsole" style="
      min-height: 320px;
      max-height: 520px;
      overflow-y: auto;
      background: #0f172a;
      border-radius: 6px;
      padding: 12px;
      font-family: 'Fira Mono', 'Consolas', monospace;
    "></div>
  `;
  logsSection.appendChild(logWrapper);
  initClearLogs();
}

// ---------------------------------------------------------------------------
// Ensure modal exists in DOM
// ---------------------------------------------------------------------------
function ensureModal() {
  if (document.querySelector('#modalOverlay')) return;
  const modal = document.createElement('div');
  modal.id = 'modalOverlay';
  modal.style.cssText = `
    display:none; position:fixed; inset:0; z-index:1000;
    background:rgba(0,0,0,0.7); align-items:center; justify-content:center;
  `;
  modal.innerHTML = `
    <div style="
      background:#1e293b; border:1px solid #334155; border-radius:12px;
      padding:28px; max-width:620px; width:90%; max-height:80vh; overflow-y:auto;
      position:relative;
    ">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
        <h2 id="modalTitle" style="color:#f1f5f9;font-size:18px;margin:0;"></h2>
        <button id="modalClose" style="
          background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);
          color:#f87171;width:30px;height:30px;border-radius:6px;cursor:pointer;
          font-size:16px;line-height:1;
        ">&#215;</button>
      </div>
      <div id="modalBody" style="color:#cbd5e1;font-size:14px;line-height:1.7;"></div>
    </div>
  `;
  document.body.appendChild(modal);
}

// ---------------------------------------------------------------------------
// Periodic status poll
// ---------------------------------------------------------------------------
function startStatusPoll() {
  checkApiStatus();
  setInterval(checkApiStatus, 30000);
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
function init() {
  injectModalStyles();
  ensureLogConsole();
  ensureModal();

  initNavigation();
  initSidebarActions();
  initCopyButtons();
  initModal();
  initReadOnlyBadge();
  initStats();

  addLog('INFO', 'Trinexus Developer Companion v1.4.0 loaded — BEOCIA Kft. / Trinexus Aqua');
  addLog('INFO', 'UNAS API base: https://api.unas.eu/shop/ | Shops: trinexus.hu, trinexus.at');
  addLog('INFO', `Read-only mode: ${state.readOnly ? 'ENABLED — set* operations are blocked' : 'DISABLED — write operations are allowed'}`);
  addLog('INFO', `${UNAS_ENDPOINTS.length} UNAS endpoints registered.`);
  addLog('INFO', 'Local API bridge expected at: ' + state.bridgeBaseUrl);

  startStatusPoll();
}

document.addEventListener('DOMContentLoaded', init);