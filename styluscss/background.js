chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    styluscss_rules: {}
  });
});
