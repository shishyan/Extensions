chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ returnlikes_enabled: true });
});
