(function () {
  if (document.getElementById("ublockshield-pill")) return;

  const AD_SELECTORS = [
    ".ad-banner",
    ".ad-slot",
    "[id*='google_ads']",
    "ins.adsbygoogle",
    ".sponsored-post"
  ];
  const COOKIE_SELECTORS = [
    "#onetrust-consent-sdk",
    ".qc-cmp2-container",
    "[class*='cookie-banner']",
    "[id*='cookie-consent']"
  ];

  let zapMode = false;

  function sweepDOM() {
    let adsHidden = 0;
    let cookiesHidden = 0;

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

    const host = location.hostname || "localhost";
    let thirdPartyTrackers = 0;
    document.querySelectorAll("script[src], iframe[src]").forEach((el) => {
      try {
        const u = new URL(el.src, location.href);
        if (u.hostname && u.hostname !== host && !u.hostname.endsWith("." + host)) {
          thirdPartyTrackers++;
        }
      } catch (e) {}
    });

    return {
      adsHidden,
      cookiesHidden,
      thirdPartyTrackers,
      totalBlocked: adsHidden + cookiesHidden + thirdPartyTrackers
    };
  }

  let stats = sweepDOM();

  const pill = document.createElement("div");
  pill.id = "ublockshield-pill";

  function renderPill() {
    stats = sweepDOM();
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

  document.addEventListener(
    "click",
    (e) => {
      if (!zapMode) return;
      if (e.target && e.target.closest && e.target.closest("#ublockshield-pill")) return;
      e.preventDefault();
      e.stopPropagation();
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
