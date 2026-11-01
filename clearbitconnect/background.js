chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ clearbitconnect_ready: true });
});
