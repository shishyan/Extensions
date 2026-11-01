/**
 * HeliumSeller — Background Service Worker
 * Stores Xray scan snapshots and extracted backend search terms
 */

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ heliumSellerReady: true });
});
