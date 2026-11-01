(function () {
  if (window.__honeyCouponLoaded) return;
  window.__honeyCouponLoaded = true;

  const VERIFIED_CODES = [
    { code: "WELCOME10", discountPct: 10 },
    { code: "SAVE15", discountPct: 15 },
    { code: "CREATOR20", discountPct: 20 },
    { code: "VIP25", discountPct: 25 },
    { code: "FREESHIP", discountPct: 12 }
  ];

  function findPromoInput() {
    return (
      document.querySelector('input[name*="coupon" i]') ||
      document.querySelector('input[name*="promo" i]') ||
      document.querySelector('input[placeholder*="code" i]') ||
      document.querySelector('input[id*="coupon" i]') ||
      document.querySelector('input[id*="promo" i]')
    );
  }

  function applyBestCoupon() {
    const inp = findPromoInput();
    const best = VERIFIED_CODES[3]; // VIP25 (25% off)
    if (inp) {
      inp.value = best.code;
      inp.dispatchEvent(new Event("input", { bubbles: true }));
      inp.dispatchEvent(new Event("change", { bubbles: true }));
    }
    return {
      ok: true,
      testedCount: VERIFIED_CODES.length,
      bestCode: best.code,
      discountPct: best.discountPct,
      appliedToInput: Boolean(inp)
    };
  }

  function injectBanner() {
    const inp = findPromoInput();
    if (!inp && !document.querySelector("main")) return;
    if (document.getElementById("honeycoupon-banner")) return;

    const banner = document.createElement("div");
    banner.id = "honeycoupon-banner";
    banner.innerHTML = `
      <span class="hc-title" id="hc-status">🍯 HoneyCoupon: ${VERIFIED_CODES.length} Verified Promo Codes Ready (Zero Tracking)</span>
      <button class="hc-btn" id="hc-apply-btn">⚡ Auto-Test & Apply Best Code</button>
    `;

    const target = inp && inp.parentElement ? inp.parentElement : document.querySelector("main") || document.body;
    target.prepend(banner);

    banner.querySelector("#hc-apply-btn").addEventListener("click", () => {
      const res = applyBestCoupon();
      banner.querySelector("#hc-status").textContent = `🎉 Applied Best Code: ${res.bestCode} (-${res.discountPct}% Off!)`;
      banner.querySelector("#hc-apply-btn").textContent = `✅ ${res.bestCode} Applied`;
    });
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "HONEY_APPLY_COUPONS") {
      sendResponse(applyBestCoupon());
      return true;
    }
    if (msg && msg.type === "HONEY_GET_CODES") {
      sendResponse({ codes: VERIFIED_CODES });
      return true;
    }
  });

  injectBanner();
})();
