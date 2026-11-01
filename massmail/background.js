chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get({ massmailDrafts: {} }, (data) => {
    if (!data.massmailDrafts) {
      chrome.storage.local.set({ massmailDrafts: {} });
    }
  });
});
