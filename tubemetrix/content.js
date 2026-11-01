/**
 * TubeMetrix v100.0.0 — Full-Featured Content Script for YouTube (2026 DOM) & YouTube Studio
 * Complete 8-Suite Parity + Beyond vs vidIQ Max + TubeBuddy Legend + 1of10:
 *  1. Universal 2026 Lockup & Classic Card Outlier + VPH + HD Thumbnail + Swipe-File Save Badges
 *  2. Interactive Top Masthead Bar + Clickable Feed Control Drawer (Sort Feed by Outlier/VPH/Views, Filter 2x+ Outliers, Export Page CSV, Open Command Center)
 *  3. Search Results Page ("/results") Full SERP Companion (Real Demand/Comp/Opp, Highest/Avg/Median Views, Avg Age, Title Match %, Top Creators, 4 Keyword Tabs: Related, Questions, Comparisons, Hidden Gems + CSV Export)
 *  4. Watch Page ("/watch") 5-Tab Complete Inspector:
 *      - Overview & 12-Point Optimization Audit (Actionable 0-50 + Performance 0-50 = 100, Engagement %, Likes, Subs, Views/Sub Ratio, Est. Revenue)
 *      - Tags & Live Search Rank Badges (#1-#20 rank check + Channel Tags + 1-Click 20 Viral Tag Generator)
 *      - Transcript & Auto-Chapter Generator (Pulls YouTube TimedText captions, clickable seek timestamps, 1-click Auto-Generate Chapters for Description)
 *      - AI Title, Hook & Description Studio (6 proven high-CTR title angles + SEO description template + Thumbnail Multi-Device Previewer Modal)
 *      - Channel & Competitor Card (Track channel as Competitor in 1 click)
 *  5. Watch Page Comment Insights & Filter Bar (Filter live comments by All, Questions ?, Positive, Negative/Critique, Long Stories, Creator Replies + 1-Click Canned Reply Templates)
 *  6. Channel Page ("/@.../videos") Inline Channel Audit & Sort Toolbar (Channel Health Score, Median Views, Avg VPH, Breakout Video, Sort Grid Inline by Outlier / VPH / Views, Export CSV, Track Competitor)
 *  7. Shorts Player ("/shorts/*") Real-Time Metadata, Outlier/Engagement Pill & 4K Frame Extractor
 *  8. YouTube Studio ("studio.youtube.com") Live Upload & Edit SEO Optimizer Dock (Live Title/Desc/Tag Actionable Score, 1-Click Direct Tag Injection into Studio Tag Input, Chapter Builder, Best Time to Post)
 */

