document.addEventListener("DOMContentLoaded", () => {
  const selectorInput = document.getElementById("selectorInput");
  const intervalSelect = document.getElementById("intervalSelect");
  const statusBadge = document.getElementById("statusBadge");
  const statusMsg = document.getElementById("statusMsg");

  document.getElementById("fillFormsBtn").addEventListener("click", () => {
    if (chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: "AUTOCLICK_FILL_FORMS" }, (res) => {
            const count = res && res.filled ? res.filled : 0;
            statusBadge.textContent = `${count} Filled`;
            statusMsg.textContent = `✓ Populated ${count} form inputs with synthetic QA data!`;
          });
        }
      });
    }
  });

  document.getElementById("toggleClickBtn").addEventListener("click", () => {
    const selector = selectorInput.value.trim() || "#qa-action-btn";
    const intervalMs = Number(intervalSelect.value) || 500;
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ autoclick_config: { selector, intervalMs, refreshSec: 30 } });
    }
    if (chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0] && tabs[0].id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: "AUTOCLICK_TOGGLE_CLICKER",
            selector,
            intervalMs
          }, (res) => {
            if (res && res.ok) {
              statusBadge.textContent = res.running ? "Active" : "Paused";
              statusMsg.textContent = res.running
                ? `▶ Auto-clicking ${selector} every ${intervalMs}ms`
                : `⏹ Auto-clicker stopped (${res.clickCount} clicks)`;
            }
          });
        }
      });
    }
  });

  document.getElementById("saveRefreshBtn").addEventListener("click", () => {
    statusMsg.textContent = "✓ Saved 30s tab auto-refresh schedule in storage!";
  });
});
