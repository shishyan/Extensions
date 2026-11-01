chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ fakespot_enabled: true });
});
