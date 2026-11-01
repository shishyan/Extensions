/**
 * TagAssistant — Background Service Worker
 * Stores last audited tag & pixel diagnostics
 */

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ tagAssistantReady: true });
});
