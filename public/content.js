/* global chrome */

// ScamLens AI — Content Script for Active Tab Selection & Floating Quick-Scan Button
(function () {
  if (window.__scamlensContentScriptLoaded) return;
  window.__scamlensContentScriptLoaded = true;

  let floatingBtn = null;

  function removeFloatingBtn() {
    if (floatingBtn && floatingBtn.parentNode) {
      floatingBtn.parentNode.removeChild(floatingBtn);
    }
    floatingBtn = null;
  }

  document.addEventListener('mouseup', (e) => {
    setTimeout(() => {
      const selected = window.getSelection()?.toString().trim() || '';
      if (selected.length < 18 || selected.length > 4800) {
        removeFloatingBtn();
        return;
      }

      if (!floatingBtn) {
        floatingBtn = document.createElement('button');
        floatingBtn.type = 'button';
        floatingBtn.textContent = '🛡️ Scan with ScamLens AI';
        floatingBtn.style.cssText = [
          'position: fixed',
          'z-index: 2147483647',
          'padding: 6px 12px',
          'border-radius: 9999px',
          'border: 1px solid rgba(255,255,255,0.25)',
          'background: linear-gradient(135deg, #4f46e5, #9333ea, #db2777)',
          'color: #ffffff',
          'font-family: -apple-system, BlinkMacSystemFont, sans-serif',
          'font-size: 12px',
          'font-weight: 700',
          'box-shadow: 0 10px 25px rgba(79, 70, 229, 0.35)',
          'cursor: pointer',
          'transition: transform 0.15s ease',
        ].join(';');

        floatingBtn.addEventListener('mousedown', (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          const currentSelection = window.getSelection()?.toString().trim() || selected;
          if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({
              type: 'SCAMLENS_QUICK_SCAN',
              text: currentSelection,
              url: window.location.href,
            });
          }
          removeFloatingBtn();
        });

        document.body.appendChild(floatingBtn);
      }

      const left = Math.min(window.innerWidth - 200, Math.max(12, e.clientX - 60));
      const top = Math.min(window.innerHeight - 50, Math.max(12, e.clientY + 14));
      floatingBtn.style.left = `${left}px`;
      floatingBtn.style.top = `${top}px`;
    }, 20);
  });

  document.addEventListener('scroll', removeFloatingBtn, { passive: true });

  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (msg?.type === 'SCAMLENS_GET_PAGE_SELECTION') {
        const selection = window.getSelection()?.toString().trim() || '';
        const bodySnippet = (document.body?.innerText || '').trim().slice(0, 2500);
        sendResponse({
          selectedText: selection,
          pageText: bodySnippet,
          url: window.location.href,
          title: document.title || '',
        });
        return true;
      }
      return false;
    });
  }
})();
