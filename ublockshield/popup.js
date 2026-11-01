document.addEventListener("DOMContentLoaded", () => {
  const statsEl = document.getElementById("ub-stats");
  const rulesEl = document.getElementById("ub-rules-list");

  function loadRules() {
    chrome.storage.local.get(["ublockshield_rules"], (res) => {
      const rules = res.ublockshield_rules || [];
      rulesEl.textContent = "Active Cosmetic Filter Rules:\n" + rules.map((r) => `  • ${r}`).join("\n");
    });
  }

  function refreshStats() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "UBLOCKSHIELD_STATUS" }, (res) => {
          if (!chrome.runtime.lastError && res && res.stats) {
            const s = res.stats;
            statsEl.textContent = `Blocked Total: ${s.totalBlocked} | Ads: ${s.adsHidden} | Cookie Walls: ${s.cookiesHidden} | 3P Trackers: ${s.thirdPartyTrackers}`;
          } else {
            statsEl.textContent = "Shield Active — 0 ads on blank tab.";
          }
        });
      }
    });
  }

  loadRules();
  refreshStats();

  document.getElementById("ub-add-rule").addEventListener("click", () => {
    const selector = document.getElementById("ub-rule").value.trim();
    if (!selector) return;
    chrome.runtime.sendMessage({ type: "UBLOCKSHIELD_ADD_RULE", selector }, () => {
      loadRules();
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: "UBLOCKSHIELD_APPLY_CUSTOM", selector });
        }
      });
    });
  });

  document.getElementById("ub-zap").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "UBLOCKSHIELD_ZAP_TOGGLE" }, (res) => {
          if (!chrome.runtime.lastError && res) {
            statsEl.textContent = `Element Zapper Mode: ${res.zapMode ? "ACTIVE (Click any page element)" : "OFF"}`;
          }
        });
      }
    });
  });
});
