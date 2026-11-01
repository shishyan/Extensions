document.getElementById("saveGoalBtn").addEventListener("click", () => {
  const goal = document.getElementById("goalInp").value.trim();
  if (chrome.tabs && chrome.tabs.query) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "MOMEN_SET_GOAL", goal }, () => {});
      }
    });
  }
  document.getElementById("saveGoalBtn").textContent = "✅ MIT Focus Goal Synced!";
});
