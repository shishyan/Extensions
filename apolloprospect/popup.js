let activeLead = {
  name: "Alex Rivera",
  title: "Chief Technology Officer (CTO)",
  seniority: "C-Suite / Founder",
  department: "Engineering & Product",
  email: "alex.rivera@enterprise-ai.io",
  phone: "+14158902310",
  company: "Enterprise AI",
  domain: "enterprise-ai.io",
  permutations: [
    { email: "alex.rivera@enterprise-ai.io", confidence: "96%" },
    { email: "alex@enterprise-ai.io", confidence: "89%" },
    { email: "arivera@enterprise-ai.io", confidence: "81%" }
  ]
};
let savedLeads = [];
const activeLeadBox = document.getElementById("activeLeadBox");
const crmList = document.getElementById("crmList");
const crmCount = document.getElementById("crmCount");

function renderActive(lead) {
  if (lead) activeLead = lead;
  const perms = (activeLead.permutations || []).slice(0, 3).map((p) => p.email).join(" • ");
  activeLeadBox.innerHTML = `
    <div><strong style="color:#fbbf24;font-size:13px;">${activeLead.name}</strong> • ${activeLead.title}</div>
    <div style="color:#93c5fd;">🏷️ ${activeLead.seniority} • 🏢 ${activeLead.company} (${activeLead.department})</div>
    <div style="color:#34d399;font-weight:700;">✉️ ${activeLead.email} &nbsp;|&nbsp; 📞 ${activeLead.phone || "+14158902310"}</div>
    <div style="color:#94a3b8;font-size:10px;margin-top:2px;">Permutations: ${perms || activeLead.email}</div>
  `;
}

function renderSaved() {
  crmCount.textContent = `${savedLeads.length} Lead(s)`;
  crmList.innerHTML = savedLeads
    .map(
      (l, i) =>
        `<div style="padding:4px 0;border-bottom:1px solid #334155;display:flex;justify-content:space-between;align-items:center;">
          <div><strong>${i + 1}. ${l.name}</strong> (${l.title}) — <span style="color:#60a5fa">${l.email}</span> <span style="color:#94a3b8">[${l.company}]</span></div>
        </div>`
    )
    .join("") || "No prospects saved yet.";
}

renderActive(activeLead);

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs && tabs[0];
  if (!tab || !tab.id) return;
  chrome.tabs.sendMessage(tab.id, { type: "APOLLO_INSPECT_PAGE" }, (res) => {
    if (!chrome.runtime.lastError && res && res.ok && res.lead) {
      renderActive(res.lead);
    }
  });
});

chrome.runtime.sendMessage({ type: "APOLLO_GET_LEADS" }, (res) => {
  if (!chrome.runtime.lastError && res && res.ok) {
    savedLeads = res.leads || [];
    renderSaved();
  }
});

document.getElementById("saveLeadBtn").addEventListener("click", () => {
  if (!activeLead) return;
  chrome.runtime.sendMessage({ type: "APOLLO_SAVE_LEAD", lead: activeLead }, (res) => {
    if (res && res.ok) {
      savedLeads = res.leads || savedLeads;
      renderSaved();
      document.getElementById("saveLeadBtn").textContent = "✅ Saved to CRM!";
    }
  });
});

document.getElementById("exportCsvBtn").addEventListener("click", () => {
  const rows = savedLeads.length ? savedLeads : [activeLead];
  const csv = [
    "Name,Title,Seniority,Department,Email,Phone,Company,Domain",
    ...rows.map((l) => `"${l.name || ""}","${l.title || ""}","${l.seniority || ""}","${l.department || ""}","${l.email || ""}","${l.phone || ""}","${l.company || ""}","${l.domain || ""}"`)
  ].join("\n");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(csv).catch(() => {});
  }
  try {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "apolloprospect-crm-leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  } catch (_) {}
  document.getElementById("exportCsvBtn").textContent = "✅ CSV Exported!";
});

document.getElementById("clearCrmBtn").addEventListener("click", () => {
  chrome.storage.local.set({ apolloLeads: [] }, () => {
    savedLeads = [];
    renderSaved();
  });
});
