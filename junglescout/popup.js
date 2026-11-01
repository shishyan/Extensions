const priceIn = document.getElementById("priceIn");
const cogsIn = document.getElementById("cogsIn");
const fbaIn = document.getElementById("fbaIn");
const refIn = document.getElementById("refIn");
const netProfit = document.getElementById("netProfit");
const netMargin = document.getElementById("netMargin");
const netRoi = document.getElementById("netRoi");

function computeProfit() {
  const price = Math.max(0.01, Number(priceIn.value || 49));
  const cogs = Math.max(0.01, Number(cogsIn.value || 11.5));
  const fba = Number(fbaIn.value || 6.8);
  const refPct = Number(refIn.value || 15) / 100;
  const referralFee = price * refPct;
  const net = price - cogs - fba - referralFee;
  const margin = ((net / price) * 100).toFixed(1);
  const roi = ((net / cogs) * 100).toFixed(0);

  netProfit.textContent = `$${net.toFixed(2)} / unit`;
  netMargin.textContent = `${margin}%`;
  netRoi.textContent = `${roi}%`;
}

[priceIn, cogsIn, fbaIn, refIn].forEach((el) => el.addEventListener("input", computeProfit));

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs && tabs[0];
  if (!tab || !tab.id) return;
  chrome.tabs.sendMessage(tab.id, { type: "JUNGLESCOUT_ANALYZE" }, (res) => {
    if (!chrome.runtime.lastError && res && res.ok) {
      document.getElementById("unitsVal").textContent = res.estMonthlyUnits.toLocaleString();
      document.getElementById("revVal").textContent = `$${res.estMonthlyRev.toLocaleString()}`;
      document.getElementById("lqsVal").textContent = `${res.lqs} / 100`;
      priceIn.value = res.price;
      computeProfit();
    }
  });
});

computeProfit();
