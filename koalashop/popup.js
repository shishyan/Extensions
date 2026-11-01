let storeData = null;

if (chrome.tabs && chrome.tabs.query) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "KOALA_INSPECT" }, (res) => {
        if (chrome.runtime.lastError || !res) return;
        storeData = res;
        document.getElementById("themeVal").textContent = res.theme;
        document.getElementById("prodVal").textContent = res.productCount + " items (Avg $" + res.avgPrice + ")";
        document.getElementById("appVal").textContent = res.apps.join(", ");
      });
    }
  });
}

document.getElementById("exportBtn").addEventListener("click", () => {
  if (!storeData) return;
  const rows = [["Title", "Handle", "Vendor", "Type", "Price ($)", "Variants"]];
  if (storeData.products && storeData.products.length) {
    storeData.products.forEach((p) => rows.push([p.title, p.handle, p.vendor, p.productType, p.price, p.variantsCount]));
  } else {
    rows.push([storeData.domain + " Storefront", "catalog", storeData.domain, storeData.theme, storeData.avgPrice, 1]);
  }
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = `koalashop-${storeData.domain}-catalog.csv`;
  a.click();
});
