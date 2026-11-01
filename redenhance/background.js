/**
 * RedEnhance — Background Service Worker
 * Stores default forum filter preferences
 */

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ redEnhanceFilter: "all" });
});
