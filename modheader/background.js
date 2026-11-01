/**
 * ModHeader — Background Service Worker
 * Stores multi-environment HTTP request/response header profiles
 */

const DEFAULT_HEADERS = [
  { name: "Authorization", value: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9", enabled: true },
  { name: "X-API-Environment", value: "staging-us-east-1", enabled: true },
  { name: "X-Forwarded-For", value: "203.0.113.42", enabled: true }
];

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["modHeaderProfiles"], (res) => {
    if (!Array.isArray(res.modHeaderProfiles) || res.modHeaderProfiles.length === 0) {
      chrome.storage.local.set({ modHeaderProfiles: DEFAULT_HEADERS });
    }
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "MODHEADER_GET") {
    chrome.storage.local.get(["modHeaderProfiles"], (res) => {
      sendResponse({
        ok: true,
        headers: Array.isArray(res.modHeaderProfiles) && res.modHeaderProfiles.length ? res.modHeaderProfiles : DEFAULT_HEADERS
      });
    });
    return true;
  }

  if (msg && msg.type === "MODHEADER_SAVE") {
    chrome.storage.local.set({ modHeaderProfiles: msg.headers || DEFAULT_HEADERS }, () => {
      sendResponse({ ok: true });
    });
    return true;
  }
});
