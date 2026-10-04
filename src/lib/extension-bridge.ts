import { REMOTE_BACKEND_ORIGIN } from './api';
import { UserAction, UserActionType } from './schemas';

declare const chrome: any;

export interface SimulatedBrowserTab {
  id: string;
  title: string;
  url: string;
  badge: string;
  snippet: string;
  defaultAction: UserActionType;
}

export const SIMULATED_ACTIVE_TABS: SimulatedBrowserTab[] = [
  {
    id: 'tab-bank',
    title: 'Chase Security Alert — Verify OTP Immediately',
    url: 'http://198.51.100.42/chase-secure-verify-otp',
    badge: 'Suspicious Bank Tab',
    snippet:
      'URGENT SECURITY NOTICE: We detected an unauthorized sign-in attempt on your checking account. Verify your identity and 6-digit SMS OTP code immediately at http://198.51.100.42/chase-secure-verify-otp or your account access will be permanently suspended within 2 hours.',
    defaultAction: UserAction.CLICKED_LINK,
  },
  {
    id: 'tab-delivery',
    title: 'USPS Package Hold — Customs Fee Required',
    url: 'http://usps-redelivery-claim.xyz/pay-fee',
    badge: 'Fake Delivery Tab',
    snippet:
      'USPS Service Alert: Your parcel #US-9481029 cannot be delivered due to an incomplete street address and $2.99 customs handling fee. Update your delivery details and card info within 12 hours at http://usps-redelivery-claim.xyz/pay-fee to avoid return to sender.',
    defaultAction: UserAction.RECEIVED_ONLY,
  },
  {
    id: 'tab-job',
    title: 'Remote Data Entry Offer — Telegram HR',
    url: 'https://careers-onboarding-vip-task.top/register',
    badge: 'Task Scam Tab',
    snippet:
      'Congratulations! Your resume was selected for our Remote App Optimization role ($350-$600/day, 1 hour daily). To activate your employee workbench and claim your $50 welcome bonus, deposit $100 USDT refundable activation credit at https://careers-onboarding-vip-task.top/register.',
    defaultAction: UserAction.REPLIED,
  },
];

export function isChromeExtensionContext(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof chrome !== 'undefined' &&
    Boolean(chrome?.runtime?.id)
  );
}

/**
 * Checks if the user triggered a scan via Right-Click Context Menu or Floating Quick-Scan pill
 */
export async function consumePendingExtensionScan(): Promise<{
  text?: string;
  sourceUrl?: string;
} | null> {
  if (!isChromeExtensionContext() || !chrome?.storage?.local) {
    return null;
  }

  return new Promise((resolve) => {
    try {
      chrome.storage.local.get(
        ['pendingScanText', 'pendingScanSourceUrl', 'pendingScanTimestamp'],
        (res: any) => {
          if (res?.pendingScanText) {
            chrome.storage.local.remove([
              'pendingScanText',
              'pendingScanSourceUrl',
              'pendingScanTimestamp',
            ]);
            resolve({
              text: String(res.pendingScanText),
              sourceUrl: res.pendingScanSourceUrl ? String(res.pendingScanSourceUrl) : undefined,
            });
          } else {
            resolve(null);
          }
        }
      );
    } catch {
      resolve(null);
    }
  });
}

/**
 * Grabs selected text or page content from the active browser tab.
 */
