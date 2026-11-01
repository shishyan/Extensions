chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ notionsaver_clips: [] });
});
