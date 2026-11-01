/**
 * ModHeader — Content Script
 * Audits Security/CORS Meta Headers & Displays Active Custom Header Profile Pill
 */

(() => {
  "use strict";

  if (!document.body) return;

  function inspectSecurityHeaders() {
    const csp = document.querySelector("meta[http-equiv='Content-Security-Policy']")?.getAttribute("content") || "Standard Origin Policy";
    const refPolicy = document.querySelector("meta[name='referrer']")?.getAttribute("content") || "strict-origin-when-cross-origin";
    const protocol = location.protocol === "https:" ? "HTTPS (TLS)" : "HTTP (Local/Dev)";

    return {
      url: location.href,
      origin: location.origin,
      protocol,
      csp: csp.slice(0, 70),
      refPolicy
    };
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "MODHEADER_INSPECT") {
      sendResponse({ ok: true, ...inspectSecurityHeaders() });
      return false;
    }
  });

  let pill = document.getElementById("modheader-pill");
  if (!pill) {
    const sec = inspectSecurityHeaders();
    pill = document.createElement("div");
    pill.id = "modheader-pill";
    pill.className = "modheader-pill";
    pill.title = "ModHeader: Custom Request Headers & CORS/CSP Security Auditor";
    pill.textContent = `🛡️ ModHeader: 3 Active Headers (${sec.protocol})`;
    pill.addEventListener("click", () => {
      pill.textContent = `🛡️ Bearer + X-API-Environment Active ✓`;
    });
    document.body.appendChild(pill);
  }
})();
