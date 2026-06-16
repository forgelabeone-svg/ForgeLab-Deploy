/**
 * chrome_extension/popup.js
 * Smart Tab Manager — Trinexus Developer Companion
 * BEOCIA Kft. / Trinexus Aqua — internal developer tool
 *
 * CSP compliant: no inline scripts, no inline event handlers.
 * All chrome.* API calls wrapped in try/catch with async/await.
 */

'use strict';

// ---------------------------------------------------------------------------
// DOM references (populated after DOMContentLoaded)
// ---------------------------------------------------------------------------
let tabCountBadge;
let tabListEl;
let searchInput;
let clearSearchBtn;
let emptyState;
let loadingState;
let saveSessionBtn;
let sessionListEl;
let noSessionsMsg;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let allTabs = [];
let searchQuery = '';

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

/**
 * Truncate a string to maxLen characters, appending ellipsis if needed.
 * @param {string} str
 * @param {number} maxLen
 * @returns {string}
 */
function truncate(str, maxLen) {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}

/**
 * Safely escape HTML to prevent XSS in innerHTML assignments.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generate a timestamp string for session naming.
 * Format: YYYY-MM-DD HH:MM
 * @returns {string}
 */
function nowLabel() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ---------------------------------------------------------------------------
// Badge update via chrome.action
// ---------------------------------------------------------------------------

/**
 * Update the extension badge text with the current open tab count.
 * @param {number} count
 */
async function updateBadge(count) {
  try {
    await chrome.action.setBadgeText({ text: String(count) });
    await chrome.action.setBadgeBackgroundColor({ color: '#3b82f6' });
  } catch (err) {
    // Badge API unavailable in some contexts — non-fatal
    console.warn('[SmartTabManager] Badge update failed:', err.message);
  }
}

// ---------------------------------------------------------------------------
// Tab loading and rendering
// ---------------------------------------------------------------------------

/**
 * Load all open tabs from chrome.tabs API.
 * @returns {Promise<chrome.tabs.Tab[]>}
 */
async function loadTabs() {
  try {
    const tabs = await chrome.tabs.query({});
    return tabs;
  } catch (err) {
    console.error('[SmartTabManager] Failed to query tabs:', err.message);
    return [];
  }
}

/**
 * Filter tabs by the current search query (title or URL).
 * @param {chrome.tabs.Tab[]} tabs
 * @param {string} query
 * @returns {chrome.tabs.Tab[]}
 */
function filterTabs(tabs, query) {
  const q = query.trim().toLowerCase();
  if (!q) return tabs;
  return tabs.filter((tab) => {
    const title = (tab.title || '').toLowerCase();
    const url = (tab.url || '').toLowerCase();
    return title.includes(q) || url.includes(q);
  });
}

/**
 * Build and inject the tab list into the DOM.
 * @param {chrome.tabs.Tab[]} tabs
 */
