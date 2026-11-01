let xrayData = null;

if (chrome.tabs && chrome.tabs.query) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "HELIUM_XRAY" }, (res) => {
        if (chrome.runtime.lastError || !res) return;
        xrayData = res;
        document.getElementById("asinVal").textContent = res.asin;
        document.getElementById("bsrVal").textContent = "#" + res.bsr.toLocaleString();
        document.getElementById("velVal").textContent = res.estMonthlySales.toLocaleString() + "/mo";
        document.getElementById("kwBox").innerHTML = `
          <div><strong>Listing SEO Score:</strong> ${res.lqs}/10 (${res.bullets} bullets, ${res.images} images, ${res.rating}★)</div>
          <div style="margin-top:4px;"><strong>Est. Monthly Revenue:</strong> <span style="color:#34d399;">$${res.estMonthlyRev.toLocaleString()}</span> (${res.searchProducts.length} ASINs indexed)</div>
        `;
      });
    }
  });
}

document.getElementById("csvBtn").addEventListener("click", () => {
  if (!xrayData) return;
  const rows = [["ASIN", "Title", "Price", "BSR", "Est Monthly Sales", "Est Monthly Revenue"]];
  (xrayData.searchProducts || []).forEach((p) => {
    rows.push([p.asin, p.title, p.price, xrayData.bsr, p.estSales, p.estRev]);
  });
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = `heliumseller-xray-${xrayData.asin}.csv`;
  a.click();
});
