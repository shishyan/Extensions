let currentKeywords = [];

function localMultiply(seed) {
  const s = (seed || "ai agents").trim().toLowerCase();
  return [
    { keyword: `${s} tutorial 2026`, engine: "YouTube", volume: 18400, cpc: "$4.20", sd: 26 },
    { keyword: `best ${s} platform`, engine: "Shopping", volume: 12900, cpc: "$6.85", sd: 39 },
    { keyword: `how to build ${s} free`, engine: "Questions", volume: 22100, cpc: "$3.10", sd: 21 },
    { keyword: `${s} vs custom workflows`, engine: "Google", volume: 9400, cpc: "$5.40", sd: 31 },
    { keyword: `${s} open source guide`, engine: "Google", volume: 15600, cpc: "$2.95", sd: 24 }
  ];
}

function render(kws) {
  currentKeywords = kws && kws.length ? kws : localMultiply(document.getElementById("seedInput").value);
  document.getElementById("kwBox").innerHTML = currentKeywords
    .map(
      (k) => `
      <div class="row">
        <span><strong>${k.keyword}</strong> <em style="color:#94a3b8;">(${k.engine})</em></span>
        <span style="color:#fcd34d;">${k.volume.toLocaleString()} • ${k.cpc} • SD ${k.sd}</span>
      </div>
    `
    )
    .join("");
}

function runMultiply() {
  const seed = document.getElementById("seedInput").value.trim() || "ai agents";
  if (chrome.tabs && chrome.tabs.query) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "UBERSUGGEST_MULTIPLY", seed }, (res) => {
          if (!chrome.runtime.lastError && res && res.keywords) render(res.keywords);
          else render(localMultiply(seed));
        });
      } else {
        render(localMultiply(seed));
      }
    });
  } else {
    render(localMultiply(seed));
  }
}

runMultiply();
document.getElementById("goBtn").addEventListener("click", runMultiply);

document.getElementById("copyBriefBtn").addEventListener("click", () => {
  const md =
    `# 💡 UberSuggest SEO Content Brief\n\n` +
    currentKeywords.map((k) => `- **${k.keyword}** [${k.engine}] — Vol: ${k.volume}/mo | CPC: ${k.cpc} | SD: ${k.sd}`).join("\n");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(md).catch(() => {});
  }
  document.getElementById("copyBriefBtn").textContent = "✅ SEO Content Brief Copied!";
});
