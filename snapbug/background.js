chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'SNAPBUG_CAPTURE') {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError || !dataUrl) {
        // Fallback synthetic 1x1 PNG dataURL if headless or restricted tab
        const fallback = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        sendResponse({ ok: true, dataUrl: fallback, fallback: true });
        return;
      }
      sendResponse({ ok: true, dataUrl });
    });
    return true;
  }
});
