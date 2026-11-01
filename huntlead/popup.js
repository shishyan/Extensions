let currentData = { domain: "page", emails: [], phones: [], socials: [], pattern: "{first}.{last}@company.com", confidence: 75 };
let savedLeads = [];

function render(data) {
  currentData = data || currentData;
  document.getElementById("eCount").textContent = currentData.emails.length;
  document.getElementById("pCount").textContent = currentData.phones.length;
  document.getElementById("sCount").textContent = currentData.socials.length;
  document.getElementById("patVal").textContent = currentData.pattern || "{first}.{last}@" + (currentData.domain || "domain.com");
  document.getElementById("confVal").textContent = (currentData.confidence || 75) + "% Conf";

  const items = [
    ...currentData.emails.map((e) => `<div class="row"><span>📧 ${e}</span><span style="color:#34d399;font-size:9.5px;">Verified</span></div>`),
    ...currentData.phones.map((p) => `<div class="row"><span>📞 ${p}</span><span style="color:#94a3b8;font-size:9.5px;">Phone</span></div>`),
    ...currentData.socials.map((s) => `<div class="row"><span>🔗 ${s}</span><span style="color:#38bdf8;font-size:9.5px;">Profile</span></div>`)
  ];

  document.getElementById("leadList").innerHTML = items.length
    ? items.join("")
    : "<span style='color:#94a3b8;'>No direct contacts on this page. Inferred pattern above can be used to reach decision makers.</span>";
}

function loadSavedLeads() {
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(["huntlead_saved"], (res) => {
      savedLeads = Array.isArray(res.huntlead_saved) ? res.huntlead_saved : [];
      document.getElementById("savedCount").textContent = savedLeads.length;
    });
  }
}

if (chrome.tabs && chrome.tabs.query) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "HUNTLEAD_SCAN" }, (res) => {
        if (!chrome.runtime.lastError && res) render(res);
      });
    }
  });
}
loadSavedLeads();

document.getElementById("saveLeadBtn").addEventListener("click", () => {
  const entry = {
    domain: currentData.domain,
    pattern: currentData.pattern,
    confidence: currentData.confidence,
    emails: currentData.emails,
    phones: currentData.phones,
    socials: currentData.socials,
    savedAt: new Date().toISOString()
  };
  savedLeads.unshift(entry);
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ huntlead_saved: savedLeads.slice(0, 200) });
  }
  document.getElementById("savedCount").textContent = savedLeads.length;
  document.getElementById("saveLeadBtn").textContent = "✅ Saved!";
  setTimeout(() => (document.getElementById("saveLeadBtn").textContent = "💾 Save Lead"), 1200);
});

document.getElementById("csvBtn").addEventListener("click", () => {
  const rows = [["Domain", "Email Pattern", "Confidence", "Type", "Value"]];
  currentData.emails.forEach((e) => rows.push([currentData.domain, currentData.pattern, currentData.confidence + "%", "Email", e]));
  currentData.phones.forEach((p) => rows.push([currentData.domain, currentData.pattern, currentData.confidence + "%", "Phone", p]));
  currentData.socials.forEach((s) => rows.push([currentData.domain, currentData.pattern, currentData.confidence + "%", "Social", s]));
  savedLeads.forEach((lead) => {
    (lead.emails || []).forEach((e) => rows.push([lead.domain, lead.pattern, (lead.confidence || 80) + "%", "SavedEmail", e]));
  });
  const csv = rows.map((r) => r.map((v) => `"${String(v || "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `huntlead-${currentData.domain || "leads"}.csv`;
  a.click();
});

document.getElementById("copyAllBtn").addEventListener("click", () => {
  const txt = [
    `Domain: ${currentData.domain} (Pattern: ${currentData.pattern} - ${currentData.confidence}% confidence)`,
    ...currentData.emails,
    ...currentData.phones,
    ...currentData.socials
  ].join("\n");
  navigator.clipboard.writeText(txt);
  document.getElementById("copyAllBtn").textContent = "✅ Copied!";
  setTimeout(() => (document.getElementById("copyAllBtn").textContent = "📋 Copy All"), 1200);
});
