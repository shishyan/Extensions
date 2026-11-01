/**
 * TubeMetrix v100.3.0 — Background Service Worker (Manifest V3)
 * Real Data Engines (Zero API Keys, Zero Paywalls, 100% Free):
 *  1. Multi-Intent YouTube Autocomplete Engine (Related, Questions, Prepositions, Shorts, Regional)
 *  2. Live YouTube SERP Parser (Scrapes real `/results` ytInitialData — both 2026 `lockupViewModel` and classic `videoRenderer` — to compute real Highest Views, Avg Views, Median Views, Avg Age, Title Match %, Top Channels & Competition Score)
 *  3. Real Tag Search Rank Checker (Checks exact `#1–#20` search rank of a videoId for its tags on YouTube Search)
 *  4. Real Competitor Channel Scraper (Fetches `/@handle/videos` ytInitialData to extract subscriber count, total videos, channel keywords, recent 30 uploads via `lockupViewModel`/`videoRenderer`, median views, avg VPH & breakout outliers)
 *  5. Daily Viral Ideas Generator (Combines tracked niche topics + breakout question/comparison patterns)
 */

const SERP_CACHE = new Map();

function parseCompactNum(str) {
  if (!str) return 0;
  const s = String(str).replace(/,/g, "").trim();
  if (/^\d+:\d+(:\d+)?$/.test(s)) return 0;
  if (/\bago\b|முன்/i.test(s) || /^\d+\s*(s|m|h|d|w|mo|y)\b/i.test(s)) return 0;
  const m = s.match(/([\d.]+)\s*(million|billion|thousand|[KMBkmb]|கோடி|லட்சம்|ஆயிரம்)?/i);
  if (!m) return 0;
  let v = parseFloat(m[1]);
  if (isNaN(v)) return 0;
  const u = (m[2] || "").toUpperCase();
  if (u === "K" || u === "THOUSAND" || m[2] === "ஆயிரம்") v *= 1e3;
  else if (u === "M" || u === "MILLION") v *= 1e6;
  else if (u === "B" || u === "BILLION") v *= 1e9;
  else if (m[2] === "லட்சம்") v *= 1e5;
  else if (m[2] === "கோடி") v *= 1e7;
  return Math.round(v);
}

function parseAgeHours(str) {
  if (!str) return 72;
  const s = String(str).toLowerCase().trim();
  const shortMatch = s.match(/(\d+)\s*(s|sec|m|min|h|hr|d|w|wk|mo|y|yr)\b/);
  if (shortMatch && (s.includes("ago") || shortMatch[2])) {
    const n = parseInt(shortMatch[1], 10) || 1;
    const u = shortMatch[2];
    if (u === "s" || u === "sec") return 0.1;
    if (u === "m" || u === "min") return Math.max(0.2, n / 60);
    if (u === "h" || u === "hr") return n;
    if (u === "d") return n * 24;
    if (u === "w" || u === "wk") return n * 24 * 7;
    if (u === "mo") return n * 24 * 30;
    if (u === "y" || u === "yr") return n * 24 * 365;
  }
  const longMatch = s.match(/(\d+)\s*(second|minute|hour|day|week|month|year|மணி|நாள்|வாரம்|மாதம்|ஆண்டு)/);
  if (longMatch) {
    const n = parseInt(longMatch[1], 10) || 1;
    const u = longMatch[2];
    if (u.startsWith("second")) return 0.1;
    if (u.startsWith("minute")) return Math.max(0.2, n / 60);
    if (u.startsWith("hour") || u === "மணி") return n;
    if (u.startsWith("day") || u === "நாள்") return n * 24;
    if (u.startsWith("week") || u === "வாரம்") return n * 24 * 7;
    if (u.startsWith("month") || u === "மாதம்") return n * 24 * 30;
    if (u.startsWith("year") || u === "ஆண்டு") return n * 24 * 365;
  }
  return 72;
}

