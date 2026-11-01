(function () {
  if (window.__surfSeoLoaded) return;
  window.__surfSeoLoaded = true;

  const STOP_WORDS = new Set([
    "the","and","for","that","this","with","from","your","have","are","was","were","will","would","could","should",
    "about","into","more","other","some","such","than","then","them","these","they","their","there","what","when",
    "where","which","while","who","whom","whose","why","how","all","any","both","each","few","most","own","same",
    "can","just","don","also","very","only","over","under","again","further","once","here","been","being","does",
    "did","doing","has","had","having","our","ours","you","yours","him","his","her","hers","its","out","not","but"
  ]);

  function auditPage(targetKwInput) {
    const title = document.title || "";
    const metaDescEl = document.querySelector("meta[name='description']");
    const metaDesc = metaDescEl ? metaDescEl.getAttribute("content") || "" : "";
    const h1Els = Array.from(document.querySelectorAll("h1"));
    const h1 = h1Els.length;
    const h2 = document.querySelectorAll("h2").length;
    const h3 = document.querySelectorAll("h3").length;
    const h1Text = h1Els.map((el) => el.innerText.trim()).join(" | ");
    const imgs = Array.from(document.querySelectorAll("img"));
    const missingAlt = imgs.filter((i) => !i.getAttribute("alt") || !i.getAttribute("alt").trim()).length;

    const links = Array.from(document.querySelectorAll("a[href]"));
    const internalLinks = links.filter((a) => {
      try { return new URL(a.href, location.href).hostname === location.hostname; } catch (_) { return false; }
    }).length;
    const externalLinks = Math.max(0, links.length - internalLinks);

    const text = (document.body ? document.body.innerText : "").trim();
    const lowerText = text.toLowerCase();
    const rawWords = lowerText.match(/[a-z]{3,}/g) || [];
    const wordCount = text ? text.split(/\s+/).length : 0;

    const filtered = rawWords.filter((w) => !STOP_WORDS.has(w));
    const freq = {};
    const bigrams = {};
    const trigrams = {};

    for (let i = 0; i < filtered.length; i++) {
      const w = filtered[i];
      freq[w] = (freq[w] || 0) + 1;
      if (i < filtered.length - 1) {
        const bg = filtered[i] + " " + filtered[i + 1];
        bigrams[bg] = (bigrams[bg] || 0) + 1;
      }
      if (i < filtered.length - 2) {
        const tg = filtered[i] + " " + filtered[i + 1] + " " + filtered[i + 2];
        trigrams[tg] = (trigrams[tg] || 0) + 1;
      }
    }

    const totalWords = Math.max(1, wordCount);
    const topTerms = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([term, count]) => ({ term, count, density: ((count / totalWords) * 100).toFixed(2) + "%" }));

    const topBigrams = Object.entries(bigrams)
      .filter(([, c]) => c > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([term, count]) => ({ term, count, density: ((count / totalWords) * 100).toFixed(2) + "%" }));

    const topTrigrams = Object.entries(trigrams)
      .filter(([, c]) => c > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([term, count]) => ({ term, count, density: ((count / totalWords) * 100).toFixed(2) + "%" }));

    // Missing / Target Keyword Checker
    const customTargets = (targetKwInput || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const targetAudit = customTargets.map((kw) => {
      const inTitle = title.toLowerCase().includes(kw);
      const inH1 = h1Text.toLowerCase().includes(kw);
      const count = lowerText.split(kw).length - 1;
      return { kw, count, inTitle, inH1, status: count > 0 ? "Present" : "Missing" };
    });

    let score = 45;
    if (title.length >= 30 && title.length <= 65) score += 12;
    if (metaDesc.length >= 110 && metaDesc.length <= 165) score += 12;
    if (h1 === 1) score += 10;
    if (h2 >= 2) score += 8;
    if (wordCount >= 600) score += 8;
    if (missingAlt === 0 && imgs.length > 0) score += 5;

    return {
      url: location.href,
      score: Math.min(100, score),
      wordCount,
      title,
      titleLen: title.length,
      metaLen: metaDesc.length,
      h1,
      h2,
      h3,
      imgs: imgs.length,
      missingAlt,
      internalLinks,
      externalLinks,
      topTerms,
      topBigrams,
      topTrigrams,
      targetAudit
    };
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "SURFSEO_AUDIT") {
      sendResponse(auditPage(msg.targets || ""));
      return true;
    }
  });
})();
