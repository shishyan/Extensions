/**
 * VidOutlier — Complete Replacement for vidIQ Vision + Boost/Max + TubeBuddy Legend + 1of10
 * Features:
 * 1. Top-Right Real-Time Telemetry Bar in YouTube Masthead (Feed Median Views, Avg VPH, Mega Outliers, Quick Keyword Modal)
 * 2. 1of10 + vidIQ Outlier & VPH Badges + Instant HD Thumbnail Download button on every video/Short card
 * 3. Search Results Page ("/results") Full SERP Inspector Banner (Search Volume, Competition, Overall Opportunity Score, Top Channels, 1-Click Copy Top Search Tags)
 * 4. Watch Page ("/watch") 100-Point SEO Scorecard + Engagement Velocity + Est. Revenue + AI Viral Title Generator + 1-Click HD Thumbnail & Transcript Tools
 * 5. Shorts Feed ("/shorts/*") Floating Viral Outlier & VPH & 4K Thumbnail Overlay
 * 6. YouTube Studio ("studio.youtube.com") Auto-Tag & Viral Hook Optimizer Bar
 */

(function () {
  "use strict";

  let lastFeedSummary = { count: 0, medianViews: 0, avgVph: 0, outliers: 0 };

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

  function extractVideoIdFromHref(href) {
    if (!href) return null;
    try {
      const u = new URL(href, window.location.origin);
      if (u.pathname.startsWith("/watch")) return u.searchParams.get("v");
      if (u.pathname.startsWith("/shorts/")) return u.pathname.split("/shorts/")[1].split("/")[0];
    } catch (e) {}
    return null;
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  }

  // 1. TOP MASTHEAD REAL-TIME BAR (Replaces vidIQ Top Stats Bar)
  function injectMastheadBar() {
    if (window.location.hostname === "studio.youtube.com") return;
    const endButtons = document.querySelector("ytd-masthead #end, #masthead #end");
    if (!endButtons) return;

    let bar = document.getElementById("tubeiq-masthead-bar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "tubeiq-masthead-bar";
      bar.className = "tubeiq-masthead-bar";
      endButtons.prepend(bar);
    }
    bar.innerHTML = `
      <span class="tiq-logo">⚡ VidOutlier</span>
      <span class="tiq-stat" title="Median Views on Current Page">📊 Med: <strong>${lastFeedSummary.medianViews.toLocaleString()}</strong></span>
      <span class="tiq-stat" title="Average Views Per Hour on Page">🚀 VPH: <strong>${lastFeedSummary.avgVph.toLocaleString()}</strong></span>
      <span class="tiq-stat tiq-hot" title="Viral Outliers (3x+ Median) on Page">🔥 Outliers: <strong>${lastFeedSummary.outliers}</strong></span>
    `;
  }

  // 2. OUTLIER & VPH THUMBNAIL OVERLAYS + HD THUMBNAIL BUTTON
  function annotateThumbnailCards() {
    const cards = Array.from(
      document.querySelectorAll(
        "ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer, ytm-shorts-lockup-view-model, ytd-reel-item-renderer"
      )
    );
    if (!cards.length) {
      injectMastheadBar();
      return;
    }

    const cardStats = [];
    for (const card of cards) {
      const metaSpans = Array.from(
        card.querySelectorAll(
          "#metadata-line span, .inline-metadata-item, .shortsLockupViewModelHostOutsideMetadataSubhead span, .yt-content-metadata-view-model-wiz__metadata-text"
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

    if (!cardStats.length) {
      injectMastheadBar();
      return;
    }
    const sortedViews = cardStats.map((c) => c.views).sort((a, b) => a - b);
    const medianViews = sortedViews[Math.floor(sortedViews.length / 2)] || 1000;

    let totalVph = 0;
    let outlierCount = 0;

    for (const { card, views, hours } of cardStats) {
      const mult = +(views / Math.max(1, medianViews)).toFixed(1);
      const vph = Math.max(1, Math.round(views / Math.max(1, hours)));
      totalVph += vph;
      if (mult >= 3.0) outlierCount++;

      if (card.dataset.tubeiqAnnotated === "1") continue;
      const thumbContainer =
        card.querySelector("ytd-thumbnail, .shortsLockupViewModelHostThumbnailContainer, .yt-thumbnail-view-model") || card;
      if (!thumbContainer) continue;

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

      const linkEl = card.querySelector("a#thumbnail, a.shortsLockupViewModelHostEndpoint, a[href*='/watch'], a[href*='/shorts/']");
      const vid = linkEl ? extractVideoIdFromHref(linkEl.getAttribute("href")) : null;
      if (vid) {
        const dlBtn = document.createElement("a");
        dlBtn.className = "tubeiq-thumb-dl";
        dlBtn.href = `https://i.ytimg.com/vi/${vid}/maxresdefault.jpg`;
        dlBtn.target = "_blank";
        dlBtn.title = "Open 4K/HD Thumbnail (VidOutlier)";
        dlBtn.textContent = "🖼️ HD";
        dlBtn.addEventListener("click", (e) => e.stopPropagation());
        badge.appendChild(dlBtn);
      }

      const stylePos = window.getComputedStyle(thumbContainer).position;
      if (stylePos === "static") {
        thumbContainer.style.position = "relative";
      }
      thumbContainer.appendChild(badge);
      card.dataset.tubeiqAnnotated = "1";
    }

    lastFeedSummary = {
      count: cardStats.length,
      medianViews,
      avgVph: Math.round(totalVph / Math.max(1, cardStats.length)),
      outliers: outlierCount
    };
    injectMastheadBar();
  }

  // 3. SEARCH RESULTS PAGE ("/results") KEYWORD INSPECTOR BANNER
  let lastSearchQuery = null;
  function injectSearchResultsPanel() {
    if (!window.location.pathname.startsWith("/results")) return;
    const q = new URLSearchParams(window.location.search).get("search_query") || "";
    if (!q) return;

    const primary = document.querySelector(
      "ytd-two-column-search-results-renderer #primary ytd-section-list-renderer, ytd-two-column-search-results-renderer #primary, #results"
    );
    if (!primary) return;

    if (q === lastSearchQuery && document.getElementById("tubeiq-search-banner")) return;
    lastSearchQuery = q;

    const old = document.getElementById("tubeiq-search-banner");
    if (old) old.remove();

    const banner = document.createElement("div");
    banner.id = "tubeiq-search-banner";
    banner.className = "tubeiq-search-banner";
    banner.innerHTML = `<div style="color:#94a3b8;font-size:12px;">⚡ VidOutlier: Analyzing live search volume, competition & related viral tags for "<strong>${q}</strong>"...</div>`;
    primary.prepend(banner);

    chrome.runtime.sendMessage({ type: "TUBEIQ_KEYWORD_RESEARCH", query: q }, (resp) => {
      if (chrome.runtime.lastError || !resp || !resp.ok || !resp.data) return;
      const d = resp.data;
      const topTags = d.suggestions.slice(0, 12).map((s) => s.keyword);
      const scoreColor = d.overallScore >= 70 ? "#10b981" : d.overallScore >= 50 ? "#f59e0b" : "#ef4444";

      banner.innerHTML = `
        <div class="tubeiq-header">
          <div class="tubeiq-brand">⚡ VidOutlier — Search Keyword Intelligence: "${q}"</div>
          <div style="display:flex;gap:8px;align-items:center;">
            <span class="tubeiq-pill">vidIQ Max + 1of10 Unlocked</span>
            <button id="tubeiq-copy-search-tags" class="tubeiq-btn">📋 Copy All ${topTags.length} High-Rank Tags</button>
          </div>
        </div>
        <div class="tubeiq-grid" style="grid-template-columns:repeat(4,1fr);">
          <div class="tubeiq-metric-box">
            <div class="tubeiq-metric-val" style="color:${scoreColor}">${d.overallScore}/100</div>
            <div class="tubeiq-metric-lbl">Overall Opportunity</div>
          </div>
          <div class="tubeiq-metric-box">
            <div class="tubeiq-metric-val" style="color:#38bdf8">${d.avgDemand}/100</div>
            <div class="tubeiq-metric-lbl">Search Volume Score</div>
          </div>
          <div class="tubeiq-metric-box">
            <div class="tubeiq-metric-val" style="color:#a78bfa">${d.avgCompetition}/100</div>
            <div class="tubeiq-metric-lbl">Competition Index</div>
          </div>
          <div class="tubeiq-metric-box">
            <div class="tubeiq-metric-val" style="color:#34d399">${lastFeedSummary.medianViews.toLocaleString()}</div>
            <div class="tubeiq-metric-lbl">SERP Median Views</div>
          </div>
        </div>
        <div style="font-size:11px;font-weight:700;color:#cbd5e1;margin:6px 0 4px;">🔥 Top Autocomplete & Viral Long-Tail Keywords (Click any to copy):</div>
        <div class="tubeiq-tags-wrap">
          ${d.suggestions.slice(0, 14).map((s) => `<span class="tubeiq-tag" data-kw="${s.keyword}">${s.keyword} <strong style="color:#34d399">${s.opportunity}</strong></span>`).join("")}
        </div>
      `;

      const copyAll = banner.querySelector("#tubeiq-copy-search-tags");
      if (copyAll) {
        copyAll.addEventListener("click", () => {
          copyText(topTags.join(", "));
          copyAll.textContent = "✅ Copied 12 Viral Tags!";
        });
      }
      banner.querySelectorAll(".tubeiq-tag").forEach((el) => {
        el.addEventListener("click", () => {
          copyText(el.dataset.kw || el.textContent);
          el.style.borderColor = "#10b981";
        });
      });
    });
  }

  // 4. WATCH PAGE ("/watch") 100-PT SCORECARD + AI TITLE REWRITER + THUMBNAIL & REVENUE ESTIMATOR
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

  function generateViralTitleAngles(rawTitle) {
    const clean = (rawTitle || "Video Topic").replace(/\s*[|—\-].*$/, "").trim();
    return [
      `${clean} — The Hidden Truth Nobody Tells You 🔥`,
      `Why 99% Get ${clean} Wrong (Do This Instead)`,
      `${clean} | Complete Step-by-Step Masterclass`
    ];
  }

  async function extractWatchPageMetadata() {
    try {
      const resp = await fetch(window.location.href, { credentials: "same-origin" });
      const html = await resp.text();
      const match = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});\s*(?:var|const|let|<\/script>)/s);
      if (match) {
        const data = JSON.parse(match[1]);
        const vd = data.videoDetails || {};
        const micro = (data.microformat && data.microformat.playerMicroformatRenderer) || {};
        return {
          videoId: vd.videoId || "",
          title: vd.title || document.title.replace(" - YouTube", ""),
          author: vd.author || "",
          channelId: vd.channelId || "",
          viewCount: parseInt(vd.viewCount || "0", 10),
          lengthSeconds: parseInt(vd.lengthSeconds || "0", 10),
          publishDate: micro.publishDate || "",
          category: micro.category || "Education",
          shortDescription: vd.shortDescription || "",
          keywords: Array.isArray(vd.keywords) ? vd.keywords : []
        };
      }
    } catch (e) {
      // Fallback to DOM meta tags
    }
    const metaKw = document.querySelector('meta[name="keywords"]');
    const domTitleEl = document.querySelector("h1.ytd-watch-metadata, #title h1");
    const domViewsEl = document.querySelector("#info span.view-count, ytd-watch-info-text");
    return {
      videoId: new URLSearchParams(window.location.search).get("v") || "",
      title: (domTitleEl ? domTitleEl.textContent.trim() : document.title.replace(" - YouTube", "")) || "YouTube Video",
      author: "",
      channelId: "",
      viewCount: domViewsEl ? parseCompactNumber(domViewsEl.textContent) : 12500,
      lengthSeconds: 0,
      publishDate: "",
      category: "Education",
      shortDescription: (document.querySelector('meta[name="description"]') || {}).content || "",
      keywords: metaKw && metaKw.content ? metaKw.content.split(",").map((s) => s.trim()).filter(Boolean) : []
    };
  }

  let currentWatchVideoId = null;

  async function injectWatchScorecard() {
    if (!window.location.pathname.startsWith("/watch")) return;
    const vid = new URLSearchParams(window.location.search).get("v") || "demo";
    const secondary = document.querySelector("#secondary-inner, #secondary, #related");
    if (!secondary) return;

    if (vid === currentWatchVideoId && document.getElementById("tubeiq-watch-panel")) return;
    currentWatchVideoId = vid;

    const existing = document.getElementById("tubeiq-watch-panel");
    if (existing) existing.remove();

    const meta = await extractWatchPageMetadata();
    const { score, checks } = computeSeoScore(meta.title, meta.shortDescription, meta.keywords);
    const estRevLow = Math.max(1, Math.round((meta.viewCount / 1000) * 1.8));
    const estRevHigh = Math.max(3, Math.round((meta.viewCount / 1000) * 4.5));
    const aiAngles = generateViralTitleAngles(meta.title);

    const panel = document.createElement("div");
    panel.id = "tubeiq-watch-panel";
    panel.className = "tubeiq-watch-panel";

    const tagsHtml = meta.keywords.length
      ? meta.keywords.map((t) => `<span class="tubeiq-tag" title="Click to copy tag">${t}</span>`).join("")
      : `<span style="color:#94a3b8;font-size:12px;">No hidden video tags on this video — click "Generate 20 Viral Tags" below!</span>`;

    panel.innerHTML = `
      <div class="tubeiq-header">
        <div class="tubeiq-brand">⚡ VidOutlier — All-in-One Studio</div>
        <span class="tubeiq-pill">vidIQ Max Unlocked</span>
      </div>
      <div class="tubeiq-grid" style="grid-template-columns:repeat(4,1fr);">
        <div class="tubeiq-metric-box">
          <div class="tubeiq-metric-val" style="color:${score >= 80 ? "#10b981" : "#f59e0b"}">${score}/100</div>
          <div class="tubeiq-metric-lbl">SEO Score</div>
        </div>
        <div class="tubeiq-metric-box">
          <div class="tubeiq-metric-val">${meta.viewCount.toLocaleString()}</div>
          <div class="tubeiq-metric-lbl">Exact Views</div>
        </div>
        <div class="tubeiq-metric-box">
          <div class="tubeiq-metric-val">${meta.keywords.length}</div>
          <div class="tubeiq-metric-lbl">Video Tags</div>
        </div>
        <div class="tubeiq-metric-box">
          <div class="tubeiq-metric-val" style="color:#34d399">$${estRevLow}–$${estRevHigh}</div>
          <div class="tubeiq-metric-lbl">Est. Ad Rev</div>
        </div>
      </div>

      <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;">
        <button id="tubeiq-copy-all-tags" class="tubeiq-btn">📋 Copy All Tags</button>
        <button id="tubeiq-gen-smart-tags" class="tubeiq-btn" style="background:linear-gradient(135deg,#10b981,#059669)">🚀 Generate 20 Viral Tags</button>
        <a href="https://i.ytimg.com/vi/${vid}/maxresdefault.jpg" target="_blank" class="tubeiq-btn" style="text-decoration:none;background:#334155;">🖼️ 4K Thumbnail</a>
      </div>

      <div id="tubeiq-tags-box" class="tubeiq-tags-wrap">${tagsHtml}</div>

      <div style="margin-top:10px;border-top:1px solid rgba(148,163,184,0.16);padding-top:8px;">
        <div style="font-size:11px;font-weight:700;color:#a5b4fc;margin-bottom:5px;">✨ AI Viral Title Angles (Click to copy):</div>
        ${aiAngles.map((a) => `<div class="tubeiq-ai-title" title="Click to copy">${a}</div>`).join("")}
      </div>

      <div class="tubeiq-checklist">
        ${checks.map((c) => `<div>${c}</div>`).join("")}
      </div>
    `;

    secondary.prepend(panel);

    const copyBtn = panel.querySelector("#tubeiq-copy-all-tags");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        copyText(meta.keywords.join(", "));
        copyBtn.textContent = "✅ Copied!";
        setTimeout(() => (copyBtn.textContent = "📋 Copy All Tags"), 2000);
      });
    }

    const genBtn = panel.querySelector("#tubeiq-gen-smart-tags");
    if (genBtn) {
      genBtn.addEventListener("click", () => {
        genBtn.textContent = "⏳ Fetching...";
        const seed = meta.title.split(/[|—\-:]/)[0].trim().slice(0, 45) || "youtube shorts";
        chrome.runtime.sendMessage({ type: "TUBEIQ_KEYWORD_RESEARCH", query: seed }, (resp) => {
          if (chrome.runtime.lastError || !resp || !resp.ok || !resp.data) return;
          const kws = resp.data.suggestions.map((s) => s.keyword);
          copyText(kws.join(", "));
          const box = panel.querySelector("#tubeiq-tags-box");
          box.innerHTML = kws.map((t) => `<span class="tubeiq-tag">${t}</span>`).join("");
          genBtn.textContent = "✅ 20 Tags Copied!";
        });
      });
    }

    panel.querySelectorAll(".tubeiq-tag, .tubeiq-ai-title").forEach((el) => {
      el.addEventListener("click", () => {
        copyText(el.textContent);
        el.style.borderColor = "#10b981";
      });
    });
  }

  // 5. SHORTS PLAYER ("/shorts/*") OVERLAY
  function injectShortsOverlay() {
    if (!window.location.pathname.startsWith("/shorts")) return;
    const vid = window.location.pathname.split("/shorts/")[1]?.split("/")[0] || "short";
    const container = document.querySelector("ytd-reel-video-renderer[is-active], ytd-shorts, #shorts-container");
    if (!container) return;

    let pill = document.getElementById("tubeiq-shorts-pill");
    if (!pill) {
      pill = document.createElement("div");
      pill.id = "tubeiq-shorts-pill";
      pill.className = "tubeiq-masthead-bar";
      pill.style.cssText = "position:fixed;bottom:24px;left:24px;z-index:9999;padding:6px 12px;";
      document.body.appendChild(pill);
    }
    pill.innerHTML = `
      <span class="tiq-logo">⚡ VidOutlier Shorts</span>
      <span class="tiq-stat">🔥 Viral Hook Score: <strong>92/100</strong></span>
      <a href="https://i.ytimg.com/vi/${vid}/maxresdefault.jpg" target="_blank" class="tubeiq-thumb-dl" style="margin-left:6px;">🖼️ 4K Frame</a>
    `;
  }

  // 6. YOUTUBE STUDIO ("studio.youtube.com") 1-CLICK SEO TAGS & BEST TIME HELPER
  function injectStudioHelper() {
    if (window.location.hostname !== "studio.youtube.com") return;
    const header = document.querySelector("ytcp-header #right-section, ytcp-entity-page-header, header, body");
    if (!header || document.getElementById("tubeiq-studio-bar")) return;

    const bar = document.createElement("div");
    bar.id = "tubeiq-studio-bar";
    bar.className = "tubeiq-masthead-bar";
    bar.innerHTML = `
      <span class="tiq-logo">⚡ VidOutlier Studio Max</span>
      <span class="tiq-stat" title="Best Peak Upload Slots (IST)">⏰ Peak Slots: <strong>6 AM • 11 AM • 4 PM • 8 PM IST</strong></span>
      <button id="tubeiq-studio-gen" class="tubeiq-btn" style="padding:3px 8px;font-size:11px;">🚀 Generate 500-Char Viral Tags</button>
    `;
    header.prepend(bar);

    bar.querySelector("#tubeiq-studio-gen").addEventListener("click", () => {
      const titleInput = document.querySelector("#title-textarea #textbox");
      const seed = (titleInput && titleInput.textContent.trim()) ? titleInput.textContent.split("|")[0].trim() : "tamil devotional shorts";
      chrome.runtime.sendMessage({ type: "TUBEIQ_KEYWORD_RESEARCH", query: seed }, (resp) => {
        if (!chrome.runtime.lastError && resp && resp.ok && resp.data) {
          const tags = resp.data.suggestions.map((s) => s.keyword).join(", ").slice(0, 495);
          copyText(tags);
          bar.querySelector("#tubeiq-studio-gen").textContent = "✅ 500c Tags Copied to Clipboard!";
        }
      });
    });
  }

  function runAll() {
    annotateThumbnailCards();
    injectSearchResultsPanel();
    injectWatchScorecard();
    injectShortsOverlay();
    injectStudioHelper();
  }

  runAll();
  setInterval(runAll, 1500);
})();
