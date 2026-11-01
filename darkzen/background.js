chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get({ darkzenSites: {}, darkzenDefault: null }, (data) => {
    if (!data.darkzenSites) {
      chrome.storage.local.set({ darkzenSites: {} });
    }
  });
});
