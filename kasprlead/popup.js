const noteBox = document.getElementById("noteBox");
const charCounter = document.getElementById("charCounter");
let enrichedProfile = {
  name: "Alex Rivera",
  title: "VP Engineering",
  company: "Enterprise AI",
  email: "alex.rivera@enterprise-ai.io",
  phone: "+14158902310",
  note: noteBox.value
};
let savedLeads = [];

function updateCount() {
  const len = noteBox.value.length;
  charCounter.textContent = `${len} / 300 chars`;
  charCounter.style.color = len <= 300 ? "#34d399" : "#ef4444";
}

noteBox.addEventListener("input", updateCount);

chrome.storage.local.get({ kaspr_leads: [] }, (res) => {
  savedLeads = Array.isArray(res.kaspr_leads) ? res.kaspr_leads : [];
});

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs && tabs[0];
  if (!tab || !tab.id) return;
  chrome.tabs.sendMessage(tab.id, { type: "KASPR_ENRICH" }, (res) => {
    if (!chrome.runtime.lastError && res && res.ok) {
      enrichedProfile = res;
      document.getElementById("kName").textContent = res.name;
      document.getElementById("kRole").textContent = `${res.title} @ ${res.company}`;
      document.getElementById("kEmail").textContent = res.email;
      document.getElementById("kPhone").textContent = res.phone;
      noteBox.value = res.note;
      updateCount();
    }
  });
});

document.getElementById("copyNoteBtn").addEventListener("click", () => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(noteBox.value).catch(() => {});
  }
  document.getElementById("copyNoteBtn").textContent = "✅ Copied Invite!";
});

document.getElementById("saveCrmBtn").addEventListener("click", () => {
  savedLeads.unshift({ ...enrichedProfile, note: noteBox.value });
  chrome.storage.local.set({ kaspr_leads: savedLeads.slice(0, 60) }, () => {
    document.getElementById("saveCrmBtn").textContent = `✅ Saved (${savedLeads.length})`;
  });
});

document.getElementById("exportJsonBtn").addEventListener("click", () => {
  const rows = savedLeads.length ? savedLeads : [enrichedProfile];
  const csv = [
    "Name,Title,Company,Email,Phone,ConnectionNote",
    ...rows.map((r) => `"${r.name || ""}","${r.title || ""}","${r.company || ""}","${r.email || ""}","${r.phone || ""}","${(r.note || "").replace(/"/g, '""')}"`)
  ].join("\n");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(csv).catch(() => {});
  }
  document.getElementById("exportJsonBtn").textContent = "✅ CSV!";
});

updateCount();
