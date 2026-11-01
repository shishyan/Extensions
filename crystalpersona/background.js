chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ crystalpersona_ready: true });
});