async function fetchAutocomplete(query, hl = "en", gl = "US") {
  const url = `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&hl=${encodeURIComponent(hl)}&gl=${encodeURIComponent(gl)}&q=${encodeURIComponent(query)}`;
  try {
    const resp = await fetch(url);
    const text = await resp.text();
    const start = text.indexOf("(");
    const end = text.lastIndexOf(")");
    if (start !== -1 && end !== -1) {
      const data = JSON.parse(text.slice(start + 1, end));
      if (Array.isArray(data[1])) {
        return data[1].map((item) => item[0]).filter(Boolean);
      }
    }
  } catch (e) {}
  return [];
}

function parseLockupViewModel(lvm) {
  if (!lvm || typeof lvm !== "object") return null;
  const vid = lvm.contentId || "";
  if (!vid || lvm.contentType === "LOCKUP_CONTENT_TYPE_PLAYLIST") return null;
  const md = (lvm.metadata && lvm.metadata.lockupMetadataViewModel) || {};
  const title = (md.title && md.title.content) || "";
  if (!title) return null;

  let views = 0;
  let ageHours = 72;
  let pubText = "";
  let channelName = "";
  let lengthText = "";

  const rows =
    (md.metadata &&
      md.metadata.contentMetadataViewModel &&
      md.metadata.contentMetadataViewModel.metadataRows) ||
    [];
  for (const row of rows) {
    const parts = row.metadataParts || [];
    for (const part of parts) {
      const txt = (part.text && part.text.content) || "";
      const aria = part.accessibilityLabel || "";
      if (!txt) continue;
      if (/\bago\b/i.test(txt) || /\bago\b/i.test(aria) || /^\d+\s*(s|m|h|d|w|mo|y)\s*ago/i.test(txt)) {
        pubText = txt;
        ageHours = parseAgeHours(aria || txt);
      } else if (/views/i.test(aria) || part.leadingIcon?.name === "PLAY_ARROW_OUTLINED" || /^[\d.,]+\s*[KMB]$/i.test(txt)) {
        const parsed = parseCompactNum(txt) || parseCompactNum(aria);
        if (parsed > 0) views = parsed;
      } else if (!channelName && !/views|ago/i.test(txt)) {
        channelName = txt;
      }
    }
  }

  const overlays =
    (lvm.contentImage &&
      lvm.contentImage.thumbnailViewModel &&
      lvm.contentImage.thumbnailViewModel.overlays) ||
    [];
  for (const ov of overlays) {
    const badges =
      (ov.thumbnailBottomOverlayViewModel && ov.thumbnailBottomOverlayViewModel.badges) || [];
    for (const b of badges) {
      const t = b.thumbnailBadgeViewModel && b.thumbnailBadgeViewModel.text;
      if (t && /^\d+:\d+/.test(t)) lengthText = t;
    }
  }

  return {
    videoId: vid,
    title,
    views,
    ageHours,
    vph: Math.max(1, Math.round(views / Math.max(1, ageHours))),
    pubText,
    channelName,
    lengthText
  };
}

function extractVideosFromInitialData(obj, out = [], seenIds = new Set()) {
  if (!obj || typeof obj !== "object") return out;
  if (obj.videoRenderer) {
    const vr = obj.videoRenderer;
    const vid = vr.videoId;
    const title =
      (vr.title && vr.title.runs && vr.title.runs.map((r) => r.text).join("")) ||
      (vr.title && vr.title.simpleText) ||
      "";
    const viewText =
      (vr.viewCountText && (vr.viewCountText.simpleText || (vr.viewCountText.runs && vr.viewCountText.runs.map((r) => r.text).join("")))) ||
      (vr.shortViewCountText && (vr.shortViewCountText.simpleText || (vr.shortViewCountText.runs && vr.shortViewCountText.runs.map((r) => r.text).join("")))) ||
      "0";
    const pubText =
      (vr.publishedTimeText && vr.publishedTimeText.simpleText) || "";
    const channelName =
      (vr.ownerText && vr.ownerText.runs && vr.ownerText.runs[0] && vr.ownerText.runs[0].text) ||
      (vr.longBylineText && vr.longBylineText.runs && vr.longBylineText.runs[0] && vr.longBylineText.runs[0].text) ||
      "";
    const lengthText = (vr.lengthText && vr.lengthText.simpleText) || "";
    const views = parseCompactNum(viewText);
    const ageHours = parseAgeHours(pubText);
    if (vid && title && !seenIds.has(vid)) {
      seenIds.add(vid);
      out.push({
        videoId: vid,
        title,
        views,
        ageHours,
        vph: Math.max(1, Math.round(views / Math.max(1, ageHours))),
        pubText,
        channelName,
        lengthText
      });
    }
  } else if (obj.lockupViewModel) {
    const parsedLockup = parseLockupViewModel(obj.lockupViewModel);
    if (parsedLockup && !seenIds.has(parsedLockup.videoId)) {
      seenIds.add(parsedLockup.videoId);
      out.push(parsedLockup);
    }
    return out;
  } else if (obj.richItemRenderer && obj.richItemRenderer.content) {
    extractVideosFromInitialData(obj.richItemRenderer.content, out, seenIds);
    return out;
  }
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (Array.isArray(v)) {
      for (const item of v) extractVideosFromInitialData(item, out, seenIds);
    } else if (v && typeof v === "object") {
      extractVideosFromInitialData(v, out, seenIds);
    }
  }
  return out;
}

