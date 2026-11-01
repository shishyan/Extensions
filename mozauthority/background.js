chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ mozauthority_highlight: false });
});
