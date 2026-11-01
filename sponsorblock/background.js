chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ sponsorblock_enabled: true, sponsorblock_saved_sec: 0, sponsorblock_skipped_count: 0 });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "SPONSORBLOCK_FETCH_SEGMENTS" && msg.videoId) {
    const cats = encodeURIComponent(JSON.stringify(["sponsor", "intro", "outro", "selfpromo", "interaction"]));
    const url = `https://sponsor.ajay.app/api/skipSegments?videoID=${encodeURIComponent(msg.videoId)}&categories=${cats}`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length) {
          const segments = data.map((item) => ({
            category: item.category || "sponsor",
            start: Number(item.segment ? item.segment[0] : 0),
            end: Number(item.segment ? item.segment[1] : 0),
            UUID: item.UUID || ""
          })).filter((s) => s.end > s.start);
          sendResponse({ segments, source: "SponsorBlock Live API" });
        } else {
          sendResponse({ segments: [], source: "No Crowdsourced Segments" });
        }
      })
      .catch(() => {
        sendResponse({ segments: [], source: "Offline Fallback" });
      });
    return true;
  }
});
