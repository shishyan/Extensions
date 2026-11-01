chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ returnlikes_enabled: true });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "RETURNLIKES_FETCH_API" && msg.videoId) {
    fetch(`https://returnyoutubedislikeapi.com/votes?videoId=${encodeURIComponent(msg.videoId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => sendResponse({ data }))
      .catch(() => sendResponse({ data: null }));
    return true;
  }
});
