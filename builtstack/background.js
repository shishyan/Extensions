/**
 * BuiltStack — Background Service Worker
 * Stores recently fingerprinted website technology profiles
 */

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ builtStackHistory: [] });
});
