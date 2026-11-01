let currentItems = [];
const threadBox = document.getElementById("threadBox");
const fBtns = Array.from(document.querySelectorAll(".f-btn"));

function applyFilter(filter) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    if (!tab || !tab.id) return;
    chrome.tabs.sendMessage(tab.id, { type: "REDENHANCE_FILTER", filter }, (res) => {
      if (!chrome.runtime.lastError && res && res.ok) {
        currentItems = res.items || [];
        if (!currentItems.length) {
          threadBox.textContent = `No comments matched filter "${filter}". Try "All".`;
        } else {
          threadBox.textContent = currentItems.map((it, i) => `${i + 1}. ${it.text}`).join("\n\n");
        }
      } else {
        threadBox.textContent = "Ready — Open any Reddit, HackerNews, GitHub, or forum discussion thread.";
      }
    });
  });
}

fBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    fBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    applyFilter(btn.getAttribute("data-f") || "signal");
  });
});

document.getElementById("exportMdBtn").addEventListener("click", () => {
  const md = ["# 🛡️ RedEnhance — High-Signal Thread Digest", ...currentItems.map((it) => `- ${it.text}`)].join("\n");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(md).catch(() => {});
  }
  document.getElementById("exportMdBtn").textContent = "✅ Copied Markdown Digest!";
});

applyFilter("signal");
