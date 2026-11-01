chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    printclean_settings: {
      fontScale: 100,
      strippedCount: 0
    }
  });
});
