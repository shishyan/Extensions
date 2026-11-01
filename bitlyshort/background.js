chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    bitlyshort_history: []
  });
});
