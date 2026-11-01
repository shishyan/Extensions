let latestItems = [
  { label: "src/index.ts", type: "file" },
  { label: "src/engine/verifier.ts", type: "file" },
  { label: "README.md", type: "file" }
];

function render(items) {
  if (Array.isArray(items) && items.length) latestItems = items;
  document.getElementById("treeBox").innerHTML = latestItems
    .map((it) => `<div class="row">${it.type === "file" ? "📄" : "📑"} <strong>${it.label}</strong></div>`)
    .join("");
}

if (chrome.tabs && chrome.tabs.query) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "OCTOTREE_GET_TREE" }, (res) => {
        if (!chrome.runtime.lastError && res && res.items) render(res.items);
        else render(latestItems);
      });
    } else {
      render(latestItems);
    }
  });
} else {
  render(latestItems);
}

document.getElementById("copyTreeBtn").addEventListener("click", () => {
  const md = `# 🐙 OctoTree Structure\n` + latestItems.map((i) => `- ${i.label}`).join("\n");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(md).catch(() => {});
  }
  document.getElementById("copyTreeBtn").textContent = "✅ Tree Markdown Copied!";
});
