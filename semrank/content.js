(function () {
  if (window.__semRankLoaded) return;
  window.__semRankLoaded = true;

  const STOP_WORDS = new Set([
    "the", "and", "for", "with", "that", "this", "from", "your", "are", "was", "were",
    "have", "has", "had", "not", "but", "you", "all", "can", "will", "into", "our", "out"
  ]);

  function runTechnicalDiagnosis() {
    const canonicalEl = document.querySelector("link[rel='canonical']");
    const robotsEl = document.querySelector("meta[name='robots']");
    const viewportEl = document.querySelector("meta[name='viewport']");
    const ogTitleEl = document.querySelector("meta[property='og:title']");
    const hreflangCount = document.querySelectorAll("link[rel='alternate'][hreflang]").length;

    const schemaBlocks = Array.from(document.querySelectorAll("script[type='application/ld+json']"));
    const schemaTypes = [];
    schemaBlocks.forEach((s) => {
      try {
        const parsed = JSON.parse(s.textContent || "{}");
        if (parsed["@type"]) schemaTypes.push(parsed["@type"]);
      } catch (_) {}
    });

    const rawWords = ((document.body && document.body.innerText) || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

    const freq1 = {};
    const freq2 = {};
    const freq3 = {};
    for (let i = 0; i < rawWords.length; i++) {
      const w1 = rawWords[i];
      freq1[w1] = (freq1[w1] || 0) + 1;
      if (i + 1 < rawWords.length) {
        const w2 = `${rawWords[i]} ${rawWords[i + 1]}`;
        freq2[w2] = (freq2[w2] || 0) + 1;
      }
      if (i + 2 < rawWords.length) {
        const w3 = `${rawWords[i]} ${rawWords[i + 1]} ${rawWords[i + 2]}`;
        freq3[w3] = (freq3[w3] || 0) + 1;
      }
    }

    const total = Math.max(1, rawWords.length);
    const topN = (obj) =>
      Object.entries(obj)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([phrase, count]) => ({
          phrase,
          count,
          density: `${((count / total) * 100).toFixed(1)}%`
        }));

    return {
      hasCanonical: Boolean(canonicalEl),
      robots: robotsEl ? robotsEl.getAttribute("content") || "index,follow" : "index,follow",
      hasViewport: Boolean(viewportEl),
      hasOpenGraph: Boolean(ogTitleEl),
      hreflangCount,
      schemaCount: schemaBlocks.length,
      schemaTypes,
      wordCount: rawWords.length,
      ngrams1: topN(freq1),
      ngrams2: topN(freq2),
      ngrams3: topN(freq3)
    };
  }

  function injectDiagnosisBar() {
    if (document.getElementById("semrank-bar")) return;
    const d = runTechnicalDiagnosis();
    const bar = document.createElement("div");
    bar.id = "semrank-bar";
    bar.innerHTML = `
      <div class="sr-badges">
        <span>📈 <strong>SemRank Technical SEO</strong></span>
        <span class="sr-chip">Canonical: ${d.hasCanonical ? "✅ Pass" : "⚠️ Missing"}</span>
        <span class="sr-chip">Robots: ${d.robots}</span>
        <span class="sr-chip">Schema.org: ${d.schemaCount} (${d.schemaTypes.join(",") || "None"})</span>
        <span class="sr-chip">Viewport: ${d.hasViewport ? "✅ Mobile" : "⚠️ No"}</span>
        <span class="sr-chip">Words: ${d.wordCount}</span>
      </div>
    `;
    document.body.prepend(bar);
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "SEMRANK_GET_DIAGNOSIS") {
      sendResponse(runTechnicalDiagnosis());
      return true;
    }
  });

  injectDiagnosisBar();
})();
