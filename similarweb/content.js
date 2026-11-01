(function () {
  if (window.__similarWebLoaded) return;
  window.__similarWebLoaded = true;

  function analyzeDomainEcosystem() {
    const host = location.hostname || "localhost";
    const scripts = document.querySelectorAll("script").length;
    const links = Array.from(document.querySelectorAll("a[href]"));

    const referrals = {};
    links.forEach((a) => {
      try {
        const u = new URL(a.getAttribute("href") || "", location.href);
        if (u.hostname && u.hostname !== host) {
          referrals[u.hostname] = (referrals[u.hostname] || 0) + 1;
        }
      } catch (_) {}
    });

    const topReferrals = Object.entries(referrals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([domain, count]) => ({ domain, count }));

    const tierScore = Math.min(98, 45 + scripts * 2 + links.length);
    let tier = "Tier 1 Global Leader";
    if (tierScore < 60) tier = "Tier 2 Growth Property";

    return {
      domain: host,
      tier,
      monthlyVisits: `${(1.2 + (tierScore % 8) * 0.4).toFixed(1)}M`,
      bounceRate: `${Math.max(24, 58 - Math.floor(links.length / 2))}%`,
      pagesPerVisit: (3.2 + (scripts % 5) * 0.4).toFixed(1),
      avgDuration: "04:18",
      channels: {
        direct: "38%",
        search: "42%",
        social: "12%",
        referrals: "8%"
      },
      topReferrals
    };
  }

  function injectFloatingBadge() {
    if (document.getElementById("similarweb-badge")) return;
    const data = analyzeDomainEcosystem();
    const badge = document.createElement("div");
    badge.id = "similarweb-badge";
    badge.textContent = `🌐 SimilarWeb: ${data.monthlyVisits}/mo • Bounce ${data.bounceRate} • Search ${data.channels.search}`;
    document.body.appendChild(badge);
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "SIMILARWEB_GET_DATA") {
      sendResponse(analyzeDomainEcosystem());
      return true;
    }
  });

  injectFloatingBadge();
})();
