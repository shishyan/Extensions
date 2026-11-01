let lastAudit = null;

if (chrome.tabs && chrome.tabs.query) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "TAG_AUDIT" }, (res) => {
        if (chrome.runtime.lastError || !res) return;
        lastAudit = res;
        document.getElementById("gaCount").textContent = res.ga4Ids.length + res.uaIds.length + res.awIds.length;
        document.getElementById("gtmCount").textContent = res.gtmIds.length;
        document.getElementById("pxCount").textContent = res.pixels.length;

        const lines = [];
        res.ga4Ids.forEach((id) => lines.push(`<div class="row"><span>📊 GA4 Property</span><strong style="color:#38bdf8;">${id}</strong></div>`));
        res.gtmIds.forEach((id) => lines.push(`<div class="row"><span>🏷️ GTM Container</span><strong style="color:#a78bfa;">${id}</strong></div>`));
        res.awIds.forEach((id) => lines.push(`<div class="row"><span>🎯 Google Ads</span><strong style="color:#fbbf24;">${id}</strong></div>`));
        res.uaIds.forEach((id) => lines.push(`<div class="row"><span>🕰️ Legacy UA</span><strong style="color:#94a3b8;">${id}</strong></div>`));
        res.pixels.forEach((px) => lines.push(`<div class="row"><span>🔥 Ad Pixel</span><strong style="color:#34d399;">${px}</strong></div>`));
        lines.push(`<div class="row"><span>📦 dataLayer.push() Calls</span><strong>${res.dlCalls}</strong></div>`);
        lines.push(`<div class="row"><span>🍪 Analytics Cookies</span><strong>${res.trackingCookies.join(", ") || "None"}</strong></div>`);

        document.getElementById("tagList").innerHTML = lines.join("");
      });
    }
  });
}

document.getElementById("copyBtn").addEventListener("click", () => {
  if (!lastAudit) return;
  navigator.clipboard.writeText(JSON.stringify(lastAudit, null, 2));
  document.getElementById("copyBtn").textContent = "✅ Tag Audit Copied!";
  setTimeout(() => (document.getElementById("copyBtn").textContent = "📋 Copy Tag Audit JSON"), 1300);
});
