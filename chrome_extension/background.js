// Trinexus Developer Companion — Smart Tab Manager
// Background Service Worker (Manifest V3)
// BEOCIA Kft. internal developer tool

'use strict';

// ─── Badge Update ────────────────────────────────────────────────────────────

async function updateBadgeCount() {
  try {
    const tabs = await chrome.tabs.query({});
    const count = tabs.length;
    await chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });
    await chrome.action.setBadgeBackgroundColor({ color: '#3b82f6' });
  } catch (err) {
    console.error('[TDC] Badge update failed:', err);
  }
}

// ─── Tab Event Listeners ──────────────────────────────────────────────────────

chrome.tabs.onCreated.addListener(async () => {
  await updateBadgeCount();
});

chrome.tabs.onRemoved.addListener(async () => {
  await updateBadgeCount();
});

chrome.tabs.onUpdated.addListener(async (_tabId, changeInfo) => {
  if (changeInfo.status === 'complete') {
    await updateBadgeCount();
  }
});

// ─── Session Storage Helpers ─────────────────────────────────────────────────

async function getSavedSessions() {
  try {
    const result = await chrome.storage.local.get('tdc_sessions');
    return result.tdc_sessions || {};
  } catch (err) {
    console.error('[TDC] Failed to load sessions:', err);
    return {};
  }
}

async function saveSession(name, tabs) {
  try {
    const sessions = await getSavedSessions();
    sessions[name] = {
      name,
      savedAt: new Date().toISOString(),
      tabs: tabs.map(tab => ({
        url: tab.url,
        title: tab.title,
        favIconUrl: tab.favIconUrl || ''
      }))
    };
    await chrome.storage.local.set({ tdc_sessions: sessions });
    return { success: true, sessionName: name, tabCount: tabs.length };
  } catch (err) {
    console.error('[TDC] Failed to save session:', err);
    return { success: false, error: err.message };
  }
}

async function deleteSession(name) {
  try {
    if (!sessions[name]) {
      return { success: false, error: 'Session not found: ' + name };
    }
    delete sessions[name];
    await chrome.storage.local.set({ tdc_sessions: sessions });
    return { success: true };
  } catch (err) {
    console.error('[TDC] Failed to delete session:', err);
    return { success: false, error: err.message };
  }
}

async function restoreSession(name) {
  try {
    const session = sessions[name];
    if (!session) {
      return { success: false, error: 'Session not found: ' + name };
    }
    const validTabs = session.tabs.filter(tab => tab.url && tab.url.startsWith('http'));
    for (const tab of validTabs) {
      try {
        await chrome.tabs.create({ url: tab.url, active: false });
      } catch (tabErr) {
        console.warn('[TDC] Could not open tab:', tab.url, tabErr.message);
      }
    }
    await updateBadgeCount();
    return { success: true, restoredCount: validTabs.length };
  } catch (err) {
    console.error('[TDC] Failed to restore session:', err);
    return { success: false, error: err.message };
  }
}

// ─── Message Handler ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const { action, payload } = message || {};

  if (!action) {
    sendResponse({ success: false, error: 'No action specified.' });
    return false;
  }

  switch (action) {
    case 'GET_TABS': {
      chrome.tabs.query({})
        .then(tabs => {
          sendResponse({ success: true, tabs });
        })
        .catch(err => {
          console.error('[TDC] GET_TABS error:', err);
          sendResponse({ success: false, error: err.message });
        });
      return true;
    }

    case 'SWITCH_TAB': {
      const { tabId, windowId } = payload || {};
      if (!tabId) {
        sendResponse({ success: false, error: 'tabId is required.' });
        return false;
      }
      chrome.tabs.update(tabId, { active: true })
        .then(() => chrome.windows.update(windowId, { focused: true }))
        .then(() => sendResponse({ success: true }))
        .catch(err => {
          console.error('[TDC] SWITCH_TAB error:', err);
          sendResponse({ success: false, error: err.message });
        });
      return true;
    }

    case 'CLOSE_TAB': {
      const { tabId } = payload || {};
      if (!tabId) {
        sendResponse({ success: false, error: 'tabId is required.' });
        return false;
      }
      chrome.tabs.remove(tabId)
        .then(() => sendResponse({ success: true }))
        .catch(err => {
          console.error('[TDC] CLOSE_TAB error:', err);
          sendResponse({ success: false, error: err.message });
        });
      return true;
    }

    case 'SAVE_SESSION': {
      const { name } = payload || {};
      if (!name || !name.trim()) {
        sendResponse({ success: false, error: 'Session name is required.' });
        return false;
      }
      chrome.tabs.query({})
        .then(tabs => saveSession(name.trim(), tabs))
        .then(result => sendResponse(result))
        .catch(err => {
          console.error('[TDC] SAVE_SESSION error:', err);
          sendResponse({ success: false, error: err.message });
        });
      return true;
    }

    case 'GET_SESSIONS': {
      getSavedSessions()
        .then(sessions => sendResponse({ success: true, sessions }))
        .catch(err => {
          console.error('[TDC] GET_SESSIONS error:', err);
          sendResponse({ success: false, error: err.message });
        });
      return true;
    }

    case 'RESTORE_SESSION': {
      const { name } = payload || {};
      if (!name) {
        sendResponse({ success: false, error: 'Session name is required.' });
        return false;
      }
      restoreSession(name)
        .then(result => sendResponse(result))
        .catch(err => {
          console.error('[TDC] RESTORE_SESSION error:', err);
          sendResponse({ success: false, error: err.message });
        });
      return true;
    }

    case 'DELETE_SESSION': {
      const { name } = payload || {};
      if (!name) {
        sendResponse({ success: false, error: 'Session name is required.' });
        return false;
      }
      deleteSession(name)
        .then(result => sendResponse(result))
        .catch(err => {
          console.error('[TDC] DELETE_SESSION error:', err);
          sendResponse({ success: false, error: err.message });
        });
      return true;
    }

    case 'GET_BADGE_COUNT': {
      chrome.tabs.query({})
        .then(tabs => sendResponse({ success: true, count: tabs.length }))
        .catch(err => {
          console.error('[TDC] GET_BADGE_COUNT error:', err);
          sendResponse({ success: false, error: err.message });
        });
      return true;
    }

    default: {
      sendResponse({ success: false, error: 'Unknown action: ' + action });
      return false;
    }
  }
});

// ─── Startup Init ─────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[TDC] Extension installed/updated:', details.reason);
  await updateBadgeCount();
});

chrome.runtime.onStartup.addListener(async () => {
  console.log('[TDC] Browser startup — Trinexus Developer Companion active.');
  await updateBadgeCount();
});

// Initial badge count on service worker activation
updateBadgeCount();