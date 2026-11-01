chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'SNAPBUG_CAPTURE') {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      sendResponse({ ok: Boolean(dataUrl), dataUrl });
    });
    return true;
  }
});
