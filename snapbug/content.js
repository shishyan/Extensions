(() => {
  const logs = [];
  const origError = console.error;
  console.error = function(...args) {
    try {
      logs.push(args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
    } catch (_) {}
    origError.apply(console, args);
  };

  window.addEventListener('error', (e) => {
    if (e && e.message) logs.push(`Uncaught: ${e.message}`);
  });

  let inspectorOn = false;
  let tooltip = null;
  let highlightBox = null;

  function rgbToHex(rgb) {
    if (!rgb) return null;
    if (rgb.startsWith('#')) return rgb.toUpperCase();
    const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!m) return null;
    if (m[4] !== undefined && parseFloat(m[4]) === 0) return null;
    const r = parseInt(m[1], 10);
    const g = parseInt(m[2], 10);
    const b = parseInt(m[3], 10);
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  function extractColorsAndAssets() {
    const colorCounts = new Map();
    const fontSet = new Set();
    const elements = Array.from(document.querySelectorAll('*')).slice(0, 250);

    elements.forEach(el => {
      const cs = window.getComputedStyle(el);
      [cs.color, cs.backgroundColor, cs.borderColor].forEach(c => {
        const hex = rgbToHex(c);
        if (hex && hex !== '#00000000') {
          colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1);
        }
      });
      if (cs.fontFamily) {
        const primaryFont = cs.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
        if (primaryFont) fontSet.add(primaryFont);
      }
    });

    const palette = Array.from(colorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(e => e[0]);

    const assets = [];
    document.querySelectorAll('img[src]').forEach(img => {
      if (img.src && !assets.some(a => a.url === img.src)) {
        assets.push({
          type: 'IMG',
          url: img.src,
          dim: `${img.naturalWidth || img.width || 0}×${img.naturalHeight || img.height || 0}`
        });
      }
    });
    document.querySelectorAll('svg').forEach((svg, idx) => {
      const r = svg.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && assets.length < 15) {
        assets.push({
          type: 'SVG',
          url: `inline-svg-${idx + 1}`,
          dim: `${Math.round(r.width)}×${Math.round(r.height)}`
        });
      }
    });

    return {
      palette: palette.length ? palette : ['#0F172A', '#F43F5E', '#38BDF8', '#F8FAFC'],
      fonts: Array.from(fontSet).slice(0, 5),
      assets: assets.slice(0, 10)
    };
  }

  function onHover(e) {
    if (!inspectorOn) return;
    const el = e.target;
    if (!el || el.id === 'snapbug-hover-tooltip' || el.id === 'snapbug-hover-box') return;

    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'snapbug-hover-tooltip';
      document.body.appendChild(tooltip);
    }
    if (!highlightBox) {
      highlightBox = document.createElement('div');
      highlightBox.id = 'snapbug-hover-box';
      document.body.appendChild(highlightBox);
    }

    const cs = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();

    highlightBox.style.top = `${rect.top}px`;
    highlightBox.style.left = `${rect.left}px`;
    highlightBox.style.width = `${rect.width}px`;
    highlightBox.style.height = `${rect.height}px`;

    const colorHex = rgbToHex(cs.color) || cs.color;
    const bgHex = rgbToHex(cs.backgroundColor) || cs.backgroundColor;
    const cls = el.className && typeof el.className === 'string'
      ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
      : '';

    tooltip.innerHTML = `
      <div><strong style="color:#fb7185;">&lt;${el.tagName.toLowerCase()}${cls}&gt;</strong> <span style="color:#38bdf8;">${Math.round(rect.width)}×${Math.round(rect.height)}px</span></div>
      <div><strong>Font:</strong> ${cs.fontFamily.split(',')[0].replace(/['"]/g, '')} • ${cs.fontSize} (lh: ${cs.lineHeight})</div>
      <div><strong>Color:</strong> ${colorHex} • <strong>BG:</strong> ${bgHex}</div>
      <div><strong>Box:</strong> pad ${cs.padding} • mrg ${cs.margin}</div>
    `;
  }

  function onClickInspect(e) {
    if (!inspectorOn) return;
    const el = e.target;
    if (!el) return;
    const cs = window.getComputedStyle(el);
    const snippet = `font-family: ${cs.fontFamily}; font-size: ${cs.fontSize}; color: ${cs.color}; background: ${cs.backgroundColor}; padding: ${cs.padding};`;
    navigator.clipboard.writeText(snippet).catch(() => {});
  }

  document.addEventListener('mouseover', onHover, true);
  document.addEventListener('click', onClickInspect, true);

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'SNAPBUG_META') {
      const extracted = extractColorsAndAssets();
      sendResponse({
        url: location.href,
        title: document.title,
        viewport: `${window.innerWidth}×${window.innerHeight}`,
        dpr: window.devicePixelRatio || 1,
        ua: navigator.userAgent,
        errors: logs.slice(-8),
        inspectorOn,
        ...extracted
      });
    } else if (msg.type === 'SNAPBUG_INSPECT') {
      inspectorOn = !inspectorOn;
      if (!inspectorOn) {
        if (tooltip) { tooltip.remove(); tooltip = null; }
        if (highlightBox) { highlightBox.remove(); highlightBox = null; }
      }
      sendResponse({ inspectorOn });
    }
  });
})();
