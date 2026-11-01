(function () {
  if (window.__ahrefBacklinkLoaded) return;
  window.__ahrefBacklinkLoaded = true;

  function scanLinksOnPage() {
    const anchors = Array.from(document.querySelectorAll("a[href]"));
    const host = location.hostname || "localhost";
    const anchorFreq = {};
    const domainFreq = {};
    let brokenCount = 0;

    const items = anchors.map((a) => {
      const rawHref = (a.getAttribute("href") || "").trim();
      const text = (a.innerText || a.getAttribute("title") || "[Empty Anchor]").replace(/\s+/g, " ").trim().slice(0, 60);
      const rel = (a.getAttribute("rel") || "dofollow").toLowerCase();
      let targetHost = host;
      try {
        targetHost = new URL(rawHref, location.href).hostname || host;
      } catch (_) {}

      const isBroken =
        rawHref === "" ||
        rawHref === "#" ||
        rawHref.toLowerCase().startsWith("javascript:") ||
        rawHref.includes("404") ||
        rawHref.includes("broken");

      if (isBroken) {
        brokenCount++;
        a.classList.add("ahrefbacklink-broken");
      }

      anchorFreq[text] = (anchorFreq[text] || 0) + 1;
      domainFreq[targetHost] = (domainFreq[targetHost] || 0) + 1;

      return {
        anchor: text,
        href: rawHref,
        domain: targetHost,
        rel,
        broken: isBroken
      };
    });

    const topAnchors = Object.entries(anchorFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([anchor, count]) => ({ anchor, count }));

    const topDomains = Object.entries(domainFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([domain, count]) => ({ domain, count }));

    return {
      totalLinks: items.length,
      brokenCount,
      topAnchors,
      topDomains,
      items: items.slice(0, 50)
    };
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "AHREF_SCAN_LINKS") {
      sendResponse(scanLinksOnPage());
      return true;
    }
  });
})();
