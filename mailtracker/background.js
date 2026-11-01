chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ mailtracker_logs: [] });
});
