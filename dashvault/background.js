chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get({ dashvaultRecords: [], dashvaultSalt: null }, (data) => {
    if (!data.dashvaultRecords) {
      chrome.storage.local.set({ dashvaultRecords: [] });
    }
  });
});
