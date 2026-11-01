chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    imagebatch_min_width: 0
  });
});
