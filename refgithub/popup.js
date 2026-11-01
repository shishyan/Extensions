let latestSnippets = ["const agent = new AutonomousVerifier({ zeroErrors: true });"];

function render(res) {
  if (res && Array.isArray(res.snippets) && res.snippets.length) {
    latestSnippets = res.snippets;
    document.getElementById("snipCount").textContent = `📦 Snippets: ${res.snippetCount}`;
    document.getElementById("locCount").textContent = `📏 Total Lines: ${res.totalLines}`;
  } else {
    document.getElementById("snipCount").textContent = `📦 Snippets: ${latestSnippets.length}`;
    document.getElementById("locCount").textContent = `📏 Total Lines: ${latestSnippets.join("\n").split("\n").length}`;
  }
  document.getElementById("codePreview").textContent = latestSnippets.join("\n\n// ---\n\n");
}

if (chrome.tabs && chrome.tabs.query) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "REFGITHUB_SCAN_SNIPPETS" }, (res) => {
        if (!chrome.runtime.lastError && res) render(res);
        else render(null);
      });
    } else {
      render(null);
    }
  });
} else {
  render(null);
}

document.getElementById("harvestBtn").addEventListener("click", () => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(latestSnippets.join("\n\n")).catch(() => {});
  }
  document.getElementById("harvestBtn").textContent = "✅ All Snippets Copied!";
});
