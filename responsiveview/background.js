chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    responsiveview_preset: { name: "Desktop Full", width: 1440, height: 900 }
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "RESPONSIVEVIEW_GET_PRESET") {
    chrome.storage.local.get(["responsiveview_preset"], (res) => {
      sendResponse({
        ok: true,
        preset: res.responsiveview_preset || { name: "Desktop Full", width: 1440, height: 900 }
      });
    });
    return true;
  }
});
