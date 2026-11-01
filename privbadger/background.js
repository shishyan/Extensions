chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    privbadger_total_cleaned: 0
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "PRIVBADGER_RECORD") {
    chrome.storage.local.get(["privbadger_total_cleaned"], (res) => {
      const next = (res.privbadger_total_cleaned || 0) + (msg.cleaned || 0);
      chrome.storage.local.set({ privbadger_total_cleaned: next }, () => {
        sendResponse({ ok: true, totalCleaned: next });
      });
    });
    return true;
  }
});
