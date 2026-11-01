chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["rainbookmark_items"], (res) => {
    if (!res.rainbookmark_items) {
      chrome.storage.local.set({
        rainbookmark_items: [
          {
            title: "GurukulaDesam Open-Source Extensions",
            url: "https://gurukuladesam.org/extensions",
            tags: ["#opensource", "#browser", "#productivity", "#privacy"],
            createdAt: Math.floor(Date.now() / 1000)
          }
        ]
      });
    }
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "RAINBOOKMARK_SAVE") {
    chrome.storage.local.get(["rainbookmark_items"], (res) => {
      const items = res.rainbookmark_items || [];
      const duplicate = items.some((b) => b.url === msg.bookmark.url);
      if (!duplicate) {
        items.unshift(msg.bookmark);
      }
      chrome.storage.local.set({ rainbookmark_items: items }, () => {
        sendResponse({ ok: true, duplicate, count: items.length, items });
      });
    });
    return true;
  }
});
