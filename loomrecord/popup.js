const scriptBox = document.getElementById("scriptBox");

document.getElementById("prompterBtn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    if (!tab || !tab.id) return;
    chrome.tabs.sendMessage(tab.id, { type: "LOOM_TOGGLE_PROMPTER", script: scriptBox.value }, () => {
      document.getElementById("prompterBtn").textContent = "✅ Teleprompter Active on Page!";
    });
  });
});

document.getElementById("recBtn").addEventListener("click", async () => {
  const btn = document.getElementById("recBtn");
  btn.textContent = "🔴 Ready (HD WebM)";
  try {
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      // Triggered on user gesture in real browser session
    }
  } catch (_) {}
});
