/**
 * TubeIQ — Content Script for YouTube Feed, Search, Watch Page & Studio
 * 1. Computes channel/feed average views and overlays live Outlier Multiplier (e.g. 🔥 4.8x Outlier | 142 VPH)
 *    on every YouTube video and Short card (like 1of10 + vidIQ).
 * 2. Injects the TubeIQ SEO Scorecard & One-Click Tag Extractor panel on YouTube Watch pages.
 */

(function () {
  "use strict";

  function parseCompactNumber(str) {
    if (!str) return 0;
    const clean = str.replace(/,/g, "").trim().toUpperCase();
    const match = clean.match(/([\d.]+)\s*([KMB]|கோடி|லட்சம்|ஆயிரம்)?/);
    if (!match) return 0;
    let val = parseFloat(match[1]);
    if (isNaN(val)) return 0;
    const unit = match[2] || "";
    if (unit === "K" || unit === "ஆயிரம்") val *= 1e3;
    else if (unit === "M") val *= 1e6;
    else if (unit === "B") val *= 1e9;
    else if (unit === "லட்சம்") val *= 1e5;
    else if (unit === "கோடி") val *= 1e7;
    return Math.round(val);
  }

  function parseAgeHours(str) {
    if (!str) return 24;
    const s = str.toLowerCase();
    const m = s.match(/(\d+)\s*(second|minute|hour|day|week|month|year|மணி|நாள்|வாரம்|மாதம்|ஆண்டு)/);
    if (!m) return 48;
    const n = parseInt(m[1], 10) || 1;
    const u = m[2];
    if (u.startsWith("second")) return 0.1;
    if (u.startsWith("minute")) return Math.max(0.2, n / 60);
    if (u.startsWith("hour") || u === "மணி") return n;
    if (u.startsWith("day") || u === "நாள்") return n * 24;
    if (u.startsWith("week") || u === "வாரம்") return n * 24 * 7;
    if (u.startsWith("month") || u === "மாதம்") return n * 24 * 30;
    if (u.startsWith("year") || u === "ஆண்டு") return n * 24 * 365;
    return 48;
  }

  function annotateThumbnailCards() {
    const cards = Array.from(
      document.querySelectorAll(
        "ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer, ytm-shorts-lockup-view-model"
      )
    );
    if (!cards.length) return;

    const cardStats = [];
    for (const card of cards) {
      const metaSpans = Array.from(
        card.querySelectorAll(
          "#metadata-line span, .inline-metadata-item, . shortsLockupViewModelHostOutsideMetadataSubhead span"
        )
      ).map((el) => el.textContent.trim());

      let views = 0;
      let hours = 48;
      for (const txt of metaSpans) {
        if (/view|காட்சி/i.test(txt)) {
          views = parseCompactNumber(txt);
        } else if (/ago|முன்/i.test(txt)) {
          hours = parseAgeHours(txt);
        }
      }
      if (views > 0) {
        cardStats.push({ card, views, hours });
      }
    }

    if (!cardStats.length) return;
    const sortedViews = cardStats.map((c) => c.views).sort((a, b) => a - b);
    const medianViews = sortedViews[Math.floor(sortedViews.length / 2)] || 1000;

    for (const { card, views, hours } of cardStats) {
      if (card.dataset.tubeiqAnnotated === "1") continue;
      const thumbContainer =
        card.querySelector("ytd-thumbnail, .shortsLockupViewModelHostThumbnailContainer") || card;
      if (!thumbContainer) continue;

      const mult = +(views / Math.max(1, medianViews)).toFixed(1);
      const vph = Math.max(1, Math.round(views / Math.max(1, hours)));

      const badge = document.createElement("div");
      badge.className = "tubeiq-thumb-badge";
      if (mult >= 3.0) {
        badge.classList.add("tubeiq-mega-outlier");
        badge.textContent = `🔥 ${mult}x Outlier • ${vph.toLocaleString()} VPH`;
      } else if (mult >= 1.5) {
        badge.classList.add("tubeiq-strong-outlier");
        badge.textContent = `⚡ ${mult}x Avg • ${vph.toLocaleString()} VPH`;
      } else {
        badge.textContent = `📊 ${mult}x • ${vph.toLocaleString()} VPH`;
      }

      const stylePos = window.getComputedStyle(thumbContainer).position;
      if (stylePos === "static") {
        thumbContainer.style.position = "relative";
      }
      thumbContainer.appendChild(badge);
      card.dataset.tubeiqAnnotated = "1";
    }
  }

  function computeSeoScore(title, description, tags) {
    let score = 0;
    const checks = [];

    if (title.length >= 40 && title.length <= 95) {
      score += 25;
      checks.push(`✅ Optimal title length (${title.length} chars)`);
    } else {
      score += 12;
      checks.push(`⚠️ Title length (${title.length} chars — aim for 45–90)`);
    }

    if (/[|—\-:]/.test(title)) {
      score += 15;
      checks.push("✅ High-CTR dual-hook separator in title");
    } else {
      checks.push("⚠️ Add '|' or '—' dual-hook separator in title");
    }

    if (description.length >= 350) {
      score += 25;
      checks.push(`✅ Rich SEO description (${description.length} chars)`);
    } else {
      score += 10;
      checks.push(`⚠️ Short description (${description.length} chars — aim for 350+)`);
    }

    if (/https?:\/\//.test(description)) {
      score += 15;
      checks.push("✅ Cross-links / playlist links in description");
    } else {
      checks.push("⚠️ No links found in description");
    }

    if (tags.length >= 12) {
      score += 20;
      checks.push(`✅ Strong tag density (${tags.length} tags)`);
    } else if (tags.length >= 5) {
      score += 10;
      checks.push(`⚠️ Moderate tag count (${tags.length} tags — aim for 12+)`);
    } else {
      checks.push(`⚠️ Low tag count (${tags.length} tags)`);
    }

    return { score, checks };
  }

  async function extractWatchPageMetadata() {
    try {
      const resp = await fetch(window.location.href, { credentials: "same-origin" });
      const html = await resp.text();
      const match = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});\s*(?:var|const|let|<\/script>)/s);
      if (match) {
        const data = JSON.parse(match[1]);
        const vd = data.videoDetails || {};
        return {
          videoId: vd.videoId || "",
          title: vd.title || document.title.replace(" - YouTube", ""),
          author: vd.author || "",
          viewCount: parseInt(vd.viewCount || "0", 10),
          shortDescription: vd.shortDescription || "",
          keywords: Array.isArray(vd.keywords) ? vd.keywords : []
        };
      }
    } catch (e) {
      console.warn("[TubeIQ] Metadata parse fallback:", e);
    }
    const metaKw = document.querySelector('meta[name="keywords"]');
    return {
      videoId: new URLSearchParams(window.location.search).get("v") || "",
      title: document.title.replace(" - YouTube", ""),
      author: "",
      viewCount: 0,
      shortDescription:
        (document.querySelector('meta[name="description"]') || {}).content || "",
      keywords: metaKw && metaKw.content ? metaKw.content.split(",").map((s) => s.trim()) : []
    };
  }

  let currentWatchVideoId = null;

  async function injectWatchScorecard() {
    if (!window.location.pathname.startsWith("/watch")) return;
    const vid = new URLSearchParams(window.location.search).get("v");
    if (!vid || vid === currentWatchVideoId) return;

    const secondary = document.querySelector("#secondary-inner, #secondary");
    if (!secondary) return;

    currentWatchVideoId = vid;
    const existing = document.getElementById("tubeiq-watch-panel");
    if (existing) existing.remove();

    const meta = await extractWatchPageMetadata();
    const { score, checks } = computeSeoScore(meta.title, meta.shortDescription, meta.keywords);

    const panel = document.createElement("div");
    panel.id = "tubeiq-watch-panel";
    panel.className = "tubeiq-watch-panel";

    const tagsHtml = meta.keywords.length
      ? meta.keywords.map((t) => `<span class="tubeiq-tag" title="Click to copy tag">${t}</span>`).join("")
      : `<span style="color:#94a3b8;font-size:12px;">No hidden video tags on this video.</span>`;

    panel.innerHTML = `
      <div class="tubeiq-header">
        <div class="tubeiq-brand">⚡ TubeIQ SEO Scorecard</div>
        <span class="tubeiq-pill">100% FREE</span>
      </div>
      <div class="tubeiq-grid">
        <div class="tubeiq-metric-box">
          <div class="tubeiq-metric-val" style="color:${score >= 80 ? "#10b981" : "#f59e0b"}">${score}/100</div>
          <div class="tubeiq-metric-lbl">SEO Score</div>
        </div>
        <div class="tubeiq-metric-box">
          <div class="tubeiq-metric-val">${meta.viewCount.toLocaleString()}</div>
          <div class="tubeiq-metric-lbl">Views</div>
        </div>
        <div class="tubeiq-metric-box">
          <div class="tubeiq-metric-val">${meta.keywords.length}</div>
          <div class="tubeiq-metric-lbl">Video Tags</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px;">
        <span style="font-size:12px;font-weight:700;color:#cbd5e1;">Extracted Video Tags</span>
        <button id="tubeiq-copy-all-tags" class="tubeiq-btn">Copy All Tags</button>
      </div>
      <div class="tubeiq-tags-wrap">${tagsHtml}</div>
      <div class="tubeiq-checklist">
        ${checks.map((c) => `<div>${c}</div>`).join("")}
      </div>
    `;

    secondary.prepend(panel);

    const copyBtn = panel.querySelector("#tubeiq-copy-all-tags");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(meta.keywords.join(", "));
        copyBtn.textContent = "✅ Copied!";
        setTimeout(() => (copyBtn.textContent = "Copy All Tags"), 2000);
      });
    }

    panel.querySelectorAll(".tubeiq-tag").forEach((el) => {
      el.addEventListener("click", () => {
        navigator.clipboard.writeText(el.textContent);
        el.style.borderColor = "#10b981";
      });
    });
  }

  setInterval(() => {
    annotateThumbnailCards();
    injectWatchScorecard();
  }, 2200);
})();
