/**
 * LushaContact — Background Service Worker
 * Stores recently extracted direct-dial contacts
 */

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ lushaContactReady: true });
});
