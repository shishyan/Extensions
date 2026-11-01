chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ ubersuggest_seed: "ai automation" });
});
