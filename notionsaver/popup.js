let currentMd = `---\ntitle: "Active Article Clip"\ntags: ["notion-clip", "knowledge-base"]\n---\n\n> 💡 **Notion Callout**: Ready to paste directly into any Notion page or Obsidian vault.`;

if (chrome.tabs && chrome.tabs.query) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "NOTION_CLIP_PAGE" }, (res) => {
        if (!chrome.runtime.lastError && res && res.markdown) {
          currentMd = res.markdown;
        }
        document.getElementById("mdOut").textContent = currentMd;
      });
    }
  });
}

document.getElementById("copyBtn").addEventListener("click", () => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(currentMd).catch(() => {});
  }
  document.getElementById("copyBtn").textContent = "✅ Notion Markdown Copied!";
});

document.getElementById("dlBtn").addEventListener("click", () => {
  const blob = new Blob([currentMd], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "notion-clip.md";
  a.click();
  URL.revokeObjectURL(url);
  document.getElementById("dlBtn").textContent = "✅ Exported!";
});
