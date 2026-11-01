chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ socialstats_rpm: 4.5 });
});
