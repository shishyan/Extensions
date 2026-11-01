/**
 * AwesomeShot — Background Service Worker
 * Stores annotation state & captures annotated tab screenshots
 */

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ awesomeShotReady: true });
});
