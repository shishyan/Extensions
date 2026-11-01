(function () {
  if (window.__rakuCashLoaded) return;
  window.__rakuCashLoaded = true;

  const TRACKING_PARAMS = [
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
    "aff_id", "clickid", "irclickid", "tag", "fbclid", "gclid", "ref"
  ];

  function cleanPageLinks() {
    let cleanedLinks = 0;
    let paramsRemoved = 0;

    document.querySelectorAll("a[href]").forEach((a) => {
      const raw = a.getAttribute("href") || "";
      if (!raw.includes("?")) return;
      try {
        const u = new URL(raw, location.href);
        let modified = false;
        TRACKING_PARAMS.forEach((p) => {
          if (u.searchParams.has(p)) {
            u.searchParams.delete(p);
            paramsRemoved++;
            modified = true;
          }
        });
        if (modified) {
          a.setAttribute("href", u.toString());
          cleanedLinks++;
        }
      } catch (_) {}
    });

    return {
      cleanedLinks,
      paramsRemoved,
      directCashbackEstimate: "6.5% Direct Tier"
    };
  }

  function injectPill() {
    if (document.getElementById("rakucash-pill")) return;
    const res = cleanPageLinks();
    const pill = document.createElement("div");
    pill.id = "rakucash-pill";
    pill.textContent = `💜 RakuCash: Cleaned ${res.cleanedLinks} Tracking Links • ${res.directCashbackEstimate}`;
    document.body.appendChild(pill);

    pill.addEventListener("click", () => {
      const again = cleanPageLinks();
      pill.textContent = `✅ RakuCash Shield Active (${res.cleanedLinks + again.cleanedLinks} links sanitized)`;
    });
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "RAKU_CLEAN_LINKS") {
      sendResponse(cleanPageLinks());
      return true;
    }
  });

  injectPill();
})();