export async function grabActiveTabSelection(fallbackTab?: SimulatedBrowserTab): Promise<{
  text: string;
  sourceLabel: string;
}> {
  // 1. If running inside Chrome Extension, query active tab via content script or scripting API
  if (isChromeExtensionContext() && chrome?.tabs?.query) {
    try {
      const tabs: any[] = await new Promise((resolve) =>
        chrome.tabs.query({ active: true, currentWindow: true }, (t: any[]) => resolve(t || []))
      );
      const activeTab = tabs[0];
      if (activeTab?.id) {
        const response: any = await new Promise((resolve) => {
          try {
            chrome.tabs.sendMessage(
              activeTab.id,
              { type: 'SCAMLENS_GET_PAGE_SELECTION' },
              (res: any) => resolve(res || null)
            );
          } catch {
            resolve(null);
          }
        });

        if (response?.selectedText) {
          return {
            text: response.selectedText,
            sourceLabel: activeTab.title || 'Active Tab Selection',
          };
        }
        if (response?.pageText) {
          return {
            text: response.pageText,
            sourceLabel: activeTab.title || 'Active Tab Content',
          };
        }

        if (chrome?.scripting?.executeScript) {
          const results = await chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            func: () => {
              const sel = window.getSelection()?.toString().trim();
              if (sel) return sel;
              return (document.body?.innerText || '').trim().slice(0, 2000);
            },
          });
          const extracted = results?.[0]?.result;
          if (extracted) {
            return {
              text: String(extracted),
              sourceLabel: activeTab.title || 'Active Tab',
            };
          }
        }
      }
    } catch {
      // Fall through to web selection / clipboard
    }
  }

  // 2. Check current window selection
  if (typeof window !== 'undefined') {
    const winSel = window.getSelection()?.toString().trim();
    if (winSel && winSel.length > 3) {
      return {
        text: winSel,
        sourceLabel: 'Highlighted Page Text',
      };
    }
  }

  // 3. Try clipboard text if permitted
  if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
    try {
      const clip = (await navigator.clipboard.readText()).trim();
      if (clip.length > 3) {
        return {
          text: clip.slice(0, 4800),
          sourceLabel: 'Clipboard Buffer',
        };
      }
    } catch {
      // Fall through
    }
  }

  // 4. Use currently active simulated tab in extension preview
  const targetTab = fallbackTab || SIMULATED_ACTIVE_TABS[0];
  return {
    text: targetTab.snippet,
    sourceLabel: targetTab.badge,
  };
}

/**
 * Grabs the active browser tab URL and formats it for ScamLens link & phishing inspection.
 */
export async function grabActiveTabUrlSpecimen(fallbackTab?: SimulatedBrowserTab): Promise<{
  text: string;
  url: string;
}> {
  if (isChromeExtensionContext() && chrome?.tabs?.query) {
    try {
      const tabs: any[] = await new Promise((resolve) =>
        chrome.tabs.query({ active: true, currentWindow: true }, (t: any[]) => resolve(t || []))
      );
      const activeTab = tabs[0];
      if (activeTab?.url && !activeTab.url.startsWith('chrome')) {
        return {
          url: activeTab.url,
          text: `Active browser tab inspection:\nTitle: ${activeTab.title || 'Web Page'}\nURL: ${activeTab.url}\nPlease verify if this URL and page title show signs of phishing or domain spoofing.`,
        };
      }
    } catch {
      // Fall through
    }
  }

  const targetTab = fallbackTab || SIMULATED_ACTIVE_TABS[0];
  return {
    url: targetTab.url,
    text: `Active Browser Tab Inspection:\nPage Title: ${targetTab.title}\nTab URL: ${targetTab.url}\nPage Excerpt: ${targetTab.snippet}`,
  };
}

/**
 * Captures the visible browser tab screenshot for Gemma Multimodal OCR.
 */
export async function captureVisibleTabScreenshot(fallbackTab?: SimulatedBrowserTab): Promise<{
  base64: string;
  mimeType: 'image/png';
}> {
  if (isChromeExtensionContext() && chrome?.runtime?.sendMessage) {
    try {
      const res: any = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'SCAMLENS_CAPTURE_TAB' }, (r: any) => resolve(r));
      });
      if (res?.ok && res?.dataUrl) {
        return {
          base64: res.dataUrl,
          mimeType: 'image/png',
        };
      }
    } catch {
      // Fall through to canvas tab capture
    }
  }

  const targetTab = fallbackTab || SIMULATED_ACTIVE_TABS[0];
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(24, 24, canvas.width - 48, 44);
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(48, 46, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(68, 46, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px monospace';
    ctx.fillText(targetTab.url.slice(0, 58), 95, 51);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(24, 68, canvas.width - 48, canvas.height - 92);

    ctx.fillStyle = '#e11d48';
    ctx.font = 'bold 19px sans-serif';
    ctx.fillText(targetTab.title.slice(0, 48), 48, 114);

    ctx.fillStyle = '#1e293b';
    ctx.font = '14px sans-serif';
    const words = targetTab.snippet.split(' ');
    let line = '';
    let y = 152;
    for (const w of words) {
      if ((line + w).length > 68) {
        ctx.fillText(line.trim(), 48, y);
        line = w + ' ';
        y += 26;
      } else {
        line += w + ' ';
      }
    }
    if (line.trim()) {
      ctx.fillText(line.trim(), 48, y);
    }

    ctx.fillStyle = '#e11d48';
    ctx.fillRect(48, 256, 260, 40);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('VERIFY IDENTITY & OTP NOW', 68, 281);
  }

  return {
    base64: canvas.toDataURL('image/png'),
    mimeType: 'image/png',
  };
}