async function fetchLiveSerpData(query) {
  const key = query.trim().toLowerCase();
  if (SERP_CACHE.has(key)) {
    const cached = SERP_CACHE.get(key);
    if (Date.now() - cached.ts < 5 * 60 * 1000) return cached.data;
  }
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&hl=en`;
  let videos = [];
  let estResults = 0;
  try {
    const resp = await fetch(url, { credentials: "omit" });
    const html = await resp.text();
    const estMatch = html.match(/"estimatedResults":"(\d+)"/);
    if (estMatch) estResults = parseInt(estMatch[1], 10) || 0;
    const idMatch = html.match(/var\s+ytInitialData\s*=\s*(\{.+?\});\s*<\/script>/s) ||
                    html.match(/ytInitialData\s*=\s*(\{.+?\});/s);
    if (idMatch) {
      const parsed = JSON.parse(idMatch[1]);
      videos = extractVideosFromInitialData(parsed, []).slice(0, 25);
    }
  } catch (e) {}

  const viewsArr = videos.map((v) => v.views).filter((n) => n > 0).sort((a, b) => a - b);
  const highestViews = viewsArr.length ? viewsArr[viewsArr.length - 1] : 0;
  const avgViews = viewsArr.length ? Math.round(viewsArr.reduce((a, b) => a + b, 0) / viewsArr.length) : 0;
  const medianViews = viewsArr.length ? viewsArr[Math.floor(viewsArr.length / 2)] : 0;
  const avgVph = videos.length ? Math.round(videos.reduce((a, v) => a + v.vph, 0) / videos.length) : 0;
  const avgAgeDays = videos.length ? Math.round(videos.reduce((a, v) => a + v.ageHours / 24, 0) / videos.length) : 0;

  const qWords = key.split(/\s+/).filter((w) => w.length > 2);
  let exactTitleMatches = 0;
  const channelCounts = {};
  for (const v of videos) {
    const tl = v.title.toLowerCase();
    if (tl.includes(key) || (qWords.length && qWords.every((w) => tl.includes(w)))) {
      exactTitleMatches++;
    }
    if (v.channelName) {
      channelCounts[v.channelName] = (channelCounts[v.channelName] || 0) + 1;
    }
  }
  const titleMatchPct = videos.length ? Math.round((exactTitleMatches / videos.length) * 100) : 50;
  const recent7dCount = videos.filter((v) => v.ageHours <= 24 * 7).length;

  // Real Demand Score (0-100): derived from real SERP avgVph, medianViews, and estResults
  const vphSignal = Math.min(45, Math.round(Math.log10(Math.max(10, avgVph)) * 13));
  const viewSignal = Math.min(40, Math.round(Math.log10(Math.max(100, medianViews)) * 7.5));
  const freshSignal = Math.min(15, recent7dCount * 3);
  const demandScore = Math.max(25, Math.min(99, vphSignal + viewSignal + freshSignal));

  // Real Competition Score (0-100): derived from title saturation %, authority concentration & total results
  const resultSaturation = estResults > 0 ? Math.min(35, Math.round(Math.log10(Math.max(100, estResults)) * 4.5)) : 20;
  const titleSaturation = Math.round(titleMatchPct * 0.45);
  const bigHitPenalty = medianViews > 500000 ? 18 : medianViews > 100000 ? 10 : 4;
  const competitionScore = Math.max(12, Math.min(96, resultSaturation + titleSaturation + bigHitPenalty));

  const overallScore = Math.max(15, Math.min(99, Math.round(demandScore * 0.56 + (100 - competitionScore) * 0.44)));

  const topChannels = Object.entries(channelCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const data = {
    query,
    overallScore,
    demandScore,
    competitionScore,
    estResults,
    highestViews,
    avgViews,
    medianViews,
    avgVph,
    avgAgeDays,
    titleMatchPct,
    recent7dCount,
    topChannels,
    videos
  };
  SERP_CACHE.set(key, { ts: Date.now(), data });
  return data;
}

async function fullKeywordResearch(query) {
  const base = (query || "youtube growth").trim();
  const [
    serp,
    directEn,
    directIn,
    howList,
    whatList,
    whyList,
    bestList,
    vsList,
    shortsList
  ] = await Promise.all([
    fetchLiveSerpData(base),
    fetchAutocomplete(base, "en", "US"),
    fetchAutocomplete(base, "en", "IN"),
    fetchAutocomplete(`how to ${base}`, "en", "US"),
    fetchAutocomplete(`what is ${base}`, "en", "US"),
    fetchAutocomplete(`why ${base}`, "en", "US"),
    fetchAutocomplete(`best ${base}`, "en", "US"),
    fetchAutocomplete(`${base} vs`, "en", "US"),
    fetchAutocomplete(`${base} shorts`, "en", "IN")
  ]);

  const buildScoredItem = (kw, idx, category) => {
    const words = kw.trim().split(/\s+/).length;
    const rankDecay = Math.min(26, idx * 2);
    const demand = Math.max(32, Math.min(99, serp.demandScore + (idx === 0 ? 4 : -rankDecay + (words >= 4 ? 5 : 0))));
    const comp = Math.max(10, Math.min(94, serp.competitionScore - Math.max(0, (words - 2) * 8) - (category === "question" ? 10 : 0)));
    const opp = Math.max(18, Math.min(99, Math.round(demand * 0.55 + (100 - comp) * 0.45)));
    const estVol = Math.max(250, Math.round((Math.pow(demand, 2.25) * 1.9) / Math.max(1, words * 0.45)));
    return {
      keyword: kw,
      category,
      demand,
      competition: comp,
      opportunity: opp,
      wordCount: words,
      estMonthlySearches: estVol
    };
  };

  const seen = new Set();
  const related = [];
  for (const [i, kw] of [...directEn, ...directIn, ...bestList, ...shortsList].entries()) {
    const k = kw.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      related.push(buildScoredItem(kw, i, "related"));
    }
  }

  const questions = [];
  for (const [i, kw] of [...howList, ...whatList, ...whyList].entries()) {
    const k = kw.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      questions.push(buildScoredItem(kw, i, "question"));
    }
  }

  const comparisons = [];
  for (const [i, kw] of vsList.entries()) {
    const k = kw.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      comparisons.push(buildScoredItem(kw, i, "comparison"));
    }
  }

  const allPool = [...related, ...questions, ...comparisons];
  const hiddenGems = allPool
    .filter((item) => item.competition <= 48 && item.demand >= 52)
    .sort((a, b) => b.opportunity - a.opportunity)
    .slice(0, 15);

  return {
    query: base,
    overallScore: serp.overallScore,
    avgDemand: serp.demandScore,
    avgCompetition: serp.competitionScore,
    serpStats: {
      estResults: serp.estResults,
      highestViews: serp.highestViews,
      avgViews: serp.avgViews,
      medianViews: serp.medianViews,
      avgVph: serp.avgVph,
      avgAgeDays: serp.avgAgeDays,
      titleMatchPct: serp.titleMatchPct,
      recent7dCount: serp.recent7dCount,
      topChannels: serp.topChannels
    },
    suggestions: related.slice(0, 25),
    questions: questions.slice(0, 20),
    comparisons: comparisons.slice(0, 15),
    hiddenGems
  };
}

async function checkVideoTagRanks(videoId, tags = []) {
  const subset = tags.slice(0, 8);
  const ranks = {};
  await Promise.all(
    subset.map(async (tag) => {
      try {
        const serp = await fetchLiveSerpData(tag);
        const idx = serp.videos.findIndex((v) => v.videoId === videoId);
        if (idx !== -1 && idx < 20) {
          ranks[tag] = idx + 1;
        }
      } catch (e) {}
    })
  );
  return ranks;
}

async function fetchCompetitorChannel(handleOrUrl) {
  let target = (handleOrUrl || "").trim();
  if (!target) throw new Error("Empty channel handle");
  if (!target.startsWith("http")) {
    if (!target.startsWith("@")) target = "@" + target;
    target = `https://www.youtube.com/${target}/videos`;
  } else if (!target.includes("/videos")) {
    target = target.replace(/\/$/, "") + "/videos";
  }

  const resp = await fetch(target, { credentials: "omit" });
  const html = await resp.text();
  const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
  const avatarMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
  const subMatch = html.match(/"subscriberCountText":\{"simpleText":"([^"]+)"\}/) ||
                   html.match(/([\d.,]+\s*(?:[KMB]|million|thousand)?\s*subscribers)/i);
  const videoCountMatch = html.match(/([\d.,]+\s*[KMB]?\s*videos)/i);
  const chanKwMatch = html.match(/"channelMetadataRenderer":\{[^}]*"keywords":"([^"]+)"/);
  const channelKeywords = chanKwMatch && chanKwMatch[1]
    ? chanKwMatch[1]
        .split(/\s+|,/)
        .map((s) => s.replace(/"/g, "").trim())
        .filter((s) => s.length > 2)
        .slice(0, 18)
    : [];

  let videos = [];
  const idMatch = html.match(/var\s+ytInitialData\s*=\s*(\{.+?\});\s*<\/script>/s) ||
                  html.match(/ytInitialData\s*=\s*(\{.+?\});/s);
  if (idMatch) {
    try {
      const parsed = JSON.parse(idMatch[1]);
      videos = extractVideosFromInitialData(parsed, [], new Set());
    } catch (e) {}
  }

  const topVids = videos.slice(0, 30);
  const sorted = topVids.map((v) => v.views).filter((n) => n > 0).sort((a, b) => a - b);
  const medianViews = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
  const highestViews = sorted.length ? sorted[sorted.length - 1] : 0;
  const avgViews = sorted.length ? Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length) : 0;
  const avgVph = topVids.length ? Math.round(topVids.reduce((a, v) => a + v.vph, 0) / topVids.length) : 0;
  const uploadsLast30d = topVids.filter((v) => v.ageHours <= 24 * 30).length;

  const enriched = topVids.map((v) => ({
    ...v,
    outlierScore: medianViews > 0 ? +(v.views / medianViews).toFixed(1) : 1.0
  }));
  const breakout = [...enriched].sort((a, b) => b.outlierScore - a.outlierScore)[0] || null;
  const estMonthlyViews = uploadsLast30d > 0 ? Math.round(avgViews * uploadsLast30d * 1.4) : Math.round(avgVph * 24 * 30);
  const estMonthlyRevLow = Math.max(10, Math.round((estMonthlyViews / 1000) * 1.8));
  const estMonthlyRevHigh = Math.max(30, Math.round((estMonthlyViews / 1000) * 4.8));

  return {
    url: target,
    name: titleMatch ? titleMatch[1] : handleOrUrl,
    avatar: avatarMatch ? avatarMatch[1] : "",
    subscribersText: subMatch ? subMatch[1] : "Active Creator",
    subscribersNum: subMatch ? parseCompactNum(subMatch[1]) : 0,
    totalVideosText: videoCountMatch ? videoCountMatch[1] : `${topVids.length}+ videos`,
    channelKeywords,
    medianViews,
    highestViews,
    avgViews,
    avgVph,
    uploadsLast30d,
    estMonthlyViews,
    estMonthlyRevLow,
    estMonthlyRevHigh,
    breakoutVideo: breakout,
    recentVideos: enriched.slice(0, 12)
  };
}

