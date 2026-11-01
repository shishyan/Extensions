chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    videospeed_rate: 1.0
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "VIDEOSPEED_SAVE_RATE") {
    chrome.storage.local.set({ videospeed_rate: msg.rate }, () => {
      sendResponse({ ok: true, rate: msg.rate });
    });
    return true;
  }
});