/**
 * Generates an extension icon PNG as Uint8Array for packaging inside the .zip
 */
function generateIconPngBytes(size: number): Uint8Array {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#4f46e5');
    grad.addColorStop(0.5, '#9333ea');
    grad.addColorStop(1, '#ec4899');
    ctx.fillStyle = grad;
    const radius = Math.round(size * 0.22);
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(size - radius, 0);
    ctx.quadraticCurveTo(size, 0, size, radius);
    ctx.lineTo(size, size - radius);
    ctx.quadraticCurveTo(size, size, size - radius, size);
    ctx.lineTo(radius, size);
    ctx.quadraticCurveTo(0, size, 0, size - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.fill();

    // Shield symbol in center
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(size * 0.52)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', size / 2, size / 2 + size * 0.04);
  }
  const dataUrl = canvas.toDataURL('image/png');
  const base64 = dataUrl.split(',')[1] || '';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Pure TypeScript ZIP Archive Builder (Store method + CRC32)
 * Supports both UTF-8 text files and binary Uint8Array files (for icons).
 */
function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c ^= bytes[i];
    for (let j = 0; j < 8; j++) {
      c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function buildZipBlob(files: Array<{ name: string; content: string | Uint8Array }>): Blob {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const dataBytes =
      typeof file.content === 'string' ? encoder.encode(file.content) : file.content;
    const crc = crc32(dataBytes);
    const size = dataBytes.length;

    // Local file header (30 bytes + filename)
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true); // signature
    lv.setUint16(4, 20, true); // version needed
    lv.setUint16(6, 0, true); // flags
    lv.setUint16(8, 0, true); // compression: 0 (store)
    lv.setUint16(10, 0, true); // mod time
    lv.setUint16(12, 0, true); // mod date
    lv.setUint32(14, crc, true); // crc32
    lv.setUint32(18, size, true); // compressed size
    lv.setUint32(22, size, true); // uncompressed size
    lv.setUint16(26, nameBytes.length, true); // filename length
    lv.setUint16(28, 0, true); // extra length
    localHeader.set(nameBytes, 30);

    localParts.push(localHeader, dataBytes);

    // Central directory header (46 bytes + filename)
    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true); // signature
    cv.setUint16(4, 20, true); // version made by
    cv.setUint16(6, 20, true); // version needed
    cv.setUint16(8, 0, true); // flags
    cv.setUint16(10, 0, true); // compression: 0
    cv.setUint16(12, 0, true); // mod time
    cv.setUint16(14, 0, true); // mod date
    cv.setUint32(16, crc, true); // crc32
    cv.setUint32(20, size, true); // compressed size
    cv.setUint32(24, size, true); // uncompressed size
    cv.setUint16(28, nameBytes.length, true); // filename length
    cv.setUint16(30, 0, true); // extra length
    cv.setUint16(32, 0, true); // comment length
    cv.setUint16(34, 0, true); // disk number
    cv.setUint16(36, 0, true); // internal attrs
    cv.setUint32(38, 0, true); // external attrs
    cv.setUint32(42, offset, true); // relative offset
    centralHeader.set(nameBytes, 46);

    centralParts.push(centralHeader);
    offset += localHeader.length + size;
  }

  const centralSize = centralParts.reduce((acc, arr) => acc + arr.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true); // EOCD signature
  ev.setUint16(4, 0, true); // disk number
  ev.setUint16(6, 0, true); // start disk
  ev.setUint16(8, files.length, true); // entries on disk
  ev.setUint16(10, files.length, true); // total entries
  ev.setUint32(12, centralSize, true); // central directory size
  ev.setUint32(16, offset, true); // central directory offset
  ev.setUint16(20, 0, true); // comment length

  return new Blob([...localParts, ...centralParts, eocd] as unknown as BlobPart[], {
    type: 'application/zip',
  });
}

