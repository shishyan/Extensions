chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ semrank_enabled: true });
});
