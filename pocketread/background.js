chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["pocketread_queue"], (res) => {
    if (!res.pocketread_queue) {
      chrome.storage.local.set({
        pocketread_queue: [
          {
            title: "Deep Work & Offline Reading Architecture",
            url: "https://gurukuladesam.org/pocketread",
            readMinutes: 3,
            words: 620,
            fullText:
              "PocketRead caches full article text directly in your browser's local storage so you can read distraction-free anytime, even offline without paywalls or tracking."
          }
        ]
      });
    }
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "POCKETREAD_ADD") {
    chrome.storage.local.get(["pocketread_queue"], (res) => {
      const q = res.pocketread_queue || [];
      q.unshift(msg.article);
      chrome.storage.local.set({ pocketread_queue: q.slice(0, 100) }, () => {
        sendResponse({ ok: true, count: q.length, queue: q });
      });
    });
    return true;
  }
});
