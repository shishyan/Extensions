/**
 * TubeIQ — Background Service Worker (Manifest V3)
 * Handles live YouTube Autocomplete keyword queries & watch-page metadata extraction
 * without requiring any paid API keys or external servers.
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
    console.warn("[TubeIQ] Autocomplete fetch error:", err);
  }
  return [];
}

async function analyzeKeyword(keyword) {
  const [enList, taList, shortsList, howToList] = await Promise.all([
    fetchYouTubeSuggestions(keyword, "en", "US"),
    fetchYouTubeSuggestions(keyword, "ta", "IN"),
    fetchYouTubeSuggestions(`${keyword} shorts`, "en", "IN"),
    fetchYouTubeSuggestions(`how to ${keyword}`, "en", "US")
  ]);

  const combined = [];
  const seen = new Set();
  for (const kw of [...enList, ...taList, ...shortsList, ...howToList]) {
    const lower = kw.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      combined.push(kw);
    }
  }

  const scored = combined.slice(0, 20).map((kw, index) => {
    const demand = Math.max(48, 98 - index * 2);
    const wordCount = kw.trim().split(/\s+/).length;
    const isLongTail = wordCount >= 4;
    const hasNonAscii = /[^\u0000-\u007f]/.test(kw);
    const competition = Math.max(18, Math.min(85, 72 - wordCount * 8 - (hasNonAscii ? 12 : 0)));
    const opportunity = Math.min(99, Math.round((demand * (100 - competition)) / 52));
    return {
      keyword: kw,
      demand,
      competition,
      opportunity,
      wordCount
    };
  });

  const avgDemand = scored.length
    ? Math.round(scored.reduce((s, r) => s + r.demand, 0) / scored.length)
    : 50;
  const avgComp = scored.length
    ? Math.round(scored.reduce((s, r) => s + r.competition, 0) / scored.length)
    : 50;
  const overallScore = Math.min(99, Math.round((avgDemand * 0.6) + ((100 - avgComp) * 0.4)));

  return {
    query: keyword,
    overallScore,
    avgDemand,
    avgCompetition: avgComp,
    suggestions: scored
  };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "TUBEIQ_KEYWORD_RESEARCH") {
    analyzeKeyword(message.query || "youtube shorts")
      .then((res) => sendResponse({ ok: true, data: res }))
      .catch((err) => sendResponse({ ok: false, error: String(err) }));
    return true; // async response
  }
});
