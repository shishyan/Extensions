let auditData = null;

if (chrome.tabs && chrome.tabs.query) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "MOZ_ANALYZE" }, (res) => {
        if (chrome.runtime.lastError || !res) return;
        auditData = res;
        document.getElementById("daVal").textContent = res.da;
        document.getElementById("paVal").textContent = res.pa;
        document.getElementById("spamVal").textContent = res.spamScore + "%";
        document.getElementById("schemaVal").textContent = res.schemaTypes.length || 0;

        document.getElementById("metaCard").innerHTML = `
          <div class="row"><span>Title (${res.titleLen}c / ${res.titlePixels}px):</span><strong>${res.titlePixels <= 580 ? '✅ Optimal' : '⚠️ Truncates'}</strong></div>
          <div class="row"><span>Meta Desc (${res.descLen}c / ${res.descPixels}px):</span><strong>${res.descPixels <= 920 && res.descLen > 50 ? '✅ Optimal' : '⚠️ Check'}</strong></div>
          <div class="row"><span>Canonical Tag:</span><strong style="max-width:190px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${res.canonical}</strong></div>
          <div class="row"><span>Meta Robots:</span><strong>${res.robots}</strong></div>
          <div class="row"><span>Headings (H1 / H2 / H3):</span><strong>${res.h1Count} / ${res.h2Count} / ${res.h3Count}</strong></div>
          <div class="row"><span>Links (Dofollow / Nofollow):</span><strong style="color:#34d399;">${res.dofollow} DF / <span style="color:#f87171;">${res.nofollow} NF</span></strong></div>
          <div class="row"><span>Internal vs External Links:</span><strong>${res.internal} Int / ${res.external} Ext</strong></div>
          <div class="row"><span>Images Missing Alt:</span><strong>${res.missingAlt} / ${res.imgCount}</strong></div>
        `;
      });
    }
  });
}

document.getElementById("hlBtn").addEventListener("click", () => {
  if (chrome.tabs && chrome.tabs.query) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) chrome.tabs.sendMessage(tabs[0].id, { type: "MOZ_HIGHLIGHT_LINKS" });
    });
  }
});

document.getElementById("csvBtn").addEventListener("click", () => {
  if (!auditData) return;
  const rows = [
    ["Metric", "Value"],
    ["Domain", auditData.domain],
    ["DA", auditData.da],
    ["PA", auditData.pa],
    ["Spam Score", auditData.spamScore + "%"],
    ["Title Length", auditData.titleLen + " chars (" + auditData.titlePixels + "px)"],
    ["Meta Desc Length", auditData.descLen + " chars (" + auditData.descPixels + "px)"],
    ["Canonical", auditData.canonical],
    ["Robots", auditData.robots],
    ["Dofollow Links", auditData.dofollow],
    ["Nofollow Links", auditData.nofollow],
    ["Internal Links", auditData.internal],
    ["External Links", auditData.external]
  ];
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = `mozauthority-${auditData.domain}.csv`;
  a.click();
});

document.getElementById("mdBtn").addEventListener("click", () => {
  if (!auditData) return;
  const md = `# MozAuthority SEO Report (${auditData.domain})\n- DA: ${auditData.da} | PA: ${auditData.pa} | Spam: ${auditData.spamScore}%\n- Title: ${auditData.title} (${auditData.titleLen}c / ${auditData.titlePixels}px)\n- Canonical: ${auditData.canonical}\n- Links: ${auditData.dofollow} Dofollow, ${auditData.nofollow} Nofollow (${auditData.internal} Int / ${auditData.external} Ext)`;
  navigator.clipboard.writeText(md);
  document.getElementById("mdBtn").textContent = "✅ Copied";
  setTimeout(() => (document.getElementById("mdBtn").textContent = "📋 Copy MD"), 1200);
});
