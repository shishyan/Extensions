chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    eightysummary_mode: "concise",
    eightysummary_count: 0
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "EIGHTY_INCREMENT_COUNT") {
    chrome.storage.local.get(["eightysummary_count"], (res) => {
      const next = (res.eightysummary_count || 0) + 1;
      chrome.storage.local.set({ eightysummary_count: next }, () => {
        sendResponse({ ok: true, count: next });
      });
    });
    return true;
  }
});
