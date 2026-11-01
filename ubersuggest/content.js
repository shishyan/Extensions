(function () {
  if (window.__uberSuggestLoaded) return;
  window.__uberSuggestLoaded = true;

  function hashSeed(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return Math.abs(h);
  }

  function generateKeywords(seedRaw) {
    const h1 = document.querySelector("h1");
    const base = (seedRaw || (h1 && h1.innerText) || document.title || "ai tools")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .trim()
      .split(/\s+/)
      .slice(0, 3)
      .join(" ") || "ai tools";

    const modifiers = [
      { kw: `${base} tutorial 2026`, engine: "YouTube" },
      { kw: `best ${base} software`, engine: "Shopping" },
      { kw: `how to use ${base} for free`, engine: "Questions" },
      { kw: `${base} vs alternatives`, engine: "Google" },
      { kw: `why ${base} improves workflow`, engine: "Questions" },
      { kw: `${base} complete guide`, engine: "Google" }
    ];

    return modifiers.map((m) => {
      const h = hashSeed(m.kw);
      const vol = 1200 + (h % 28000);
      const cpc = (1.15 + ((h % 680) / 100)).toFixed(2);
      const sd = 18 + (h % 58);
      return {
        keyword: m.kw,
        engine: m.engine,
        volume: vol,
        cpc: `$${cpc}`,
        sd
      };
    });
  }

  function injectKeywordWidget() {
    if (document.getElementById("ubersuggest-widget")) return;
    const list = generateKeywords("");
    const widget = document.createElement("div");
    widget.id = "ubersuggest-widget";
    widget.innerHTML = `
      <div class="us-head">
        <span>💡 UberSuggest Keyword Multiplier</span>
        <span>Vol • CPC • SD</span>
      </div>
      ${list
        .slice(0, 4)
        .map(
          (k) => `
        <div class="us-row">
          <span><strong>${k.keyword}</strong> <em>(${k.engine})</em></span>
          <span style="color:#fcd34d;">${k.volume.toLocaleString()}/mo • ${k.cpc} • SD ${k.sd}</span>
        </div>
      `
        )
        .join("")}
    `;
    const target = document.querySelector("#secondary") || document.querySelector("main") || document.body;
    target.prepend(widget);
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === "UBERSUGGEST_MULTIPLY") {
      const kws = generateKeywords(msg.seed || "");
      sendResponse({ ok: true, keywords: kws });
      return true;
    }
  });

  injectKeywordWidget();
})();
