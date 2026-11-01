chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ boomerangmail_inbox_paused: false });
});
