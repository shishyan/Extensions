/**
 * KasprLead — Background Service Worker
 * Stores enriched profile notes and outreach templates
 */

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ kasprLeadReady: true });
});
