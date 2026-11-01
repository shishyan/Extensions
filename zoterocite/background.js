chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    zoterocite_default_style: "APA 7th",
    zoterocite_history: []
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "ZOTEROCITE_SAVE_CITATION") {
    chrome.storage.local.get({ zoterocite_history: [] }, (data) => {
      const history = Array.isArray(data.zoterocite_history) ? data.zoterocite_history : [];
      const next = [msg.entry, ...history.filter(x => x.url !== msg.entry.url)].slice(0, 25);
      chrome.storage.local.set({ zoterocite_history: next }, () => {
        sendResponse({ ok: true, count: next.length });
      });
    });
    return true;
  }
});
