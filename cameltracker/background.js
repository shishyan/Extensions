chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ cameltracker_alerts: [] });
});
