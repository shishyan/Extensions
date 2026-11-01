chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ jsonviewer_ready: true });
});
