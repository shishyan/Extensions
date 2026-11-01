let lastScan = null;

if (chrome.tabs && chrome.tabs.query) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "JUNGLESCOUT_SCAN" }, (res) => {
        if (chrome.runtime.lastError || !res) return;
        lastScan = res;
        document.getElementById("salesVal").textContent = res.estMonthlySales.toLocaleString() + "/mo";
        document.getElementById("revVal").textContent = "$" + res.estMonthlyRev.toLocaleString();
        document.getElementById("lqsVal").textContent = res.lqs + " / 10";
        document.getElementById("oppVal").textContent = res.reviews < 300 && res.estMonthlySales > 150 ? "8.5 High" : "6.8 Med";
        document.getElementById("priceInput").value = res.price;
        calcProfit();
      });
    }
  });
}

function calcProfit() {
  const price = Number(document.getElementById("priceInput").value || 0);
  const cogs = Number(document.getElementById("cogsInput").value || 0);
  const fbaFee = Number((price * 0.15 + 4.75).toFixed(2));
  const net = Number((price - cogs - fbaFee).toFixed(2));
  const roi = cogs > 0 ? Math.round((net / cogs) * 100) : 0;
  document.getElementById("profitOut").textContent = `Net Profit: $${net} / unit (FBA Fee: $${fbaFee}) • ROI: ${roi}%`;
}

document.getElementById("calcBtn").addEventListener("click", calcProfit);
