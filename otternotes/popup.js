let logEntries = [];
let filterMode = "all";
const logBox = document.getElementById("logBox");
const noteInput = document.getElementById("noteInput");
const tabs = Array.from(document.querySelectorAll(".tab"));

function renderLog() {
  const list = filterMode === "actions" ? logEntries.filter((e) => e.isAction) : logEntries;
  if (!list.length) {
    logBox.innerHTML = `<div style="color:#94a3b8;padding:10px;">No entries in this view yet.</div>`;
    return;
  }
  logBox.innerHTML = list
    .map(
      (e) => `
      <div class="entry ${e.isAction ? "action" : ""}">
        <div style="font-size:10px;color:#94a3b8;display:flex;justify-content:space-between;">
          <span><strong>${e.speaker}</strong> • ${e.time}</span>
          ${e.isAction ? '<span style="color:#34d399;font-weight:700;">⚡ ACTION ITEM</span>' : ""}
        </div>
        <div style="color:#f1f5f9;margin-top:2px;">${e.text}</div>
      </div>`
    )
    .join("");
}

function refreshLog() {
  chrome.runtime.sendMessage({ type: "OTTER_GET_LOG" }, (res) => {
    if (!chrome.runtime.lastError && res && res.ok) {
      logEntries = res.log || [];
      renderLog();
    }
  });
}

tabs.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabs.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    filterMode = btn.getAttribute("data-filter") || "all";
    renderLog();
  });
});

document.getElementById("addNoteBtn").addEventListener("click", () => {
  const text = noteInput.value.trim();
  if (!text) return;
  chrome.runtime.sendMessage({ type: "OTTER_ADD_NOTE", speaker: "Manual Note", text }, (res) => {
    if (!chrome.runtime.lastError && res && res.ok) {
      noteInput.value = "";
      logEntries = res.log || [];
      renderLog();
    }
  });
});

document.getElementById("recordTabBtn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabList) => {
    const tab = tabList && tabList[0];
    if (!tab || !tab.id) return;
    chrome.tabs.sendMessage(tab.id, { type: "OTTER_TOGGLE_RECORD" }, () => {
      setTimeout(refreshLog, 250);
    });
  });
});

document.getElementById("exportMdBtn").addEventListener("click", () => {
  const actions = logEntries.filter((e) => e.isAction);
  const md = [
    `# 🎙️ OtterNotes — Meeting Minutes`,
    `## ⚡ Action Items (${actions.length})`,
    ...(actions.length ? actions.map((a) => `- [ ] **[${a.time}] ${a.speaker}:** ${a.text}`) : ["- None recorded"]),
    ``,
    `## 📝 Full Transcript (${logEntries.length})`,
    ...logEntries.map((e) => `- **[${e.time}] ${e.speaker}:** ${e.text}`)
  ].join("\n");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(md).catch(() => {});
  }
  const btn = document.getElementById("exportMdBtn");
  btn.textContent = "✅ Copied MD!";
  setTimeout(() => (btn.textContent = "📋 Copy Minutes (.MD)"), 1400);
});

document.getElementById("clearBtn").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "OTTER_CLEAR_LOG" }, () => refreshLog());
});

refreshLog();
