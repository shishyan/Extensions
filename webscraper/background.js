chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    webscraper_last_export_count: 0
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "WEBSCRAPER_SAVE_ROWS") {
    chrome.storage.local.set({ webscraper_last_rows: msg.rows || [] }, () => {
      sendResponse({ ok: true });
    });
    return true;
  }
});
