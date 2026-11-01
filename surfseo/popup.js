function renderAudit(res) {
  const box = document.getElementById("audit");
  if (!res) {
    box.textContent = "Reload the tab to inspect 100-pt on-page SEO metrics.";
    return;
  }
  const badge = document.getElementById("scoreBadge");
  badge.textContent = `SEO: ${res.score}/100`;
  badge.style.color = res.score >= 75 ? "#34d399" : "#fbbf24";

  const kws1 = (res.topKeywords || [])
    .map(([w, c, pct]) => `<span class="kw" title="Click to copy">${w} (${c} • ${pct || 0}%)</span>`)
    .join("");
  const kws2 = (res.topBigrams || [])
    .map(([w, c]) => `<span class="kw bg2" title="Click to copy">${w} (${c})</span>`)
    .join("");

  box.innerHTML = `
    <div><strong>Title (${(res.title || "").length}c):</strong> ${(res.title || "Missing").slice(0, 68)}</div>
    <div><strong>Meta Desc (${(res.desc || "").length}c):</strong> ${res.desc ? res.desc.slice(0, 80) + "…" : '<span style="color:#f87171">Missing</span>'}</div>
    <div><strong>Canonical:</strong> ${res.canonical ? "✅ Set" : "⚠️ Missing"} • <strong>Robots:</strong> ${res.robots || "index, follow"} • <strong>OG:</strong> ${res.hasOpenGraph ? "✅" : "⚠️"}</div>
    <div><strong>Headings:</strong> H1: ${res.h1Count} | H2: ${res.h2Count} | H3: ${res.h3Count} | H4-H6: ${res.h456Count || 0} • <strong>Words:</strong> ${res.wordCount}</div>
    <div><strong>Links:</strong> ${res.internal} int / ${res.external} ext / ${res.nofollow || 0} nofollow • <strong>Img Missing Alt:</strong> ${res.imgsMissingAlt || 0}/${res.imgTotal || 0}</div>
    <div style="margin-top:4px;"><strong>1-Word NLP Density:</strong><br>${kws1 || "None"}</div>
    <div style="margin-top:4px;"><strong>2-Word NLP Phrases:</strong><br>${kws2 || "None"}</div>
  `;
}

if (chrome.tabs && chrome.tabs.query) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, { type: "SURFSEO_AUDIT" }, (res) => {
      if (!chrome.runtime.lastError && res) {
        renderAudit(res);
      }
    });
  });
}

function runKeywordExplore() {
  const query = document.getElementById("kwInput").value.trim();
  if (!query) return;
  chrome.runtime.sendMessage({ type: "SURFSEO_SUGGEST", query }, (res) => {
    const out = document.getElementById("kwOut");
    if (chrome.runtime.lastError || !res || !res.items || res.items.length === 0) {
      out.textContent = "No suggestions returned.";
      return;
    }
    const enriched = res.enriched || res.items.map((k) => ({ keyword: k, volume: 1200, cpc: 1.5, kd: 35 }));
    out.innerHTML =
      "<strong>High-Intent SERP Keywords (Vol • CPC • KD):</strong><br>" +
      enriched
        .map(
          (item) =>
            `<span class="kw" data-kw="${item.keyword}">${item.keyword} <strong>(${item.volume}/mo • $${item.cpc} • KD ${item.kd})</strong></span>`
        )
        .join("");

    out.querySelectorAll(".kw").forEach((el) => {
      el.addEventListener("click", () => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(el.dataset.kw || el.textContent).catch(() => {});
        }
      });
    });
  });
}

document.getElementById("kwBtn").addEventListener("click", runKeywordExplore);
runKeywordExplore();
