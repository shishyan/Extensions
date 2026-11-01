let currentContact = {
  name: "Alex Rivera",
  title: "CTO",
  company: "Enterprise AI",
  domain: "enterprise-ai.io",
  phones: ["+14158902310"],
  emails: ["alex.rivera@enterprise-ai.io", "alex@enterprise-ai.io", "arivera@enterprise-ai.io"]
};
let savedList = [];

const phonesBox = document.getElementById("phonesBox");
const emailsBox = document.getElementById("emailsBox");
const crmBox = document.getElementById("crmBox");
const savedCount = document.getElementById("savedCount");

function renderCrm() {
  savedCount.textContent = String(savedList.length);
  crmBox.innerHTML = savedList
    .map((c, idx) => `<div><strong>${idx + 1}. ${c.name}</strong> (${c.company || c.domain}) — ${(c.phones || [])[0] || ""} | ${(c.emails || [])[0] || ""}</div>`)
    .join("") || "No saved contacts yet.";
}

chrome.storage.local.get({ lusha_crm_leads: [] }, (res) => {
  savedList = Array.isArray(res.lusha_crm_leads) ? res.lusha_crm_leads : [];
  renderCrm();
});

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs && tabs[0];
  if (!tab || !tab.id) return;
  chrome.tabs.sendMessage(tab.id, { type: "LUSHA_SCAN" }, (res) => {
    if (!chrome.runtime.lastError && res && res.ok) {
      currentContact = res;
      document.getElementById("contactName").textContent = res.name || "Executive Contact";
      document.getElementById("contactRole").textContent = `${res.title || "Executive"} @ ${res.company || res.domain || "Company"}`;
      phonesBox.textContent = (res.phones || []).join(" • ");
      emailsBox.textContent = (res.emails || []).join(" • ");
    }
  });
});

document.getElementById("saveCrmBtn").addEventListener("click", () => {
  savedList.unshift(currentContact);
  savedList = savedList.slice(0, 60);
  chrome.storage.local.set({ lusha_crm_leads: savedList }, () => {
    renderCrm();
    document.getElementById("saveCrmBtn").textContent = "✅ Saved!";
  });
});

document.getElementById("dlVcfBtn").addEventListener("click", () => {
  const vcf = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${currentContact.name}`,
    `ORG:${currentContact.company || currentContact.domain || ""}`,
    `TITLE:${currentContact.title || ""}`,
    `TEL;TYPE=WORK,VOICE:${(currentContact.phones || [])[0] || ""}`,
    `EMAIL;TYPE=PREF,INTERNET:${(currentContact.emails || [])[0] || ""}`,
    "END:VCARD"
  ].join("\r\n");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(vcf).catch(() => {});
  }
  document.getElementById("dlVcfBtn").textContent = "✅ .VCF!";
});

document.getElementById("exportCsvBtn").addEventListener("click", () => {
  const rows = savedList.length ? savedList : [currentContact];
  const csv = [
    "Name,Title,Company,Phone,Email",
    ...rows.map((c) => `"${c.name || ""}","${c.title || ""}","${c.company || ""}","${(c.phones || [])[0] || ""}","${(c.emails || [])[0] || ""}"`)
  ].join("\n");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(csv).catch(() => {});
  }
  document.getElementById("exportCsvBtn").textContent = "✅ CSV!";
});
