chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ twitdownload_saved: [] });
});
