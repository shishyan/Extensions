if (chrome.tabs && chrome.tabs.query) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "REQUESTRULE_GET_NETWORK" }, (res) => {
        if (!chrome.runtime.lastError && res) {
          document.getElementById("reqCount").textContent = `🌐 Requests: ${res.totalRequests}`;
          document.getElementById("latVal").textContent = `⏱️ Avg Latency: ${res.avgLatencyMs}ms`;
        }
      });
    }
  });
}

document.getElementById("saveRuleBtn").addEventListener("click", () => {
  const match = document.getElementById("matchInp").value.trim();
  const mock = document.getElementById("mockInp").value.trim();
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ requestrule_last: { match, mock } });
  }
  document.getElementById("saveRuleBtn").textContent = "✅ HTTP Mock Rule Saved!";
});
