(() => {
  "use strict";
  if (!document.body || window.__whatFontLoaded) return;
  window.__whatFontLoaded = true;

  let hoverActive = false;
  let tip = null;

  function inspectTypography() {
    const h1 = document.querySelector("h1, h2") || document.body;
    const p = document.querySelector("p, li") || document.body;
    const stH = window.getComputedStyle(h1);
    const stP = window.getComputedStyle(p);

    return {
      headingFont: (stH.fontFamily || "Inter").split(",")[0].replace(/['"]/g, "").trim(),
      headingSize: stH.fontSize || "32px",
      headingWeight: stH.fontWeight || "700",
      headingLineHeight: stH.lineHeight || "40px",
      bodyFont: (stP.fontFamily || "system-ui").split(",")[0].replace(/['"]/g, "").trim(),
      bodySize: stP.fontSize || "16px",
      bodyWeight: stP.fontWeight || "400",
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

  function toggleHoverTypography() {
    hoverActive = !hoverActive;
    if (!tip) {
      tip = document.createElement("div");
      tip.id = "whatfont-hover-tip";
      tip.style.cssText = "position:fixed;top:12px;right:12px;z-index:2147483647;background:#0f172a;color:#fbbf24;border:1px solid #f59e0b;border-radius:8px;padding:7px 10px;font-size:11px;font-family:system-ui,sans-serif;pointer-events:none;display:none;";
      document.body.appendChild(tip);
      document.addEventListener("mouseover", (e) => {
        if (!hoverActive || !e.target) return;
        const cs = window.getComputedStyle(e.target);
        const f = (cs.fontFamily || "Inter").split(",")[0].replace(/['"]/g, "");
        tip.style.display = "block";
        tip.textContent = `🔤 ${f} • Size: ${cs.fontSize} • Weight: ${cs.fontWeight} • Line: ${cs.lineHeight} • Color: ${cs.color}`;
      });
    }
    tip.style.display = hoverActive ? "block" : "none";
    return hoverActive;
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
    if (msg && msg.type === "WHATFONT_TOGGLE_HOVER") {
      sendResponse({ ok: true, active: toggleHoverTypography() });
      return false;
    }
  });

  let badge = document.getElementById("whatfont-badge");
  if (!badge) {
    const info = inspectTypography();
    badge = document.createElement("div");
    badge.id = "whatfont-badge";
    badge.className = "whatfont-badge";
    badge.title = "WhatFont: Click to toggle Live Hover Typography Inspector";
    badge.textContent = `🔤 WhatFont: ${info.headingFont} (${info.headingSize} / ${info.headingWeight})`;
    badge.addEventListener("click", () => {
      const on = toggleHoverTypography();
      const fresh = inspectTypography();
      badge.textContent = on
        ? `🔍 Hover Font Inspector ON (${fresh.headingFont})`
        : `🔤 H1: ${fresh.headingFont} ${fresh.headingSize} • Body: ${fresh.bodySize} ✓`;
    });
    document.body.appendChild(badge);
  }
})();
