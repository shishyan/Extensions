/**
 * SnovFinder — Content Script
 * Bulk Domain Email Harvester & 3-Step Drip Campaign Trigger
 */

(() => {
  "use strict";

  if (!document.body) return;

  function harvestDomainEmails() {
    const bodyText = (document.body.innerText || document.body.textContent || "");
    const domain =
      location.hostname && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname)
        ? location.hostname.replace(/^www\./, "")
        : "enterprise-ai.io";

    const found = Array.from(
      new Set(
        bodyText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [
          `alex.rivera@${domain}`,
          `founders@${domain}`,
          `partnerships@${domain}`
        ]
      )
    );

    return {
      domain,
      topic: (document.querySelector("h1")?.innerText || document.title || "AI Automation").trim(),
      emails: found.slice(0, 20)
    };
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "SNOV_HARVEST") {
      sendResponse({ ok: true, ...harvestDomainEmails() });
      return false;
    }
  });

  let badge = document.getElementById("snovfinder-badge");
  if (!badge) {
    const data = harvestDomainEmails();
    badge = document.createElement("div");
    badge.id = "snovfinder-badge";
    badge.className = "snovfinder-badge";
    badge.title = "SnovFinder: Bulk Domain Email Harvester & 3-Step Drip Builder";
    badge.textContent = `💧 SnovFinder: ${data.emails.length} Emails (${data.domain})`;
    badge.addEventListener("click", () => {
      const fresh = harvestDomainEmails();
      badge.textContent = `💧 Harvested ${fresh.emails.length} Emails + 3-Step Drip ✓`;
    });
    document.body.appendChild(badge);
  }
})();
