let lastData = null;

function renderSummary(res) {
  const out = document.getElementById("out");
  const meta = document.getElementById("meta");
  if (!res || !Array.isArray(res.bullets)) {
    lastData = {
      title: "Active Page Summary",
      url: "https://example.com",
      wordCount: 450,
      readMinutes: 2,
      bullets: [
        "Open any article, documentation page, or blog post for instant 1-click executive takeaways.",
        "Click the floating ⚡ TL;DR button on the bottom-right of any webpage to open the slide-out AI research drawer."
      ]
    };
  } else {
    lastData = res;
  }

  meta.innerHTML = `<span>📖 Words: <strong>${(lastData.wordCount || 0).toLocaleString()}</strong></span><span>⏱️ Read Time: <strong>~${lastData.readMinutes || Math.max(1, Math.ceil((lastData.wordCount || 200) / 220))} min</strong></span>`;
  out.innerHTML =
    `<ul>` +
    lastData.bullets.map((b) => `<li>${b.slice(0, 220)}</li>`).join("") +
    `</ul>`;
}

if (chrome.tabs && chrome.tabs.query) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0]) {
      renderSummary(null);
      return;
    }
    chrome.tabs.sendMessage(tabs[0].id, { type: "MERL_SUMMARIZE" }, (res) => {
      if (chrome.runtime.lastError || !res) {
        renderSummary(null);
        return;
      }
      renderSummary(res);
    });
  });
} else {
  renderSummary(null);
}

function buildMarkdown() {
  if (!lastData) return "";
  return (
    `# Summary: ${lastData.title}\nURL: ${lastData.url}\nReading Time: ~${lastData.readMinutes || 1} min (${lastData.wordCount || 0} words)\n\n## Key Takeaways\n` +
    lastData.bullets.map((b) => `- ${b}`).join("\n")
  );
}

document.getElementById("copyBtn").addEventListener("click", () => {
  const md = buildMarkdown();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(md).catch(() => {});
  }
  document.getElementById("copyBtn").textContent = "✅ Copied Markdown!";
});

document.getElementById("dlBtn").addEventListener("click", () => {
  const md = buildMarkdown();
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "merlcopilot-summary.md";
  a.click();
  URL.revokeObjectURL(url);
  document.getElementById("dlBtn").textContent = "✅ Exported!";
});
