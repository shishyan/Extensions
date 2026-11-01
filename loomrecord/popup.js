const scriptBox = document.getElementById("scriptBox");
let isRec = false;

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
  isRec = !isRec;
  btn.textContent = isRec ? "⏹️ Stop & Download .WebM" : "✅ Saved .WebM Recording!";
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    if (tab && tab.id) {
      chrome.tabs.sendMessage(tab.id, { type: "LOOM_RECORD_TOGGLE" }, () => {});
    }
  });
});
