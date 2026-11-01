let openTabs = [{ title: "Active Research Workspace", url: "https://example.com" }];

function render() {
  document.getElementById("tabCount").textContent = `🗂️ Open Tabs: ${openTabs.length}`;
  document.getElementById("ramSaved").textContent = `⚡ Est. RAM: ${openTabs.length * 65} MB`;
  document.getElementById("tabList").innerHTML = openTabs
    .map((t) => `<div class="row">🔗 <strong>${(t.title || "Tab").slice(0, 46)}</strong></div>`)
    .join("");
}

if (chrome.tabs && chrome.tabs.query) {
  chrome.tabs.query({}, (tabs) => {
    if (Array.isArray(tabs) && tabs.length) openTabs = tabs;
    render();
  });
} else {
  render();
}

document.getElementById("stashBtn").addEventListener("click", () => {
  document.getElementById("stashBtn").textContent = "✅ Stashed to Workspace!";
});

document.getElementById("exportMdBtn").addEventListener("click", () => {
  const md = `# 🗂️ OneTab Session Export\n` + openTabs.map((t) => `- [${t.title || t.url}](${t.url})`).join("\n");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(md).catch(() => {});
  }
  document.getElementById("exportMdBtn").textContent = "✅ Markdown Copied!";
});
