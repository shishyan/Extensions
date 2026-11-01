(() => {
  if (document.getElementById("zoterocite-bar")) return;

  function getMeta(selectors) {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        const val = el.getAttribute("content") || el.textContent || "";
        if (val.trim()) return val.trim();
      }
    }
    return "";
  }

  function extractCitationData() {
    const rawAuthor = getMeta([
      'meta[name="citation_author"]',
      'meta[name="author"]',
      'meta[property="article:author"]',
      '[rel="author"]',
      '.author'
    ]) || "Editorial Research Team";

    const parts = rawAuthor.split(/\s+/).filter(Boolean);
    const lastName = parts.length > 1 ? parts[parts.length - 1] : rawAuthor;
    const firstInitial = parts.length > 1 ? parts[0][0].toUpperCase() + "." : "";
    const firstName = parts.length > 1 ? parts.slice(0, -1).join(" ") : "";

    const title = getMeta([
      'meta[name="citation_title"]',
      'meta[property="og:title"]',
      'h1'
    ]) || document.title || "Untitled Research Document";

    const rawDate = getMeta([
      'meta[name="citation_publication_date"]',
      'meta[property="article:published_time"]',
      'meta[name="date"]',
      'time[datetime]'
    ]) || "2026-11-01";

    const yearMatch = rawDate.match(/(19|20)\d{2}/);
    const year = yearMatch ? yearMatch[0] : "2026";

    const siteName = getMeta([
      'meta[property="og:site_name"]',
      'meta[name="citation_journal_title"]',
      'meta[name="application-name"]'
    ]) || (window.location.hostname ? window.location.hostname.replace(/^www\./, "") : "Journal of Web Systems");

    const doi = getMeta([
      'meta[name="citation_doi"]',
      'meta[name="dc.identifier"]'
    ]) || "";

    const url = window.location.href || "https://example.org/research-article";
    const accessed = "November 1, 2026";

    const apa7 = `${lastName}${firstInitial ? ", " + firstInitial : ""} (${year}). ${title}. ${siteName}. ${doi ? "https://doi.org/" + doi : url}`;
    const mla9 = `${lastName}${firstName ? ", " + firstName : ""}. "${title}." ${siteName}, ${year}, ${url}. Accessed ${accessed}.`;
    const chicago17 = `${lastName}${firstName ? ", " + firstName : ""}. "${title}." ${siteName}. Published ${year}. ${url}.`;
    const ieee = `[1] ${firstInitial ? firstInitial + " " : ""}${lastName}, "${title}," ${siteName}, ${year}. [Online]. Available: ${url}. [Accessed: Nov. 1, 2026].`;
    const harvard = `${lastName}${firstInitial ? ", " + firstInitial : ""} (${year}) '${title}', ${siteName}. Available at: ${url} (Accessed: 1 November 2026).`;

    const citeKey = `${lastName.toLowerCase().replace(/[^a-z0-9]/g, "") || "ref"}${year}`;
    const bibtex = `@misc{${citeKey},\n  author = {${rawAuthor}},\n  title = {${title}},\n  year = {${year}},\n  howpublished = {\\url{${url}}},\n  note = {Publisher: ${siteName}; Accessed: ${accessed}}\n}`;
    const ris = `TY  - ELEC\nAU  - ${rawAuthor}\nTI  - ${title}\nPY  - ${year}\nT2  - ${siteName}\nUR  - ${url}\nY2  - 2026/11/01\nER  -`;

    return {
      author: rawAuthor,
      title,
      year,
      siteName,
      doi,
      url,
      accessed,
      styles: {
        "APA 7th": apa7,
        "MLA 9th": mla9,
        "Chicago 17th": chicago17,
        "IEEE": ieee,
        "Harvard": harvard
      },
      bibtex,
      ris
    };
  }

  const bar = document.createElement("div");
  bar.id = "zoterocite-bar";
  const info = extractCitationData();
  bar.innerHTML = `
    <span class="zc-badge">📚 ZoteroCite</span>
    <span class="zc-meta" id="zoterocite-preview">${info.styles["APA 7th"].slice(0, 68)}...</span>
    <button type="button" id="zoterocite-copy-btn">📚 Copy APA 7th Citation</button>
    <button type="button" id="zoterocite-bib-btn">BibTeX</button>
  `;
  document.body.appendChild(bar);

  function saveToHistory(data) {
    try {
      chrome.runtime.sendMessage({
        type: "ZOTEROCITE_SAVE_CITATION",
        entry: {
          title: data.title,
          author: data.author,
          year: data.year,
          url: data.url,
          apa: data.styles["APA 7th"],
          savedAt: Date.now()
        }
      });
    } catch (e) {}
  }

  const copyBtn = document.getElementById("zoterocite-copy-btn");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const fresh = extractCitationData();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fresh.styles["APA 7th"]).catch(() => {});
      }
      saveToHistory(fresh);
      copyBtn.textContent = "✓ Copied APA 7th!";
      setTimeout(() => {
        copyBtn.textContent = "📚 Copy APA 7th Citation";
      }, 1600);
    });
  }

  const bibBtn = document.getElementById("zoterocite-bib-btn");
  if (bibBtn) {
    bibBtn.addEventListener("click", () => {
      const fresh = extractCitationData();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fresh.bibtex).catch(() => {});
      }
      saveToHistory(fresh);
      bibBtn.textContent = "✓ .bib Copied";
      setTimeout(() => {
        bibBtn.textContent = "BibTeX";
      }, 1600);
    });
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "ZOTEROCITE_EXTRACT") {
      const data = extractCitationData();
      saveToHistory(data);
      sendResponse({ ok: true, data });
      return true;
    }
  });
})();
