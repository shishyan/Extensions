/**
 * LoomRecord — Background Service Worker
 * Stores presenter teleprompter scripts and recording preferences
 */

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    loomScript: "1. Welcome & Executive Problem Statement\n2. Live Product Demo & Architecture\n3. Key Metrics & Next Steps"
  });
});
