let latestRows = [];
const scrapeOutput = document.getElementById("scrapeOutput");
const macroSummary = document.getElementById("macroSummary");
const monitorsOutput = document.getElementById("monitorsOutput");
const macroButtons = Array.from(document.querySelectorAll(".macro-btn"));

function runMacro(macroName) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    if (!tab || !tab.id) return;
    chrome.tabs.sendMessage(tab.id, { type: "HARPA_RUN_MACRO", macro: macroName }, (res) => {
      if (!chrome.runtime.lastError && res && res.ok) {
        latestRows = res.rows || [];
        macroSummary.textContent = res.summary || "";
        scrapeOutput.textContent = latestRows
          .map((r) => Object.values(r).join(" — "))
          .join("\n");
      } else {
        scrapeOutput.textContent = "Ready — Click any macro tab on an active webpage.";
      }
    });
  });
}

function refreshMonitors() {
  chrome.runtime.sendMessage({ type: "HARPA_GET_MONITORS" }, (res) => {
    if (!chrome.runtime.lastError && res && res.ok) {
      const list = res.monitors || [];
      if (list.length === 0) {
        monitorsOutput.textContent = "No watched selectors yet — click 'Pick Element to Monitor'.";
      } else {
        monitorsOutput.textContent = list
          .map((m, i) => `${i + 1}. [${m.selector}] "${m.lastValue}" (${m.title.slice(0, 30)})`)
          .join("\n");
      }
    }
  });
}

macroButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    macroButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    runMacro(btn.getAttribute("data-macro") || "seo");
  });
});

document.getElementById("pickElementBtn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    if (!tab || !tab.id) return;
    chrome.tabs.sendMessage(tab.id, { type: "HARPA_START_PICKER" }, () => {
      // Also record a default monitor snapshot if triggered from popup during quick automation
      chrome.runtime.sendMessage(
        {
          type: "HARPA_ADD_MONITOR",
          url: tab.url || "",
          title: tab.title || "Active Page",
          selector: "h1, .price",
          value: (tab.title || "Monitored Snapshot").slice(0, 80)
        },
        () => refreshMonitors()
      );
    });
  });
});

document.getElementById("clearMonitors").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "HARPA_CLEAR_MONITORS" }, () => refreshMonitors());
});

document.getElementById("exportJsonBtn").addEventListener("click", () => {
  const json = JSON.stringify(latestRows, null, 2);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(json).catch(() => {});
  }
  macroSummary.textContent = "✅ Copied JSON!";
});

document.getElementById("exportCsvBtn").addEventListener("click", () => {
  if (!latestRows.length) return;
  const keys = Object.keys(latestRows[0]);
  const csv = [
    keys.join(","),
    ...latestRows.map((r) => keys.map((k) => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(","))
  ].join("\n");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(csv).catch(() => {});
  }
  macroSummary.textContent = "✅ Copied CSV!";
});

runMacro("seo");
refreshMonitors();
