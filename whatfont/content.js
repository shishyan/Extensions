/**
 * WhatFont — Content Script
 * Hover Typography Inspector & Live Google Font Pairing Swapper
 */

(() => {
  "use strict";

  if (!document.body) return;

  function inspectTypography() {
    const h1 = document.querySelector("h1, h2") || document.body;
    const p = document.querySelector("p, li") || document.body;
    const stH = window.getComputedStyle(h1);
    const stP = window.getComputedStyle(p);

    return {
      headingFont: (stH.fontFamily || "Inter").split(",")[0].replace(/['"]/g, "").trim(),
      headingSize: stH.fontSize || "32px",
      headingWeight: stH.fontWeight || "700",
      bodyFont: (stP.fontFamily || "system-ui").split(",")[0].replace(/['"]/g, "").trim(),
      bodySize: stP.fontSize || "16px",
      bodyLineHeight: stP.lineHeight || "24px"
    };
  }

  function applyLiveFontPairing(fontFamily) {
    document.body.style.fontFamily = `"${fontFamily}", system-ui, sans-serif`;
    const badge = document.getElementById("whatfont-badge");
    if (badge) {
      badge.textContent = `🔤 WhatFont: "${fontFamily}" Applied ✓`;
    }
    return fontFamily;
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "WHATFONT_INSPECT") {
      sendResponse({ ok: true, ...inspectTypography() });
      return false;
    }
    if (msg && msg.type === "WHATFONT_APPLY") {
      const f = applyLiveFontPairing(msg.font || "Inter");
      sendResponse({ ok: true, applied: f });
      return false;
    }
  });

  let badge = document.getElementById("whatfont-badge");
  if (!badge) {
    const info = inspectTypography();
    badge = document.createElement("div");
    badge.id = "whatfont-badge";
    badge.className = "whatfont-badge";
    badge.title = "WhatFont: Typography Inspector & Live Font Pairing Tester";
    badge.textContent = `🔤 WhatFont: ${info.headingFont} (${info.headingSize} / ${info.headingWeight})`;
    badge.addEventListener("click", () => {
      const fresh = inspectTypography();
      badge.textContent = `🔤 H1: ${fresh.headingFont} ${fresh.headingSize} • Body: ${fresh.bodySize} ✓`;
    });
    document.body.appendChild(badge);
  }
})();