function renderTabs(tabs) {
  if (!tabListEl) return;

  // Hide/show states
  loadingState.classList.add('hidden');

  const filtered = filterTabs(tabs, searchQuery);

  if (filtered.length === 0) {
    tabListEl.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  tabListEl.innerHTML = filtered
    .map((tab) => {
      const favicon = tab.favIconUrl
        ? `<img class="tab-favicon" src="${escapeHtml(tab.favIconUrl)}" alt="" onerror="this.style.display='none'" />`
        : `<div class="tab-favicon tab-favicon-placeholder">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
               <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
               <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
             </svg>
           </div>`;

      const activeClass = tab.active ? 'tab-item--active' : '';

      return `
        <li class="tab-item ${activeClass}" data-tab-id="${tab.id}" data-window-id="${tab.windowId}">
          <button class="tab-switch-btn" data-tab-id="${tab.id}" data-window-id="${tab.windowId}" title="Switch to tab">
            ${favicon}
            <div class="tab-info">
              <span class="tab-title">${title}</span>
              <span class="tab-url">${url}</span>
            </div>
          </button>
          <button class="tab-close-btn" data-tab-id="${tab.id}" title="Close tab" aria-label="Close tab">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </li>`;
    })
    .join('');
}

/**
 * Refresh tabs: re-query, update badge, re-render.
 */
async function refreshTabs() {
  loadingState.classList.remove('hidden');
  emptyState.classList.add('hidden');
  tabListEl.innerHTML = '';

  allTabs = await loadTabs();

  if (tabCountBadge) {
    tabCountBadge.textContent = allTabs.length;
  }

  await updateBadge(allTabs.length);
  renderTabs(allTabs);
}

// ---------------------------------------------------------------------------
// Tab actions
// ---------------------------------------------------------------------------

/**
 * Switch to a tab by tabId and windowId.
 * @param {number} tabId
 * @param {number} windowId
 */
async function switchToTab(tabId, windowId) {
  try {
    await chrome.tabs.update(tabId, { active: true });
    await chrome.windows.update(windowId, { focused: true });
    window.close(); // Close popup after switching
  } catch (err) {
    console.error('[SmartTabManager] Failed to switch tab:', err.message);
  }
}

/**
 * Close a tab by tabId.
 * @param {number} tabId
 */
async function closeTab(tabId) {
  try {
    await chrome.tabs.remove(tabId);
    await refreshTabs();
  } catch (err) {
    console.error('[SmartTabManager] Failed to close tab:', err.message);
  }
}

// ---------------------------------------------------------------------------
// Event delegation for tab list
// ---------------------------------------------------------------------------

/**
 * Handle clicks inside the tab list via event delegation.
 * @param {MouseEvent} event
 */
function onTabListClick(event) {
  // Switch button
  const switchBtn = event.target.closest('.tab-switch-btn');
  if (switchBtn) {
    const tabId = parseInt(switchBtn.dataset.tabId, 10);
    const windowId = parseInt(switchBtn.dataset.windowId, 10);
    if (!isNaN(tabId) && !isNaN(windowId)) {
      switchToTab(tabId, windowId);
    }
    return;
  }

  // Close button
  const closeBtn = event.target.closest('.tab-close-btn');
  if (closeBtn) {
    if (!isNaN(tabId)) {
      closeTab(tabId);
    }
    return;
  }
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

/**
 * Handle search input changes.
 * @param {Event} event
 */
function onSearchInput(event) {
  searchQuery = event.target.value;
  clearSearchBtn.classList.toggle('hidden', !searchQuery);
  renderTabs(allTabs);
}

/**
 * Clear search input and reset filter.
 */
function onClearSearch() {
  searchInput.value = '';
  searchQuery = '';
  clearSearchBtn.classList.add('hidden');
  renderTabs(allTabs);
}

// ---------------------------------------------------------------------------
// Session management
// ---------------------------------------------------------------------------

/**
 * Load saved sessions from chrome.storage.local.
 * @returns {Promise<Object>} sessions map: { [label]: Tab[] }
 */
async function loadSessions() {
  try {
    const result = await chrome.storage.local.get('smartTabSessions');
    return result.smartTabSessions || {};
  } catch (err) {
    console.error('[SmartTabManager] Failed to load sessions:', err.message);
    return {};
  }
}

/**
 * Save sessions map to chrome.storage.local.
 * @param {Object} sessions
 */
async function saveSessions(sessions) {
  try {
    await chrome.storage.local.set({ smartTabSessions: sessions });
  } catch (err) {
    console.error('[SmartTabManager] Failed to save sessions:', err.message);
  }
}

/**
 * Save the current open tabs as a named session.
 */
async function saveCurrentSession() {
  if (!allTabs || allTabs.length === 0) return;

  const label = nowLabel();
  const sessions = await loadSessions();

  // Store minimal tab info (url + title only — no personal data beyond what tabs API returns)
  sessions[label] = allTabs.map((tab) => ({
    url: tab.url || '',
    title: tab.title || 'Untitled',
    favIconUrl: tab.favIconUrl || '',
  }));

  await saveSessions(sessions);
  await renderSessions();
}

/**
 * Restore a saved session by opening each URL in a new tab.
 * @param {string} label
 */
async function restoreSession(label) {
  const sessionTabs = sessions[label];
  if (!sessionTabs || sessionTabs.length === 0) return;

  try {
    for (const tabInfo of sessionTabs) {
      if (tabInfo.url && tabInfo.url.startsWith('http')) {
        await chrome.tabs.create({ url: tabInfo.url, active: false });
      }
    }
    await refreshTabs();
  } catch (err) {
    console.error('[SmartTabManager] Failed to restore session:', err.message);
  }
}

/**
 * Delete a saved session by label.
 * @param {string} label
 */
async function deleteSession(label) {
  delete sessions[label];
  await saveSessions(sessions);
  await renderSessions();
}

/**
 * Render saved sessions list into the DOM.
 */
async function renderSessions() {
  if (!sessionListEl) return;

  const labels = Object.keys(sessions).sort().reverse();

  if (labels.length === 0) {
    sessionListEl.innerHTML = '';
    if (noSessionsMsg) noSessionsMsg.classList.remove('hidden');
    return;
  }

  if (noSessionsMsg) noSessionsMsg.classList.add('hidden');

  sessionListEl.innerHTML = labels
    .map((label) => {
      const count = sessions[label].length;
      const safeLabel = escapeHtml(label);
      return `
        <li class="session-item">
          <div class="session-info">
            <span class="session-label">${safeLabel}</span>
            <span class="session-count">${count} tab${count !== 1 ? 's' : ''}</span>
          </div>
          <div class="session-actions">
            <button class="session-restore-btn" data-session-label="${safeLabel}" title="Restore session">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.6"/>
              </svg>
              Restore
            </button>
            <button class="session-delete-btn" data-session-label="${safeLabel}" title="Delete session">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
              Delete
            </button>
          </div>
        </li>`;
    })
    .join('');
}

/**
 * Handle clicks inside the session list via event delegation.
 * @param {MouseEvent} event
 */
function onSessionListClick(event) {
  const restoreBtn = event.target.closest('.session-restore-btn');
  if (restoreBtn) {
    const label = restoreBtn.dataset.sessionLabel;
    if (label) restoreSession(label);
    return;
  }

  const deleteBtn = event.target.closest('.session-delete-btn');
  if (deleteBtn) {
    const label = deleteBtn.dataset.sessionLabel;
    if (label) deleteSession(label);
    return;
  }
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

/**
 * Initialize the popup: bind DOM references, attach event listeners, load data.
 */
async function init() {
  // Bind DOM references
  tabCountBadge = document.getElementById('tab-count-badge');
  tabListEl = document.getElementById('tab-list');
  searchInput = document.getElementById('search-input');
  clearSearchBtn = document.getElementById('clear-search-btn');
  emptyState = document.getElementById('empty-state');
  loadingState = document.getElementById('loading-state');
  saveSessionBtn = document.getElementById('save-session-btn');
  sessionListEl = document.getElementById('session-list');
  noSessionsMsg = document.getElementById('no-sessions-msg');

  // Guard: ensure critical elements exist
  if (!tabListEl || !searchInput) {
    console.error('[SmartTabManager] Required DOM elements not found. Check popup.html structure.');
    return;
  }

  // Attach event listeners
  tabListEl.addEventListener('click', onTabListClick);

  searchInput.addEventListener('input', onSearchInput);

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', onClearSearch);
  }

  if (saveSessionBtn) {
    saveSessionBtn.addEventListener('click', saveCurrentSession);
  }

  if (sessionListEl) {
    sessionListEl.addEventListener('click', onSessionListClick);
  }

  // Initial data load
  await refreshTabs();
  await renderSessions();
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', init);