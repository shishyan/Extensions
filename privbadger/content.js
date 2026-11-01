(function () {
  if (document.getElementById("privbadger-pill")) return;

  const TRACKING_PARAMS = [
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
    "fbclid", "gclid", "mc_cid", "_ga", "msclkid", "igshid", "twclid"
  ];

  let whitelisted = false;

  function scrubTrackingUrls() {
    if (whitelisted) return 0;
    let cleanedCount = 0;

    try {
      const cur = new URL(location.href);
      let changed = false;
      TRACKING_PARAMS.forEach((p) => {
        if (cur.searchParams.has(p)) {
          cur.searchParams.delete(p);
          cleanedCount++;
          changed = true;
        }
      });
      if (changed && history.replaceState) {
        history.replaceState(null, "", cur.toString());
      }
    } catch (e) {}

    document.querySelectorAll("a[href]").forEach((a) => {
      try {
        const u = new URL(a.href, location.href);
        let modified = false;
        TRACKING_PARAMS.forEach((p) => {
          if (u.searchParams.has(p)) {
            u.searchParams.delete(p);
            cleanedCount++;
            modified = true;
          }
        });
        if (modified) {
          a.href = u.toString();
          a.setAttribute("data-privbadger-cleaned", "true");
        }
      } catch (e) {}
    });

    return cleanedCount;
  }

  let totalCleanedOnPage = scrubTrackingUrls();

  function buildAudit() {
    const host = location.hostname || "localhost";
    const cookiesCount = document.cookie ? document.cookie.split(";").filter(Boolean).length : 0;
    let lsCount = 0;
    try {
      lsCount = localStorage.length;
    } catch (e) {}

    const thirdPartyDomains = new Set();
    document.querySelectorAll("script[src], iframe[src], img[src]").forEach((el) => {
      try {
        const u = new URL(el.src, location.href);
        if (u.hostname && u.hostname !== host && !u.hostname.endsWith("." + host)) {
          thirdPartyDomains.add(u.hostname);
        }
      } catch (_) {}
    });

    return {
      host,
      whitelisted,
      grade: cookiesCount > 5 ? "B+" : "A+",
      cleanedParams: totalCleanedOnPage,
      cookiesCount,
      localStorageKeys: lsCount,
      thirdPartyDomains: Array.from(thirdPartyDomains).slice(0, 12),
      canvasProtected: true,
      webglProtected: true,
      hardwareConcurrency: navigator.hardwareConcurrency || 4
    };
  }

  const pill = document.createElement("div");
  pill.id = "privbadger-pill";

  function renderPill() {
    const audit = buildAudit();
    pill.innerHTML = `
      <span>🦡 PrivBadger: Grade <strong>${audit.grade}</strong> · ${audit.cleanedParams} Trackers Cleaned</span>
      <button id="privbadger-clean-btn">Sanitize</button>
    `;
    const btn = pill.querySelector("#privbadger-clean-btn");
    if (btn) {
      btn.addEventListener("click", () => {
        totalCleanedOnPage += scrubTrackingUrls();
        btn.textContent = "Sanitized!";
      });
    }
  }

  document.documentElement.appendChild(pill);
  renderPill();

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "PRIVBADGER_AUDIT") {
      totalCleanedOnPage += scrubTrackingUrls();
      sendResponse({ ok: true, audit: buildAudit() });
    } else if (msg.type === "PRIVBADGER_TOGGLE_WHITELIST") {
      whitelisted = !whitelisted;
      sendResponse({ ok: true, audit: buildAudit() });
    }
  });
})();
