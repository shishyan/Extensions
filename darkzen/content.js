(() => {
  let styleEl = null;
  function applyDark(cfg) {
    if (!cfg || !cfg.enabled) {
      if (styleEl) styleEl.remove();
      styleEl = null;
      return;
    }
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'darkzen-oled-style';
      document.documentElement.appendChild(styleEl);
    }
    const contrast = cfg.contrast || 100;
    const sepia = cfg.sepia || 0;
    styleEl.textContent = `
      html {
        filter: invert(0.92) hue-rotate(180deg) contrast(${contrast}%) sepia(${sepia}%) !important;
        background: #0a0a0a !important;
      }
      img, video, iframe, canvas, svg, [style*="background-image"] {
        filter: invert(1) hue-rotate(180deg) !important;
      }
    `;
  }

  function toggleZenReader() {
    const existing = document.getElementById('darkzen-reader-modal');
    if (existing) {
      existing.remove();
      return;
    }
    const article = document.querySelector('article, main, [role="main"]') || document.body;
    const paras = Array.from(article.querySelectorAll('h1, h2, h3, p, li'))
      .map(el => `<${el.tagName.toLowerCase()}>${el.innerText}</${el.tagName.toLowerCase()}>`)
      .join('');
    const modal = document.createElement('div');
    modal.id = 'darkzen-reader-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#090d16;color:#e2e8f0;overflow-y:auto;padding:48px 20px;font-family:Georgia,serif;line-height:1.75;font-size:19px;';
    modal.innerHTML = `
      <div style="max-width:700px;margin:0 auto;">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #334155;padding-bottom:12px;margin-bottom:24px;font-family:system-ui,sans-serif;">
          <strong style="color:#a78bfa;font-size:14px;">🌙 DarkZen Distraction-Free Reader</strong>
          <button id="dzClose" style="background:#334155;color:#fff;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;">Exit Reader (Esc)</button>
        </div>
        <h1 style="color:#f8fafc;line-height:1.3;">${document.title}</h1>
        ${paras}
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('dzClose').onclick = () => modal.remove();
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'DARKZEN_APPLY') {
      applyDark(msg.config);
      sendResponse({ ok: true });
    } else if (msg.type === 'DARKZEN_READER') {
      toggleZenReader();
      sendResponse({ ok: true });
    }
  });
})();
