/**
 * TubeIQ Max — Background Service Worker (Manifest V3)
 * Live YouTube Autocomplete & Multi-Region Keyword Intelligence (Zero API Keys / 100% Free)
 */

async function fetchYouTubeSuggestions(query, hl = "en", gl = "US") {
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
  } catch (err) {
    console.warn("[TubeIQ Max] Autocomplete fetch error:", err);
  }
  return [];
}

function buildFallbackSuggestions(keyword) {
  const base = (keyword || "youtube shorts").trim();
  return [
    base,
    `${base} shorts`,
    `${base} tamil`,
    `how to ${base}`,
    `${base} explained`,
    `${base} tutorial`,
    `${base} 2026`,
    `best ${base}`,
    `${base} tips and tricks`,
    `${base} full guide`,
    `${base} viral video`,
    `${base} step by step`,
    `${base} status`,
    `${base} meaning`,
    `${base} review`
  ];
}

async function analyzeKeyword(keyword) {
  const [enList, taList, shortsList, howToList, whyList] = await Promise.all([
    fetchYouTubeSuggestions(keyword, "en", "US"),
    fetchYouTubeSuggestions(keyword, "ta", "IN"),
    fetchYouTubeSuggestions(`${keyword} shorts`, "en", "IN"),
    fetchYouTubeSuggestions(`how to ${keyword}`, "en", "US"),
    fetchYouTubeSuggestions(`${keyword} explained`, "en", "US")
  ]);

  const combined = [];
  const seen = new Set();
  const rawPool = [...enList, ...taList, ...shortsList, ...howToList, ...whyList];
  const sourceList = rawPool.length > 0 ? rawPool : buildFallbackSuggestions(keyword);

  for (const kw of sourceList) {
    const lower = kw.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      combined.push(kw);
    }
  }

  const scored = combined.slice(0, 25).map((kw, index) => {
    const demand = Math.max(52, 99 - index * 2);
    const wordCount = kw.trim().split(/\s+/).length;
    const hasNonAscii = /[^\u0000-\u007f]/.test(kw);
    const competition = Math.max(14, Math.min(82, 70 - wordCount * 7 - (hasNonAscii ? 12 : 0)));
    const opportunity = Math.min(99, Math.round((demand * 0.58) + ((100 - competition) * 0.42)));
    const estMonthlySearches = Math.round((demand * demand * 18) / Math.max(1, wordCount * 0.6));
    return {
      keyword: kw,
      demand,
      competition,
      opportunity,
      wordCount,
      estMonthlySearches
    };
  });

  const avgDemand = scored.length
    ? Math.round(scored.reduce((s, r) => s + r.demand, 0) / scored.length)
    : 65;
  const avgComp = scored.length
    ? Math.round(scored.reduce((s, r) => s + r.competition, 0) / scored.length)
    : 40;
  const overallScore = Math.min(99, Math.round((avgDemand * 0.58) + ((100 - avgComp) * 0.42)));

  return {
    query: keyword,
    overallScore,
    avgDemand,
    avgCompetition: avgComp,
    suggestions: scored
  };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === "TUBEIQ_KEYWORD_RESEARCH") {
    analyzeKeyword(message.query || "youtube shorts")
      .then((res) => sendResponse({ ok: true, data: res }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true;
  }
});
