/* global chrome */

// ScamLens AI — Manifest V3 Background Service Worker
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
    });
  } catch (e) {
    // ignore contextMenu errors
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'scamlens-scan-selection' && info.selectionText) {
    const text = info.selectionText.trim();
    chrome.storage.local.set(
      {
        pendingScanText: text,
        pendingScanSourceUrl: tab?.url || '',
        pendingScanTimestamp: Date.now(),
      },
      () => {
        chrome.windows.create({
          url: chrome.runtime.getURL('popup.html?scan=' + encodeURIComponent(text)),
          type: 'popup',
          width: 440,
          height: 680,
        });
      }
    );
  } else if (info.menuItemId === 'scamlens-scan-link' && info.linkUrl) {
    const text = `Suspicious link found on ${tab?.title || 'page'}: ${info.linkUrl}`;
    chrome.storage.local.set(
      {
        pendingScanText: text,
        pendingScanSourceUrl: info.linkUrl,
        pendingScanTimestamp: Date.now(),
      },
      () => {
        chrome.windows.create({
          url: chrome.runtime.getURL('popup.html?scan=' + encodeURIComponent(text)),
          type: 'popup',
          width: 440,
          height: 680,
        });
      }
    );
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'SCAMLENS_QUICK_SCAN' && message.text) {
    const text = String(message.text).trim();
    chrome.storage.local.set(
      {
        pendingScanText: text,
        pendingScanSourceUrl: message.url || sender?.tab?.url || '',
        pendingScanTimestamp: Date.now(),
      },
      () => {
        chrome.windows.create({
          url: chrome.runtime.getURL('popup.html?scan=' + encodeURIComponent(text)),
          type: 'popup',
          width: 440,
          height: 680,
        });
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

  return false;
});
