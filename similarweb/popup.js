let latest = {
  domain: "example.com",
  tier: "Tier 1 Global Leader",
  monthlyVisits: "2.4M",
  bounceRate: "36%",
  pagesPerVisit: "4.4",
  avgDuration: "04:18",
  channels: { direct: "38%", search: "42%", social: "12%", referrals: "8%" }
};

function render(d) {
  if (d && d.monthlyVisits) latest = d;
  document.getElementById("vVal").textContent = latest.monthlyVisits;
  document.getElementById("bVal").textContent = latest.bounceRate;
  document.getElementById("pVal").textContent = latest.pagesPerVisit;
  document.getElementById("dVal").textContent = latest.avgDuration;
}

if (chrome.tabs && chrome.tabs.query) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "SIMILARWEB_GET_DATA" }, (res) => {
        if (!chrome.runtime.lastError && res) render(res);
      });
    }
  });
}

document.getElementById("copyBtn").addEventListener("click", () => {
  const txt = `SimilarWeb Intelligence (${latest.domain}): Visits ${latest.monthlyVisits}/mo | Bounce ${latest.bounceRate} | Pages/Visit ${latest.pagesPerVisit} | Duration ${latest.avgDuration}`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(txt).catch(() => {});
  }
  document.getElementById("copyBtn").textContent = "✅ Domain Report Copied!";
});
