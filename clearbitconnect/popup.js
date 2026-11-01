let latest = {
  companyName: "Enterprise AI Corp",
  domain: "enterprise-ai.io",
  industry: "B2B SaaS & Cloud Software",
  employees: "51–250 Employees",
  estArr: "$10M–$25M ARR",
  emailProvider: "Google Workspace",
  keyContact: "Alex Rivera",
  keyTitle: "CTO",
  keyEmail: "alex.rivera@enterprise-ai.io"
};
let savedList = [];

function render(d) {
  if (d && d.companyName) latest = d;
  document.getElementById("coVal").textContent = latest.companyName;
  document.getElementById("domVal").textContent = latest.domain;
  document.getElementById("indVal").textContent = latest.industry;
  document.getElementById("empVal").textContent = latest.employees;
  document.getElementById("arrVal").textContent = latest.estArr;
  document.getElementById("execVal").textContent = `${latest.keyContact || "Alex Rivera"} (${latest.keyTitle || "CTO"})`;
  document.getElementById("emailVal").textContent = latest.keyEmail || `alex.rivera@${latest.domain}`;
}

chrome.storage.local.get({ clearbit_crm_leads: [] }, (res) => {
  savedList = Array.isArray(res.clearbit_crm_leads) ? res.clearbit_crm_leads : [];
});

if (chrome.tabs && chrome.tabs.query) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "CLEARBIT_GET_FIRMOGRAPHICS" }, (res) => {
        if (!chrome.runtime.lastError && res) render(res);
      });
    }
  });
}

document.getElementById("saveCrmBtn").addEventListener("click", () => {
  savedList.unshift(latest);
  chrome.storage.local.set({ clearbit_crm_leads: savedList.slice(0, 60) }, () => {
    document.getElementById("saveCrmBtn").textContent = `✅ Saved (${savedList.length})!`;
  });
});

document.getElementById("copyBtn").addEventListener("click", () => {
  const rows = savedList.length ? savedList : [latest];
  const csv = [
    "Company,Domain,Industry,Employees,EstARR,Executive,Title,Email",
    ...rows.map((r) => `"${r.companyName || ""}","${r.domain || ""}","${r.industry || ""}","${r.employees || ""}","${r.estArr || ""}","${r.keyContact || ""}","${r.keyTitle || ""}","${r.keyEmail || ""}"`)
  ].join("\n");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(csv).catch(() => {});
  }
  document.getElementById("copyBtn").textContent = "✅ CSV Copied!";
});
