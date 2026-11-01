(() => {
  let styleEl = null;
  let dyslexiaEl = null;
  let currentCfg = {
    enabled: false,
    contrast: 100,
    brightness: 100,
    sepia: 10,
    grayscale: 0,
    dyslexia: false
  };

  function getHostKey() {
    return (location.hostname || 'local').replace(/^www\./, '') || 'local';
  }

  function applyConfig(cfg) {
    if (!cfg) return;
    currentCfg = { ...currentCfg, ...cfg };

    // 1. OLED Dark Mode & Color Filters
    const hasFilters = currentCfg.enabled ||
      Number(currentCfg.contrast) !== 100 ||
      Number(currentCfg.brightness) !== 100 ||
      Number(currentCfg.sepia) > 0 ||
      Number(currentCfg.grayscale) > 0;

    if (!currentCfg.enabled && !hasFilters) {
      if (styleEl) styleEl.remove();
      styleEl = null;
    } else {
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'darkzen-oled-style';
        (document.head || document.documentElement).appendChild(styleEl);
      }
      const contrast = Number(currentCfg.contrast) || 100;
      const brightness = Number(currentCfg.brightness) || 100;
      const sepia = Number(currentCfg.sepia) || 0;
      const grayscale = Number(currentCfg.grayscale) || 0;

      if (currentCfg.enabled) {
        styleEl.textContent = `
          html {
            filter: invert(0.93) hue-rotate(180deg) contrast(${contrast}%) brightness(${brightness}%) sepia(${sepia}%) grayscale(${grayscale}%) !important;
            background-color: #08080c !important;
          }
          img, video, iframe, canvas, svg, picture, [style*="background-image"] {
            filter: invert(1) hue-rotate(180deg) !important;
          }
        `;
      } else {
        styleEl.textContent = `
          html {
            filter: contrast(${contrast}%) brightness(${brightness}%) sepia(${sepia}%) grayscale(${grayscale}%) !important;
          }
        `;
      }
    }

    // 2. Dyslexia-Friendly Typography Override (Helperbird style)
    if (!currentCfg.dyslexia) {
      if (dyslexiaEl) dyslexiaEl.remove();
      dyslexiaEl = null;
    } else {
      if (!dyslexiaEl) {
        dyslexiaEl = document.createElement('style');
        dyslexiaEl.id = 'darkzen-dyslexia-style';
        (document.head || document.documentElement).appendChild(dyslexiaEl);
      }
      dyslexiaEl.textContent = `
        body, p, li, article, section, span, a, h1, h2, h3, h4, h5, h6 {
          font-family: "OpenDyslexic", "Comic Sans MS", "Trebuchet MS", Verdana, sans-serif !important;
          letter-spacing: 0.06em !important;
          word-spacing: 0.16em !important;
          line-height: 1.75 !important;
        }
      `;
    }
  }

  function saveSiteConfig(cfg) {
    const host = getHostKey();
    try {
      chrome.storage.local.get({ darkzenSites: {} }, (data) => {
        const sites = data.darkzenSites || {};
        sites[host] = cfg;
        chrome.storage.local.set({ darkzenSites: sites });
      });
    } catch (_) {}
  }

  function loadAndAutoApply() {
    const host = getHostKey();
    try {
      chrome.storage.local.get({ darkzenSites: {} }, (data) => {
        const sites = data.darkzenSites || {};
        if (sites[host]) {
          applyConfig(sites[host]);
        }
      });
    } catch (_) {}
  }

  function toggleZenReader() {
    const existing = document.getElementById('darkzen-reader-modal');
    if (existing) {
      existing.remove();
      return { readerOpen: false };
    }
    const article = document.querySelector('article, main, [role="main"], .post-content, .article-body') || document.body;
    const nodes = Array.from(article.querySelectorAll('h1, h2, h3, p, li, blockquote'));
    const paras = nodes
      .filter(el => (el.innerText || '').trim().length > 15)
      .map(el => {
        const tag = el.tagName.toLowerCase();
        const text = (el.innerText || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `<${tag}>${text}</${tag}>`;
      })
      .join('');

    const wordCount = (article.innerText || '').trim().split(/\s+/).filter(Boolean).length;
    const readMins = Math.max(1, Math.round(wordCount / 200));

    const modal = document.createElement('div');
    modal.id = 'darkzen-reader-modal';
    modal.innerHTML = `
      <div class="dz-container" id="dz-reader-content">
        <div class="dz-toolbar">
          <div>
            <strong style="color:#c084fc;">🌙 DarkZen Distraction-Free Reader</strong>
            <span style="color:#94a3b8;margin-left:10px;">⏱️ ${readMins} min read (${wordCount} words)</span>
          </div>
          <div>
            <button id="dzFontDec" title="Decrease Font Size">A-</button>
            <button id="dzFontInc" title="Increase Font Size">A+</button>
            <button id="dzDyslexiaBtn" title="Toggle Dyslexia Font">Aa Dyslexia</button>
            <button id="dzClose" style="background:#9333ea;border-color:#a855f7;">Exit Reader (Esc)</button>
          </div>
        </div>
        <h1 style="color:#f8fafc;line-height:1.3;margin-bottom:18px;">${(document.title || 'Article Reader').replace(/</g, '&lt;')}</h1>
        <div id="dz-reader-body">${paras || `<p>${(document.body.innerText || 'No article text found.').slice(0, 3000)}</p>`}</div>
      </div>
    `;
    document.body.appendChild(modal);

    let fontSize = 19;
    const bodyEl = modal.querySelector('#dz-reader-body');
    modal.querySelector('#dzFontDec').onclick = () => {
      fontSize = Math.max(14, fontSize - 2);
      modal.style.fontSize = fontSize + 'px';
    };
    modal.querySelector('#dzFontInc').onclick = () => {
      fontSize = Math.min(28, fontSize + 2);
      modal.style.fontSize = fontSize + 'px';
    };
    modal.querySelector('#dzDyslexiaBtn').onclick = () => {
      const isDys = bodyEl.style.fontFamily.includes('Comic') || bodyEl.style.fontFamily.includes('OpenDyslexic');
      bodyEl.style.fontFamily = isDys ? 'Georgia, serif' : '"OpenDyslexic", "Comic Sans MS", Verdana, sans-serif';
      bodyEl.style.letterSpacing = isDys ? 'normal' : '0.06em';
    };
    modal.querySelector('#dzClose').onclick = () => modal.remove();

    const escHandler = (e) => {
      if (e.key === 'Escape' && document.getElementById('darkzen-reader-modal')) {
        modal.remove();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);

    return { readerOpen: true, wordCount, readMins };
  }

  // Auto-apply saved per-site OLED settings on load
  loadAndAutoApply();

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'DARKZEN_GET_STATE') {
      sendResponse({ host: getHostKey(), config: currentCfg });
    } else if (msg.type === 'DARKZEN_APPLY') {
      applyConfig(msg.config);
      saveSiteConfig(currentCfg);
      sendResponse({ ok: true, host: getHostKey(), config: currentCfg });
    } else if (msg.type === 'DARKZEN_READER') {
      const status = toggleZenReader();
      sendResponse({ ok: true, ...status });
    }
  });
})();
