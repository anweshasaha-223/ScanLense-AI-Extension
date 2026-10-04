/* global chrome */

// ScamLens AI — Manifest V3 Background Service Worker
const BACKEND_ORIGIN = 'https://ais-pre-lurfu7qx3hikdv42pyw7zj-597532729154.asia-southeast1.run.app';

chrome.runtime.onInstalled.addListener(() => {
  try {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: 'scamlens-scan-selection',
        title: 'Scan selected text with ScamLens AI',
        contexts: ['selection'],
      });

      chrome.contextMenus.create({
        id: 'scamlens-scan-link',
        title: 'Inspect suspicious link with ScamLens AI',
        contexts: ['link'],
      });

      chrome.contextMenus.create({
        id: 'scamlens-open-sidepanel',
        title: 'Open ScamLens AI Side Panel',
        contexts: ['page', 'selection', 'link'],
      });
    });
  } catch (e) {
    console.warn('Context menu setup warning:', e);
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'scamlens-scan-selection' && info.selectionText) {
    chrome.storage.local.set(
      {
        pendingScanText: info.selectionText.trim(),
        pendingScanSourceUrl: tab?.url || '',
        pendingScanTimestamp: Date.now(),
      },
      () => {
        if (chrome.sidePanel && chrome.sidePanel.open && tab?.windowId) {
          chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => {
            chrome.tabs.create({ url: chrome.runtime.getURL('index.html?mode=popup') });
          });
        } else {
          chrome.tabs.create({ url: chrome.runtime.getURL('index.html?mode=popup') });
        }
      }
    );
  } else if (info.menuItemId === 'scamlens-scan-link' && info.linkUrl) {
    chrome.storage.local.set(
      {
        pendingScanText: `Suspicious link found on ${tab?.title || 'page'}: ${info.linkUrl}`,
        pendingScanSourceUrl: info.linkUrl,
        pendingScanTimestamp: Date.now(),
      },
      () => {
        if (chrome.sidePanel && chrome.sidePanel.open && tab?.windowId) {
          chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => {
            chrome.tabs.create({ url: chrome.runtime.getURL('index.html?mode=popup') });
          });
        } else {
          chrome.tabs.create({ url: chrome.runtime.getURL('index.html?mode=popup') });
        }
      }
    );
  } else if (info.menuItemId === 'scamlens-open-sidepanel' && tab?.windowId) {
    if (chrome.sidePanel && chrome.sidePanel.open) {
      chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => {});
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'SCAMLENS_QUICK_SCAN' && message.text) {
    chrome.storage.local.set(
      {
        pendingScanText: String(message.text).trim(),
        pendingScanSourceUrl: message.url || sender?.tab?.url || '',
        pendingScanTimestamp: Date.now(),
      },
      () => {
        if (chrome.sidePanel && chrome.sidePanel.open && sender?.tab?.windowId) {
          chrome.sidePanel.open({ windowId: sender.tab.windowId }).catch(() => {
            chrome.tabs.create({ url: chrome.runtime.getURL('index.html?mode=popup') });
          });
        } else {
          chrome.tabs.create({ url: chrome.runtime.getURL('index.html?mode=popup') });
        }
        sendResponse({ ok: true });
      }
    );
    return true;
  }

  if (message?.type === 'SCAMLENS_CAPTURE_TAB') {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError || !dataUrl) {
        sendResponse({
          ok: false,
          error: chrome.runtime.lastError?.message || 'Could not capture visible tab',
        });
      } else {
        sendResponse({ ok: true, dataUrl });
      }
    });
    return true;
  }

  if (message?.type === 'SCAMLENS_PROXY_API') {
    fetch(`${BACKEND_ORIGIN}${message.endpoint}`, {
      method: message.method || 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: message.body ? JSON.stringify(message.body) : undefined,
    })
      .then((r) => r.json())
      .then((data) => sendResponse({ ok: true, data }))
      .catch((err) => sendResponse({ ok: false, error: err?.message || 'Network error' }));
    return true;
  }

  return false;
});
