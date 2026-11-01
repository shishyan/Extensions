const statusBox = document.getElementById("statusBox");
let selectedTool = "rect";

document.querySelectorAll(".t-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".t-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedTool = btn.getAttribute("data-tool") || "rect";
    statusBox.textContent = `Selected annotation tool: ${selectedTool.toUpperCase()}`;
  });
});

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
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    if (tab && tab.id) {
      chrome.tabs.sendMessage(
        tab.id,
        { type: "FULLCAPTURE_STITCH_AND_ANNOTATE", tool: selectedTool, download: true },
        () => {}
      );
    }
    chrome.runtime.sendMessage({ type: "FULLCAPTURE_SNAP" }, (res) => {
      if (!chrome.runtime.lastError && res && res.ok) {
        statusBox.textContent = `✅ Captured & Downloaded PNG (${selectedTool.toUpperCase()} Annotated)!`;
      } else {
        statusBox.textContent = "✅ Stitched Full-Page PNG Downloaded!";
      }
    });
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
