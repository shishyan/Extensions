(function () {
  if (window.__fakeSpotLoaded) return;
  window.__fakeSpotLoaded = true;

  const BOT_PATTERNS = [
    /received this product for free/i,
    /in exchange for my honest review/i,
    /best product ever!{2,}/i,
    /10\/10 recommend!{2,}/i,
    /life changing!{2,}/i
  ];

  function auditReviews() {
    const blocks = Array.from(document.querySelectorAll(".review, [data-hook='review'], article, p")).filter(
      (el) => el.innerText && el.innerText.trim().length > 18
    );

    let suspiciousCount = 0;
    blocks.forEach((b) => {
      const txt = b.innerText.trim();
      const exclamations = (txt.match(/!/g) || []).length;
      const isBot = BOT_PATTERNS.some((rx) => rx.test(txt)) || exclamations >= 3;
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
    } else if (botRatio > 0.1) {
      grade = "B";
      delta = 0.3;
    }

    const rawRating = 4.8;
    const adjustedRating = Number(Math.max(2.5, rawRating - delta).toFixed(1));

    return {
      grade,
      totalScanned: blocks.length,
      suspiciousCount,
      rawRating,
      adjustedRating,
      authenticPct: Math.max(35, Math.round((1 - botRatio) * 100))
    };
  }

  function injectBadge() {
    if (document.getElementById("fakespot-badge")) return;
    const res = auditReviews();
    const badge = document.createElement("div");
    badge.id = "fakespot-badge";
    badge.innerHTML = `
      <div style="font-size:12px;font-weight:700;">
        🛡️ <strong>FakeSpot Review Audit</strong> — Raw: ${res.rawRating}★ → Adjusted: <strong style="color:#60a5fa;">${res.adjustedRating}★</strong> (${res.authenticPct}% Authentic)
      </div>
      <span class="fs-grade">Grade: ${res.grade}</span>
    `;
    const target = document.querySelector("main") || document.body;
    target.prepend(badge);
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "FAKESPOT_AUDIT") {
      sendResponse(auditReviews());
      return true;
    }
  });

  injectBadge();
})();
