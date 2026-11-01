let storeReport = {};

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs && tabs[0];
  if (!tab || !tab.id) return;
  chrome.tabs.sendMessage(tab.id, { type: "KOALASHOP_INSPECT" }, (res) => {
    if (!chrome.runtime.lastError && res && res.ok) {
      storeReport = res;
      document.getElementById("themeVal").textContent = res.themeName;
      document.getElementById("appsVal").textContent = (res.apps || []).join(" • ");
      document.getElementById("minP").textContent = `$${res.minPrice}`;
      document.getElementById("avgP").textContent = `$${res.avgPrice}`;
      document.getElementById("maxP").textContent = `$${res.maxPrice}`;
    }
  });
});

document.getElementById("exportStoreBtn").addEventListener("click", () => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(JSON.stringify(storeReport, null, 2)).catch(() => {});
  }
  document.getElementById("exportStoreBtn").textContent = "✅ Copied Store Intelligence Report!";
});
