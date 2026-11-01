/**
 * FullCapture — Background Service Worker
 * Captures high-DPI visible tab PNG screenshots via chrome.tabs.captureVisibleTab
 */

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "FULLCAPTURE_SNAP") {
    try {
      chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
        if (chrome.runtime.lastError || !dataUrl) {
          sendResponse({ ok: true, dataUrl: "", fallback: true });
          return;
        }
        chrome.storage.local.set({ fullCaptureLastShot: dataUrl }, () => {
          sendResponse({ ok: true, dataUrl });
        });
      });
    } catch (_) {
      sendResponse({ ok: true, dataUrl: "", fallback: true });
    }
    return true;
  }
});
