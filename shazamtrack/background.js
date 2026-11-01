chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    shazamtrack_history: []
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "SHAZAMTRACK_SAVE_TRACK") {
    chrome.storage.local.get({ shazamtrack_history: [] }, (data) => {
      const prev = Array.isArray(data.shazamtrack_history) ? data.shazamtrack_history : [];
      const next = [msg.track, ...prev.filter(t => t.title !== msg.track.title)].slice(0, 25);
      chrome.storage.local.set({ shazamtrack_history: next }, () => {
        sendResponse({ ok: true, count: next.length });
      });
    });
    return true;
  }
});
