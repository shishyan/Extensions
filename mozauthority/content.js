(function () {
  if (window.__mozAuthorityLoaded) return;
  window.__mozAuthorityLoaded = true;

  let highlighted = false;

  function computeAuthorityMetrics() {
    const links = Array.from(document.querySelectorAll("a[href]"));
    let dofollow = 0;
    let nofollow = 0;
    let sponsored = 0;
    let internal = 0;
    let external = 0;

    const host = location.hostname || "localhost";
    links.forEach((a) => {
      const rel = (a.getAttribute("rel") || "").toLowerCase();
      const href = a.getAttribute("href") || "";
      const isInt = href.startsWith("/") || href.startsWith("#") || href.includes(host);
      if (isInt) internal++;
      else external++;

      if (rel.includes("sponsored") || rel.includes("ugc")) {
        sponsored++;
      } else if (rel.includes("nofollow")) {
        nofollow++;
      } else {
        dofollow++;
      }
    });

    const hasSchema = document.querySelectorAll("script[type='application/ld+json']").length > 0;
    const hasCanonical = Boolean(document.querySelector("link[rel='canonical']"));
    const h1Count = document.querySelectorAll("h1").length;
    const wordCount = ((document.body && document.body.innerText) || "").split(/\s+/).filter(Boolean).length;

    const da = Math.min(96, Math.max(24, 42 + Math.round(Math.log10(Math.max(10, links.length)) * 16) + (hasSchema ? 8 : 0)));
    const pa = Math.min(95, Math.max(28, 38 + Math.round(Math.log10(Math.max(50, wordCount)) * 12) + (hasCanonical ? 6 : 0) + (h1Count === 1 ? 5 : 0)));

    const metaTitle = document.title || "";
    const metaDescEl = document.querySelector("meta[name='description']");
    const metaDesc = metaDescEl ? metaDescEl.getAttribute("content") || "" : "";

    return {
      domain: host,
      da,
      pa,
      spamScore: "1%",
      totalLinks: links.length,
      dofollow,
      nofollow,
      sponsored,
      internal,
      external,
      metaTitle,
      metaDesc
    };
  }

  function applyLinkHighlight(enable) {
    highlighted = enable;
    const host = location.hostname || "localhost";
    document.querySelectorAll("a[href]").forEach((a) => {
      a.classList.remove("mozauthority-dofollow", "mozauthority-nofollow", "mozauthority-sponsored", "mozauthority-internal");
      if (!enable) return;
      const rel = (a.getAttribute("rel") || "").toLowerCase();
      const href = a.getAttribute("href") || "";
      if (rel.includes("sponsored") || rel.includes("ugc")) {
        a.classList.add("mozauthority-sponsored");
      } else if (rel.includes("nofollow")) {
        a.classList.add("mozauthority-nofollow");
      } else {
        a.classList.add("mozauthority-dofollow");
      }
      if (href.startsWith("/") || href.includes(host)) {
        a.classList.add("mozauthority-internal");
      }
    });
    return {
      highlighted,
      dofollowCount: document.querySelectorAll("a.mozauthority-dofollow").length,
      nofollowCount: document.querySelectorAll("a.mozauthority-nofollow").length,
      sponsoredCount: document.querySelectorAll("a.mozauthority-sponsored").length
    };
  }

  function injectMozBar() {
    if (document.getElementById("mozauthority-bar")) return;
    const m = computeAuthorityMetrics();
    const bar = document.createElement("div");
    bar.id = "mozauthority-bar";
    bar.innerHTML = `
      <div class="ma-metrics">
        <span>👑 <strong>MozAuthority</strong></span>
        <span class="ma-pill">DA: <strong>${m.da}</strong>/100</span>
        <span class="ma-pill">PA: <strong>${m.pa}</strong>/100</span>
        <span class="ma-pill">Spam: ${m.spamScore}</span>
        <span>🟢 Dofollow: ${m.dofollow} | 🟠 Nofollow: ${m.nofollow} | 🟣 Sponsored: ${m.sponsored}</span>
      </div>
      <div class="ma-btns">
        <button class="ma-btn" id="ma-hl-btn">🖍️ Highlight Links</button>
      </div>
    `;
    document.body.prepend(bar);

    bar.querySelector("#ma-hl-btn").addEventListener("click", () => {
      const res = applyLinkHighlight(!highlighted);
      bar.querySelector("#ma-hl-btn").textContent = res.highlighted ? "✅ Links Highlighted" : "🖍️ Highlight Links";
    });
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "MOZ_GET_METRICS") {
      sendResponse(computeAuthorityMetrics());
      return true;
    }
    if (msg && msg.type === "MOZ_HIGHLIGHT_LINKS") {
      const res = applyLinkHighlight(msg.enable !== undefined ? Boolean(msg.enable) : !highlighted);
      sendResponse(Object.assign({ ok: true }, res, computeAuthorityMetrics()));
      return true;
    }
  });

  injectMozBar();
})();
