let latest = {
  currentPrice: 49.99,
  avg90d: 54.93,
  low90d: 47.99,
  verdict: "🟢 BUY NOW (Below 90d Avg)"
};

function render(d) {
  if (d && typeof d.currentPrice === "number") latest = d;
  document.getElementById("curVal").textContent = `$${latest.currentPrice.toFixed(2)}`;
  document.getElementById("avgVal").textContent = `$${latest.avg90d.toFixed(2)}`;
  document.getElementById("lowVal").textContent = `$${latest.low90d.toFixed(2)}`;
  document.getElementById("verdictBox").textContent = latest.verdict;
}

if (chrome.tabs && chrome.tabs.query) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "CAMEL_GET_HISTORY" }, (res) => {
        if (!chrome.runtime.lastError && res) render(res);
      });
    }
  });
}

document.getElementById("alertBtn").addEventListener("click", () => {
  const target = Number((latest.currentPrice * 0.9).toFixed(2));
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ cameltracker_last_alert: target });
  }
  document.getElementById("alertBtn").textContent = `✅ Alert Saved at $${target.toFixed(2)}!`;
});
