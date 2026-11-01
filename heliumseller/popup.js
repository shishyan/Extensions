let xrayData = { products: [], keywords: [] };
const productsBox = document.getElementById("productsBox");
const keywordsBox = document.getElementById("keywordsBox");

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs && tabs[0];
  if (!tab || !tab.id) return;
  chrome.tabs.sendMessage(tab.id, { type: "HELIUM_XRAY_SCAN" }, (res) => {
    if (!chrome.runtime.lastError && res && res.ok) {
      xrayData = res;
      productsBox.innerHTML = (res.products || [])
        .map((p) => `<div><strong>${p.asin}</strong> • ${p.price} • <span style="color:#34d399">${p.reviewVelocity}</span></div>`)
        .join("");
      keywordsBox.textContent = (res.keywords || []).map((k) => `${k.word} (${k.estSearchVol}/mo)`).join(" • ");
    } else {
      productsBox.textContent = "Ready — Open any product or search page to run Helium Xray.";
    }
  });
});

document.getElementById("copyKwBtn").addEventListener("click", () => {
  const kwStr = (xrayData.keywords || []).map((k) => k.word).join(" ");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(kwStr).catch(() => {});
  }
  document.getElementById("copyKwBtn").textContent = "✅ Copied Keywords!";
});

document.getElementById("exportCsvBtn").addEventListener("click", () => {
  const csv = [
    "ASIN,Title,Price,ReviewVelocity",
    ...(xrayData.products || []).map((p) => `${p.asin},"${p.title}",${p.price},${p.reviewVelocity}`)
  ].join("\n");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(csv).catch(() => {});
  }
  document.getElementById("exportCsvBtn").textContent = "✅ Copied CSV!";
});