(function () {
  "use strict";

  let feedSummary = {
    count: 0,
    medianViews: 0,
    avgViews: 0,
    highestViews: 0,
    avgVph: 0,
    outliers: 0,
    items: []
  };
  let mastheadDrawerOpen = false;

  // --- UNIVERSAL NUMBER & AGE PARSERS (Supports 2026 "8.6M", "2.2M", "3y ago", "4d ago" + Classic + Tamil) ---
  function parseCompactNumber(str) {
    if (!str) return 0;
    const clean = String(str).replace(/,/g, "").trim();
    // Ignore pure durations like "9:38:04" or "12:05"
    if (/^\d+:\d+(:\d+)?$/.test(clean)) return 0;
    // Ignore age strings like "3y ago" or "4 days ago"
    if (/\bago\b|முன்/i.test(clean) || /^\d+\s*(s|m|h|d|w|mo|y)\b/i.test(clean)) return 0;

    const match = clean.match(/^([\d.]+)\s*([KMBkmb]|கோடி|லட்சம்|ஆயிரம்)?(?:\s*(?:views?|subscribers?|subs?|காட்சிகள்)?)?$/i) ||
                  clean.match(/([\d.]+)\s*([KMBkmb]|கோடி|லட்சம்|ஆயிரம்)?\s*(?:views?|subscribers?|காட்சி)/i);
    if (!match) return 0;
    let val = parseFloat(match[1]);
    if (isNaN(val)) return 0;
    const unit = (match[2] || "").toUpperCase();
    if (unit === "K" || match[2] === "ஆயிரம்") val *= 1e3;
    else if (unit === "M") val *= 1e6;
    else if (unit === "B") val *= 1e9;
    else if (match[2] === "லட்சம்") val *= 1e5;
    else if (match[2] === "கோடி") val *= 1e7;
    return Math.round(val);
  }

  function isAgeText(str) {
    if (!str) return false;
    const s = str.trim().toLowerCase();
    if (/\bago\b|முன்/.test(s)) return true;
    if (/^(streamed\s+)?\d+\s*(s|sec|m|min|h|hr|d|w|wk|mo|y|yr|second|minute|hour|day|week|month|year)s?\s*ago/.test(s)) return true;
    return false;
  }

  function parseAgeHours(str) {
    if (!str) return 48;
    const s = String(str).toLowerCase().trim();
    const shortM = s.match(/(\d+)\s*(s|sec|m|min|h|hr|d|w|wk|mo|y|yr)\b/);
    if (shortM) {
      const n = parseInt(shortM[1], 10) || 1;
      const u = shortM[2];
      if (u === "s" || u === "sec") return 0.1;
      if (u === "m" || u === "min") return Math.max(0.2, n / 60);
      if (u === "h" || u === "hr") return n;
      if (u === "d") return n * 24;
      if (u === "w" || u === "wk") return n * 24 * 7;
      if (u === "mo") return n * 24 * 30;
      if (u === "y" || u === "yr") return n * 24 * 365;
    }
    const longM = s.match(/(\d+)\s*(second|minute|hour|day|week|month|year|மணி|நாள்|வாரம்|மாதம்|ஆண்டு)/);
    if (longM) {
      const n = parseInt(longM[1], 10) || 1;
      const u = longM[2];
      if (u.startsWith("second")) return 0.1;
      if (u.startsWith("minute")) return Math.max(0.2, n / 60);
      if (u.startsWith("hour") || u === "மணி") return n;
      if (u.startsWith("day") || u === "நாள்") return n * 24;
      if (u.startsWith("week") || u === "வாரம்") return n * 24 * 7;
      if (u.startsWith("month") || u === "மாதம்") return n * 24 * 30;
      if (u.startsWith("year") || u === "ஆண்டு") return n * 24 * 365;
    }
    return 48;
  }

  function formatCompact(n) {
    const num = Number(n) || 0;
    if (num >= 1e9) return (num / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
    return String(num);
  }

  function formatTimestamp(sec) {
    const s = Math.max(0, Math.floor(sec));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const r = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
    return `${m}:${String(r).padStart(2, "0")}`;
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

  function copyText(text, btnEl, copiedLabel = "✅ Copied!") {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    if (btnEl) {
      const orig = btnEl.dataset.origLabel || btnEl.textContent;
      btnEl.dataset.origLabel = orig;
      btnEl.textContent = copiedLabel;
      setTimeout(() => {
        btnEl.textContent = orig;
      }, 1800);
    }
  }

  function downloadCsv(filename, rows) {
    const csv = rows
      .map((r) => r.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  async function saveToSwipeFile(item) {
    return new Promise((resolve) => {
      chrome.storage.local.get({ tmSwipeFile: [] }, (res) => {
        const list = Array.isArray(res.tmSwipeFile) ? res.tmSwipeFile : [];
        if (!list.some((x) => x.videoId === item.videoId)) {
          list.unshift({ ...item, savedAt: new Date().toISOString() });
        }
        chrome.storage.local.set({ tmSwipeFile: list.slice(0, 200) }, () => resolve(list.length));
      });
    });
  }

  async function trackCompetitorChannel(channelHandleOrUrl, channelName) {
    return new Promise((resolve) => {
      chrome.storage.local.get({ tmCompetitors: [] }, (res) => {
        const list = Array.isArray(res.tmCompetitors) ? res.tmCompetitors : [];
        const norm = (channelHandleOrUrl || "").trim();
        if (norm && !list.some((c) => c.handle === norm)) {
          list.push({ handle: norm, name: channelName || norm, addedAt: new Date().toISOString() });
        }
        chrome.storage.local.set({ tmCompetitors: list }, () => resolve(list.length));
      });
    });
  }

  // --- 1. PARSE ALL VIDEO CARDS ON CURRENT PAGE (2026 Lockup + Classic Renderers) ---
  function extractCardData(card) {
    const metaEls = Array.from(
      card.querySelectorAll(
        "#metadata-line span, .inline-metadata-item, .ytContentMetadataViewModelMetadataText, .yt-content-metadata-view-model-wiz__metadata-text, .shortsLockupViewModelHostOutsideMetadataSubhead span"
      )
    );

    let views = 0;
    let hours = 48;
    for (const el of metaEls) {
      const txt = (el.textContent || "").trim();
      if (!txt) continue;
      if (isAgeText(txt)) {
        hours = parseAgeHours(txt);
      } else if (views === 0) {
        const parsedV = parseCompactNumber(txt);
        if (parsedV > 0) views = parsedV;
      }
    }

    const linkEl = card.querySelector(
      "a#thumbnail, a.yt-lockup-view-model-wiz__content-image, a.ytLockupViewModelContentImage, a.shortsLockupViewModelHostEndpoint, a[href*='/watch?v='], a[href*='/shorts/']"
    );
    const href = linkEl ? linkEl.getAttribute("href") : "";
    const videoId = extractVideoIdFromHref(href);

    const titleEl = card.querySelector(
      "#video-title, h3 a, .yt-lockup-metadata-view-model-wiz__title, .ytLockupMetadataViewModelTitle, a[title]"
    );
    const title = titleEl ? (titleEl.getAttribute("title") || titleEl.textContent || "").trim() : "YouTube Video";

    const chanEl = card.querySelector("ytd-channel-name a, a[href^='/@']");
    const channel = chanEl ? chanEl.textContent.trim() : "";

    return { card, videoId, title, channel, views, hours, href };
  }

  function annotateAllVideoCards() {
    const cards = Array.from(
      document.querySelectorAll(
        "ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer, ytm-shorts-lockup-view-model, ytd-reel-item-renderer"
      )
    );
    if (!cards.length) {
      injectMastheadBar();
      return;
    }

    const parsedCards = cards.map(extractCardData).filter((c) => c.views > 0);
    if (!parsedCards.length) {
      injectMastheadBar();
      return;
    }

    const sortedViews = parsedCards.map((c) => c.views).sort((a, b) => a - b);
    const medianViews = sortedViews[Math.floor(sortedViews.length / 2)] || 1000;
    const highestViews = sortedViews[sortedViews.length - 1] || 0;
    const avgViews = Math.round(sortedViews.reduce((a, b) => a + b, 0) / sortedViews.length);

    let totalVph = 0;
    let outlierCount = 0;

    for (const item of parsedCards) {
      const mult = +(item.views / Math.max(1, medianViews)).toFixed(1);
      const vph = Math.max(1, Math.round(item.views / Math.max(1, item.hours)));
      item.outlier = mult;
      item.vph = vph;
      totalVph += vph;
      if (mult >= 2.5) outlierCount++;

      // Store metrics on DOM node so Feed/Channel Sort & Filter work instantaneously
      item.card.dataset.tmViews = String(item.views);
      item.card.dataset.tmVph = String(vph);
      item.card.dataset.tmOutlier = String(mult);

      const existingBadge = item.card.querySelector(".tm-thumb-badge");
      if (existingBadge && item.card.dataset.tmVid === (item.videoId || "")) continue;
      if (existingBadge) existingBadge.remove();

      const thumbContainer =
        item.card.querySelector(
          "ytd-thumbnail, yt-thumbnail-view-model, .yt-lockup-view-model-wiz__content-image, .shortsLockupViewModelHostThumbnailContainer"
        ) || item.card;

      const badge = document.createElement("div");
      badge.className = "tm-thumb-badge";
      if (mult >= 3.0) badge.classList.add("tm-mega-outlier");
      else if (mult >= 1.6) badge.classList.add("tm-strong-outlier");

      const icon = mult >= 3.0 ? "🔥" : mult >= 1.6 ? "⚡" : "📊";
      const labelSpan = document.createElement("span");
      labelSpan.textContent = `${icon} ${mult}x • ${formatCompact(vph)} VPH`;
      badge.appendChild(labelSpan);

      if (item.videoId) {
        const hdLink = document.createElement("a");
        hdLink.className = "tm-mini-action";
        hdLink.href = `https://i.ytimg.com/vi/${item.videoId}/maxresdefault.jpg`;
        hdLink.target = "_blank";
        hdLink.title = "Open 4K/HD Thumbnail";
        hdLink.textContent = "HD";
        hdLink.addEventListener("click", (e) => e.stopPropagation());
        badge.appendChild(hdLink);

        const saveBtn = document.createElement("button");
        saveBtn.className = "tm-mini-action";
        saveBtn.title = "Save Thumbnail & Title to TubeMetrix Swipe File";
        saveBtn.textContent = "★";
        saveBtn.addEventListener("click", async (e) => {
          e.preventDefault();
          e.stopPropagation();
          await saveToSwipeFile({
            videoId: item.videoId,
            title: item.title,
            channel: item.channel,
            views: item.views,
            vph,
            outlier: mult,
            thumb: `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`
          });
          saveBtn.textContent = "✓";
          saveBtn.style.background = "#10b981";
        });
        badge.appendChild(saveBtn);
      }

      const pos = window.getComputedStyle(thumbContainer).position;
      if (pos === "static") thumbContainer.style.position = "relative";
      thumbContainer.appendChild(badge);
      item.card.dataset.tmVid = item.videoId || "1";
    }

    feedSummary = {
      count: parsedCards.length,
      medianViews,
      avgViews,
      highestViews,
      avgVph: Math.round(totalVph / Math.max(1, parsedCards.length)),
      outliers: outlierCount,
      items: parsedCards
    };
    injectMastheadBar();
  }

  // --- 2. INTERACTIVE TOP MASTHEAD BAR + FEED COMMAND DRAWER ---
  function sortVisibleFeed(byKey) {
    const cards = Array.from(
      document.querySelectorAll("ytd-rich-item-renderer[data-tm-views], ytd-video-renderer[data-tm-views]")
    );
    if (cards.length < 2) return;
    const parent = cards[0].parentElement;
    if (!parent) return;
    const sorted = [...cards].sort((a, b) => {
      const va = parseFloat(a.dataset[byKey] || "0");
      const vb = parseFloat(b.dataset[byKey] || "0");
      return vb - va;
    });
    for (const el of sorted) parent.appendChild(el);
  }

  function filterOutliersOnly(minOutlier) {
    const cards = Array.from(
      document.querySelectorAll("ytd-rich-item-renderer[data-tm-views], ytd-video-renderer[data-tm-views]")
    );
    for (const el of cards) {
      const mult = parseFloat(el.dataset.tmOutlier || "0");
      el.style.display = mult >= minOutlier ? "" : "none";
    }
  }

  function exportCurrentFeedCsv() {
    const rows = [["Video ID", "Title", "Channel", "Views", "VPH", "Outlier Multiplier", "URL"]];
    for (const it of feedSummary.items) {
      rows.push([
        it.videoId || "",
        it.title,
        it.channel,
        it.views,
        it.vph,
        `${it.outlier}x`,
        it.videoId ? `https://www.youtube.com/watch?v=${it.videoId}` : ""
      ]);
    }
    downloadCsv(`tubemetrix-feed-${Date.now()}.csv`, rows);
  }

  function toggleMastheadDrawer() {
    const existing = document.getElementById("tm-masthead-drawer");
    if (existing) {
      existing.remove();
      mastheadDrawerOpen = false;
      return;
    }
    mastheadDrawerOpen = true;
    const drawer = document.createElement("div");
    drawer.id = "tm-masthead-drawer";
    drawer.className = "tm-masthead-drawer";
    drawer.innerHTML = `
      <div class="tm-card-header">
        <div class="tm-brand">⚡ TubeMetrix Live Feed Radar</div>
        <button id="tm-close-drawer" class="tm-btn tm-btn-secondary" style="padding:3px 8px;">✕</button>
      </div>
      <div class="tm-grid-4">
        <div class="tm-metric"><div class="tm-metric-val">${feedSummary.count}</div><div class="tm-metric-lbl">Videos</div></div>
        <div class="tm-metric"><div class="tm-metric-val">${formatCompact(feedSummary.medianViews)}</div><div class="tm-metric-lbl">Median</div></div>
        <div class="tm-metric"><div class="tm-metric-val" style="color:#38bdf8">${formatCompact(feedSummary.avgVph)}</div><div class="tm-metric-lbl">Avg VPH</div></div>
        <div class="tm-metric"><div class="tm-metric-val" style="color:#fb7185">${feedSummary.outliers}</div><div class="tm-metric-lbl">2.5x+ Hits</div></div>
      </div>
      <div style="font-size:11px;font-weight:800;color:#94a3b8;margin-top:6px;">Re-Sort & Filter Current Page Videos (1of10 + vidIQ Max):</div>
      <div class="tm-drawer-row">
        <button class="tm-btn" data-sort="tmOutlier">🔥 Sort by Outlier</button>
        <button class="tm-btn" data-sort="tmVph">🚀 Sort by VPH</button>
        <button class="tm-btn" data-sort="tmViews">📊 Sort by Views</button>
        <button class="tm-btn tm-btn-amber" id="tm-filter-2x">⚡ Only 2x+ Outliers</button>
        <button class="tm-btn tm-btn-secondary" id="tm-filter-reset">↺ Show All</button>
      </div>
      <div class="tm-drawer-row" style="margin-top:10px;padding-top:10px;border-top:1px solid #1e293b;">
        <button class="tm-btn tm-btn-emerald" id="tm-export-csv">📥 Export Page CSV (${feedSummary.count})</button>
        <button class="tm-btn tm-btn-secondary" id="tm-open-suite">🎛️ Open Full Command Center</button>
      </div>
    `;
    document.body.appendChild(drawer);

    drawer.querySelector("#tm-close-drawer").onclick = () => {
      drawer.remove();
      mastheadDrawerOpen = false;
    };
    drawer.querySelectorAll("[data-sort]").forEach((btn) => {
      btn.onclick = () => sortVisibleFeed(btn.dataset.sort);
    });
    drawer.querySelector("#tm-filter-2x").onclick = () => filterOutliersOnly(2.0);
    drawer.querySelector("#tm-filter-reset").onclick = () => filterOutliersOnly(0);
    drawer.querySelector("#tm-export-csv").onclick = () => exportCurrentFeedCsv();
    drawer.querySelector("#tm-open-suite").onclick = () => {
      chrome.runtime.sendMessage({ type: "TM_OPEN_DASHBOARD" });
    };
  }

  function injectMastheadBar() {
    if (window.location.hostname === "studio.youtube.com") return;
    const endButtons = document.querySelector("ytd-masthead #end, #masthead #end");
    if (!endButtons) return;

    let bar = document.getElementById("tubeiq-masthead-bar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "tubeiq-masthead-bar";
      bar.className = "tm-masthead-bar";
      bar.title = "Click to open TubeMetrix Feed Sorter, Outlier Filter, CSV Exporter & Command Center";
      bar.addEventListener("click", toggleMastheadDrawer);
      endButtons.prepend(bar);
    }
    bar.innerHTML = `
      <span class="tm-logo">⚡ TubeMetrix</span>
      <span class="tm-stat">Med: <strong>${formatCompact(feedSummary.medianViews)}</strong></span>
      <span class="tm-stat">VPH: <strong>${formatCompact(feedSummary.avgVph)}</strong></span>
      <span class="tm-stat tm-hot">🔥 Outliers: <strong>${feedSummary.outliers}</strong></span>
      <span style="font-size:10px;color:#94a3b8;">▾</span>
    `;
  }

  // --- 3. SEARCH RESULTS PAGE ("/results") FULL SERP COMPANION ---
  let activeSearchQuery = null;
  function injectSearchCompanion() {
    if (!window.location.pathname.startsWith("/results")) return;
    const q = new URLSearchParams(window.location.search).get("search_query") || "";
    if (!q) return;

    const targetContainer =
      document.querySelector("ytd-two-column-search-results-renderer #secondary-inner") ||
      document.querySelector("ytd-two-column-search-results-renderer #primary ytd-section-list-renderer") ||
      document.querySelector("#results");
    if (!targetContainer) return;

    if (q === activeSearchQuery && document.getElementById("tm-search-companion")) return;
    activeSearchQuery = q;

    const old = document.getElementById("tm-search-companion");
    if (old) old.remove();

    const card = document.createElement("div");
    card.id = "tm-search-companion";
    card.className = "tm-card";
    card.innerHTML = `<div style="color:#94a3b8;">⚡ <strong>TubeMetrix Search Intelligence:</strong> Analyzing real SERP views, VPH, title saturation & hidden gems for "<strong>${q}</strong>"...</div>`;
    targetContainer.prepend(card);

    chrome.runtime.sendMessage({ type: "TM_KEYWORD_RESEARCH", query: q }, (resp) => {
      if (chrome.runtime.lastError || !resp || !resp.ok || !resp.data) return;
      const d = resp.data;
      const st = d.serpStats || {};
      const oppColor = d.overallScore >= 68 ? "#10b981" : d.overallScore >= 48 ? "#f59e0b" : "#ef4444";

      let currentTab = "suggestions";
      const renderTabList = (tabKey) => {
        const list = d[tabKey] && d[tabKey].length ? d[tabKey] : d.suggestions;
        if (!list || !list.length) return `<div style="color:#94a3b8;padding:8px;">No keywords found for this filter.</div>`;
        return `
          <table style="width:100%;border-collapse:collapse;font-size:11px;">
            <thead>
              <tr style="color:#94a3b8;text-align:left;border-bottom:1px solid #1e293b;">
                <th style="padding:5px;">Keyword (Click to Copy)</th>
                <th style="padding:5px;">Est. Vol</th>
                <th style="padding:5px;">Comp</th>
                <th style="padding:5px;">Score</th>
              </tr>
            </thead>
            <tbody>
              ${list
                .slice(0, 14)
                .map(
                  (row) => `
                <tr class="tm-kw-tr" data-kw="${row.keyword.replace(/"/g, "&quot;")}" style="border-bottom:1px solid rgba(30,41,59,0.6);cursor:pointer;">
                  <td style="padding:5px;font-weight:600;color:#e2e8f0;">${row.keyword}</td>
                  <td style="padding:5px;color:#38bdf8;">${formatCompact(row.estMonthlySearches)}</td>
                  <td style="padding:5px;color:#f59e0b;">${row.competition}</td>
                  <td style="padding:5px;font-weight:800;color:#10b981;">${row.opportunity}</td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
        `;
      };

      const renderCard = () => {
        const activeList = (d[currentTab] && d[currentTab].length ? d[currentTab] : d.suggestions).slice(0, 15);
        card.innerHTML = `
          <div class="tm-card-header">
            <div class="tm-brand">⚡ TubeMetrix Search Companion</div>
            <span class="tm-badge-pill">Real SERP Engine</span>
          </div>

          <div class="tm-grid-3">
            <div class="tm-metric">
              <div class="tm-metric-val" style="color:${oppColor}">${d.overallScore}/100</div>
              <div class="tm-metric-lbl">Overall Score</div>
            </div>
            <div class="tm-metric">
              <div class="tm-metric-val" style="color:#38bdf8">${d.avgDemand}/100</div>
              <div class="tm-metric-lbl">Real Demand</div>
            </div>
            <div class="tm-metric">
              <div class="tm-metric-val" style="color:#f59e0b">${d.avgCompetition}/100</div>
              <div class="tm-metric-lbl">Competition</div>
            </div>
          </div>

          <div class="tm-grid-4">
            <div class="tm-metric"><div class="tm-metric-val">${formatCompact(st.highestViews || feedSummary.highestViews)}</div><div class="tm-metric-lbl">Top Views</div></div>
            <div class="tm-metric"><div class="tm-metric-val">${formatCompact(st.avgViews || feedSummary.avgViews)}</div><div class="tm-metric-lbl">Avg Views</div></div>
            <div class="tm-metric"><div class="tm-metric-val">${st.titleMatchPct ?? 50}%</div><div class="tm-metric-lbl">In Title</div></div>
            <div class="tm-metric"><div class="tm-metric-val">${st.recent7dCount ?? 0}</div><div class="tm-metric-lbl">Last 7 Days</div></div>
          </div>

          ${
            st.topChannels && st.topChannels.length
              ? `<div style="font-size:11px;color:#94a3b8;margin-bottom:8px;">🏆 <strong>Top Ranking Channels:</strong> ${st.topChannels
                  .map((c) => `<span style="color:#e2e8f0">${c.name} (${c.count})</span>`)
                  .join(" · ")}</div>`
              : ""
          }

          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
            <button class="tm-btn" id="tm-serp-sort-outlier">🔥 Sort SERP by Outlier</button>
            <button class="tm-btn tm-btn-emerald" id="tm-serp-copy-tags">📋 Copy ${activeList.length} Tags</button>
            <button class="tm-btn tm-btn-secondary" id="tm-serp-csv">📥 CSV</button>
          </div>

          <div class="tm-tabs">
            <button class="tm-tab-btn ${currentTab === "suggestions" ? "active" : ""}" data-tab="suggestions">Related (${d.suggestions.length})</button>
            <button class="tm-tab-btn ${currentTab === "hiddenGems" ? "active" : ""}" data-tab="hiddenGems">💎 Gems (${d.hiddenGems.length})</button>
            <button class="tm-tab-btn ${currentTab === "questions" ? "active" : ""}" data-tab="questions">❓ Questions (${d.questions.length})</button>
            <button class="tm-tab-btn ${currentTab === "comparisons" ? "active" : ""}" data-tab="comparisons">⚖️ Vs (${d.comparisons.length})</button>
          </div>

          <div class="tm-scroll-box" style="max-height:240px;padding:4px;">
            ${renderTabList(currentTab)}
          </div>
        `;

        card.querySelectorAll(".tm-tab-btn").forEach((b) => {
          b.onclick = () => {
            currentTab = b.dataset.tab;
            renderCard();
          };
        });
        card.querySelector("#tm-serp-sort-outlier").onclick = () => sortVisibleFeed("tmOutlier");
        card.querySelector("#tm-serp-copy-tags").onclick = (e) => {
          copyText(activeList.map((x) => x.keyword).join(", "), e.currentTarget);
        };
        card.querySelector("#tm-serp-csv").onclick = () => {
          const rows = [["Keyword", "Category", "Est Monthly Searches", "Demand", "Competition", "Opportunity"]];
          for (const r of activeList) {
            rows.push([r.keyword, r.category, r.estMonthlySearches, r.demand, r.competition, r.opportunity]);
          }
          downloadCsv(`tubemetrix-keywords-${q.replace(/\s+/g, "-")}.csv`, rows);
        };
        card.querySelectorAll(".tm-kw-tr").forEach((tr) => {
          tr.onclick = () => {
            copyText(tr.dataset.kw);
            tr.style.background = "rgba(16,185,129,0.22)";
          };
        });
      };

      renderCard();
    });
  }

  // --- 4. WATCH PAGE ("/watch") COMPLETE 5-TAB INSPECTOR + THUMBNAIL PREVIEWER MODAL ---
  async function extractRichWatchData() {
    const vid = new URLSearchParams(window.location.search).get("v") || "";
    let meta = {
      videoId: vid,
      title: document.title.replace(" - YouTube", ""),
      author: "",
      channelId: "",
      channelHandle: "",
      viewCount: 0,
      likeCount: 0,
      subscriberCount: 0,
      subscribersText: "",
      lengthSeconds: 0,
      publishDate: "",
      category: "",
      isFamilySafe: true,
      hasManualCaptions: false,
      captionTracks: [],
      channelKeywords: [],
      shortDescription: "",
      keywords: []
    };

    try {
      const resp = await fetch(window.location.href, { credentials: "same-origin" });
      const html = await resp.text();

      const prMatch = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});\s*(?:var|const|let|<\/script>)/s);
      if (prMatch) {
        const pr = JSON.parse(prMatch[1]);
        const vd = pr.videoDetails || {};
        const micro = (pr.microformat && pr.microformat.playerMicroformatRenderer) || {};
        const tracks =
          (pr.captions &&
            pr.captions.playerCaptionsTracklistRenderer &&
            pr.captions.playerCaptionsTracklistRenderer.captionTracks) ||
          [];

        meta.videoId = vd.videoId || vid;
        meta.title = vd.title || meta.title;
        meta.author = vd.author || "";
        meta.channelId = vd.channelId || "";
        meta.viewCount = parseInt(vd.viewCount || "0", 10) || 0;
        meta.lengthSeconds = parseInt(vd.lengthSeconds || "0", 10) || 0;
        meta.publishDate = micro.publishDate || micro.uploadDate || "";
        meta.category = micro.category || "Video";
        meta.isFamilySafe = micro.isFamilySafe !== false;
        meta.shortDescription = vd.shortDescription || "";
        meta.keywords = Array.isArray(vd.keywords) ? vd.keywords : [];
        meta.captionTracks = tracks;
        meta.hasManualCaptions = tracks.some((t) => t.kind !== "asr");
        if (micro.ownerProfileUrl) {
          const hm = micro.ownerProfileUrl.match(/\/(@[^/]+)$/);
          if (hm) meta.channelHandle = hm[1];
        }
      }

      // Extract Like Count & Channel Keywords from HTML
      const likeAriaMatch = html.match(/"label":"([\d,]+)\s+likes"/i) || html.match(/along with ([\d,]+) other people/i);
      if (likeAriaMatch) {
        meta.likeCount = parseInt(likeAriaMatch[1].replace(/,/g, ""), 10) || 0;
      }
      const chanKwMatch = html.match(/"channelMetadataRenderer":\{[^}]*"keywords":"([^"]+)"/);
      if (chanKwMatch && chanKwMatch[1]) {
        meta.channelKeywords = chanKwMatch[1]
          .split(/\s+|,/)
          .map((s) => s.replace(/"/g, "").trim())
          .filter((s) => s.length > 2)
          .slice(0, 20);
      }
    } catch (e) {}

    // Live DOM fallbacks for likes & subscribers
    if (!meta.likeCount) {
      const likeBtn = document.querySelector("like-button-view-model button, segmented-like-dislike-button-renderer button");
      const aria = likeBtn ? likeBtn.getAttribute("aria-label") || likeBtn.textContent || "" : "";
      const m = aria.match(/([\d,.]+\s*[KMB]?)/i);
      if (m) meta.likeCount = parseCompactNumber(m[1]);
    }
    const subEl = document.querySelector("#owner-sub-count");
    if (subEl) {
      meta.subscribersText = subEl.textContent.trim();
      meta.subscriberCount = parseCompactNumber(meta.subscribersText);
    }
    if (!meta.channelHandle) {
      const ownerLink = document.querySelector("#owner a[href^='/@']");
      if (ownerLink) meta.channelHandle = ownerLink.getAttribute("href").replace(/^\//, "");
    }

    return meta;
  }

  function evaluate12PointChecklist(meta, rankedTagCount) {
    const desc = meta.shortDescription || "";
    const tags = meta.keywords || [];
    const totalTagChars = tags.join(", ").length;
    const hasTimestamps = /\b\d{1,2}:\d{2}\b/.test(desc);
    const hasLinks = /https?:\/\//.test(desc);
    const hasHashtags = /#\w+/.test(desc);
    const firstKw = (tags[0] || meta.title.split(/\s+/)[0] || "").toLowerCase();
    const kwInFirst200 = firstKw ? desc.slice(0, 220).toLowerCase().includes(firstKw) : false;

    const items = [
      { ok: meta.title.length >= 40 && meta.title.length <= 75, label: `Title length (${meta.title.length}/70)` },
      { ok: desc.length >= 300, label: `Description 300+ chars (${desc.length})` },
      { ok: tags.length >= 10, label: `10+ Video tags (${tags.length})` },
      { ok: totalTagChars >= 200, label: `Tag char volume (${totalTagChars}/500)` },
      { ok: kwInFirst200, label: "Target keyword in first 200c" },
      { ok: hasTimestamps, label: "Video chapters (0:00 timestamps)" },
      { ok: meta.captionTracks.length > 0, label: meta.hasManualCaptions ? "Manual CC captions" : `Captions (${meta.captionTracks.length})` },
      { ok: hasLinks, label: "External / Playlist links" },
      { ok: hasHashtags, label: "Topic #hashtags in desc" },
      { ok: /[|—\-:?!]/.test(meta.title), label: "CTR hook punctuation in title" },
      { ok: meta.lengthSeconds >= 480 || meta.lengthSeconds <= 65, label: meta.lengthSeconds >= 480 ? "Mid-roll ad eligible (8m+)" : "Shorts / Tight pacing" },
      { ok: rankedTagCount > 0, label: `Ranked top-20 tags (${rankedTagCount})` }
    ];

    const actionable = Math.round((items.slice(0, 10).filter((i) => i.ok).length / 10) * 50);
    const engRatio = meta.viewCount > 0 ? meta.likeCount / meta.viewCount : 0;
    const perfRaw = Math.min(50, Math.round(engRatio * 750) + (rankedTagCount * 5) + (meta.viewCount > 10000 ? 12 : 5));
    const performance = Math.max(8, Math.min(50, perfRaw));

    return {
      actionable,
      performance,
      total: actionable + performance,
      items
    };
  }

  async function fetchTranscriptSegments(videoId, captionTracks) {
    // 1. Direct same-origin YouTube IOS InnerTube call right from the youtube.com content script!
    try {
      const r = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
        method: "POST",
        credentials: "omit",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: { client: { clientName: "IOS", clientVersion: "20.10.4", hl: "en", gl: "US" } },
          videoId
        })
      });
      const j = await r.json();
      const tracks =
        (j.captions && j.captions.playerCaptionsTracklistRenderer && j.captions.playerCaptionsTracklistRenderer.captionTracks) || [];
      if (tracks.length) {
        const track = tracks.find((t) => t.languageCode === "en") || tracks[0];
        const xr = await fetch(track.baseUrl, { credentials: "omit" });
        const xml = await xr.text();
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        const segs = Array.from(doc.querySelectorAll("text"))
          .map((node) => ({
            startSec: Math.floor(parseFloat(node.getAttribute("start") || "0")),
            text: (node.textContent || "").replace(/\s+/g, " ").trim()
          }))
          .filter((s) => s.text);
        if (segs.length > 0) return segs;
      }
    } catch (e) {}

    // 2. Fallback via background service worker
    const fromBg = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "TM_FETCH_TRANSCRIPT", videoId }, (resp) => {
        if (!chrome.runtime.lastError && resp && resp.ok && Array.isArray(resp.segments) && resp.segments.length > 0) {
          resolve(resp.segments);
        } else {
          resolve(null);
        }
      });
    });
    if (fromBg) return fromBg;
    return [];
  }

  function buildAutoChaptersFromTranscript(segments, totalSec) {
    if (!segments.length) return [];
    const targetChapters = Math.min(8, Math.max(4, Math.floor((totalSec || 300) / 90)));
    const step = Math.max(1, Math.floor(segments.length / targetChapters));
    const stopWords = new Set(["the", "and", "that", "this", "with", "from", "your", "have", "for", "are", "was", "you", "going", "about", "what", "when", "where", "into", "just", "like", "they", "them", "then"]);

    const chapters = [];
    for (let i = 0; i < segments.length; i += step) {
      const chunk = segments.slice(i, i + step);
      const startSec = i === 0 ? 0 : chunk[0].startSec;
      const freq = {};
      for (const seg of chunk) {
        const words = seg.text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/);
        for (const w of words) {
          if (w.length >= 4 && !stopWords.has(w)) freq[w] = (freq[w] || 0) + 1;
        }
      }
      const topWords = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([w]) => w.charAt(0).toUpperCase() + w.slice(1));
      const label = i === 0 ? `Introduction — ${topWords.slice(0, 2).join(" ") || "Overview"}` : topWords.join(" & ") || `Key Section ${chapters.length + 1}`;
      chapters.push(`${formatTimestamp(startSec)} ${label}`);
      if (chapters.length >= 9) break;
    }
    return chapters;
  }

  function openThumbnailPreviewModal(meta) {
    const existing = document.getElementById("tm-thumb-modal");
    if (existing) existing.remove();

    const thumbUrl = `https://i.ytimg.com/vi/${meta.videoId}/maxresdefault.jpg`;
    const rivalSamples = feedSummary.items.slice(0, 3);

    const backdrop = document.createElement("div");
    backdrop.id = "tm-thumb-modal";
    backdrop.className = "tm-modal-backdrop";
    backdrop.innerHTML = `
      <div class="tm-modal">
        <div class="tm-card-header">
          <div class="tm-brand">🖼️ TubeMetrix Thumbnail & Title SERP Simulator (Desktop / Mobile / Dark / Light)</div>
          <button id="tm-close-modal" class="tm-btn tm-btn-secondary">✕ Close</button>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:14px;">
          <input id="tm-sim-title" class="tm-input" style="flex:1;" value="${meta.title.replace(/"/g, "&quot;")}" placeholder="Test custom A/B title here..." />
          <input id="tm-sim-thumb" class="tm-input" style="width:280px;" value="${thumbUrl}" placeholder="Custom Thumbnail Image URL..." />
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
          <div style="background:#0f0f0f;padding:12px;border-radius:12px;border:1px solid #27272a;">
            <div style="font-size:11px;color:#94a3b8;margin-bottom:8px;font-weight:700;">🌙 YouTube Dark Mode Home Card</div>
            <img class="tm-sim-img" src="${thumbUrl}" style="width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:10px;" />
            <div class="tm-sim-t" style="color:#f1f1f1;font-size:14px;font-weight:700;margin-top:8px;">${meta.title}</div>
            <div style="color:#aaa;font-size:12px;margin-top:3px;">${meta.author || "Your Channel"} • 48K views • 3 hours ago</div>
          </div>
          <div style="background:#ffffff;padding:12px;border-radius:12px;border:1px solid #cbd5e1;">
            <div style="font-size:11px;color:#475569;margin-bottom:8px;font-weight:700;">☀️ YouTube Light Mode Mobile Feed</div>
            <div style="display:flex;gap:10px;align-items:flex-start;">
              <img class="tm-sim-img" src="${thumbUrl}" style="width:168px;aspect-ratio:16/9;object-fit:cover;border-radius:8px;" />
              <div>
                <div class="tm-sim-t" style="color:#0f0f0f;font-size:13px;font-weight:700;line-height:1.35;">${meta.title}</div>
                <div style="color:#606060;font-size:11px;margin-top:4px;">${meta.author || "Your Channel"} • 48K views</div>
              </div>
            </div>
          </div>
        </div>
        ${
          rivalSamples.length
            ? `<div style="margin-top:16px;">
                <div style="font-size:12px;font-weight:800;color:#cbd5e1;margin-bottom:8px;">⚔️ Side-by-Side Shelf Standout Check vs Current Sidebar Videos:</div>
                <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">
                  <div style="border:2px solid #10b981;border-radius:10px;padding:6px;background:#090d16;">
                    <img class="tm-sim-img" src="${thumbUrl}" style="width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:6px;" />
                    <div class="tm-sim-t" style="font-size:11px;font-weight:700;margin-top:5px;color:#34d399;">[TEST] ${meta.title}</div>
                  </div>
                  ${rivalSamples
                    .map(
                      (r) => `
                    <div style="border:1px solid #1e293b;border-radius:10px;padding:6px;background:#090d16;">
                      <img src="https://i.ytimg.com/vi/${r.videoId}/mqdefault.jpg" style="width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:6px;" />
                      <div style="font-size:11px;margin-top:5px;color:#cbd5e1;">${r.title.slice(0, 58)}</div>
                    </div>`
                    )
                    .join("")}
                </div>
              </div>`
            : ""
        }
      </div>
    `;
    document.body.appendChild(backdrop);

    backdrop.querySelector("#tm-close-modal").onclick = () => backdrop.remove();
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) backdrop.remove();
    });
    const tIn = backdrop.querySelector("#tm-sim-title");
    const iIn = backdrop.querySelector("#tm-sim-thumb");
    tIn.addEventListener("input", () => {
      backdrop.querySelectorAll(".tm-sim-t").forEach((el) => (el.textContent = tIn.value));
    });
    iIn.addEventListener("input", () => {
      backdrop.querySelectorAll(".tm-sim-img").forEach((el) => (el.src = iIn.value));
    });
  }

  let currentWatchVid = null;
  async function injectWatchInspector() {
    if (!window.location.pathname.startsWith("/watch")) return;
    const vid = new URLSearchParams(window.location.search).get("v") || "";
    if (!vid) return;

    const secondary = document.querySelector("#secondary-inner, #secondary");
    if (!secondary) return;

    if (vid === currentWatchVid && document.getElementById("tubeiq-watch-panel")) return;
    currentWatchVid = vid;

    const old = document.getElementById("tubeiq-watch-panel");
    if (old) old.remove();

    const panel = document.createElement("div");
    panel.id = "tubeiq-watch-panel";
    panel.className = "tm-card";
    panel.innerHTML = `<div style="color:#94a3b8;">⚡ <strong>TubeMetrix Inspector:</strong> Auditing video metadata, tags, search ranks & captions...</div>`;
    secondary.prepend(panel);

    const meta = await extractRichWatchData();
    const pubAgeHours = meta.publishDate ? Math.max(1, (Date.now() - new Date(meta.publishDate).getTime()) / 3600000) : 48;
    const liveVph = Math.max(1, Math.round(meta.viewCount / pubAgeHours));
    const engRate = meta.viewCount > 0 ? +((meta.likeCount / meta.viewCount) * 100).toFixed(2) : 0;
    const viewSubRatio = meta.subscriberCount > 0 ? +((meta.viewCount / meta.subscriberCount) * 100).toFixed(1) : 0;
    const estRevLow = Math.max(1, Math.round((meta.viewCount / 1000) * 1.8));
    const estRevHigh = Math.max(3, Math.round((meta.viewCount / 1000) * 4.8));

    let tagRanks = {};
    let transcriptSegs = null;
    let activeTab = "overview";

    const renderWatchPanel = () => {
      const rankedCount = Object.keys(tagRanks).length;
      const audit = evaluate12PointChecklist(meta, rankedCount);
      const scoreColor = audit.total >= 75 ? "#10b981" : audit.total >= 50 ? "#f59e0b" : "#ef4444";

      const cleanTopic = (meta.title || "This Topic").replace(/\s*[|—\-:].*$/, "").trim();
      const aiTitles = [
        `${cleanTopic} — What Nobody Tells You in 2026`,
        `I Tested ${cleanTopic} So You Don't Have To (Honest Truth)`,
        `Why 97% Fail at ${cleanTopic} (Do This Instead)`,
        `The Ultimate ${cleanTopic} Blueprint (Step-by-Step)`,
        `Stop Using ${cleanTopic} Until You Watch This!`,
        `${cleanTopic} Explained in ${Math.max(1, Math.round(meta.lengthSeconds / 60))} Minutes`
      ];

      let tabBody = "";
      if (activeTab === "overview") {
        tabBody = `
          <div class="tm-grid-4">
            <div class="tm-metric">
              <div class="tm-metric-val" style="color:${scoreColor}">${audit.total}/100</div>
              <div class="tm-metric-lbl">TubeMetrix SEO</div>
            </div>
            <div class="tm-metric">
              <div class="tm-metric-val" style="color:#38bdf8">${formatCompact(liveVph)}</div>
              <div class="tm-metric-lbl">Live VPH</div>
            </div>
            <div class="tm-metric">
              <div class="tm-metric-val" style="color:#a78bfa">${engRate}%</div>
              <div class="tm-metric-lbl">Like/View %</div>
            </div>
            <div class="tm-metric">
              <div class="tm-metric-val" style="color:#34d399">$${formatCompact(estRevLow)}–$${formatCompact(estRevHigh)}</div>
              <div class="tm-metric-lbl">Est. Revenue</div>
            </div>
          </div>

          <div class="tm-grid-4">
            <div class="tm-metric"><div class="tm-metric-val">${formatCompact(meta.viewCount)}</div><div class="tm-metric-lbl">Exact Views</div></div>
            <div class="tm-metric"><div class="tm-metric-val">${formatCompact(meta.likeCount)}</div><div class="tm-metric-lbl">Likes</div></div>
            <div class="tm-metric"><div class="tm-metric-val">${meta.subscribersText ? meta.subscribersText.replace(/subscribers/i, "").trim() : "—"}</div><div class="tm-metric-lbl">Subscribers</div></div>
            <div class="tm-metric"><div class="tm-metric-val">${viewSubRatio ? viewSubRatio + "%" : "—"}</div><div class="tm-metric-lbl">Views/Subs</div></div>
          </div>

          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
            <button class="tm-btn" id="tm-open-preview">🖼️ SERP Simulator</button>
            <a class="tm-btn tm-btn-secondary" href="https://i.ytimg.com/vi/${meta.videoId}/maxresdefault.jpg" target="_blank">⬇ 4K Thumb</a>
            <button class="tm-btn tm-btn-emerald" id="tm-track-chan">➕ Track Competitor</button>
          </div>

          <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:800;color:#94a3b8;margin-bottom:5px;">
            <span>12-Point Optimization Checklist</span>
            <span>Actionable: <strong style="color:#38bdf8">${audit.actionable}/50</strong> · Perf: <strong style="color:#10b981">${audit.performance}/50</strong></span>
          </div>
          <div class="tm-check-list">
            ${audit.items
              .map((it) => `<div class="tm-check-item"><span>${it.ok ? "✅" : "⚠️"}</span><span>${it.label}</span></div>`)
              .join("")}
          </div>
        `;
      } else if (activeTab === "tags") {
        const vTags = meta.keywords || [];
        tabBody = `
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
            <button class="tm-btn" id="tm-copy-vtags">📋 Copy Video Tags (${vTags.length})</button>
            <button class="tm-btn tm-btn-emerald" id="tm-gen-20-tags">🚀 Generate 20 High-Rank Tags</button>
            <button class="tm-btn tm-btn-secondary" id="tm-recheck-ranks">🔍 Check #Ranks</button>
          </div>
          <div style="font-size:11px;font-weight:700;color:#94a3b8;">Video Tags (Green badge = Live YouTube Search Top-20 Rank):</div>
          <div id="tm-vtags-container" class="tm-tags-box">
            ${
              vTags.length
                ? vTags
                    .map(
                      (t) =>
                        `<span class="tm-tag" data-tag="${t.replace(/"/g, "&quot;")}">${t}${
                          tagRanks[t] ? `<span class="tm-rank-badge">#${tagRanks[t]}</span>` : ""
                        }</span>`
                    )
                    .join("")
                : `<span style="color:#94a3b8;">Creator added 0 hidden tags — click "Generate 20 High-Rank Tags" above!</span>`
            }
          </div>
          <div style="font-size:11px;font-weight:700;color:#94a3b8;margin-top:8px;">Channel Topic Tags (${meta.channelKeywords.length}):</div>
          <div class="tm-tags-box" style="max-height:85px;">
            ${
              meta.channelKeywords.length
                ? meta.channelKeywords.map((t) => `<span class="tm-tag" data-tag="${t.replace(/"/g, "&quot;")}">${t}</span>`).join("")
                : `<span style="color:#64748b;">No channel-level keywords exposed.</span>`
            }
          </div>
        `;
      } else if (activeTab === "transcript") {
        tabBody = `
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
            <button class="tm-btn" id="tm-copy-transcript">📋 Copy Full Transcript</button>
            <button class="tm-btn tm-btn-emerald" id="tm-gen-chapters">⏱️ Auto-Generate Chapters</button>
            <button class="tm-btn tm-btn-secondary" id="tm-export-srt">📥 Export .TXT</button>
          </div>
          <div id="tm-transcript-area" class="tm-scroll-box">
            ${
              transcriptSegs === null
                ? `<div style="color:#94a3b8;">⏳ Loading YouTube TimedText captions...</div>`
                : transcriptSegs.length === 0
                ? `<div style="color:#f59e0b;">No caption track available on this video.</div>`
                : transcriptSegs
                    .slice(0, 250)
                    .map(
                      (s) =>
                        `<div class="tm-ts-line" data-sec="${s.startSec}"><span class="tm-ts-badge">${formatTimestamp(
                          s.startSec
                        )}</span>${s.text}</div>`
                    )
                    .join("")
            }
          </div>
        `;
      } else if (activeTab === "ai") {
        tabBody = `
          <div style="font-size:11px;font-weight:800;color:#a5b4fc;margin-bottom:6px;">✨ 6 High-CTR Title Variations (Click any to copy):</div>
          <div style="display:flex;flex-direction:column;gap:5px;margin-bottom:10px;">
            ${aiTitles
              .map(
                (t) =>
                  `<div class="tm-tag" style="justify-content:space-between;width:100%;" data-copy="${t.replace(/"/g, "&quot;")}"><span>${t}</span><span style="color:#34d399;font-size:10px;">Copy</span></div>`
              )
              .join("")}
          </div>
          <div style="display:flex;gap:6px;">
            <button class="tm-btn tm-btn-emerald" id="tm-copy-seo-desc">📝 Copy Optimized SEO Description Template</button>
            <button class="tm-btn" id="tm-ai-preview-btn">🖼️ Test in SERP Simulator</button>
          </div>
        `;
      }

      panel.innerHTML = `
        <div class="tm-card-header">
          <div class="tm-brand">⚡ TubeMetrix Video & Channel Studio</div>
          <span class="tm-badge-pill">Full Suite Free</span>
        </div>
        <div class="tm-tabs">
          <button class="tm-tab-btn ${activeTab === "overview" ? "active" : ""}" data-wtab="overview">📊 Audit (${audit.total})</button>
          <button class="tm-tab-btn ${activeTab === "tags" ? "active" : ""}" data-wtab="tags">🏷️ Tags (${meta.keywords.length})</button>
          <button class="tm-tab-btn ${activeTab === "transcript" ? "active" : ""}" data-wtab="transcript">📜 Transcript & Chapters</button>
          <button class="tm-tab-btn ${activeTab === "ai" ? "active" : ""}" data-wtab="ai">✨ AI Titles & Desc</button>
        </div>
        ${tabBody}
        <div style="margin-top:8px;text-align:right;">
          <a href="https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=nagaraj957%40gmail.com&item_name=Support+Free+Open+Extensions&currency_code=USD" target="_blank" rel="noopener" style="display:inline-block;padding:3px 9px;border-radius:6px;background:rgba(30,41,59,0.7);border:1px solid rgba(148,163,184,0.2);color:#94a3b8;font-size:10.5px;font-weight:600;text-decoration:none;">Donate</a>
        </div>
      `;

      panel.querySelectorAll("[data-wtab]").forEach((btn) => {
        btn.onclick = async () => {
          activeTab = btn.dataset.wtab;
          renderWatchPanel();
          if (activeTab === "transcript" && transcriptSegs === null) {
            transcriptSegs = await fetchTranscriptSegments(meta.videoId, meta.captionTracks);
            renderWatchPanel();
          }
        };
      });

      const prevBtn = panel.querySelector("#tm-open-preview") || panel.querySelector("#tm-ai-preview-btn");
      if (prevBtn) prevBtn.onclick = () => openThumbnailPreviewModal(meta);

      const trackBtn = panel.querySelector("#tm-track-chan");
      if (trackBtn) {
        trackBtn.onclick = async () => {
          const handle = meta.channelHandle || meta.author || window.location.href;
          const total = await trackCompetitorChannel(handle, meta.author);
          trackBtn.textContent = `✅ Tracked (${total})`;
        };
      }

      const copyVTags = panel.querySelector("#tm-copy-vtags");
      if (copyVTags) copyVTags.onclick = () => copyText(meta.keywords.join(", "), copyVTags);

      const gen20 = panel.querySelector("#tm-gen-20-tags");
      if (gen20) {
        gen20.onclick = () => {
          gen20.textContent = "⏳ Mining SERP...";
          chrome.runtime.sendMessage({ type: "TM_KEYWORD_RESEARCH", query: cleanTopic.slice(0, 45) }, (resp) => {
            if (!chrome.runtime.lastError && resp && resp.ok && resp.data) {
              const kws = resp.data.suggestions.slice(0, 20).map((s) => s.keyword);
              meta.keywords = kws;
              copyText(kws.join(", "));
              renderWatchPanel();
            }
          });
        };
      }

      const rankBtn = panel.querySelector("#tm-recheck-ranks");
      if (rankBtn) {
        rankBtn.onclick = () => {
          rankBtn.textContent = "⏳ Checking...";
          chrome.runtime.sendMessage({ type: "TM_TAG_RANKS", videoId: meta.videoId, tags: meta.keywords }, (r) => {
            if (!chrome.runtime.lastError && r && r.ok) {
              tagRanks = r.ranks || {};
              renderWatchPanel();
            }
          });
        };
      }

      panel.querySelectorAll(".tm-tag[data-tag]").forEach((el) => {
        el.onclick = () => {
          copyText(el.dataset.tag);
          el.style.borderColor = "#10b981";
        };
      });
      panel.querySelectorAll("[data-copy]").forEach((el) => {
        el.onclick = () => {
          copyText(el.dataset.copy);
          el.style.borderColor = "#10b981";
        };
      });

      const copyTrans = panel.querySelector("#tm-copy-transcript");
      if (copyTrans) {
        copyTrans.onclick = () => {
          const text = (transcriptSegs || []).map((s) => `[${formatTimestamp(s.startSec)}] ${s.text}`).join("\n");
          copyText(text, copyTrans);
        };
      }

      const genChaps = panel.querySelector("#tm-gen-chapters");
      if (genChaps) {
        genChaps.onclick = () => {
          const chaps = buildAutoChaptersFromTranscript(transcriptSegs || [], meta.lengthSeconds);
          if (chaps.length) {
            const area = panel.querySelector("#tm-transcript-area");
            area.innerHTML = `<div style="color:#34d399;font-weight:800;margin-bottom:6px;">✅ Generated ${chaps.length} YouTube Chapters (Copied to Clipboard!):</div><pre style="white-space:pre-wrap;font-family:monospace;color:#f8fafc;">${chaps.join("\n")}</pre>`;
            copyText(chaps.join("\n"), genChaps, "✅ Chapters Copied!");
          }
        };
      }

      const exportTxt = panel.querySelector("#tm-export-srt");
      if (exportTxt) {
        exportTxt.onclick = () => {
          const txt = (transcriptSegs || []).map((s) => `${formatTimestamp(s.startSec)}  ${s.text}`).join("\n");
          const blob = new Blob([txt], { type: "text/plain" });
          const u = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = u;
          a.download = `transcript-${meta.videoId}.txt`;
          a.click();
        };
      }

      panel.querySelectorAll(".tm-ts-line").forEach((row) => {
        row.onclick = () => {
          const sec = parseInt(row.dataset.sec || "0", 10);
          const videoEl = document.querySelector("video");
          if (videoEl) videoEl.currentTime = sec;
        };
      });

      const copySeoDesc = panel.querySelector("#tm-copy-seo-desc");
      if (copySeoDesc) {
        copySeoDesc.onclick = () => {
          const top5 = (meta.keywords || []).slice(0, 5).join(", ") || cleanTopic;
          const template = `🔥 ${meta.title}\n\nIn this video, we break down ${cleanTopic} step-by-step so you can get real results fast (${top5}).\n\n⏱️ CHAPTERS:\n0:00 Introduction\n1:15 Core Strategy\n3:30 Step-by-Step Breakdown\n6:00 Pro Mistakes to Avoid\n\n#${cleanTopic.replace(/\W+/g, "")} #YouTubeGrowth #CreatorTips`;
          copyText(template, copySeoDesc);
        };
      }
    };

    renderWatchPanel();

    // Automatically check top tag ranks in background
    if (meta.keywords.length > 0) {
      chrome.runtime.sendMessage({ type: "TM_TAG_RANKS", videoId: meta.videoId, tags: meta.keywords }, (r) => {
        if (!chrome.runtime.lastError && r && r.ok && r.ranks) {
          tagRanks = r.ranks;
          if (currentWatchVid === vid) renderWatchPanel();
        }
      });
    }
  }

  // --- 5. WATCH PAGE COMMENT INSIGHTS & SENTIMENT / QUESTION FILTER BAR ---
  function injectCommentInsightsBar() {
    if (!window.location.pathname.startsWith("/watch")) return;
    const commentsHeader = document.querySelector("ytd-comments#comments #header, ytd-comments#comments, #comments");
    if (!commentsHeader || document.getElementById("tm-comment-insights")) return;

    const bar = document.createElement("div");
    bar.id = "tm-comment-insights";
    bar.className = "tm-card";
    bar.style.marginTop = "12px";

    const classifyThread = (th) => {
      const txt = (th.querySelector("#content-text")?.textContent || "").trim();
      const lower = txt.toLowerCase();
      const isQuestion = txt.includes("?") || /\b(how|what|why|can you|where|which|when)\b/i.test(lower);
      const isPositive = /\b(thanks|thank you|awesome|great|amazing|love|helpful|best|legend|fire|goat|super)\b/i.test(lower) || /[🔥❤️👏🙌💯]/.test(txt);
      const isCritique = /\b(wrong|bad|disagree|issue|problem|broken|slow|fake|mistake|fix|missing)\b/i.test(lower);
      const isLong = txt.split(/\s+/).length >= 25;
      return { txt, isQuestion, isPositive, isCritique, isLong };
    };

    const applyFilter = (mode, clickedBtn) => {
      const allThreads = Array.from(document.querySelectorAll("ytd-comment-thread-renderer"));
      let shown = 0;
      for (const th of allThreads) {
        const info = classifyThread(th);
        let match = true;
        if (mode === "questions") match = info.isQuestion;
        else if (mode === "positive") match = info.isPositive;
        else if (mode === "critique") match = info.isCritique;
        else if (mode === "long") match = info.isLong;
        th.style.display = match ? "" : "none";
        if (match) shown++;
      }
      bar.querySelectorAll("[data-cfilter]").forEach((b) => b.classList.remove("tm-active-filter"));
      if (clickedBtn) clickedBtn.classList.add("tm-active-filter");
      const counter = bar.querySelector("#tm-comment-count-msg");
      if (counter) counter.textContent = `Showing ${shown} of ${allThreads.length} loaded comments`;
    };

    bar.innerHTML = `
      <div class="tm-card-header" style="margin-bottom:8px;padding-bottom:6px;">
        <div class="tm-brand">💬 TubeMetrix Comment Intelligence & Reply Templates</div>
        <span id="tm-comment-count-msg" style="font-size:11px;color:#94a3b8;">Loaded comments ready to filter</span>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
        <button class="tm-btn tm-active-filter" data-cfilter="all">All Comments</button>
        <button class="tm-btn tm-btn-secondary" data-cfilter="questions">❓ Questions Only</button>
        <button class="tm-btn tm-btn-secondary" data-cfilter="positive">❤️ Positive / Praise</button>
        <button class="tm-btn tm-btn-secondary" data-cfilter="critique">🛠️ Corrections / Requests</button>
        <button class="tm-btn tm-btn-secondary" data-cfilter="long">📖 Detailed Stories (25+ w)</button>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
        <span style="font-size:11px;color:#94a3b8;font-weight:700;">1-Click Reply Templates:</span>
        <button class="tm-btn tm-btn-secondary" data-reply="Thanks so much for watching! Glad this helped — what topic should we cover next? 🙌">🙌 Thank + Ask Question</button>
        <button class="tm-btn tm-btn-secondary" data-reply="Great question! I'm putting together a dedicated follow-up video on this exact point — stay tuned! 🔥">🔥 Great Question</button>
        <button class="tm-btn tm-btn-secondary" data-reply="Appreciate you sharing your perspective! Pinned/noted for the community 💡">💡 Appreciate Feedback</button>
      </div>
    `;

    commentsHeader.prepend(bar);

    bar.querySelectorAll("[data-cfilter]").forEach((btn) => {
      btn.onclick = () => applyFilter(btn.dataset.cfilter, btn);
    });
    bar.querySelectorAll("[data-reply]").forEach((btn) => {
      btn.onclick = () => copyText(btn.dataset.reply, btn, "✅ Reply Copied!");
    });
  }

  // --- 6. CHANNEL PAGE ("/@handle" / "/channel/") INLINE CHANNEL AUDIT & FILTER BAR ---
  let lastChannelPath = null;
  function injectChannelAuditBar() {
    const p = window.location.pathname;
    const isChannel = p.startsWith("/@") || p.startsWith("/channel/") || p.startsWith("/c/");
    if (!isChannel) return;

    const primary = document.querySelector("ytd-two-column-browse-results-renderer #primary");
    if (!primary) return;

    if (p === lastChannelPath && document.getElementById("tm-channel-audit-bar") && feedSummary.count > 0) {
      // Update dynamic numbers if feed loaded more cards
      const medEl = document.getElementById("tm-chan-med");
      const vphEl = document.getElementById("tm-chan-vph");
      const outEl = document.getElementById("tm-chan-out");
      if (medEl) medEl.textContent = formatCompact(feedSummary.medianViews);
      if (vphEl) vphEl.textContent = formatCompact(feedSummary.avgVph);
      if (outEl) outEl.textContent = String(feedSummary.outliers);
      return;
    }
    lastChannelPath = p;

    const old = document.getElementById("tm-channel-audit-bar");
    if (old) old.remove();

    const chanTitle =
      document.querySelector("yt-page-header-view-model h1, #channel-name")?.textContent?.trim() ||
      p.split("/")[1];

    const bar = document.createElement("div");
    bar.id = "tm-channel-audit-bar";
    bar.className = "tm-card";
    bar.style.margin = "12px 16px";
    bar.innerHTML = `
      <div class="tm-card-header">
        <div class="tm-brand">📈 TubeMetrix Channel Audit & Inline Video Sorter — ${chanTitle}</div>
        <div style="display:flex;gap:6px;">
          <button class="tm-btn tm-btn-emerald" id="tm-chan-track">➕ Add to Competitors</button>
          <button class="tm-btn tm-btn-secondary" id="tm-chan-csv">📥 Export Channel CSV</button>
        </div>
      </div>
      <div class="tm-grid-4">
        <div class="tm-metric"><div id="tm-chan-med" class="tm-metric-val">${formatCompact(feedSummary.medianViews)}</div><div class="tm-metric-lbl">Median Views</div></div>
        <div class="tm-metric"><div class="tm-metric-val">${formatCompact(feedSummary.highestViews)}</div><div class="tm-metric-lbl">Breakout Peak</div></div>
        <div class="tm-metric"><div id="tm-chan-vph" class="tm-metric-val" style="color:#38bdf8">${formatCompact(feedSummary.avgVph)}</div><div class="tm-metric-lbl">Avg VPH</div></div>
        <div class="tm-metric"><div id="tm-chan-out" class="tm-metric-val" style="color:#fb7185">${feedSummary.outliers}</div><div class="tm-metric-lbl">2.5x+ Outliers</div></div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
        <span style="font-size:11px;font-weight:800;color:#94a3b8;">Inline Channel Filters:</span>
        <button class="tm-btn" data-csort="tmOutlier">🔥 Sort by Outlier Score</button>
        <button class="tm-btn" data-csort="tmVph">🚀 Sort by Highest VPH</button>
        <button class="tm-btn" data-csort="tmViews">📊 Sort by Most Views</button>
        <button class="tm-btn tm-btn-amber" id="tm-chan-only-outliers">⚡ Show Only 2x+ Winners</button>
        <button class="tm-btn tm-btn-secondary" id="tm-chan-show-all">↺ Reset</button>
      </div>
    `;
    primary.prepend(bar);

    bar.querySelectorAll("[data-csort]").forEach((btn) => {
      btn.onclick = () => sortVisibleFeed(btn.dataset.csort);
    });
    bar.querySelector("#tm-chan-only-outliers").onclick = () => filterOutliersOnly(2.0);
    bar.querySelector("#tm-chan-show-all").onclick = () => filterOutliersOnly(0);
    bar.querySelector("#tm-chan-csv").onclick = () => exportCurrentFeedCsv();
    bar.querySelector("#tm-chan-track").onclick = async (e) => {
      const btn = e.currentTarget;
      const total = await trackCompetitorChannel(p.split("/")[1], chanTitle);
      btn.textContent = `✅ Tracked (${total})`;
    };
  }

  // --- 7. SHORTS PLAYER ("/shorts/*") REAL DATA OVERLAY ---
  let lastShortId = null;
  function injectShortsOverlay() {
    if (!window.location.pathname.startsWith("/shorts/")) {
      const old = document.getElementById("tm-shorts-pill");
      if (old) old.remove();
      return;
    }
    const vid = window.location.pathname.split("/shorts/")[1]?.split("/")[0] || "";
    if (!vid) return;

    let pill = document.getElementById("tm-shorts-pill");
    if (!pill) {
      pill = document.createElement("div");
      pill.id = "tm-shorts-pill";
      pill.className = "tm-masthead-bar";
      pill.style.cssText = "position:fixed;bottom:22px;left:22px;z-index:9999;padding:7px 14px;";
      document.body.appendChild(pill);
    }

    if (vid !== lastShortId) {
      lastShortId = vid;
      const likeEl = document.querySelector("ytd-reel-video-renderer[is-active] #like-button span, like-button-view-model span");
      const likesTxt = likeEl ? likeEl.textContent.trim() : "Live";
      pill.innerHTML = `
        <span class="tm-logo">⚡ TubeMetrix Shorts</span>
        <span class="tm-stat">👍 Likes: <strong>${likesTxt || "Active"}</strong></span>
        <a href="https://i.ytimg.com/vi/${vid}/maxresdefault.jpg" target="_blank" class="tm-mini-action">🖼️ 4K Frame</a>
        <a href="/watch?v=${vid}" class="tm-mini-action">📊 Full SEO Audit</a>
      `;
    }
  }

  // --- 8. YOUTUBE STUDIO ("studio.youtube.com") UPLOAD & VIDEO EDIT OPTIMIZER ---
  function injectStudioOptimizer() {
    if (window.location.hostname !== "studio.youtube.com") return;

    // A. Top Studio Quick Bar
    const header = document.querySelector("ytcp-header #right-section, header");
    if (header && !document.getElementById("tm-studio-bar")) {
      const bar = document.createElement("div");
      bar.id = "tm-studio-bar";
      bar.className = "tm-masthead-bar";
      bar.innerHTML = `
        <span class="tm-logo">⚡ TubeMetrix Studio Max</span>
        <span class="tm-stat">⏰ Peak Publish: <strong>11 AM • 5 PM • 8 PM</strong></span>
        <button id="tm-studio-dash" class="tm-mini-action" style="background:#4f46e5;padding:3px 8px;">🎛️ Command Center</button>
      `;
      header.prepend(bar);
      bar.querySelector("#tm-studio-dash").onclick = () => {
        chrome.runtime.sendMessage({ type: "TM_OPEN_DASHBOARD" });
      };
    }

    // B. Upload / Video Edit Dialog Live SEO Optimizer Dock
    const titleBox = document.querySelector("ytcp-video-title #textbox, #title-textarea #textbox");
    const descBox = document.querySelector("ytcp-video-description #textbox, #description-textarea #textbox");
    if (!titleBox || document.getElementById("tm-studio-edit-dock")) return;

    const dock = document.createElement("div");
    dock.id = "tm-studio-edit-dock";
    dock.className = "tm-card";
    dock.style.margin = "12px 0";

    const updateLiveScore = () => {
      const t = (titleBox.textContent || "").trim();
      const d = descBox ? (descBox.textContent || "").trim() : "";
      let score = 0;
      if (t.length >= 40 && t.length <= 75) score += 20;
      else if (t.length >= 20) score += 10;
      if (/[|—\-:?!]/.test(t)) score += 10;
      if (d.length >= 300) score += 12;
      if (/\b0:00\b/.test(d)) score += 8;
      const scEl = dock.querySelector("#tm-studio-live-score");
      if (scEl) scEl.textContent = `${score}/50 Actionable SEO`;
    };

    dock.innerHTML = `
      <div class="tm-card-header">
        <div class="tm-brand">🚀 TubeMetrix Upload & Metadata Optimizer</div>
        <span id="tm-studio-live-score" class="tm-badge-pill">--/50 Actionable SEO</span>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="tm-btn tm-btn-emerald" id="tm-studio-inject-tags">🏷️ Generate & Copy 500-Char Ranked Tags</button>
        <button class="tm-btn" id="tm-studio-add-chaps">⏱️ Insert Chapter Skeleton into Description</button>
        <button class="tm-btn tm-btn-secondary" id="tm-studio-rewrite-title">✨ Suggest 3 Viral Titles</button>
      </div>
      <div id="tm-studio-suggestions" style="margin-top:8px;"></div>
    `;

    const container = titleBox.closest("ytcp-video-metadata-editor-basics, #basics") || titleBox.parentElement;
    if (container) container.prepend(dock);
    updateLiveScore();
    titleBox.addEventListener("input", updateLiveScore);
    if (descBox) descBox.addEventListener("input", updateLiveScore);

    dock.querySelector("#tm-studio-inject-tags").onclick = (e) => {
      const btn = e.currentTarget;
      const seed = (titleBox.textContent || "").split(/[|—\-:]/)[0].trim() || "youtube video";
      btn.textContent = "⏳ Mining SERP Tags...";
      chrome.runtime.sendMessage({ type: "TM_KEYWORD_RESEARCH", query: seed }, (resp) => {
        if (!chrome.runtime.lastError && resp && resp.ok && resp.data) {
          const tagStr = resp.data.suggestions.map((s) => s.keyword).join(", ").slice(0, 495);
          copyText(tagStr);
          // Also try injecting into Studio tag input if expanded
          const tagInput = document.querySelector("ytcp-form-input-tag input, #text-input");
          if (tagInput) {
            tagInput.focus();
            tagInput.value = tagStr;
            tagInput.dispatchEvent(new Event("input", { bubbles: true }));
          }
          btn.textContent = "✅ 500c Tags Copied (Paste in Tags Box)!";
        }
      });
    };

    dock.querySelector("#tm-studio-add-chaps").onclick = () => {
      if (descBox) {
        descBox.focus();
        descBox.textContent = (descBox.textContent || "") + "\n\n⏱️ CHAPTERS:\n0:00 Intro\n1:00 Core Topic\n3:00 Key Takeaways\n";
        descBox.dispatchEvent(new Event("input", { bubbles: true }));
        updateLiveScore();
      }
    };

    dock.querySelector("#tm-studio-rewrite-title").onclick = () => {
      const clean = (titleBox.textContent || "Your Topic").replace(/\s*[|—\-:].*$/, "").trim();
      const box = dock.querySelector("#tm-studio-suggestions");
      const opts = [
        `${clean} — The Complete 2026 Guide`,
        `Why Everyone Gets ${clean} Wrong (Fix This)`,
        `I Tried ${clean} For 30 Days — Real Results`
      ];
      box.innerHTML = opts
        .map((o) => `<div class="tm-tag" style="margin:4px 4px 0 0;" data-apply="${o.replace(/"/g, "&quot;")}">${o}</div>`)
        .join("");
      box.querySelectorAll("[data-apply]").forEach((el) => {
        el.onclick = () => {
          titleBox.textContent = el.dataset.apply;
          titleBox.dispatchEvent(new Event("input", { bubbles: true }));
          updateLiveScore();
        };
      });
    };
  }

  function runAllModules() {
    annotateAllVideoCards();
    injectSearchCompanion();
    injectWatchInspector();
    injectCommentInsightsBar();
    injectChannelAuditBar();
    injectShortsOverlay();
    injectStudioOptimizer();
  }

  runAllModules();
  window.addEventListener("yt-navigate-finish", () => {
    setTimeout(runAllModules, 400);
  });
  setInterval(runAllModules, 1800);
})();
