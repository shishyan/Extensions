/**
 * RockReach — Background Service Worker
 * Stores mapped executive social graphs & confidence scores
 */

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ rockReachReady: true });
});
