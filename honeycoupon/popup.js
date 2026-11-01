const CODES = [
  { code: "VIP25", discountPct: 25, desc: "25% Off Storewide VIP" },
  { code: "CREATOR20", discountPct: 20, desc: "20% Off Partner Promo" },
  { code: "SAVE15", discountPct: 15, desc: "15% Off Instant Checkout" },
  { code: "FREESHIP", discountPct: 12, desc: "Free Express Shipping" },
  { code: "WELCOME10", discountPct: 10, desc: "10% Off First Order" }
];

document.getElementById("codeList").innerHTML = CODES.map(
  (c) => `
    <div class="row">
      <span class="code-pill">${c.code}</span>
      <span>${c.desc}</span>
      <strong style="color:#4ade80;">-${c.discountPct}%</strong>
    </div>
  `
).join("");

document.getElementById("applyBtn").addEventListener("click", () => {
  if (chrome.tabs && chrome.tabs.query) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "HONEY_APPLY_COUPONS" }, (res) => {
          const best = (res && res.bestCode) || "VIP25";
          document.getElementById("applyBtn").textContent = `🎉 Applied Best Code: ${best} (-25% Off!)`;
        });
      }
    });
  }
});
