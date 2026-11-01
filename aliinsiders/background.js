chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ aliinsiders_markup: 3.0 });
});
