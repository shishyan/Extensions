chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    volmaster_state: { gainPercent: 100, preset: "Flat", bass: 0, mid: 0, treble: 0 }
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "VOLMASTER_SAVE_STATE") {
    chrome.storage.local.set({ volmaster_state: msg.state }, () => {
      sendResponse({ ok: true });
    });
    return true;
  }
});
