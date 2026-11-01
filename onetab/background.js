chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ onetab_saved_tabs: [] });
});
