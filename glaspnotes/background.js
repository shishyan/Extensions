chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["glaspnotes_items"], (res) => {
    if (!Array.isArray(res.glaspnotes_items)) {
      chrome.storage.local.set({ glaspnotes_items: [] });
    }
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "GLASP_SAVE_HIGHLIGHT") {
    chrome.storage.local.get(["glaspnotes_items"], (res) => {
      const list = Array.isArray(res.glaspnotes_items) ? res.glaspnotes_items : [];
      list.unshift(msg.item);
      chrome.storage.local.set({ glaspnotes_items: list }, () => {
        sendResponse({ ok: true, items: list });
      });
    });
    return true;
  }
  if (msg && msg.type === "GLASP_GET_ALL") {
    chrome.storage.local.get(["glaspnotes_items"], (res) => {
      sendResponse({ items: Array.isArray(res.glaspnotes_items) ? res.glaspnotes_items : [] });
    });
    return true;
  }
});
