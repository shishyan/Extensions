(function () {
  if (window.__fakeSpotLoaded) return;
  window.__fakeSpotLoaded = true;

  const BOT_PATTERNS = [
    /received this product for free/i,
    /in exchange for my honest review/i,
    /promotional discount/i,
    /best product ever!{2,}/i,
    /10\/10 recommend!{2,}/i,
    /life changing!{2,}/i,
    /must buy now!{2,}/i
  ];

  function auditReviews() {
    const reviewEls = Array.from(
      document.querySelectorAll("[data-hook='review'], .review, .yotpo-review, .jdgm-rev, article")
    ).filter((el) => el.innerText && el.innerText.trim().length > 25);

    const blocks = reviewEls.length
      ? reviewEls
      : Array.from(document.querySelectorAll("p")).filter((el) => el.innerText && el.innerText.trim().length > 35);

    let suspiciousCount = 0;
    let verifiedCount = 0;
    const seenPhrases = new Set();

    blocks.forEach((b) => {
      const txt = b.innerText.trim();
      const lower = txt.toLowerCase();
      if (/verified purchase|verified buyer/i.test(txt)) verifiedCount++;
      const exclamations = (txt.match(/!/g) || []).length;
      const snippet = lower.slice(0, 50);
      const isDup = seenPhrases.has(snippet);
      seenPhrases.add(snippet);

      const isBot = BOT_PATTERNS.some((rx) => rx.test(txt)) || exclamations >= 4 || isDup;
      if (isBot) suspiciousCount++;
    });

    const total = Math.max(1, blocks.length);
    const botRatio = suspiciousCount / total;
    let grade = "A";
    let delta = 0.1;
    if (botRatio > 0.45) {
      grade = "D";
      delta = 0.9;
    } else if (botRatio > 0.25) {
      grade = "C";
      delta = 0.6;
    } else if (botRatio > 0.12) {
      grade = "B";
      delta = 0.3;
    }

    const ratingEl = document.querySelector(".a-icon-alt, [aria-label*='out of 5 stars']");
    const ratingMatch = ratingEl ? (ratingEl.innerText || ratingEl.getAttribute("aria-label") || "").match(/([0-9]\.[0-9])/) : null;
    const rawRating = ratingMatch ? Number(ratingMatch[1]) : 4.7;
    const adjustedRating = Number(Math.max(2.2, rawRating - delta).toFixed(1));

    return {
      grade,
      totalScanned: blocks.length,
      verifiedCount,
      suspiciousCount,
      rawRating,
      adjustedRating,
      authenticPct: Math.max(35, Math.round((1 - botRatio) * 100))
    };
  }

  function injectBadge() {
    if (document.getElementById("fakespot-badge")) return;
    if (!document.querySelector("[data-hook='review'], #productTitle, .product")) return;
    const res = auditReviews();
    const badge = document.createElement("div");
    badge.id = "fakespot-badge";
    badge.innerHTML = `
      <div style="font-size:12px;font-weight:700;">
        🛡️ <strong>FakeSpot Review Audit</strong> — Raw: ${res.rawRating}★ → Adjusted: <strong style="color:#60a5fa;">${res.adjustedRating}★</strong> (${res.authenticPct}% Authentic)
      </div>
      <span class="fs-grade">Grade: ${res.grade}</span>
    `;
    const target = document.querySelector("#averageCustomerReviews, #title, main") || document.body;
    target.prepend(badge);
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "FAKESPOT_AUDIT") {
      sendResponse(auditReviews());
      return true;
    }
  });

  setTimeout(injectBadge, 1000);
})();
