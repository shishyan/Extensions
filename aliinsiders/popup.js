let latestData = {
  trustScore: 94,
  landedCost: 17.0,
  rrp: 51.0,
  profit: 34.0,
  images: []
};

function render(d) {
  if (d && typeof d.landedCost === "number") latestData = d;
  document.getElementById("tVal").textContent = `${latestData.trustScore}%`;
  document.getElementById("cVal").textContent = `$${latestData.landedCost.toFixed(2)}`;
  document.getElementById("rVal").textContent = `$${latestData.rrp.toFixed(2)}`;
  document.getElementById("pVal").textContent = `+$${latestData.profit.toFixed(2)}`;
}

if (chrome.tabs && chrome.tabs.query) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "ALI_GET_INSIGHTS" }, (res) => {
        if (!chrome.runtime.lastError && res) render(res);
      });
    }
  });
}

document.getElementById("harvestBtn").addEventListener("click", () => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText((latestData.images || []).join("\n")).catch(() => {});
  }
  document.getElementById("harvestBtn").textContent = `✅ Copied ${(latestData.images || []).length} Image URLs!`;
});
