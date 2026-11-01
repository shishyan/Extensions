chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ rakucash_cleaned_total: 0 });
});
