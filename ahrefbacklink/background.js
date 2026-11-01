chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ ahrefbacklink_ready: true });
});
