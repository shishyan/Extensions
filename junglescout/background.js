/**
 * JungleScout — Background Service Worker
 * BSR-to-Monthly-Sales formula + Opportunity Score (1–10)
 */

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ jungleScoutDefaultFeePct: 15 });
});
