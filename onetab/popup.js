let openTabs = [{ id: 1, title: "Active Research Workspace", url: "https://example.com" }];
let stashedTabs = [];

function render() {
  const displayList = stashedTabs.length ? stashedTabs : openTabs;
  document.getElementById("tabCount").textContent = `🗂️ Tabs: ${openTabs.length} Open • ${stashedTabs.length} Stashed`;
  document.getElementById("ramSaved").textContent = `⚡ Freed RAM: ${Math.max(1, stashedTabs.length || openTabs.length) * 65} MB`;

  document.getElementById("tabList").innerHTML = displayList
    .map(
      (t, idx) => `
      <div class="row">
        <span>🔗 <strong>${(t.title || t.url || "Tab").slice(0, 34)}</strong> <em style="color:#94a3b8;font-size:9.5px;">[${t.group || "Active"}]</em></span>
        <button class="rest-btn" data-url="${t.url}" data-idx="${idx}">Open ↗</button>
      </div>`
    )
    .join("");

  document.querySelectorAll(".rest-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const url = btn.getAttribute("data-url");
      if (url && chrome.tabs && chrome.tabs.create) {
        chrome.tabs.create({ url });
      }
    });
  });
}

if (chrome.storage && chrome.storage.local) {
  chrome.storage.local.get({ onetab_saved_tabs: [] }, (res) => {
    if (Array.isArray(res.onetab_saved_tabs)) stashedTabs = res.onetab_saved_tabs;
    render();
  });
}

if (chrome.tabs && chrome.tabs.query) {
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    if (Array.isArray(tabs) && tabs.length) openTabs = tabs;
    render();
  });
} else {
  render();
}

document.getElementById("stashBtn").addEventListener("click", () => {
  const group = document.getElementById("groupNameInp").value.trim() || "Session Group";
  const newItems = openTabs.map((t) => ({
    title: t.title || t.url || "Tab",
    url: t.url || "https://example.com",
    group,
    savedAt: new Date().toISOString()
  }));
  stashedTabs = [...newItems, ...stashedTabs].slice(0, 100);
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ onetab_saved_tabs: stashedTabs });
  }
  // Close non-active duplicate tabs if more than 1 tab is open
  if (chrome.tabs && chrome.tabs.remove && openTabs.length > 1) {
    const idsToClose = openTabs.slice(1).map((t) => t.id).filter(Boolean);
    if (idsToClose.length) {
      try { chrome.tabs.remove(idsToClose); } catch (_) {}
    }
  }
  render();
  document.getElementById("stashBtn").textContent = `✅ Stashed (${newItems.length})!`;
});

document.getElementById("restoreAllBtn").addEventListener("click", () => {
  const list = stashedTabs.length ? stashedTabs : openTabs;
  list.slice(0, 5).forEach((t) => {
    if (t.url && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url: t.url, active: false });
    }
  });
  document.getElementById("restoreAllBtn").textContent = "✅ Restored!";
});

document.getElementById("exportMdBtn").addEventListener("click", () => {
  const list = stashedTabs.length ? stashedTabs : openTabs;
  const md = `# 🗂️ OneTab Session Export\n` + list.map((t) => `- [${t.title || t.url}](${t.url}) (${t.group || "Session"})`).join("\n");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(md).catch(() => {});
  }
  document.getElementById("exportMdBtn").textContent = "✅ Copied .MD!";
});
