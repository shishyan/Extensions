chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ ubersuggest_enabled: true });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "FETCH_AUTOCOMPLETE" && msg.seed) {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(msg.seed)}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data && data[1]) ? data[1] : [];
        sendResponse({ suggestions: list });
      })
      .catch(() => sendResponse({ suggestions: [] }));
    return true;
  }
});
