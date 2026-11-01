(function () {
  if (window.__colorZillaLoaded) return;
  window.__colorZillaLoaded = true;

  function parseRgb(str) {
    const m = String(str || "").match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (!m) return [15, 23, 42];
    return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)];
  }

  function rgbToHex(rgb) {
    return (
      "#" +
      rgb
        .map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase()
    );
  }

  function rgbToHsl(rgb) {
    const r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  }

  function relativeLuminance(rgb) {
    const srgb = rgb.map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  }

  function computeContrast(fgRgb, bgRgb) {
    const l1 = relativeLuminance(fgRgb);
    const l2 = relativeLuminance(bgRgb);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    return Number(ratio.toFixed(2));
  }

  function auditPageColors() {
    const el = document.querySelector("h1") || document.body;
    const cs = window.getComputedStyle(el);
    const fg = parseRgb(cs.color || "rgb(248, 250, 252)");
    const bg = parseRgb(cs.backgroundColor && cs.backgroundColor !== "rgba(0, 0, 0, 0)" ? cs.backgroundColor : "rgb(15, 23, 42)");
    const ratio = computeContrast(fg, bg);
    const wcag = ratio >= 7.0 ? "AAA Pass" : ratio >= 4.5 ? "AA Pass" : "Low Contrast";
    const fgHex = rgbToHex(fg);
    const bgHex = rgbToHex(bg);

    return {
      fgHex,
      fgRgb: `rgb(${fg.join(", ")})`,
      fgHsl: rgbToHsl(fg),
      bgHex,
      bgRgb: `rgb(${bg.join(", ")})`,
      bgHsl: rgbToHsl(bg),
      contrastRatio: ratio,
      wcagGrade: wcag,
      gradientCss: `linear-gradient(135deg, ${fgHex} 0%, #EC4899 100%)`,
      rootCss: `:root {\n  --color-fg: ${fgHex};\n  --color-bg: ${bgHex};\n}`
    };
  }

  function injectPill() {
    if (document.getElementById("colorzilla-pill")) return;
    const c = auditPageColors();
    const pill = document.createElement("div");
    pill.id = "colorzilla-pill";
    pill.innerHTML = `
      <span style="width:12px;height:12px;border-radius:50%;background:${c.fgHex};border:1px solid #fff;display:inline-block;"></span>
      <span>🎨 ColorZilla: ${c.fgHex} (${c.fgHsl}) on ${c.bgHex} • Contrast <strong>${c.contrastRatio}:1 (${c.wcagGrade})</strong></span>
    `;
    document.body.appendChild(pill);
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "COLORZILLA_AUDIT") {
      sendResponse(auditPageColors());
      return true;
    }
  });

  injectPill();
})();
