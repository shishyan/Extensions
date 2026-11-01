chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["everclipper_clips"], (res) => {
    if (!res.everclipper_clips) {
      chrome.storage.local.set({
        everclipper_clips: [
          {
            id: "seed-1",
            title: "Welcome to EverClipper Offline Studio",
            url: "https://gurukuladesam.org/everclipper",
            notebook: "Research",
            mode: "Simplified Article",
            excerpt: "Clean, ad-free web clipping into local notebooks with 1-click Markdown and HTML export.",
            timestamp: new Date().toISOString()
          }
        ]
      });
    }
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "EVERCLIPPER_SAVE_CLIP") {
    chrome.storage.local.get(["everclipper_clips"], (res) => {
      const clips = res.everclipper_clips || [];
      clips.unshift(msg.clip);
      chrome.storage.local.set({ everclipper_clips: clips.slice(0, 100) }, () => {
        sendResponse({ ok: true, count: clips.length, clips });
      });
    });
    return true;
  }
});
