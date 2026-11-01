/**
 * InstaSaver — Background Service Worker
 * Stores recently inspected social media assets & hashtag sets
 */

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ instaSaverLastTags: ["#ai", "#creators", "#reels", "#growth", "#viral"] });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "INSTASAVER_SAVE_TAGS") {
    chrome.storage.local.set({ instaSaverLastTags: msg.tags || [] }, () => {
      sendResponse({ ok: true });
    });
    return true;
  }
});