async function generateDailyIdeas(nicheQuery) {
  const res = await fullKeywordResearch(nicheQuery || "youtube creator growth");
  const pool = [...res.hiddenGems, ...res.questions, ...res.suggestions].slice(0, 12);
  const hooks = [
    { fmt: (k) => `I Tried ${k} For 30 Days — Honest Results`, pred: "Very High", badge: "🔥 Viral Experiment" },
    { fmt: (k) => `Why 95% of People Fail at ${k} (Fix This Fast)`, pred: "Very High", badge: "⚡ Contrarian Hook" },
    { fmt: (k) => `The Complete ${k} Blueprint (Zero to Pro)`, pred: "High", badge: "📘 Evergreen Search" },
    { fmt: (k) => `Stop Doing This With ${k} Right Now!`, pred: "High", badge: "🚨 Pattern Interrupt" }
  ];
  return pool.slice(0, 10).map((item, idx) => {
    const h = hooks[idx % hooks.length];
    const cleanKw = item.keyword.replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      title: h.fmt(cleanKw),
      seedKeyword: item.keyword,
      prediction: item.opportunity >= 72 ? "Very High" : item.opportunity >= 58 ? "High" : "Medium",
      opportunityScore: item.opportunity,
      estSearches: item.estMonthlySearches,
      competition: item.competition,
      formatBadge: h.badge
    };
  });
}

