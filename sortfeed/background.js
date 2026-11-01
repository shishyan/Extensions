/**
 * SortFeed — Background Service Worker
 * Stores last sorted feed leaderboard
 */

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ sortFeedCriteria: "views" });
});
