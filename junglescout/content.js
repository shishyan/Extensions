/**
 * JungleScout — Content Script
 * E-Commerce Product Sales Estimator, Listing Quality Score (LQS) & Opportunity Score HUD
 */

(() => {
  "use strict";

  if (!document.body) return;

  function analyzeProductPage() {
    const bodyText = (document.body.innerText || document.body.textContent || "");
    const priceMatch = bodyText.match(/\$\s?(\d+(?:\.\d{2})?)/);
    const price = priceMatch ? parseFloat(priceMatch[1]) : 49.0;
    const bsrMatch = bodyText.match(/#?(\d{1,3}(?:,\d{3})*)\s+in\s+/i);
    const bsr = bsrMatch ? parseInt(bsrMatch[1].replace(/,/g, ""), 10) : 1450;

    const estMonthlyUnits = Math.max(45, Math.round(180000 / Math.pow(bsr, 0.62)));
    const estMonthlyRev = Math.round(estMonthlyUnits * price);
    const bulletCount = document.querySelectorAll("#feature-bullets li, ul li").length;
    const imgCount = document.querySelectorAll("img").length;
    const titleLen = (document.title || "").length;

    const lqs = Math.min(98, 55 + Math.min(20, bulletCount * 4) + Math.min(15, imgCount * 3) + (titleLen > 40 ? 8 : 4));
    const oppScore = bsr < 5000 ? 9 : 7;

    return {
      title: document.title || "E-Commerce Listing",
      price,
      bsr,
      estMonthlyUnits,
      estMonthlyRev,
      lqs,
      oppScore
    };
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "JUNGLESCOUT_ANALYZE") {
      sendResponse({ ok: true, ...analyzeProductPage() });
      return false;
    }
  });

  let bar = document.getElementById("junglescout-bar");
  if (!bar) {
    const data = analyzeProductPage();
    bar = document.createElement("div");
    bar.id = "junglescout-bar";
    bar.className = "junglescout-bar";
    bar.title = "JungleScout: Estimated Monthly Sales, Revenue & Listing Quality Score";
    bar.textContent = `🌴 JungleScout: ~${data.estMonthlyUnits}/mo ($${data.estMonthlyRev.toLocaleString()}) • LQS ${data.lqs}`;
    bar.addEventListener("click", () => {
      const fresh = analyzeProductPage();
      bar.textContent = `🌴 Opp Score: ${fresh.oppScore}/10 • ${fresh.estMonthlyUnits} units/mo ✓`;
    });
    document.body.appendChild(bar);
  }
})();
