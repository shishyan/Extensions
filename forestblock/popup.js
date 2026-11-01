document.getElementById("plantBtn").addEventListener("click", () => {
  if (chrome.tabs && chrome.tabs.query) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "FOREST_PLANT_TREE" }, (res) => {
          const count = (res && res.treesPlanted) || 15;
          document.getElementById("treeCountTxt").textContent = `${count} Deep-Work Trees Grown`;
        });
      }
    });
  }
  document.getElementById("plantBtn").textContent = "✅ Focus Session Started (+1 Tree)!";
});
