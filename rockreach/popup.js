let graphData = {
  name: "Alex Rivera",
  title: "CTO",
  company: "Enterprise AI",
  domain: "enterprise-ai.io",
  patterns: [
    { email: "alex.rivera@enterprise-ai.io", confidence: "96% (Verified Pattern)" },
    { email: "alex@enterprise-ai.io", confidence: "89% (Executive Alias)" },
    { email: "arivera@enterprise-ai.io", confidence: "81% (Standard Corporate)" }
  ],
  profiles: ["https://linkedin.com/in/alex-rivera", "https://github.com/alexrivera"],
  icebreaker: "Hi Alex — saw your recent work on enterprise AI infrastructure and wanted to share a 2-minute benchmark."
};
let savedLeads = [];

function render(res) {
  if (res) graphData = res;
  document.getElementById("patternsBox").innerHTML = (graphData.patterns || [])
    .map((p) => `<div><strong>${p.email}</strong> — <span style="color:#34d399">${p.confidence}</span></div>`)
    .join("");
  document.getElementById("profilesBox").textContent = (graphData.profiles || []).join("\n");
  document.getElementById("icebreakerBox").textContent = graphData.icebreaker || "";
}

render(graphData);

chrome.storage.local.get({ rockreach_leads: [] }, (res) => {
  savedLeads = Array.isArray(res.rockreach_leads) ? res.rockreach_leads : [];
});

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs && tabs[0];
  if (!tab || !tab.id) return;
  chrome.tabs.sendMessage(tab.id, { type: "ROCKREACH_MAP" }, (res) => {
    if (!chrome.runtime.lastError && res && res.ok) {
      render(res);
    }
  });
});

document.getElementById("copyIcebreakerBtn").addEventListener("click", () => {
  const topEmail = graphData.patterns?.[0]?.email || "alex.rivera@enterprise-ai.io";
  const text = `To: ${topEmail}\n\n${graphData.icebreaker || ""}`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => {});
  }
  document.getElementById("copyIcebreakerBtn").textContent = "✅ Copied!";
});

document.getElementById("saveLeadBtn").addEventListener("click", () => {
  savedLeads.unshift(graphData);
  chrome.storage.local.set({ rockreach_leads: savedLeads.slice(0, 60) }, () => {
    document.getElementById("saveLeadBtn").textContent = `✅ Saved (${savedLeads.length})`;
  });
});

document.getElementById("exportCsvBtn").addEventListener("click", () => {
  const rows = savedLeads.length ? savedLeads : [graphData];
  const csv = [
    "Name,Title,Company,PrimaryEmail,SocialProfiles,Icebreaker",
    ...rows.map((r) => `"${r.name || ""}","${r.title || ""}","${r.company || ""}","${r.patterns?.[0]?.email || ""}","${(r.profiles || []).join(" | ")}","${(r.icebreaker || "").replace(/"/g, '""')}"`)
  ].join("\n");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(csv).catch(() => {});
  }
  document.getElementById("exportCsvBtn").textContent = "✅ CSV!";
});
