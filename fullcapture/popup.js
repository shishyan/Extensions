const statusBox = document.getElementById("statusBox");

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs && tabs[0];
  if (!tab || !tab.id) return;
  chrome.tabs.sendMessage(tab.id, { type: "FULLCAPTURE_METRICS" }, (res) => {
    if (!chrome.runtime.lastError && res && res.ok) {
      document.getElementById("vpDim").textContent = `${res.viewportW}x${res.viewportH}`;
      document.getElementById("fullDim").textContent = `${res.scrollW}x${res.scrollH}`;
      document.getElementById("dprVal").textContent = `${res.dpr}x`;
    }
  });
});

document.getElementById("snapPngBtn").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "FULLCAPTURE_SNAP" }, (res) => {
    if (!chrome.runtime.lastError && res && res.ok) {
      statusBox.textContent = "✅ Captured High-DPI PNG Snapshot!";
    }
  });
});

document.getElementById("toggleGridBtn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    if (!tab || !tab.id) return;
    chrome.tabs.sendMessage(tab.id, { type: "FULLCAPTURE_TOGGLE_GRID" }, (res) => {
      if (!chrome.runtime.lastError && res) {
        statusBox.textContent = res.gridActive ? "📐 16px Design Grid Activated!" : "📐 Grid Hidden.";
      }
    });
  });
});
