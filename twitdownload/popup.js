let currentThread = {
  title: "Social Thread Digest",
  url: "https://x.com",
  postCount: 2,
  mediaUrls: [],
  markdown: "# 🧵 Unrolled Thread\n\n### Post 1\nOpen any X/Twitter, Reddit, or social post to unroll threads into clean Markdown and extract original-resolution media!"
};

function renderThread(data) {
  if (data && data.markdown) currentThread = data;
  document.getElementById("postCount").textContent = `📝 Posts: ${currentThread.postCount || 0}`;
  document.getElementById("mediaCount").textContent = `🖼️ Media Assets: ${(currentThread.mediaUrls || []).length}`;
  document.getElementById("previewBox").textContent = currentThread.markdown;
}

if (chrome.tabs && chrome.tabs.query) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "TWIT_EXTRACT_THREAD" }, (res) => {
        if (!chrome.runtime.lastError && res) {
          renderThread(res);
        } else {
          renderThread(currentThread);
        }
      });
    } else {
      renderThread(currentThread);
    }
  });
} else {
  renderThread(currentThread);
}

document.getElementById("copyThreadBtn").addEventListener("click", () => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(currentThread.markdown).catch(() => {});
  }
  document.getElementById("copyThreadBtn").textContent = "✅ Thread Copied!";
});

document.getElementById("dlThreadBtn").addEventListener("click", () => {
  const blob = new Blob([currentThread.markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "unrolled-thread.md";
  a.click();
  URL.revokeObjectURL(url);
  document.getElementById("dlThreadBtn").textContent = "✅ Exported!";
});
