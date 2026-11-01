/**
 * StreamChat — Background Service Worker
 * Stores spam-filter & theater mode preferences
 */

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ streamChatSpamFilter: true, streamChatCinema: false });
});