async function fetchVideoTranscript(videoId) {
  if (!videoId) return [];
  try {
    const resp = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        context: {
          client: { clientName: "IOS", clientVersion: "20.10.4", hl: "en", gl: "US" }
        },
        videoId
      })
    });
    const data = await resp.json();
    const tracks =
      (data.captions &&
        data.captions.playerCaptionsTracklistRenderer &&
        data.captions.playerCaptionsTracklistRenderer.captionTracks) ||
      [];
    if (!tracks.length) return [];
    const track = tracks.find((t) => t.languageCode === "en") || tracks[0];
    const xmlResp = await fetch(track.baseUrl);
    const xml = await xmlResp.text();
    const segments = [];
    const re = /<text\s+start="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g;
    let m;
    const decodeEntities = (s) =>
      s
        .replace(/&amp;/g, "&")
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/\s+/g, " ")
        .trim();
    while ((m = re.exec(xml)) !== null) {
      const startSec = Math.floor(parseFloat(m[1] || "0"));
      const text = decodeEntities(m[2]);
      if (text) segments.push({ startSec, text });
    }
    return segments;
  } catch (e) {
    return [];
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) return false;

  if (message.type === "TM_FETCH_TRANSCRIPT") {
    fetchVideoTranscript(message.videoId)
      .then((segments) => sendResponse({ ok: true, segments }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true;
  }

  if (message.type === "TUBEIQ_KEYWORD_RESEARCH" || message.type === "TM_KEYWORD_RESEARCH") {
    fullKeywordResearch(message.query || "youtube shorts")
      .then((data) => sendResponse({ ok: true, data }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true;
  }

  if (message.type === "TM_TAG_RANKS") {
    checkVideoTagRanks(message.videoId, message.tags || [])
      .then((ranks) => sendResponse({ ok: true, ranks }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true;
  }

  if (message.type === "TM_FETCH_COMPETITOR") {
    fetchCompetitorChannel(message.channel)
      .then((data) => sendResponse({ ok: true, data }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true;
  }

  if (message.type === "TM_DAILY_IDEAS") {
    generateDailyIdeas(message.niche || "youtube growth")
      .then((ideas) => sendResponse({ ok: true, ideas }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true;
  }

  if (message.type === "TM_OPEN_DASHBOARD") {
    chrome.runtime.openOptionsPage();
    sendResponse({ ok: true });
    return false;
  }

  return false;
});
