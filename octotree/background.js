chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ octotree_open: false });
});
