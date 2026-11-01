(() => {
  "use strict";
  if (!document.body || window.__cssPeeperLoaded) return;
  window.__cssPeeperLoaded = true;

  let hoverInspectorOn = false;
  let hoverTooltip = null;

  function rgbToHex(rgb) {
    const m = (rgb || "").match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return null;
    const r = Number(m[1]);
    const g = Number(m[2]);
    const b = Number(m[3]);
    return (
      "#" +
      [r, g, b]
        .map((v) => v.toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase()
    );
  }

  function hexToHsl(hex) {
    const clean = (hex || "#38BDF8").replace("#", "");
    const r = parseInt(clean.slice(0, 2), 16) / 255;
    const g = parseInt(clean.slice(2, 4), 16) / 255;
    const b = parseInt(clean.slice(4, 6), 16) / 255;
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

  function extractDesignSystem() {
    const colors = new Set(["#0F172A", "#38BDF8", "#10B981", "#F43F5E", "#A855F7"]);
    const fonts = new Set();

    Array.from(document.querySelectorAll("body, h1, h2, h3, p, a, button, div")).slice(0, 60).forEach((el) => {
      const st = window.getComputedStyle(el);
      const c1 = rgbToHex(st.color);
      const c2 = rgbToHex(st.backgroundColor);
      if (c1) colors.add(c1);
      if (c2 && c2 !== "#000000") colors.add(c2);
      if (st.fontFamily) {
        fonts.add(st.fontFamily.split(",")[0].replace(/['"]/g, "").trim());
      }
    });

    const svgs = document.querySelectorAll("svg").length;
    const imgs = document.querySelectorAll("img").length;

    const palette = Array.from(colors).slice(0, 10);
    const paletteDetails = palette.map((hex) => ({
      hex,
      hsl: hexToHsl(hex)
    }));

    const cssVars = [
      ":root {",
      ...palette.map((hex, i) => `  --brand-color-${i + 1}: ${hex}; /* ${hexToHsl(hex)} */`),
      `  --font-primary: "${Array.from(fonts)[0] || "Inter"}", sans-serif;`,
      "}"
    ].join("\n");

    return {
      palette,
      paletteDetails,
      fonts: Array.from(fonts).slice(0, 5),
      svgs,
      imgs,
      cssVars
    };
  }

  function toggleHoverInspector() {
    hoverInspectorOn = !hoverInspectorOn;
    if (!hoverTooltip) {
      hoverTooltip = document.createElement("div");
      hoverTooltip.id = "csspeeper-hover-tip";
      hoverTooltip.style.cssText = "position:fixed;top:12px;left:12px;z-index:2147483647;background:#0f172a;color:#f8fafc;border:1px solid #a855f7;border-radius:8px;padding:7px 10px;font-size:11px;font-family:monospace;pointer-events:none;display:none;box-shadow:0 8px 24px rgba(0,0,0,0.45);";
      document.body.appendChild(hoverTooltip);

      document.addEventListener("mouseover", (e) => {
        if (!hoverInspectorOn || !e.target || e.target === hoverTooltip) return;
        const cs = window.getComputedStyle(e.target);
        const fg = rgbToHex(cs.color) || "#F8FAFC";
        const bg = rgbToHex(cs.backgroundColor) || "#0F172A";
        const font = (cs.fontFamily || "Inter").split(",")[0].replace(/['"]/g, "");
        hoverTooltip.style.display = "block";
        hoverTooltip.textContent = `<${e.target.tagName.toLowerCase()}> ${font} ${cs.fontSize}/${cs.lineHeight} (${cs.fontWeight}) • FG: ${fg} (${hexToHsl(fg)}) • BG: ${bg}`;
      });
    }
    hoverTooltip.style.display = hoverInspectorOn ? "block" : "none";
    return hoverInspectorOn;
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "CSSPEEPER_EXTRACT") {
      sendResponse({ ok: true, ...extractDesignSystem() });
      return false;
    }
    if (msg && msg.type === "CSSPEEPER_TOGGLE_HOVER") {
      sendResponse({ ok: true, active: toggleHoverInspector() });
      return false;
    }
  });

  let pill = document.getElementById("csspeeper-pill");
  if (!pill) {
    const sys = extractDesignSystem();
    pill = document.createElement("div");
    pill.id = "csspeeper-pill";
    pill.className = "csspeeper-pill";
    pill.title = "CSSPeeper: Click to toggle Live Hover CSS Inspector";
    pill.textContent = `🎨 CSSPeeper: ${sys.palette.length} Colors • ${sys.fonts.length} Fonts (Inspect)`;
    pill.addEventListener("click", () => {
      const on = toggleHoverInspector();
      const fresh = extractDesignSystem();
      pill.textContent = on
        ? `🔍 Hover Inspector ON • ${fresh.palette.slice(0, 2).join(" ")}`
        : `🎨 ${fresh.palette.slice(0, 3).join(" ")} ✓`;
    });
    document.body.appendChild(pill);
  }
})();
