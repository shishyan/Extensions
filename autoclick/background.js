chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    autoclick_config: {
      selector: "#qa-action-btn",
      intervalMs: 500,
      refreshSec: 0
    }
  });
});
