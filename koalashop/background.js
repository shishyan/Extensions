/**
 * KoalaShop — Background Service Worker
 * Stores inspected D2C store profiles
 */

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ koalaShopReady: true });
});
