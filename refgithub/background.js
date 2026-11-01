chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ refgithub_ready: true });
});
