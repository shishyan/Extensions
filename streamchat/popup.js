const mpmVal = document.getElementById("mpmVal");
const qaCount = document.getElementById("qaCount");
const spamCount = document.getElementById("spamCount");
const qaList = document.getElementById("qaList");

function scanTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    if (!tab || !tab.id) return;
    chrome.tabs.sendMessage(tab.id, { type: "STREAMCHAT_SCAN" }, (res) => {
      if (!chrome.runtime.lastError && res && res.ok) {
        mpmVal.textContent = String(res.mpm || 48);
        qaCount.textContent = String((res.questions || []).length);
        spamCount.textContent = String(res.spamBlocked || 0);
        qaList.textContent = (res.questions || []).map((q, i) => `${i + 1}. ${q}`).join("\n\n");
      }
    });
  });
}

document.getElementById("cinemaBtn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    if (!tab || !tab.id) return;
    chrome.tabs.sendMessage(tab.id, { type: "STREAMCHAT_CINEMA" }, (res) => {
      if (!chrome.runtime.lastError && res) {
        document.getElementById("cinemaBtn").textContent = res.cinemaOn ? "🎬 Cinema Mode ON" : "🎬 Cinema Mode OFF";
      }
    });
  });
});

document.getElementById("refreshBtn").addEventListener("click", scanTab);

scanTab();
