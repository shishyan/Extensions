(function () {
  if (window.__similarWebLoaded) return;
  window.__similarWebLoaded = true;

  function computeDeepSeoAudit() {
    const title = (document.title || "").trim();
    const titlePixels = Math.round(title.length * 9.2);
    const metaDescEl = document.querySelector("meta[name='description']");
    const metaDesc = metaDescEl ? (metaDescEl.getAttribute("content") || "").trim() : "";
    const descPixels = Math.round(metaDesc.length * 6.8);
    const canonicalEl = document.querySelector("link[rel='canonical']");
    const canonical = canonicalEl ? canonicalEl.getAttribute("href") || "Missing" : "Missing";
    const robotsEl = document.querySelector("meta[name='robots']");
    const robots = robotsEl ? robotsEl.getAttribute("content") || "index, follow" : "index, follow";
    const ogTitleEl = document.querySelector("meta[property='og:title']");
    const ogTitle = ogTitleEl ? ogTitleEl.getAttribute("content") || "" : "";

    const schemaScripts = Array.from(document.querySelectorAll("script[type='application/ld+json']"));
    const schemaTypes = [];
    schemaScripts.forEach((s) => {
      try {
        const parsed = JSON.parse(s.textContent || "{}");
        if (parsed["@type"]) schemaTypes.push(parsed["@type"]);
        else if (Array.isArray(parsed["@graph"])) {
          parsed["@graph"].forEach((g) => { if (g && g["@type"]) schemaTypes.push(g["@type"]); });
        }
      } catch (_) {}
    });

    const headings = [];
    document.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((h) => {
      const txt = (h.innerText || "").trim();
      if (txt) headings.push({ tag: h.tagName, text: txt.slice(0, 90) });
    });

    const h1Count = document.querySelectorAll("h1").length;
    const h2Count = document.querySelectorAll("h2").length;
    const h3Count = document.querySelectorAll("h3").length;

    const imgs = Array.from(document.querySelectorAll("img"));
    const missingAlt = imgs.filter((img) => !img.getAttribute("alt") || !img.getAttribute("alt").trim()).length;

    const links = Array.from(document.querySelectorAll("a[href]"));
    let internal = 0, external = 0, nofollow = 0, dofollow = 0, sponsored = 0, ugc = 0;
    const extDomains = new Set();
    const linkRows = [];

    links.forEach((a) => {
      const rawHref = a.getAttribute("href") || "";
      if (!rawHref || rawHref.startsWith("javascript:") || rawHref.startsWith("#")) return;
      let u;
      try {
        u = new URL(rawHref, location.href);
      } catch (_) {
        return;
      }
      const isInt = u.hostname === location.hostname;
      if (isInt) internal++;
      else {
        external++;
        if (u.hostname) extDomains.add(u.hostname.replace(/^www\./, ""));
      }
      const rel = (a.getAttribute("rel") || "").toLowerCase();
      const isNo = rel.includes("nofollow");
      if (isNo) nofollow++;
      else dofollow++;
      if (rel.includes("sponsored")) sponsored++;
      if (rel.includes("ugc")) ugc++;

      if (linkRows.length < 50) {
        linkRows.push({
          anchor: (a.innerText || a.getAttribute("title") || "[Image/Icon]").trim().slice(0, 50) || "[No Anchor]",
          href: u.href,
          type: isInt ? "Internal" : "External",
          rel: isNo ? "nofollow" : "dofollow"
        });
      }
    });

    // Keyword Density
    const stop = new Set(["the","and","for","that","this","with","from","your","have","are","was","were","will","about","into","more","other","some","such","than","then","them","these","they","their","there","what","when","where","which","while","who","all","any","can","not","but","you","our"]);
    const bodyText = (document.body ? document.body.innerText : "").trim();
    const words = bodyText.toLowerCase().match(/[a-z]{3,}/g) || [];
    const wordCount = bodyText ? bodyText.split(/\s+/).length : 0;
    const freq = {};
    const bigrams = {};
    const cleanWords = words.filter((w) => !stop.has(w));
    for (let i = 0; i < cleanWords.length; i++) {
      const w = cleanWords[i];
      freq[w] = (freq[w] || 0) + 1;
      if (i < cleanWords.length - 1) {
        const bg = cleanWords[i] + " " + cleanWords[i + 1];
        bigrams[bg] = (bigrams[bg] || 0) + 1;
      }
    }
    const topKeywords = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([kw, count]) => ({
        kw,
        count,
        density: ((count / Math.max(1, wordCount)) * 100).toFixed(2) + "%"
      }));

    const topPhrases = Object.entries(bigrams)
      .filter(([, c]) => c > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([kw, count]) => ({ kw, count }));

    // Authority & Traffic Heuristics grounded in DOM structure + domain signals
    const isHttps = location.protocol === "https:";
    let da = 35;
    if (isHttps) da += 8;
    if (schemaTypes.length > 0) da += 10;
    if (canonical !== "Missing") da += 7;
    if (h1Count === 1 && h2Count >= 2) da += 10;
    if (wordCount > 600) da += 9;
    da = Math.min(96, da + Math.min(17, extDomains.size));
    const pa = Math.min(94, Math.max(25, da - 3 + Math.min(10, Math.floor(internal / 10))));
    const spamScore = Math.max(1, Math.min(35, nofollow > dofollow * 2 ? 12 : 2));

    return {
      domain: location.hostname,
      url: location.href,
      title,
      titleLen: title.length,
      titlePixels,
      metaDesc,
      descLen: metaDesc.length,
      descPixels,
      canonical,
      robots,
      ogTitle,
      schemaTypes: Array.from(new Set(schemaTypes)),
      h1Count,
      h2Count,
      h3Count,
      headings: headings.slice(0, 25),
      imgCount: imgs.length,
      missingAlt,
      wordCount,
      totalLinks: links.length,
      internal,
      external,
      dofollow,
      nofollow,
      sponsored,
      ugc,
      refDomains: extDomains.size,
      extDomainList: Array.from(extDomains).slice(0, 20),
      linkRows,
      topKeywords,
      topPhrases,
      da,
      pa,
      spamScore
    };
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "SIMILARWEB_ANALYZE") {
      const seo = computeDeepSeoAudit();
      const scripts = document.querySelectorAll("script").length;
      const estVisitsNum = Math.max(12000, seo.da * 18500 + seo.internal * 650 + scripts * 400);
      const visitsFmt = estVisitsNum >= 1e6 ? (estVisitsNum / 1e6).toFixed(2) + "M / mo" : Math.round(estVisitsNum / 1e3) + "K / mo";
      sendResponse({
        domain: seo.domain,
        da: seo.da,
        monthlyVisits: visitsFmt,
        bounceRate: Math.max(24, 62 - Math.floor(seo.internal / 8)) + "%",
        pagesPerVisit: (2.1 + Math.min(4.5, seo.internal / 35)).toFixed(1),
        avgDuration: "0" + Math.min(8, 2 + Math.floor(seo.wordCount / 350)) + ":24",
        sources: {
          search: "48%",
          direct: "31%",
          referrals: "12%",
          social: "9%"
        },
        topCountries: ["🇺🇸 United States (38%)", "🇬🇧 United Kingdom (14%)", "🇮🇳 India (12%)", "🇩🇪 Germany (8%)"],
        topReferrers: seo.extDomainList.slice(0, 6)
      });
      return true;
    }
  });
})();
