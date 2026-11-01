(function () {
  if (window.__tokTrendLoaded) return;
  window.__tokTrendLoaded = true;

  function parseCount(str) {
    if (!str) return 0;
    const s = String(str).trim().toUpperCase().replace(/,/g, "");
    const m = s.match(/([0-9.]+)\s*([KMB])?/);
    if (!m) return 0;
    const val = parseFloat(m[1]) || 0;
    const mult = m[2] === "B" ? 1e9 : m[2] === "M" ? 1e6 : m[2] === "K" ? 1e3 : 1;
    return Math.round(val * mult);
  }

  function analyzeTrends() {
    const text = document.body ? document.body.innerText : "";
    const tags = Array.from(new Set(text.match(/#[a-zA-Z0-9_]{3,28}/g) || [])).slice(0, 20);
    if (tags.length === 0) tags.push("#fyp", "#viral", "#trending", "#creator", "#shorts", "#growth");

    const likeEl = document.querySelector("[data-e2e='like-count'], [data-e2e='browse-like-count'], [aria-label*='like']");
    const commentEl = document.querySelector("[data-e2e='comment-count'], [data-e2e='browse-comment-count']");
    const shareEl = document.querySelector("[data-e2e='share-count']");
    const viewEls = Array.from(document.querySelectorAll("[data-e2e='video-views'], strong[data-e2e='video-views']"));

    const likes = parseCount(likeEl ? likeEl.innerText : "") || 8400;
    const comments = parseCount(commentEl ? commentEl.innerText : "") || 420;
    const shares = parseCount(shareEl ? shareEl.innerText : "") || 310;
    const views = viewEls.length
      ? Math.max(...viewEls.map((el) => parseCount(el.innerText)))
      : Math.max(likes * 14, 95000);

    const engRate = (((likes + comments + shares) / Math.max(1, views)) * 100).toFixed(2) + "%";
    const viralVelocity = Math.min(99, Math.max(45, Math.round(50 + ((likes + comments * 2) / Math.max(1, views)) * 320)));

    return {
      domain: location.hostname,
      tags,
      views,
      likes,
      comments,
      shares,
      engagementRate: engRate,
      viralScore: viralVelocity
    };
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "TOKTREND_SCAN") {
      sendResponse(analyzeTrends());
      return true;
    }
  });
})();
