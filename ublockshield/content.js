(function () {
  if (document.getElementById("ublockshield-pill")) return;

  const AD_SELECTORS = [
    ".ad-banner", ".ad-slot", ".ad-container", ".ad-wrapper", ".ad-unit",
    ".adsbygoogle", "ins.adsbygoogle", "[id*='google_ads']", "[id*='div-gpt-ad']",
    ".sponsored-post", ".sponsored-content", ".sponsored-widget", ".promoted-link",
    ".outbrain-widget", ".taboola-widget", "[data-ad-slot]", "[data-ad-client]",
    ".dfp-ad", ".banner-ads", ".LeaderboardAd", ".SidebarAd", ".NativeAd",
    "iframe[src*='doubleclick.net']", "iframe[src*='googlesyndication.com']",
    "iframe[src*='adservice.google']", ".adthrive-ad", ".mediavine-ad",
    ".CarbonAds", "#carbonads", ".promo-banner", ".floating-video-ad"
  ];
  const COOKIE_SELECTORS = [
    "#onetrust-consent-sdk", ".qc-cmp2-container", "[class*='cookie-banner']",
    "[id*='cookie-consent']", "#CybotCookiebotDialog", ".cc-window",
    "#cookie-law-info-bar", ".cookie-notice-container", "#didomi-host",
    ".truste_box_overlay", ".osano-cm-window", ".js-cookie-banner",
    "[aria-label*='cookie' i][role='dialog']", ".gdpr-banner", "#gdpr-cookie-message"
  ];

  let zapMode = false;
  let whitelisted = false;

  function sweepDOM() {
    const host = location.hostname || "localhost";
    let adsHidden = 0;
    let cookiesHidden = 0;

    if (!whitelisted) {
      AD_SELECTORS.forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => {
          if (!el.classList.contains("ublockshield-hidden")) {
            el.classList.add("ublockshield-hidden");
          }
          adsHidden++;
        });
      });

      COOKIE_SELECTORS.forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => {
          if (!el.classList.contains("ublockshield-hidden")) {
            el.classList.add("ublockshield-hidden");
          }
          cookiesHidden++;
        });
      });
    } else {
      document.querySelectorAll(".ublockshield-hidden").forEach((el) => {
        el.classList.remove("ublockshield-hidden");
      });
    }

    const trackerDomains = new Set();
    let thirdPartyTrackers = 0;
    document.querySelectorAll("script[src], iframe[src]").forEach((el) => {
      try {
        const u = new URL(el.src, location.href);
        if (u.hostname && u.hostname !== host && !u.hostname.endsWith("." + host)) {
          thirdPartyTrackers++;
          trackerDomains.add(u.hostname);
        }
      } catch (e) {}
    });

    return {
      host,
      whitelisted,
      adsHidden,
      cookiesHidden,
      thirdPartyTrackers,
      trackerDomains: Array.from(trackerDomains).slice(0, 15),
      totalBlocked: whitelisted ? 0 : (adsHidden + cookiesHidden + thirdPartyTrackers),
      activeSelectorsCount: AD_SELECTORS.length + COOKIE_SELECTORS.length
    };
  }

  const pill = document.createElement("div");
  pill.id = "ublockshield-pill";

  function renderPill() {
    const stats = sweepDOM();
    pill.innerHTML = `
      <span>🛡️ UBlockShield: <strong>${stats.totalBlocked}</strong> Blocked (${stats.adsHidden} Ads · ${stats.cookiesHidden} Cookie Walls)</span>
      <button id="ublockshield-zap-btn">${zapMode ? "Zapper ON" : "⚡ Zap Element"}</button>
    `;
    const btn = pill.querySelector("#ublockshield-zap-btn");
    if (btn) {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        zapMode = !zapMode;
        renderPill();
      });
    }
  }

  document.documentElement.appendChild(pill);
  renderPill();

  document.addEventListener("mouseover", (e) => {
    if (!zapMode || !e.target || (e.target.closest && e.target.closest("#ublockshield-pill"))) return;
    e.target.style.outline = "2px dashed #ef4444";
  });
  document.addEventListener("mouseout", (e) => {
    if (!zapMode || !e.target) return;
    e.target.style.outline = "";
  });

  document.addEventListener(
    "click",
    (e) => {
      if (!zapMode) return;
      if (e.target && e.target.closest && e.target.closest("#ublockshield-pill")) return;
      e.preventDefault();
      e.stopPropagation();
      e.target.style.outline = "";
      e.target.classList.add("ublockshield-hidden");
      zapMode = false;
      renderPill();
    },
    true
  );

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "UBLOCKSHIELD_STATUS") {
      sendResponse({ ok: true, stats: sweepDOM() });
    } else if (msg.type === "UBLOCKSHIELD_ZAP_TOGGLE") {
      zapMode = !zapMode;
      renderPill();
      sendResponse({ ok: true, zapMode, stats: sweepDOM() });
    } else if (msg.type === "UBLOCKSHIELD_WHITELIST_TOGGLE") {
      whitelisted = !whitelisted;
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ ["ublock_wl_" + (location.hostname || "localhost")]: whitelisted });
      }
      renderPill();
      sendResponse({ ok: true, whitelisted, stats: sweepDOM() });
    } else if (msg.type === "UBLOCKSHIELD_APPLY_CUSTOM") {
      if (msg.selector) {
        try {
          document.querySelectorAll(msg.selector).forEach((el) => {
            el.classList.add("ublockshield-hidden");
          });
        } catch (e) {}
      }
      sendResponse({ ok: true, stats: sweepDOM() });
    }
  });
})();
