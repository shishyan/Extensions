let harvested = {
  name: "Alex Rivera",
  title: "CTO",
  company: "Enterprise AI",
  domain: "enterprise-ai.io",
  emails: ["alex.rivera@enterprise-ai.io", "alex@enterprise-ai.io", "arivera@enterprise-ai.io"],
  topic: "AI Automation"
};
let dripSeq = [];
let savedLeads = [];

const emailsBox = document.getElementById("emailsBox");
const dripBox = document.getElementById("dripBox");

chrome.storage.local.get({ snov_crm_leads: [] }, (res) => {
  savedLeads = Array.isArray(res.snov_crm_leads) ? res.snov_crm_leads : [];
});

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs && tabs[0];
  if (!tab || !tab.id) return;
  chrome.tabs.sendMessage(tab.id, { type: "SNOV_HARVEST" }, (res) => {
    if (!chrome.runtime.lastError && res && res.ok) {
      harvested = res;
      emailsBox.textContent = (res.emails || []).join(" • ");
      chrome.runtime.sendMessage({ type: "SNOV_BUILD_DRIP", domain: res.domain, topic: res.topic }, (dRes) => {
        if (dRes && dRes.ok) {
          dripSeq = dRes.sequence || [];
          dripBox.textContent = dripSeq.map((s) => `[${s.step}]\nSubject: ${s.subject}\n${s.body}`).join("\n\n---\n\n");
        }
      });
    }
  });
});

document.getElementById("copyDripBtn").addEventListener("click", () => {
  const txt = dripBox.textContent;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(txt).catch(() => {});
  }
  document.getElementById("copyDripBtn").textContent = "✅ Copied Drip!";
});

document.getElementById("saveCrmBtn").addEventListener("click", () => {
  savedLeads.unshift(harvested);
  chrome.storage.local.set({ snov_crm_leads: savedLeads.slice(0, 60) }, () => {
    document.getElementById("saveCrmBtn").textContent = `✅ Saved (${savedLeads.length})`;
  });
});

document.getElementById("exportCsvBtn").addEventListener("click", () => {
  const csv = [
    "Email,Domain,Executive,Title",
    ...(harvested.emails || []).map((e) => `"${e}","${harvested.domain}","${harvested.name || ""}","${harvested.title || ""}"`)
  ].join("\n");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(csv).catch(() => {});
  }
  document.getElementById("exportCsvBtn").textContent = "✅ Copied CSV!";
});
