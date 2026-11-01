document.addEventListener("DOMContentLoaded", () => {
  const readerEl = document.getElementById("pr-reader");

  function loadQueue() {
    chrome.storage.local.get(["pocketread_queue"], (res) => {
      const q = res.pocketread_queue || [];
      if (!q.length) {
        readerEl.textContent = "Queue is empty.";
        return;
      }
      readerEl.textContent = q
        .map(
          (item, idx) =>
            `[${idx + 1}] ${item.title} (~${item.readMinutes} min · ${item.words} words)\n${item.url}\n\n${item.fullText}`
        )
        .join("\n\n====================\n\n");
    });
  }

  loadQueue();

  document.getElementById("pr-save").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "POCKETREAD_SAVE_NOW" }, () => {
          setTimeout(loadQueue, 150);
        });
      }
    });
  });

  document.getElementById("pr-theme").addEventListener("click", () => {
    document.body.classList.toggle("sepia");
  });
});
