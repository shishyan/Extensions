const noteBox = document.getElementById("noteBox");
const charCounter = document.getElementById("charCounter");
let enrichedProfile = {};

function updateCount() {
  const len = noteBox.value.length;
  charCounter.textContent = `${len} / 300 chars`;
  charCounter.style.color = len <= 300 ? "#34d399" : "#ef4444";
}

noteBox.addEventListener("input", updateCount);

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs && tabs[0];
  if (!tab || !tab.id) return;
  chrome.tabs.sendMessage(tab.id, { type: "KASPR_ENRICH" }, (res) => {
    if (!chrome.runtime.lastError && res && res.ok) {
      enrichedProfile = res;
      noteBox.value = res.note;
      updateCount();
    }
  });
});

document.getElementById("copyNoteBtn").addEventListener("click", () => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(noteBox.value).catch(() => {});
  }
  document.getElementById("copyNoteBtn").textContent = "✅ Copied Invite Note!";
});

document.getElementById("exportJsonBtn").addEventListener("click", () => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(JSON.stringify(enrichedProfile, null, 2)).catch(() => {});
  }
  document.getElementById("exportJsonBtn").textContent = "✅ Copied JSON!";
});

updateCount();
