document.addEventListener("DOMContentLoaded", () => {
  const statsEl = document.getElementById("ub-stats");
  const rulesEl = document.getElementById("ub-rules-list");
  let latestTrackerDomains = [];

  function loadRules() {
    chrome.storage.local.get(["ublockshield_rules"], (res) => {
      const rules = res.ublockshield_rules || [];
      const domTxt = latestTrackerDomains.length
        ? "\n\nDetected 3rd-Party Script/Iframe Domains:\n" + latestTrackerDomains.map((d) => `  • ${d}`).join("\n")
        : "";
      rulesEl.textContent = "Active Cosmetic Filter Rules (45+ Built-in + Custom):\n" + rules.map((r) => `  • ${r}`).join("\n") + domTxt;
    });
  }

  function refreshStats() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "UBLOCKSHIELD_STATUS" }, (res) => {
          if (!chrome.runtime.lastError && res && res.stats) {
            const s = res.stats;
            latestTrackerDomains = s.trackerDomains || [];
            statsEl.textContent = `Blocked: ${s.totalBlocked} | Ads: ${s.adsHidden} | Cookie Walls: ${s.cookiesHidden} | 3P Trackers: ${s.thirdPartyTrackers} ${s.whitelisted ? "(Whitelisted)" : ""}`;
            loadRules();
          } else {
            statsEl.textContent = "Shield Active — 45+ selectors armed.";
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
            statsEl.textContent = `Element Zapper Mode: ${res.zapMode ? "ACTIVE (Hover & click any page element)" : "OFF"}`;
          }
        });
      }
    });
  });

  document.getElementById("ub-whitelist").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "UBLOCKSHIELD_WHITELIST_TOGGLE" }, (res) => {
          if (!chrome.runtime.lastError && res) {
            document.getElementById("ub-whitelist").textContent = res.whitelisted ? "🛡️ Re-Enable Shield" : "🔓 Whitelist Site";
            refreshStats();
          }
        });
      }
    });
  });
});
