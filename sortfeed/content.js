/**
 * SortFeed — Content Script
 * Universal Social & Video Feed Sorter & Viral Outlier Ranker
 */

(() => {
  "use strict";

  if (!document.body) return;

  function parseMetricScore(text) {
    const str = (text || "").replace(/,/g, "");
    let best = 0;
    const rx = /\b(\d+(?:\.\d+)?)\s*([KMBkmb])?\b/g;
    let m;
    while ((m = rx.exec(str)) !== null) {
      let val = parseFloat(m[1]);
      const unit = (m[2] || "").toUpperCase();
      if (unit === "K") val *= 1000;
      else if (unit === "M") val *= 1000000;
      else if (unit === "B") val *= 1000000000;
      if (val > best) best = val;
    }
    return best || text.length;
  }

  function rankAndSortFeed(mode = "views") {
    const cards = Array.from(
      document.querySelectorAll("article, [data-post], .feed-card, ytd-rich-item-renderer, ytd-grid-video-renderer, li, tr")
    ).filter((el) => (el.innerText || "").trim().length > 15);

    const scored = cards.map((el, idx) => {
      const txt = (el.innerText || el.textContent || "").trim();
      const baseScore = parseMetricScore(txt);
      const multiplier = mode === "viral" ? baseScore / Math.max(10, txt.length) : baseScore;
      return {
        el,
        idx,
        title: txt.split(/\n+/)[0].slice(0, 80),
        score: Math.round(multiplier * 10) / 10
      };
    });

    scored.sort((a, b) => b.score - a.score);

    // Reorder sibling cards that share a common parent container
    if (scored.length >= 2) {
      const byParent = new Map();
      scored.forEach((item) => {
        const p = item.el.parentElement;
        if (!p) return;
        if (!byParent.has(p)) byParent.set(p, []);
        byParent.get(p).push(item.el);
      });
      for (const [parent, children] of byParent.entries()) {
        if (children.length >= 2) {
          children.forEach((ch) => parent.appendChild(ch));
        }
      }
      scored[0].el.classList.add("sortfeed-winner");
    }

    const status = document.getElementById("sf-status");
    if (status) {
      status.textContent = `Sorted ${scored.length} items (${mode.toUpperCase()})`;
    }

    return scored.slice(0, 15).map((s, rank) => ({
      rank: rank + 1,
      title: s.title,
      score: s.score
    }));
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "SORTFEED_SORT") {
      const items = rankAndSortFeed(msg.mode || "views");
      sendResponse({ ok: true, items });
      return false;
    }
  });

  let toolbar = document.getElementById("sortfeed-toolbar");
  if (!toolbar) {
    toolbar = document.createElement("div");
    toolbar.id = "sortfeed-toolbar";
    toolbar.className = "sortfeed-toolbar";
    toolbar.innerHTML = `
      <span style="color:#fb923c;font-weight:800;">🔥 SortFeed</span>
      <button id="sf-views-btn" type="button">🔥 By Views/Metrics</button>
      <button id="sf-viral-btn" type="button" style="background:#ef4444;color:#fff;">⚡ Viral Outlier</button>
      <span id="sf-status" style="color:#94a3b8;font-size:10px;">Ready</span>
    `;
    document.body.appendChild(toolbar);

    toolbar.querySelector("#sf-views-btn").addEventListener("click", () => rankAndSortFeed("views"));
    toolbar.querySelector("#sf-viral-btn").addEventListener("click", () => rankAndSortFeed("viral"));
  }
})();
