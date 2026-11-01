/**
 * CSSPeeper — Background Service Worker
 * Stores extracted design-system color palettes & CSS tokens
 */

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ cssPeeperReady: true });
});
