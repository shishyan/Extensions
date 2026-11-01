if (chrome.storage && chrome.storage.local) {
  chrome.storage.local.get({ forestblock_domains: ["tiktok.com", "instagram.com", "reddit.com"], forestblock_trees: 14 }, (res) => {
    if (Array.isArray(res.forestblock_domains)) {
      document.getElementById("domInp").value = res.forestblock_domains.join(", ");
    }
    if (res.forestblock_trees) {
      document.getElementById("treeCountTxt").textContent = `${res.forestblock_trees} Deep-Work Trees Grown`;
    }
  });
}

document.getElementById("plantBtn").addEventListener("click", () => {
  const domains = document.getElementById("domInp").value
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ forestblock_domains: domains });
  }
  if (chrome.tabs && chrome.tabs.query) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "FOREST_PLANT_TREE", domains }, (res) => {
          const count = (res && res.treesPlanted) || 15;
          document.getElementById("treeCountTxt").textContent = `${count} Deep-Work Trees Grown`;
        });
      }
    });
  }
  document.getElementById("plantBtn").textContent = "✅ Focus Shield Active (+1 Tree)!";
});
