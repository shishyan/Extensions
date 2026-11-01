let lastData = null;

if (chrome.tabs && chrome.tabs.query) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "TOKTREND_SCAN" }, (res) => {
        if (chrome.runtime.lastError || !res) return;
        lastData = res;
        document.getElementById("engVal").textContent = res.engagementRate;
        document.getElementById("velVal").textContent = res.viralScore + "/100";
        document.getElementById("tagCount").textContent = res.tags.length;
        document.getElementById("tagsBox").innerHTML = res.tags
          .map((t) => `<span class="tag">${t}</span>`)
          .join("");
      });
    }
  });
}

document.getElementById("copyBtn").addEventListener("click", () => {
  if (!lastData) return;
  navigator.clipboard.writeText(lastData.tags.join(" "));
  document.getElementById("copyBtn").textContent = "✅ Hashtags Copied to Clipboard!";
  setTimeout(() => (document.getElementById("copyBtn").textContent = "📋 Copy All Trending Hashtags"), 1300);
});
