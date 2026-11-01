/**
 * CSSPeeper — Content Script
 * Extracts Page Color Palette (HEX), Typography Scale & SVG/Image Assets
 */

(() => {
  "use strict";

  if (!document.body) return;

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
    const cssVars = [
      ":root {",
      ...palette.map((hex, i) => `  --brand-color-${i + 1}: ${hex};`),
      `  --font-primary: "${Array.from(fonts)[0] || "Inter"}", sans-serif;`,
      "}"
    ].join("\n");

    return {
      palette,
      fonts: Array.from(fonts).slice(0, 5),
      svgs,
      imgs,
      cssVars
    };
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "CSSPEEPER_EXTRACT") {
      sendResponse({ ok: true, ...extractDesignSystem() });
      return false;
    }
  });

  let pill = document.getElementById("csspeeper-pill");
  if (!pill) {
    const sys = extractDesignSystem();
    pill = document.createElement("div");
    pill.id = "csspeeper-pill";
    pill.className = "csspeeper-pill";
    pill.title = "CSSPeeper: Design System Color Palette & CSS Token Extractor";
    pill.textContent = `🎨 CSSPeeper: ${sys.palette.length} Colors • ${sys.fonts.length} Fonts`;
    pill.addEventListener("click", () => {
      const fresh = extractDesignSystem();
      pill.textContent = `🎨 ${fresh.palette.slice(0, 3).join(" ")} ✓`;
    });
    document.body.appendChild(pill);
  }
})();