export function downloadChromeExtensionZip(): void {
  const appOrigin =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : REMOTE_BACKEND_ORIGIN;

  const manifestJson = JSON.stringify(
    {
      manifest_version: 3,
      name: 'ScamLens AI — Scam & Phishing Detector',
      short_name: 'ScamLens AI',
      version: '1.3.0',
      description:
        'Check if a message, email, or link might be a scam before you act with Gemma AI risk reports, verbatim evidence, and inert link inspection.',
      icons: {
        '16': 'icon16.png',
        '48': 'icon48.png',
        '128': 'icon128.png',
      },
      action: {
        default_popup: 'popup.html',
        default_title: 'ScamLens AI — Scan Message or Page',
        default_icon: {
          '16': 'icon16.png',
          '48': 'icon48.png',
          '128': 'icon128.png',
        },
      },
      side_panel: {
        default_path: 'popup.html',
      },
      background: {
        service_worker: 'background.js',
      },
      permissions: ['activeTab', 'contextMenus', 'storage', 'scripting', 'sidePanel'],
      host_permissions: ['<all_urls>'],
      content_scripts: [
        {
          matches: ['<all_urls>'],
          js: ['content.js'],
          run_at: 'document_idle',
        },
      ],
    },
    null,
    2
  );

  const popupHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ScamLens AI Extension</title>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 420px;
      height: 600px;
      overflow: hidden;
      background: #020617;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    }
    iframe {
      width: 100%;
      height: 100%;
      border: 0;
    }
  </style>
</head>
<body>
  <iframe id="scamlens-frame" src="${appOrigin}/?mode=popup" allow="microphone; clipboard-read; clipboard-write"></iframe>
  <script src="popup.js"></script>
</body>
</html>`;

  const popupJs = `/* global chrome */
(function () {
  const frame = document.getElementById('scamlens-frame');
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['pendingScanText'], function (res) {
      if (res && res.pendingScanText && frame) {
        const baseUrl = '${appOrigin}/?mode=popup&scan=' + encodeURIComponent(res.pendingScanText);
        frame.src = baseUrl;
        chrome.storage.local.remove(['pendingScanText']);
      }
    });
  }
})();
`;

  const backgroundJs = `/* global chrome */
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'scamlens-scan-selection',
      title: 'Scan selected text with ScamLens AI',
      contexts: ['selection']
    });
    chrome.contextMenus.create({
      id: 'scamlens-scan-link',
      title: 'Inspect suspicious link with ScamLens AI',
      contexts: ['link']
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const textToScan = info.selectionText || info.linkUrl || '';
  if (!textToScan) return;
  chrome.storage.local.set({ pendingScanText: textToScan }, () => {
    if (chrome.sidePanel && chrome.sidePanel.open && tab && tab.windowId) {
      chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => {});
    }
  });
});
`;

  const contentJs = `/* global chrome */
(function () {
  if (window.__scamlensExtLoaded) return;
  window.__scamlensExtLoaded = true;
})();
`;

  const readmeTxt = `ScamLens AI — Chrome / Edge / Brave Browser Extension (Manifest V3)
====================================================================

How to Install in 30 Seconds:
1. Unzip this file (scamlens-ai-chrome-extension.zip) into a folder on your computer.
2. Open Chrome (or Edge / Brave) and go to: chrome://extensions
3. Turn ON "Developer mode" in the top-right corner, click "Load unpacked", and select the unzipped folder.

Features Included:
- Toolbar Popup & Side Panel with full ScamLens AI Analyzer, AI Chat, Voice Advisor, 50+ Languages, and Gemma 3 Models.
- Right-Click Context Menu: Highlight any suspicious email or message text on any webpage -> Right-click -> "Scan selected text with ScamLens AI".
`;

  const blob = buildZipBlob([
    { name: 'manifest.json', content: manifestJson },
    { name: 'icon16.png', content: generateIconPngBytes(16) },
    { name: 'icon48.png', content: generateIconPngBytes(48) },
    { name: 'icon128.png', content: generateIconPngBytes(128) },
    { name: 'popup.html', content: popupHtml },
    { name: 'popup.js', content: popupJs },
    { name: 'background.js', content: backgroundJs },
    { name: 'content.js', content: contentJs },
    { name: 'README.txt', content: readmeTxt },
  ]);

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'scamlens-ai-chrome-extension.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
