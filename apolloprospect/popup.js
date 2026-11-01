let activeLead = null;
let savedLeads = [];
const activeLeadBox = document.getElementById("activeLeadBox");
const crmList = document.getElementById("crmList");

function renderSaved() {
  crmList.innerHTML = savedLeads
    .map(
      (l, i) =>
        `<div style="padding:4px 0;border-bottom:1px solid #334155;"><strong>${i + 1}. ${l.name}</strong> (${l.title}) — <span style="color:#60a5fa">${l.email}</span></div>`
    )
    .join("");
}

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs && tabs[0];
  if (!tab || !tab.id) return;
  chrome.tabs.sendMessage(tab.id, { type: "APOLLO_INSPECT_PAGE" }, (res) => {
    if (!chrome.runtime.lastError && res && res.ok && res.lead) {
      activeLead = res.lead;
      activeLeadBox.innerHTML = `
        <div><strong style="color:#fbbf24;font-size:13px;">${activeLead.name}</strong> • ${activeLead.title}</div>
        <div style="color:#93c5fd;">🏷️ ${activeLead.seniority} • 🏢 ${activeLead.department}</div>
        <div style="color:#34d399;font-weight:700;">✉️ ${activeLead.email}</div>
      `;
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
  const csv = [
    "Name,Title,Seniority,Department,Email,Company",
    ...savedLeads.map((l) => `"${l.name}","${l.title}","${l.seniority}","${l.department}","${l.email}","${l.company}"`)
  ].join("\n");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(csv).catch(() => {});
  }
  document.getElementById("exportCsvBtn").textContent = "✅ Copied CSV!";
});
