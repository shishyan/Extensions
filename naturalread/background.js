/**
 * NaturalRead — Background Service Worker
 * Stores Focus Ruler preferences and RSVP Speed-Reading WPM settings
 */

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ naturalReadWpm: 450, naturalReadRulerActive: false });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "NATURALREAD_SAVE_PREFS") {
    chrome.storage.local.set({ naturalReadWpm: msg.wpm || 450 }, () => {
      sendResponse({ ok: true });
    });
    return true;
  }
});
