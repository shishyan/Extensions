chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ similarweb_ready: true });
});
